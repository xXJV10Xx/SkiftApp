export const translations = {
  sv: {
    // Auth
    login: 'Logga in',
    signup: 'Registrera dig',
    email: 'E-post',
    password: 'Lösenord',
    forgotPassword: 'Glömt lösenord?',
    signInWithGoogle: 'Logga in med Google',
    signOut: 'Logga ut',
    resetPassword: 'Återställ lösenord',
    sendResetEmail: 'Skicka återställningsmail',
    
    // Navigation
    home: 'Hem',
    chat: 'Chat',
    explore: 'Utforska',
    profile: 'Profil',
    
    // Chat
    selectTeam: 'Välj lag',
    noTeamSelected: 'Inget lag valt',
    typeMessage: 'Skriv meddelande...',
    send: 'Skicka',
    online: 'Online',
    offline: 'Offline',
    teamMembers: 'Lagmedlemmar',
    noMessages: 'Inga meddelanden än',
    
    // Profile
    userProfile: 'Användarprofil',
    userEmail: 'E-post',
    userCompany: 'Företag',
    userTeams: 'Lag',
    settings: 'Inställningar',
    
    // General
    loading: 'Laddar...',
    error: 'Fel',
    success: 'Framgång',
    cancel: 'Avbryt',
    save: 'Spara',
    delete: 'Radera',
    edit: 'Redigera',
    add: 'Lägg till',
    remove: 'Ta bort',
    
    // Companies & Teams
    companiesList: 'Företag',
    teamsList: 'Lag',
    teamMembers: 'Lagmedlemmar',
    joinTeam: 'Gå med i lag',
    leaveTeam: 'Lämna lag',
    createTeam: 'Skapa lag',
    teamName: 'Lagnamn',
    teamColor: 'Lagfärg',
    teamDescription: 'Lagbeskrivning',
    
    // Messages
    messageSent: 'Meddelande skickat',
    messageError: 'Fel vid skickande av meddelande',
    networkError: 'Nätverksfel',
    tryAgain: 'Försök igen',
    
    // Status
    connected: 'Ansluten',
    disconnected: 'Frånkopplad',
    connecting: 'Ansluter...',
  },
  en: {
    // Auth
    login: 'Login',
    signup: 'Sign up',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    signInWithGoogle: 'Sign in with Google',
    signOut: 'Sign out',
    resetPassword: 'Reset password',
    sendResetEmail: 'Send reset email',
    
    // Navigation
    home: 'Home',
    chat: 'Chat',
    explore: 'Explore',
    profile: 'Profile',
    
    // Chat
    selectTeam: 'Select team',
    noTeamSelected: 'No team selected',
    typeMessage: 'Type message...',
    send: 'Send',
    online: 'Online',
    offline: 'Offline',
    teamMembers: 'Team members',
    noMessages: 'No messages yet',
    
    // Profile
    userProfile: 'User Profile',
    userEmail: 'Email',
    userCompany: 'Company',
    userTeams: 'Teams',
    settings: 'Settings',
    
    // General
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    remove: 'Remove',
    
    // Companies & Teams
    companiesList: 'Companies',
    teamsList: 'Teams',
    teamMembers: 'Team members',
    joinTeam: 'Join team',
    leaveTeam: 'Leave team',
    createTeam: 'Create team',
    teamName: 'Team name',
    teamColor: 'Team color',
    teamDescription: 'Team description',
    
    // Messages
    messageSent: 'Message sent',
    messageError: 'Error sending message',
    networkError: 'Network error',
    tryAgain: 'Try again',
    
    // Status
    connected: 'Connected',
    disconnected: 'Disconnected',
    connecting: 'Connecting...',
  }
};

export type Language = 'sv' | 'en';
export type TranslationKey = keyof typeof translations.sv;

export const getTranslation = (key: TranslationKey, language: Language = 'sv'): string => {
  return translations[language][key] || key;
}; 