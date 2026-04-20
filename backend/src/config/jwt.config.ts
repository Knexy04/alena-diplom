export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'super_secret_jwt_key_change_me',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key',
  accessExpiresIn: '15m',
  refreshExpiresIn: '7d',
};
