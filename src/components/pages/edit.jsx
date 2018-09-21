const React = require('react');
const Page = require('../page.jsx');
const autoBind = require('auto-bind');
const Menu = require('antd/lib/menu');
const PropTypes = require('prop-types');
const urls = require('../../utils/urls');
const Button = require('antd/lib/button');
const Dropdown = require('antd/lib/dropdown');
const utils = require('../../utils/unique-id');
const DocEditor = require('../doc-editor.jsx');
const PageHeader = require('../page-header.jsx');
const PageContent = require('../page-content.jsx');
const { inject } = require('../container-context.jsx');
const SectionEditor = require('../section-editor.jsx');
const EditorFactory = require('../../plugins/editor-factory');
const ShallowUpdateList = require('../shallow-update-list.jsx');
const RendererFactory = require('../../plugins/renderer-factory');
const DocumentApiClient = require('../../services/document-api-client');
const { docShape, sectionShape } = require('../../ui/default-prop-types');
const { DragDropContext, Droppable, Draggable } = require('react-beautiful-dnd');

const pluginInfos = [
  {
    name: 'Markdown',
    type: 'markdown',
    defaultContent: {
      text: ''
    }
  },
  {
    name: 'Image',
    type: 'image',
    defaultContent: {
      type: 'internal',
      url: '',
      maxWidth: 100
    }
  },
  {
    name: 'Audio',
    type: 'audio',
    defaultContent: {
      type: 'internal',
      url: ''
    }
  },
  {
    name: 'Youtube-Video',
    type: 'youtube-video',
    defaultContent: {
      videoId: '',
      maxWidth: 100
    }
  },
  {
    name: 'Quick-Tester',
    type: 'quick-tester',
    defaultContent: {
      name: '',
      teaser: '',
      tests: []
    }
  },
  {
    name: 'H5P-Player',
    type: 'h5p-player',
    defaultContent: {
      contentId: null,
      maxWidth: 100
    }
  },
  {
    name: 'Credit',
    type: 'credit',
    defaultContent: {
      text: ''
    }
  }
];

const cloneDeep = obj => {
  return JSON.parse(JSON.stringify(obj));
};

const canReorder = (list, startIndex, endIndex) => {
  return typeof startIndex === 'number'
    && !Number.isNaN(startIndex)
    && startIndex >= 0
    && startIndex < list.length
    && typeof endIndex === 'number'
    && !Number.isNaN(endIndex)
    && endIndex >= 0
    && endIndex < list.length
    && startIndex !== endIndex;
};

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

class Edit extends React.Component {
  constructor(props) {
    super(props);

    autoBind.react(this);

    const { editorFactory, rendererFactory, documentApiClient, initialState } = this.props;
    const { doc, sections } = initialState;

    this.editorFactory = editorFactory;
    this.rendererFactory = rendererFactory;
    this.documentApiClient = documentApiClient;

    this.state = this.createStateFromDoc({ doc, sections });

    this.pluginInfos = pluginInfos.map(t => ({
      ...t,
      handleNew: this.handleNewSectionClick.bind(this, t)
    }));
  }

  getEditorComponentForSection(section) {
    return this.editorFactory.createEditor(section.type).getEditorComponent();
  }

  getDisplayComponentForSection(section) {
    return this.rendererFactory.createRenderer(section.type).getDisplayComponent();
  }

  createStateFromDoc({ doc, sections }) {
    return {
      originalDoc: doc,
      originalSections: sections,
      editedDoc: cloneDeep(doc),
      editedSections: cloneDeep(sections),
      isDirty: false
    };
  }

  handleMetadataChanged(metadata) {
    this.setState(prevState => {
      return {
        editedDoc: { ...prevState.editedDoc, ...metadata },
        isDirty: true
      };
    });
  }

  handleContentChanged(sectionKey, content) {
    this.setState(prevState => {
      return {
        editedSections: prevState.editedSections.map(sec => sec.key === sectionKey ? { ...sec, content } : sec),
        isDirty: true
      };
    });
  }

  handleSectionMovedUp(sectionKey) {
    const { editedSections } = this.state;
    const sourceIndex = editedSections.findIndex(section => section.key === sectionKey);
    const destinationIndex = sourceIndex - 1;
    this.moveSection(sourceIndex, destinationIndex);
  }

  handleSectionMovedDown(sectionKey) {
    const { editedSections } = this.state;
    const sourceIndex = editedSections.findIndex(section => section.key === sectionKey);
    const destinationIndex = sourceIndex + 1;
    this.moveSection(sourceIndex, destinationIndex);
  }

  handleSectionDeleted(sectionKey) {
    this.setState(prevState => {
      return {
        editedSections: prevState.editedSections.filter(sec => sec.key !== sectionKey),
        isDirty: true
      };
    });
  }

