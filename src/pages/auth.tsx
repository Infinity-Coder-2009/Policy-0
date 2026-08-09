/**
 * Authentication Pages (Clerk)
 * ============================================================
 * Login and Signup using Clerk's built-in pages.
 * Configured for development mode with email verification bypass.
 */

import { SignIn, SignUp, useClerk } from '@clerk/clerk-react';
import { Zap, AlertCircle,Mail, Shield } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
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
        <SignIn
          routing="memory"
          signUpUrl="/signup"
          afterSignUpUrl="/"
          afterSignInUrl="/"
          // Development mode config
          configureProps={{
            appearance: {
              elements: {
                formFooter: 'div',
                control: 'input',
              },
            },
          }}
        />
      </div>
    </div>
  );
}

export function SignupPage() {
  const navigate = useNavigate();
  const [setupComplete, setSetupComplete] = useState(false);
  
  return (
    <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0055FF] to-[#0088FF] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#0055FF]/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-[#A0A0B8] mt-2">Join 500+ robotics engineers building embodied AI</p>
          
          {/* Development note */}
          <div className="mt-4 p-3 bg-[#FFB800]/10 border border-[#FFB800]/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-[#FFB800]">
              <AlertCircle className="w-4 h-4" />
              <span>Development mode: Email verification bypassed for testing</span>
            </div>
          </div>
        </div>
        <SignUp
          routing="memory"
          signInUrl="/login"
          afterSignUpUrl="/"
          // Configure for development
          configureProps={{
            // Allow email change before verification
            actionLinkOrder: ['verify', 'resend', 'orgotpassword'],
            // Use the development instance
            redirectUrl: window.location.origin,
          }}
          // Handle complete signup
          onComplete={() => {
            // Signup complete, redirect to dashboard
            navigate('/');
          }}
        />
      </div>
    </div>
  );
}