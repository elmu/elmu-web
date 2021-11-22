import url from 'url';
import path from 'path';
import parseBool from 'parseboolean';
import educandu from '@educandu/educandu';
import Logger from '@educandu/educandu/common/logger.js';

const logger = new Logger(import.meta.url);

// eslint-disable-next-line no-process-env
const processEnv = process.env;

const thisDir = path.dirname(url.fileURLToPath(import.meta.url));

const env = processEnv.ELMU_ENV || 'dev';

logger.info('Environment is set to %s', env);

const config = {
  port: Number(processEnv.ELMU_PORT) || 3000,
  publicFolders: ['../dist', '../static'].map(x => path.resolve(thisDir, x)),
  sessionDurationInMinutes: Number(processEnv.ELMU_SESSION_DURATION_IN_MINUTES) || 60,
  skipMongoMigrations: parseBool(processEnv.ELMU_SKIP_DB_MIGRATIONS || false.toString()),
  skipMongoChecks: parseBool(processEnv.ELMU_SKIP_DB_CHECKS || false.toString())
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
  config.emailSenderAddress = 'elmu-test@test.com';
  config.smtpOptions = 'smtp://localhost:8025/?ignoreTLS=true';
  config.initialUser = {
    username: 'test',
    password: 'test',
    email: 'test@test.com'
  };
  config.exposeErrorDetails = true;
} else {
  config.mongoConnectionString = processEnv.ELMU_WEB_CONNECTION_STRING;
  config.cdnEndpoint = processEnv.ELMU_CDN_ENDPOINT;
  config.cdnRegion = processEnv.ELMU_CDN_REGION;
  config.cdnAccessKey = processEnv.ELMU_CDN_ACCESS_KEY;
  config.cdnSecretKey = processEnv.ELMU_CDN_SECRET_KEY;
  config.cdnBucketName = processEnv.ELMU_CDN_BUCKET_NAME;
  config.cdnRootUrl = processEnv.ELMU_CDN_ROOT_URL;
  config.sessionSecret = processEnv.ELMU_SESSION_SECRET;
  config.emailSenderAddress = 'website@elmu.online';
  config.smtpOptions = JSON.parse(processEnv.ELMU_SMTP_OPTIONS);
  config.initialUser = null;
  config.exportApiKey = processEnv.ELMU_EXPORT_API_KEY;
  config.importSources = JSON.parse(processEnv.ELMU_IMPORT_SOURCES || '[]');
}

educandu(config);
