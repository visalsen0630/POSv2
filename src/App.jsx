import React, { useState } from 'react';
import Login from './components/Login';
import CompanyLocationSelector from './components/CompanyLocationSelector';
import POSSaleScreen from './components/POSSaleScreen';

function App() {
  const [currentStep, setCurrentStep] = useState('login'); // 'login', 'select', 'pos'
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentStep('select');
  };

  const handleSelectionComplete = (selectionData) => {
    setSession({
      user,
      company: selectionData.company,
      location: selectionData.location,
    });
    setCurrentStep('pos');
  };

  const handleLogout = () => {
    setUser(null);
    setSession(null);
    setCurrentStep('login');
  };

  // Render based on current step
  if (currentStep === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentStep === 'select') {
    return <CompanyLocationSelector user={user} onSelectionComplete={handleSelectionComplete} />;
  }

  // Main POS Screen
  return <POSSaleScreen session={session} onLogout={handleLogout} />;
}

export default App;
