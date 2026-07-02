import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageCandidates = ["@aplica/aplica-theme-engine","aplica-theme-engine-core"];

let defineThemeEngineConfig;
for (const packageName of packageCandidates) {
  try {
    ({ defineThemeEngineConfig } = await import(packageName + '/config'));
    break;
  } catch {}
}
if (!defineThemeEngineConfig) {
  const packageRoot = process.env.APLICA_THEME_ENGINE_PACKAGE_ROOT;
  if (packageRoot) {
    ({ defineThemeEngineConfig } = await import(pathToFileURL(path.join(packageRoot, 'config-api.mjs')).href));
  } else {
    const localCorePath = path.resolve(__dirname, '../../config-api.mjs');
    if (!fs.existsSync(localCorePath)) {
      throw new Error(
        'No compatible @aplica/aplica-theme-engine package was found, APLICA_THEME_ENGINE_PACKAGE_ROOT is not set, and no local monorepo fallback was found.'
      );
    }
    ({ defineThemeEngineConfig } = await import(pathToFileURL(localCorePath).href));
  }
}

export default defineThemeEngineConfig({
  transformersConfigFile: './theme-engine/transformers.config.mjs',
  generation: {
    colorText: {
      generateTxt: false,
      txtBaseColorLevel: 140,
      fallbackBaseColorLevel: 130,
      textExposure: {
        feedback: true,
        interfaceFunction: false,
        product: false
      }
    }
  },
  paths: {
    configDir: './theme-engine/config',
    globalConfigDir: './theme-engine/config/global',
    foundationsDir: './theme-engine/config/foundations',
    dataDir: './data',
    distDir: './dist'
  }
});
