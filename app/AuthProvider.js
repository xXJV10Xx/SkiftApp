// app/AuthProvider.js
import {
    createUserWithEmailAndPassword,
    isSignInWithEmailLink,
    onAuthStateChanged,
    sendSignInLinkToEmail,
    signInWithEmailAndPassword,
    signInWithEmailLink,
    signOut
} from 'firebase/auth';
import { createContext, useEffect, useState } from 'react';
import { auth } from './firebaseConfig';

export const AuthContext = createContext();

const actionCodeSettings = {
  url: 'https://dinsida.se/inloggad', // Byt till din domän
  handleCodeInApp: true,
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, u => setUser(u));
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email, password) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const sendLink = async (email) => {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
  };

  const completeLinkLogin = async () => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const email = window.localStorage.getItem('emailForSignIn');
      await signInWithEmailLink(auth, email, window.location.href);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, sendLink, completeLinkLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
