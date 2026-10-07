import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const demoAuthEnabled = import.meta.env.VITE_DEMO_AUTH_ENABLED === 'true';
const AuthContext = createContext(null);

export const AuthProvider = ({ children, clerkAuth = null }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('disaster_shield_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [rescueTeam, setRescueTeam] = useState(() => {
    try {
      const saved = localStorage.getItem('disaster_shield_rescue_team');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!clerkAuth) return undefined;

    const interceptorId = axios.interceptors.request.use(async (config) => {
      if (clerkAuth.isSignedIn) {
        const token = await clerkAuth.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    return () => axios.interceptors.request.eject(interceptorId);
  }, [clerkAuth]);

  useEffect(() => {
    if (!clerkAuth?.isLoaded) return;

    if (!clerkAuth.isSignedIn || !clerkAuth.user) {
      setCurrentUser(null);
      setRescueTeam(null);
      setAuthError(null);
      return;
    }

    let cancelled = false;
    const syncClerkProfile = async () => {
      setLoading(true);
      setAuthError(null);
      try {
        const token = await clerkAuth.getToken();
        const user = clerkAuth.user;
        const email =
          user.primaryEmailAddress?.emailAddress ||
          user.emailAddresses?.[0]?.emailAddress;
        if (!email) {
          throw new Error('Add a primary email address to your Clerk account to continue.');
        }

        const response = await axios.post(
          `${API_BASE_URL}/auth/sync`,
          {
            email,
            name: user.fullName || user.firstName || 'Citizen',
            avatar: user.imageUrl,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Could not load your account profile.');
        }
        if (!cancelled) {
          setCurrentUser(response.data.user);
          setRescueTeam(response.data.rescueTeam || null);
        }
      } catch (error) {
        if (!cancelled) {
          setCurrentUser(null);
          setRescueTeam(null);
          setAuthError(error.response?.data?.message || error.message || 'Account synchronization failed.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    syncClerkProfile();
    return () => {
      cancelled = true;
    };
  }, [clerkAuth]);

  // Sync state changes with localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('disaster_shield_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('disaster_shield_auth_user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (rescueTeam) {
      localStorage.setItem('disaster_shield_rescue_team', JSON.stringify(rescueTeam));
    } else {
      localStorage.removeItem('disaster_shield_rescue_team');
    }
  }, [rescueTeam]);

  // Login handler
  const login = async (emailOrCode, password) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        emailOrCode,
        password,
      });

      if (res.data?.success) {
        setCurrentUser(res.data.user);
        if (res.data.rescueTeam) {
          setRescueTeam(res.data.rescueTeam);
        }
        return res.data;
      }
      throw new Error(res.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Register / Sync handler
  const registerOrSync = async (userData) => {
    setLoading(true);
    try {
      const token = clerkAuth?.isSignedIn ? await clerkAuth.getToken() : null;
      const res = await axios.post(`${API_BASE_URL}/auth/sync`, userData, {
        ...(token && { headers: { Authorization: `Bearer ${token}` } }),
      });
      if (res.data?.success) {
        setCurrentUser(res.data.user);
        if (res.data.rescueTeam) {
          setRescueTeam(res.data.rescueTeam);
        }
        return res.data;
      }
      throw new Error(res.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = () => {
    setCurrentUser(null);
    setRescueTeam(null);
    localStorage.removeItem('disaster_shield_auth_user');
    localStorage.removeItem('disaster_shield_rescue_team');
    if (clerkAuth?.isSignedIn) {
      clerkAuth.signOut();
    }
  };

  const continueAsGuest = () => {
    const guest = {
      _id: `guest_${Date.now()}`,
      name: 'Guest Observer',
      email: '',
      role: 'citizen',
      isGuest: true,
      organization: 'Public Network',
      location: { latitude: 28.6139, longitude: 77.209, address: 'New Delhi, India' },
    };
    setCurrentUser(guest);
    setRescueTeam(null);
    return { success: true, user: guest, rescueTeam: null };
  };

  // Update rescue team in state
  const updateRescueTeamProfile = (updatedTeam) => {
    setRescueTeam(updatedTeam);
    if (currentUser) {
      setCurrentUser((prev) => ({ ...prev, rescueTeamId: updatedTeam._id }));
    }
  };

  const value = {
    currentUser,
    rescueTeam,
    isAuthenticated: Boolean(
      currentUser &&
        (!clerkAuth ||
          currentUser.isGuest ||
          (clerkAuth.isLoaded && clerkAuth.isSignedIn))
    ),
    isRescueWorker: currentUser?.role === 'rescue_worker' || Boolean(rescueTeam),
    loading,
    authError,
    clerkEnabled: Boolean(clerkAuth),
    demoAuthEnabled,
    startSignIn: clerkAuth?.openSignIn,
    startSignUp: clerkAuth?.openSignUp,
    login,
    registerOrSync,
    continueAsGuest,
    logout,
    updateRescueTeamProfile,
    setCurrentUser,
    setRescueTeam,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
