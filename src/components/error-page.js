import React from 'react';
import urls from '../utils/urls';
import PropTypes from 'prop-types';
import { settingsProps } from '../ui/default-prop-types';

function ErrorPage({ error, settings, language, i18n }) {
  const backHtml = `<a onclick="window.history.back();">${i18n.t('common:back')}</a>`;
  return (
    <div className="ErrorPage">
      <header className="ErrorPage-headerArea">
        <div className="ErrorPage-header">
          <div className="ErrorPage-headerContent ErrorPage-headerContent--left" />
          <div className="ErrorPage-headerContent ErrorPage-headerContent--center" />
          <div className="ErrorPage-headerContent ErrorPage-headerContent--right" />
        </div>
      </header>
      <main className="ErrorPage-contentArea">
        <div className="ErrorPage-contentContainer">
          <div className="ErrorPage-content">
            <h1 className="ErrorPage-status">{error.status}</h1>
            <h1 className="ErrorPage-message">{error.displayMessage || error.message}</h1>
            <div className="ErrorPage-back" dangerouslySetInnerHTML={{ __html: backHtml }} />
            {error.expose && error.stack && <pre className="ErrorPage-stack">{error.stack}</pre>}
          </div>
        </div>
      </main>
      <footer className="ErrorPage-footer">
        <div className="ErrorPage-footerContent">
          {(settings.footerLinks?.[language] || []).map((fl, index) => (
            <span key={index.toString()} className="ErrorPage-footerLink">
              <a href={urls.getArticleUrl(fl.documentSlug)}>{fl.linkTitle}</a>
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}

ErrorPage.propTypes = {
  ...settingsProps,
  error: PropTypes.object.isRequired,
  i18n: PropTypes.object.isRequired,
  language: PropTypes.string.isRequired
};

export default ErrorPage;
