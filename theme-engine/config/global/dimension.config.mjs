import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

let computeScale;
const packageCandidates = ["@aplica/aplica-theme-engine","aplica-theme-engine-core"];
for (const packageName of packageCandidates) {
  try {
    ({ computeScale } = await import(packageName + '/helpers/dimension-scale'));
    break;
  } catch {}
}
if (!computeScale) {
  const packageRoot = process.env.APLICA_THEME_ENGINE_PACKAGE_ROOT;
  if (!packageRoot) {
    throw new Error(
        'No compatible @aplica/aplica-theme-engine package was found and APLICA_THEME_ENGINE_PACKAGE_ROOT is not set.'
      );
  }
  ({ computeScale } = await import(pathToFileURL(path.join(packageRoot, 'dynamic-themes/scripts/dimension-scale.mjs')).href));
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const THEMES_CONFIG_PATH = path.join(__dirname, 'themes.config.json');

const DEFAULT_SEMANTIC = {
  zero: { value: '{dimension.scale.0}', description: 'Zero spacing.' },
  pico: { value: '{dimension.scale.6}', description: 'Minimal spacing.' },
  nano: { value: '{dimension.scale.12}', description: 'Nano spacing.' },
  micro: { value: '{dimension.scale.25}', description: 'Micro spacing.' },
  extraSmall: { value: '{dimension.scale.50}', description: 'Extra small spacing.' },
  small: { value: '{dimension.scale.75}', description: 'Small spacing.' },
  medium: { value: '{dimension.scale.100}', description: 'Medium spacing.' },
  large: { value: '{dimension.scale.125}', description: 'Large spacing.' },
  extraLarge: { value: '{dimension.scale.150}', description: 'Extra large spacing.' },
  mega: { value: '{dimension.scale.175}', description: 'Mega spacing.' },
  giga: { value: '{dimension.scale.275}', description: 'Giga spacing.' },
  tera: { value: '{dimension.scale.450}', description: 'Tera spacing.' },
  peta: { value: '{dimension.scale.725}', description: 'Peta spacing.' }
};

function loadThemesDimensionConfig() {
  try {
    if (!fs.existsSync(THEMES_CONFIG_PATH)) return null;
    const raw = fs.readFileSync(THEMES_CONFIG_PATH, 'utf-8');
    const data = JSON.parse(raw);
    return data?.global?.dimension ?? null;
  } catch {
    return null;
  }
}

function getConfig() {
  const dimConfig = loadThemesDimensionConfig();
  const variants = Array.isArray(dimConfig?.variants) && dimConfig.variants.length > 0 ? dimConfig.variants : ['normal'];
  const defaultVariant = dimConfig?.defaultVariant ?? 'normal';
  const params = dimConfig?.params ?? {};
  const scaleMultiplierFactor = dimConfig?.scaleMultiplierFactor ?? 4;
  return { variants, defaultVariant, params, scaleMultiplierFactor };
}

export function getVariants() {
  return getConfig().variants;
}

export function getConstants(variant = 'normal') {
  const config = getConfig();
  const base = config.params[variant] ?? config.params[config.defaultVariant] ?? { layoutUnit: 4, scaleMultiplierFactor: 4 };
  const layoutUnit = Number(base.layoutUnit ?? 4);
  const multiplier = Number(base.scaleMultiplierFactor ?? config.scaleMultiplierFactor ?? 4);
  return {
    layoutUnit,
    scaleMultiplierFactor: multiplier,
    defaultDesignUnit: layoutUnit * multiplier,
    scaleLevels: 5
  };
}

export function getScale(variant = 'normal') {
  return computeScale(getConstants(variant), {});
}

export const scale = getScale('normal');

export function getSemantic() {
  return { ...DEFAULT_SEMANTIC };
}

export const semantic = getSemantic('normal');
