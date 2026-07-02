import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

let FEEDBACK_SCHEMA;
let PRODUCT_SCHEMA;
let INTENSITY_LEVELS;
let TEXT_SCHEMA;
let AMBIENT_SCHEMA;
let GRADIENT_SCHEMA;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localWorkspaceSchemaPath = path.resolve(__dirname, '../../schemas/architecture.mjs');
const packageCandidates = ["@aplica/aplica-theme-engine","aplica-theme-engine-core"];

if (fs.existsSync(localWorkspaceSchemaPath)) {
  ({ FEEDBACK_SCHEMA, PRODUCT_SCHEMA, INTENSITY_LEVELS, TEXT_SCHEMA, AMBIENT_SCHEMA, GRADIENT_SCHEMA } = await import(pathToFileURL(localWorkspaceSchemaPath).href));
} else {
  for (const packageName of packageCandidates) {
    try {
      ({ FEEDBACK_SCHEMA, PRODUCT_SCHEMA, INTENSITY_LEVELS, TEXT_SCHEMA, AMBIENT_SCHEMA, GRADIENT_SCHEMA } = await import(packageName + '/schemas/architecture'));
      break;
    } catch {}
  }
  if (!PRODUCT_SCHEMA) {
    const packageRoot = process.env.APLICA_THEME_ENGINE_PACKAGE_ROOT;
    if (!packageRoot) {
      throw new Error(
        'No compatible @aplica/aplica-theme-engine package was found and APLICA_THEME_ENGINE_PACKAGE_ROOT is not set.'
      );
    }
    ({ FEEDBACK_SCHEMA, PRODUCT_SCHEMA, INTENSITY_LEVELS, TEXT_SCHEMA, AMBIENT_SCHEMA, GRADIENT_SCHEMA } = await import(pathToFileURL(path.join(packageRoot, 'schemas/architecture.mjs')).href));
  }
}

const require = createRequire(import.meta.url);
const typographyContent = require('./typography-engine.json');

const brandLevels = Array.isArray(INTENSITY_LEVELS) && INTENSITY_LEVELS.length > 0
  ? [...INTENSITY_LEVELS]
  : ['lowest', 'low', 'default', 'high', 'highest'];
const ambientNeutralLevels = Array.isArray(AMBIENT_SCHEMA?.neutral?.items) && AMBIENT_SCHEMA.neutral.items.length > 0
  ? AMBIENT_SCHEMA.neutral.items.map((item) => typeof item === 'string' ? item : item?.name).filter(Boolean)
  : ['lowest', 'low', 'mid', 'high', 'highest'];
const ambientGrayscaleLevels = Array.isArray(AMBIENT_SCHEMA?.grayscale?.items) && AMBIENT_SCHEMA.grayscale.items.length > 0
  ? AMBIENT_SCHEMA.grayscale.items.map((item) => typeof item === 'string' ? item : item?.name).filter(Boolean)
  : ['lowest', 'low', 'mid', 'high', 'highest'];
const textBaseItems = Array.isArray(TEXT_SCHEMA?.baseItems) && TEXT_SCHEMA.baseItems.length > 0
  ? TEXT_SCHEMA.baseItems.map((item) => typeof item === 'string' ? item : item?.key).filter(Boolean)
  : ['title', 'body', 'highlight', 'muted', 'label'];
const gradientItems = Array.isArray(GRADIENT_SCHEMA?.defaultBrandNames) && GRADIENT_SCHEMA.defaultBrandNames.length > 0
  ? [...GRADIENT_SCHEMA.defaultBrandNames]
  : ['first', 'second', 'third'];
const secondaryGray = ambientGrayscaleLevels[1] ?? ambientGrayscaleLevels[0] ?? 'low';
const tertiaryGray = ambientGrayscaleLevels[Math.floor(ambientGrayscaleLevels.length / 2)] ?? ambientGrayscaleLevels[0] ?? 'mid';

