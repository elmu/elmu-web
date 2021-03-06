import PropTypes from 'prop-types';
import { withUser } from './user-context';
import permissions from '../domain/permissions';
import { userProps } from '../ui/default-prop-types';

function Restricted({ to, user, children }) {
  if (!to) {
    return children;
  }

  const permissionsToCheck = Array.isArray(to) ? to : [to];
  const allPermissionsGranted = permissionsToCheck.every(perm => permissions.hasUserPermission(user, perm));
  return allPermissionsGranted ? children : null;
}

Restricted.propTypes = {
  ...userProps,
  children: PropTypes.node,
  to: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ])
};

Restricted.defaultProps = {
  children: null
};

export default withUser(Restricted);
