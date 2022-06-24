import url from 'url';
import path from 'path';
import parseBool from 'parseboolean';
import educandu from '@educandu/educandu';
import faviconData from '../favicon-data.json';
import bundleConfig from './bundles/bundle-config.js';
import ArticlesController from './articles-controller.js';

// eslint-disable-next-line no-process-env
const processEnv = process.env;

const smtpOptions = processEnv.ELMU_SMTP_OPTIONS;

const thisDir = path.dirname(url.fileURLToPath(import.meta.url));

const disabledPlugins = (processEnv.ELMU_DISABLED_PLUGINS || '').split(',').map(x => x.trim()).filter(x => !!x);

const enabledPlugins = [
  'markdown',
  'quick-tester',
  'audio',
  'video',
  'image',
  'pdf-viewer',
  'iframe',
  'anavis',
  'image-tiles',
  'diagram-net',
  'annotation',
  'abc-notation',
  'ear-training',
  'interval-trainer',
  'interactive-media',
  'table'
].filter(x => !disabledPlugins.includes(x));

const config = {
  appName: 'ELMU',
  bundleConfig,
  port: Number(processEnv.ELMU_PORT) || 3000,
  publicFolders: ['../dist', '../static'].map(x => path.resolve(thisDir, x)),
  resources: ['./src/resource-overrides.json'].map(x => path.resolve(x)),
  sessionDurationInMinutes: Number(processEnv.ELMU_SESSION_DURATION_IN_MINUTES) || 60,
  skipMaintenance: parseBool(processEnv.ELMU_SKIP_MAINTENANCE || false.toString()),
  mongoConnectionString: processEnv.ELMU_WEB_CONNECTION_STRING,
  cdnEndpoint: processEnv.ELMU_CDN_ENDPOINT,
  cdnRegion: processEnv.ELMU_CDN_REGION,
  cdnAccessKey: processEnv.ELMU_CDN_ACCESS_KEY,
  cdnSecretKey: processEnv.ELMU_CDN_SECRET_KEY,
  cdnBucketName: processEnv.ELMU_CDN_BUCKET_NAME,
  cdnRootUrl: processEnv.ELMU_CDN_ROOT_URL,
  sessionSecret: processEnv.ELMU_SESSION_SECRET,
  sessionCookieDomain: processEnv.ELMU_SESSION_COOKIE_DOMAIN,
  sessionCookieName: processEnv.ELMU_SESSION_COOKIE_NAME,
  consentCookieNamePrefix: processEnv.ELMU_CONSENT_COOKIE_NAME_PREFIX,
  uploadLiabilityCookieName: processEnv.ELMU_UPLOAD_LIABILITY_COOKIE_NAME,
  emailSenderAddress: 'website@elmu.online',
  smtpOptions: smtpOptions.startsWith('smtp://') ? smtpOptions : JSON.parse(smtpOptions),
  initialUser: processEnv.ELMU_INITIAL_USER ? JSON.parse(processEnv.ELMU_INITIAL_USER) : null,
  exportApiKey: processEnv.ELMU_EXPORT_API_KEY,
  importSources: JSON.parse(processEnv.ELMU_IMPORT_SOURCES || '[]'),
  exposeErrorDetails: parseBool(processEnv.ELMU_EXPOSE_ERROR_DETAILS || false.toString()),
  disabledFeatures: JSON.parse(processEnv.ELMU_DISABLED_FEATURES || '[]'),
  taskProcessing: {
    isEnabled: true,
    idlePollIntervalInMs: 10000,
    maxAttempts: 3
  },
  additionalControllers: [ArticlesController],
  additionalHeadHtml: faviconData.favicon.html_code,
  areRoomsEnabled: parseBool(processEnv.ELMU_ARE_ROOMS_ENABLED || false.toString()),
  plugins: enabledPlugins,
  basicAuthUsers: JSON.parse(processEnv.ELMU_BASIC_AUTH_USERS || '{}')
};

educandu(config);
