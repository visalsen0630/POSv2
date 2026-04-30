// Timezone utility for consistent date/time formatting across the POS application
// Using Asia/Phnom_Penh (Cambodia) timezone

export const TIMEZONE = 'Asia/Phnom_Penh';
export const TIMEZONE_DISPLAY = 'GMT+7 (Asia/Phnom Penh)';

/**
 * Format date to Cambodia timezone
 * @param {Date|string} date - Date object or ISO string
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDateKH = (date, options = {}) => {
  if (!date) return '-';

  const defaultOptions = {
    timeZone: TIMEZONE,
    hour12: false,
  };

  return new Date(date).toLocaleString('en-GB', { ...defaultOptions, ...options });
};

/**
 * Format date and time for Cambodia
 * @param {Date|string} date
 * @returns {string} Formatted as "DD/MM/YYYY, HH:MM"
 */
export const formatDateTime = (date) => {
  return formatDateKH(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format date only for Cambodia
 * @param {Date|string} date
 * @returns {string} Formatted as "DD/MM/YYYY"
 */
export const formatDate = (date) => {
  return formatDateKH(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Format time only for Cambodia
 * @param {Date|string} date
 * @returns {string} Formatted as "HH:MM"
 */
export const formatTime = (date) => {
  return formatDateKH(date, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get current date/time in Cambodia timezone
 * @returns {Date} Current date in Cambodia timezone
 */
export const getCurrentDateKH = () => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TIMEZONE }));
};
