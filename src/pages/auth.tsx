/**
 * Authentication Pages (Clerk)
 * ============================================================
 * Login and Signup using Clerk components with error handling.
 */

import { SignIn, SignUp, useClerk } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { Zap, AlertCircle } from 'lucide-react';

function ClerkErrorFallback() {
  return (
    <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#FF3355]/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-[#FF3355]" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Authentication Error</h1>
        <p className="text-[#A0A0B8] mb-4">
          Failed to load authentication. Please check your connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-[#0055FF] hover:bg-[#0044DD] text-white font-semibold"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export function LoginPage() {
  const [clerkLoaded, setClerkLoaded] = useState(false);
  const [clerkError, setClerkError] = useState(false);

  useEffect(() => {
    // Check if Clerk is available
    const checkClerk = () => {
      try {
        if (window.Clerk) {
          setClerkLoaded(true);
        } else {
          // Clerk script might still be loading
          setTimeout(checkClerk, 100);
        }
      } catch {
        setClerkError(true);
      }
    };
    checkClerk();
  }, []);

  if (clerkError) {
    return <ClerkErrorFallback />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0055FF] to-[#0088FF] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#0055FF]/20">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-[#A0A0B8] mt-2">Sign in to your Policy-0 account</p>
        </div>
        {!clerkLoaded ? (
          <div className="text-center text-[#A0A0B8]">Loading authentication...</div>
        ) : (
          <SignIn
            appearance={{
              elements: {
                formButtonPrimary: 'bg-[#0055FF] hover:bg-[#0044DD] text-white',
                formFieldInput: 'bg-[#0A0A1A] border-[#2A2A4A] text-white',
                footerActionLink: 'text-[#0055FF]',
              },
            }}
            routing="path"
            path="/login"
            signUpUrl="/signup"
          />
        )}
      </div>
    </div>
  );
}

export function SignupPage() {
  const [clerkLoaded, setClerkLoaded] = useState(false);
  const [clerkError, setClerkError] = useState(false);

  useEffect(() => {
    const checkClerk = () => {
      try {
        if (window.Clerk) {
          setClerkLoaded(true);
        } else {
          setTimeout(checkClerk, 100);
        }
      } catch {
        setClerkError(true);
      }
    };
    checkClerk();
  }, []);

  if (clerkError) {
    return <ClerkErrorFallback />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0055FF] to-[#0088FF] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#0055FF]/20">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-[#A0A0B8] mt-2">Join 500+ robotics engineers building embodied AI</p>
        </div>
        {!clerkLoaded ? (
          <div className="text-center text-[#A0A0B8]">Loading authentication...</div>
        ) : (
          <SignUp
            appearance={{
              elements: {
                formButtonPrimary: 'bg-[#0055FF] hover:bg-[#0044DD] text-white',
                formFieldInput: 'bg-[#0A0A1A] border-[#2A2A4A] text-white',
                footerActionLink: 'text-[#0055FF]',
              },
            }}
            routing="path"
            path="/signup"
            signInUrl="/login"
          />
        )}
      </div>
    </div>
  );
}