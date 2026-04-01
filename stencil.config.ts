import type { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'cliterface',

  globalStyle: 'src/global/output.css',

  extras: {
    enableImportInjection: true,
  },

  outputTargets: [
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
    },
    {
      type: 'dist-hydrate-script',
      dir: 'dist/hydrate',
    },
    {
      type: 'www',
      baseUrl: 'https://localhost/',
      serviceWorker: null,
      prerenderConfig: './prerender.config.ts',
    },
  ],
};
