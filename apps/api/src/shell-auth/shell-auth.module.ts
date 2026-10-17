import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { APP_CONFIG, createAppConfig } from '../config/app.config';
import { ShellAuthGuard } from './shell-auth.guard';

@Global()
@Module({
  providers: [
    { provide: APP_CONFIG, useFactory: () => createAppConfig() },
    ShellAuthGuard,
    { provide: APP_GUARD, useExisting: ShellAuthGuard },
  ],
  exports: [APP_CONFIG],
})
export class ShellAuthModule {}