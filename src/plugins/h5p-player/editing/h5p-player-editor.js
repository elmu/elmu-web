/* eslint react/jsx-max-depth: 0 */

import React from 'react';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import urls from '../../../utils/urls';
import { withTranslation } from 'react-i18next';
import { UploadOutlined } from '@ant-design/icons';
import HttpClient from '../../../services/http-client';
import { Form, Input, Upload, Button, message } from 'antd';
import { inject } from '../../../components/container-context';
import ObjectMaxWidthSlider from '../../../components/object-max-width-slider';
import { sectionEditorProps, translationProps } from '../../../ui/default-prop-types';

const FormItem = Form.Item;

class H5pPlayerEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
  }

  handleMaxWidthValueChanged(value) {
    this.changeContent({ maxWidth: value });
  }

  async onCustomUpload({ file, onProgress, onSuccess }) {
    const { httpClient } = this.props;

    const hide = message.loading('Datei-Upload', 0);

    const pluginPrefix = urls.getPluginApiPathPrefix('h5p-player');
    const uploadUrl = urls.concatParts(pluginPrefix, 'upload');

    const { applicationId } = await httpClient
      .post(uploadUrl)
      .accept('json')
      .attach('file', file, file.name)
      .on('progress', onProgress)
      .then(res => res.body);

    onSuccess();
    hide();

    this.changeContent({ applicationId });
  }

  changeContent(newContentValues) {
    const { content, onContentChanged } = this.props;
    onContentChanged({ ...content, ...newContentValues });
  }

  render() {
    const { content, t } = this.props;
    const { applicationId, maxWidth } = content;

    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };

    return (
      <div>
        <Form layout="horizontal">
          <FormItem label={t('contentId')} {...formItemLayout}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Input
                value={applicationId}
                readOnly
                />
              <div style={{ flex: 'none' }}>
                <Upload
                  showUploadList={false}
                  customRequest={this.onCustomUpload}
                  >
                  <Button icon={<UploadOutlined />}>{t('chooseFile')}</Button>
                </Upload>
              </div>
            </div>
          </FormItem>
          <Form.Item label={t('maximumWidth')} {...formItemLayout}>
            <ObjectMaxWidthSlider value={maxWidth} onChange={this.handleMaxWidthValueChanged} />
          </Form.Item>
        </Form>
      </div>
    );
  }
}

H5pPlayerEditor.propTypes = {
  ...translationProps,
  ...sectionEditorProps,
  httpClient: PropTypes.instanceOf(HttpClient).isRequired
};

export default withTranslation('h5pPlayer')(inject({
  httpClient: HttpClient
}, H5pPlayerEditor));
