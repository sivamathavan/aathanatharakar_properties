"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserRole, AccountStatus } from "@/types";

interface AuthUser {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  accountStatus: AccountStatus;
  image?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: User | null;
  loading: boolean;
  status: "loading" | "authenticated" | "unauthenticated";
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  status: "loading",
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          // Fetch role and status from Firestore
          const userDoc = await getDoc(doc(db, "users", fbUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({
              id: fbUser.uid,
              name: data.name || fbUser.displayName,
              email: fbUser.email,
              role: data.role || UserRole.PROPERTY_LISTER,
              accountStatus: data.accountStatus || AccountStatus.ACTIVE,
              image: data.image || fbUser.photoURL,
            });
          } else {
            // User exists in Firebase Auth but not Firestore — fallback
            setUser({
              id: fbUser.uid,
              name: fbUser.displayName,
              email: fbUser.email,
              role: UserRole.PROPERTY_LISTER,
              accountStatus: AccountStatus.PENDING,
            });
          }
        } catch (err) {
          console.error("[AuthProvider] Error fetching user doc:", err);
          setUser({
            id: fbUser.uid,
            name: fbUser.displayName,
            email: fbUser.email,
            role: UserRole.PROPERTY_LISTER,
            accountStatus: AccountStatus.PENDING,
          });
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const status = loading
    ? "loading"
    : user
    ? "authenticated"
    : "unauthenticated";

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, status }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access current auth state.
 * Returns { user, firebaseUser, loading, status }
 * 
 * Replacement for NextAuth's useSession():
 *   const { data: session } = useSession()
 * becomes:
 *   const { user } = useAuth()
 *   // user.role, user.email, user.id etc.
 */
export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Compatibility shim — returns data shaped like NextAuth session.
 * Use this during migration to minimize changes in components.
 */
export function useSession() {
  const { user, loading, status } = useAuth();
  return {
    data: user ? { user } : null,
    status,
    update: async () => {}, // no-op for compatibility
  };
}
