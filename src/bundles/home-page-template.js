import PropTypes from 'prop-types';
import SiteLogo from './site-logo.js';
import React, { useState } from 'react';
import PageHeader from './page-header.js';
import PageFooter from './page-footer.js';
import Markdown from '@educandu/educandu/components/markdown.js';
import ConsentDrawer from '@educandu/educandu/components/consent-drawer.js';
import { useSettings } from '@educandu/educandu/components/settings-context.js';
import UiLanguageDialog from '@educandu/educandu/components/ui-language-dialog.js';

function HomePageTemplate({ children, alerts }) {
  const settings = useSettings();
  const [isUiLanguageDialogVisible, setIsUiLanguageDialogVisible] = useState(false);

  const handleUiLanguageDialogClose = () => {
    setIsUiLanguageDialogVisible(false);
  };

  const handleUiLanguageClick = () => {
    setIsUiLanguageDialogVisible(true);
  };

  return (
    <div className="PageTemplate">
      <PageHeader fullScreen alerts={alerts} onUiLanguageClick={handleUiLanguageClick} />
      <main className="PageTemplate-contentArea PageTemplate-contentArea--fullScreen">
        <div className="PageTemplate-content PageTemplate-content--fullScreen PageTemplate-content--aboveCenter">
          <div className="HomePageTemplate-logo" >
            <SiteLogo readonly />
          </div>
          {children}
          {settings.homepageInfo && (
            <Markdown renderMedia>{settings.homepageInfo}</Markdown>
          )}
        </div>
      </main>
      <PageFooter />
      <UiLanguageDialog visible={isUiLanguageDialogVisible} onClose={handleUiLanguageDialogClose} />
      <ConsentDrawer />
    </div>
  );
}

HomePageTemplate.propTypes = {
  alerts: PropTypes.arrayOf(PropTypes.shape({
    message: PropTypes.node.isRequired,
    type: PropTypes.oneOf(['success', 'info', 'warning', 'error'])
  })),
  children: PropTypes.node
};

HomePageTemplate.defaultProps = {
  alerts: [],
  children: null
};

export default HomePageTemplate;
