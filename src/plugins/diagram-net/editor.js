import DiagramNetEditor from './editing/diagram-net-editor';

class DiagramNet {
  static get typeName() { return 'diagram-net'; }

  getEditorComponent() {
    return DiagramNetEditor;
  }
}

export default DiagramNet;
