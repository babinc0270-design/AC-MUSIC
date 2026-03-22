import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import {
  type User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile as fbUpdateProfile,
  updatePassword as fbUpdatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { UserProfile } from '../types';

interface AuthContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  changePassword: (currentPwd: string, newPwd: string) => Promise<void>;
  toggleLikedSong: (songId: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        const ref = doc(db, 'users', fbUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUserProfile(snap.data() as UserProfile);
        } else {
          const profile: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            likedSongs: [],
          };
          await setDoc(ref, profile);
          setUserProfile(profile);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
  ): Promise<void> => {
    const { user: newUser } = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    await fbUpdateProfile(newUser, { displayName });
    const profile: UserProfile = {
      uid: newUser.uid,
      email: newUser.email,
      displayName,
      photoURL: null,
      likedSongs: [],
    };
    await setDoc(doc(db, 'users', newUser.uid), profile);
    setUserProfile(profile);
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async (): Promise<void> => {
    await fbSignOut(auth);
  };

  const updateUserProfile = async (
    updates: Partial<UserProfile>,
  ): Promise<void> => {
    if (!user || !userProfile) return;
    await updateDoc(doc(db, 'users', user.uid), updates as any);
    if (
      updates.displayName !== undefined ||
      updates.photoURL !== undefined
    ) {
      await fbUpdateProfile(user, {
        displayName: updates.displayName ?? user.displayName ?? undefined,
        photoURL: updates.photoURL ?? user.photoURL ?? undefined,
      });
    }
    setUserProfile((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const changePassword = async (
    currentPwd: string,
    newPwd: string,
  ): Promise<void> => {
    if (!user?.email) throw new Error('No authenticated user');
    const credential = EmailAuthProvider.credential(user.email, currentPwd);
    await reauthenticateWithCredential(user, credential);
    await fbUpdatePassword(user, newPwd);
  };

  const toggleLikedSong = async (songId: number): Promise<void> => {
    if (!user || !userProfile) throw new Error('Must be logged in');
    
    // Extra Safe: Grab the list or make an empty one if it doesn't exist
    const currentLiked = userProfile.likedSongs || [];
    const isLiked = currentLiked.includes(songId);
    
    const newLiked = isLiked
      ? currentLiked.filter((id) => id !== songId)
      : [...currentLiked, songId];
      
    await updateDoc(doc(db, 'users', user.uid), { likedSongs: newLiked });
    setUserProfile((prev) => (prev ? { ...prev, likedSongs: newLiked } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signUp,
        signIn,
        signOut,
        updateUserProfile,
        changePassword,
        toggleLikedSong,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
