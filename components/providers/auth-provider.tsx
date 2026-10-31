"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onIdTokenChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { UserRole } from "@/types";

interface AuthUser {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: boolean;
  role: UserRole | null;
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

// Client-side auth state for UI only (menus, buttons). Pages and APIs check
// the session cookie on the server, so nothing here grants access.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        const token = await fbUser.getIdTokenResult().catch(() => null);
        const role = token?.claims.role as string | undefined;
        setUser({
          id: fbUser.uid,
          name: fbUser.displayName,
          email: fbUser.email,
          emailVerified: fbUser.emailVerified,
          role: role === UserRole.ADMIN || role === UserRole.AGENT ? (role as UserRole) : null,
          image: fbUser.photoURL,
        });
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const status = loading ? "loading" : user ? "authenticated" : "unauthenticated";

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, status }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useSession() {
  const { user, status } = useAuth();
  return { data: user ? { user } : null, status };
}
