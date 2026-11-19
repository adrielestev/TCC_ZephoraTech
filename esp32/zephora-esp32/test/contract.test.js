'use strict';
// Teste de CONTRATO: o código C++ real do firmware (payload e tratamento de resposta) conversando
// com a API REAL do backend, em processo, com banco em memória.
//   BACKEND_DIR=/caminho/zephora-backend  scripts/run_tests.sh   (compila .build/contract_tool)
//   BACKEND_DIR=/caminho/zephora-backend  node --test test/contract.test.js
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const BACKEND = path.resolve(process.env.BACKEND_DIR || path.join(__dirname, '..', '..', 'zephora-backend'));
const TOOL = path.join(__dirname, '..', '.build', 'contract_tool');

process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'zephora-fw-'));
process.env.JWT_SECRET = 'a'.repeat(48);
process.env.CODE_HMAC_SECRET = 'b'.repeat(48);
process.env.BCRYPT_COST = '4';
process.env.RATE_LIMIT_ENABLED = 'false';
process.env.ESP32_POLL_INTERVAL_MS = '1000';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require(path.join(BACKEND, 'src', 'app'));
const { seedOwner } = require(path.join(BACKEND, 'src', 'database', 'seed-owner'));

const OWNER = { name: 'Dona', email: 'dona@escola.com', password: 'Senha-forte-123' };
// Mesmo formato que o firmware gera: 32 bytes aleatórios em hexadecimal
const CREDENTIAL = crypto.randomBytes(32).toString('hex');

let server, base, token, roomId, esp32Id, devices;

const api = async (method, url, { body, headers = {} } = {}) => {
  const init = { method, headers: { ...headers } };
  if (token && !headers['x-esp32-credential']) init.headers.authorization = `Bearer ${token}`;
  if (body !== undefined) { init.headers['content-type'] = 'application/json'; init.body = JSON.stringify(body); }
  const res = await fetch(base + url, init);
  const text = await res.text();
  return { status: res.status, text, body: text ? JSON.parse(text) : null };
};

const firmwarePayload = (mode = '') => {
  const r = spawnSync(TOOL, ['payload', mode].filter(Boolean), { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout;
};
const firmwareHandles = (responseText) => {
  const r = spawnSync(TOOL, ['respond'], { input: responseText, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
};
const sync = async (payload, credential = CREDENTIAL) => {
  const res = await fetch(base + '/api/device-sync', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-esp32-credential': credential },
    body: payload,
  });
  return { status: res.status, text: await res.text() };
};

describe('firmware (C++) x API real', () => {
  before(async () => {
    assert.ok(fs.existsSync(TOOL), 'compile antes: scripts/run_tests.sh');
    await seedOwner(OWNER);
    server = createApp().listen(0);
    base = `http://127.0.0.1:${server.address().port}`;
    token = (await api('POST', '/api/auth/login', { body: { email: OWNER.email, password: OWNER.password } })).body.token;
    roomId = (await api('POST', '/api/rooms', { body: { name: 'Sala 101' } })).body.id;
  });
  after(() => server.close());

  it('antes de o admin cadastrar a credencial, a API responde 401 (o firmware recua e tenta de novo)', async () => {
    const res = await sync(firmwarePayload());
    assert.equal(res.status, 401);
  });

  it('a credencial gerada no formato do firmware é aceita no cadastro (passo 1)', async () => {
    const res = await api('POST', '/api/esp32', { body: { credential: CREDENTIAL, name: 'ESP Sala 101' } });
    assert.equal(res.status, 201);
    assert.equal(res.body.status, 'pending');
    esp32Id = res.body.id;
  });

  it('o payload do firmware é aceito, o módulo fica online e os aparelhos são descobertos (passo 2)', async () => {
    const res = await sync(firmwarePayload());
    assert.equal(res.status, 200);
    const handled = firmwareHandles(res.text);
    assert.deepEqual([handled.valid, handled.applied, handled.rejected, handled.poll], [true, 0, 0, 1000]);

    const detail = await api('GET', `/api/esp32/${esp32Id}`);
    assert.equal(detail.body.status, 'online');
    assert.equal(detail.body.firmwareVersion, '1.0.0');
    assert.equal(detail.body.discoveredDevices, 2);
    devices = Object.fromEntries(detail.body.devices.map((d) => [d.channel, d.id]));
    assert.deepEqual(Object.keys(devices).sort(), ['pir_1', 'relay_1']);
  });

  it('o admin escolhe os aparelhos (passo 3) e o comando do app chega ao firmware, que o aplica', async () => {
    const reg = await api('POST', `/api/esp32/${esp32Id}/devices`, {
      body: { devices: [{ deviceId: devices.relay_1, roomId }, { deviceId: devices.pir_1, roomId }] },
    });
    assert.equal(reg.status, 200);

    assert.equal((await api('PUT', `/api/devices/${devices.relay_1}/state`, { body: { state: { on: true } } })).status, 200);

    const res = await sync(firmwarePayload()); // firmware ainda com a luz desligada
    assert.equal(res.status, 200);
    assert.deepEqual(JSON.parse(res.text).commands, [{ channel: 'relay_1', state: { on: true } }]);
    const handled = firmwareHandles(res.text);
    assert.equal(handled.applied, 1);
    assert.equal(handled.on, true); // o canal do firmware foi ligado

    // Depois de aplicar, o firmware reporta on:true e o servidor para de mandar o comando
    const confirm = await sync(firmwarePayload('on'));
    assert.deepEqual(JSON.parse(confirm.text).commands, []);
    const list = await api('GET', `/api/devices?roomId=${roomId}`);
    assert.equal(list.body.data.find((d) => d.channel === 'relay_1').currentState.on, true);
  });

  it('automação: presença reportada pelo firmware liga a luz (comando volta na mesma resposta)', async () => {
    await api('PUT', `/api/devices/${devices.relay_1}/state`, { body: { state: { on: false } } });
    await sync(firmwarePayload()); // luz desligada confirmada
    const created = await api('POST', '/api/automations', {
      body: {
        roomId, name: 'Acender ao detectar movimento',
        triggers: [{ deviceId: devices.pir_1, condition: { presence: true } }],
        actions: [{ deviceId: devices.relay_1, state: { on: true } }],
      },
    });
    assert.equal(created.status, 201);

    const res = await sync(firmwarePayload('presence'));
    assert.equal(res.status, 200);
    const handled = firmwareHandles(res.text);
    assert.equal(handled.applied, 1);
    assert.equal(handled.on, true);
  });

  it('o firmware descarta comandos suspeitos que uma API comprometida poderia enviar', () => {
    const evil = JSON.stringify({ pollIntervalMs: 1, commands: [
      { channel: 'pir_1', state: { presence: true } }, { channel: 'x', state: { on: true } }, { channel: 'relay_1', state: { on: 1 } },
    ] });
    const handled = firmwareHandles(evil);
    assert.deepEqual([handled.applied, handled.rejected, handled.on, handled.poll], [0, 3, false, 1000]);
  });

  it('credencial de outro módulo e payload inválido são recusados', async () => {
    assert.equal((await sync(firmwarePayload(), crypto.randomBytes(32).toString('hex'))).status, 401);
    assert.equal((await sync('{"devices":[{"channel":"rele 1","type":"light"}]}')).status, 400);
  });
});
