export default {
  name: 'monteiro_ocean',
  colors: {
    "brand_first": "#006699",
    "brand_second": "#008080",
    "brand_third": "#001f3f",
    "action_primary": "#0099cc",
    "action_secondary": "#004d4d",
    "action_link": "#00cccc",
    "feedback_info_default": "#00d4ff",
    "feedback_info_secondary": "#00a3cc",
    "feedback_success_default": "#00b386",
    "feedback_success_secondary": "#008060",
    "feedback_warning_default": "#e67e22",
    "feedback_warning_secondary": "#b36119",
    "feedback_danger_default": "#c0392b",
    "feedback_danger_secondary": "#96281b",
    "product_promo_default": "#2ecc71",
    "product_promo_secondary": "#27ae60",
    "product_cashback_default": "#f1c40f",
    "product_cashback_secondary": "#d4ac0d",
    "product_premium_default": "#6c5ce7",
    "product_premium_secondary": "#5b4cdb"
  },
  mapping: {
    brand: {
      "first": "brand_first",
      "second": "brand_second",
      "third": "brand_third"
    },
    interface: {
      function: {
        "primary": "action_primary",
        "secondary": "action_secondary",
        "link": "action_link"
      },
      feedback: {
        "info_default": "feedback_info_default",
        "info_secondary": "feedback_info_secondary",
        "success_default": "feedback_success_default",
        "success_secondary": "feedback_success_secondary",
        "warning_default": "feedback_warning_default",
        "warning_secondary": "feedback_warning_secondary",
        "danger_default": "feedback_danger_default",
        "danger_secondary": "feedback_danger_secondary"
      }
    },
    product: {
      "promo_default": "product_promo_default",
      "promo_secondary": "product_promo_secondary",
      "cashback_default": "product_cashback_default",
      "cashback_secondary": "product_cashback_secondary",
      "premium_default": "product_premium_default",
      "premium_secondary": "product_premium_secondary"
    }
  },
  options: {
    txtOnStrategy: 'brand-tint',
    darkModeChroma: 0.85,
    uiTokens: false,
    includePrimitives: false,
    accessibilityLevel: 'AA'
  },
  typography: {
    fontFamilies: {
      main: 'Roboto',
      content: 'Roboto',
      display: 'Sansita',
      code: 'IBM Plex Mono'
    },
    weights: {
      main: {
        light: { normal: 'Light', italic: 'Light Italic', numeric: 300 },
        regular: { normal: 'Regular', italic: 'Regular Italic', numeric: 400 },
        semibold: { normal: 'SemiBold', italic: 'SemiBold Italic', numeric: 600 },
        bold: { normal: 'Bold', italic: 'Bold Italic', numeric: 700 },
        black: { normal: 'Black', italic: 'Black Italic', numeric: 900 }
      },
      content: {
        light: { normal: 'Light', italic: 'Light Italic', numeric: 300 },
        regular: { normal: 'Regular', italic: 'Regular Italic', numeric: 400 },
        semibold: { normal: 'SemiBold', italic: 'SemiBold Italic', numeric: 600 },
        bold: { normal: 'Bold', italic: 'Bold Italic', numeric: 700 },
        black: { normal: 'Black', italic: 'Black Italic', numeric: 900 }
      },
      display: {
        light: { normal: 'Regular', italic: 'Regular Italic', numeric: 400 },
        regular: { normal: 'Regular', italic: 'Regular Italic', numeric: 400 },
        semibold: { normal: 'Bold', italic: 'Bold Italic', numeric: 700 },
        bold: { normal: 'ExtraBold', italic: 'ExtraBold Italic', numeric: 800 },
        black: { normal: 'Black', italic: 'Black Italic', numeric: 900 }
      },
      code: {
        light: { normal: 'Light', italic: 'Light Italic', numeric: 300 },
        regular: { normal: 'Regular', italic: 'Regular Italic', numeric: 400 },
        semibold: { normal: 'SemiBold', italic: 'SemiBold Italic', numeric: 600 },
        bold: { normal: 'Bold', italic: 'Bold Italic', numeric: 700 },
        black: { normal: 'Black', italic: 'Black Italic', numeric: 700 }
      }
    }
  }
};
