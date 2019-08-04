const React = require('react');
const Page = require('../page.jsx');
const Input = require('antd/lib/input');
const Modal = require('antd/lib/modal');
const PropTypes = require('prop-types');
const urls = require('../../utils/urls');
const Button = require('antd/lib/button');
const DocView = require('../doc-view.jsx');
const Restricted = require('../restricted.jsx');
const PageFooter = require('../page-footer.jsx');
const LoginLogout = require('../login-logout.jsx');
const PageContent = require('../page-content.jsx');
const permissions = require('../../domain/permissions');
const { docShape, sectionShape } = require('../../ui/default-prop-types');

const { Search } = Input;

function showNotImplementedNotification() {
  Modal.error({
    title: 'Leider, leider ...',
    content: '... ist ELMU noch nicht so weit, dass Sie hier komfortabel suchen können. Wir arbeiten daran ...'
  });
}

function handleNewDocumentClick() {
  document.location = urls.getDocsUrl();
}

function Index({ initialState, language }) {
  const { doc, sections } = initialState;

  return (
    <Page fullScreen>
      <Restricted to={permissions.EDIT_DOC}>
        <Button className="IndexPage-docsButton" type="primary" onClick={handleNewDocumentClick}>Zu den Dokumenten</Button>
      </Restricted>
      <PageContent fullScreen>
        <div className="IndexPage">
          <aside className="IndexPage-loginLogout">
            <LoginLogout />
          </aside>
          <h1 className="IndexPage-title">elmu</h1>
          <div className="IndexPage-search">
            <Search
              placeholder="Suchbegriff"
              enterButton="Suchen"
              size="large"
              onSearch={showNotImplementedNotification}
              />
          </div>
          {doc && sections && <DocView doc={doc} sections={sections} language={language} />}
        </div>
      </PageContent>
      <PageFooter fullScreen>
        <Button
          className="IndexPage-helpButton"
          size="large"
          icon="question-circle"
          href={urls.getArticleUrl('hilfe')}
          >
          Hilfe
        </Button>
      </PageFooter>
    </Page>
  );
}

Index.propTypes = {
  initialState: PropTypes.shape({
    doc: docShape,
    sections: PropTypes.arrayOf(sectionShape)
  }).isRequired,
  language: PropTypes.string.isRequired
};


module.exports = Index;
