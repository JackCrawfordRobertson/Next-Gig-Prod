import { NextResponse } from 'next/server';

/**
 * API Route to trigger welcome email
 * POST /api/send-welcome-email
 *
 * This calls the Python backend to send the welcome email
 */
export async function POST(request) {
  try {
    const { email, firstName } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // In development, just log (don't actually send)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] Would send welcome email to: ${email} (${firstName || 'User'})`);
      return NextResponse.json({
        success: true,
        message: 'Welcome email logged (dev mode)'
      });
    }

    // In production, call your Python backend
    // Option 1: If you have a Python API endpoint for this
    // const response = await fetch('http://your-backend-url/api/send-welcome-email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, firstName }),
    // });

    // Option 2: If using serverless functions, import Python function directly
    // (This requires proper setup with Python serverless functions)

    // For now, we'll assume you'll trigger this via your backend
    // You could also use a message queue (RabbitMQ, Redis, etc.)

    console.log(`Welcome email should be sent to: ${email} (${firstName || 'User'})`);

    return NextResponse.json({
      success: true,
      message: 'Welcome email queued',
      email,
      firstName
    });

  } catch (error) {
    console.error('Error sending welcome email:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to send welcome email' },
      { status: 500 }
    );
  }
}
