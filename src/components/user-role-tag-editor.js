import React from 'react';
import { Tag } from 'antd';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import { userShape } from './../ui/default-prop-types';

const COLOR_RED_10 = '#5c0011';

const { CheckableTag } = Tag;

class UserRoleTagEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
  }

  handleRoleChange() {
    const { user, roleName, onRoleChange } = this.props;
    let newRoles;
    if (user.roles.includes(roleName)) {
      newRoles = user.roles.filter(x => x !== roleName);
    } else {
      newRoles = [...user.roles, roleName];
    }
    onRoleChange(user, newRoles);
  }

  render() {
    const { roleName, isReadonly, user } = this.props;
    return isReadonly
      ? <Tag key={roleName} color={user.roles.includes(roleName) ? COLOR_RED_10 : null}>{roleName}</Tag>
      : <CheckableTag key={roleName} checked={user.roles.includes(roleName)} onChange={this.handleRoleChange}>{roleName}</CheckableTag>;
  }
}

UserRoleTagEditor.propTypes = {
  isReadonly: PropTypes.bool.isRequired,
  onRoleChange: PropTypes.func.isRequired,
  roleName: PropTypes.string.isRequired,
  user: userShape.isRequired
};

export default UserRoleTagEditor;
