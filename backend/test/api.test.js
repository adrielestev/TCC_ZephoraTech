'use strict';

// Ambiente isolado: banco em memória, uploads em diretório temporário
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'zephora-uploads-'));
process.env.JWT_SECRET = 'a'.repeat(48);
process.env.CODE_HMAC_SECRET = 'b'.repeat(48);
process.env.BCRYPT_COST = '4';
process.env.RATE_LIMIT_ENABLED = 'false';
process.env.CODE_RESEND_COOLDOWN_SECONDS = '0';
process.env.ESP32_POLL_INTERVAL_MS = '1000';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const { seedOwner } = require('../src/database/seed-owner');
const { db } = require('../src/database/db');
const { toSql } = require('../src/shared/time');
const { outbox } = require('../src/shared/mailer');

let server;
let base;

const api = async (method, url, { token, body, headers = {}, form } = {}) => {
  const init = { method, headers: { ...headers } };
  if (token) init.headers.authorization = `Bearer ${token}`;
  if (form) init.body = form;
  else if (body !== undefined) {
    init.headers['content-type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const res = await fetch(base + url, init);
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function codeSentTo(email) {
  for (let i = 0; i < 100; i += 1) {
    const message = [...outbox].reverse().find((m) => m.to === email);
    if (message) return /\b(\d{6})\b/.exec(message.text)[1];
    await sleep(20);
  }
  throw new Error(`nenhum e-mail enviado para ${email}`);
}
// Com cooldown 0 cada cadastro/login emite um código novo: sempre usar o mais recente
const latestCode = async (email) => {
  await sleep(80);
  return codeSentTo(email);
};
const requestCode = async (email, fn) => {
  outbox.length = 0;
  await fn();
  return codeSentTo(email);
};

const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(32),
]);
const imageForm = (field, bytes, type = 'image/png') => {
  const form = new FormData();
  form.append(field, new Blob([bytes], { type }), 'foto.bin');
  return form;
};

const OWNER = { name: 'Dona Escola', email: 'owner@escola.com', password: 'senha-do-owner-1' };
const ALUNO = { name: 'Aluno Teste', email: 'Aluno@Escola.com', password: 'senha-do-aluno-1' };
const ALUNO_EMAIL = 'aluno@escola.com';
const CREDENTIAL = crypto.randomBytes(32).toString('hex');

const state = {};

describe('API Zephora', () => {
  before(async () => {
    await seedOwner({ ...OWNER, email: OWNER.email });
    server = createApp().listen(0);
    base = `http://127.0.0.1:${server.address().port}`;
  });
  after(() => server.close());

  it('health e rota inexistente', async () => {
    assert.equal((await api('GET', '/health')).status, 200);
    assert.equal((await api('GET', '/api/nada')).status, 404);
  });

  describe('autenticação', () => {
    it('cadastro devolve resposta genérica e exige verificação de e-mail', async () => {
      const res = await api('POST', '/api/auth/register', { body: ALUNO });
      assert.equal(res.status, 202);

      // cadastro repetido não revela que o e-mail existe
      const again = await api('POST', '/api/auth/register', { body: ALUNO });
      assert.equal(again.status, 202);

      const login = await api('POST', '/api/auth/login', {
        body: { email: ALUNO_EMAIL, password: ALUNO.password },
      });
      assert.equal(login.status, 403);
      assert.equal(login.body.error.code, 'EMAIL_NOT_VERIFIED');
    });

    it('rejeita campos extras e senha fraca', async () => {
      const extra = await api('POST', '/api/auth/register', { body: { ...ALUNO, role: 'owner' } });
      assert.equal(extra.status, 400);
      const weak = await api('POST', '/api/auth/register', {
        body: { ...ALUNO, email: 'x@y.com', password: '123' },
      });
      assert.equal(weak.status, 400);
    });

    it('verifica e-mail com o código (erro conta tentativa, acerto vale uma vez)', async () => {
      const code = await latestCode(ALUNO_EMAIL);
      const wrong = code === '000000' ? '111111' : '000000';
      const bad = await api('POST', '/api/auth/verify-email', {
        body: { email: ALUNO_EMAIL, code: wrong },
      });
      assert.equal(bad.status, 400);
      const ok = await api('POST', '/api/auth/verify-email', {
        body: { email: ALUNO_EMAIL, code },
      });
      assert.equal(ok.status, 200);
      const reuse = await api('POST', '/api/auth/verify-email', {
        body: { email: ALUNO_EMAIL, code },
      });
      assert.equal(reuse.status, 400);
    });

    it('login com senha errada falha; correto devolve token', async () => {
      const bad = await api('POST', '/api/auth/login', {
        body: { email: ALUNO_EMAIL, password: 'errada-123' },
      });
      assert.equal(bad.status, 401);
      const ok = await api('POST', '/api/auth/login', {
        body: { email: ALUNO_EMAIL, password: ALUNO.password },
      });
      assert.equal(ok.status, 200);
      state.aluno = ok.body;
      assert.equal(ok.body.user.role, 'member');
      assert.equal(ok.body.user.password_hash, undefined);

      const owner = await api('POST', '/api/auth/login', {
        body: { email: OWNER.email, password: OWNER.password },
      });
      state.ownerToken = owner.body.token;
      assert.equal(owner.body.user.role, 'owner');

      assert.equal((await api('GET', '/api/auth/me')).status, 401);
      assert.equal((await api('GET', '/api/auth/me', { token: 'lixo' })).status, 401);
    });

    it('bloqueia o código após o limite de tentativas erradas', async () => {
      const code = await requestCode(ALUNO_EMAIL, () =>
        api('POST', '/api/auth/forgot-password', { body: { email: ALUNO_EMAIL } }),
      );
      const wrong = code === '123456' ? '654321' : '123456';
      for (let i = 0; i < 5; i += 1) {
        await api('POST', '/api/auth/reset-password', {
          body: { email: ALUNO_EMAIL, code: wrong, newPassword: 'nova-senha-123' },
        });
      }
      const blocked = await api('POST', '/api/auth/reset-password', {
        body: { email: ALUNO_EMAIL, code, newPassword: 'nova-senha-123' },
      });
      assert.equal(blocked.status, 400);
    });

    it('redefine a senha com código e invalida o token antigo', async () => {
      const code = await requestCode(ALUNO_EMAIL, () =>
        api('POST', '/api/auth/forgot-password', { body: { email: ALUNO_EMAIL } }),
      );
      const unknown = await api('POST', '/api/auth/forgot-password', {
        body: { email: 'ninguem@escola.com' },
      });
      assert.equal(unknown.status, 200); // mesma resposta para e-mail inexistente

      const reset = await api('POST', '/api/auth/reset-password', {
        body: { email: ALUNO_EMAIL, code, newPassword: 'nova-senha-123' },
      });
      assert.equal(reset.status, 200);
      assert.equal((await api('GET', '/api/auth/me', { token: state.aluno.token })).status, 401);

      const login = await api('POST', '/api/auth/login', {
        body: { email: ALUNO_EMAIL, password: 'nova-senha-123' },
      });
      assert.equal(login.status, 200);
      state.aluno = login.body;
    });
  });

  describe('permissões, salas e fotos', () => {
    it('usuário comum não gerencia salas, aparelhos nem usuários', async () => {
      const t = state.aluno.token;
      assert.equal(
        (await api('POST', '/api/rooms', { token: t, body: { name: 'Sala X' } })).status,
        403,
      );
      assert.equal((await api('GET', '/api/users', { token: t })).status, 403);
      assert.equal((await api('GET', '/api/esp32', { token: t })).status, 403);
    });

    it('admin cria sala, envia foto válida e rejeita arquivo falso', async () => {
      const room = await api('POST', '/api/rooms', {
        token: state.ownerToken,
        body: { name: 'Sala 101', description: 'Térreo' },
      });
      assert.equal(room.status, 201);
      state.roomId = room.body.id;
      const dup = await api('POST', '/api/rooms', {
        token: state.ownerToken,
        body: { name: 'sala 101' },
      });
      assert.equal(dup.status, 409);

      const photo = await api('PUT', `/api/rooms/${state.roomId}/photos/1`, {
        token: state.ownerToken,
        form: imageForm('photo', PNG),
      });
      assert.equal(photo.status, 200);
      assert.equal(photo.body.photos.length, 1);
      const img = await fetch(photo.body.photos[0].url.replace(/^https?:\/\/[^/]+/, base));
      assert.equal(img.status, 200);

      const fake = await api('PUT', `/api/rooms/${state.roomId}/photos/2`, {
        token: state.ownerToken,
        form: imageForm('photo', Buffer.from('<svg onload=alert(1)>'), 'image/png'),
      });
      assert.equal(fake.status, 400);
      const slot = await api('PUT', `/api/rooms/${state.roomId}/photos/4`, {
        token: state.ownerToken,
        form: imageForm('photo', PNG),
      });
      assert.equal(slot.status, 400);
    });

    it('foto de perfil', async () => {
      const res = await api('PUT', '/api/users/me/avatar', {
        token: state.aluno.token,
        form: imageForm('avatar', PNG),
      });
      assert.equal(res.status, 200);
      assert.ok(res.body.avatarUrl);
    });

    it('sala sem permissão é invisível ao usuário comum; acesso concedido a várias salas', async () => {
      const t = state.aluno.token;
      assert.equal((await api('GET', `/api/rooms/${state.roomId}`, { token: t })).status, 404);
      assert.deepEqual((await api('GET', '/api/rooms', { token: t })).body.data, []);

      const room2 = await api('POST', '/api/rooms', {
        token: state.ownerToken,
        body: { name: 'Sala 102' },
      });
      state.room2Id = room2.body.id;
      const grant = await api('PUT', `/api/users/${state.aluno.user.id}/rooms`, {
        token: state.ownerToken,
        body: { roomIds: [state.roomId, state.room2Id] },
      });
      assert.deepEqual(grant.body.roomIds, [state.roomId, state.room2Id]);
      assert.equal((await api('GET', `/api/rooms/${state.roomId}`, { token: t })).status, 200);
      assert.equal((await api('GET', '/api/rooms', { token: t })).body.data.length, 2);

      const revoke = await api('PUT', `/api/users/${state.aluno.user.id}/rooms`, {
        token: state.ownerToken,
        body: { roomIds: [state.roomId] },
      });
      assert.deepEqual(revoke.body.roomIds, [state.roomId]);
    });
  });

  describe('fluxo ESP32, aparelhos e automações', () => {
    it('cadastro de ESP32: credencial inválida, duplicada e pendente', async () => {
      const t = state.ownerToken;
      assert.equal(
        (await api('POST', '/api/esp32', { token: t, body: { credential: 'curta' } })).status,
        400,
      );
      const ok = await api('POST', '/api/esp32', {
        token: t,
        body: { credential: CREDENTIAL, name: 'ESP Sala 101' },
      });
      assert.equal(ok.status, 201);
      assert.equal(ok.body.status, 'pending');
      assert.equal(JSON.stringify(ok.body).includes(CREDENTIAL), false); // nunca devolve a credencial
      state.esp32Id = ok.body.id;
      assert.equal(
        (await api('POST', '/api/esp32', { token: t, body: { credential: CREDENTIAL } })).status,
        409,
      );

      const early = await api('POST', `/api/esp32/${state.esp32Id}/devices`, {
        token: t,
        body: { devices: [{ deviceId: 1, roomId: state.roomId }] },
      });
      assert.equal(early.status, 409);
      assert.equal(early.body.error.code, 'ESP32_NOT_OPERATIONAL');
    });

    it('sync exige credencial válida', async () => {
      const body = { devices: [] };
      assert.equal((await api('POST', '/api/device-sync', { body })).status, 401);
      const wrong = await api('POST', '/api/device-sync', {
        body,
        headers: { 'x-esp32-credential': crypto.randomBytes(32).toString('hex') },
      });
      assert.equal(wrong.status, 401);
      // JWT de usuário não autentica ESP32
      assert.equal(
        (await api('POST', '/api/device-sync', { body, token: state.ownerToken })).status,
        401,
      );
    });

    const sync = (devices, firmware = '1.0.0') =>
      api('POST', '/api/device-sync', {
        body: { firmware, devices },
        headers: { 'x-esp32-credential': CREDENTIAL },
      });

    it('primeira sincronização torna o ESP32 operacional e lista aparelhos descobertos', async () => {
      const res = await sync([
        { channel: 'relay_1', type: 'light', name: 'Luz do quadro', state: { on: false } },
        { channel: 'relay_2', type: 'light', name: 'Luz do fundo', state: { on: false } },
        { channel: 'pir_1', type: 'presence_sensor', name: 'Presença', state: { presence: false } },
      ]);
      assert.equal(res.status, 200);
      assert.deepEqual(res.body.commands, []);

      const detail = await api('GET', `/api/esp32/${state.esp32Id}`, { token: state.ownerToken });
      assert.equal(detail.body.status, 'online');
      assert.equal(detail.body.discoveredDevices, 3);
      state.devices = Object.fromEntries(detail.body.devices.map((d) => [d.channel, d.id]));
    });

    it('status do ESP32 é derivado de last_seen_at (online → offline → online)', async () => {
      const t = state.ownerToken;
      const status = async () =>
        (await api('GET', `/api/esp32/${state.esp32Id}`, { token: t })).body.status;

      assert.equal(await status(), 'online');
      db.prepare('UPDATE esp32_modules SET last_seen_at = ? WHERE id = ?').run(
        toSql(new Date(Date.now() - 10 * 60 * 1000)),
        state.esp32Id,
      );
      assert.equal(await status(), 'offline');

      // Uma nova sincronização volta a marcá-lo como online
      const res = await sync([
        { channel: 'relay_1', type: 'light', name: 'Luz do quadro', state: { on: false } },
      ]);
      assert.equal(res.status, 200);
      assert.equal(await status(), 'online');
    });

    it('admin cadastra apenas alguns aparelhos (validando a sala)', async () => {
      const t = state.ownerToken;
      const badRoom = await api('POST', `/api/esp32/${state.esp32Id}/devices`, {
        token: t,
        body: { devices: [{ deviceId: state.devices.relay_1, roomId: 9999 }] },
      });
      assert.equal(badRoom.status, 404);

      const ok = await api('POST', `/api/esp32/${state.esp32Id}/devices`, {
        token: t,
        body: {
          devices: [
            { deviceId: state.devices.relay_1, roomId: state.roomId, name: 'Luz principal' },
            { deviceId: state.devices.pir_1, roomId: state.roomId },
          ],
        },
      });
      assert.equal(ok.status, 200);
      assert.equal(ok.body.registeredDevices, 2);
      assert.equal(ok.body.discoveredDevices, 1);

      const again = await api('POST', `/api/esp32/${state.esp32Id}/devices`, {
        token: t,
        body: { devices: [{ deviceId: state.devices.relay_1, roomId: state.roomId }] },
      });
      assert.equal(again.status, 409);
    });

    it('usuário comum com acesso altera o estado; sem acesso não enxerga; sensor não é controlável', async () => {
      const t = state.aluno.token;
      const on = await api('PUT', `/api/devices/${state.devices.relay_1}/state`, {
        token: t,
        body: { state: { on: true } },
      });
      assert.equal(on.status, 200);
      assert.deepEqual(on.body.desiredState, { on: true });

      assert.equal(
        (
          await api('PUT', `/api/devices/${state.devices.relay_1}/state`, {
            token: t,
            body: { state: { on: 'sim' } },
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await api('PUT', `/api/devices/${state.devices.pir_1}/state`, {
            token: t,
            body: { state: { presence: true } },
          })
        ).status,
        400,
      );
      const list = await api('GET', `/api/devices?roomId=${state.roomId}`, { token: t });
      assert.equal(list.body.data.length, 2);
      assert.equal(
        (await api('GET', `/api/devices?roomId=${state.room2Id}`, { token: t })).status,
        404,
      );
    });

    it('configuração de execução é individual e chega na sincronização', async () => {
      const invalid = await api('PATCH', `/api/devices/${state.devices.pir_1}`, {
        token: state.ownerToken,
        body: { executionConfig: { holdMs: -1, warmupMs: 45000 } },
      });
      assert.equal(invalid.status, 400);

      const updated = await api('PATCH', `/api/devices/${state.devices.pir_1}`, {
        token: state.ownerToken,
        body: { executionConfig: { holdMs: 12000, warmupMs: 30000 } },
      });
      assert.equal(updated.status, 200);
      assert.deepEqual(updated.body.executionConfig, { holdMs: 12000, warmupMs: 30000 });

      const res = await sync([
        { channel: 'relay_1', type: 'light', state: { on: false } },
        { channel: 'pir_1', type: 'presence_sensor', state: { presence: false } },
      ]);
      assert.deepEqual(res.body.executions, [
        { channel: 'pir_1', executionConfig: { holdMs: 12000, warmupMs: 30000 } },
      ]);
    });

    it('ESP32 recebe o comando no polling e confirma o estado', async () => {
      const res = await sync([
        { channel: 'relay_1', type: 'light', state: { on: false } },
        { channel: 'pir_1', type: 'presence_sensor', state: { presence: false } },
      ]);
      assert.deepEqual(res.body.commands, [{ channel: 'relay_1', state: { on: true } }]);

      const applied = await sync([
        { channel: 'relay_1', type: 'light', state: { on: true } },
        { channel: 'pir_1', type: 'presence_sensor', state: { presence: false } },
      ]);
      assert.deepEqual(applied.body.commands, []);
    });

    it('admin cria automação (validações) e usuário comum pausa/retoma', async () => {
      const t = state.ownerToken;
      const payload = (over = {}) => ({
        roomId: state.roomId,
        name: 'Acender luz ao detectar movimento',
        triggers: [{ deviceId: state.devices.pir_1, condition: { presence: true } }],
        actions: [{ deviceId: state.devices.relay_1, state: { on: true } }],
        ...over,
      });

      assert.equal(
        (await api('POST', '/api/automations', { token: state.aluno.token, body: payload() }))
          .status,
        403,
      );
      // luz como gatilho / sensor como ação / aparelho não cadastrado
      assert.equal(
        (
          await api('POST', '/api/automations', {
            token: t,
            body: payload({
              triggers: [{ deviceId: state.devices.relay_1, condition: { on: true } }],
            }),
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await api('POST', '/api/automations', {
            token: t,
            body: payload({
              actions: [{ deviceId: state.devices.pir_1, state: { presence: true } }],
            }),
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await api('POST', '/api/automations', {
            token: t,
            body: payload({ actions: [{ deviceId: state.devices.relay_2, state: { on: true } }] }),
          })
        ).status,
        400,
      );

      const ok = await api('POST', '/api/automations', { token: t, body: payload() });
      assert.equal(ok.status, 201);
      state.automationId = ok.body.id;

      const list = await api('GET', `/api/automations?roomId=${state.roomId}`, {
        token: state.aluno.token,
      });
      assert.equal(list.body.data.length, 1);

      const pause = await api('PUT', `/api/automations/${state.automationId}/pause`, {
        token: state.aluno.token,
        body: { paused: true },
      });
      assert.equal(pause.body.isPaused, true);
      assert.equal(pause.body.pausedBy, state.aluno.user.id);
    });

    it('automação pausada não dispara; ativa dispara só na mudança (borda)', async () => {
      const reading = (on, presence) => [
        { channel: 'relay_1', type: 'light', state: { on } },
        { channel: 'pir_1', type: 'presence_sensor', state: { presence } },
      ];
      // desliga a luz pelo usuário e confirma
      await api('PUT', `/api/devices/${state.devices.relay_1}/state`, {
        token: state.aluno.token,
        body: { state: { on: false } },
      });
      await sync(reading(true, false));

      // pausada: presença não aciona a luz
      const paused = await sync(reading(false, true));
      assert.deepEqual(paused.body.commands, []);

      await api('PUT', `/api/automations/${state.automationId}/pause`, {
        token: state.aluno.token,
        body: { paused: false },
      });
      await sync(reading(false, false));
      const fired = await sync(reading(false, true));
      assert.deepEqual(fired.body.commands, [{ channel: 'relay_1', state: { on: true } }]);

      // usuário apaga manualmente com a presença ainda ativa: não dispara de novo
      await api('PUT', `/api/devices/${state.devices.relay_1}/state`, {
        token: state.aluno.token,
        body: { state: { on: false } },
      });
      const noRetrigger = await sync(reading(true, true)); // luz ainda acesa, presença inalterada
      assert.deepEqual(noRetrigger.body.commands, [{ channel: 'relay_1', state: { on: false } }]);
    });

    it('remover aparelho do gatilho apaga a automação incompleta', async () => {
      const del = await api('DELETE', `/api/devices/${state.devices.pir_1}`, {
        token: state.ownerToken,
      });
      assert.equal(del.status, 204);
      const list = await api('GET', `/api/automations?roomId=${state.roomId}`, {
        token: state.ownerToken,
      });
      assert.equal(list.body.data.length, 0);
    });
  });

  describe('gestão de usuários', () => {
    it('só o owner promove; owner é protegido; desativar bloqueia o token na hora', async () => {
      const id = state.aluno.user.id;
      assert.equal(
        (
          await api('PATCH', `/api/users/${id}/role`, {
            token: state.aluno.token,
            body: { role: 'admin' },
          })
        ).status,
        403,
      );

      const promoted = await api('PATCH', `/api/users/${id}/role`, {
        token: state.ownerToken,
        body: { role: 'admin' },
      });
      assert.equal(promoted.body.role, 'admin');
      // a promoção vale imediatamente (papel vem do banco)
      assert.equal((await api('GET', '/api/users', { token: state.aluno.token })).status, 200);

      const ownerId = (await api('GET', '/api/auth/me', { token: state.ownerToken })).body.id;
      assert.equal(
        (
          await api('PATCH', `/api/users/${ownerId}/role`, {
            token: state.ownerToken,
            body: { role: 'member' },
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await api('PATCH', `/api/users/${ownerId}/status`, {
            token: state.aluno.token,
            body: { isActive: false },
          })
        ).status,
        403,
      );

      const off = await api('PATCH', `/api/users/${id}/status`, {
        token: state.ownerToken,
        body: { isActive: false },
      });
      assert.equal(off.body.isActive, false);
      assert.equal((await api('GET', '/api/auth/me', { token: state.aluno.token })).status, 401);
      const login = await api('POST', '/api/auth/login', {
        body: { email: ALUNO_EMAIL, password: 'nova-senha-123' },
      });
      assert.equal(login.status, 403);
      assert.equal(login.body.error.code, 'ACCOUNT_DISABLED');
    });

    it('listagem com busca e paginação', async () => {
      const res = await api('GET', '/api/users?q=aluno&limit=5', { token: state.ownerToken });
      assert.equal(res.status, 200);
      assert.equal(res.body.total, 1);
    });
  });

  describe('restrições do schema', () => {
    it('recusa datas fora do formato SQL e JSON inválido', () => {
      assert.throws(
        () =>
          db
            .prepare('UPDATE users SET reset_code_expires_at = ? WHERE id = 1')
            .run(new Date().toISOString()),
        /CHECK constraint failed/,
      );
      assert.throws(
        () =>
          db
            .prepare('UPDATE devices SET desired_state = ? WHERE id = ?')
            .run('{invalido', state.devices.relay_1),
        /CHECK constraint failed/,
      );
    });

    it('mantém a coerência entre pausa, usuário e data', () => {
      assert.throws(
        () =>
          db
            .prepare(
              'INSERT INTO automations (room_id, name, is_paused, paused_by, created_by) VALUES (?, ?, 0, 1, 1)',
            )
            .run(state.roomId, 'incoerente'),
        /CHECK constraint failed/,
      );
    });
  });
});
