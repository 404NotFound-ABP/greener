import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ServidoresController } from './servidores.controller';
import { ServidoresService } from './servidores.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 3,
    }),
  ],
  controllers: [ServidoresController],
  providers: [ServidoresService],
  exports: [ServidoresService],
})
export class ServidoresModule {}
