import { Module } from '@nestjs/common';
import { ServidoresModule } from '@/module/servidores/servidores.module';
import { CarbonModule } from '@/module/carbon/carbon.module';
import { ImpactModule } from '@/module/impact/impact.module';

@Module({
  imports: [ServidoresModule, CarbonModule, ImpactModule],
})
export class AppModule {} 