// Autentiseringskonfiguration för Skiftapp

export const AUTH_CONFIG = {
  // Supabase Auth inställningar
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fsefeherdbtsddqimjco.supabase.co',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODUwNDcsImV4cCI6MjA2ODM2MTA0N30.YEltOJVQU6Ox5YrkZJGzbMiojyQClkFwG-mBPilIAfk',
  },

  // OAuth providers
  oauth: {
    google: {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || '',
      redirectUri: 'skiftapp://auth/callback',
      scopes: ['email', 'profile'],
    },
  },

  // App URLs för redirects
  urls: {
    authCallback: 'skiftapp://auth/callback',
    passwordReset: 'skiftapp://auth/reset-password',
    emailVerification: 'skiftapp://auth/verify-email',
  },

  // Lösenordskrav
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  },

  // Session inställningar
  session: {
    refreshTokenRotationEnabled: true,
    detectSessionInUrl: true,
  },
};

// Validera lösenord
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < AUTH_CONFIG.password.minLength) {
    errors.push(`Lösenordet måste vara minst ${AUTH_CONFIG.password.minLength} tecken långt`);
  }
  
  if (AUTH_CONFIG.password.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Lösenordet måste innehålla minst en stor bokstav');
  }
  
  if (AUTH_CONFIG.password.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Lösenordet måste innehålla minst en liten bokstav');
  }
  
  if (AUTH_CONFIG.password.requireNumbers && !/\d/.test(password)) {
    errors.push('Lösenordet måste innehålla minst en siffra');
  }
  
  if (AUTH_CONFIG.password.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Lösenordet måste innehålla minst ett specialtecken');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validera e-post
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Generera användar-ID baserat på e-post
export const generateUserId = (email: string): string => {
  return email.toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Säkerhetsinställningar
export const SECURITY_CONFIG = {
  // Max antal misslyckade inloggningsförsök
  maxLoginAttempts: 5,
  
  // Lås ut konto efter X misslyckade försök (minuter)
  lockoutDuration: 15,
  
  // Session timeout (timmar)
  sessionTimeout: 24,
  
  // Kräv lösenordsändring efter X dagar
  passwordExpiryDays: 90,
  
  // MFA-inställningar
  mfa: {
    enabled: false,
    requiredForAdmins: true,
    backupCodes: 10,
  },
};

// Felmeddelanden
export const AUTH_ERRORS = {
  INVALID_EMAIL: 'Ogiltig e-postadress',
  INVALID_PASSWORD: 'Ogiltigt lösenord',
  WEAK_PASSWORD: 'Lösenordet är för svagt',
  EMAIL_IN_USE: 'E-postadressen används redan',
  USER_NOT_FOUND: 'Användare hittades inte',
  INVALID_CREDENTIALS: 'Fel e-post eller lösenord',
  ACCOUNT_LOCKED: 'Kontot är låst på grund av för många misslyckade försök',
  SESSION_EXPIRED: 'Sessionen har gått ut, logga in igen',
  EMAIL_NOT_VERIFIED: 'E-postadressen är inte verifierad',
  GOOGLE_AUTH_FAILED: 'Google-inloggning misslyckades',
  NETWORK_ERROR: 'Nätverksfel, kontrollera din anslutning',
  UNKNOWN_ERROR: 'Ett oväntat fel uppstod',
};

// Framgångsmeddelanden
export const AUTH_SUCCESS = {
  LOGIN_SUCCESS: 'Inloggning lyckades!',
  REGISTRATION_SUCCESS: 'Registrering lyckades! Kontrollera din e-post för verifiering.',
  PASSWORD_RESET_SENT: 'Återställningslänk skickad till din e-post',
  PASSWORD_CHANGED: 'Lösenordet har ändrats',
  EMAIL_VERIFIED: 'E-postadressen har verifierats',
  LOGOUT_SUCCESS: 'Du har loggats ut',
  GOOGLE_LOGIN_SUCCESS: 'Google-inloggning lyckades!',
};

// Autentiseringsloggar
export const logAuthEvent = (event: string, userId?: string, details?: any) => {
  console.log(`[AUTH] ${event}`, {
    userId,
    timestamp: new Date().toISOString(),
    details,
  });
}; 