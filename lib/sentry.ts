import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

// Initialize Sentry
export const initSentry = () => {
  Sentry.init({
    // Replace this with your actual Sentry DSN from your Sentry project
    dsn: 'YOUR_SENTRY_DSN_HERE',
    
    // Set sample rate for performance monitoring
    tracesSampleRate: 1.0,
    
    // Set sample rate for profiling
    // We recommend adjusting this value in production
    profilesSampleRate: 1.0,
    
    // Debug mode (set to false in production)
    debug: __DEV__,
    
    // Environment
    environment: __DEV__ ? 'development' : 'production',
    
    // Release version
    release: Constants.expoConfig?.version || '1.0.0',
    
    // Additional configuration
    beforeSend(event) {
      // Filter out events in development if needed
      if (__DEV__) {
        console.log('Sentry Event:', event);
      }
      return event;
    },
    
    // Integration configuration
    integrations: [
      new Sentry.ReactNativeTracing({
        // Pass instrumentation to be used as `routingInstrumentation`
        routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
        enableNativeFramesTracking: !__DEV__,
      }),
    ],
  });
};

// Helper functions for manual error reporting
export const captureException = (error: Error, context?: any) => {
  if (context) {
    Sentry.withScope((scope) => {
      scope.setContext('additional_info', context);
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

export const setUser = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser(user);
};

export const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb) => {
  Sentry.addBreadcrumb(breadcrumb);
};

export const setTag = (key: string, value: string) => {
  Sentry.setTag(key, value);
};

export const setContext = (key: string, context: any) => {
  Sentry.setContext(key, context);
};

// Export Sentry for direct access if needed
export { Sentry };