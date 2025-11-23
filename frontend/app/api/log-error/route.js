import { NextResponse } from 'next/server';

/**
 * API Route for logging client-side errors
 * POST /api/log-error
 *
 * This allows the frontend to send error logs to the backend
 * You can then store these in a database or forward to a monitoring service
 */
export async function POST(request) {
  try {
    const errorData = await request.json();

    // Log to console (in production, you'd send to a logging service)
    console.error('Client-side error received:', {
      timestamp: errorData.timestamp,
      message: errorData.message,
      url: errorData.url,
      userAgent: errorData.userAgent,
    });

    // Optional: Store in database
    // await db.collection('errors').add(errorData);

    // Optional: Send to monitoring service (Sentry, LogRocket, etc.)
    // await sendToMonitoringService(errorData);

    // Optional: Send critical errors to Slack/Discord/Email
    if (isCriticalError(errorData)) {
      // await notifyTeam(errorData);
      console.error('🚨 CRITICAL ERROR:', errorData.message);
    }

    return NextResponse.json(
      { success: true, message: 'Error logged successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to log client error:', error);

    // Don't fail the request even if logging fails
    return NextResponse.json(
      { success: false, message: 'Failed to log error' },
      { status: 500 }
    );
  }
}

/**
 * Determine if an error is critical and requires immediate attention
 */
function isCriticalError(errorData) {
  const criticalKeywords = [
    'authentication',
    'payment',
    'database',
    'data loss',
    'security',
  ];

  const message = (errorData.message || '').toLowerCase();
  return criticalKeywords.some(keyword => message.includes(keyword));
}

/**
 * Rate limiting helper to prevent log spam
 * In production, implement proper rate limiting
 */
const errorCache = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_ERRORS_PER_WINDOW = 10;

function isRateLimited(errorKey) {
  const now = Date.now();
  const cached = errorCache.get(errorKey);

  if (!cached) {
    errorCache.set(errorKey, { count: 1, timestamp: now });
    return false;
  }

  // Reset if outside window
  if (now - cached.timestamp > RATE_LIMIT_WINDOW) {
    errorCache.set(errorKey, { count: 1, timestamp: now });
    return false;
  }

  // Increment and check limit
  cached.count++;
  if (cached.count > MAX_ERRORS_PER_WINDOW) {
    return true;
  }

  return false;
}
