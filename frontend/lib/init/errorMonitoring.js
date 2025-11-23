"use client";

import { useEffect } from 'react';
import { initGlobalErrorHandlers } from '@/lib/utils/errorHandler';

/**
 * Error Monitoring Initialization Component
 * Place this in your root layout to initialize global error handlers
 */
export function ErrorMonitoringInit() {
  useEffect(() => {
    // Initialize global error handlers
    initGlobalErrorHandlers();

    // Optional: Initialize Sentry or other monitoring service
    // if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    //   initSentry();
    // }
  }, []);

  return null; // This component doesn't render anything
}

/**
 * Optional: Sentry initialization
 * Uncomment and configure if you want to use Sentry
 */
// function initSentry() {
//   if (typeof window === 'undefined') return;
//
//   // Install: npm install @sentry/nextjs
//   // import * as Sentry from "@sentry/nextjs";
//
//   // Sentry.init({
//   //   dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
//   //   environment: process.env.NODE_ENV,
//   //   tracesSampleRate: 0.1,
//   //   integrations: [
//   //     new Sentry.BrowserTracing(),
//   //     new Sentry.Replay({
//   //       maskAllText: true,
//   //       blockAllMedia: true,
//   //     }),
//   //   ],
//   //   replaysSessionSampleRate: 0.1,
//   //   replaysOnErrorSampleRate: 1.0,
//   // });
//
//   // console.log('✅ Sentry initialized');
// }

export default ErrorMonitoringInit;
