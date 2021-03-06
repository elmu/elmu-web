import mem from 'mem';
import QuickLRU from 'quick-lru';

function memoizeLast(func, maxSize, cacheKey) {
  return mem(func, { cache: new QuickLRU({ maxSize: maxSize || 1 }), cacheKey: cacheKey });
}

export default memoizeLast;
