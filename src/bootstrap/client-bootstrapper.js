import React from 'react';
import ReactDOM from 'react-dom';
import Root from '../components/root';
import Logger from '../common/logger';
import ClientSettings from './client-settings';
import commonBootstrapper from './common-bootstrapper';
import ResourceManager from '../resources/resource-manager';

const logger = new Logger(__filename);

export async function createContainer() {
  logger.info('Creating container');
  const container = await commonBootstrapper.createContainer();

  const clientSettings = new ClientSettings(window.__settings__);
  container.registerInstance(ClientSettings, clientSettings);

  const resourceManager = new ResourceManager(window.__resources__);
  container.registerInstance(ResourceManager, resourceManager);

  return container;
}

export async function hydrateApp(bundleConfig) {
  logger.info('Starting application');
  const props = {
    user: window.__user__,
    request: window.__request__,
    language: window.__language__,
    container: await createContainer(),
    initialState: window.__initalState__,
    PageComponent: bundleConfig[window.__pageName__]
  };

  logger.info('Hydrating application');
  ReactDOM.hydrate(
    React.createElement(Root, props),
    document.getElementById('root')
  );
}

export default {
  createContainer,
  hydrateApp
};
