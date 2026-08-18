import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
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
      const res = await axios.post(`${API_BASE_URL}/auth/sync`, userData);
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
    isAuthenticated: Boolean(currentUser),
    isRescueWorker: currentUser?.role === 'rescue_worker' || Boolean(rescueTeam),
    loading,
    login,
    registerOrSync,
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
