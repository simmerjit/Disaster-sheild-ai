import { StrictMode, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider, useAuth, useClerk, useUser } from '@clerk/clerk-react';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';
import App from './App.jsx';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const ClerkAuthBridge = () => {
  const { getToken, isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { openSignIn, openSignUp, signOut } = useClerk();
  const isLoaded = authLoaded && userLoaded;

  const clerkAuth = useMemo(
    () => ({ getToken, isLoaded, isSignedIn, user, openSignIn, openSignUp, signOut }),
    [getToken, isLoaded, isSignedIn, user, openSignIn, openSignUp, signOut]
  );

  return (
    <AuthProvider clerkAuth={clerkAuth}>
      <App />
    </AuthProvider>
  );
};

const RootApp = () => {
  if (CLERK_PUBLISHABLE_KEY && CLERK_PUBLISHABLE_KEY.startsWith('pk_')) {
    return (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <ClerkAuthBridge />
      </ClerkProvider>
    );
  }

  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootApp />
  </StrictMode>
);
