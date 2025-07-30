import React, { createContext, useState, useContext } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [confirmation, setConfirmation] = useState(null);

  return (
    <AuthContext.Provider value={{ confirmation, setConfirmation }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
