export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
};
