# API

## Estado na Sprint 1

Não existe API interna funcional. Controllers, services e módulos NestJS estão vazios, e o frontend não realiza `fetch`, Axios ou outra chamada HTTP para dados de negócio.

Os caminhos `/services` e `/metrics/{id_servico}` aparecem no backlog como interfaces externas esperadas. Eles ainda não constituem um contrato validado.

## Contratos a confirmar na Sprint 2

| Integração | Questões mínimas antes de implementar | Issues |
|---|---|---|
| Lista de serviços | URL/base, autenticação, identificador, nome, paginação, lista vazia, duplicação e erros | #29, #30 |
| Métricas por serviço | CPU, memória, disco, rede, unidades, período, timestamp, ausência e timeout | #31, #36, #37 |
| Intensidade de carbono | Região, fonte, unidade, timestamp, validade e indisponibilidade | #38 |

## API interna planejada

Rotas internas ainda não foram definidas. Antes de publicá-las, a equipe deve registrar:

- método e caminho;
- parâmetros e validações;
- payload de sucesso com tipos/unidades;
- erros e códigos HTTP;
- autenticação/autorização;
- exemplos reproduzíveis;
- vínculo com requisito, issue e teste.

Nenhum exemplo fictício é apresentado aqui como contrato para evitar que uma hipótese seja confundida com a API entregue.

## Critério para atualizar este documento

Este arquivo deve ser atualizado junto do primeiro endpoint executável e apontar para testes ou coleção de requisições. Até lá, os itens de API devem permanecer abertos.
