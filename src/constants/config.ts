export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

/**
 * Single authorized email address for Google OAuth login.
 * All other accounts are strictly blocked.
 */
export const ALLOWED_ADMIN_EMAILS: string[] = ['oreoochi13@gmail.com'];

export const DEFAULT_BATCH_OPTIONS = ['Batch 1', 'Batch 2', 'Batch 3'];

export const INITIAL_CALCULATOR_BUTTONS = [
  ['C', '/', '*', '-'],
  ['7', '8', '9', '+'],
  ['4', '5', '6'],
  ['1', '2', '3', '='],
  ['0', '.'],
];
