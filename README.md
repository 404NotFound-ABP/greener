# GreenER

Plataforma web para monitoramento e estimativa do impacto ambiental de aplicações de software.

## Sobre

O GreenER tem como objetivo transformar métricas de infraestrutura em estimativas de consumo energético e emissões de dióxido de carbono equivalente (CO₂e), apoiando a identificação de oportunidades de otimização.

A plataforma utilizará dados de CPU, memória, armazenamento e rede, juntamente com informações de intensidade de carbono da região onde cada serviço está hospedado.

## Funcionalidades previstas

- Descoberta e monitoramento dinâmico de serviços.
- Coleta periódica de métricas de infraestrutura.
- Identificação de serviços indisponíveis ou sem métricas.
- Estimativa de consumo energético e emissões de CO₂e por serviço.
- Dashboard com indicadores individuais e consolidados.
- Histórico de coletas para análise temporal.
- Ranking de impacto e comparação entre serviços.
- Configuração do monitoramento com autenticação.

## Tecnologias previstas

| Camada | Tecnologia |
|---|---|
| Frontend | React e TypeScript |
| Backend | NestJS e TypeScript |
| Banco de dados | PostgreSQL |
| Persistência | ORM a definir |
| Ambiente de execução | Docker |

## Status

O projeto está em fase de planejamento e organização inicial do repositório.

As funcionalidades descritas representam o escopo previsto e ainda não estão implementadas. As instruções de configuração, execução e testes serão adicionadas conforme o desenvolvimento avançar.

## Documentação

Consulte o [índice da documentação](docs/README.md) para acessar o planejamento, as decisões e os documentos do projeto.
