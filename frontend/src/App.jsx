import React, { useState, useEffect } from 'react';
import { useAuthContext } from './context/AuthContext';
import AuthPortal from './components/AuthPortal';
import DisasterMapPage from './pages/DisasterMapPage';
import RescueTeamDashboard from './components/RescueTeamDashboard';
import SurvivalAcademyPage from './pages/SurvivalAcademyPage';
import './App.css';

function App() {
  const {
    currentUser,
    rescueTeam,
    isAuthenticated,
    isRescueWorker,
    logout,
    updateRescueTeamProfile,
  } = useAuthContext();

  // activeView is the source of truth for which screen is shown:
  // 'auth' | 'rescue_command' | 'public_map' | 'survival_academy'
  const [activeView, setActiveView] = useState(() => {
    if (window.location.pathname === '/survive') {
      return 'survival_academy';
    }
    return 'auth';
  });

  const [survivalDisasterFilter, setSurvivalDisasterFilter] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('disaster') || null;
  });

  // Handle URL route sync & browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/survive') {
        const params = new URLSearchParams(window.location.search);
        setSurvivalDisasterFilter(params.get('disaster') || null);
        setActiveView('survival_academy');
      } else if (isAuthenticated) {
        setActiveView('public_map');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated]);

  // When auth state changes, update the default view
  useEffect(() => {
    if (!isAuthenticated) {
      if (window.location.pathname !== '/survive') {
        setActiveView('auth');
      }
    } else if (activeView === 'auth') {
      if (window.location.pathname === '/survive') {
        setActiveView('survival_academy');
      } else {
        setActiveView(isRescueWorker ? 'rescue_command' : 'public_map');
      }
    }
  }, [isAuthenticated, isRescueWorker, activeView]);

  const handleLogout = () => {
    logout();
    setActiveView('auth');
  };

  const handleOpenSurvivalAcademy = (disasterType = null) => {
    setSurvivalDisasterFilter(disasterType);
    setActiveView('survival_academy');
    const newUrl = disasterType ? `/survive?disaster=${encodeURIComponent(disasterType)}` : '/survive';
    window.history.pushState({}, '', newUrl);
  };

  const handleBackToPublicMap = () => {
    setActiveView('public_map');
    window.history.pushState({}, '', '/');
  };

  // ── Survival Academy View (Accessible publicly or authenticated via /survive)
  if (activeView === 'survival_academy') {
    return (
      <SurvivalAcademyPage
        user={currentUser}
        initialDisasterType={survivalDisasterFilter}
        onBackToMap={handleBackToPublicMap}
      />
    );
  }

  // ── Not logged in → Auth Portal (Login First)
  if (!isAuthenticated || activeView === 'auth') {
    return (
      <AuthPortal
        onLoginSuccess={(user, team) => {
          if (team || user?.role === 'rescue_worker') {
            setActiveView('rescue_command');
          } else {
            setActiveView('public_map');
          }
        }}
      />
    );
  }

  // ── Rescue Command Dashboard
  if (activeView === 'rescue_command' && (rescueTeam || isRescueWorker)) {
    const activeTeam = rescueTeam || {
      _id: currentUser._id,
      teamName: currentUser.organization || `${currentUser.name}'s Taskforce`,
      teamCode: currentUser.teamCode || 'SAR-UNIT-01',
      organization: currentUser.organization || 'Emergency Response Authority',
      specialization: currentUser.specialization || 'general_sar',
      leaderName: currentUser.name,
      capacityMembers: 12,
      location: currentUser.location || { latitude: 28.6139, longitude: 77.209, address: 'Command Post' },
      status: 'available',
      stats: { missionsCompleted: 0, peopleRescued: 0, casualtiesTreated: 0 },
    };

    return (
      <RescueTeamDashboard
        team={activeTeam}
        user={currentUser}
        onUpdateTeam={updateRescueTeamProfile}
        onLogout={handleLogout}
        onSwitchToPublicMap={handleBackToPublicMap}
      />
    );
  }

  // ── Public Disaster Map Page
  return (
    <DisasterMapPage
      user={currentUser}
      rescueTeam={rescueTeam}
      onLogout={handleLogout}
      onOpenRescueCommand={isRescueWorker ? () => setActiveView('rescue_command') : null}
      onOpenSurvivalAcademy={handleOpenSurvivalAcademy}
    />
  );
}

export default App;
