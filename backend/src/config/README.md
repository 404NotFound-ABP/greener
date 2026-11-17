# Configuração do coletor

O coletor lê três constantes de [config.ts](config.ts). Na versão `1e075b9`, `URL_METRICS` aponta para o agregador de métricas da UniLaunch, `URL_CARBON` aponta para o provedor de fatores regionais e `INTERVALO_COLETA_SEGUNDOS` vale 30. Alterações nessas constantes exigem recompilar o backend. O período de cada medição vem separadamente do campo `collection_interval_seconds` da resposta de métricas.

Para consultar os formatos e erros esperados, use a [documentação do agregador](https://metrics.unilaunch.org/docs), a [documentação de carbono](https://carbon.unilaunch.org/docs) e os [contratos do GreenER](../../../docs/api.md).

As credenciais do banco são carregadas pelo [provider do Drizzle](../database/drizzle.provider.ts). As portas publicadas e as variáveis repassadas ao backend estão no [Docker Compose](../../../docker-compose.yml). Com esse Compose, preencher `JWT_SECRET` ou `JWT_EXPIRES_IN` no `.env` da raiz ainda não altera o container do backend. A limitação e o procedimento de execução estão no [guia da aplicação](../../../README.md).
