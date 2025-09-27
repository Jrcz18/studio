
'use client';

import dynamic from 'next/dynamic';

const AuthGate = dynamic(() => import('@/components/auth-gate').then(mod => mod.AuthGate), {
  ssr: false,
  loading: () => <div className="text-center p-4"><p>Loading...</p></div>,
});


export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col justify-center items-center">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black mb-3">
            Manila Prime Agents
          </h1>
          <p className="text-gray-600 text-sm">
            Agent Booking Portal
          </p>
        </div>
        <AuthGate />
    </main>
  );
}
