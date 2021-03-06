import mem from 'mem';
import PropTypes from 'prop-types';
import { ConfigProvider } from 'antd';
import enUS from 'antd/lib/locale/en_US';
import deDE from 'antd/lib/locale/de_DE';
import { I18nextProvider } from 'react-i18next';
import { useService } from './container-context';
import ResourceManager from '../resources/resource-manager';
import React, { useState, useEffect, useContext } from 'react';
import {
  SUPPORTED_UI_LANGUAGES,
  UI_LANGUAGE_EN,
  UI_LANGUAGE_DE,
  UI_LANGUAGE_COOKIE_NAME,
  UI_LANGUAGE_COOKIE_EXPIRES,
  getLocale
} from '../resources/ui-language';

const languageContext = React.createContext();

const ActualLanguageProvider = languageContext.Provider;

function createI18n(resourceManager, language) {
  return resourceManager.createI18n(language);
}

function determineAntdLocale(language) {
  switch (language) {
    case UI_LANGUAGE_EN: return enUS;
    case UI_LANGUAGE_DE: return deDE;
    default: throw new Error(`No locale data for language ${language}!`);
  }
}

function setLanguageCookie(language) {
  document.cookie = `${UI_LANGUAGE_COOKIE_NAME}=${encodeURIComponent(language)}; expires=${UI_LANGUAGE_COOKIE_EXPIRES}`;
}

const createLanguageAndLocale = mem(language => {
  const supportedLanguages = SUPPORTED_UI_LANGUAGES;
  const locale = getLocale(language);
  return { supportedLanguages, language, locale };
});

export function LanguageProvider({ value, children }) {
  const resourceManager = useService(ResourceManager);
  const [i18n] = useState(createI18n(resourceManager, value));
  const [antdLocale, setAntdLocale] = useState(determineAntdLocale(i18n.language));

  useEffect(() => {
    if (i18n && i18n.language !== value) {
      i18n.changeLanguage(value);
    }
  }, [i18n, value]);

  useEffect(() => {
    i18n.on('languageChanged', lng => {
      if (!SUPPORTED_UI_LANGUAGES.includes(lng)) {
        throw new Error(`Not a supported language: ${lng}!`);
      }
      setLanguageCookie(lng);
      setAntdLocale(determineAntdLocale(lng));
    });
    return () => i18n.off('languageChanged');
  }, [i18n]);

  return (
    <ActualLanguageProvider value={i18n.language}>
      <I18nextProvider i18n={i18n}>
        <ConfigProvider locale={antdLocale}>
          { children }
        </ConfigProvider>
      </I18nextProvider>
    </ActualLanguageProvider>
  );
}

LanguageProvider.propTypes = {
  children: PropTypes.node,
  value: PropTypes.string.isRequired
};

LanguageProvider.defaultProps = {
  children: null
};

export function useLanguage() {
  return createLanguageAndLocale(useContext(languageContext));
}

export function withLanguage(Component) {
  return function UserInjector(props) {
    const { language, locale } = useLanguage();
    return <Component {...props} language={language} locale={locale} />;
  };
}

export default {
  LanguageProvider,
  withLanguage,
  useLanguage
};
