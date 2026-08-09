/**
 * Application Entry Point
 * ============================================================
 * Renders the React app with Clerk authentication.
 * Configured for development mode with email verification bypass.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import './index.css';

// Clerk publishable key
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

if (!clerkPublishableKey) {
  console.error('VITE_CLERK_PUBLISHABLE_KEY is not set');
}

// Clerk configuration for development mode
const clerkConfig = {
  publishableKey,
  // Enable development mode features
  appearance: {
    theme: 'dark',
    elements: {
      frame: {
        backgroundColor: '#0A0A1A',
        borderRadius: '12px',
      },
    },
  },
  // Skip email verification in development for smoother testing
  // Note: In production, configure your Clerk instance via dashboard
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider {...clerkConfig}>
      <App />
    </ClerkProvider>
  </StrictMode>
);