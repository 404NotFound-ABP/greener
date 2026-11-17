import { Module } from '@nestjs/common';
import { ServidoresModule } from '@/module/servidores/servidores.module';
import { CarbonModule } from '@/module/carbon/carbon.module';
import { ImpactModule } from '@/module/impact/impact.module';
import { CollectorService } from './collector.service';
import { CollectorController } from './collector.controller';

@Module({
  imports: [ServidoresModule, CarbonModule, ImpactModule],
  controllers: [CollectorController],
  providers: [CollectorService],
  exports: [CollectorService],
})
export class CollectorModule {}
