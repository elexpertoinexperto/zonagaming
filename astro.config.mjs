// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
// El sitemap lo generan src/pages/sitemap*.xml.ts (índice + es + en con hreflang);
// la integración @astrojs/sitemap se quitó porque duplicaba las URLs sin hreflang.
export default defineConfig({
  site: 'https://monckeygamer.com',
  trailingSlash: 'always',
});
