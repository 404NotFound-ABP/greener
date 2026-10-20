# Cálculos ambientais

## Estado na Sprint 1

Não existe fórmula implementada ou validada para estimar energia e emissão de CO₂e. Os valores exibidos no Figma e no frontend são exemplos visuais e não resultados calculados.

A tarefa [#38](https://github.com/404NotFound-ABP/greener/issues/38) permanece aberta e foi transferida para a Sprint 2.

## Definições necessárias antes da implementação

- métricas de entrada e suas unidades;
- janela/período representado por cada leitura;
- modelo de conversão das métricas em energia;
- fatores e hipóteses usados pelo modelo;
- fonte, região, unidade e validade da intensidade de carbono;
- tratamento de leituras ausentes, parciais ou antigas;
- precisão, arredondamento e apresentação de valores pequenos;
- exemplos calculados manualmente para teste.

## Regras já estabelecidas no backlog

- energia deve ser apresentada em kWh;
- emissão deve ser apresentada em gCO₂e;
- período e fatores precisam ser identificados;
- dados ausentes não podem virar zero;
- se apenas o fator de carbono faltar, energia pode continuar disponível e emissão deve ser marcada como indisponível;
- totais devem usar período comum e informar quando forem parciais.

## Evidência exigida para conclusão

1. referências da metodologia e dos fatores;
2. fórmula documentada com unidades em cada etapa;
3. pelo menos um exemplo conhecido conferido manualmente;
4. testes para valor válido, zero válido, ausência, valor muito pequeno e fator indisponível;
5. implementação separada dos controllers;
6. integração com dados reais ou fixtures controladas;
7. interface coerente com os resultados e seus limites.

Até esses itens existirem, a documentação e a interface devem usar a expressão “valor simulado” e evitar alegações de impacto ambiental medido.
