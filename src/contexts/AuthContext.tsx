import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { GoogleAuthProvider, User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import {
  auth,
  db,
  getCachedWorkspaceAccessToken,
  googleProvider,
  handleFirestoreError,
  OperationType,
  setCachedWorkspaceAccessToken,
} from '../firebase';
import { isSearchCrawler } from '../utils/seoRouting';

export interface WorkspaceUserProfile {
  id: number;
  uid: string;
  email: string;
  displayName: string;
  photoUrl: string | null;
  city: string;
  primarySkill: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface SkillExchangeProposalRecord {
  id: number;
  userId: number;
  offeredSkill: string;
  requestedSkill: string;
  city: string;
  notes: string;
  status: string;
  createdAt: string;
}

export interface GroundedSourceItem {
  title: string;
  uri: string;
}

export interface SavedMarketInsightRecord {
  id: number;
  queryTopic: string;
  summaryText: string;
  sources: GroundedSourceItem[];
  createdAt: string;
}

interface AuthContextValue {
  user: User | null;
  authReady: boolean;
  authError: string;
  gmailAccessToken: string | null;
  workspaceLoading: boolean;
  workspaceError: string;
  profile: WorkspaceUserProfile | null;
  proposals: SkillExchangeProposalRecord[];
  savedInsights: SavedMarketInsightRecord[];
  signInWithGoogle: () => Promise<User | null>;
  connectGmailAccount: () => Promise<string | null>;
  clearGmailAccessToken: () => void;
  signOutUser: () => Promise<void>;
  refreshWorkspace: () => Promise<void>;
  updateProfile: (updates: {
    displayName: string;
    city: string;
    primarySkill: string;
    role: string;
  }) => Promise<void>;
  createProposal: (input: {
    offeredSkill: string;
    requestedSkill: string;
    city: string;
    notes: string;
  }) => Promise<void>;
  updateProposalStatus: (id: number, status: 'open' | 'matched' | 'archived') => Promise<void>;
  deleteProposal: (id: number) => Promise<void>;
  saveInsight: (input: {
    queryTopic: string;
    summaryText: string;
    sources: GroundedSourceItem[];
  }) => Promise<void>;
  deleteInsight: (id: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function syncFirestoreUserProfile(firebaseUser: User): Promise<void> {
  if (isSearchCrawler()) return;
  const userRef = doc(db, 'users', firebaseUser.uid);
  const safeEmail = (firebaseUser.email || `${firebaseUser.uid}@skillconnect.user`).slice(0, 120);
  const safeName = (firebaseUser.displayName || safeEmail.split('@')[0] || 'SkillConnect Member').slice(0, 100);
  const safePhoto = firebaseUser.photoURL ? firebaseUser.photoURL.slice(0, 500) : '';

  try {
    const existing = await getDoc(userRef);
    if (!existing.exists()) {
      const payload: Record<string, unknown> = {
        userId: firebaseUser.uid,
        email: safeEmail,
        displayName: safeName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (safePhoto) {
        payload.photoURL = safePhoto;
      }
      await setDoc(userRef, payload);
    } else {
      const payload: Record<string, unknown> = {
        email: safeEmail,
        displayName: safeName,
        updatedAt: serverTimestamp(),
      };
      if (safePhoto) {
        payload.photoURL = safePhoto;
      }
      await updateDoc(userRef, payload);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`, true);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');
  const [gmailAccessToken, setGmailAccessToken] = useState<string | null>(() =>
    getCachedWorkspaceAccessToken()
  );
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');
  const [profile, setProfile] = useState<WorkspaceUserProfile | null>(null);
  const [proposals, setProposals] = useState<SkillExchangeProposalRecord[]>([]);
  const [savedInsights, setSavedInsights] = useState<SavedMarketInsightRecord[]>([]);

  const fetchWorkspace = useCallback(async (firebaseUser: User) => {
    if (isSearchCrawler()) return;
    setWorkspaceLoading(true);
    setWorkspaceError('');
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/me', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: firebaseUser.displayName || '',
          photoUrl: firebaseUser.photoURL || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Could not load member workspace.');
      }
      setProfile(data.user || null);
      setProposals(Array.isArray(data.proposals) ? data.proposals : []);
      setSavedInsights(Array.isArray(data.savedInsights) ? data.savedInsights : []);
    } catch (err) {
      setWorkspaceError(err instanceof Error ? err.message : 'Unable to load member workspace.');
    } finally {
      setWorkspaceLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (current) => {
      setUser(current);
      setAuthReady(true);
      if (current) {
        setGmailAccessToken(getCachedWorkspaceAccessToken());
        void syncFirestoreUserProfile(current);
        void fetchWorkspace(current);
      } else {
        setCachedWorkspaceAccessToken(null);
        setGmailAccessToken(null);
        setProfile(null);
        setProposals([]);
        setSavedInsights([]);
        setWorkspaceError('');
      }
    });
    return () => unsub();
  }, [fetchWorkspace]);

  const signInWithGoogle = async (): Promise<User | null> => {
    setAuthError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      setCachedWorkspaceAccessToken(token);
      setGmailAccessToken(token);
      return result.user;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      setAuthError(msg);
      return null;
    }
  };

  const connectGmailAccount = async (): Promise<string | null> => {
    setAuthError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      if (!token) {
        throw new Error('Google did not return a Gmail access token. Please try signing in again.');
      }
      setCachedWorkspaceAccessToken(token);
      setGmailAccessToken(token);
      return token;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to authorize Gmail access.';
      setAuthError(msg);
      return null;
    }
  };

  const clearGmailAccessToken = useCallback(() => {
    setCachedWorkspaceAccessToken(null);
    setGmailAccessToken(null);
  }, []);

  const signOutUser = async () => {
    setAuthError('');
    setCachedWorkspaceAccessToken(null);
    setGmailAccessToken(null);
    await signOut(auth);
  };

  const refreshWorkspace = async () => {
    if (!user) return;
    await fetchWorkspace(user);
  };

  const authorizedFetch = async (url: string, init: RequestInit) => {
    if (!user) throw new Error('Please sign in with Google first.');
    const token = await user.getIdToken();
    const res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init.headers || {}),
      },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || 'Request failed.');
    }
    return data;
  };

  const updateProfile = async (updates: {
    displayName: string;
    city: string;
    primarySkill: string;
    role: string;
  }) => {
    const data = await authorizedFetch('/api/me', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    if (data.user) {
      setProfile(data.user);
    }
    if (user && !isSearchCrawler()) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          displayName: updates.displayName.trim().slice(0, 100),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // Keep workspace flow uninterrupted
      }
    }
  };

  const createProposal = async (input: {
    offeredSkill: string;
    requestedSkill: string;
    city: string;
    notes: string;
  }) => {
    const data = await authorizedFetch('/api/workspace/proposals', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (data.proposal) {
      setProposals((prev) => [data.proposal, ...prev]);
    }
  };

  const updateProposalStatus = async (id: number, status: 'open' | 'matched' | 'archived') => {
    const data = await authorizedFetch(`/api/workspace/proposals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (data.proposal) {
      setProposals((prev) => prev.map((p) => (p.id === id ? data.proposal : p)));
    }
  };

  const deleteProposal = async (id: number) => {
    await authorizedFetch(`/api/workspace/proposals/${id}`, {
      method: 'DELETE',
    });
    setProposals((prev) => prev.filter((p) => p.id !== id));
  };

  const saveInsight = async (input: {
    queryTopic: string;
    summaryText: string;
    sources: GroundedSourceItem[];
  }) => {
    const data = await authorizedFetch('/api/workspace/insights', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (data.insight) {
      setSavedInsights((prev) => [data.insight, ...prev]);
    }
  };

  const deleteInsight = async (id: number) => {
    await authorizedFetch(`/api/workspace/insights/${id}`, {
      method: 'DELETE',
    });
    setSavedInsights((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        authError,
        gmailAccessToken,
        workspaceLoading,
        workspaceError,
        profile,
        proposals,
        savedInsights,
        signInWithGoogle,
        connectGmailAccount,
        clearGmailAccessToken,
        signOutUser,
        refreshWorkspace,
        updateProfile,
        createProposal,
        updateProposalStatus,
        deleteProposal,
        saveInsight,
        deleteInsight,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
