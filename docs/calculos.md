# Cálculos ambientais

Em 06/11/2026, a `main` (`1e075b9`) calculava potência, energia e emissão no backend. São estimativas por serviço baseadas nas métricas do agregador e no fator regional da UniLaunch. Os valores fixos exibidos no dashboard React ainda pertencem ao protótipo. A definição da fórmula foi encerrada na issue #38 após o recorte histórico da Sprint 1. [Calculadora no backend](../backend/src/module/impact/impact.service.ts) · [Issue #38](https://github.com/404NotFound-ABP/greener/issues/38) · [Relatório da Sprint 1](sprints/sprint-1.md)

## Modelo por leitura

| Entrada | Unidade | Conversão usada pela calculadora |
|---|---|---|
| `cpu_percent` | % | `(cpu_percent / 100) × 100 W` |
| `memory_gb` | GB | `memory_gb × 0,375 W/GB` |
| `disk_gb` | GB | `disk_gb × 0,01 W/GB` |
| `network_gb` | GB | `network_gb × 0,02 W/GB` |
| `collection_interval_seconds` | s | Duração que a leitura representa, informada pelo agregador. |
| `carbon_intensity_gco2e_per_kwh` | gCO₂e/kWh | Fator fornecido pela API de carbono para o `location.region_code` do serviço. |

1. Somar as quatro parcelas para obter a potência estimada em watts.
2. Calcular a energia do intervalo em kWh com `potência_W × (intervalo_s / 3600) / 1000`.
3. Calcular a emissão em gCO₂e com `energia_kWh × fator_regional`.

A calculadora usa os resultados intermediários antes do arredondamento e devolve potência com até 2 casas decimais, energia com até 7 e emissão com até 4. O agendamento do coletor é de 30 s. A duração usada na conta deve acompanhar cada leitura do parceiro. [Contrato das APIs e unidades](api.md)

## Exemplo de aceitação

No teste controlado de 06/11, a entrada foi CPU de 50%, memória de 8 GB, disco de 40 GB, rede de 3 GB, intervalo de 60 s e fator regional de 200 gCO₂e/kWh.

| Resultado | Conferência manual | Valor obtido no banco e na consulta do dashboard |
|---|---|---|
| Potência | `50 + (8 × 0,375) + (40 × 0,01) + (3 × 0,02)` | **53,46 W** |
| Energia | `53,46 × (60 / 3600) / 1000` | **0,000891 kWh** |
| Emissão | `0,000891 × 200` | **0,1782 gCO₂e** |

Em uma execução separada com os provedores reais, uma leitura de `billing-api` com CPU de 66,752%, memória de 3,235456 GB, disco de 18 GB, rede de 0,48978 GB, intervalo de 32 s e fator 85 gCO₂e/kWh gerou **0,0006058 kWh** e **0,0515 gCO₂e** no PostgreSQL. Os números são referentes a essa leitura de 06/11.

## Dados ausentes e agregação

| Caso | Comportamento observado na versão avaliada | Critério para a entrega |
|---|---|---|
| Consumo zero válido | Na calculadora, entradas de consumo iguais a zero com intervalo e fator válidos retornaram zero. | Exibir zero com unidade e período. |
| Fator regional ausente | Com fator `null`, a calculadora básica preservou a energia e devolveu emissão `null`. A consulta de impacto tenta usar a região salva no banco quando o provedor falha. Alguns caminhos, inclusive o discriminado, usam zero como fator na ausência de dados. | Preservar a energia quando possível, marcar a emissão como indisponível e identificar a origem do fator utilizado. |
| Métricas ausentes | No teste de indisponibilidade, o coletor gravou `NULL` para métricas, energia e emissão. O dashboard e o histórico por serviço converteram os campos para zero. | Distinguir a ausência de leitura de uma leitura válida com consumo zero. [Issue #122](https://github.com/404NotFound-ABP/greener/issues/122) |
| Última leitura usada no detalhamento | Quando recorre à última coleta do banco para o detalhamento instantâneo, o backend recalcula com 30 s, mesmo quando a duração gravada difere. | Recalcular usando a duração daquela coleta. [Issue #121](https://github.com/404NotFound-ABP/greener/issues/121) |
| Totais do dashboard | O backend soma a potência das últimas leituras disponíveis e acumula energia e emissão sobre todo o histórico. A resposta carece de janela de comparação e indicação de cobertura parcial. | Informar período comum e quais serviços ou leituras contribuíram para cada total. [Issue #124](https://github.com/404NotFound-ABP/greener/issues/124) |

A conferência manual e as execuções acima registram o que foi verificado antes da review. O repositório ainda precisa de testes automatizados para as regras de cálculo e os casos de ausência previstos no backlog. [Backlog e critérios de aceite](academico/backlog.md)
