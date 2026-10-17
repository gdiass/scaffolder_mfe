export interface ShellUser {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}