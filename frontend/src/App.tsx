import { useEffect, useState } from 'react';

// Importação das páginas de utilizador
import { Login } from './pages/LoginPage';
import { Register, type DadosCadastro } from './pages/Register';
import { RegisterStep2, type DadosPreferencias } from './pages/RegisterStep2';
import { RegisterStep3 } from './pages/RegisterStep3';

// Importação das páginas administrativas
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';

import { MainLayout } from './components/MainLayout';
import { clearSession, isAdmin } from './utils/auth';

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
  const [registrationData, setRegistrationData] = useState<DadosCadastro>({
    nome: '',
    sobrenome: '',
    email: '',
    telefone: '',
  });
  const [registrationPreferences, setRegistrationPreferences] = useState<DadosPreferencias>({
    tempoAtualizacao: '',
    localizacao: '',
  });

  useEffect(() => {
    const handleExpired = (event: Event) => {
      const custom = event as CustomEvent<{ message?: string }>;
      setSessionMessage(custom.detail?.message || 'Sua sessão expirou. Por favor, faça login novamente.');
      setCurrentScreen('login');
    };
useEffect(() => {
  const handleExpired = (event: Event) => {
    const custom = event as CustomEvent<{ message?: string }>;
    setSessionMessage(
      custom.detail?.message ||
      'Sua sessão expirou. Por favor, faça login novamente.'
    );
    setCurrentScreen('login');
  };

  const handleLogoutEvent = () => {
    setSessionMessage(null);
    setCurrentScreen('login');
  };

  window.addEventListener('greener:session_expired', handleExpired);
  window.addEventListener('greener:logout', handleLogoutEvent);

  return () => {
    window.removeEventListener('greener:session_expired', handleExpired);
    window.removeEventListener('greener:logout', handleLogoutEvent);
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
        initialData={registrationData}
        onNextStep={(dados) => {
          setRegistrationData(dados);
          setCurrentScreen('register-step2');
        }}
        onGoToLogin={() => setCurrentScreen('login')}
      />
    );
  }

  if (currentScreen === 'register-step2') {
    return (
      <RegisterStep2
        initialData={registrationPreferences}
        onNextStep={(prefs) => {
          if (prefs) setRegistrationPreferences(prefs);
          setCurrentScreen('register-step3');
        }}
        onPrevStep={() => setCurrentScreen('register')}
      />
    );
  }

  if (currentScreen === 'register-step3') {
    return (
      <RegisterStep3
        registrationData={registrationData}
        onPrevStep={() => setCurrentScreen('register-step2')}
        onGoToLogin={() => setCurrentScreen('login')}
        onFinish={() => {
          // Mantém opção para retorno ao login ou navegação direta
        }}
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
