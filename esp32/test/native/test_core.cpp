// Testes do núcleo (sem Arduino). Compilar/rodar: scripts/run_tests.sh
#include <stdio.h>

#include <string.h>

#include <string>
#include <vector>

#include "../../src/core/channel_registry.h"
#include "../../src/core/credential.h"
#include "../../src/core/presence_filter.h"
#include "../../src/core/server_url.h"
#include "../../src/core/sync_protocol.h"
#include "../../src/core/sync_scheduler.h"
#include "fakes.h"

using namespace zephora;

static int g_run = 0, g_fail = 0;
#define CHECK(cond)                                                          \
  do {                                                                       \
    ++g_run;                                                                 \
    if (!(cond)) { ++g_fail; printf("  FALHOU %s:%d  %s\n", __FILE__, __LINE__, #cond); } \
  } while (0)
#define TEST(name) static void name(); static struct R_##name { R_##name() { tests().push_back({#name, name}); } } r_##name; static void name()

struct T { const char* n; void (*f)(); };
static std::vector<T>& tests() { static std::vector<T> v; return v; }

// ---------- credencial ----------
TEST(credencial_hex_tem_64_chars_e_valida) {
  uint8_t b[32]; for (int i = 0; i < 32; ++i) b[i] = static_cast<uint8_t>(i * 7);
  std::string c = credentialFromBytes(b, 32);
  CHECK(c.size() == 64); CHECK(isValidCredential(c)); CHECK(c.substr(0, 4) == "0007");
}
TEST(credencial_invalida) {
  CHECK(!isValidCredential("curta"));
  CHECK(!isValidCredential(std::string(32, '!')));
  CHECK(!isValidCredential(std::string(129, 'a')));
  CHECK(isValidCredential(std::string(32, 'a')));
  CHECK(isValidCredential(std::string(40, '_')));
}

// ---------- URL do servidor ----------
TEST(url_validas) {
  ServerUrl u; std::string e;
  CHECK(parseServerUrl("  https://api.escola.com.br/ ", u, &e)); CHECK(u.https); CHECK(u.base == "https://api.escola.com.br");
  CHECK(parseServerUrl("http://192.168.0.10:3333", u)); CHECK(!u.https); CHECK(u.base == "http://192.168.0.10:3333");
  CHECK(parseServerUrl("http://zephora.local/prefixo//", u)); CHECK(u.base == "http://zephora.local/prefixo");
  CHECK(u.syncUrl("/api/device-sync") == "http://zephora.local/prefixo/api/device-sync");
}
TEST(url_invalidas) {
  ServerUrl u; std::string e;
  CHECK(!parseServerUrl("", u, &e));
  CHECK(!parseServerUrl("ftp://x.com", u, &e));
  CHECK(!parseServerUrl("api.escola.com", u, &e));
  CHECK(!parseServerUrl("https://", u, &e));
  CHECK(!parseServerUrl("https://user:senha@x.com", u, &e));
  CHECK(!parseServerUrl("https://x.com/a?b=1", u, &e));
  CHECK(!parseServerUrl("https://x.com/#f", u, &e));
  CHECK(!parseServerUrl("https://x.com:99999", u, &e));
  CHECK(!parseServerUrl("https://x .com", u, &e));
  CHECK(!parseServerUrl("https://x_y.com", u, &e));
}

// ---------- registro de canais ----------
TEST(registro_valida_id_nome_e_duplicados) {
  ChannelRegistry r; FakeLight a("relay_1", "Luz"), dup("relay_1", "Outra"), bad("rele 1", "x"), noname("ok", "");
  CHECK(r.add(a) == AddResult::Ok);
  CHECK(r.add(dup) == AddResult::Duplicate);
  CHECK(r.add(bad) == AddResult::InvalidId);
  CHECK(r.add(noname) == AddResult::InvalidName);
  CHECK(r.size() == 1);
  CHECK(r.find("relay_1") == &a); CHECK(r.find("nada") == nullptr);
}
TEST(registro_limite_32) {
  ChannelRegistry r; std::vector<FakeLight*> v;
  for (int i = 0; i < 33; ++i) v.push_back(new FakeLight("c" + std::to_string(i), "n"));
  int ok = 0; for (auto* l : v) if (r.add(*l) == AddResult::Ok) ++ok;
  CHECK(ok == 32);
}
TEST(registro_detecta_mudanca) {
  ChannelRegistry r; FakeLight a("l", "Luz"); FakePir p("p", "PIR"); r.add(a); r.add(p);
  CHECK(r.changedSinceReport());      // nunca reportou
  r.commitReported();
  CHECK(!r.changedSinceReport());
  p.presence = true; CHECK(r.changedSinceReport());
  r.commitReported(); CHECK(!r.changedSinceReport());
}

// ---------- payload ----------
TEST(payload_segue_o_contrato) {
  ChannelRegistry r; FakeLight a("relay_1", "Luz do quadro"); FakePir p("pir_1", "Presença"); r.add(a); r.add(p);
  p.presence = true;
  std::string s = buildSyncPayload(r, "1.0.0");
  CHECK(s == "{\"firmware\":\"1.0.0\",\"devices\":[{\"channel\":\"relay_1\",\"type\":\"light\",\"name\":\"Luz do quadro\",\"state\":{\"on\":false}},"
              "{\"channel\":\"pir_1\",\"type\":\"presence_sensor\",\"name\":\"Presença\",\"state\":{\"presence\":true}}]}");
}

// ---------- resposta e comandos ----------
TEST(resposta_aplica_comando_valido) {
  ChannelRegistry r; FakeLight a("relay_1", "Luz"); r.add(a);
  std::string b = R"({"serverTime":"x","pollIntervalMs":3000,"commands":[{"channel":"relay_1","state":{"on":true}}]})";
  SyncResponse s = handleSyncResponse(b.data(), b.size(), r);
  CHECK(s.valid); CHECK(s.applied == 1); CHECK(s.rejected == 0); CHECK(a.on); CHECK(s.pollIntervalMs == 3000);
}
TEST(resposta_rejeita_comandos_suspeitos) {
  ChannelRegistry r; FakeLight a("relay_1", "Luz"); FakePir p("pir_1", "PIR"); r.add(a); r.add(p);
  const char* cases[] = {
    R"({"commands":[{"channel":"fantasma","state":{"on":true}}]})",           // canal inexistente
    R"({"commands":[{"channel":"pir_1","state":{"presence":true}}]})",        // sensor não é controlável
    R"({"commands":[{"channel":"relay_1","state":{"presence":true}}]})",      // chave de outro tipo
    R"({"commands":[{"channel":"relay_1","state":{"on":"true"}}]})",          // valor não booleano
    R"({"commands":[{"channel":"relay_1","state":{"on":true,"x":1}}]})",      // chaves extras
    R"({"commands":[{"channel":"relay_1","state":{}}]})",
    R"({"commands":[{"channel":"relay_1"}]})",
    R"({"commands":[{"channel":7,"state":{"on":true}}]})",
  };
  for (const char* c : cases) {
    SyncResponse s = handleSyncResponse(c, strlen(c), r);
    CHECK(s.valid); CHECK(s.applied == 0); CHECK(s.rejected == 1); CHECK(!a.on); CHECK(!p.presence);
  }
}
TEST(resposta_invalida_nao_aplica_nada) {
  ChannelRegistry r; FakeLight a("relay_1", "Luz"); r.add(a);
  CHECK(!handleSyncResponse("", 0, r).valid);
  CHECK(!handleSyncResponse("nao-json", 8, r).valid);
  CHECK(!handleSyncResponse("[1,2]", 5, r).valid);
  CHECK(!a.on);
}
TEST(resposta_intervalo_e_limitado) {
  ChannelRegistry r;
  auto poll = [&](const char* b) { return handleSyncResponse(b, strlen(b), r).pollIntervalMs; };
  CHECK(poll(R"({"pollIntervalMs":500})") == kMinPollMs);
  CHECK(poll(R"({"pollIntervalMs":999999})") == kMaxPollMs);
  CHECK(poll(R"({"pollIntervalMs":"x"})") == kDefaultPollMs);
  CHECK(poll(R"({})") == kDefaultPollMs);
  CHECK(poll(R"({"pollIntervalMs":5000})") == 5000);
}
TEST(resposta_multiplos_comandos) {
  ChannelRegistry r; FakeLight a("l1", "A"), b("l2", "B"); r.add(a); r.add(b);
  const char* body = R"({"commands":[{"channel":"l1","state":{"on":true}},{"channel":"zz","state":{"on":true}},{"channel":"l2","state":{"on":true}}]})";
  SyncResponse s = handleSyncResponse(body, strlen(body), r);
  CHECK(s.applied == 2); CHECK(s.rejected == 1); CHECK(a.on && b.on);
}

// ---------- filtro de presença ----------
TEST(pir_ignora_aquecimento) {
  PresenceFilter f(5000, 30000);
  CHECK(!f.update(true, 1000)); CHECK(!f.update(true, 29000)); CHECK(f.update(true, 31000));
}
TEST(pir_segura_presenca_pelo_hold) {
  PresenceFilter f(5000, 0);
  CHECK(f.update(true, 100));
  CHECK(f.update(false, 3000));    // 2,9 s sem movimento: ainda presente
  CHECK(f.update(true, 3500));     // novo movimento renova
  CHECK(f.update(false, 8000));    // 4,5 s
  CHECK(!f.update(false, 8600));   // >=5 s: ausente
}
TEST(pir_funciona_com_overflow_do_millis) {
  PresenceFilter f(5000, 0);
  CHECK(f.update(true, 0xFFFFFF00u));
  CHECK(f.update(false, 0xFFFFFF00u + 3000));  // atravessa o overflow
  CHECK(!f.update(false, 0xFFFFFF00u + 6000));
}

// ---------- agendador ----------
TEST(agendador_ritmo_normal_e_comandos) {
  SyncScheduler s; s.reset(0);
  CHECK(s.due(0));
  s.onSuccess(100, 3000, false); CHECK(!s.due(3099)); CHECK(s.due(3100));
  s.onSuccess(3100, 3000, true);  CHECK(!s.due(4099)); CHECK(s.due(4100));   // confirma logo
}
TEST(agendador_mudanca_local_antecipa_respeitando_minimo) {
  SyncScheduler s; s.reset(0); s.onSuccess(1000, 3000, false);
  s.onLocalChange(1200); CHECK(!s.due(1999)); CHECK(s.due(2000));            // mínimo 1 s desde a última
  s.onSuccess(2000, 3000, false); s.onLocalChange(9000); CHECK(s.due(9000)); // já passou o mínimo
}
TEST(agendador_recuo_em_falhas_e_nao_antecipa) {
  SyncScheduler s; s.reset(0);
  s.onFailure(0, FailureKind::Network);  CHECK(s.nextDueMs() == 2000);
  s.onFailure(2000, FailureKind::Network); CHECK(s.nextDueMs() == 2000 + 4000);
  s.onLocalChange(2100); CHECK(!s.due(2100));                               // em recuo: não antecipa
  for (int i = 0; i < 20; ++i) s.onFailure(0, FailureKind::Network);
  CHECK(s.nextDueMs() == 60000);                                            // teto
  s.onSuccess(70000, 3000, false); CHECK(s.failures() == 0); CHECK(s.nextDueMs() == 73000);
}
TEST(agendador_401_recua_mais_e_respeita_retry_after) {
  CHECK(SyncScheduler::backoffMs(FailureKind::Auth, 1, 0) == 15000);
  CHECK(SyncScheduler::backoffMs(FailureKind::Auth, 4, 0) == 120000);
  CHECK(SyncScheduler::backoffMs(FailureKind::Auth, 9, 0) == 120000);
  CHECK(SyncScheduler::backoffMs(FailureKind::RateLimit, 1, 90000) == 90000);
  CHECK(SyncScheduler::backoffMs(FailureKind::RateLimit, 1, 9999999) == 300000);
}
TEST(agendador_overflow_do_millis) {
  SyncScheduler s; s.reset(0xFFFFFFF0u);
  s.onSuccess(0xFFFFFFF0u, 3000, false);
  CHECK(!s.due(0xFFFFFFF0u + 2999)); CHECK(s.due(0xFFFFFFF0u + 3000));
}

int main() {
  for (auto& t : tests()) { int before = g_fail; printf("• %s\n", t.n); t.f(); if (g_fail == before) printf("  ok\n"); }
  printf("\n%d verificações, %d falhas, %zu testes\n", g_run, g_fail, tests().size());
  return g_fail ? 1 : 0;
}
