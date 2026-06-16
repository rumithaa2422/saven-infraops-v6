import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../common/prisma.js';
import { env } from '../../config/env.js';
import { HttpError } from '../../common/httpError.js';

export async function loginWithPassword(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      roles: {
        include: {
          role: {
            include: { permissions: { include: { permission: true } } }
          }
        }
      }
    }
  });

  if (!user || !user.passwordHash || !user.isActive) throw new HttpError(401, 'Invalid credentials');
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new HttpError(401, 'Invalid credentials');

  const roles = user.roles.map((ur) => ur.role.name);
  const permissions = [...new Set(user.roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.code)))];

  const token = jwt.sign({ id: user.id, email: user.email, roles, permissions }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, roles, permissions }
  };
}
