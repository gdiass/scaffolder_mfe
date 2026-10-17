import { CanActivate, ExecutionContext, Inject, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { APP_CONFIG, type AppConfig } from '../config/app.config';
import { SHELL_PUBLIC_KEY } from './shell-auth.decorators';
import type { ShellUser } from './shell-auth.types';

interface ShellMeResponse { user?: Partial<ShellUser>; }

@Injectable()
export class ShellAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, @Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(SHELL_PUBLIC_KEY, [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest<Request>();
    const headers: Record<string, string> = {};
    if (request.headers.cookie) headers.cookie = request.headers.cookie;
    if (request.headers.authorization) headers.authorization = request.headers.authorization;
    if (!headers.cookie && !headers.authorization) throw new UnauthorizedException('Autenticação necessária.');

    let response: Response;
    try {
      response = await fetch(`${this.config.shellBaseUrl}/api/v1/auth/me`, { headers, signal: AbortSignal.timeout(5_000) });
    } catch {
      throw new ServiceUnavailableException('Não foi possível validar a identidade no Shell.');
    }
    if (response.status === 401 || response.status === 403) throw new UnauthorizedException('Identidade inválida.');
    if (!response.ok) throw new ServiceUnavailableException('O Shell não pôde validar a identidade.');
    const payload = (await response.json()) as ShellMeResponse;
    const user = payload.user;
    if (!user || typeof user.id !== 'string' || typeof user.name !== 'string' || typeof user.email !== 'string' || !['USER', 'ADMIN'].includes(user.role ?? '')) {
      throw new ServiceUnavailableException('O Shell retornou uma identidade inválida.');
    }
    (request as Request & { shellUser?: ShellUser }).shellUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as ShellUser['role'],
    };
    return true;
  }
}