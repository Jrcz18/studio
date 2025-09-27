
'use client';

import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';

export function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
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
        <form className="space-y-4 w-full max-w-sm" onSubmit={handleLogin}>
            <div>
                <input type="email" className="w-full p-2 border rounded" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading}/>
            </div>
            <div>
                <input type="password" className="w-full p-2 border rounded" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading}/>
            </div>
            <button type="submit" className="prime-button w-full py-3" disabled={isLoading}>
                {isLoading ? 'Logging In...' : 'Log In'}
            </button>
        </form>
    );
}
