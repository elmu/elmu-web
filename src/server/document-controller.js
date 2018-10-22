const bodyParser = require('body-parser');
const PageRenderer = require('./page-renderer');
const Doc = require('../components/pages/doc.jsx');
const Docs = require('../components/pages/docs.jsx');
const Edit = require('../components/pages/edit.jsx');
const permissions = require('../domain/permissions');
const ClientDataMapper = require('./client-data-mapper');
const Article = require('../components/pages/article.jsx');
const DocumentService = require('../services/document-service');
const needsPermission = require('../domain/needs-permission-middleware');

const jsonParser = bodyParser.json();

class DocumentController {
  static get inject() { return [DocumentService, ClientDataMapper, PageRenderer]; }

  constructor(documentService, clientDataMapper, pageRenderer) {
    this.documentService = documentService;
    this.clientDataMapper = clientDataMapper;
    this.pageRenderer = pageRenderer;
  }

  registerPages(app) {
    app.get('/articles/:slug', async (req, res) => {
      const doc = await this.documentService.getDocumentBySlug(req.params.slug);
      if (!doc) {
        return res.sendStatus(404);
      }

      const initialState = this.clientDataMapper.mapDocToInitialState({ doc });
      return this.pageRenderer.sendPage(req, res, 'article', Article, initialState);
    });

    app.get('/docs', needsPermission(permissions.VIEW_DOCS), async (req, res) => {
      const initialState = await this.documentService.getLastUpdatedDocuments();
      return this.pageRenderer.sendPage(req, res, 'docs', Docs, initialState);
    });

    app.get('/docs/:docId', needsPermission(permissions.VIEW_DOCS), async (req, res) => {
      const doc = await this.documentService.getDocumentById(req.params.docId);
      if (!doc) {
        return res.sendStatus(404);
      }

      const initialState = this.clientDataMapper.mapDocToInitialState({ doc });
      return this.pageRenderer.sendPage(req, res, 'doc', Doc, initialState);
    });

    app.get('/edit/doc/:docId', needsPermission(permissions.EDIT_DOC), async (req, res) => {
      const doc = await this.documentService.getDocumentById(req.params.docId);
      if (!doc) {
        return res.sendStatus(404);
      }

      const initialState = this.clientDataMapper.mapDocToInitialState({ doc });
      return this.pageRenderer.sendPage(req, res, 'edit', Edit, initialState);
    });
  }

  registerApi(app) {
    app.post('/api/v1/docs', [needsPermission(permissions.EDIT_DOC), jsonParser], async (req, res) => {
      const { user } = req;
      const { doc, sections } = req.body;
      const docRevision = await this.documentService.createDocumentRevision({ doc, sections, user });
      const initialState = this.clientDataMapper.mapDocToInitialState({ doc: docRevision });
      return res.send(initialState);
    });
  }
}

module.exports = DocumentController;