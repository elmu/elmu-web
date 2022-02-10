import del from 'del';
import gulp from 'gulp';
import { promises as fs } from 'fs';
import Graceful from 'node-graceful';
import realFavicon from 'gulp-real-favicon';
import {
  cliArgs,
  esbuild,
  eslint,
  getEnvAsString,
  less,
  LoadBalancedNodeProcessGroup,
  MaildevContainer,
  MinioContainer,
  MongoContainer,
  NodeProcess,
  TunnelProxyContainer
} from '@educandu/dev-tools';

let bundler = null;
let currentApp = null;
let currentCdnProxy = null;

const elmuEnv = {
  ELMU_WEB_CONNECTION_STRING: 'mongodb://root:rootpw@localhost:27017/dev-educandu-db?replicaSet=educandurs&authSource=admin',
  ELMU_CDN_ENDPOINT: 'http://localhost:9000',
  ELMU_CDN_REGION: 'eu-central-1',
  ELMU_CDN_ACCESS_KEY: 'UVDXF41PYEAX0PXD8826',
  ELMU_CDN_SECRET_KEY: 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx',
  ELMU_CDN_BUCKET_NAME: 'dev-educandu-cdn',
  ELMU_CDN_ROOT_URL: 'http://localhost:9000/dev-educandu-cdn',
  ELMU_SESSION_SECRET: 'd4340515fa834498b3ab1aba1e4d9013',
  ELMU_SESSION_COOKIE_DOMAIN: 'localhost',
  ELMU_SESSION_COOKIE_NAME: 'SESSION_ID_ELMU_LOCAL',
  ELMU_EMAIL_SENDER_ADDRESS: 'educandu-test-app@test.com',
  ELMU_SMTP_OPTIONS: 'smtp://127.0.0.1:8025/?ignoreTLS=true',
  ELMU_INITIAL_USER: JSON.stringify({ username: 'test', password: 'test', email: 'test@test.com' }),
  ELMU_EXPOSE_ERROR_DETAILS: true.toString(),
  ELMU_ARE_ROOMS_ENABLED: false.toString(),
  ELMU_IMPORT_SOURCES: JSON.stringify([{ name: 'Open Music Academy - integration', hostName: 'integration.openmusic.academy', apiKey: '9e88fd8288ed4738813aaf764df005c4' }]),
  ELMU_SKIP_MAINTENANCE: false.toString()
};

const mongoContainer = new MongoContainer({
  port: 27017,
  rootUser: 'root',
  rootPassword: 'rootpw',
  replicaSetName: 'educandurs'
});

const minioContainer = new MinioContainer({
  port: 9000,
  accessKey: 'UVDXF41PYEAX0PXD8826',
  secretKey: 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx',
  initialBuckets: ['dev-educandu-cdn']
});

const maildevContainer = new MaildevContainer({
  smtpPort: 8025,
  frontendPort: 8000
});

Graceful.on('exit', async () => {
  bundler?.rebuild?.dispose();
  await currentApp?.waitForExit();
  await currentCdnProxy?.waitForExit();
});

export async function clean() {
  await del(['dist']);
}

export async function lint() {
  await eslint.lint(['*.js', 'src/**/*.js'], { failOnError: !currentApp });
}

export async function fix() {
  await eslint.fix(['*.js', 'src/**/*.js']);
}

export async function buildCss() {
  await less.compile({
    inputFile: './src/main.less',
    outputFile: './dist/main.css',
    optimize: true
  });
}

export async function buildJs() {
  if (bundler?.rebuild) {
    await bundler.rebuild();
  } else {
    // eslint-disable-next-line require-atomic-updates
    bundler = await esbuild.bundle({
      entryPoints: ['./src/bundles/main.js'],
      outdir: './dist',
      minify: true,
      incremental: !!currentApp,
      inject: ['./src/polyfills.js'],
      metaFilePath: './dist/meta.json'
    });
  }
}

export const build = gulp.parallel(buildCss, buildJs);

export function faviconGenerate(done) {
  realFavicon.generateFavicon({
    masterPicture: 'favicon.png',
    dest: 'static',
    iconsPath: '/',
    design: {
      ios: {
        pictureAspect: 'backgroundAndMargin',
        backgroundColor: '#ffffff',
        margin: '14%',
        assets: {
          ios6AndPriorIcons: false,
          ios7AndLaterIcons: false,
          precomposedIcons: false,
          declareOnlyDefaultIcon: true
        },
        appName: 'elmu'
      },
      desktopBrowser: {},
      windows: {
        pictureAspect: 'noChange',
        backgroundColor: '#2b5797',
        onConflict: 'override',
        assets: {
          windows80Ie10Tile: false,
          windows10Ie11EdgeTiles: {
            small: false,
            medium: true,
            big: false,
            rectangle: false
          }
        },
        appName: 'elmu'
      },
      androidChrome: {
        pictureAspect: 'backgroundAndMargin',
        margin: '17%',
        backgroundColor: '#ffffff',
        themeColor: '#ffffff',
        manifest: {
          name: 'elmu',
          display: 'standalone',
          orientation: 'notSet',
          onConflict: 'override',
          declared: true
        },
        assets: {
          legacyIcon: false,
          lowResolutionIcons: false
        }
      },
      safariPinnedTab: {
        pictureAspect: 'blackAndWhite',
        threshold: 71.09375,
        themeColor: '#5bbad5'
      }
    },
    settings: {
      scalingAlgorithm: 'Mitchell',
      errorOnImageTooSmall: true,
      readmeFile: false,
      htmlCodeFile: false,
      usePathAsIs: false
    },
    versioning: {
      paramName: 'v',
      paramValue: 'cakfaagb'
    },
    markupFile: 'favicon-data.json'
  }, async () => {
    const faviconData = await fs.readFile('favicon-data.json', 'utf8');
    const faviconDataPrettified = JSON.stringify(JSON.parse(faviconData), null, 2);
    await fs.writeFile('favicon-data.json', faviconDataPrettified, 'utf8');
    done();
  });
}

