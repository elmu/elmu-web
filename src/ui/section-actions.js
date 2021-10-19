export const HARD_DELETE = 'hard-delete';

export function createHardDelete(section, reason, deleteAllRevisions) {
  return {
    name: HARD_DELETE,
    data: {
      sectionKey: section.key,
      sectionRevision: section.revision,
      reason,
      deleteAllRevisions
    }
  };
}

export default {
  HARD_DELETE,
  createHardDelete
};
