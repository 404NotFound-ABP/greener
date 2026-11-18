# Frontend do GreenER

Interface em React, TypeScript e Vite para explorar serviços monitorados em uma lista e em um mapa Leaflet. O fluxo começa pelo login e inclui cadastro em três etapas, mapa, filtros e modais. A opção de acesso administrativo leva ao protótipo de gerenciamento de usuários.

## Executar com Docker

A imagem usa Node.js 24.20.0 para compilar a aplicação e Nginx para servi-la na porta `80` do container. O endereço da API é definido no momento do build pela variável pública `VITE_API_URL` (padrão: `http://localhost:3001/api`); esse endereço fica embutido nos arquivos compilados e não deve conter credenciais ou segredos. Para conectar a outro backend, informe uma URL acessível pelo navegador do usuário.

Para compilar e executar somente o frontend a partir da raiz do repositório:

```sh
docker build --build-arg VITE_API_URL=http://localhost:3001/api -t greener-frontend ./frontend
docker run --rm -p 3000:80 greener-frontend
```

Abra `http://localhost:3000`. Para escolher outra porta no host, troque `3000` no mapeamento `-p HOST:80`; a porta interna do Nginx permanece `80`.

Para iniciar a stack completa, siga o [roteiro principal com Docker Compose](../README.md#executar-a-aplicação-com-docker). Defina `VITE_API_URL` no `.env` da raiz antes de compilar; a configuração é repassada ao build da imagem do frontend. O mapa de fundo depende de internet para carregar mapas de terceiros.

## Executar localmente

Para trabalhar somente na interface, use Node.js 24.20.0 e npm 11.19.0. Execute os comandos abaixo a partir da raiz do repositório.

```sh
cd frontend
npm ci
npm run dev
```

Abra o endereço que o Vite imprimir no terminal. Na mesma pasta, `npm run build` verifica o TypeScript e gera os arquivos em `dist/`. `npm run lint` executa o ESLint. Os dois comandos passaram no commit `1e075b9`.

## Histórico de coletas

A página consulta `GET /api/coleta/historico` e usa `servidorId` para filtrar por serviço. Como a rota atual não aceita datas, a seleção do período é aplicada no frontend aos até 10.000 registros mais recentes retornados pela API. A URL base padrão é `http://localhost:3001/api`; para outro endereço, defina `VITE_API_URL` antes de iniciar o Vite ou gerar o build.

## Comparação de serviços

Em **Dashboards > Comparar serviços**, a lista vem de `GET /api/servidores`; as coletas são consultadas em `GET /api/coleta/historico` por serviço, limitadas a 10.000 registros por serviço e filtradas no frontend pelo período comum escolhido. Energia e emissões são somadas; CPU, memória, disco, rede, potência e intensidade de carbono são médias das leituras não nulas. A tabela informa o número de coletas consideradas e diferencia ausência de registros de métricas não informadas. A URL base usa `VITE_API_URL`, igual à página de histórico.

## O que demonstrar na Sprint 2

| Fluxo | Comportamento observado em 06/11/2026 |
|---|---|
| Acesso e cadastro | O login comum, o cadastro e o acesso administrativo navegam entre telas por estado local. No teste, um e-mail fictício e uma senha arbitrária abriram o mapa e o painel de perfis. A integração com o JWT e a gravação do cadastro continuam pendentes. |
| Lista, filtros e mapa | Há três marcadores e dois cards fixos. Digitar uma busca sem correspondência manteve os cards. Selecionar apenas “Sem métricas” esvaziou a lista, mas manteve um marcador visível. |
| Medições | Os cards apresentam 100 kWh, a unidade de CO₂e sem valor numérico e o horário fixo de 12:00. O gráfico e os indicadores do modal também são simulados. A API já disponibiliza medições para a futura integração. |
| Tela de celular | Em 360 × 800, a barra lateral ultrapassou a largura disponível e o seletor de tema cobriu o rodapé. As [capturas de desktop e celular](../docs/interface.md#capturas-do-dashboard) mostram o problema para o reteste após a correção. |

O componente [MapBackground](src/components/MapBackground.tsx) define os marcadores e os filtros. A [Sidebar](src/components/Sidebar.tsx) define os cards, e o [ServiceModal](src/components/ServiceModal.tsx) apresenta o detalhe. O vínculo entre design, comportamento esperado e critérios de aceite está na [documentação da interface](../docs/interface.md).