  handleNewSectionClick(pluginInfo) {
    const newSection = {
      _id: null,
      key: utils.create(),
      order: null,
      type: pluginInfo.type,
      content: {
        de: JSON.parse(JSON.stringify(pluginInfo.defaultContent))
      }
    };
    this.setState(prevState => {
      return {
        editedSections: [...prevState.editedSections, newSection],
        isDirty: true
      };
    });
  }

  async handleSaveClick() {
    const { editedDoc, editedSections } = this.state;
    const payload = {
      doc: {
        key: editedDoc.key,
        title: editedDoc.title,
        slug: editedDoc.slug
      },
      sections: editedSections.map(section => ({
        ancestorId: section._id,
        key: section.key,
        type: section.type,
        content: section.content
      }))
    };
    const { doc, sections } = await this.documentApiClient.saveDocument(payload);
    this.setState(this.createStateFromDoc({ doc, sections }));
  }

  handleBackClick() {
    const { originalDoc } = this.state;
    window.location = urls.getDocUrl(originalDoc.key);
  }

  handleDragEnd({ source, destination }) {
    if (destination) {
      this.moveSection(source.index, destination.index);
    }
  }

  moveSection(sourceIndex, destinationIndex) {
    const { editedSections } = this.state;
    if (canReorder(editedSections, sourceIndex, destinationIndex)) {
      this.setState({
        editedSections: reorder(editedSections, sourceIndex, destinationIndex),
        isDirty: true
      });
    }
  }

  render() {
    const { language } = this.props;
    const { editedDoc, editedSections, isDirty } = this.state;

    const newSectionMenu = (
      <Menu>
        {this.pluginInfos.map(pt => (
          <Menu.Item key={pt.type}>
            <a rel="noopener noreferrer" onClick={pt.handleNew}>{pt.name}</a>
          </Menu.Item>
        ))}
      </Menu>
    );

    const newSectionDropdown = (
      <Dropdown key="new-section-dropdown" overlay={newSectionMenu} placement="topCenter">
        <Button type="primary" shape="circle" icon="plus" size="large" />
      </Dropdown>
    );

    return (
      <Page>
        <PageHeader>
          {isDirty && <Button type="primary" icon="save" onClick={this.handleSaveClick}>Speichern</Button>}
          &nbsp;
          <Button icon="close" onClick={this.handleBackClick}>Zurück</Button>
        </PageHeader>
        <PageContent>
          <DocEditor
            onChanged={this.handleMetadataChanged}
            doc={editedDoc}
            />
          <DragDropContext onDragEnd={this.handleDragEnd}>
            <Droppable droppableId="droppable" ignoreContainerClipping="true">
              {droppableProvided => (
                <div ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
                  <ShallowUpdateList items={editedSections}>
                    {(section, index) => (
                      <Draggable key={section.key} draggableId={section.key} index={index}>
                        {(draggableProvided, draggableState) => (
                          <section
                            key={section.key}
                            className="Section"
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                            style={{
                              userSelect: draggableState.isDragging ? 'none' : null,
                              ...draggableProvided.draggableProps.style
                            }}
                            >
                            <SectionEditor
                              EditorComponent={this.getEditorComponentForSection(section)}
                              DisplayComponent={this.getDisplayComponentForSection(section)}
                              onContentChanged={this.handleContentChanged}
                              onSectionMovedUp={this.handleSectionMovedUp}
                              onSectionMovedDown={this.handleSectionMovedDown}
                              onSectionDeleted={this.handleSectionDeleted}
                              dragHandleProps={draggableProvided.dragHandleProps}
                              isHighlighted={draggableState.isDragging}
                              language={language}
                              section={section}
                              doc={editedDoc}
                              />
                          </section>
                        )}
                      </Draggable>
                    )}
                  </ShallowUpdateList>
                  {droppableProvided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <aside style={{ marginTop: '25px' }}>
            {newSectionDropdown}
          </aside>
        </PageContent>
      </Page>
    );
  }
}

Edit.propTypes = {
  documentApiClient: PropTypes.instanceOf(DocumentApiClient).isRequired,
  editorFactory: PropTypes.instanceOf(EditorFactory).isRequired,
  initialState: PropTypes.shape({
    doc: docShape,
    sections: PropTypes.arrayOf(sectionShape)
  }).isRequired,
  language: PropTypes.string.isRequired,
  rendererFactory: PropTypes.instanceOf(RendererFactory).isRequired
};

module.exports = inject({
  documentApiClient: DocumentApiClient,
  rendererFactory: RendererFactory,
  editorFactory: EditorFactory
}, Edit);
