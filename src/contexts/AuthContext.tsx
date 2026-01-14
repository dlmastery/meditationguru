'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { User } from '@/types';
import { useAppStore } from '@/lib/store';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, setUser, setOnboardingComplete } = useAppStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        // Fetch or create user document
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setUser(userData);
          setOnboardingComplete(userData.onboarding?.completed || false);
        } else {
          // Create new user document
          const newUser: Partial<User> = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            preferences: {
              guruVoice: 'Kore',
              preferredDuration: 10,
              reminderTimes: ['08:00', '20:00'],
              primaryGoals: [],
              experienceLevel: 'beginner',
            },
            onboarding: {
              completed: false,
              selectedOrbs: [],
            },
            subscription: {
              isDonor: false,
              donationTotal: 0,
            },
          };

          await setDoc(doc(db, 'users', firebaseUser.uid), {
            ...newUser,
            createdAt: serverTimestamp(),
            lastSessionAt: serverTimestamp(),
          });

          setUser(newUser as User);
          setOnboardingComplete(false);
        }
      } else {
        setUser(null);
        setOnboardingComplete(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setOnboardingComplete]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        loading,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
