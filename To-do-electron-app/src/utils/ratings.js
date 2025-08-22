// Rating system utilities - standardize 0-5 UI with 0-10 storage

/**
 * Convert UI rating (0-5) to database rating (0-10)
 * @param {number} uiRating - Rating from 0-5
 * @returns {number} Database rating from 0-10
 */
export const uiToDbRating = (uiRating) => {
  if (!uiRating || uiRating <= 0) return 0;
  return Math.min(10, uiRating * 2);
};

/**
 * Convert database rating (0-10) to UI rating (0-5)
 * @param {number} dbRating - Rating from 0-10
 * @returns {number} UI rating from 0-5
 */
export const dbToUiRating = (dbRating) => {
  if (!dbRating || dbRating <= 0) return 0;
  return Math.round(dbRating / 2);
};

/**
 * Format rating for display
 * @param {number} dbRating - Database rating (0-10)
 * @param {boolean} showOutOf - Whether to show "/10" suffix
 * @returns {string} Formatted rating
 */
export const formatRating = (dbRating, showOutOf = true) => {
  const rating = dbRating || 0;
  return showOutOf ? `${rating}/10` : rating.toString();
};
