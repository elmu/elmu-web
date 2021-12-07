import url from 'url';
import path from 'path';
import parseBool from 'parseboolean';
import educandu from '@educandu/educandu';
import bundleConfig from './bundles/bundle-config.js';

// eslint-disable-next-line no-process-env
const processEnv = process.env;

const smtpOptions = processEnv.ELMU_SMTP_OPTIONS;

const thisDir = path.dirname(url.fileURLToPath(import.meta.url));

const config = {
  bundleConfig,
  port: Number(processEnv.ELMU_PORT) || 3000,
  publicFolders: ['../dist', '../static'].map(x => path.resolve(thisDir, x)),
  sessionDurationInMinutes: Number(processEnv.ELMU_SESSION_DURATION_IN_MINUTES) || 60,
  skipMongoMigrations: parseBool(processEnv.ELMU_SKIP_DB_MIGRATIONS || false.toString()),
  skipMongoChecks: parseBool(processEnv.ELMU_SKIP_DB_CHECKS || false.toString()),
  mongoConnectionString: processEnv.ELMU_WEB_CONNECTION_STRING,
  cdnEndpoint: processEnv.ELMU_CDN_ENDPOINT,
  cdnRegion: processEnv.ELMU_CDN_REGION,
  cdnAccessKey: processEnv.ELMU_CDN_ACCESS_KEY,
  cdnSecretKey: processEnv.ELMU_CDN_SECRET_KEY,
  cdnBucketName: processEnv.ELMU_CDN_BUCKET_NAME,
  cdnRootUrl: processEnv.ELMU_CDN_ROOT_URL,
  sessionSecret: processEnv.ELMU_SESSION_SECRET,
  emailSenderAddress: 'website@elmu.online',
  smtpOptions: smtpOptions.startsWith('smtp://') ? smtpOptions : JSON.parse(smtpOptions),
  initialUser: processEnv.ELMU_INITIAL_USER ? JSON.parse(processEnv.ELMU_INITIAL_USER) : null,
  exportApiKey: processEnv.ELMU_EXPORT_API_KEY,
  importSources: JSON.parse(processEnv.ELMU_IMPORT_SOURCES || '[]'),
  exposeErrorDetails: parseBool(processEnv.ELMU_EXPOSE_ERROR_DETAILS || false.toString()),
  disabledFeatures: JSON.parse(processEnv.ELMU_DISABLED_FEATURES || '[]')
};

educandu(config);