const brandBackgroundRefs = Object.fromEntries(
  brandLevels.map((level) => [level, `semantic.color.brand.branding.first.${level}.background`])
);
const brandBorderRefs = Object.fromEntries(
  brandLevels.map((level) => [level, `semantic.color.brand.branding.first.${level}.border`])
);
const brandTxtOnRefs = Object.fromEntries(
  brandLevels.map((level) => [level, `semantic.color.brand.branding.first.${level}.txtOn`])
);
const ambientBackgroundRefs = Object.fromEntries(
  ambientNeutralLevels.map((level) => [level, `semantic.color.brand.ambient.neutral.${level}.background`])
);
const ambientBorderRefs = Object.fromEntries(
  ambientNeutralLevels.map((level) => [level, `semantic.color.brand.ambient.neutral.${level}.border`])
);
const ambientTxtOnRefs = Object.fromEntries(
  ambientNeutralLevels.map((level) => [level, `semantic.color.brand.ambient.neutral.${level}.txtOn`])
);
const textRefs = Object.fromEntries(
  textBaseItems.map((item) => [item, `semantic.color.text.${item}`])
);
const defaultReadableTextRefs = {
  info: 'semantic.color.text.feedback.info.default.normal',
  success: 'semantic.color.text.feedback.success.default.normal',
  warning: 'semantic.color.text.feedback.warning.default.normal',
  danger: 'semantic.color.text.feedback.danger.default.normal',
  primary: 'semantic.color.text.function.primary.normal',
  secondary: 'semantic.color.text.function.secondary.normal',
  link: 'semantic.color.text.function.link.normal',
  promo: 'semantic.color.text.product.promo.default.default',
  cashback: 'semantic.color.text.product.cashback.default.default',
  premium: 'semantic.color.text.product.premium.default.default'
};
const gradientRefs = Object.fromEntries(
  gradientItems.map((item) => [item, `semantic.color.gradient.composites.${item}`])
);

