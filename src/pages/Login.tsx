import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Mail,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

// Social icons
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg viewBox="0 0 21 21" className="w-5 h-5">
    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
    <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

type AuthMethod = 'email' | 'phone' | null;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  const handleSocialAuth = async (provider: string) => {
    setSocialLoading(provider);
    try {
      // Redirect to OAuth provider endpoint
      window.location.href = `/api/auth/oauth/${provider}`;
    } catch (err) {
      toast.error(`Failed to connect with ${provider}`);
      setSocialLoading(null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Register
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Registration failed');
        
        toast.success('Account created! Please sign in.');
        setIsSignUp(false);
        setPassword('');
      } else {
        // Login
        await login(email, password);
        toast.success('Welcome back!');
        setLocation('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!codeSent) {
        // Send verification code
        const response = await fetch('/api/auth/phone/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to send code');
        }
        setCodeSent(true);
        toast.success('Verification code sent!');
      } else {
        // Verify code and login
        const response = await fetch('/api/auth/phone/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, code: verificationCode, name: isSignUp ? name : undefined }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Verification failed');
        
        localStorage.setItem('token', data.token);
        toast.success('Welcome!');
        setLocation('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'Phone authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAuthMethod(null);
    setEmail('');
    setPhone('');
    setPassword('');
    setName('');
    setVerificationCode('');
    setCodeSent(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        {/* Logo and branding */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-4 mb-8">
            <img 
              src="/adele-logo.png" 
              alt="ADELE" 
              className="w-16 h-16 rounded-2xl shadow-2xl"
            />
            <span className="text-3xl font-bold text-white">ADELE</span>
          </Link>
          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            Build complete apps with
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200">
              natural language
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-md">
            Describe your application in plain English or use voice commands. 
            ADELE's multi-agent AI system generates production-ready code.
          </p>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 text-white/90">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span>7 specialized AI agents working together</span>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <span>Voice-controlled hands-free coding</span>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <span>One-click deployment to cloud</span>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-white/60 text-sm">
          © 2024 ADELE. All rights reserved.
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <Link href="/">
              <img 
                src="/adele-logo.png" 
                alt="ADELE" 
                className="w-12 h-12 rounded-xl"
              />
            </Link>
            <span className="text-2xl font-bold text-gray-900">ADELE</span>
          </div>

          {/* Auth header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-gray-600">
              {isSignUp 
                ? 'Start building amazing apps today' 
                : 'Sign in to continue to ADELE'}
            </p>
          </div>

          {/* Main auth options */}
          {!authMethod && (
            <div className="space-y-3">
              {/* Social auth buttons */}
              <button
                onClick={() => handleSocialAuth('google')}
                disabled={!!socialLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium text-gray-700 shadow-sm disabled:opacity-50"
              >
                {socialLoading === 'google' ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </button>

              <button
                onClick={() => handleSocialAuth('apple')}
                disabled={!!socialLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900 transition-all duration-200 font-medium shadow-sm disabled:opacity-50"
              >
                {socialLoading === 'apple' ? <Loader2 className="w-5 h-5 animate-spin" /> : <AppleIcon />}
                Continue with Apple
              </button>

              <button
                onClick={() => handleSocialAuth('microsoft')}
                disabled={!!socialLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium text-gray-700 shadow-sm disabled:opacity-50"
              >
                {socialLoading === 'microsoft' ? <Loader2 className="w-5 h-5 animate-spin" /> : <MicrosoftIcon />}
                Continue with Microsoft
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSocialAuth('facebook')}
                  disabled={!!socialLoading}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 bg-[#1877F2] text-white rounded-xl hover:bg-[#166FE5] transition-all duration-200 font-medium shadow-sm disabled:opacity-50"
                >
                  {socialLoading === 'facebook' ? <Loader2 className="w-5 h-5 animate-spin" /> : <FacebookIcon />}
                  Facebook
                </button>

                <button
                  onClick={() => handleSocialAuth('github')}
                  disabled={!!socialLoading}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 bg-[#24292F] text-white rounded-xl hover:bg-[#1B1F23] transition-all duration-200 font-medium shadow-sm disabled:opacity-50"
                >
                  {socialLoading === 'github' ? <Loader2 className="w-5 h-5 animate-spin" /> : <GithubIcon />}
                  GitHub
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-50 text-gray-500">or continue with</span>
                </div>
              </div>

              {/* Phone and Email options */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAuthMethod('phone')}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium text-gray-700 shadow-sm"
                >
                  <Phone className="w-5 h-5 text-green-600" />
                  Phone
                </button>

                <button
                  onClick={() => setAuthMethod('email')}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium text-gray-700 shadow-sm"
                >
                  <Mail className="w-5 h-5 text-indigo-600" />
                  Email
                </button>
              </div>
            </div>
          )}

          {/* Email auth form */}
          {authMethod === 'email' && (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to all options
              </button>

              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required={isSignUp}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 pr-12 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {!isSignUp && (
                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                    Forgot password?
                  </Link>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg shadow-indigo-500/25 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Phone auth form */}
          {authMethod === 'phone' && (
            <form onSubmit={handlePhoneAuth} className="space-y-4">
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to all options
              </button>

              {isSignUp && !codeSent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required={isSignUp}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  required
                  disabled={codeSent}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 bg-white"
                />
              </div>

              {codeSent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    required
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest bg-white"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    We sent a code to {phone}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg shadow-indigo-500/25 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {codeSent ? 'Verify Code' : 'Send Code'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {codeSent && (
                <button
                  type="button"
                  onClick={() => setCodeSent(false)}
                  className="w-full text-center text-sm text-gray-600 hover:text-gray-900"
                >
                  Didn't receive code? Try again
                </button>
              )}
            </form>
          )}

          {/* Toggle sign up / sign in */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                }}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>

          {/* Terms */}
          <p className="mt-6 text-center text-xs text-gray-500">
            By continuing, you agree to ADELE's{' '}
            <Link href="/terms" className="text-indigo-600 hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
