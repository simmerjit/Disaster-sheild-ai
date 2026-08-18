import React, { useState, useEffect } from 'react';
import { useAuthContext } from './context/AuthContext';
import AuthPortal from './components/AuthPortal';
import DisasterMapPage from './pages/DisasterMapPage';
import RescueTeamDashboard from './components/RescueTeamDashboard';
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

  // activeView is the ONLY source of truth for which screen is shown
  // It starts based on role but can be freely switched by the user
  const [activeView, setActiveView] = useState('auth'); // 'auth' | 'rescue_command' | 'public_map'

  // When auth state changes, update the default view
  useEffect(() => {
    if (!isAuthenticated) {
      setActiveView('auth');
    } else if (activeView === 'auth') {
      // First time becoming authenticated - pick default view based on role
      setActiveView(isRescueWorker ? 'rescue_command' : 'public_map');
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    logout();
    setActiveView('auth');
  };

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
        onSwitchToPublicMap={() => setActiveView('public_map')}
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
    />
  );
}

export default App;
