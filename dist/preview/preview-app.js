const preview = window.__THEME_ENGINE_PREVIEW__;

const themeSelect = document.getElementById('theme-select');
const modeSelect = document.getElementById('mode-select');
const surfaceSelect = document.getElementById('surface-select');
const foundationSelect = document.getElementById('foundation-select');
const viewSelect = document.getElementById('view-select');
const stage = document.getElementById('preview-stage');
const stageKicker = document.getElementById('stage-kicker');
const stageTitle = document.getElementById('stage-title');
const stageCopy = document.getElementById('stage-copy');
const selectionSummary = document.getElementById('selection-summary');
const sectionsRoot = document.getElementById('preview-sections');
const sectionNav = document.getElementById('section-nav');

const semanticStylesheet = document.getElementById('semantic-css');
const foundationStylesheet = document.getElementById('foundation-css');
const typographyStylesheet = document.getElementById('typography-css');
const elevationStylesheet = document.getElementById('elevation-css');
let activeSemanticClass = null;
let activeSectionObserver = null;

const state = {
  theme: preview.themeOrder[0],
  mode: 'light',
  surface: 'positive',
  foundation: preview.foundations[0]?.id ?? null,
  view: 'detailed'
};

function humanize(value) {
  return String(value)
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'section';
}

function getCurrentTheme() {
  return preview.themes[state.theme];
}

function getCurrentCombination() {
  return getCurrentTheme()?.combinations?.[`${state.mode}-${state.surface}`] ?? null;
}

function getCurrentFoundation() {
  return preview.foundations.find((item) => item.id === state.foundation) ?? preview.foundations[0] ?? null;
}

function setOptions(select, options, currentValue) {
  select.innerHTML = '';
  for (const option of options) {
    const node = document.createElement('option');
    node.value = option.value;
    node.textContent = option.label;
    if (option.value === currentValue) {
      node.selected = true;
    }
    select.appendChild(node);
  }
}

function initControls() {
  setOptions(
    themeSelect,
    preview.themeOrder.map((themeId) => ({
      value: themeId,
      label: preview.themes[themeId].label
    })),
    state.theme
  );

  setOptions(
    foundationSelect,
    preview.foundations.map((foundation) => ({
      value: foundation.id,
      label: foundation.label
    })),
    state.foundation
  );

  setOptions(
    viewSelect,
    [
      { value: 'detailed', label: 'Detailed' },
      { value: 'summary', label: 'Summary' }
    ],
    state.view
  );

  themeSelect.addEventListener('change', () => {
    state.theme = themeSelect.value;
    render();
  });

  modeSelect.addEventListener('change', () => {
    state.mode = modeSelect.value;
    render();
  });

  surfaceSelect.addEventListener('change', () => {
    state.surface = surfaceSelect.value;
    render();
  });

  foundationSelect.addEventListener('change', () => {
    state.foundation = foundationSelect.value;
    render();
  });

  viewSelect.addEventListener('change', () => {
    state.view = viewSelect.value;
    render();
  });
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '').trim();
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;
  const int = Number.parseInt(value, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255
  };
}

function parseColor(color) {
  if (typeof color !== 'string') return null;
  if (color === 'transparent') {
    return { r: 255, g: 255, b: 255, alpha: 0 };
  }
  if (color.startsWith('#')) {
    const hex = color.replace('#', '').trim();
    if (hex.length === 4) {
      return {
        ...hexToRgb('#' + hex.slice(0, 3)),
        alpha: Number.parseInt(hex[3] + hex[3], 16) / 255
      };
    }
    if (hex.length === 8) {
      return {
        ...hexToRgb('#' + hex.slice(0, 6)),
        alpha: Number.parseInt(hex.slice(6, 8), 16) / 255
      };
    }
    return { ...hexToRgb(color), alpha: 1 };
  }
  const match = color.match(/^rgba?\(([^)]+)\)$/i);
  if (match) {
    const [r, g, b, alpha = '1'] = match[1].split(',').map((value) => value.trim());
    return {
      r: Number(r),
      g: Number(g),
      b: Number(b),
      alpha: Number(alpha)
    };
  }
  const hslMatch = color.match(/^hsla?\(([^)]+)\)$/i);
  if (!hslMatch) return null;
  const [hRaw, sRaw, lRaw, alphaRaw = '1'] = hslMatch[1].split(',').map((value) => value.trim());
  const h = ((Number(hRaw) % 360) + 360) % 360;
  const s = Number(String(sRaw).replace('%', '')) / 100;
  const l = Number(String(lRaw).replace('%', '')) / 100;
  const c = (1 - Math.abs((2 * l) - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - (c / 2);
  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;
  if (h < 60) [rPrime, gPrime, bPrime] = [c, x, 0];
  else if (h < 120) [rPrime, gPrime, bPrime] = [x, c, 0];
  else if (h < 180) [rPrime, gPrime, bPrime] = [0, c, x];
  else if (h < 240) [rPrime, gPrime, bPrime] = [0, x, c];
  else if (h < 300) [rPrime, gPrime, bPrime] = [x, 0, c];
  else [rPrime, gPrime, bPrime] = [c, 0, x];
  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
    alpha: Number(alphaRaw)
  };
}

function mixColor(foreground, background) {
  const fg = parseColor(foreground);
  const bg = parseColor(background);
  if (!fg || !bg) return background;
  const alpha = typeof fg.alpha === 'number' ? fg.alpha : 1;
  const r = Math.round((fg.r * alpha) + (bg.r * (1 - alpha)));
  const g = Math.round((fg.g * alpha) + (bg.g * (1 - alpha)));
  const b = Math.round((fg.b * alpha) + (bg.b * (1 - alpha)));
  return `rgb(${r}, ${g}, ${b})`;
}

function blendColors(colorA, colorB, ratio = 0.5) {
  const a = parseColor(colorA);
  const b = parseColor(colorB);
  if (!a || !b) return colorA;
  const mix = Math.max(0, Math.min(1, ratio));
  const inverse = 1 - mix;
  const r = Math.round((a.r * inverse) + (b.r * mix));
  const g = Math.round((a.g * inverse) + (b.g * mix));
  const bChannel = Math.round((a.b * inverse) + (b.b * mix));
  return `rgb(${r}, ${g}, ${bChannel})`;
}

function relativeLuminance(color) {
  const parsed = parseColor(color);
  if (!parsed) return null;
  const channel = (value) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return (0.2126 * channel(parsed.r)) + (0.7152 * channel(parsed.g)) + (0.0722 * channel(parsed.b));
}

