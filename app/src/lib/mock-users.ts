/**
 * Mock de usuários para desenvolvimento
 * Em produção, isso será substituído por consultas ao banco de dados
 */

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  tenantId: string;
  role: "admin" | "member";
}

/**
 * Usuário de teste
 * Email: admin@mesa.com
 * Senha: admin123
 * Hash gerado com bcrypt (10 rounds)
 */
export const mockUsers: User[] = [
  {
    id: "1",
    email: "admin@mesa.com",
    // Hash de "admin123"
    passwordHash: "$2b$10$pbDGHz8vQqHWQkFrQd3UDOcAeiKdjddJfx.w6PQfA2wU7BBiQzrti",
    name: "Administrador",
    tenantId: "default-tenant",
    role: "admin",
  },
];

/**
 * Busca usuário por email
 */
export function findUserByEmail(email: string): User | undefined {
  return mockUsers.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

/**
 * Busca usuário por ID
 */
export function findUserById(id: string): User | undefined {
  return mockUsers.find((user) => user.id === id);
}
