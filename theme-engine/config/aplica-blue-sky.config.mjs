export default {
  name: 'aplica_blue_sky',
  colors: {
  "brand_first": "#265ED9",
  "brand_second": "#FECB01",
  "brand_third": "#8952E0",
  "action_primary": "#013FC4",
  "action_secondary": "#A68A18",
  "action_link": "#5000D1",
  "feedback_info_default": "#02D9FF",
  "feedback_info_secondary": "#46B9CE",
  "feedback_success_default": "#00AD26",
  "feedback_success_secondary": "#228137",
  "feedback_warning_default": "#FF9A00",
  "feedback_warning_secondary": "#C18933",
  "feedback_danger_default": "#F53232",
  "feedback_danger_secondary": "#C43B3B",
  "product_promo_default": "#6BC200",
  "product_promo_secondary": "#D2FD9D",
  "product_cashback_default": "#FFBB00",
  "product_cashback_secondary": "#FFF94F",
  "product_premium_default": "#B200AF",
  "product_premium_secondary": "#EBC2DD"
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
    txtOnStrategy: 'high-contrast',
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
