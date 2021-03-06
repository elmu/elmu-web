import React from 'react';
import Page from '../page';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import urls from '../../utils/urls';
import ElmuLogo from '../elmu-logo';
import Countdown from '../countdown';
import Logger from '../../common/logger';
import { inject } from '../container-context';
import errorHelper from '../../ui/error-helper';
import { withSettings } from '../settings-context';
import { withLanguage } from '../language-context';
import { Form, Input, Button, Checkbox } from 'antd';
import { withTranslation, Trans } from 'react-i18next';
import UserApiClient from '../../services/user-api-client';
import { languageProps, settingsProps, translationProps } from '../../ui/default-prop-types';
import { CREATE_USER_RESULT_SUCCESS, CREATE_USER_RESULT_DUPLICATE_EMAIL, CREATE_USER_RESULT_DUPLICATE_USERNAME } from '../../domain/user-management';

const logger = new Logger(__filename);

const FormItem = Form.Item;

class Register extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.formRef = React.createRef();
    this.state = {
      user: null,
      forbiddenEmails: [],
      forbiddenUsernames: []
    };
  }

  async register({ username, password, email }) {
    try {
      const { userApiClient } = this.props;
      const { result, user } = await userApiClient.register({ username, password, email });
      switch (result) {
        case CREATE_USER_RESULT_SUCCESS:
          this.setState({ user });
          break;
        case CREATE_USER_RESULT_DUPLICATE_EMAIL:
          this.setState(prevState => ({ forbiddenEmails: [...prevState.forbiddenEmails, email.toLowerCase()] }));
          this.formRef.current.validateFields(['email'], { force: true });
          break;
        case CREATE_USER_RESULT_DUPLICATE_USERNAME:
          this.setState(prevState => ({ forbiddenUsernames: [...prevState.forbiddenUsernames, username.toLowerCase()] }));
          this.formRef.current.validateFields(['username'], { force: true });
          break;
        default:
          throw new Error(`Unknown result: ${result}`);
      }
    } catch (error) {
      errorHelper.handleApiError(error, logger);
    }
  }

  handleFinish(values) {
    const { username, password, email } = values;
    this.register({ username, password, email });
  }

  render() {
    const { settings, language, t } = this.props;
    const { user } = this.state;

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    };

    const tailFormItemLayout = {
      wrapperCol: {
        xs: {
          span: 24,
          offset: 0
        },
        sm: {
          span: 16,
          offset: 8
        }
      }
    };

    const usernameValidationRules = [
      {
        required: true,
        message: t('enterUsername'),
        whitespace: true
      },
      {
        validator: (rule, value) => {
          const { forbiddenUsernames } = this.state;
          return value && forbiddenUsernames.includes(value.toLowerCase())
            ? Promise.reject(new Error(t('usernameIsInUse')))
            : Promise.resolve();
        }
      }
    ];

    const emailValidationRules = [
      {
        required: true,
        message: t('enterEmail')
      },
      {
        type: 'email',
        message: t('emailIsInvalid')
      },
      {
        validator: (rule, value) => {
          const { forbiddenEmails } = this.state;
          return value && forbiddenEmails.includes(value.toLowerCase())
            ? Promise.reject(new Error(t('emailIsInUse')))
            : Promise.resolve();
        }
      }
    ];

    const passwordValidationRules = [
      {
        required: true,
        message: t('enterPassword')
      }
    ];

    const passwordConfirmationValidationRules = [
      {
        required: true,
        message: t('confirmPassword')
      },
      ({ getFieldValue }) => ({
        validator: (rule, value) => {
          const otherPassword = getFieldValue('password');
          return value && value !== otherPassword
            ? Promise.reject(new Error(t('passwordsDoNotMatch')))
            : Promise.resolve();
        }
      })
    ];

    const agreementValidationRules = [
      {
        required: true,
        message: t('confirmTerms')
      }
    ];

    const registrationForm = (
      <div className="RegisterPage-form">
        <Form ref={this.formRef} onFinish={this.handleFinish} scrollToFirstError>
          <FormItem {...formItemLayout} label={t('userName')} name="username" rules={usernameValidationRules}>
            <Input />
          </FormItem>
          <FormItem {...formItemLayout} label={t('email')} name="email" rules={emailValidationRules}>
            <Input />
          </FormItem>
          <FormItem {...formItemLayout} label={t('password')} name="password" rules={passwordValidationRules}>
            <Input type="password" />
          </FormItem>
          <FormItem {...formItemLayout} label={t('passwordConfirmation')} name="confirm" rules={passwordConfirmationValidationRules} dependencies={['password']}>
            <Input type="password" />
          </FormItem>
          <FormItem {...tailFormItemLayout} name="agreement" valuePropName="checked" rules={agreementValidationRules}>
            <Checkbox>
              <Trans
                t={t}
                i18nKey="termsAndConditionsConfirmation"
                components={[
                  <a
                    key="terms-link"
                    title={settings.termsPage?.[language]?.linkTitle || null}
                    href={settings.termsPage?.[language]?.documentSlug ? urls.getArticleUrl(settings.termsPage[language].documentSlug) : '#'}
                    />
                ]}
                />
            </Checkbox>
          </FormItem>
          <FormItem {...tailFormItemLayout}>
            <Button type="primary" htmlType="submit">{t('register')}</Button>
          </FormItem>
        </Form>
      </div>
    );

    const registrationConfirmation = (
      <div className="RegisterPage-confirmation">
        <p>{t('registrationInProgress')}</p>
        <Countdown
          seconds={10}
          isRunning={!!user}
          onComplete={() => {
            window.location = urls.getLoginUrl();
          }}
          >
          {seconds => (
            <Trans
              t={t}
              i18nKey="redirectMessage"
              values={{ seconds }}
              components={[<a key="login-link" href={urls.getLoginUrl()} />]}
              />
          )}
        </Countdown>
      </div>
    );

    return (
      <Page fullScreen>
        <div className="RegisterPage">
          <div className="RegisterPage-title">
            <ElmuLogo size="big" readonly />
          </div>
          {user ? registrationConfirmation : registrationForm}
        </div>
      </Page>
    );
  }
}

Register.propTypes = {
  ...settingsProps,
  ...languageProps,
  ...translationProps,
  userApiClient: PropTypes.instanceOf(UserApiClient).isRequired
};

export default withTranslation('register')(withSettings(withLanguage(inject({
  userApiClient: UserApiClient
}, Register))));
