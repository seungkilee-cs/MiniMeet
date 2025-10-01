/**
 * JWT constants - no fallbacks for security
 * Values are validated at startup by env.validation.ts
 * If JWT_SECRET is missing, the app will fail to start
 */
export const jwtConstants = {
  secret: process.env.JWT_SECRET!,
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
};
