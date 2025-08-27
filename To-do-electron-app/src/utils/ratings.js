// Rating system utilities - standardize 0-5 UI with 0-10 storage

/**
 * Convert UI rating (0-5) to database rating (0-10)
 * @param {number} uiRating - Rating from 0-5
 * @returns {number} Database rating from 0-10
 */
export const uiToDbRating = (uiRating) => {
  const v = Number(uiRating) || 0;
  // Clamp 0-5, quantize to nearest 0.25, then convert to 0-10 (0.5 steps)
  const clamped = Math.min(5, Math.max(0, v));
  const q = Math.round(clamped / 0.25) * 0.25;
  return Math.min(10, Math.max(0, q * 2));
};

/**
 * Convert database rating (0-10) to UI rating (0-5)
 * @param {number} dbRating - Rating from 0-10
 * @returns {number} UI rating from 0-5
 */
export const dbToUiRating = (dbRating) => {
  const v = Number(dbRating) || 0;
  if (v <= 0) return 0;
  const ui = v / 2;
  // Quantize to nearest 0.25 for consistent display
  return Math.round(ui / 0.25) * 0.25;
};

/**
 * Format rating for display
 * @param {number} dbRating - Database rating (0-10)
 * @param {object} options
 * @param {boolean} [options.outOfFive=true] - Whether to format as /5 (UI scale). If false, format as /10.
 * @param {number} [options.decimals=2] - Max decimals to show (trim trailing zeros)
 * @returns {string} Formatted rating string
 */
export const formatRating = (dbRating, options = {}) => {
  const { outOfFive = true, decimals = 2 } = options;
  const v = Number(dbRating) || 0;
  if (outOfFive) {
    const ui = dbToUiRating(v);
    const str = ui.toFixed(decimals).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
    return `${str}/5`;
  }
  const str10 = v.toFixed(decimals).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
  return `${str10}/10`;
};
