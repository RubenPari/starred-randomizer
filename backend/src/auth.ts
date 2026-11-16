import { randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import { betterAuth } from 'better-auth';
import { Kysely, PostgresDialect } from 'kysely';
import type { Pool } from 'pg';
import { config } from './config.js';

export function createAuth(pool: Pool) {
  return betterAuth({
    appName: 'Starred Randomizer',
    baseURL: config.authUrl,
    basePath: '/api/auth',
    secret: config.authSecret,
    trustedOrigins: [config.corsOrigin],
    database: {
      db: new Kysely({ dialect: new PostgresDialect({ pool }) }),
      type: 'postgres',
      transaction: true,
    },
    user: {
      modelName: 'users',
      fields: {
        emailVerified: 'email_verified',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    },
    account: {
      modelName: 'auth_accounts',
      accountLinking: { enabled: false },
    },
    session: {
      modelName: 'auth_sessions',
      expiresIn: 60 * 60 * 24 * 7,
      cookieCache: { enabled: false },
    },
    verification: { modelName: 'auth_verifications' },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: config.minPasswordLength,
      requireEmailVerification: false,
      password: {
        hash: (password) => argon2.hash(password),
        verify: ({ hash, password }) => argon2.verify(hash, password),
      },
    },
    rateLimit: {
      enabled: true,
      storage: 'database',
      modelName: 'auth_rate_limits',
    },
    advanced: {
      disableOriginCheck: false,
      disableCSRFCheck: false,
      database: { generateId: () => randomUUID() },
      useSecureCookies: process.env.NODE_ENV === 'production',
      defaultCookieAttributes: { httpOnly: true, sameSite: 'lax', path: '/' },
      // Set by our Fastify bridge, never accepted from a client-supplied header.
      ipAddress: { ipAddressHeaders: ['x-starred-client-ip'] },
    },
  });
}
