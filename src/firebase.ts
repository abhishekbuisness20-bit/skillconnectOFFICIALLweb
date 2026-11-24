import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

const configuredDatabaseId =
  'firestoreDatabaseId' in firebaseConfig &&
  typeof (firebaseConfig as { firestoreDatabaseId?: unknown }).firestoreDatabaseId === 'string'
    ? (firebaseConfig as { firestoreDatabaseId: string }).firestoreDatabaseId
    : undefined;

export const db = configuredDatabaseId
  ? getFirestore(app, configuredDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);

export const GMAIL_SCOPES: readonly string[] = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
  'https://www.googleapis.com/auth/gmail.addons.current.message.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing',
];

export const googleProvider = new GoogleAuthProvider();
GMAIL_SCOPES.forEach((scope) => {
  googleProvider.addScope(scope);
});
googleProvider.setCustomParameters({ prompt: 'select_account' });

// In-memory only OAuth access token cache (never persisted to localStorage or sessionStorage)
let cachedWorkspaceAccessToken: string | null = null;

export function getCachedWorkspaceAccessToken(): string | null {
  return cachedWorkspaceAccessToken;
}

export function setCachedWorkspaceAccessToken(token: string | null): void {
  cachedWorkspaceAccessToken = token;
}

export const FOUNDER_UID = 'TvWkRWE868gnDaiFkH0IqBuGb0u2';
export const FOUNDER_EMAIL = 'singhabhishek83072@gmail.com';

export function isFounderUser(user: User | null): boolean {
  if (!user) return false;
  if (user.uid === FOUNDER_UID) return true;
  if (user.email?.toLowerCase() === FOUNDER_EMAIL && user.emailVerified) return true;
  return false;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  silent = false
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  if (!silent) {
    throw new Error(JSON.stringify(errInfo));
  }
  return errInfo;
}
