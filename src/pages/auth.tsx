/**
 * Authentication Pages (Clerk)
 * ============================================================
 * Login and Signup using Clerk components.
 */

import { SignIn, SignUp } from '@clerk/clerk-react';
import { Zap } from 'lucide-react';

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
      </div>
    </div>
  );
}

export function SignupPage() {
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
      </div>
    </div>
  );
}