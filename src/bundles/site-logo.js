import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import routes from '@educandu/educandu/utils/routes.js';

function SiteLogo({ readonly, size }) {
  const linkClasses = classNames({
    'SiteLogo-link': true,
    'SiteLogo-link--readonly': readonly
  });

  const homeUrl = readonly ? null : routes.getHomeUrl();

  return (
    <div className="SiteLogo">
      <a href={homeUrl} className={linkClasses}>
        <span className={`SiteLogo-text SiteLogo-text--${size}`}>elmu</span>
      </a>
    </div>
  );
}

SiteLogo.propTypes = {
  readonly: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'normal'])
};

SiteLogo.defaultProps = {
  readonly: false,
  size: 'normal'
};

export default SiteLogo;
