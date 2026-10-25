import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  // 1. Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Greener API')
    .setDescription('API de monitoramento e cálculo de intensidade de carbono')
    .setVersion('1.0')
    .addTag('servidores', 'Operações relacionadas aos servidores monitorados')
    .addTag('impacto-ambiental', 'Cálculo de potência, energia e emissões de CO2e')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // 2. Rota onde a documentação ficará disponível (ex: http://localhost:3000/docs)
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Aplicação rodando em: http://localhost:${port}`);
  console.log(`📄 Swagger disponível em: http://localhost:${port}/docs`);
}
bootstrap();
