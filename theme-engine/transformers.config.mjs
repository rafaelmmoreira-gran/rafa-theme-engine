import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageCandidates = ["@aplica/aplica-theme-engine","aplica-theme-engine-core"];

let defineTransformersConfig;
for (const packageName of packageCandidates) {
  try {
    ({ defineTransformersConfig } = await import(packageName + '/transformers/config'));
    break;
  } catch {}
}
if (!defineTransformersConfig) {
  const packageRoot = process.env.APLICA_THEME_ENGINE_PACKAGE_ROOT;
  if (packageRoot) {
    ({ defineTransformersConfig } = await import(pathToFileURL(path.join(packageRoot, 'transformers/config-api.mjs')).href));
  } else {
    const localCorePath = path.resolve(__dirname, '../../transformers/config-api.mjs');
    if (!fs.existsSync(localCorePath)) {
      throw new Error(
        'No compatible @aplica/aplica-theme-engine package was found, APLICA_THEME_ENGINE_PACKAGE_ROOT is not set, and no local monorepo fallback was found.'
      );
    }
    ({ defineTransformersConfig } = await import(pathToFileURL(localCorePath).href));
  }
}

export default defineTransformersConfig({
  layers: {
    semantic: {
      enabled: true,
      platforms: ['json', 'esm', 'js', 'css']
    },
    foundation: {
      enabled: true,
      platforms: ['json', 'esm', 'js', 'css']
    },
    components: {
      enabled: false,
      platforms: ['json']
    }
  },
  output: {
    directories: {
      json: './dist/json',
      js: './dist/js',
      esm: './dist/esm',
      dts: './dist/js',
      dtsESM: './dist/esm',
      css: './dist/css/semantic',
      scss: './dist/scss'
    },
    namespaces: {
      semantic: {
        css: './dist/css/semantic'
      },
      foundation: {
        json: './dist/json/foundation',
        js: './dist/js/foundation',
        esm: './dist/esm/foundation',
        css: './dist/css/foundation'
      },
      components: {
        json: './dist/json/components',
        js: './dist/js/components',
        esm: './dist/esm/components',
        css: './dist/css/components',
        dts: './dist/json/components',
        dtsESM: './dist/json/components'
      }
    }
  },
  assets: {
    copyFonts: true,
    generateFontsManifest: true
  }
});
