// Production-safe logging utility
const isDevelopment = import.meta.env.MODE === 'development';

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  error: (...args) => {
    // Always log errors, even in production
    console.error(...args);
  },
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  }
};

// For debugging specific features
export const debugLogger = {
  music: (...args) => {
    if (isDevelopment && localStorage.getItem('debug_music') === 'true') {
      console.log('[MUSIC]', ...args);
    }
  },
  auth: (...args) => {
    if (isDevelopment && localStorage.getItem('debug_auth') === 'true') {
      console.log('[AUTH]', ...args);
    }
  },
  api: (...args) => {
    if (isDevelopment && localStorage.getItem('debug_api') === 'true') {
      console.log('[API]', ...args);
    }
  }
};
