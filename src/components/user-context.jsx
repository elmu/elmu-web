const React = require('react');

const { useContext } = React;

const userContext = React.createContext();

function withUser(Component) {
  return function UserInjector(props) {
    const user = useContext(userContext);
    return <Component {...props} user={user} />;
  };
}

module.exports = {
  UserProvider: userContext.Provider,
  withUser: withUser
};
