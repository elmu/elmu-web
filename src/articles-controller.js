import httpErrors from 'http-errors';
import routes from '@educandu/educandu/utils/routes.js';
import DocumentService from '@educandu/educandu/services/document-service.js';

const { NotFound } = httpErrors;

class ArticlesController {
  static get inject() { return [DocumentService]; }

  constructor(documentService) {
    this.documentService = documentService;
  }

  registerPages(router) {
    router.get('/articles/*', async (req, res) => {
      const slug = req.params[0] || '';
      const documents = await this.documentService.getDocumentsMetadataBySlug(slug);
      if (!documents.length) {
        throw new NotFound(`Article '${slug}' could  not be found`);
      }

      res.redirect(301, routes.getDocUrl({ id: documents[0]._id, slug: documents[0].slug }));
    });
  }
}

export default ArticlesController;
