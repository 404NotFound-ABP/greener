import { useEffect, useState } from 'react';

// Importação das páginas de utilizador
import { Login } from './pages/LoginPage';
import { Register } from './pages/Register';
import { RegisterStep2 } from './pages/RegisterStep2';
import { RegisterStep3 } from './pages/RegisterStep3';

// Importação das páginas administrativas
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';

import { MainLayout } from './components/MainLayout';
import { clearSession, isAdmin, isAuthenticated } from './utils/auth';

export function App() {
  // Estado que controla qual ecrã está visível no momento
  const [currentScreen, setCurrentScreen] = useState<
    | 'login' 
    | 'register' 
    | 'register-step2' 
    | 'register-step3' 
    | 'map' 
    | 'admin-login' 
    | 'admin-dashboard'
  >('login');

  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleExpired = (event: Event) => {
      const custom = event as CustomEvent<{ message?: string }>;
      setSessionMessage(custom.detail?.message || 'Sua sessão expirou. Por favor, faça login novamente.');
      setCurrentScreen('login');
    };

    window.addEventListener('greener:session_expired', handleExpired);
    return () => {
      window.removeEventListener('greener:session_expired', handleExpired);
    };
  }, []);

  const handleLogout = () => {
    clearSession();
    setSessionMessage(null);
    setCurrentScreen('login');
  };

  // ==========================================
  // FLUXO PÚBLICO (LOGIN E REGISTO)
  // ==========================================
  if (currentScreen === 'login') {
    return (
      <Login
        onLoginSuccess={() => {
          setSessionMessage(null);
          setCurrentScreen('map');
        }}
        onGoToRegister={() => setCurrentScreen('register')}
        onAdminAccess={() => setCurrentScreen('admin-login')}
        sessionMessage={sessionMessage}
      />
    );
  }

  if (currentScreen === 'register') {
    return (
      <Register
        onNextStep={() => setCurrentScreen('register-step2')} 
      />
    );
  }

  if (currentScreen === 'register-step2') {
    return (
      <RegisterStep2
        onNextStep={() => setCurrentScreen('register-step3')} 
      />
    );
  }

  if (currentScreen === 'register-step3') {
    return (
      <RegisterStep3
        onFinish={() => setCurrentScreen('map')} 
      />
    );
  }

  // ==========================================
  // FLUXO ADMINISTRATIVO
  // ==========================================
  if (currentScreen === 'admin-login') {
    return (
      <AdminLogin
        onLoginSuccess={() => {
          setSessionMessage(null);
          setCurrentScreen('admin-dashboard');
        }}
      />
    );
  }

  if (currentScreen === 'admin-dashboard') {
    if (!isAdmin()) {
      return (
        <AdminLogin
          onLoginSuccess={() => {
            setSessionMessage(null);
            setCurrentScreen('admin-dashboard');
          }}
        />
      );
    }

    return (
      <AdminDashboard
        onLogout={handleLogout}
        onViewPublicDashboard={() => setCurrentScreen('map')}
      />
    );
  }

  return <MainLayout onLogout={handleLogout} />;
}

export default App;