export default {
  name: 'engine',
  outputPath: 'data/foundation/engine/default.json',
  structure: {
    bg: {
      base: {
        items: ['primary', 'secondary', 'disabled']
      },
      brand: {
        levels: brandLevels,
        naming: 'intensity'
      },
      neutral: {
        levels: ambientNeutralLevels,
        naming: 'intensity'
      },
      feedback: {
        items: FEEDBACK_SCHEMA.items,
        variants: FEEDBACK_SCHEMA.variants,
        naming: 'variant'
      },
      product: {
        items: PRODUCT_SCHEMA.items,
        variants: PRODUCT_SCHEMA.variants,
        naming: 'variant'
      }
    },
    border: {
      base: {
        items: ['primary', 'secondary', 'tertiary', 'disabled']
      },
      brand: {
        levels: brandLevels,
        naming: 'intensity'
      },
      neutral: {
        levels: ambientNeutralLevels,
        naming: 'intensity'
      },
      feedback: {
        items: FEEDBACK_SCHEMA.items,
        variants: FEEDBACK_SCHEMA.variants,
        naming: 'variant'
      },
      product: {
        items: PRODUCT_SCHEMA.items,
        variants: PRODUCT_SCHEMA.variants,
        naming: 'variant'
      },
      width: {
        items: ['none', 'small', 'medium', 'large', 'extraLarge']
      },
      radii: {
        items: ['none', 'micro', 'extraSmall', 'small', 'medium', 'large', 'extraLarge', 'circular', 'mega'],
        mapping: {
          none: 'straight'
        }
      }
    },
    txt: {
      base: {
        items: [
          ...textBaseItems,
          'disabled',
          'info',
          'success',
          'warning',
          'danger',
          'primary',
          'secondary',
          'link',
          ...PRODUCT_SCHEMA.items
        ]
      },
      on: {
        brand: {
          levels: brandLevels,
          naming: 'intensity'
        },
        neutral: {
          levels: ambientNeutralLevels,
          naming: 'intensity'
        },
        feedback: {
          items: FEEDBACK_SCHEMA.items,
          variants: FEEDBACK_SCHEMA.variants,
          naming: 'variant'
        },
        product: {
          items: PRODUCT_SCHEMA.items,
          variants: PRODUCT_SCHEMA.variants,
          naming: 'variant'
        }
      }
    },
    gradient: {
      items: gradientItems
    },
    opacity: true,
    sizing: true,
    spacing: true,
    typography: true
  },
  references: {
    bg: {
      primary: 'semantic.color.brand.ambient.contrast.base.positive.background',
      secondary: 'semantic.color.brand.ambient.neutral.lowest.background',
      disabled: 'semantic.color.interface.function.disabled.normal.background',
      brand: brandBackgroundRefs,
      neutral: ambientBackgroundRefs,
      feedback: {
        pattern: 'semantic.color.interface.feedback.{item}.{variant}.normal.background'
      },
      product: {
        pattern: 'semantic.color.product.{item}.{variant}.default.background'
      }
    },
    border: {
      primary: 'semantic.color.brand.ambient.contrast.base.positive.border',
      secondary: `semantic.color.brand.ambient.grayscale.${secondaryGray}.border`,
      tertiary: `semantic.color.brand.ambient.grayscale.${tertiaryGray}.border`,
      disabled: 'semantic.color.interface.function.disabled.normal.border',
      brand: brandBorderRefs,
      neutral: ambientBorderRefs,
      feedback: {
        pattern: 'semantic.color.interface.feedback.{item}.{variant}.normal.border'
      },
      product: {
        pattern: 'semantic.color.product.{item}.{variant}.default.border'
      },
      width: {
        pattern: 'semantic.border.width.{item}'
      },
      radii: {
        pattern: 'semantic.border.radii.{item}',
        mapping: {
          none: 'straight'
        }
      }
    },
    txt: {
      ...textRefs,
      disabled: 'semantic.color.interface.function.disabled.normal.txtOn',
      ...defaultReadableTextRefs,
      on: {
        brand: brandTxtOnRefs,
        neutral: ambientTxtOnRefs,
        feedback: {
          pattern: 'semantic.color.interface.feedback.{item}.{variant}.normal.txtOn'
        },
        product: {
          pattern: 'semantic.color.product.{item}.{variant}.default.txtOn'
        }
      }
    },
    gradient: gradientRefs
  },
  styles: {
    typography: typographyContent,
    elevation: {
      level_minus_one: {
        color: '{semantic.opacity.color.grayscale.superTransparent}',
        type: 'innerShadow',
        x: '{semantic.dimension.sizing.zero}',
        y: '{semantic.dimension.sizing.zero}',
        blur: '{semantic.dimension.sizing.micro}',
        spread: '{semantic.depth.spread.close}'
      },
      level_zero: {
        color: '{semantic.opacity.color.grayscale.superTransparent}',
        type: 'dropShadow',
        x: '{semantic.dimension.sizing.zero}',
        y: '{semantic.dimension.sizing.zero}',
        blur: '{semantic.dimension.sizing.zero}',
        spread: '{semantic.depth.spread.close}'
      },
      level_one: {
        color: '{semantic.opacity.color.grayscale.superTransparent}',
        type: 'dropShadow',
        x: '{semantic.dimension.sizing.zero}',
        y: '{semantic.dimension.sizing.nano}',
        blur: '{semantic.dimension.sizing.small}',
        spread: '{semantic.depth.spread.next}'
      },
      level_two: {
        color: '{semantic.opacity.color.grayscale.superTransparent}',
        type: 'dropShadow',
        x: '{semantic.dimension.sizing.zero}',
        y: '{semantic.dimension.sizing.nano}',
        blur: '{semantic.dimension.sizing.large}',
        spread: '{semantic.depth.spread.next}'
      },
      level_three: {
        color: '{semantic.opacity.color.grayscale.superTransparent}',
        type: 'dropShadow',
        x: '{semantic.dimension.sizing.zero}',
        y: '{semantic.dimension.sizing.micro}',
        blur: '{semantic.dimension.sizing.extraLarge}',
        spread: '{semantic.depth.spread.near}'
      },
      level_four: {
        color: '{semantic.opacity.color.grayscale.superTransparent}',
        type: 'dropShadow',
        x: '{semantic.dimension.sizing.zero}',
        y: '{semantic.dimension.sizing.extraSmall}',
        blur: '{semantic.dimension.sizing.mega}',
        spread: '{semantic.depth.spread.near}'
      },
      level_five: {
        color: '{semantic.opacity.color.grayscale.superTransparent}',
        type: 'dropShadow',
        x: '{semantic.dimension.sizing.zero}',
        y: '{semantic.dimension.sizing.small}',
        blur: '{semantic.dimension.sizing.giga}',
        spread: '{semantic.depth.spread.distant}'
      },
      level_six: {
        color: '{semantic.opacity.color.grayscale.superTransparent}',
        type: 'dropShadow',
        x: '{semantic.dimension.sizing.zero}',
        y: '{semantic.dimension.sizing.large}',
        blur: '{semantic.dimension.sizing.giga}',
        spread: '{semantic.depth.spread.distant}'
      }
    }
  }
};
