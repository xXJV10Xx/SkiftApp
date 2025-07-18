import React, { createContext, ReactNode, useContext, useState } from 'react';

// Skapa context
const AuthContext = createContext<any>(null);

// Typ för props
type AuthProviderProps = {
  children: ReactNode;
};

// Provider-komponenten
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<any>(null);

  // Enkel logout-funktion
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook för att använda context
export const useAuth = () => useContext(AuthContext);

// Exportera även själva contextet om du vill använda useContext(AuthContext) direkt
export { AuthContext };
