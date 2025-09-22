'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { LoginForm } from './login-form';

export function AuthGate() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="text-center p-4">
        <p>Loading...</p>
      </div>
    );
  }

  if (user) {
    // We are about to redirect, render a loading state
     return (
      <div className="text-center p-4">
        <p>Redirecting to dashboard...</p>
      </div>
    );
  }

  // If no user and not loading, show the login form
  return <LoginForm />;
}
