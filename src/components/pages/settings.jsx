const React = require('react');
const Page = require('../page.jsx');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const Input = require('antd/lib/input');
const Button = require('antd/lib/button');
const message = require('antd/lib/message');
const PageHeader = require('../page-header.jsx');
const PageFooter = require('../page-footer.jsx');
const PageContent = require('../page-content.jsx');
const { inject } = require('../container-context.jsx');
const { settingsShape } = require('../../ui/default-prop-types');
const SettingApiClient = require('../../services/setting-api-client');

class Settings extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
    this.state = {
      settings: props.initialState
    };
  }

  handleLandingPageDocumentIdChange(event) {
    const value = event.target.value || null;
    this.setState(prevState => ({
      ...prevState,
      settings: {
        ...prevState.settings,
        landingPageDocumentId: value
      }
    }));
  }

  async handleSaveClick() {
    const { settings } = this.state;
    const { settingApiClient } = this.props;
    try {
      await settingApiClient.saveSettings({ settings });
    } catch (err) {
      message.error(err.message);
    }
  }

  render() {
    const { settings } = this.state;

    return (
      <Page>
        <PageHeader />
        <PageContent>
          <div className="SettingPage">
            <h1>Einstellungen</h1>
            <div className="SettingPage-formItem">
              <label className="SettingPage-formItemLabel">Landing-Page-ID</label>
              <Input className="SettingPage-formItemInput" value={settings.landingPageDocumentId || ''} onChange={this.handleLandingPageDocumentIdChange} />
            </div>
            <div className="SettingPage-submitButton">
              <Button onClick={this.handleSaveClick} type="primary">Speichern</Button>
            </div>
          </div>
        </PageContent>
        <PageFooter />
      </Page>
    );
  }
}

Settings.propTypes = {
  initialState: settingsShape.isRequired,
  settingApiClient: PropTypes.instanceOf(SettingApiClient).isRequired
};

module.exports = inject({
  settingApiClient: SettingApiClient
}, Settings);