export async function faviconCheckUpdate(done) {
  const faviconData = await ('favicon-data.json', 'utf8');
  const currentVersion = JSON.parse(faviconData).version;
  realFavicon.checkForUpdates(currentVersion, done);
}

export async function maildevUp() {
  await maildevContainer.ensureIsRunning();
}

export async function maildevDown() {
  await maildevContainer.ensureIsRemoved();
}

export async function mongoUp() {
  await mongoContainer.ensureIsRunning();
}

export async function mongoDown() {
  await mongoContainer.ensureIsRemoved();
}

export async function minioUp() {
  await minioContainer.ensureIsRunning();
}

export async function minioDown() {
  await minioContainer.ensureIsRemoved();
}

export async function startServer() {
  const { instances, tunnel } = cliArgs;

  const tunnelToken = tunnel ? getEnvAsString('TUNNEL_TOKEN') : null;
  const tunnelWebsiteDomain = tunnel ? getEnvAsString('TUNNEL_WEBSITE_DOMAIN') : null;
  const tunnelWebsiteCdnDomain = tunnel ? getEnvAsString('TUNNEL_WEBSITE_CDN_DOMAIN') : null;

  if (tunnel) {
    // eslint-disable-next-line no-console
    console.log('Opening tunnel connections');
    const websiteTunnel = new TunnelProxyContainer({
      name: 'website-tunnel',
      tunnelToken,
      tunnelDomain: tunnelWebsiteDomain,
      localPort: 3000
    });

    const websiteCdnTunnel = new TunnelProxyContainer({
      name: 'website-cdn-tunnel',
      tunnelToken,
      tunnelDomain: tunnelWebsiteCdnDomain,
      localPort: 10000
    });

    await Promise.all([
      websiteTunnel.ensureIsRunning(),
      websiteCdnTunnel.ensureIsRunning()
    ]);

    Graceful.on('exit', async () => {
      // eslint-disable-next-line no-console
      console.log('Closing tunnel connections');
      await Promise.all([
        websiteTunnel.ensureIsRemoved(),
        websiteCdnTunnel.ensureIsRemoved()
      ]);
    });
  }

  const finalElmuEnv = {
    NODE_ENV: 'development',
    ...elmuEnv,
    ELMU_CDN_ROOT_URL: tunnel ? `https://${tunnelWebsiteCdnDomain}` : 'http://localhost:10000',
    ELMU_SESSION_COOKIE_DOMAIN: tunnel ? tunnelWebsiteDomain : elmuEnv.ELMU_SESSION_COOKIE_DOMAIN
  };

  currentCdnProxy = new NodeProcess({
    script: 'node_modules/@educandu/rooms-auth-lambda/src/dev-server/run.js',
    env: {
      NODE_ENV: 'development',
      PORT: 10000,
      WEBSITE_BASE_URL: tunnel ? `https://${tunnelWebsiteDomain}` : 'http://localhost:3000',
      CDN_BASE_URL: 'http://localhost:9000/dev-educandu-cdn',
      SESSION_COOKIE_NAME: elmuEnv.ELMU_SESSION_COOKIE_DOMAIN
    }
  });

  if (instances > 1) {
    currentApp = new LoadBalancedNodeProcessGroup({
      script: 'src/index.js',
      jsx: true,
      loadBalancerPort: 3000,
      getNodeProcessPort: index => 4000 + index,
      instanceCount: cliArgs.instances,
      getInstanceEnv: index => ({
        ...finalElmuEnv,
        ELMU_PORT: (4000 + index).toString()
      })
    });
  } else {
    currentApp = new NodeProcess({
      script: 'src/index.js',
      jsx: true,
      env: {
        ...finalElmuEnv,
        ELMU_PORT: (3000).toString()
      }
    });
  }

  await Promise.all([
    currentCdnProxy.start(),
    currentApp.start()
  ]);
}

export async function restartServer() {
  await currentApp.restart({
    ELMU_SKIP_MAINTENANCE: true.toString()
  });
}

export const up = gulp.parallel(mongoUp, minioUp, maildevUp);

export const down = gulp.parallel(mongoDown, minioDown, maildevDown);

export const serve = gulp.series(gulp.parallel(up, build), startServer);

export const verify = gulp.series(lint, build);

export function setupWatchers(done) {
  gulp.watch(['src/**/*.{js,json}'], gulp.series(buildJs, restartServer));
  gulp.watch(['src/**/*.less'], buildCss);
  done();
}

export const startWatch = gulp.series(serve, setupWatchers);

export default startWatch;
