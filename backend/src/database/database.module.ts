import { Module, Global } from '@nestjs/common';
import { DrizzleProvider, DRIZZLE_PROVIDER } from './drizzle.provider';
import { IntervalosConfigService } from './intervalos-config.service';

@Global()
@Module({
  providers: [DrizzleProvider, IntervalosConfigService],
  exports: [DRIZZLE_PROVIDER, IntervalosConfigService],
})
export class DatabaseModule {}
