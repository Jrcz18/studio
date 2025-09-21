
'use client';

import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, browserSessionPersistence, browserLocalPersistence } from 'firebase/auth';
import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
            await auth.setPersistence(persistence);
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/dashboard');
        } catch (error: any) {
            setError(error.message);
            alert('Failed to log in. Please check your credentials.');
        }
    };

  return (
    <main className="min-h-screen bg-white flex flex-col mx-auto">
      {/* Header */}
      <div className="flex-1 flex flex-col justify-center p-6 max-w-sm w-full self-center">
          <div className="text-center mb-8">
              <div className="w-24 h-24 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg hover-lift">
                  <span className="text-white text-3xl font-bold professional-title">MP</span>
              </div>
              <h1 className="text-4xl font-bold text-black mb-3 professional-title">Manila Prime</h1>
              <p className="text-black text-xl professional-subtitle mb-2">Management App</p>
              <p className="text-gray-600 text-sm professional-subtitle">Professional Property Management System</p>
          </div>
          
          <form id="loginForm" className="space-y-4" onSubmit={handleLogin}>
              <div>
                  <input type="email" id="loginEmail" name="loginEmail" className="prime-input" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              
              <div>
                  <input type="password" id="loginPassword" name="loginPassword" className="prime-input" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
              </div>

              <div className="flex items-center justify-between text-sm">
                 <div className="flex items-center gap-2">
                    <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500" />
                    <label htmlFor="rememberMe" className="text-gray-700">Remember me</label>
                 </div>
                <Link href="/reset-password" id="forgotPasswordLink" className="font-medium text-yellow-600 hover:text-yellow-500">
                    Forgot your password?
                </Link>
              </div>
              
              <button type="submit" className="prime-button w-full py-3">
                  Log In
              </button>
          </form>
          
          <div className="mt-6 text-center">
                <p className="text-sm">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" id="signUpLink" className="font-medium text-yellow-600 hover:text-yellow-500">
                        Sign Up
                    </Link>
                </p>
          </div>
      </div>
    </main>
  );
}
