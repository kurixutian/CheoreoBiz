import { ALLOWED_ADMIN_EMAILS, FIREBASE_CONFIG } from '../constants/config';
import {
  InventoryItem,
  Order,
  Bundle,
  ActivityLogEntry,
  StockHistoryEntry,
  BnplRecord,
  CashAdjustment,
} from '../types';

declare global {
  interface Window {
    firebase: any;
  }
}

let dbInstance: any = null;
let authInstance: any = null;

export function getFirebaseServices() {
  if (typeof window !== 'undefined' && window.firebase) {
    if (!window.firebase.apps || window.firebase.apps.length === 0) {
      window.firebase.initializeApp(FIREBASE_CONFIG);
    }
    if (!dbInstance) dbInstance = window.firebase.database();
    if (!authInstance) authInstance = window.firebase.auth();
  }
  return { db: dbInstance, auth: authInstance };
}

export function isAuthorizedUserEmail(email: string | null | undefined): boolean {
  if (ALLOWED_ADMIN_EMAILS.length === 0) return true;
  if (!email) return false;
  return ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

export async function signInWithEmailPassword(
  email: string,
  pass: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  const trimmedEmail = email.trim();
  if (!isAuthorizedUserEmail(trimmedEmail)) {
    return {
      success: false,
      error: `Access is strictly restricted to ${ALLOWED_ADMIN_EMAILS.join(', ')}.`,
    };
  }

  const { auth } = getFirebaseServices();
  if (!auth) {
    return { success: false, error: 'Firebase authentication service is unavailable.' };
  }

  try {
    const res = await auth.signInWithEmailAndPassword(trimmedEmail, pass);
    if (res?.user && !isAuthorizedUserEmail(res.user.email)) {
      await auth.signOut();
      return {
        success: false,
        error: `Account (${res.user.email || 'Unknown'}) is not authorized.`,
      };
    }
    return { success: true, user: res?.user };
  } catch (err: any) {
    let msg = 'Failed to sign in. Please verify your email and password.';
    const code = err?.code;
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      msg = 'Incorrect password or no password set for this account. If you created this account with Google, use "Continue with Google" or click "Reset password" below.';
    } else if (code === 'auth/user-not-found') {
      msg = 'No account found with this email.';
    } else if (code === 'auth/too-many-requests') {
      msg = 'Too many failed login attempts. Please wait a few moments or reset your password.';
    } else if (err?.message) {
      msg = err.message;
    }
    return { success: false, error: msg };
  }
}

export async function sendPasswordResetEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const trimmedEmail = email.trim();
  if (!isAuthorizedUserEmail(trimmedEmail)) {
    return {
      success: false,
      error: `Password reset is only available for authorized accounts (${ALLOWED_ADMIN_EMAILS.join(', ')}).`,
    };
  }

  const { auth } = getFirebaseServices();
  if (!auth) {
    return { success: false, error: 'Firebase authentication service is unavailable.' };
  }

  try {
    await auth.sendPasswordResetEmail(trimmedEmail);
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to send password reset email.',
    };
  }
}

export async function signInWithGoogle(): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> {
  const { auth } = getFirebaseServices();
  if (!auth || !window.firebase?.auth?.GoogleAuthProvider) {
    return { success: false, error: 'Google authentication provider is unavailable.' };
  }
  const provider = new window.firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const res = await auth.signInWithPopup(provider);
    if (res?.user && !isAuthorizedUserEmail(res.user.email)) {
      const emailAttempt = res.user.email || 'Unknown';
      await auth.signOut();
      return {
        success: false,
        error: `Account (${emailAttempt}) is not authorized. Access is strictly restricted to oreoochi13@gmail.com.`,
      };
    }
    return { success: true, user: res?.user };
  } catch (err: any) {
    if (err?.code === 'auth/popup-blocked') {
      try {
        await auth.signInWithRedirect(provider);
        return { success: true };
      } catch (redirErr: any) {
        return { success: false, error: redirErr?.message || 'Google redirect sign-in failed.' };
      }
    }
    return {
      success: false,
      error: err?.message || 'Google sign-in was cancelled or failed.',
    };
  }
}

export function saveInventoryToDb(inventory: InventoryItem[]) {
  const { db } = getFirebaseServices();
  if (db) db.ref('inventory').set(inventory);
}

export function saveOrdersToDb(orders: Order[]) {
  const { db } = getFirebaseServices();
  if (db) db.ref('orders').set(orders);
}

export function saveBundlesToDb(bundles: Bundle[]) {
  const { db } = getFirebaseServices();
  if (db) db.ref('bundles').set(bundles);
}

export function saveActivityLogToDb(activityLog: ActivityLogEntry[]) {
  const { db } = getFirebaseServices();
  if (db) db.ref('activityLog').set(activityLog);
}

export function saveStockHistoryToDb(stockHistory: StockHistoryEntry[]) {
  const { db } = getFirebaseServices();
  if (db) db.ref('stockHistory').set(stockHistory);
}

export function saveBnplToDb(bnplRecords: BnplRecord[]) {
  const { db } = getFirebaseServices();
  if (db) db.ref('bnplRecords').set(bnplRecords);
}

export function saveCashAdjustmentsToDb(cashAdjustments: CashAdjustment[]) {
  const { db } = getFirebaseServices();
  if (db) db.ref('cashAdjustments').set(cashAdjustments);
}
