import { createParamDecorator, SetMetadata, type ExecutionContext } from '@nestjs/common';
import type { ShellUser } from './shell-auth.types';

export const SHELL_PUBLIC_KEY = 'mfe:shell-public';
export const Public = () => SetMetadata(SHELL_PUBLIC_KEY, true);
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): ShellUser => context.switchToHttp().getRequest().shellUser,
);