
'use client';

import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, browserSessionPersistence, browserLocalPersistence } from 'firebase/auth';
import { useState } from 'react';
import Link from 'next/link';

export function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
            await auth.setPersistence(persistence);
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/dashboard');
        } catch (error: any) {
            setError(error.message);
            alert('Failed to log in. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <form id="loginForm" className="space-y-4" onSubmit={handleLogin}>
              <div>
                  <input type="email" id="loginEmail" name="loginEmail" className="prime-input" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" disabled={isLoading}/>
              </div>
              
              <div>
                  <input type="password" id="loginPassword" name="loginPassword" className="prime-input" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" disabled={isLoading}/>
              </div>

              <div className="flex items-center justify-between text-sm">
                 <div className="flex items-center gap-2">
                    <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500" disabled={isLoading}/>
                    <label htmlFor="rememberMe" className="text-gray-700">Remember me</label>
                 </div>
                <Link href="/reset-password" id="forgotPasswordLink" className={`font-medium text-yellow-600 hover:text-yellow-500 ${isLoading ? 'pointer-events-none opacity-50' : ''}`}>
                    Forgot your password?
                </Link>
              </div>
              
              <button type="submit" className="prime-button w-full py-3" disabled={isLoading}>
                  {isLoading ? 'Logging In...' : 'Log In'}
              </button>
          </form>
          
          <div className="mt-6 text-center">
                <p className="text-sm">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" id="signUpLink" className={`font-medium text-yellow-600 hover:text-yellow-500 ${isLoading ? 'pointer-events-none opacity-50' : ''}`}>
                        Sign Up
                    </Link>
                </p>
          </div>
        </>
    );
}
