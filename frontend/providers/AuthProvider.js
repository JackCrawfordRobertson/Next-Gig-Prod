"use client";

import { createContext, useContext } from "react";
import { useSession } from "next-auth/react";

const AuthContext = createContext({
  session: null,
  status: "loading",
});

export function AuthProvider({ children }) {
  const { data: session, status } = useSession();

  return (
    <AuthContext.Provider value={{ session, status }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);