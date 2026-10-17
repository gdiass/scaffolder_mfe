import type { ShellUser } from '../shell-auth/shell-auth.types';

declare global {
  namespace Express {
    interface Request {
      shellUser?: ShellUser;
    }
  }
}

export {};
