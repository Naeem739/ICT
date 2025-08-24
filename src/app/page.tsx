'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Login from '@/components/Login';
import Signup from '@/components/Signup';

export default function Home() {
  const [showLogin, setShowLogin] = useState(true);
  const { currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (currentUser) {
      router.push('/home');
    }
  }, [currentUser, router]);

  useEffect(() => {
    // Check URL parameters for tab selection
    const tab = searchParams.get('tab');
    if (tab === 'signup') {
      setShowLogin(false);
    } else if (tab === 'login') {
      setShowLogin(true);
    }
  }, [searchParams]);

  const handleTabChange = (isLogin: boolean) => {
    setShowLogin(isLogin);
    // Update URL without page reload
    const newUrl = isLogin ? '/?tab=login' : '/?tab=signup';
    window.history.pushState({}, '', newUrl);
  };

  if (currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20">
          <div className="flex mb-8">
            <button
              onClick={() => handleTabChange(true)}
              className={`flex-1 py-4 px-6 text-center font-semibold rounded-l-xl transition-all duration-200 ${
                showLogin
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => handleTabChange(false)}
              className={`flex-1 py-4 px-6 text-center font-semibold rounded-r-xl transition-all duration-200 ${
                !showLogin
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Sign Up
            </button>
          </div>
          
          {showLogin ? <Login /> : <Signup />}
        </div>
      </div>
    </div>
  );
}
