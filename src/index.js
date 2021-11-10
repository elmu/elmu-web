import url from 'url';
import path from 'path';
import parseBool from 'parseboolean';
import educandu from '@educandu/educandu';
import Logger from '@educandu/educandu/common/logger.js';

const logger = new Logger(import.meta.url);

// eslint-disable-next-line no-process-env
const precessEnv = process.env;

const thisDir = path.dirname(url.fileURLToPath(import.meta.url));

const env = precessEnv.ELMU_ENV || 'dev';

logger.info('Environment is set to %s', env);

const config = {
  env,
  port: Number(precessEnv.ELMU_PORT) || 3000,
  publicFolders: ['../dist', '../static'].map(x => path.resolve(thisDir, x)),
  sessionDurationInMinutes: Number(precessEnv.ELMU_SESSION_DURATION_IN_MINUTES) || 60,
  skipMongoMigrations: parseBool(precessEnv.ELMU_SKIP_DB_MIGRATIONS || false.toString()),
  skipMongoChecks: parseBool(precessEnv.ELMU_SKIP_DB_CHECKS || false.toString())
};

if (env === 'dev') {
  config.mongoConnectionString = 'mongodb://root:rootpw@localhost:27017/dev-educandu-db?replicaSet=educandurs&authSource=admin';
  config.cdnEndpoint = 'http://localhost:9000';
  config.cdnRegion = 'eu-central-1';
  config.cdnAccessKey = 'UVDXF41PYEAX0PXD8826';
  config.cdnSecretKey = 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx';
  config.cdnBucketName = 'dev-educandu-cdn';
  config.cdnRootUrl = 'http://localhost:9000/dev-educandu-cdn';
  config.sessionSecret = 'd4340515fa834498b3ab1aba1e4d9013';
  config.smtpOptions = {
    host: 'localhost',
    port: 8025,
    ignoreTLS: true
  };
  config.initialUser = {
    username: 'test',
    password: 'test',
    email: 'test@test.com'
  };
  config.exposeErrorDetails = true;
} else {
  config.mongoConnectionString = precessEnv.ELMU_WEB_CONNECTION_STRING;
  config.cdnEndpoint = precessEnv.ELMU_CDN_ENDPOINT;
  config.cdnRegion = precessEnv.ELMU_CDN_REGION;
  config.cdnAccessKey = precessEnv.ELMU_CDN_ACCESS_KEY;
  config.cdnSecretKey = precessEnv.ELMU_CDN_SECRET_KEY;
  config.cdnBucketName = precessEnv.ELMU_CDN_BUCKET_NAME;
  config.cdnRootUrl = precessEnv.ELMU_CDN_ROOT_URL;
  config.sessionSecret = precessEnv.ELMU_SESSION_SECRET;
  config.smtpOptions = JSON.parse(precessEnv.ELMU_SMTP_OPTIONS);
  config.initialUser = null;
  config.exposeErrorDetails = false;
}

educandu(config);
