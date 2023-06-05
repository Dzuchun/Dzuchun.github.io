export const FUNCTION_LIST = [Math.sin, Math.cos, Math.tan, (x) => 1.0 / Math.tan(x)];
export const FUNCTION_NAMES = ["sin", "cos", "tan", "cot"];
export const FUNCTION_INDEXES = { sin: 0, cos: 1, tan: 2, cot: 3 };
export const ZONE_TYPE_NAMES = ["Positive", "Negative", "Equals", "More", "Less"];
export const ZONE_TYPE_INDEXES = { Positive: 0, Negative: 1, Equals: 2, More: 3, Less: 4 };

// Can't imagine my life without those
/** Pi (3.141592) mathmatical constant alias */
export const PI = Math.PI;
/** 2Pi = Tau = 6.28.... mathmatical constant alias */
export const PIx2 = PI * 2;

/** Defines strings I consider safe to pass in eval function */
export const EVAL_ALLOWED = /^[0-9ї()\+\-\*\/\.]+$/;

export const THEME_NAMES = ["light", "dark"];
export const COLORS_NAMES = ["default", "fiery"];
export const LANGUAGES = [
  { name: "🇺🇸 English", sp: "en-US" },
  { name: "🇺🇦 Українська", sp: "uk-UA" },
  { name: "🇿🇼 🇭🇳 Російська", sp: "ru-RU" },
];
