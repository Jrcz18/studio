
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const Header = () => {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    setCurrentDate(now.toLocaleDateString('en-US', options));
  }, []);

  return (
    <header className="bg-yellow-400 shadow-md z-10" id="app-header">
      {/* Main Header Section */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-yellow-600 text-sm font-bold professional-title">MP</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-black professional-title truncate">Manila Prime</h1>
              <p className="text-xs text-black professional-subtitle">Management App</p>
            </div>
          </div>
          
          {/* Notification and Settings */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Link href="/dashboard/notifications" className="w-9 h-9 bg-white rounded-full flex items-center justify-center relative border border-gray-300 hover:border-yellow-600 transition-colors">
                <span className="text-gray-600 text-lg">🔔</span>
            </Link>

            <Link href="/dashboard/settings" className="w-9 h-9 bg-white rounded-full flex items-center justify-center border border-gray-300 hover:border-yellow-600 transition-colors">
              <span className="text-gray-600 text-lg">⚙️</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Date Display */}
      <div className="px-4 py-2 bg-yellow-300 border-t border-yellow-500">
        <div className="text-center">
          <p id="currentDate" className="text-xs font-medium text-black professional-subtitle">
            {currentDate}
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
