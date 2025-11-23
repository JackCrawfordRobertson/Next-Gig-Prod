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
 * @param {Object} options.jobData - Job data to track for "did you apply?" prompt
 */
export const openJobLink = (url, options = {}) => {
  if (!url) {
    console.warn('openJobLink: No URL provided');
    return;
  }

  const { onBeforeOpen, jobData } = options;

  // Call the before-open callback if provided
  if (onBeforeOpen) {
    onBeforeOpen();
  }

  const isMobile = isMobileDevice();
  const isLinkedIn = isLinkedInUrl(url);

  // For LinkedIn URLs on mobile: use location.href to prevent app hijacking
  if (isMobile && isLinkedIn) {
    // Store tracking data in localStorage before navigating away
    // This allows us to track when user returns and prompt them
    if (jobData) {
      const trackingData = {
        job: jobData,
        clickTime: Date.now(),
        returnUrl: window.location.pathname
      };
      localStorage.setItem('job_tracking', JSON.stringify(trackingData));
    }

    // Open in same tab on mobile to prevent LinkedIn app interception
    // The user can use their browser's back button to return
    window.location.href = url;
  } else {
    // For desktop or non-LinkedIn URLs: open in new tab normally
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

/**
 * Check if user returned from a job link and should be prompted
 * Call this on page load
 *
 * @param {Function} onShouldPrompt - Callback with job data if user should be prompted
 */
export const checkForJobReturn = (onShouldPrompt) => {
  if (typeof window === 'undefined') return;

  const trackingDataStr = localStorage.getItem('job_tracking');
  if (!trackingDataStr) return;

  try {
    const trackingData = JSON.parse(trackingDataStr);
    const { job, clickTime, returnUrl } = trackingData;

    // Check if we're on the same page they left from
    if (window.location.pathname !== returnUrl) {
      // They navigated to a different page, clear tracking
      localStorage.removeItem('job_tracking');
      return;
    }

    // Calculate time away
    const timeAway = Date.now() - clickTime;

    // If they were away for 5+ seconds, prompt them
    if (timeAway > 5000 && job) {
      console.log('User returned after', timeAway, 'ms - showing apply prompt');
      onShouldPrompt(job);
    }

    // Clear the tracking data
    localStorage.removeItem('job_tracking');
  } catch (error) {
    console.error('Error checking job return:', error);
    localStorage.removeItem('job_tracking');
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
