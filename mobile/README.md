# Zephora App

Aplicativo do Zephora para Android, iOS e web, desenvolvido com Expo,
React Native, Expo Router e TypeScript.

## Funcionalidades

- autenticação e recuperação de acesso;
- gerenciamento de salas, aparelhos e automações;
- controle de dispositivos e acompanhamento de estados;
- administração de usuários e módulos ESP32;
- execução em celular, tablet e navegador.

## Identidade visual: "lousa inteligente"

Automação + escola: o azul-lousa da sala de aula como base escura, o azul-giz como cor de ação
e rabiscos de giz (livros, fórmulas, lâmpada) como textura de marca.

| Peça | Onde fica |
| --- | --- |
| Tokens (cores, fontes, sombras, movimento) | `src/ui/theme/` |
| Lousa com rabiscos (`ChalkBoard`) e cabeçalho de destaque (`HeroHeader`) | `src/ui/` |
| Pássaro e marca (`BrandMark`, `BrandLockup`) | `src/ui/BrandMark.tsx` |
| Menu lateral escuro (web/tablet) e barra inferior (celular) | `src/features/shell/` |
| Login com painel de lousa e papel quadriculado | `src/features/auth/components/AuthLayout.tsx` |

- **Cores**: `primary` (azul de ação), `ink`/`inkRaised` (lousa), `chalk`/`chalkMuted` (texto sobre a lousa),
  `sky` (indicador ativo), superfícies levemente azuladas. Todos os pares de texto passam em contraste AA.
- **Tipografia**: Plus Jakarta Sans (`@expo-google-fonts`), carregada no layout raiz. Use sempre
  `<AppText variant="...">`; com fonte customizada não se usa `fontWeight`, e sim `fonts.*` do tema.
- **Movimento**: listas entram em cascata (`Grid`), telas de acesso e cabeçalhos entram com `FadeInDown`;
  respeita "reduzir movimento" do sistema.
- **Assets**: `python3 tools/build_brand_assets.py` regenera `chalk-doodles.png`, `grid-paper.png`, ícone,
  ícone adaptativo do Android, splash e favicon a partir de `Logo_Zephora.png` e `chalkboard.png`.

## Executar localmente

```bash
npm install
cp .env.example .env
npm start
```

No PowerShell:

```powershell
Copy-Item .env.example .env
```

Comandos úteis:

```bash
npm run web        # navegador
npm run android    # Android
npm run ios        # iOS
npm run typecheck  # checagem de tipos
npm run build:web  # build web em dist/
npm run format     # formata o código com Prettier
npm run format:check # verifica a formatação sem alterar arquivos
```

Para executar no celular físico, use o mesmo Wi-Fi do computador e informe
no `.env` o endereço acessível da API:

```env
EXPO_PUBLIC_API_URL=http://IP-DO-COMPUTADOR:3333
```

O valor deve ser a URL da API sem `/api`. No desenvolvimento, os valores
mais comuns são:

| Ambiente | URL |
| --- | --- |
| navegador ou simulador iOS | `http://localhost:3333` |
| emulador Android | `http://10.0.2.2:3333` |
| celular físico | `http://IP-DO-COMPUTADOR:3333` |

## Organização do código

```text
src/
  app/        rotas do Expo Router
  core/       API, autenticação, armazenamento e navegação
  features/   funcionalidades por domínio
  ui/         componentes e tema visual
```

As chamadas HTTP ficam nas features e usam a API iniciada em
[`../backend/`](../backend). Para a web funcionar, a origem do aplicativo
também deve estar autorizada no ambiente da API.
