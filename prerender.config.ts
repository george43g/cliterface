import type { PrerenderConfig } from '@stencil/core';

export const config: PrerenderConfig = {
  hydrateOptions: {
    prettyHtml: false,
    removeUnusedStyles: true,
    removeScripts: false, // We'll inline scripts ourselves
  },
  // Crawl all linked pages starting from index
  crawl: true,
};
