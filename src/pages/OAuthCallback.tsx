import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';

export default function OAuthCallback() {
  const [, setLocation] = useLocation();
  const { setUserFromOAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const errorParam = params.get('error');

    if (errorParam) {
      setError(getErrorMessage(errorParam));
      setTimeout(() => setLocation('/login'), 3000);
      return;
    }

    if (token) {
      // Store the token
      localStorage.setItem('token', token);
      
      // Fetch user data and update auth context
      fetchUserAndRedirect(token);
    } else {
      setError('No authentication token received');
      setTimeout(() => setLocation('/login'), 3000);
    }
  }, []);

  const fetchUserAndRedirect = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Update auth context
        setUserFromOAuth(data.user, token);
        // Redirect to dashboard
        setLocation('/dashboard');
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (err) {
      console.error('OAuth callback error:', err);
      setError('Authentication failed. Please try again.');
      localStorage.removeItem('token');
      setTimeout(() => setLocation('/login'), 3000);
    }
  };

  const getErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
      'no_code': 'Authentication was cancelled or failed.',
      'token_error': 'Failed to complete authentication. Please try again.',
      'no_email': 'Could not retrieve your email address. Please ensure your account has a verified email.',
      'oauth_failed': 'Authentication failed. Please try again.',
      'access_denied': 'Access was denied. Please try again.',
    };
    return errorMessages[errorCode] || 'An unexpected error occurred.';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center">
        {error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-md">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold text-white mb-2">Authentication Error</h2>
            <p className="text-gray-300">{error}</p>
            <p className="text-gray-400 text-sm mt-4">Redirecting to login...</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-white mb-2">Completing Sign In</h2>
            <p className="text-gray-400">Please wait while we authenticate you...</p>
          </div>
        )}
      </div>
    </div>
  );
}
