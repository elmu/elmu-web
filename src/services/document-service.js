import Logger from '../common/logger';
import deepEqual from 'fast-deep-equal';
import UserService from './user-service';
import dateTime from '../utils/date-time';
import uniqueId from '../utils/unique-id';
import cloneDeep from '../utils/clone-deep';
import DocumentStore from '../stores/document-store';
import HandlerFactory from '../plugins/handler-factory';
import DocumentLockStore from '../stores/document-lock-store';
import DocumentOrderStore from '../stores/document-order-store';
import DocumentRevisionStore from '../stores/document-revision-store';
import { validateCreateDocumentRevision } from '../domain/models/create-document-revision-request';

const logger = new Logger(__filename);

const metadataProjection = {
  _id: 1,
  key: 1,
  order: 1,
  revision: 1,
  title: 1,
  slug: 1,
  namespace: 1,
  language: 1,
  createdOn: 1,
  createdBy: 1,
  updatedOn: 1,
  updatedBy: 1
};

const lastUpdatedFirst = [['updatedOn', -1]];

class DocumentService {
  static get inject() {
    return [DocumentRevisionStore, DocumentOrderStore, DocumentLockStore, DocumentStore, UserService, HandlerFactory];
  }

  constructor(documentRevisionStore, documentOrderStore, documentLockStore, documentStore, userService, handlerFactory) {
    this.documentRevisionStore = documentRevisionStore;
    this.documentOrderStore = documentOrderStore;
    this.documentLockStore = documentLockStore;
    this.documentStore = documentStore;
    this.userService = userService;
    this.handlerFactory = handlerFactory;
  }

  getAllDocumentsMetadata() {
    return this.documentStore.find({}, { sort: lastUpdatedFirst, projection: metadataProjection });
  }

  getDocumentsMetadataByKeys(documentKeys) {
    return this.documentStore.find({ _id: { $in: documentKeys } }, { sort: lastUpdatedFirst, projection: metadataProjection });
  }

  getDocumentByKey(documentKey) {
    return this.documentStore.findOne({ _id: documentKey });
  }

  getDocumentByNamespaceAndSlug(namespace, slug) {
    return this.documentStore.findOne({ namespace, slug });
  }

  getAllDocumentRevisionsByKey(documentKey) {
    return this.documentRevisionStore.find({ key: documentKey }, { sort: [['order', 1]] });
  }

  getCurrentDocumentRevisionByKey(documentKey) {
    return this.documentRevisionStore.findOne({ key: documentKey }, { sort: [['order', -1]] });
  }

  getDocumentRevisionById(id) {
    return this.documentRevisionStore.findOne({ _id: id });
  }

