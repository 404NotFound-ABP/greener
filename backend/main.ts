import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  // 1. Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Greener API')
    .setDescription('API GreenOps de monitoramento, cálculo de energia e emissões de carbono')
    .setVersion('1.0')
    .addTag(
      'Frontend - Banco de Dados',
      'Rotas otimizadas com consultas diretas ao PostgreSQL utilizadas pelo Frontend (Dashboard, Ranking, Comparativo, Histórico e Regiões)',
    )
    .addTag(
      'APIs Externas - Tempo Real',
      'Rotas de integração e consulta em tempo real às APIs externas de métricas e fatores de carbono',
    )
    .addTag(
      'Coleta e Agendamento',
      'Rotas de gerenciamento e monitoramento da coleta periódica (@nestjs/schedule) que persiste dados no banco',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Mantém estritamente as tags oficiais configuradas, removendo tags automáticas residuais
  const validTags = new Set([
    'Frontend - Banco de Dados',
    'APIs Externas - Tempo Real',
    'Coleta e Agendamento',
  ]);

  for (const pathItem of Object.values(document.paths)) {
    for (const operation of Object.values(pathItem as Record<string, any>)) {
      if (operation && Array.isArray(operation.tags)) {
        operation.tags = operation.tags.filter((tag: string) => validTags.has(tag));
      }
    }
  }

  // 2. Rota onde a documentação ficará disponível (ex: http://localhost:3000/docs)
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Aplicação rodando em: http://localhost:${port}`);
  console.log(`📄 Swagger disponível em: http://localhost:${port}/docs`);
}
bootstrap();
