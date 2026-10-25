import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@/database/database.module';
import { ServidoresModule } from '@/module/servidores/servidores.module';
import { CarbonModule } from '@/module/carbon/carbon.module';
import { ImpactModule } from '@/module/impact/impact.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CollectorModule } from '@/module/collector/collector.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    ServidoresModule, 
    CarbonModule, 
    ImpactModule, 
    CollectorModule,
  ],
})
export class AppModule {} 