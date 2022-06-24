import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import SiteLogo from './site-logo.js';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Dropdown, Menu } from 'antd';
import { QuestionOutlined } from '@ant-design/icons';
import routes from '@educandu/educandu/utils/routes.js';
import Login from '@educandu/educandu/components/login.js';
import { useUser } from '@educandu/educandu/components/user-context.js';
import ClientConfig from '@educandu/educandu/bootstrap/client-config.js';
import { FEATURE_TOGGLES } from '@educandu/educandu/domain/constants.js';
import { useLocale } from '@educandu/educandu/components/locale-context.js';
import { useService } from '@educandu/educandu/components/container-context.js';
import { useSettings } from '@educandu/educandu/components/settings-context.js';
import HomeIcon from '@educandu/educandu/components/icons/main-menu/home-icon.js';
import MenuIcon from '@educandu/educandu/components/icons/main-menu/menu-icon.js';
import UsersIcon from '@educandu/educandu/components/icons/main-menu/users-icon.js';
import LogoutIcon from '@educandu/educandu/components/icons/main-menu/logout-icon.js';
import ImportsIcon from '@educandu/educandu/components/icons/main-menu/imports-icon.js';
import LanguageIcon from '@educandu/educandu/components/icons/main-menu/language-icon.js';
import SettingsIcon from '@educandu/educandu/components/icons/main-menu/settings-icon.js';
import permissions, { hasUserPermission } from '@educandu/educandu/domain/permissions.js';
import DocumentsIcon from '@educandu/educandu/components/icons/main-menu/documents-icon.js';
import DashboardIcon from '@educandu/educandu/components/icons/main-menu/dashboard-icon.js';

function PageHeader({ fullScreen, alerts, onUiLanguageClick }) {
  const user = useUser();
  const settings = useSettings();
  const { uiLanguage } = useLocale();
  const { t } = useTranslation('page');
  const clientConfig = useService(ClientConfig);
  const helpPage = settings?.helpPage?.[uiLanguage];

  const pageMenuItems = [
    {
      key: 'home',
      label: t('pageNames:home'),
      icon: <HomeIcon />,
      onClick: () => { window.location = routes.getHomeUrl(); },
      showWhen: true
    },
    {
      key: 'dashboard',
      label: t('pageNames:dashboard'),
      icon: <DashboardIcon />,
      onClick: () => { window.location = routes.getDashboardUrl(); },
      showWhen: !!user
    },
    {
      key: 'docs',
      label: t('pageNames:docs'),
      icon: <DocumentsIcon />,
      onClick: () => { window.location = routes.getDocsUrl(); },
      showWhen: hasUserPermission(user, permissions.VIEW_DOCS)
    },
    {
      key: 'users',
      label: t('pageNames:users'),
      icon: <UsersIcon />,
      onClick: () => { window.location = routes.getUsersUrl(); },
      showWhen: hasUserPermission(user, permissions.EDIT_USERS)
    },
    {
      key: 'admin',
      label: t('pageNames:admin'),
      icon: <SettingsIcon />,
      onClick: () => { window.location = routes.getAdminUrl(); },
      showWhen: hasUserPermission(user, permissions.ADMIN)
    },
    {
      key: 'import',
      label: t('pageNames:imports'),
      icon: <ImportsIcon />,
      onClick: () => { window.location = routes.getImportsUrl(); },
      showWhen: hasUserPermission(user, permissions.MANAGE_IMPORT) && !clientConfig.disabledFeatures.includes(FEATURE_TOGGLES.import)
    },
    {
      key: 'help',
      label: helpPage?.linkTitle,
      icon: <QuestionOutlined />,
      onClick: () => { window.location = helpPage ? routes.getDocUrl({ key: helpPage.documentKey }) : ''; },
      showWhen: !!helpPage
    },
    {
      key: 'ui-language',
      label: t('common:language'),
      icon: <LanguageIcon />,
      onClick: () => onUiLanguageClick(),
      showWhen: true
    },
    {
      key: 'logout',
      label: t('common:logout'),
      icon: <LogoutIcon />,
      onClick: () => { window.location = routes.getLogoutUrl(); },
      showWhen: !!user
    }
  ].filter(item => item.showWhen);

  const handleMenuItemClick = ({ key }) => {
    const clickedItem = pageMenuItems.find(item => item.key === key);
    clickedItem.onClick();
  };

  const menuItems = pageMenuItems.map(({ key, label, icon }) => ({ key, label, icon }));

  const menu = <Menu items={menuItems} onClick={handleMenuItemClick} />;

  const pageHeaderAreaClasses = classNames({
    'PageHeader': true,
    'PageHeader--fullScreen': fullScreen
  });

  return (
    <header className={pageHeaderAreaClasses}>
      <div className="PageHeader-header">
        <div className="PageHeader-headerContent PageHeader-headerContent--left">
          {!fullScreen && <SiteLogo size="small" />}
        </div>
        <div className="PageHeader-headerContent PageHeader-headerContent--right">
          <div className="PageHeader-loginButton">
            <Login />
          </div>
          <Dropdown overlay={menu} placement="bottomRight" trigger={['click']} arrow={{ pointAtCenter: true }}>
            <Button className="PageHeader-headerButton" icon={<MenuIcon />} type="link" />
          </Dropdown>
        </div>
      </div>
      {!fullScreen && alerts && alerts.map((alert, index) => (
        <Alert
          key={index.toString()}
          message={alert.message}
          type="info"
          banner
          closable={alert.closable || false}
          onClose={alert.onClose || (() => { })}
          />
      ))}
    </header>
  );
}

PageHeader.propTypes = {
  alerts: PropTypes.arrayOf(PropTypes.shape({
    message: PropTypes.node.isRequired,
    closable: PropTypes.bool,
    onClose: PropTypes.func
  })),
  fullScreen: PropTypes.bool,
  onUiLanguageClick: PropTypes.func
};

PageHeader.defaultProps = {
  alerts: [],
  fullScreen: false,
  onUiLanguageClick: () => {}
};

export default PageHeader;