  async createDocumentRevision({ data, user }) {
    if (!user || !user._id) {
      throw new Error('No user specified');
    }

    const doc = validateCreateDocumentRevision(data);

    let lock;
    const now = dateTime.now();
    const userId = user._id;
    const isAppendedRevision = !!doc.appendTo;
    const ancestorId = isAppendedRevision ? doc.appendTo.ancestorId : null;
    const documentKey = isAppendedRevision ? doc.appendTo.key : uniqueId.create();

    try {

      let existingDocumentRevisions;
      let ancestorRevision;

      logger.info('Creating new document revision for document key %s', documentKey);

      lock = await this.documentLockStore.takeLock(documentKey);

      if (isAppendedRevision) {
        existingDocumentRevisions = await this.getAllDocumentRevisionsByKey(documentKey);
        if (!existingDocumentRevisions.length) {
          throw new Error(`Cannot append new revision for key ${documentKey}, because there are no existing revisions`);
        }

        logger.info('Found %d existing revisions for key %s', existingDocumentRevisions.length, documentKey);
        ancestorRevision = existingDocumentRevisions[existingDocumentRevisions.length - 1];
        if (ancestorRevision._id !== ancestorId) {
          throw new Error(`Ancestor id ${ancestorId} is not the latest revision`);
        }
      } else {
        existingDocumentRevisions = [];
        ancestorRevision = null;
      }

      const newSections = data.sections.map(section => {
        const sectionKey = section.key;
        const ancestorSection = ancestorRevision?.sections.find(s => s.key === sectionKey) || null;

        if (ancestorSection) {
          logger.info('Found ancestor section with key %s', sectionKey);

          if (ancestorSection.type !== section.type) {
            throw new Error(`Ancestor section has type ${ancestorSection.type} and cannot be changed to ${section.type}`);
          }

          if (ancestorSection.deletedOn && section.content) {
            throw new Error(`Ancestor section with key ${sectionKey} is deleted and cannot be changed`);
          }

          // If not changed, re-use existing revision:
          if (deepEqual(ancestorSection.content, section.content)) {
            logger.info('Section has not changed compared to ancestor section with id %s, using the existing', ancestorSection._id);
            return cloneDeep(ancestorSection);
          }
        }

        if (!section.content) {
          throw new Error('Sections that are not deleted must specify a content');
        }

        logger.info('Creating new revision for section key %s', sectionKey);

        // Create a new section revision:
        return {
          revision: uniqueId.create(),
          key: sectionKey,
          deletedOn: null,
          deletedBy: null,
          deletedBecause: null,
          type: section.type,
          content: cloneDeep(section.content)
        };
      });

      const nextOrder = await this.documentOrderStore.getNextOrder();

      logger.info('Creating new revision for document key %s with order %d', documentKey, nextOrder);

      // Create a new document revision:
      const newDocumentRevision = {
        _id: uniqueId.create(),
        key: documentKey,
        order: nextOrder,
        createdOn: now,
        createdBy: userId,
        title: doc.title || '',
        slug: doc.slug || '',
        namespace: doc.namespace,
        language: doc.language,
        sections: newSections
      };

      logger.info('Saving new document revision with id %s', newDocumentRevision._id);
      await this.documentRevisionStore.save(newDocumentRevision);

      const latestDocument = this._createDocumentFromRevisions([...existingDocumentRevisions, newDocumentRevision]);

      logger.info('Saving latest document with revision %s', latestDocument.revision);
      await this.documentStore.save(latestDocument);

      return newDocumentRevision;

    } finally {
      if (lock) {
        await this.documentLockStore.releaseLock(lock);
      }
    }
  }

  async hardDeleteSection({ documentKey, sectionKey, sectionRevision, reason, deleteDescendants, user }) {
    if (!user || !user._id) {
      throw new Error('No user specified');
    }

    let lock;
    const now = dateTime.now();
    const userId = user._id;

    try {

      logger.info('Hard deleting sections with section key %s in documents with key %s', sectionKey, documentKey);

      lock = await this.documentLockStore.takeLock(documentKey);

      const allRevisions = await this.documentRevisionStore.find({ key: documentKey }, { sort: [['order', 1]] });

      const revisionsToUpdate = [];
      let revisionMatchFound = false;

      for (const revision of allRevisions) {
        for (const section of revision.sections) {
          if (section.key === sectionKey) {
            // eslint-disable-next-line max-depth
            if (section.revision === sectionRevision || (revisionMatchFound && deleteDescendants)) {
              section.deletedOn = now;
              section.deletedBy = userId;
              section.deletedBecause = reason;
              section.content = null;
              revisionMatchFound = true;
              revisionsToUpdate.push(revision);
            }
          }
        }
      }

      if (revisionsToUpdate.length) {
        logger.info('Hard deleting %d sections with section key %s in document revisions with key %s', revisionsToUpdate, sectionKey, documentKey);
        await this.documentRevisionStore.saveMany(revisionsToUpdate);
      } else {
        throw new Error(`Could not find a section with key ${sectionKey} and revision ${sectionRevision} in document revisions for key ${documentKey}`);
      }

      const latestDocument = this._createDocumentFromRevisions(allRevisions);

      logger.info('Saving latest document with revision %s', latestDocument.revision);
      await this.documentStore.save(latestDocument);

    } finally {
      if (lock) {
        await this.documentLockStore.releaseLock(lock);
      }
    }
  }

  _createDocumentFromRevisions(revisions) {
    const firstRevision = revisions[0];
    const lastRevision = revisions[revisions.length - 1];
    const contributors = Array.from(new Set(revisions.map(r => r.createdBy)));

    return {
      _id: lastRevision.key,
      key: lastRevision.key,
      order: lastRevision.order,
      revision: lastRevision._id,
      createdOn: firstRevision.createdOn,
      createdBy: firstRevision.createdBy,
      updatedOn: lastRevision.createdOn,
      updatedBy: lastRevision.createdBy,
      title: lastRevision.title,
      slug: lastRevision.slug,
      namespace: lastRevision.namespace,
      language: lastRevision.language,
      sections: lastRevision.sections,
      contributors: contributors
    };
  }
}

export default DocumentService;
