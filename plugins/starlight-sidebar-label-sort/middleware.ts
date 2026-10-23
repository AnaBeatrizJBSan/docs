import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import config from 'virtual:starlight-sidebar-label-sort/config';
import { sortEntries, updatePagination } from './utils.ts';

let docOrderCache: Map<string, number> | null = null;

async function getDocOrderMap(): Promise<Map<string, number>> {
  if (docOrderCache) return docOrderCache;
  const map = new Map<string, number>();

  if (config.respectOrder) {
    try {
      const { getCollection } = await import('astro:content');
      const docs = await getCollection('docs');
      for (const doc of docs) {
        const order = doc.data?.sidebar?.order;
        if (typeof order === 'number') {
          const cleanId = doc.id.replace(/\.(mdx?|markdown)$/i, '');
          map.set(cleanId, order);
          map.set('/' + cleanId, order);
          map.set('/' + cleanId + '/', order);
          if (doc.slug) {
            map.set(doc.slug, order);
            map.set('/' + doc.slug, order);
            map.set('/' + doc.slug + '/', order);
          }
        }
      }
    } catch {
      // Safely fall back if collection cannot be queried
    }
  }

  docOrderCache = map;
  return map;
}

export const onRequest = defineRouteMiddleware(async (context) => {
  const { starlightRoute } = context.locals;
  if (!starlightRoute?.sidebar) return;

  const locale = config.locale || starlightRoute.lang || 'pt-BR';
  const collator = new Intl.Collator(locale, config.collatorOptions);
  const docOrderMap = await getDocOrderMap();

  starlightRoute.sidebar = sortEntries(starlightRoute.sidebar, collator, docOrderMap, config);

  updatePagination(starlightRoute, config.syncPagination ?? true);
});
