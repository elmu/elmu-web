const del = require('del');
const path = require('path');
const glob = require('glob');
const gulp = require('gulp');
const jest = require('jest');
const util = require('util');
const delay = require('delay');
const execa = require('execa');
const less = require('gulp-less');
const csso = require('gulp-csso');
const gulpif = require('gulp-if');
const webpack = require('webpack');
const eslint = require('gulp-eslint');
const plumber = require('gulp-plumber');
const { spawn } = require('child_process');
const { Docker } = require('docker-cli-js');
const runSequence = require('run-sequence');
const sourcemaps = require('gulp-sourcemaps');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const TEST_MONGO_IMAGE = 'mvertes/alpine-mongo:3.4.10-0';
const TEST_MONGO_CONTAINER_NAME = 'elmu-mongo';

const TEST_MINIO_IMAGE = 'minio/minio:RELEASE.2018-06-09T03-43-35Z';
const TEST_MINIO_CONTAINER_NAME = 'elmu-minio';

const MINIO_ACCESS_KEY = 'UVDXF41PYEAX0PXD8826';
const MINIO_SECRET_KEY = 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx';

const optimize = (process.argv[2] || '').startsWith('ci') || process.argv.includes('--optimize');
const verbous = (process.argv[2] || '').startsWith('ci') || process.argv.includes('--verbous');

let server = null;
process.on('exit', () => server && server.kill());
const startServer = () => {
  server = spawn(process.execPath, ['src/index.js'], {
    env: { NODE_ENV: 'development' },
    stdio: 'inherit'
  });
};
const restartServer = done => {
  server.once('exit', () => {
    startServer();
    done();
  });
  server.kill();
};

const ensureContainerRunning = async ({ containerName, runArgs, afterRun }) => {
  const docker = new Docker();
  const data = await docker.command('ps -a');
  const container = data.containerList.find(c => c.names === containerName);
  if (!container) {
    await docker.command(`run --name ${containerName} ${runArgs}`);
    await delay(1000);
    if (afterRun) {
      await afterRun();
    }
  } else if (!container.status.startsWith('Up')) {
    await docker.command(`restart ${containerName}`);
    await delay(1000);
  }
};

const ensureContainerRemoved = async ({ containerName }) => {
  const docker = new Docker();
  await docker.command(`rm -f ${containerName}`);
  await delay(1000);
};

gulp.task('clean', () => {
  return del(['.tmp', 'dist', 'reports']);
});

gulp.task('lint', () => {
  return gulp.src(['src/**/*.{js,jsx}', '*.js', 'db-create-user', 'db-seed', 's3-seed'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(gulpif(!server, eslint.failAfterError()));
});

gulp.task('test', async () => {
  const { results } = await jest.runCLI({}, '.');
  if (!results.success) {
    throw Error(`${results.numFailedTests} test(s) failed`);
  }
});

gulp.task('test:changed', () => {
  return jest.runCLI({ onlyChanged: true }, '.');
});

gulp.task('test:watch', () => {
  return jest.runCLI({ watch: true }, '.');
});

gulp.task('bundle:css', () => {
  return gulp.src('src/styles/main.less')
    .pipe(gulpif(!!server, plumber({ errorHandler: true })))
    .pipe(sourcemaps.init())
    .pipe(less({ javascriptEnabled: true }))
    .pipe(gulpif(optimize, csso()))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});

gulp.task('bundle:js', async () => {
  const entry = glob.sync('./src/bundles/*.jsx')
    .map(bundleFile => path.basename(bundleFile, '.jsx'))
    .reduce((all, name) => ({ ...all, [name]: ['babel-polyfill', `./src/bundles/${name}.jsx`] }), {});

  const plugins = optimize
    ? [
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: '../reports/bundles.html',
        openAnalyzer: false
      })
    ]
    : [];

  const bundleConfigs = {
    entry: entry,
    output: {
      filename: '[name].js'
    },
    mode: optimize ? 'production' : 'development',
    devtool: optimize ? 'source-map' : 'cheap-module-eval-source-map',
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader'
          }
        }
      ]
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          commons: {
            test: /[\\/]node_modules[\\/](babel-polyfill|core-js|regenerator-runtime|object-assign|aurelia-.+|react(-.+)?|fbjs|prop-types)[\\/]/,
            name: 'commons',
            chunks: 'all'
          }
        }
      }
    },
    performance: {
      hints: optimize && 'warning',
      maxAssetSize: 500000,
      maxEntrypointSize: 500000
    },
    plugins: plugins
  };

  const stats = await util.promisify(webpack)(bundleConfigs);

  const minimalStatsOutput = {
    builtAt: false,
    chunks: false,
    colors: true,
    entrypoints: false,
    hash: false,
    modules: false,
    timings: false,
    version: false
  };

  /* eslint-disable-next-line no-console */
  console.log(stats.toString(verbous ? {} : minimalStatsOutput));
});

gulp.task('build', ['bundle:css', 'bundle:js']);

gulp.task('mongo:up', () => {
  return ensureContainerRunning({
    containerName: TEST_MONGO_CONTAINER_NAME,
    runArgs: `-d -p 27017:27017 ${TEST_MONGO_IMAGE}`,
    afterRun: async () => {
      await execa('./db-create-user', { stdio: 'inherit' });
      await execa('./db-seed', { stdio: 'inherit' });
    }
  });
});

gulp.task('mongo:down', () => {
  return ensureContainerRemoved({
    containerName: TEST_MONGO_CONTAINER_NAME
  });
});

gulp.task('mongo:reset', done => runSequence('mongo:down', 'mongo:up', done));

gulp.task('mongo:user', () => execa('./db-create-user', { stdio: 'inherit' }));

gulp.task('mongo:seed', () => execa('./db-seed', { stdio: 'inherit' }));

gulp.task('minio:up', () => {
  return ensureContainerRunning({
    containerName: TEST_MINIO_CONTAINER_NAME,
    runArgs: [
      '-d',
      '-p 9000:9000',
      `-e MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}`,
      `-e MINIO_SECRET_KEY=${MINIO_SECRET_KEY}`,
      '-e MINIO_BROWSER=on',
      '-e MINIO_DOMAIN=localhost',
      `${TEST_MINIO_IMAGE} server /data`
    ].join(' '),
    afterRun: async () => {
      await execa('./s3-seed', { stdio: 'inherit' });
    }
  });
});

gulp.task('minio:down', () => {
  return ensureContainerRemoved({
    containerName: TEST_MINIO_CONTAINER_NAME
  });
});

gulp.task('minio:reset', done => runSequence('minio:down', 'minio:up', done));

gulp.task('minio:seed', () => execa('./s3-seed', { stdio: 'inherit' }));

gulp.task('serve', ['mongo:up', 'minio:up', 'build'], startServer);

gulp.task('serve:restart', ['lint', 'test:changed', 'bundle:js'], restartServer);

gulp.task('ci:prepare', done => runSequence('mongo:user', 'mongo:seed', 'minio:seed', done));

gulp.task('ci', done => runSequence('clean', 'lint', 'test', 'build', done));

gulp.task('watch', ['serve'], () => {
  gulp.watch(['src/**/*.{js,jsx}'], ['serve:restart']);
  gulp.watch(['src/**/*.less'], ['bundle:css']);
  gulp.watch(['*.js'], ['lint']);
  gulp.watch(['db-create-user'], ['lint']);
  gulp.watch(['db-seed'], ['lint', 'mongo:seed']);
  gulp.watch(['s3-seed'], ['lint', 'minio:seed']);
});

gulp.task('default', ['watch']);
