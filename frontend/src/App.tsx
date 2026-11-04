import { useState } from 'react';

// Importação das páginas de utilizador
import { Login } from './pages/LoginPage';
import { Register } from './pages/Register';
import { RegisterStep2 } from './pages/RegisterStep2';
import { RegisterStep3 } from './pages/RegisterStep3';

// Importação das páginas administrativas
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';

// Importação do mapa/dashboard público
import { MapBackground } from './components/MapBackground';

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

  // ==========================================
  // FLUXO PÚBLICO (LOGIN E REGISTO)
  // ==========================================
  if (currentScreen === 'login') {
    return (
      <Login
        onLoginSuccess={() => setCurrentScreen('map')}
        onGoToRegister={() => setCurrentScreen('register')}
        onAdminAccess={() => setCurrentScreen('admin-login')}
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
        onLoginSuccess={() => setCurrentScreen('admin-dashboard')}
      />
    );
  }

  if (currentScreen === 'admin-dashboard') {
    return (
      <AdminDashboard
        onLogout={() => setCurrentScreen('login')}
        onViewPublicDashboard={() => setCurrentScreen('map')}
      />
    );
  }

  // ==========================================
  // DASHBOARD DO UTILIZADOR (MAPA)
  // ==========================================
  // Se não for nenhum dos ecrãs acima, renderiza o Mapa (tela final do utilizador)
  return <MapBackground onLogout={() => setCurrentScreen('login')} />;
}

export default App;