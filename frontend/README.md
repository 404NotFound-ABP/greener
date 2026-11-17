# Frontend do GreenER

Interface em React, TypeScript e Vite para explorar serviços monitorados em uma lista e em um mapa Leaflet. O fluxo começa pelo login e inclui cadastro em três etapas, mapa, filtros e modais. A opção de acesso administrativo leva ao protótipo de gerenciamento de usuários.

## Como abrir

Para demonstrar a versão containerizada, siga o [roteiro com Docker](../README.md#executar-a-aplicação-com-docker). O Nginx serve o build do frontend em `http://localhost:3000` com as portas padrão. O mapa de fundo depende de internet para carregar os mapas de terceiros.

Para trabalhar somente na interface, use Node.js e npm. A verificação de 06/11/2026 utilizou Node.js 24.20.0 e npm 11.19.0. Execute os comandos abaixo a partir da raiz do repositório.

```sh
cd frontend
npm ci
npm run dev
```

Abra o endereço que o Vite imprimir no terminal. Na mesma pasta, `npm run build` verifica o TypeScript e gera os arquivos em `dist/`. `npm run lint` executa o ESLint. Os dois comandos passaram no commit `1e075b9`.

## O que demonstrar na Sprint 2

| Fluxo | Comportamento observado em 06/11/2026 |
|---|---|
| Acesso e cadastro | O login comum, o cadastro e o acesso administrativo navegam entre telas por estado local. No teste, um e-mail fictício e uma senha arbitrária abriram o mapa e o painel de perfis. A integração com o JWT e a gravação do cadastro continuam pendentes. |
| Lista, filtros e mapa | Há três marcadores e dois cards fixos. Digitar uma busca sem correspondência manteve os cards. Selecionar apenas “Sem métricas” esvaziou a lista, mas manteve um marcador visível. |
| Medições | Os cards apresentam 100 kWh, a unidade de CO₂e sem valor numérico e o horário fixo de 12:00. O gráfico e os indicadores do modal também são simulados. A API já disponibiliza medições para a futura integração. |
| Tela de celular | Em 360 × 800, a barra lateral ultrapassou a largura disponível e o seletor de tema cobriu o rodapé. As [capturas de desktop e celular](../docs/interface.md#capturas-do-dashboard) mostram o problema para o reteste após a correção. |

O componente [MapBackground](src/components/MapBackground.tsx) define os marcadores e os filtros. A [Sidebar](src/components/Sidebar.tsx) define os cards, e o [ServiceModal](src/components/ServiceModal.tsx) apresenta o detalhe. O vínculo entre design, comportamento esperado e critérios de aceite está na [documentação da interface](../docs/interface.md).
