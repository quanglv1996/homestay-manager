/**
 * Format number with thousand separators (spaces)
 * Example: 1500000 => "1 500 000"
 */
export const formatNumberDisplay = (num) => {
  if (num === null || num === undefined || num === '') return '';
  const numStr = num.toString().replace(/\D/g, '');
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

/**
 * Remove formatting and return raw number string
 * Example: "1 500 000" => "1500000"
 */
export const removeNumberFormatting = (formatted) => {
  if (!formatted) return '';
  return formatted.toString().replace(/\s/g, '');
};

/**
 * Handle number input change with formatting
 * Used as onChange handler for text inputs
 */
export const handleNumberInput = (e, setterFn) => {
  const value = e.target.value;
  const unformatted = removeNumberFormatting(value);
  
  // Only allow numbers
  if (unformatted === '' || /^\d+$/.test(unformatted)) {
    const formatted = formatNumberDisplay(unformatted);
    e.target.value = formatted;
    setterFn(unformatted); // Store raw number for submission
  }
};
