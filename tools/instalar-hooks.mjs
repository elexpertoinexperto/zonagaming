#!/usr/bin/env node
// Instala el hook pre-commit que mantiene al día las fechas <lastmod> de los sitemaps (ver tools/actualizar-lastmod.mjs).
// Los hooks de git viven en .git/hooks, que no se versiona: hay que correr esto una vez por clon.
//   npm run hooks:install
import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const git = join(process.cwd(), '.git');
if (!existsSync(git)) { console.log('[hooks] No hay .git aquí, nada que instalar.'); process.exit(0); }
mkdirSync(join(git, 'hooks'), { recursive: true });
const hook = join(git, 'hooks', 'pre-commit');
writeFileSync(hook, '#!/bin/sh\nnode tools/actualizar-lastmod.mjs --render --git-add\n');
chmodSync(hook, 0o755);
console.log('[hooks] pre-commit instalado: cada commit compila el sitio y actualiza src/data/sitemap-lastmod.json (y sitemap-render.json)');
