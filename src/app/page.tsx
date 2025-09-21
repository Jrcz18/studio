
import { LoginForm } from '@/components/auth/login-form';

export default function Home() {

  return (
    <main className="min-h-screen bg-white flex flex-col mx-auto">
      <div className="flex-1 flex flex-col justify-center p-6 max-w-sm w-full self-center">
          <div className="text-center mb-8">
              <div className="w-24 h-24 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg hover-lift">
                  <span className="text-white text-3xl font-bold professional-title">MP</span>
              </div>
              <h1 className="text-4xl font-bold text-black mb-3 professional-title">Manila Prime</h1>
              <p className="text-black text-xl professional-subtitle mb-2">Management App</p>
              <p className="text-gray-600 text-sm professional-subtitle">Professional Property Management System</p>
          </div>
          
          <LoginForm />
          
      </div>
    </main>
  );
}
