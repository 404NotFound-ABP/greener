import { Module } from '@nestjs/common';
import { ServidoresModule } from '@/module/servidores/servidores.module';
import { CarbonModule } from '@/module/carbon/carbon.module';
import { ImpactService } from './impact.service';
import { ImpactController } from './impact.controller';

@Module({
  imports: [ServidoresModule, CarbonModule],
  controllers: [ImpactController],
  providers: [ImpactService],
  exports: [ImpactService],
})
export class ImpactModule {}
