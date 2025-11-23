/**
 * Opens a job link in a way that prevents mobile app hijacking
 * Particularly important for LinkedIn URLs which try to open in the LinkedIn app
 */

/**
 * Detect if user is on a mobile device
 */
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Check if URL is a LinkedIn link
 */
const isLinkedInUrl = (url) => {
  if (!url) return false;
  return url.includes('linkedin.com');
};

/**
 * Opens a job URL with proper handling for mobile devices
 * Prevents app hijacking by using location.href on mobile for LinkedIn URLs
 *
 * @param {string} url - The job URL to open
 * @param {Object} options - Additional options
 * @param {Function} options.onBeforeOpen - Callback before opening (for tracking)
 */
export const openJobLink = (url, options = {}) => {
  if (!url) {
    console.warn('openJobLink: No URL provided');
    return;
  }

  const { onBeforeOpen } = options;

  // Call the before-open callback if provided
  if (onBeforeOpen) {
    onBeforeOpen();
  }

  const isMobile = isMobileDevice();
  const isLinkedIn = isLinkedInUrl(url);

  // For LinkedIn URLs on mobile: use location.href to prevent app hijacking
  if (isMobile && isLinkedIn) {
    // Open in same tab on mobile to prevent LinkedIn app interception
    // The user can use their browser's back button to return
    window.location.href = url;
  } else {
    // For desktop or non-LinkedIn URLs: open in new tab normally
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

/**
 * Alternative approach: Force LinkedIn to open in mobile browser
 * Modifies LinkedIn URLs to explicitly request mobile web version
 *
 * @param {string} url - The original LinkedIn URL
 * @returns {string} - Modified URL that should open in mobile browser
 */
export const forceLinkedInWebView = (url) => {
  if (!isLinkedInUrl(url)) return url;

  // LinkedIn's mobile web interface can be forced by ensuring we're not triggering deep links
  // Adding intent parameter can help prevent app opening on Android
  const urlObj = new URL(url);

  // For Android devices, add parameters that hint to open in browser
  if (navigator.userAgent.includes('Android')) {
    urlObj.searchParams.set('openExternalBrowser', '1');
  }

  return urlObj.toString();
};
