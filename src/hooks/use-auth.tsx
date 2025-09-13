
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User, sendPasswordResetEmail, indexedDBLocalPersistence, setPersistence } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  sendPasswordReset: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AppAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Set persistence to indexedDB to ensure session is saved across app closures
    setPersistence(auth, indexedDBLocalPersistence)
      .then(() => {
        // This listener now runs after persistence has been set
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setUser(user);
          setLoading(false);
        });
        return unsubscribe;
      })
      .catch((error) => {
        console.error("Error setting auth persistence:", error);
        setLoading(false);
      });
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const sendPasswordReset = async () => {
    if (user) {
      await sendPasswordResetEmail(auth, user.email!);
    } else {
      throw new Error("No user is signed in to reset the password for.");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, sendPasswordReset }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
