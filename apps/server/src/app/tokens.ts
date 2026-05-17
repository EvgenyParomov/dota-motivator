export { MinioToken, MinioBucketToken } from '../shared/adapters/minio.js';

export const DbToken = Symbol.for('Db');
export const SqlToken = Symbol.for('Sql');
export const LoggerToken = Symbol.for('Logger');
export const EnvToken = Symbol.for('AppEnv');
export const AuthToken = Symbol.for('BetterAuth');
