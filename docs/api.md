# API do GreenER

Na revisão de 06/11/2026 (`main`, `1e075b9`), o NestJS expunha a documentação interativa em `http://localhost:3001/docs` com as portas padrão do Compose. A consulta do dashboard usa o PostgreSQL e requer as migrações aplicadas. O frontend ainda apresenta dados locais. Na Sprint 1, o relatório registrava apenas o planejamento desses contratos. [Execução do projeto](../README.md) · [Relatório da Sprint 1](sprints/sprint-1.md)

## Integrações com a UniLaunch

O backend consulta os provedores por HTTPS, usando o `id` do serviço para buscar métricas e `location.region_code` para buscar o fator de carbono. As URLs base e o agendamento do coletor ficam na [configuração do backend](../backend/src/config/config.ts).

| Provedor e rota | Resposta usada pelo GreenER |
|---|---|
| Métricas · `GET /services` | Array de serviços. Cada item tem `id`, `name`, `metrics_path` e `location` com `region_code`, país, região, cidade e coordenadas. Em uma descoberta bem-sucedida, `[]` indica uma lista vazia. |
| Métricas · `GET /services/{id}` | Cadastro atual do serviço. Um ID fora do registro pode retornar `404`. |
| Métricas · `GET /metrics/{id}` | `collection_interval_seconds` e `metrics` com `cpu_percent` (%), `memory_gb`, `disk_gb` e `network_gb` (GB). O provedor descreve `404` para ID ausente e `500` tanto para indisponibilidade do serviço quanto do exportador de métricas. |
| Carbono · `GET /regions` | Objeto com `total` e `regions`. Cada região possui `code`, localização, coordenadas, intensidade em gCO₂e/kWh e percentual renovável. |
| Carbono · `GET /regions/{code}/carbon-intensity` | Fator `carbon_intensity_gco2e_per_kwh` para o `region_code` solicitado. Uma região desconhecida pode retornar `404`. |

Na consulta de 06/11, o agregador listou `billing-api` na região `br-sudeste`. Uma requisição de métricas devolveu o corpo abaixo. O fator regional consultado foi 85 gCO₂e/kWh. Como as leituras variam, use uma única coleta gravada para comparar API, banco e cálculo. [Contrato de métricas](https://metrics.unilaunch.org/openapi.json) · [Contrato de carbono](https://carbon.unilaunch.org/openapi.json)

```json
{
  "collection_interval_seconds": 9,
  "metrics": {
    "cpu_percent": 72.464,
    "memory_gb": 3.300976,
    "disk_gb": 18.13248,
    "network_gb": 0.505575
  }
}
```

## Rotas internas

| Método e caminho | Origem, parâmetros e resultado |
|---|---|
| `GET /api/servidores/dashboard` | `resumo` com contagens, potência das últimas leituras disponíveis e energia/emissão acumuladas de todo o histórico. `servidores` contém estado, região e `ultima_coleta` por serviço. A projeção da região omite latitude e longitude. |
| `GET /api/servidores` | Lista serviços do banco com a última leitura. Com `?origem=externa`, retorna o cadastro no formato do provedor. |
| `GET /api/servidores/{id}` e `GET /api/servidores/{id}/metrics` | Consultas diretas ao cadastro e às métricas brutas do agregador. |
| `GET /api/servidores/{id}/historico` | Últimos `limite` pontos do serviço, ordenados do mais antigo ao mais recente. Padrão de 30 pontos. |
| `GET /api/servidores/ranking` e `GET /api/servidores/comparativo` | Ranking por energia ou emissão (`ordenarPor`, `criterio`, `ordem`, `limite`) e comparação das últimas leituras por `ids` separados por vírgula. A seleção de um período comum é pendência do produto. |
| `GET /api/carbon/regioes` e `GET /api/carbon/regioes/{code}` | Consultam a lista de regiões ou a intensidade de uma região no provedor. |
| `GET /api/impacto` e `GET /api/impacto/{id}` | Impacto calculado para os serviços da descoberta atual ou para um serviço. `GET /api/impacto/{id}/discriminado` detalha CPU, memória, disco e rede com `criterio=instantaneo` ou `acumulado`. |
| `GET /api/coleta/status` e `GET /api/coleta/historico` | Estatísticas do coletor e últimas medições persistidas. O histórico bruto aceita `servidorId` e `limite` e retorna primeiro a leitura mais recente. |
| `POST /api/coleta/executar` | Dispara um ciclo manual. Para apurar o resultado, conferir `detalhes` e os novos registros, inclusive quando o corpo indicar `sucesso`. |
| `POST /api/auth/login` e `GET /api/auth/me` | Login com `email` e `password` responde com `accessToken` e `user`. A consulta ao perfil exige `Authorization: Bearer <token>`. |
| `/api/users` e `/api/users/{id}` | Administração de usuários. A coleção aceita `GET` e `POST`, o registro aceita `GET`, `PATCH` e `DELETE`. Exigem JWT e papel `admin`. |

## Como conferir uma leitura

Com os containers em execução e o banco migrado, abra `http://localhost:3001/api/servidores/dashboard`. Selecione um `id`, anote `ultima_coleta.coletado_em`, `energia_kwh` e `emissoes_gco2e`. Consulte `/api/coleta/historico?servidorId=ID&limite=20` na mesma API, substituindo `ID` pelo identificador. Localize o mesmo horário em `coletadoEm` e compare `energiaKwh` e `emissoesGco2e`. O histórico bruto também expõe `intervaloSegundos` e `carbonIntensityFator` para repetir a conta. [Fórmula e exemplo conferido](calculos.md)

## Falhas observadas e aceite pendente

- **Estado de monitoramento.** Uma descoberta bem-sucedida marca como `removido` um serviço que desapareceu da lista. Seu retorno com o mesmo ID reativa o cadastro. Erro de métricas ou resposta sem o objeto `metrics` acaba em `indisponivel`. Para atender RF05/RF06, é preciso distinguir indisponibilidade e ausência de métricas com base no contrato do parceiro e em casos verificáveis. [Issue #119](https://github.com/404NotFound-ABP/greener/issues/119)
- **Valores ausentes.** Em teste controlado, a falha de métricas produziu campos `NULL` no PostgreSQL. A consulta do dashboard e o histórico por servidor devolveram `0` nesses campos. A integração da tela precisa preservar o zero medido e indicar ausência explicitamente. [Issue #122](https://github.com/404NotFound-ABP/greener/issues/122)
- **Falha de descoberta.** Com `503` simulado no agregador, a coleta manual respondeu `201`, `status: sucesso` e um erro em `detalhes`, sem gravar medições. A resposta externa e o resultado do ciclo precisam comunicar a falha. [Implementação do coletor](../backend/src/module/collector/collector.service.ts)
