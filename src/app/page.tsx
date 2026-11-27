'use client';

import LandingPage from '../components/LandingPage';
import { StoreSettingsProvider } from '../contexts/StoreSettingsContext';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootHomePage() {
  return (
    <AuthProvider>
      <StoreSettingsProvider>
        <LandingPage />
      </StoreSettingsProvider>
    </AuthProvider>
  );
}
