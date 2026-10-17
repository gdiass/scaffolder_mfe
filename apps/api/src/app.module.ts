import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ProblemDetailsFilter } from './common/filters/problem-details.filter';
import { ErrorMonitoringService } from './common/observability/error-monitoring.service';
import { HttpLoggingInterceptor } from './common/observability/logging.interceptor';
import { RequestIdMiddleware } from './common/observability/request-id.middleware';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './tasks/tasks.module';
import { ShellAuthModule } from './shell-auth/shell-auth.module';

@Module({
  imports: [PrismaModule, ShellAuthModule, TasksModule],
  controllers: [HealthController],
  providers: [
    ErrorMonitoringService,
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
    { provide: APP_INTERCEPTOR, useClass: HttpLoggingInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
