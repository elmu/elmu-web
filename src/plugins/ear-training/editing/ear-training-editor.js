import React from 'react';
import autoBind from 'auto-bind';
import { Form, Input, Table, Button } from 'antd';
import { inject } from '../../../components/container-context';
import ClientSettings from '../../../bootstrap/client-settings';
import EarTrainingSoundEditor from './ear-training-sound-editor';
import { swapItems, removeItem } from '../../../utils/immutable-array-utils';
import ObjectMaxWidthSlider from '../../../components/object-max-width-slider';
import { sectionEditorProps, clientSettingsProps } from '../../../ui/default-prop-types';
import { ArrowUpOutlined, ArrowDownOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const FormItem = Form.Item;
const ButtonGroup = Button.Group;

const defaultSound = { type: 'midi', url: null, text: null };

class EarTrainingEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);

    this.columns = [
      {
        width: 80,
        key: 'upDown',
        render: (upDown, item, index) => (
          <ButtonGroup>
            <Button
              data-index={index}
              disabled={index === 0}
              icon={<ArrowUpOutlined />}
              onClick={this.handleUpCircleButtonClick}
              />
            <Button
              data-index={index}
              disabled={index === this.props.content.tests.length - 1}
              icon={<ArrowDownOutlined />}
              onClick={this.handleDownCircleButtonClick}
              />
          </ButtonGroup>
        )
      }, {
        title: 'Vorgabe-ABC-Code',
        key: 'startAbcCode',
        render: (val, item, index) => ({
          children: (
            <table style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td>
                    <TextArea
                      data-index={index}
                      value={item.startAbcCode}
                      onChange={this.handleStartAbcCodeChanged}
                      rows={6}
                      />
                  </td>
                  <td>
                    <TextArea
                      data-index={index}
                      value={item.fullAbcCode}
                      onChange={this.handleFullAbcCodeChanged}
                      rows={6}
                      />
                  </td>
                </tr>
                <tr>
                  <td colSpan="2">
                    <EarTrainingSoundEditor
                      testIndex={index}
                      docKey={this.props.docKey}
                      sound={item.sound || { ...defaultSound }}
                      onSoundChanged={this.handleSoundChanged}
                      />
                  </td>
                </tr>
              </tbody>
            </table>
          ),
          props: {
            colSpan: 2
          }
        })
      }, {
        title: 'Lösungs-ABC-Code',
        key: 'fullAbcCode',
        render: () => ({
          children: null,
          props: {
            colSpan: 0
          }
        })
      }, {
        title: (
          <Button type="primary" icon={<PlusOutlined />} onClick={this.handleAddButtonClick} />
        ),
        width: 48,
        key: 'button',
        render: (value, item, index) => (
          <Button
            data-index={index}
            type="danger"
            icon={<DeleteOutlined />}
            disabled={this.props.content.tests.length < 2}
            onClick={this.handleDeletButtonClick}
            />
        )
      }
    ];
  }

  changeContent(newContentValues) {
    const { content, onContentChanged } = this.props;
    onContentChanged({ ...content, ...newContentValues });
  }

  handleTitleChanged(event) {
    const { value } = event.target;
    this.changeContent({ title: value });
  }

  handleMaxWidthChanged(newValue) {
    this.changeContent({ maxWidth: newValue });
  }

  handleStartAbcCodeChanged(event) {
    const { value, dataset } = event.target;
    const index = Number.parseInt(dataset.index, 10);
    const oldTests = this.props.content.tests;
    const newTests = oldTests.map((test, i) => i === index ? { ...test, startAbcCode: value } : test);
    this.changeContent({ tests: newTests });
  }

  handleFullAbcCodeChanged(event) {
    const { value, dataset } = event.target;
    const index = Number.parseInt(dataset.index, 10);
    const oldTests = this.props.content.tests;
    const newTests = oldTests.map((test, i) => i === index ? { ...test, fullAbcCode: value } : test);
    this.changeContent({ tests: newTests });
  }

  handleSoundChanged({ testIndex, sound }) {
    const oldTests = this.props.content.tests;
    const newTests = oldTests.map((test, i) => i === testIndex ? { ...test, sound } : test);
    this.changeContent({ tests: newTests });
  }

  handleDeletButtonClick(event) {
    const { dataset } = event.target;
    const index = Number.parseInt(dataset.index, 10);
    const oldTests = this.props.content.tests;
    const newTests = removeItem(oldTests, index);
    this.changeContent({ tests: newTests });
  }

  handleAddButtonClick() {
    const newTests = this.props.content.tests.slice();
    newTests.push({ startAbcCode: 'X:1', fullAbcCode: 'X:1' });
    this.changeContent({ tests: newTests });
  }

  handleUpCircleButtonClick(event) {
    const { dataset } = event.target;
    const index = Number.parseInt(dataset.index, 10);
    const newTests = swapItems(this.props.content.tests, index, index - 1);
    this.changeContent({ tests: newTests });
  }

  handleDownCircleButtonClick(event) {
    const { dataset } = event.target;
    const index = Number.parseInt(dataset.index, 10);
    const newTests = swapItems(this.props.content.tests, index, index + 1);
    this.changeContent({ tests: newTests });
  }

  render() {
    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };
    const { content } = this.props;
    const dataSource = content.tests.map((test, i) => ({
      key: i,
      startAbcCode: test.startAbcCode,
      fullAbcCode: test.fullAbcCode,
      sound: test.sound
    }));

    return (
      <div>
        <Form layout="horizontal">
          <FormItem label="Titel:" {...formItemLayout}>
            <Input value={content.title} onChange={this.handleTitleChanged} />
          </FormItem>
          <Form.Item label="Maximale Breite" {...formItemLayout}>
            <ObjectMaxWidthSlider defaultValue={100} value={content.maxWidth} onChange={this.handleMaxWidthChanged} />
          </Form.Item>
        </Form>
        <Table dataSource={dataSource} columns={this.columns} pagination={false} size="small" />
      </div>
    );
  }
}

EarTrainingEditor.propTypes = {
  ...sectionEditorProps,
  ...clientSettingsProps
};

export default inject({
  clientSettings: ClientSettings
}, EarTrainingEditor);
