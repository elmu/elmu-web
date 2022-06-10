import httpErrors from 'http-errors';
import routes from '@educandu/educandu/utils/routes.js';
import DocumentStore from '@educandu/educandu/stores/document-store.js';

const { NotFound } = httpErrors;

class ArticlesController {
  static get inject() { return [DocumentStore]; }

  constructor(documentStore) {
    this.documentStore = documentStore;
  }

  registerPages(router) {
    router.get('/articles/*', async (req, res) => {
      const slug = req.params[0] || '';
      const doc = await this.documentStore.findOne({ slug });
      if (!doc) {
        throw new NotFound(`Article '${slug}' could  not be found`);
      }

      res.redirect(301, routes.getDocUrl({ key: doc.key, slug: doc.slug }));
    });
  }
}

export default ArticlesController;
