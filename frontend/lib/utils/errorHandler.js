/**
 * Global Error Handler Utility
 * Centralized error handling and logging for the application
 */

/**
 * Log an error to the console and optionally to a monitoring service
 */
export const logError = (error, context = {}) => {
  const errorData = {
    message: error.message || String(error),
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    url: typeof window !== 'undefined' ? window.location.href : 'N/A',
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorData);
  }

  // TODO: Send to error monitoring service (Sentry, etc.)
  // if (window.Sentry) {
  //   window.Sentry.captureException(error, { extra: context });
  // }

  // Optional: Send to your own backend logging endpoint
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData),
    }).catch(err => {
      // Silently fail if logging endpoint is down
      console.error('Failed to log error to backend:', err);
    });
  }

  return errorData;
};

/**
 * Handle async errors from promises
 */
export const handleAsyncError = (error, context = {}) => {
  console.error('Async error occurred:', error);
  logError(error, { ...context, type: 'async' });
};

/**
 * Wrap async functions with error handling
 */
export const withErrorHandler = (fn, context = {}) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleAsyncError(error, { ...context, function: fn.name });
      throw error; // Re-throw so calling code can handle if needed
    }
  };
};

/**
 * Safe JSON parse with error handling
 */
export const safeJSONParse = (jsonString, fallback = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    logError(error, { context: 'JSON Parse Error', jsonString });
    return fallback;
  }
};

/**
 * Safe localStorage operations with error handling
 */
export const safeLocalStorage = {
  getItem: (key, fallback = null) => {
    try {
      if (typeof window === 'undefined') return fallback;
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (error) {
      logError(error, { context: 'localStorage.getItem', key });
      return fallback;
    }
  },

  setItem: (key, value) => {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logError(error, { context: 'localStorage.setItem', key });
      return false;
    }
  },

  removeItem: (key) => {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      logError(error, { context: 'localStorage.removeItem', key });
      return false;
    }
  },
};

/**
 * Initialize global error handlers
 * Call this once in your app's entry point
 */
export const initGlobalErrorHandlers = () => {
  if (typeof window === 'undefined') return;

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    logError(event.error || new Error(event.message), {
      type: 'uncaught',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      {
        type: 'unhandledPromiseRejection',
      }
    );
  });

  console.log('✅ Global error handlers initialized');
};

/**
 * User-friendly error messages for common errors
 */
export const getUserFriendlyErrorMessage = (error) => {
  // Network errors
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return 'Unable to connect. Please check your internet connection and try again.';
  }

  // Authentication errors
  if (error.message?.includes('auth') || error.message?.includes('unauthorized')) {
    return 'Your session has expired. Please log in again.';
  }

  // Validation errors
  if (error.message?.includes('validation') || error.message?.includes('invalid')) {
    return 'Please check your input and try again.';
  }

  // Firestore errors
  if (error.message?.includes('firestore') || error.message?.includes('firebase')) {
    return 'Unable to save your data. Please try again in a moment.';
  }

  // Generic fallback
  return 'Something went wrong. Please try again or contact support if the problem persists.';
};

/**
 * Display error to user with toast
 * Requires showToast utility to be available
 */
export const displayError = (error, showToast) => {
  const message = getUserFriendlyErrorMessage(error);

  if (showToast) {
    showToast({
      title: 'Error',
      description: message,
      variant: 'destructive',
    });
  }

  logError(error, { displayedToUser: true });
};
