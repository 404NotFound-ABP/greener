# Snapshot de evidências — Sprint 1

Registro coletado em 19/10/2026, horário de Brasília, para reduzir a dependência exclusiva de telas mutáveis do GitHub Project e do Figma.

## Versão do código

- `main`: [`4b55032`](https://github.com/404NotFound-ABP/greener/commit/4b55032223ce13f438c603f19936d4f5fa2ff1b1)
- `dev`: [`31e7d53`](https://github.com/404NotFound-ABP/greener/commit/31e7d538f359b30f10e1b6cec803f1533c782e0f)
- diferença: `dev` estava 3 commits à frente e 0 atrás de `main`;
- pull requests, tags e releases: nenhum registro encontrado.

## GitHub Project #5

[Visão de quadro observada](https://github.com/users/404NotFound-ABP/projects/5/views/2):

| Coluna | Itens |
|---|---:|
| Backlog | 36 |
| Ready | 0 |
| In Progress | 8 |
| Done | 3 |

Itens em Done: #39, #43 e #47.

Itens em In Progress: #41, #42, #45, #46, #48, #49, #50 e #52.

A visão de tabela apresentava os seis épicos em Backlog com 0% de progresso mecânico das subissues diretas. A issue #45 estava fechada no repositório, mas In Progress no Project.

## Issues

- total observado: 53;
- abertas: 49;
- fechadas: #39, #43, #45 e #47;
- duplicatas fora do Project: #25–#28 e #33–#34;
- #49–#53 apareciam relacionadas a #48, embora seus títulos T17.x indiquem relação lógica com #46.

## Figma

[Arquivo GeenER](https://www.figma.com/design/zPrdeRlYtzyWwmbuTiwQqE/GeenER?node-id=0-1) acessado publicamente, sem autenticação, em 19/10/2026.

Seções visíveis no canvas:

- `Login-section`;
- `Mapas/menus-section`;
- `Configurações-section`;
- `Estados de exceção`;
- `mobile-version`.

O arquivo continha múltiplas telas dentro dessas seções. A apresentação interativa solicitava criação/login em conta Figma; por isso, este snapshot não afirma que todas as transições estavam navegáveis.

## Validação técnica

| Comando | Resultado observado |
|---|---|
| `frontend: npm ci` | Sucesso; 181 pacotes e 0 vulnerabilidades reportadas |
| `frontend: npm run dev -- --host 127.0.0.1` | Vite 8.3.4 iniciou em `127.0.0.1:5173` |
| `frontend: npm run build` | Falha: import React não usado e props ausentes no `Sidebar` de `DashboardPage` |
| `frontend: npm run lint` | Falha: `no-explicit-any` em `MapBackground.tsx` |
| `backend: npm ci` | Concluído com avisos de engine e 4 vulnerabilidades moderadas reportadas |
| `backend: npm run build` | Falha: TypeScript 7.0.2 incompatível com a API esperada pelo Nest CLI |
| `docker compose config --no-interpolate` | Falha: `POSTGRES_PASSWORD` não é um valor escalar válido |

Este arquivo preserva o resultado da observação; os links externos continuam sendo fontes vivas e podem mudar depois do fechamento.