function contrastRatio(colorA, colorB) {
  const a = relativeLuminance(colorA);
  const b = relativeLuminance(colorB);
  if (a == null || b == null) return null;
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

function ratioLabel(ratio) {
  return ratio == null ? '—' : (Math.round(ratio * 10) / 10).toFixed(1) + ':1';
}

function wcagLevel(ratio) {
  if (ratio == null) return null;
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA Large';
  return 'fail';
}

function metricClass(ratio, threshold = 4.5) {
  if (ratio == null) return 'metric--warn';
  return ratio >= threshold ? 'metric--pass' : 'metric--fail';
}

function isColorString(value) {
  return typeof value === 'string' && (
    value.startsWith('#') ||
    value.startsWith('rgb(') ||
    value.startsWith('rgba(') ||
    value === 'transparent' ||
    value.startsWith('linear-gradient(')
  );
}

function collectLeafEntries(node, pathParts = [], out = []) {
  if (node == null) {
    return out;
  }

  if (typeof node !== 'object' || Array.isArray(node)) {
    out.push({
      pathParts,
      path: pathParts.join('.'),
      value: node
    });
    return out;
  }

  for (const [key, value] of Object.entries(node)) {
    collectLeafEntries(value, [...pathParts, key], out);
  }

  return out;
}

function pickBestEntry(entries, descriptors = []) {
  const scored = entries
    .map((entry) => {
      const path = entry.path.toLowerCase();
      let score = 0;

      for (const descriptor of descriptors) {
        const includes = descriptor.include ?? [];
        const excludes = descriptor.exclude ?? [];
        const exact = descriptor.exact ?? [];

        if (exact.some((candidate) => path === String(candidate).toLowerCase())) {
          score += descriptor.exactScore ?? 120;
        }

        if (includes.every((candidate) => path.includes(String(candidate).toLowerCase()))) {
          score += descriptor.score ?? (includes.length * 12);
        }

        if (excludes.some((candidate) => path.includes(String(candidate).toLowerCase()))) {
          score -= descriptor.excludeScore ?? 40;
        }
      }

      return { entry, score };
    })
    .sort((left, right) => right.score - left.score || left.entry.path.localeCompare(right.entry.path));

  return scored.find((item) => item.score > 0)?.entry ?? null;
}

function discoverFoundationRole(node, descriptors = [], predicate = () => true) {
  const entries = collectLeafEntries(node)
    .filter((entry) => predicate(entry.value, entry.path));

  const picked = pickBestEntry(entries, descriptors);
  return picked?.value ?? entries[0]?.value ?? null;
}

function getExistingSectionNode(root, candidateKeys = []) {
  if (!root || typeof root !== 'object') {
    return null;
  }

  for (const key of candidateKeys) {
    if (root[key] && typeof root[key] === 'object') {
      return {
        key,
        node: root[key]
      };
    }
  }

  return null;
}

function discoverFoundationSectionRole(root, sectionKeys = [], descriptors = [], predicate = () => true) {
  const section = getExistingSectionNode(root, sectionKeys);
  if (!section) {
    return null;
  }

  const entries = collectLeafEntries(section.node, [section.key])
    .filter((entry) => predicate(entry.value, entry.path));
  const picked = pickBestEntry(entries, descriptors);
  return picked?.value ?? entries[0]?.value ?? null;
}

function discoverPreviewRoles(foundationTokens, semanticTokens) {
  const isPreviewColor = (value) => isColorString(value) && !String(value).startsWith('linear-gradient(');
  const canvasColor = getPath(semanticTokens, ['color', 'brand', 'ambient', 'contrast', 'base', 'positive', 'background'])
    ?? discoverFoundationSectionRole(
      foundationTokens,
      ['bg', 'background'],
      [
        { include: ['primary'], score: 160 },
        { include: ['base'], score: 140 },
        { include: ['default'], score: 110 }
      ],
      isPreviewColor
    ) ?? discoverFoundationRole(
      foundationTokens,
      [
        { include: ['bg', 'primary'], score: 120 },
        { include: ['background', 'primary'], score: 120 },
        { include: ['bg', 'base'], score: 100 },
        { include: ['background', 'base'], score: 100 }
      ],
      isPreviewColor
    ) ?? '#ffffff';

  const deepCanvasColor = getPath(semanticTokens, ['color', 'brand', 'ambient', 'contrast', 'deep', 'positive', 'background'])
    ?? discoverFoundationSectionRole(
      foundationTokens,
      ['bg', 'background'],
      [
        { include: ['deep'], score: 170 },
        { include: ['high'], score: 140 },
        { include: ['strong'], score: 120 }
      ],
      isPreviewColor
    ) ?? discoverFoundationRole(
      foundationTokens,
      [
        { include: ['bg', 'deep'], score: 120 },
        { include: ['background', 'deep'], score: 120 },
        { include: ['bg', 'high'], score: 100 },
        { include: ['background', 'high'], score: 100 },
        { include: ['brand', 'high'], score: 80 }
      ],
      isPreviewColor
    ) ?? canvasColor;

  const panelColor = blendColors(canvasColor, deepCanvasColor, 0.08);
  const panelAltColor = blendColors(canvasColor, deepCanvasColor, 0.16);

  const titleColor = semanticTokens.color?.text?.title
    ?? discoverFoundationSectionRole(
    foundationTokens,
    ['txt', 'text'],
    [
      { include: ['title'], score: 170 },
      { include: ['primary'], score: 150 },
      { include: ['heading'], score: 140 }
    ],
    isPreviewColor
  ) ?? discoverFoundationRole(
    foundationTokens,
    [
      { include: ['txt', 'title'], score: 120 },
      { include: ['text', 'title'], score: 120 },
      { include: ['txt', 'primary'], score: 110 }
    ],
    isPreviewColor
  ) ?? '#111111';

  const subtitleColor = semanticTokens.color?.text?.body
    ?? discoverFoundationSectionRole(
    foundationTokens,
    ['txt', 'text'],
    [
      { include: ['body'], score: 170 },
      { include: ['content'], score: 150 },
      { include: ['secondary'], score: 140 }
    ],
    isPreviewColor
  ) ?? discoverFoundationRole(
    foundationTokens,
    [
      { include: ['txt', 'body'], score: 120 },
      { include: ['text', 'body'], score: 120 },
      { include: ['txt', 'content'], score: 110 },
      { include: ['txt', 'secondary'], score: 100 }
    ],
    isPreviewColor
  ) ?? titleColor;

  const mutedColor = semanticTokens.color?.text?.muted
    ?? discoverFoundationSectionRole(
    foundationTokens,
    ['txt', 'text'],
    [
      { include: ['muted'], score: 170 },
      { include: ['disabled'], score: 150 },
      { include: ['label'], score: 140 },
      { include: ['subtle'], score: 120 }
    ],
    isPreviewColor
  ) ?? discoverFoundationRole(
    foundationTokens,
    [
      { include: ['txt', 'muted'], score: 120 },
      { include: ['text', 'muted'], score: 120 },
      { include: ['txt', 'disabled'], score: 100 },
      { include: ['txt', 'label'], score: 90 }
    ],
    isPreviewColor
  ) ?? subtitleColor;

  const borderColor = getPath(semanticTokens, ['color', 'brand', 'ambient', 'contrast', 'base', 'positive', 'border'])
    ?? getPath(semanticTokens, ['color', 'brand', 'ambient', 'contrast', 'deep', 'positive', 'border'])
    ?? discoverFoundationSectionRole(
      foundationTokens,
      ['border'],
      [
        { include: ['primary'], score: 160 },
        { include: ['default'], score: 140 },
        { include: ['secondary'], score: 130 },
        { include: ['neutral'], score: 110 }
      ],
      isPreviewColor
    ) ?? discoverFoundationRole(
      foundationTokens,
      [
        { include: ['border', 'primary'], score: 120 },
        { include: ['border', 'default'], score: 110 },
        { include: ['border', 'secondary'], score: 100 }
      ],
      isPreviewColor
    ) ?? getPath(semanticTokens, ['color', 'brand', 'ambient', 'grayscale', 'lower', 'border'])
    ?? getPath(semanticTokens, ['color', 'brand', 'ambient', 'neutral', 'low', 'border'])
    ?? 'rgba(15, 23, 42, 0.14)';

  return {
    canvasColor,
    deepCanvasColor,
    panelColor,
    panelAltColor,
    titleColor,
    subtitleColor,
    mutedColor,
    borderColor
  };
}

function buildShadowCss(shadow) {
  if (!shadow || typeof shadow !== 'object') {
    return '';
  }

  const inset = String(shadow.type ?? '').toLowerCase() === 'innershadow' ? 'inset ' : '';
  const x = shadow.x ?? '0px';
  const y = shadow.y ?? '0px';
  const blur = shadow.blur ?? '0px';
  const spread = shadow.spread ?? '0px';
  const color = shadow.color ?? 'rgba(0,0,0,0.2)';
  return `${inset}${x} ${y} ${blur} ${spread} ${color}`.trim();
}

function buildTypographyCss(style) {
  if (!style || typeof style !== 'object') {
    return '';
  }

  const declarations = [
    style.fontFamily ? `font-family:${style.fontFamily}` : null,
    style.fontWeight ? `font-weight:${style.fontWeight}` : null,
    style.fontSize ? `font-size:${style.fontSize}` : null,
    style.lineHeight ? `line-height:${style.lineHeight}` : null,
    style.letterSpacing ? `letter-spacing:${style.letterSpacing}` : null,
    style.textCase ? `text-transform:${style.textCase}` : null,
    style.textDecoration ? `text-decoration:${style.textDecoration}` : null
  ].filter(Boolean);

  return declarations.join(';');
}

function buildTypographyPreviewCss(style) {
  if (!style || typeof style !== 'object') {
    return '';
  }

  const fontSize = asCssLength(style.fontSize) ?? style.fontSize;
  const letterSpacing = asCssLength(style.letterSpacing) ?? style.letterSpacing;
  const textDecoration = String(style.textDecoration ?? '').toLowerCase() === 'default'
    ? null
    : style.textDecoration;

  const declarations = [
    style.fontFamily ? ('font-family:' + style.fontFamily) : null,
    style.fontWeight ? ('font-weight:' + style.fontWeight) : null,
    fontSize ? ('font-size:' + fontSize) : null,
    letterSpacing ? ('letter-spacing:' + letterSpacing) : null,
    style.textCase ? ('text-transform:' + style.textCase) : null,
    textDecoration ? ('text-decoration:' + textDecoration) : null
  ].filter(Boolean);

  return declarations.join(';');
}

function renderCompoundDescription(description) {
  if (!description) {
    return '';
  }

  return `<p class="section-copy">${escapeHtml(description)}</p>`;
}

function isQuartetToken(node) {
  return node && typeof node === 'object' && !Array.isArray(node) && 'background' in node;
}

function isFlatColorMap(node) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return false;
  const values = Object.values(node);
  return values.length > 0 && values.every((value) => isColorString(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function getPath(object, pathParts) {
  return pathParts.reduce((current, part) => current?.[part], object);
}

function resolveNodeValueReferences(node, semanticTokens) {
  if (Array.isArray(node)) {
    return node.map((item) => resolveNodeValueReferences(item, semanticTokens));
  }

  if (node && typeof node === 'object') {
    return Object.fromEntries(
      Object.entries(node).map(([key, value]) => [key, resolveNodeValueReferences(value, semanticTokens)])
    );
  }

  return resolveReferenceValue(node, semanticTokens);
}

function resolveReferenceValue(value, semanticTokens) {
  if (typeof value !== 'string') {
    return value;
  }

  if (!value.startsWith('{semantic.') || !value.endsWith('}')) {
    return value;
  }

  const path = value.slice('{semantic.'.length, -1);
  return getPath(semanticTokens, path.split('.')) ?? value;
}

function isLevelKey(value) {
  return ['lowest', 'low', 'mid', 'default', 'high', 'highest', 'lower', 'upper', 'base', 'deep'].includes(String(value));
}

function isPolarityKey(value) {
  return ['positive', 'negative'].includes(String(value));
}

function isVariantKey(value) {
  return ['first', 'second', 'third', 'fourth', 'fifth', 'primary', 'secondary', 'default'].includes(String(value));
}

function isStateKey(value) {
  return ['normal', 'action', 'active', 'focus', 'disabled', 'hover', 'pressed'].includes(String(value));
}

function inferKeyOrder(keys = []) {
  const normalized = keys.map((key) => String(key));
  if (normalized.length === 0) {
    return null;
  }

  const families = [
    ['positive', 'negative'],
    ['none', 'lowest', 'lower', 'low', 'mid', 'default', 'high', 'higher', 'highest', 'base', 'deep'],
    ['normal', 'action', 'active', 'focus', 'disabled', 'hover', 'pressed'],
    ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'primary', 'secondary', 'tertiary', 'quaternary', 'default'],
    ['zero', 'micro', 'extraSmall', 'small', 'medium', 'large', 'extraLarge', 'huge'],
    ['close', 'next', 'near', 'distant', 'far']
  ];

  for (const family of families) {
    if (normalized.every((key) => family.includes(key))) {
      return family;
    }
  }

  if (normalized.every((key) => key !== '' && Number.isFinite(Number(key)))) {
    return [...normalized].sort((left, right) => Number(left) - Number(right));
  }

  return null;
}

function classifyKeyFamily(keys = []) {
  if (keys.length === 0) {
    return 'unknown';
  }

  if (keys.every(isPolarityKey)) {
    return 'polarity';
  }

  if (keys.every(isLevelKey)) {
    return 'level';
  }

  if (keys.every(isStateKey)) {
    return 'state';
  }

  if (keys.every(isVariantKey)) {
    return 'variant';
  }

  const inferred = inferKeyOrder(keys);
  if (!inferred) {
    return 'unknown';
  }

  if (inferred.every(isPolarityKey)) {
    return 'polarity';
  }
  if (inferred.every(isLevelKey)) {
    return 'level';
  }
  if (inferred.every(isStateKey)) {
    return 'state';
  }
  if (inferred.every(isVariantKey)) {
    return 'variant';
  }

  return 'unknown';
}

function orderKeys(keys, preferred) {
  const finalPreferred = preferred?.length ? preferred : inferKeyOrder(keys) ?? [];
  const preferredIndex = new Map(finalPreferred.map((key, index) => [String(key), index]));
  return [...keys].sort((left, right) => {
    const leftKey = String(left);
    const rightKey = String(right);
    const leftIndex = preferredIndex.has(leftKey) ? preferredIndex.get(leftKey) : Number.MAX_SAFE_INTEGER;
    const rightIndex = preferredIndex.has(rightKey) ? preferredIndex.get(rightKey) : Number.MAX_SAFE_INTEGER;
    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }
    return leftKey.localeCompare(rightKey);
  });
}

function matchesPreferredCollection(keys, preferred = []) {
  const normalizedKeys = keys.map((key) => String(key));
  const normalizedPreferred = preferred.map((key) => String(key));
  if (normalizedKeys.length === 0 || normalizedPreferred.length === 0) {
    return false;
  }

  return normalizedKeys.some((key) => normalizedPreferred.includes(key))
    && normalizedKeys.every((key) => normalizedPreferred.includes(key));
}

function discoverSchemaPreferredOrder(keys, semanticSchema) {
  const collections = semanticSchema.orderingCollections ?? [];
  return collections.find((collection) => matchesPreferredCollection(keys, collection)) ?? null;
}

function sortEntriesForPath(tokenPath, entries) {
  const semanticSchema = preview.schema?.semantic ?? {};
  const keys = entries.map(([key]) => key);
  const preferred = discoverSchemaPreferredOrder(keys, semanticSchema);

  const orderedKeys = orderKeys(keys, preferred);
  const byKey = new Map(entries.map(([key, value]) => [String(key), [key, value]]));
  return orderedKeys.map((key) => byKey.get(String(key))).filter(Boolean);
}

function renderQuartetCard(node, tokenPath, canvasColor, label = null) {
  const background = node.background ?? 'transparent';
  const effectiveBackground = background === 'transparent'
    ? canvasColor
    : mixColor(background, canvasColor);
  const txtOnRatio = node.txtOn ? contrastRatio(node.txtOn, effectiveBackground) : null;
  const txtRatio = node.txt ? contrastRatio(node.txt, canvasColor) : null;
  const cardLabel = escapeHtml(label ?? tokenPath.split('.').slice(-1)[0]);
  const isDefault = (tokenPath.split('.').slice(-1)[0] === 'default');
  const highlightAttr = isDefault ? ' class="is-highlight"' : '';
  const wcagLvl = wcagLevel(txtOnRatio);
  const metricBadge = txtOnRatio != null
    ? `<span class="metric ${metricClass(txtOnRatio)}">txtOn ${ratioLabel(txtOnRatio)}${wcagLvl ? ' ' + wcagLvl : ''}</span>`
    : '';
  const metricCompact = txtOnRatio != null
    ? `<span class="metric metric-compact ${metricClass(txtOnRatio)}">${ratioLabel(txtOnRatio)}</span>`
    : '';

  const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>`;

  const fullCard = `<article class="token-card${isDefault ? ' is-highlight' : ''}" data-token-path="${escapeHtml(tokenPath)}" data-contrast-level="${wcagLvl ?? ''}" data-section="${escapeHtml(tokenPath.split('.')[0] ?? '')}">
      <div class="token-preview">
        <div class="token-preview__sample" style="background:${escapeHtml(background)};border-color:${escapeHtml(node.border ?? background)};color:${escapeHtml(node.txtOn ?? '#111111')}">
          <h3>Surface sample</h3>
          <p>Background, border, and txtOn</p>
        </div>
      </div>
      <div class="token-body">
        <div class="token-body__header">
          <div>
            <h5 class="token-title" title="${cardLabel}">${cardLabel}</h5>
            <div class="token-path" title="${escapeHtml(tokenPath)}">${escapeHtml(tokenPath)}</div>
          </div>
          <button class="copy-btn" onclick="navigator.clipboard.writeText('${escapeHtml(tokenPath)}')" title="Copy path">${copyIcon}</button>
        </div>
        <dl class="meta-list">
          <div><dt>background</dt><dd>${escapeHtml(String(node.background ?? '—'))}</dd></div>
          ${node.txtOn ? `<div><dt>txtOn</dt><dd>${escapeHtml(node.txtOn)}</dd></div>` : ''}
          ${node.border ? `<div><dt>border</dt><dd>${escapeHtml(node.border)}</dd></div>` : ''}
          ${node.txt ? `<div><dt>txt</dt><dd>${escapeHtml(node.txt)}</dd></div>` : ''}
        </dl>
        <div class="metric-row">${metricBadge}</div>
      </div>
    </article>`;

  const compactCard = `<article class="token-card-compact${isDefault ? ' is-highlight' : ''}" data-token-path="${escapeHtml(tokenPath)}" data-contrast-level="${wcagLvl ?? ''}" data-section="${escapeHtml(tokenPath.split('.')[0] ?? '')}">
      <div class="token-preview-compact" style="background:${escapeHtml(background)};color:${escapeHtml(node.txtOn ?? '#111111')}">
        <div class="token-preview-compact__info">
          <div class="token-preview-compact__level">${cardLabel}</div>
          <div class="token-preview-compact__hex">${escapeHtml(background)}</div>
        </div>
        <div class="token-preview-compact__circle" style="background:${escapeHtml(node.txtOn ?? '#111111')}" title="txtOn: ${escapeHtml(node.txtOn ?? '')}"></div>
      </div>
      <div class="token-body-compact">
        <div class="token-body-compact__path" title="${escapeHtml(tokenPath)}">${escapeHtml(tokenPath)}</div>
        <button class="copy-btn" onclick="navigator.clipboard.writeText('${escapeHtml(tokenPath)}')" title="Copy path">${copyIcon}</button>
        ${metricCompact}
      </div>
    </article>`;

  return `<div class="tc-wrapper"><div class="tc-full">${fullCard}</div><div class="tc-compact">${compactCard}</div></div>`;
}

function renderCompositeMetaRows(composite) {
  if (!composite || typeof composite !== 'object') {
    return '';
  }

  const rows = Object.entries(composite)
    .map(([key, value]) => `<div><dt>${escapeHtml(humanize(key))}</dt><dd>${escapeHtml(String(value))}</dd></div>`)
    .join('');

  if (!rows) {
    return '';
  }

  return `
    <div class="composite-block">
      <div class="composite-title">Composite tokens</div>
      <dl class="meta-list">${rows}</dl>
    </div>
  `;
}

function parseLinearGradient(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const match = value.match(/^linear-gradient\((.+)\)$/i);
  if (!match) {
    return null;
  }

  const parts = match[1]
    .split(/,(?![^()]*\))/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 3) {
    return null;
  }

  const degree = Number.parseFloat(parts[0].replace(/deg$/i, '').trim());
  if (!Number.isFinite(degree)) {
    return null;
  }

  const stops = parts.slice(1).map((part) => {
    const stopMatch = part.match(/^(#[0-9a-f]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\)|[a-z]+)\s+(-?\d+(?:\.\d+)?)%$/i);
    if (!stopMatch) {
      return null;
    }

    return {
      color: stopMatch[1],
      step: Number.parseFloat(stopMatch[2])
    };
  });

  if (stops.some((stop) => stop == null)) {
    return null;
  }

  return { degree, stops };
}

function findGradientKeyByValue(map, value) {
  if (!map || typeof map !== 'object') {
    return null;
  }

  const normalized = typeof value === 'string'
    ? value.trim().toLowerCase()
    : String(value);

  return Object.entries(map).find(([, candidate]) => {
    if (typeof candidate === 'string') {
      return candidate.trim().toLowerCase() === normalized;
    }
    return Number(candidate) === Number(value);
  })?.[0] ?? null;
}

function extractGradientCompositeKey(tokenPath) {
  const parts = String(tokenPath).split('.');
  const gradientIndex = parts.indexOf('gradient');
  const compositesIndex = parts.indexOf('composites');

  if (gradientIndex === -1 || compositesIndex === -1 || compositesIndex !== gradientIndex + 1) {
    return null;
  }

  return parts.slice(compositesIndex + 1).join('.') || null;
}

function gradientCompositeMeta(tokenPath, value, tokens) {
  const key = extractGradientCompositeKey(tokenPath);
  if (!key) {
    return null;
  }

  const gradientRoot = tokens?.color?.gradient;
  const parsed = parseLinearGradient(value);
  const config = gradientRoot?.config ?? {};
  const colors = config.colors?.[key] ?? {};

  if (!parsed || parsed.stops.length < 2) {
    return gradientRoot?.config
      ? {
          degree: 'semantic.color.gradient.config.degrees.horizontal',
          startColor: colors.lowest ? `semantic.color.gradient.config.colors.${key}.lowest` : '—',
          startStep: 'semantic.color.gradient.config.steps.0',
          endColor: colors.default ? `semantic.color.gradient.config.colors.${key}.default` : '—',
          endStep: 'semantic.color.gradient.config.steps.100'
        }
      : null;
  }

  const [start, end] = [parsed.stops[0], parsed.stops[parsed.stops.length - 1]];
  const degreeKey = findGradientKeyByValue(config.degrees, parsed.degree);
  const startStepKey = findGradientKeyByValue(config.steps, start.step);
  const endStepKey = findGradientKeyByValue(config.steps, end.step);
  const startColorKey = findGradientKeyByValue(colors, start.color);
  const endColorKey = findGradientKeyByValue(colors, end.color);

  return {
    degree: degreeKey
      ? `semantic.color.gradient.config.degrees.${degreeKey}`
      : `${parsed.degree}deg`,
    startColor: startColorKey
      ? `semantic.color.gradient.config.colors.${key}.${startColorKey}`
      : start.color,
    startStep: startStepKey
      ? `semantic.color.gradient.config.steps.${startStepKey}`
      : `${start.step}%`,
    endColor: endColorKey
      ? `semantic.color.gradient.config.colors.${key}.${endColorKey}`
      : end.color,
    endStep: endStepKey
      ? `semantic.color.gradient.config.steps.${endStepKey}`
      : `${end.step}%`
  };
}

function renderFlatColorCard(label, value, tokenPath, canvasColor, composite = null) {
  const contrast = !String(tokenPath).includes('.gradient')
    ? contrastRatio(value, canvasColor)
    : null;
  const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>`;

  return `
    <article class="token-card" data-token-path="${escapeHtml(tokenPath)}" data-section="${escapeHtml(tokenPath.split('.')[0] ?? '')}">
      <div class="token-preview is-flat" style="background:${escapeHtml(value)}; min-height:64px; border-radius:0;">
      </div>
      <div class="token-body">
        <div class="token-body__header">
          <div>
            <h5 class="token-title" title="${escapeHtml(label)}">${escapeHtml(label)}</h5>
            <div class="token-path" title="${escapeHtml(tokenPath)}">${escapeHtml(tokenPath)}</div>
          </div>
          <button class="copy-btn" onclick="navigator.clipboard.writeText('${escapeHtml(tokenPath)}')" title="Copy path">${copyIcon}</button>
        </div>
        <dl class="meta-list">
          <div><dt>value</dt><dd>${escapeHtml(value)}</dd></div>
        </dl>
        ${renderCompositeMetaRows(composite ?? gradientCompositeMeta(tokenPath, value, preview.tokens))}
        ${contrast != null ? `<div class="metric-row"><span class="metric ${metricClass(contrast)}">canvas ${ratioLabel(contrast)}</span></div>` : ''}
      </div>
    </article>
  `;
}

function renderQuartetCollection(node, tokenPath, canvasColor, layoutClass = 'token-grid') {
  const cards = Object.entries(node)
    .map(([key, value]) => renderQuartetCard(value, `${tokenPath}.${key}`, canvasColor, humanize(key)))
    .join('');
  return `<div class="${layoutClass}">${cards}</div>`;
}

function collectQuartetTokens(node, tokenPath, out = []) {
  if (!node || typeof node !== 'object') {
    return out;
  }

  if (isQuartetToken(node)) {
    out.push({
      tokenPath,
      label: humanize(tokenPath.split('.').slice(-1)[0] ?? tokenPath),
      node
    });
    return out;
  }

  for (const [key, value] of sortEntriesForPath(tokenPath, Object.entries(node))) {
    if (value == null) {
      continue;
    }
    const childPath = tokenPath ? `${tokenPath}.${key}` : key;
    collectQuartetTokens(value, childPath, out);
  }

  return out;
}

function renderSummaryTableRow(item, canvasColor) {
  const node = item.node;
  const background = node.background ?? 'transparent';
  const effectiveBackground = background === 'transparent'
    ? canvasColor
    : mixColor(background, canvasColor);
  const txtOnRatio = node.txtOn ? contrastRatio(node.txtOn, effectiveBackground) : null;
  const txtRatio = node.txt ? contrastRatio(node.txt, canvasColor) : null;
  const canvasSampleBackground = mixColor(canvasColor, '#ffffff', 0.12);

  return `
    <tr>
      <td class="summary-table__token">
        <strong>${escapeHtml(item.label)}</strong>
        <span class="summary-table__path">${escapeHtml(item.tokenPath)}</span>
      </td>
      <td>
        <div class="summary-swatch" style="border-color:${escapeHtml(node.border ?? 'transparent')}">
          <div class="summary-swatch__chips">
            ${node.txtOn ? `<span class="token-chip" style="color:${escapeHtml(node.txtOn)}">txtOn</span>` : ''}
            ${node.txt ? `<span class="token-chip" style="color:${escapeHtml(node.txt)}">txt</span>` : ''}
          </div>
          <div class="summary-swatch__sample" style="background:${escapeHtml(background)}; color:${escapeHtml(node.txtOn ?? '#111111')}">
            <strong>Surface sample</strong>
            <span>bg, txtOn, border</span>
          </div>
          <div class="summary-swatch__sample summary-swatch__sample--canvas" style="background:${escapeHtml(canvasSampleBackground)}; color:${escapeHtml(node.txt ?? node.txtOn ?? '#111111')}">
            <strong>Canvas text</strong>
            <span>txt over the page canvas</span>
          </div>
        </div>
      </td>
      <td>${escapeHtml(String(node.background ?? '—'))}</td>
      <td>${escapeHtml(String(node.txtOn ?? '—'))}</td>
      <td>${escapeHtml(String(node.border ?? '—'))}</td>
      <td>${escapeHtml(String(node.txt ?? '—'))}</td>
      <td>
        <div class="summary-table__metrics">
          ${node.txtOn ? `<span class="metric ${metricClass(txtOnRatio)}">txtOn ${ratioLabel(txtOnRatio)}</span>` : ''}
          ${node.txt ? `<span class="metric ${metricClass(txtRatio)}">txt ${ratioLabel(txtRatio)}</span>` : ''}
        </div>
      </td>
    </tr>
  `;
}

function renderSummarySection(section, canvasColor) {
  const items = collectQuartetTokens(section.node, section.key).filter((item) => item?.node);
  if (items.length === 0) {
    return '';
  }

  const rows = items
    .map((item) => renderSummaryTableRow(item, canvasColor))
    .join('');

  return `
    <section class="section-card elevation-level_one summary-section">
      <h3>${escapeHtml(section.title)}</h3>
      <p class="summary-section__copy">${escapeHtml(section.copy)}</p>
      <div class="summary-table-wrap">
        <table class="summary-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Preview</th>
              <th>Background</th>
              <th>TxtOn</th>
              <th>Border</th>
              <th>Txt</th>
              <th>Contrast</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderFlatCollection(node, tokenPath, canvasColor, layoutClass = 'token-grid', compositeResolver = null) {
  const cards = Object.entries(node)
    .map(([key, value]) => {
      const childPath = `${tokenPath}.${key}`;
      return renderFlatColorCard(
        humanize(key),
        value,
        childPath,
        canvasColor,
        compositeResolver ? compositeResolver(key, value, childPath) : null
      );
    })
    .join('');
  return `<div class="${layoutClass}">${cards}</div>`;
}

function renderNestedGroups(node, tokenPath, canvasColor, depth, layoutClass = 'group-stack', cardClass = '') {
  const headingTag = depth === 0 ? 'h4' : 'h5';
  const groups = sortEntriesForPath(tokenPath, Object.entries(node))
    .map(([key, value]) => {
      if (value == null) return '';
      const childPath = tokenPath ? `${tokenPath}.${key}` : key;
      const childContent = renderColorNode(key, value, childPath, canvasColor, depth + 1);
      if (!childContent) return '';
      return `
        <div class="group-card ${cardClass}">
          <${headingTag}>${escapeHtml(humanize(key))}</${headingTag}>
          ${childContent}
        </div>
      `;
    })
    .filter(Boolean)
    .join('');

  return groups ? `<div class="${layoutClass}">${groups}</div>` : '';
}

function renderColorNode(title, node, tokenPath, canvasColor, depth = 0) {
  if (!node || typeof node !== 'object') {
    return '';
  }

  if (isQuartetToken(node)) {
    return `<div class="token-grid">${renderQuartetCard(node, tokenPath, canvasColor, humanize(title))}</div>`;
  }

  if (isFlatColorMap(node)) {
    return renderFlatCollection(node, tokenPath, canvasColor);
  }

  const entries = sortEntriesForPath(tokenPath, Object.entries(node)).filter(([, value]) => value != null);
  if (entries.length === 0) {
    return '';
  }

  const keys = entries.map(([key]) => key);
  const family = classifyKeyFamily(keys);
  const valuesAreQuartets = entries.every(([, value]) => isQuartetToken(value));
  const valuesAreFlatColors = entries.every(([, value]) => isColorString(value));

  if (family === 'polarity' && valuesAreQuartets) {
    return renderQuartetCollection(Object.fromEntries(entries), tokenPath, canvasColor, 'token-grid token-grid--pair');
  }

  if ((family === 'level' || family === 'state') && valuesAreQuartets) {
    return renderQuartetCollection(Object.fromEntries(entries), tokenPath, canvasColor, 'token-grid token-grid--line');
  }

  if ((family === 'level' || family === 'state') && valuesAreFlatColors) {
    return renderFlatCollection(Object.fromEntries(entries), tokenPath, canvasColor, 'token-grid token-grid--line');
  }

  if (valuesAreQuartets) {
    return renderQuartetCollection(Object.fromEntries(entries), tokenPath, canvasColor);
  }

  if (valuesAreFlatColors) {
    if (tokenPath.endsWith('gradient.composites')) {
      return renderFlatCollection(
        Object.fromEntries(entries),
        tokenPath,
        canvasColor,
        'token-grid',
        (key, value, childPath) => gradientCompositeMeta(childPath, value, preview.tokens)
      );
    }
    return renderFlatCollection(Object.fromEntries(entries), tokenPath, canvasColor);
  }

  if (family === 'polarity') {
    return renderNestedGroups(Object.fromEntries(entries), tokenPath, canvasColor, depth, 'group-grid group-grid--pair', 'group-card--pair');
  }

  if (family === 'level' || family === 'state') {
    return renderNestedGroups(Object.fromEntries(entries), tokenPath, canvasColor, depth, 'group-grid', 'group-card--compact');
  }

  if (family === 'variant') {
    return renderNestedGroups(Object.fromEntries(entries), tokenPath, canvasColor, depth, 'group-stack', 'group-card--line');
  }

  return renderNestedGroups(Object.fromEntries(entries), tokenPath, canvasColor, depth, 'group-stack', 'group-card--line');
}

function flattenLeafValues(node, trail = [], out = {}) {
  if (node == null) {
    return out;
  }

  if (typeof node !== 'object' || Array.isArray(node)) {
    out[trail.join(' / ')] = String(node);
    return out;
  }

  for (const [key, value] of sortEntriesForPath(trail[0] === 'foundation' ? trail.join('.') : trail.join('.'), Object.entries(node))) {
    flattenLeafValues(value, [...trail, humanize(key)], out);
  }

  return out;
}

function renderInfoCards(title, entries) {
  if (!entries || Object.keys(entries).length === 0) {
    return '<div class="empty-state">No previewable values in this section.</div>';
  }

  const cards = Object.entries(entries)
    .map(([key, value]) => `
      <article class="info-card">
        <div class="info-label">${escapeHtml(humanize(key))}</div>
        ${renderInfoPreview(key, value, title)}
        <div class="info-value">${escapeHtml(String(value))}</div>
      </article>
    `)
    .join('');

  return `
    <section class="section-card section-card--compact elevation-level_one">
      <h3>${escapeHtml(title)}</h3>
      <div class="dimension-grid">${cards}</div>
    </section>
  `;
}

function renderInfoCardCollection(entries, title = '') {
  return Object.entries(entries)
    .map(([key, value]) => `
      <article class="info-card">
        <div class="info-label">${escapeHtml(humanize(key))}</div>
        ${renderInfoPreview(key, value, title)}
        <div class="info-value">${escapeHtml(String(value))}</div>
      </article>
    `)
    .join('');
}

function isPrimitiveSupportValue(value) {
  return typeof value !== 'object' || value == null || Array.isArray(value);
}

function isObjectOfPrimitiveSupportValues(node) {
  return node
    && typeof node === 'object'
    && !Array.isArray(node)
    && Object.values(node).length > 0
    && Object.values(node).every((value) => isPrimitiveSupportValue(value));
}

function isObjectOfObjectPrimitiveSupportValues(node) {
  return node
    && typeof node === 'object'
    && !Array.isArray(node)
    && Object.values(node).length > 0
    && Object.values(node).every((value) => isObjectOfPrimitiveSupportValues(value));
}

function isTabularSupportPath(tokenPath) {
  const path = String(tokenPath).toLowerCase();
  return [
    'font',
    'lineheight',
    'letterspacing',
    'paragraphspacing',
    'paragraphindent',
    'textcase',
    'textdecoration',
    'dimension',
    'sizing',
    'spacing',
    'depth',
    'border.width',
    'border.radii',
    'opacity.raw'
  ].some((fragment) => path.includes(fragment));
}

function asCssLength(value) {
  if (typeof value === 'number') {
    return String(value) + 'px';
  }

  const text = String(value).trim();
  const units = ['px', 'rem', 'em', 'vh', 'vw', '%'];
  const numeric = Number(text);
  if (text !== '' && Number.isFinite(numeric) && String(numeric) === text) {
    return text + 'px';
  }

  const unit = units.find((candidate) => text.toLowerCase().endsWith(candidate));
  if (unit) {
    const amount = text.slice(0, -unit.length).trim();
    if (amount !== '' && Number.isFinite(Number(amount))) {
      return text;
    }
  }

  return null;
}

function asOpacityValue(value) {
  if (typeof value === 'number') {
    return value >= 0 && value <= 1 ? String(value) : null;
  }

  const text = String(value).trim();
  if (text.endsWith('%')) {
    const percent = Number(text.slice(0, -1).trim());
    return percent >= 0 && percent <= 100 ? String(percent / 100) : null;
  }

  const numeric = Number(text);
  if (Number.isFinite(numeric)) {
    return numeric >= 0 && numeric <= 1 ? String(numeric) : null;
  }

  return null;
}

function opacityValueFromColor(value) {
  if (value == null) {
    return null;
  }

  const direct = asOpacityValue(value);
  if (direct) {
    return direct;
  }

  const parsed = parseColor(String(value).trim());
  if (!parsed || typeof parsed.alpha !== 'number' || Number.isNaN(parsed.alpha)) {
    return null;
  }

  return String(Math.max(0, Math.min(1, parsed.alpha)));
}

function renderInfoPreview(key, value, title = '', context = '') {
  const tokenKey = String(key).toLowerCase();
  const titleKey = String(title).toLowerCase();
  const contextKey = String(context).toLowerCase();
  const cssLength = asCssLength(value);
  const opacityValue = opacityValueFromColor(value);

  if (titleKey.includes('opacity') || tokenKey.includes('opacity') || contextKey.includes('opacity')) {
    if (!opacityValue) {
      return '';
    }

    const overlayColor = typeof value === 'string' && isColorString(value) && !value.startsWith('linear-gradient(')
      ? value
      : 'var(--preview-text)';

    return '<div class="info-preview info-preview--opacity">'
      + '<div class="info-preview__opacity-base">'
      + '<div class="info-preview__opacity-overlay" style="background:' + escapeHtml(overlayColor) + '; opacity:' + escapeHtml(opacityValue) + '"></div>'
      + '</div>'
      + '</div>';
  }

  if (!cssLength) {
    return '';
  }

  if (
    titleKey.includes('radius')
    || titleKey.includes('radii')
    || tokenKey.includes('radius')
    || tokenKey.includes('radii')
    || contextKey.includes('border.radii')
  ) {
    return '<div class="info-preview info-preview--radius">'
      + '<div class="info-preview__radius" style="border-radius:' + escapeHtml(cssLength) + '"></div>'
      + '</div>';
  }

  if (
    (titleKey.includes('border') && titleKey.includes('width'))
    || tokenKey.includes('width')
    || contextKey.includes('border.width')
  ) {
    return '<div class="info-preview info-preview--border-width">'
      + '<div class="info-preview__border-width" style="border-width:' + escapeHtml(cssLength) + '"></div>'
      + '</div>';
  }

  if (titleKey.includes('sizing') || titleKey.includes('size') || contextKey.includes('sizing')) {
    return '<div class="info-preview info-preview--sizing">'
      + '<div class="info-preview__sizing" style="width:min(' + escapeHtml(cssLength) + ', 180px); height:min(' + escapeHtml(cssLength) + ', 96px)"></div>'
      + '</div>';
  }

  if (titleKey.includes('spacing') || titleKey.includes('space') || contextKey.includes('spacing')) {
    return '<div class="info-preview info-preview--spacing">'
      + '<div class="info-preview__spacing-line" style="width:min(' + escapeHtml(cssLength) + ', 180px)"></div>'
      + '</div>';
  }

  return '';
}

function renderContextualTablePreview(key, value, title, contextKey) {
  const context = String(contextKey).toLowerCase();
  const titleKey = String(title).toLowerCase();
  const tokenKey = String(key).toLowerCase();

  if (
    context.includes('border.radii')
    || titleKey.includes('radii')
    || titleKey.includes('radius')
    || tokenKey.includes('radius')
    || tokenKey.includes('radii')
  ) {
    const cssLength = asCssLength(value);
    if (!cssLength) {
      return '';
    }
    return '<div class="info-preview info-preview--radius">'
      + '<div class="info-preview__radius" style="border-radius:' + escapeHtml(cssLength) + '"></div>'
      + '</div>';
  }

  if (
    context.includes('border.width')
    || titleKey.includes('width')
    || tokenKey.includes('width')
  ) {
    const cssLength = asCssLength(value);
    if (!cssLength) {
      return '';
    }
    return '<div class="info-preview info-preview--border-width">'
      + '<div class="info-preview__border-width" style="border-width:' + escapeHtml(cssLength) + '"></div>'
      + '</div>';
  }

  if (context.includes('opacity.color') || titleKey.includes('opacity')) {
    return renderInfoPreview('', value, 'opacity', contextKey);
  }

  return '';
}

function renderContextualPreviewCell(key, value, title, contextKey) {
  const context = String(contextKey).toLowerCase();
  const titleKey = String(title).toLowerCase();
  const tokenKey = String(key).toLowerCase();

  if (
    context.includes('border.radii')
    || titleKey.includes('radii')
    || titleKey.includes('radius')
    || tokenKey.includes('radius')
    || tokenKey.includes('radii')
  ) {
    const cssLength = asCssLength(value);
    if (!cssLength) {
      return '<td class="support-table__preview"></td>';
    }
    return '<td class="support-table__preview support-table__preview--radius-cell">'
      + '<span class="support-table__radius-swatch" style="border-radius:' + escapeHtml(cssLength) + '"></span>'
      + '</td>';
  }

  if (
    context.includes('border.width')
    || titleKey.includes('width')
    || tokenKey.includes('width')
  ) {
    const cssLength = asCssLength(value);
    if (!cssLength) {
      return '<td class="support-table__preview"></td>';
    }
    return '<td class="support-table__preview support-table__preview--width-cell">'
      + '<span class="support-table__width-swatch" style="border-width:' + escapeHtml(cssLength) + '"></span>'
      + '</td>';
  }

  const previewMarkup = renderContextualTablePreview(key, value, title, contextKey);
  return '<td class="support-table__preview">' + previewMarkup + '</td>';
}

function renderSupportTable(title, rowsMap, options = {}) {
  const rowEntries = Object.entries(rowsMap ?? {});
  if (rowEntries.length === 0) {
    return '';
  }

  const columns = [...new Set(rowEntries.flatMap(([, row]) => Object.keys(row ?? {})))];
  if (columns.length === 0) {
    return '';
  }

  const contextKey = options.contextKey ?? title;
  const forcePreviewSource = (String(contextKey) + ' ' + String(title)).toLowerCase();
  const forcePreview = ['border.width', 'border.radii', 'opacity.color', 'width', 'radii', 'radius']
    .some((fragment) => forcePreviewSource.includes(fragment));
  const includePreview = columns.length === 1
    && columns[0] === 'value'
    && (forcePreview || rowEntries.some(([rowKey, row]) => renderInfoPreview(rowKey, row?.value, title, contextKey)));

  const head = columns
    .map((column) => `<th>${escapeHtml(humanize(column))}</th>`)
    .join('');

  const body = rowEntries
    .map(([rowKey, row]) => {
      const previewCell = includePreview
        ? (forcePreview
          ? renderContextualPreviewCell(rowKey, row?.value, title, contextKey)
          : `<td class="support-table__preview">${renderInfoPreview(rowKey, row?.value, title, contextKey)}</td>`)
        : '';
      const cells = columns
        .map((column) => `<td>${escapeHtml(String(row?.[column] ?? '—'))}</td>`)
        .join('');
      return `
        <tr>
          <th>${escapeHtml(humanize(rowKey))}</th>
          ${previewCell}
          ${cells}
        </tr>
      `;
    })
    .join('');

  const headingTag = options.headingTag ?? 'h3';
  const heading = options.showHeading === false
    ? ''
    : `<${headingTag}>${escapeHtml(title)}</${headingTag}>`;
  const inner = `
    ${heading}
    <div class="support-table-wrap">
      <table class="support-table">
        <thead>
          <tr>
            <th>Token</th>
            ${includePreview ? '<th>Preview</th>' : ''}
            ${head}
          </tr>
        </thead>
        <tbody>
          ${body}
        </tbody>
      </table>
    </div>
  `;

  if (options.embedded) {
    return `<div class="support-table-block">${inner}</div>`;
  }

  return `
    <section class="section-card section-card--compact elevation-level_one">
      ${inner}
    </section>
  `;
}

function renderTabularSupportNode(title, node, tokenPath, depth = 0) {
  const shouldShowHeading = depth === 0 || String(tokenPath).startsWith('typography.');
  if (isObjectOfObjectPrimitiveSupportValues(node)) {
    return renderSupportTable(title, node, {
      embedded: depth > 0,
      headingTag: depth > 0 ? 'h4' : 'h3',
      contextKey: tokenPath,
      showHeading: shouldShowHeading
    });
  }

  const entries = Object.entries(node ?? {}).filter(([, value]) => value != null);
  if (entries.length === 0) {
    return '';
  }

  const groups = entries
    .map(([key, value]) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return '';
      }

      const childPath = tokenPath ? `${tokenPath}.${key}` : key;
      const childContent = renderTabularSupportNode(humanize(key), value, childPath, depth + 1);
      return childContent || '';
    })
    .filter(Boolean)
    .join('');

  if (!groups && isObjectOfPrimitiveSupportValues(node)) {
    const normalized = Object.fromEntries(
      Object.entries(node).map(([key, value]) => [key, { value: String(value) }])
    );
    return renderSupportTable(title, normalized, {
      embedded: depth > 0,
      headingTag: depth > 0 ? 'h4' : 'h3',
      contextKey: tokenPath,
      showHeading: shouldShowHeading
    });
  }

  if (groups) {
    return depth === 0
      ? `<section class="section-card section-card--compact elevation-level_one"><h3>${escapeHtml(title)}</h3><div class="sample-stack">${groups}</div></section>`
      : groups;
  }

  return '';
}

function renderTypographySupportSection(node, tokenPath) {
  const preferredKeys = [
    'fontFamilies',
    'fontSizes',
    'fontWeights',
    'letterSpacings',
    'lineHeights',
    'textCase',
    'textDecoration'
  ];

  const orderedKeys = [
    ...preferredKeys.filter((key) => key in (node ?? {})),
    ...Object.keys(node ?? {}).filter((key) => !preferredKeys.includes(key))
  ];

  const content = orderedKeys
    .map((key) => {
      const value = node?.[key];
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return '';
      }
      const childPath = tokenPath ? tokenPath + '.' + key : key;
      return renderSupportNode(humanize(key), value, childPath, 1);
    })
    .filter(Boolean)
    .join('');

  if (!content) {
    return '';
  }

  return '<section class="section-card section-card--compact elevation-level_one">'
    + '<h3>Typography</h3>'
    + '<div class="sample-stack">' + content + '</div>'
    + '</section>';
}

function renderSupportNode(title, node, tokenPath, depth = 0) {
  if (node == null) {
    return '';
  }

  if (typeof node !== 'object' || Array.isArray(node)) {
    return '';
  }

  if (String(tokenPath) === 'typography') {
    const typographySection = renderTypographySupportSection(node, tokenPath);
    if (typographySection) {
      return typographySection;
    }
  }

  if (isTabularSupportPath(tokenPath)) {
    const tabularContent = renderTabularSupportNode(title, node, tokenPath, depth);
    if (tabularContent) {
      return tabularContent;
    }
  }

  const entries = sortEntriesForPath(tokenPath, Object.entries(node)).filter(([, value]) => value != null);
  if (entries.length === 0) {
    return '';
  }

  if (entries.length === 1) {
    const [onlyKey, onlyValue] = entries[0];
    const onlyTitle = humanize(onlyKey);
    if (
      onlyValue
      && typeof onlyValue === 'object'
      && !Array.isArray(onlyValue)
      && onlyTitle.toLowerCase() === String(title).toLowerCase()
    ) {
      const childPath = tokenPath ? (String(tokenPath) + '.' + onlyKey) : onlyKey;
      return renderSupportNode(onlyTitle, onlyValue, childPath, depth);
    }
  }

  if (entries.every(([, value]) => typeof value !== 'object' || value == null || Array.isArray(value))) {
    const normalized = Object.fromEntries(entries.map(([key, value]) => [key, String(value)]));
    return `
      <section class="section-card section-card--compact elevation-level_one">
        <h3>${escapeHtml(title)}</h3>
        <div class="dimension-grid">${renderInfoCardCollection(normalized, tokenPath)}</div>
      </section>
    `;
  }

  const keys = entries.map(([key]) => key);
  const family = classifyKeyFamily(keys);
  const layoutClass = family === 'polarity'
    ? 'group-grid group-grid--pair'
    : family === 'level' || family === 'state'
      ? 'group-grid'
      : 'group-stack';
  const cardClass = family === 'polarity'
    ? 'group-card--pair'
    : family === 'level' || family === 'state'
      ? 'group-card--compact'
      : 'group-card--line';
  const headingTag = depth === 0 ? 'h4' : 'h5';

  const groups = entries
    .map(([key, value]) => {
      if (value == null || typeof value !== 'object' || Array.isArray(value)) {
        return '';
      }

      const childPath = tokenPath ? `${tokenPath}.${key}` : key;
      const childContent = renderSupportNode(humanize(key), value, childPath, depth + 1);
      if (!childContent) {
        return '';
      }

      return `
        <div class="group-card ${cardClass}">
          <${headingTag}>${escapeHtml(humanize(key))}</${headingTag}>
          ${childContent}
        </div>
      `;
    })
    .filter(Boolean)
    .join('');

  if (!groups) {
    const flattened = flattenLeafValues(node, []);
    if (Object.keys(flattened).length === 0) {
      return '';
    }
    return renderInfoCards(title, flattened);
  }

  return `
    <section class="section-card section-card--compact elevation-level_one">
      <h3>${escapeHtml(title)}</h3>
      <div class="${layoutClass}">${groups}</div>
    </section>
  `;
}

function renderFoundationSections(foundation, tokens, canvasColor) {
  const foundationTokens = foundation?.tokens ?? {};
  if (!foundation || Object.keys(foundationTokens).length === 0) {
    return '';
  }

  const sectionOrder = foundation.sectionOrder?.length
    ? [...foundation.sectionOrder]
    : Object.keys(foundationTokens);

  const cards = sectionOrder
    .map((sectionKey) => {
      if (!(sectionKey in foundationTokens)) {
        return '';
      }

      const rawNode = foundationTokens[sectionKey];
      const resolvedNode = resolveNodeValueReferences(rawNode, tokens);

      if (resolvedNode && typeof resolvedNode === 'object') {
        const content = renderColorNode(sectionKey, resolvedNode, `foundation.${sectionKey}`, canvasColor);
        if (!content) {
          return renderSupportNode(humanize(sectionKey), resolvedNode, `foundation.${sectionKey}`);
        }
        return `
          <section class="section-card section-card--compact elevation-level_one" id="foundation-${escapeHtml(sectionKey)}" data-section-key="foundation">
            <h3>${escapeHtml(humanize(sectionKey))}</h3>
            ${content}
          </section>
        `;
      }

      if (resolvedNode == null) {
        return '';
      }
      return renderInfoCards(humanize(sectionKey), { value: resolvedNode });
    })
    .filter(Boolean)
    .join('');

  return cards ? `<div class="support-sections">${cards}</div>` : '';
}

function describeCompoundSection(type) {
  const title = humanize(type);

  if (type === 'typography') {
    return {
      title,
      copy: '',
      gridClass: 'typography-grid typography-grid--compound'
    };
  }

  if (type === 'boxShadow') {
    return {
      title,
      copy: '',
      gridClass: 'elevation-grid'
    };
  }

  return {
    title,
    copy: '',
    gridClass: 'sample-stack'
  };
}

function renderFoundationCompoundCard(type, entry, tokens) {
  const resolvedValue = resolveNodeValueReferences(entry.value, tokens);

  if (type === 'typography') {
    const inlineStyle = buildTypographyPreviewCss(resolvedValue);
    return `
      <article class="type-card type-card--typography">
        <div class="type-class">${escapeHtml(entry.className ?? entry.path)}</div>
        ${entry.description ? `
          <div class="type-description">
            <div class="type-description__label">Description</div>
            <p class="type-description__copy">${escapeHtml(entry.description)}</p>
          </div>
        ` : ''}
        <div class="type-sample-group">
          <p class="type-sample" style="${escapeHtml(inlineStyle)}">The quick brown fox jumps over the lazy dog.</p>
          <p class="type-sample" style="${escapeHtml(inlineStyle)}">Aa Bb Cc 0123456789</p>
        </div>
        ${renderCompositeMetaRows(entry.value)}
      </article>
    `;
  }

  if (type === 'boxShadow') {
    const shadowCss = buildShadowCss(resolvedValue);
    const className = entry.className ? escapeHtml(entry.className) : '';
    return `
      <article class="elevation-card">
        <div class="elevation-class">${escapeHtml(entry.className ?? entry.path)}</div>
        ${entry.description ? `<p class="section-copy">${escapeHtml(entry.description)}</p>` : ''}
        <div class="elevation-well">
          <div class="elevation-sample">
            <div class="elevation-sample__card ${className}" style="${escapeHtml(shadowCss ? `box-shadow:${shadowCss}` : '')}">
              <div class="elevation-sample__label">Elevation surface</div>
            </div>
          </div>
        </div>
        ${renderCompositeMetaRows(entry.value)}
      </article>
    `;
  }

  const compoundPreview = renderCompoundPreview(type, resolvedValue, entry);
  return `
    <article class="type-card">
      <div class="type-class">${escapeHtml(entry.className ?? entry.path)}</div>
      ${entry.description ? `<p class="section-copy">${escapeHtml(entry.description)}</p>` : ''}
      ${compoundPreview}
      ${renderCompoundMeta(type, entry, resolvedValue, tokens)}
    </article>
  `;
}

function renderFoundationCompoundSection(type, entries, tokens) {
  if (!entries.length) {
    return '';
  }

  const descriptor = describeCompoundSection(type);
  const cards = entries
    .map((entry) => renderFoundationCompoundCard(type, entry, tokens))
    .join('');

  return `
    <section class="section-card section-card--compact elevation-level_one">
      <h3>${escapeHtml(descriptor.title)}</h3>
      ${descriptor.copy ? `<p class="section-copy">${escapeHtml(descriptor.copy)}</p>` : ''}
      <div class="${descriptor.gridClass}">${cards}</div>
    </section>
  `;
}

function renderCompoundPreview(type, resolvedValue, entry) {
  if (type === 'gradient' && typeof resolvedValue === 'string') {
    return `<div class="token-preview is-flat" style="background:${escapeHtml(resolvedValue)}"></div>`;
  }

  if (typeof resolvedValue === 'string' && isColorString(resolvedValue)) {
    return `<div class="token-preview is-flat" style="background:${escapeHtml(resolvedValue)}"></div>`;
  }

  if (resolvedValue && typeof resolvedValue === 'object') {
    const shadowCss = buildShadowCss(resolvedValue);
    if (shadowCss) {
      return `
        <div class="elevation-well">
          <div class="elevation-sample">
            <div class="elevation-sample__card" style="${escapeHtml(`box-shadow:${shadowCss}`)}">
              <div class="elevation-sample__label">Compound surface</div>
            </div>
          </div>
        </div>
      `;
    }

    const typographyCss = buildTypographyCss(resolvedValue);
    if (typographyCss) {
      const className = entry.className ? escapeHtml(entry.className) : '';
      return `
        <div class="type-sample-group">
          <p class="type-sample ${className}" style="${escapeHtml(typographyCss)}">The quick brown fox jumps over the lazy dog.</p>
          <p class="type-sample ${className}" style="${escapeHtml(typographyCss)}">Aa Bb Cc 0123456789</p>
        </div>
      `;
    }
  }

  return '';
}

function renderCompoundMeta(type, entry, resolvedValue, tokens) {
  if (type === 'gradient') {
    return renderCompositeMetaRows(entry.value ?? gradientCompositeMeta(entry.path, resolvedValue, tokens));
  }

  return renderCompositeMetaRows(entry.value);
}

function renderAdditionalCompoundSamples(foundation, tokens) {
  if (!foundation?.compoundCollections) {
    return '';
  }

  const sections = Object.entries(foundation.compoundCollections)
    .map(([type, entries]) => renderFoundationCompoundSection(type, entries, tokens))
    .filter(Boolean)
    .join('');

  return sections;
}

function describeSemanticSection(sectionKey, node, options = {}) {
  const normalizedKey = String(sectionKey);
  const nodeKeys = node && typeof node === 'object' ? Object.keys(node) : [];
  const title = options.title
    ?? humanize(normalizedKey);

  if (options.copy) {
    return { title, copy: options.copy };
  }

  const childLabels = nodeKeys
    .filter(Boolean)
    .map((key) => humanize(key));

  const suffix = childLabels.length > 0
    ? ' Includes '
      + childLabels.slice(0, 3).join(', ')
      + (childLabels.length > 3 ? ', and more.' : '.')
    : '';

  return {
    title,
    copy: title + ' tokens discovered from the current semantic output.' + suffix
  };
}

function buildSemanticSections(tokens) {
  const colorRoot = tokens?.color ?? {};
  const SEMANTIC_COLOR_ORDER = ['brand', 'interface', 'text', 'product'];
  const rawKeys = Object.keys(colorRoot);
  const orderedKeys = [
    ...SEMANTIC_COLOR_ORDER.filter((k) => rawKeys.includes(k)),
    ...rawKeys.filter((k) => !SEMANTIC_COLOR_ORDER.includes(k))
  ];
  const sections = [];
  const consumed = new Set();

  for (const key of orderedKeys) {
    if (consumed.has(key)) continue;
    const sourceNode = colorRoot[key];
    if (sourceNode == null) continue;
    let node = sourceNode;

    if (
      key === 'brand'
      && sourceNode
      && typeof sourceNode === 'object'
      && colorRoot.gradient
      && typeof colorRoot.gradient === 'object'
    ) {
      node = { ...sourceNode, gradient: colorRoot.gradient };
      consumed.add('gradient');
    }

    const presentation = describeSemanticSection(key, node);

    sections.push({
      key,
      title: presentation.title,
      copy: presentation.copy,
      node
    });
  }

  return sections;
}

function buildSupportSections(tokens) {
  const orderedKeys = Object.keys(tokens ?? {}).filter((key) => key !== 'color');

  return orderedKeys
    .map((key) => {
      const node = tokens?.[key];
      if (!node || typeof node !== 'object') {
        return '';
      }
      return renderSupportNode(humanize(key), node, key);
    })
    .filter(Boolean)
    .join('');
}

function renderSections(tokens, foundation) {
  const canvasColor = getPath(tokens, ['color', 'brand', 'ambient', 'contrast', 'base', 'positive', 'background']) ?? '#ffffff';
  const sections = buildSemanticSections(tokens);

  const renderedSections = sections
    .map((section) => {
      if (!section.node) return '';
      const content = renderColorNode(section.title, section.node, section.key, canvasColor);
      if (!content) return '';
      return `
        <section class="section-card elevation-level_one" id="${escapeHtml(section.key)}" data-section-key="${escapeHtml(section.key)}">
          <h3>${escapeHtml(section.title)}</h3>
          <p class="section-copy">${escapeHtml(section.copy)}</p>
          ${content}
        </section>
      `;
    })
    .filter(Boolean)
    .join('');

  const supportSections = [
    buildSupportSections(tokens),
    renderAdditionalCompoundSamples(foundation, tokens),
    renderFoundationSections(foundation, tokens, canvasColor)
  ].filter(Boolean).join('');

  return [
    renderedSections,
    supportSections ? `<div class="support-sections">${supportSections}</div>` : ''
  ].filter(Boolean).join('');
}

function renderSummarySections(tokens) {
  const canvasColor = getPath(tokens, ['color', 'brand', 'ambient', 'contrast', 'base', 'positive', 'background']) ?? '#ffffff';
  const sections = buildSemanticSections(tokens);

  const renderedSections = sections
    .map((section) => renderSummarySection(section, canvasColor))
    .filter(Boolean)
    .join('');

  return renderedSections || '<div class="empty-state">No quartet tokens found for summary view.</div>';
}

function collectTopLevelSectionNodes() {
  return [
    ...sectionsRoot.querySelectorAll(':scope > .section-card, :scope > .support-sections > .section-card')
  ];
}

function setActiveSectionLink(sectionId) {
  for (const link of sectionNav.querySelectorAll('.outline-link.is-active, .outline-sub-link.is-active')) {
    link.classList.remove('is-active');
  }

  const subLink = sectionNav.querySelector('.outline-sub-link[href="#' + sectionId + '"]');
  if (subLink) {
    subLink.classList.add('is-active');
    const parentLink = subLink.closest('.outline-group')?.querySelector(':scope > .outline-link');
    if (parentLink) parentLink.classList.add('is-active');
    return;
  }

  const topLink = sectionNav.querySelector('.outline-link[href="#' + sectionId + '"]');
  if (topLink) topLink.classList.add('is-active');
}

function buildSectionNavigator() {
  if (!sectionNav) {
    return;
  }

  if (activeSectionObserver) {
    activeSectionObserver.disconnect();
    activeSectionObserver = null;
  }

  const sections = collectTopLevelSectionNodes();
  const counters = new Map();
  const items = sections
    .map((section) => {
      const heading = section.querySelector(':scope > h3');
      const title = heading?.textContent?.trim();
      if (!title) {
        return null;
      }
      const base = slugify(title);
      const count = (counters.get(base) ?? 0) + 1;
      counters.set(base, count);
      const id = count === 1 ? base : base + '-' + count;
      section.id = id;

      const subCardSelector = ':scope > .group-stack > .group-card, :scope > .group-grid > .group-card, :scope > .group-grid--pair > .group-card';
      const subs = [...section.querySelectorAll(subCardSelector)]
        .map((card) => {
          const h4 = card.querySelector(':scope > h4');
          const subTitle = h4?.textContent?.trim();
          if (!subTitle) return null;
          const subId = id + '-' + slugify(subTitle);
          card.id = subId;
          return { id: subId, title: subTitle, node: card };
        })
        .filter(Boolean);

      return { id, title, node: section, subs };
    })
    .filter(Boolean);

  if (items.length === 0) {
    sectionNav.innerHTML = '';
    return;
  }

  const semanticHtml = items
    .map((item) => {
      const subHtml = item.subs.length > 0
        ? '<div class="outline-sub">' +
          item.subs.map((sub) => '<a class="outline-sub-link" href="#' + escapeHtml(sub.id) + '">' + escapeHtml(sub.title) + '</a>').join('') +
          '</div>'
        : '';
      return '<div class="outline-group">' +
        '<a class="outline-link" href="#' + escapeHtml(item.id) + '">' + escapeHtml(item.title) + '</a>' +
        subHtml +
        '</div>';
    })
    .join('');

  const foundations = preview?.foundations ?? [];
  const foundationSubLinks = foundations
    .map((f) => '<a class="outline-sub-link" href="#foundation-section-' + escapeHtml(f.id) + '">' + escapeHtml(humanize(f.id)) + '</a>')
    .join('');
  const foundationClass = foundations.length > 0 ? 'outline-group outline-group--foundation has-foundation' : 'outline-group outline-group--foundation';
  const foundationHtml = '<div class="' + foundationClass + '">' +
    '<span class="outline-label">Foundation</span>' +
    (foundationSubLinks ? '<div class="outline-sub">' + foundationSubLinks + '</div>' : '') +
    '</div>';

  sectionNav.innerHTML = semanticHtml + foundationHtml;

  setActiveSectionLink(items[0].id);

  const allNodes = items.flatMap((item) => [item, ...item.subs]);

  activeSectionObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

    const target = visible[0]?.target ?? allNodes
      .map((item) => item.node)
      .find((node) => node.getBoundingClientRect().top >= 0) ?? allNodes[allNodes.length - 1].node;

    if (target?.id) {
      setActiveSectionLink(target.id);
    }
  }, {
    rootMargin: '-16% 0px -72% 0px',
    threshold: [0, 0.2, 0.4, 0.6]
  });

  for (const item of allNodes) {
    activeSectionObserver.observe(item.node);
  }
}

function applyStyles(combination, foundation) {
  semanticStylesheet.href = combination.semanticCssHref;
  foundationStylesheet.href = foundation?.css?.foundation ?? '';
  typographyStylesheet.href = foundation?.css?.typography ?? '';
  elevationStylesheet.href = foundation?.css?.elevation ?? '';

  const semanticClass = combination.jsonFile.replace(/\.json$/, '').replaceAll('_', '-');
  if (activeSemanticClass) {
    document.documentElement.classList.remove(activeSemanticClass);
    document.body.classList.remove(activeSemanticClass);
  }
  document.documentElement.classList.add(semanticClass);
  document.body.classList.add(semanticClass);
  activeSemanticClass = semanticClass;
}

function render() {
  const theme = getCurrentTheme();
  const combinations = theme?.combinations ?? {};
  const availableModes = [...new Set(Object.values(combinations).map((item) => item.mode))];
  const availableSurfaces = [...new Set(Object.values(combinations).map((item) => item.surface))];

  if (!availableModes.includes(state.mode)) {
    state.mode = availableModes[0] ?? 'light';
  }
  if (!availableSurfaces.includes(state.surface)) {
    state.surface = availableSurfaces[0] ?? 'positive';
  }

  setOptions(
    modeSelect,
    availableModes.map((mode) => ({ value: mode, label: humanize(mode) })),
    state.mode
  );
  setOptions(
    surfaceSelect,
    availableSurfaces.map((surface) => ({ value: surface, label: humanize(surface) })),
    state.surface
  );

  const combination = getCurrentCombination();
  const foundation = getCurrentFoundation();
  if (!combination) {
    sectionsRoot.innerHTML = '<div class="empty-state">No preview data found for the selected combination.</div>';
    return;
  }

  applyStyles(combination, foundation);

  const tokens = combination.tokens;
  const resolvedFoundationTokens = resolveNodeValueReferences(foundation?.tokens ?? {}, tokens);
  const {
    canvasColor,
    deepCanvasColor,
    panelColor,
    panelAltColor,
    titleColor,
    subtitleColor,
    mutedColor,
    borderColor
  } = discoverPreviewRoles(resolvedFoundationTokens, tokens);

  stage.style.setProperty('--preview-canvas', canvasColor);
  document.documentElement.style.setProperty('--preview-bg', canvasColor);
  document.documentElement.style.setProperty('--preview-panel', panelColor);
  document.documentElement.style.setProperty('--preview-panel-2', panelAltColor);
  document.documentElement.style.setProperty('--preview-text', titleColor);
  document.documentElement.style.setProperty('--preview-text-body', subtitleColor);
  document.documentElement.style.setProperty('--preview-text-muted', mutedColor);
  document.documentElement.style.setProperty('--preview-border', borderColor);
  stage.style.color = titleColor;
  stageTitle.style.color = titleColor;
  stageCopy.style.color = subtitleColor;
  stageKicker.style.color = mutedColor;
  stageKicker.textContent = theme.label.toUpperCase();
  stageTitle.textContent = state.view === 'summary'
    ? 'Summary preview'
    : 'Theme preview';
  stageCopy.textContent = state.view === 'summary'
    ? 'Condensed semantic color view focused on background, txtOn, border, and contrast ratios.'
    : 'This preview showcases all semantic design tokens from the selected theme configuration. Navigate through sections to explore brand colors, interface elements, text styles, and product-specific tokens. Each token card displays the color value, contrast ratio, and WCAG compliance level.';

  selectionSummary.innerHTML = `
    <div>
      <div><strong>Theme:</strong> <span>${escapeHtml(theme.label)}</span></div>
      <div><strong>Mode:</strong> <span>${escapeHtml(state.mode)}</span></div>
      <div><strong>Surface:</strong> <span>${escapeHtml(state.surface)}</span></div>
      <div><strong>Foundation:</strong> <span>${escapeHtml(foundation?.label ?? 'None')}</span></div>
    </div>
  `;

  sectionsRoot.innerHTML = state.view === 'summary'
    ? renderSummarySections(tokens)
    : renderSections(tokens, foundation);
  buildSectionNavigator();
  initCategoryFilter();
  applyFilters();
}

// ── Compact toggle ──────────────────────────────────────────────────────────

const compactToggle = document.getElementById('compact-toggle');
let isCompact = localStorage.getItem('preview-compact') === 'true';

function syncCompactToggle() {
  document.body.classList.toggle('is-compact', isCompact);
  if (compactToggle) {
    compactToggle.classList.toggle('is-on', isCompact);
    compactToggle.setAttribute('aria-pressed', String(isCompact));
  }
}

if (compactToggle) {
  syncCompactToggle();
  compactToggle.addEventListener('click', () => {
    isCompact = !isCompact;
    localStorage.setItem('preview-compact', String(isCompact));
    syncCompactToggle();
  });
} else {
  syncCompactToggle();
}

// ── Search & Filters accordion ──────────────────────────────────────────────

const filterToggleBtn = document.getElementById('filters-toggle-btn');
const filtersPanel = document.getElementById('filters-panel');
const searchInput = document.getElementById('search-input');
const categoryListEl = document.getElementById('category-list');
const filtersClearBtn = document.getElementById('filters-clear-btn');

const filterState = { search: '', categories: new Set() };

const sectionLabels = { brand: 'Brand', interface: 'Interface', text: 'Text', product: 'Product', foundation: 'Foundation' };

function initCategoryFilter() {
  if (!categoryListEl) return;
  const sections = Array.from(sectionsRoot.querySelectorAll(
    ':scope > .section-card, :scope > .support-sections > .section-card'
  ));
  const keys = [...new Set(sections.map(s => s.dataset.sectionKey).filter(Boolean))];

  categoryListEl.innerHTML = keys.map(key => `
    <label>
      <input type="checkbox" data-cat="${key}" checked />
      <span>${sectionLabels[key] || (key.charAt(0).toUpperCase() + key.slice(1))}</span>
    </label>
  `).join('');

  categoryListEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const activeCats = [...categoryListEl.querySelectorAll('input:checked')].map(c => c.dataset.cat);
      const allKeys = [...categoryListEl.querySelectorAll('input')].map(c => c.dataset.cat);
      filterState.categories = activeCats.length < allKeys.length ? new Set(activeCats) : new Set();
      syncFilterUI();
      applyFilters();
    });
  });
}

function syncFilterUI() {
  if (!filtersClearBtn) return;
  const hasActive = filterState.search || filterState.categories.size > 0;
  filtersClearBtn.style.display = hasActive ? '' : 'none';
}

function applyFilters() {
  const sections = Array.from(sectionsRoot.querySelectorAll(
    ':scope > .section-card, :scope > .support-sections > .section-card'
  ));
  const search = filterState.search.trim().toLowerCase();

  sections.forEach(section => {
    const key = section.dataset.sectionKey ?? '';
    const categoryMatch = filterState.categories.size === 0 || filterState.categories.has(key);

    if (!categoryMatch) { section.hidden = true; return; }

    if (!search) {
      section.hidden = false;
      section.querySelectorAll('.group-card').forEach(g => { g.hidden = false; });
      return;
    }

    let sectionHasMatch = false;
    section.querySelectorAll('.group-card').forEach(group => {
      const heading = group.querySelector('h4, h5');
      const titleText = (heading?.textContent ?? '').toLowerCase();
      const idText = (heading?.id ?? '').toLowerCase();
      const matches = titleText.includes(search) || idText.includes(search);
      group.hidden = !matches;
      if (matches) sectionHasMatch = true;
    });
    section.hidden = !sectionHasMatch;
  });
}

if (filterToggleBtn && filtersPanel) {
  filterToggleBtn.addEventListener('click', () => {
    const isOpen = filtersPanel.classList.toggle('is-open');
    filterToggleBtn.classList.toggle('is-open', isOpen);
    filterToggleBtn.setAttribute('aria-expanded', String(isOpen));
  });
}

if (searchInput) {
  searchInput.addEventListener('input', () => {
    filterState.search = searchInput.value;
    syncFilterUI();
    applyFilters();
  });
}

if (filtersClearBtn) {
  filtersClearBtn.addEventListener('click', () => {
    filterState.search = '';
    filterState.categories.clear();
    if (searchInput) searchInput.value = '';
    if (categoryListEl) categoryListEl.querySelectorAll('input[type="checkbox"]').forEach(c => { c.checked = true; });
    syncFilterUI();
    applyFilters();
  });
}

initControls();
render();
