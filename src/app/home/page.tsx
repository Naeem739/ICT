'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import MobileMenu from '@/components/MobileMenu';

export default function HomePage() {
  const { currentUser, logout, isAdmin } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        <nav className="bg-white shadow-lg border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-2 sm:space-x-8">
                <h1 className="text-xl sm:text-2xl font-heading font-bold text-gray-900 tracking-tight">ICT Dashboard</h1>
                <div className="hidden sm:flex space-x-6">
                  <Link 
                    href="/home" 
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-indigo-700 transition-all duration-200"
                  >
                    Home
                  </Link>
                  <Link 
                    href="/dashboard" 
                    className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50"
                  >
                    Dashboard
                  </Link>
                  {isAdmin && (
                    <Link 
                      href="/admin" 
                      className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <Link 
                    href="/profile" 
                    className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50"
                  >
                    Profile
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="hidden sm:block text-gray-700 text-sm font-medium">
                  Welcome, {currentUser?.email}
                  {isAdmin && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Admin
                    </span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="hidden sm:block bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all duration-200"
                >
                  <span className="hidden sm:inline">Logout</span>
                  <span className="sm:hidden">Out</span>
                </button>
                <MobileMenu 
                  currentPath="/home" 
                  userEmail={currentUser?.email} 
                  onLogout={handleLogout} 
                />
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-8 sm:py-12 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:py-8 sm:px-0">
            <div className="mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight">Welcome to ICT Dashboard</h2>
              <p className="text-gray-600 text-lg sm:text-xl leading-relaxed max-w-3xl">Access your learning resources and manage your account.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
              <div className="bg-white overflow-hidden shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="p-6 sm:p-8">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4 sm:ml-6">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">Dashboard</h3>
                      <p className="text-sm sm:text-base text-gray-500 leading-relaxed mt-1">View your learning progress and recent activity.</p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Link 
                      href="/dashboard"
                      className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Go to Dashboard
                      <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="bg-white overflow-hidden shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 border border-gray-100">
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4 sm:ml-6">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">Admin Panel</h3>
                        <p className="text-sm sm:text-base text-gray-500 leading-relaxed mt-1">Manage users, content, and system settings.</p>
                      </div>
                    </div>
                    <div className="mt-6">
                      <Link 
                        href="/admin"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        Go to Admin Panel
                        <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white overflow-hidden shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="p-6 sm:p-8">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4 sm:ml-6">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">Profile</h3>
                      <p className="text-sm sm:text-base text-gray-500 leading-relaxed mt-1">Manage your account information and preferences.</p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Link 
                      href="/profile"
                      className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Manage Profile
                      <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8">
              <h3 className="text-xl lg:text-2xl font-heading font-bold text-gray-900 mb-6 leading-tight">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center p-6 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-all duration-200">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-4 shadow-sm">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 leading-tight">Browse Content</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">Explore tutorials, practice exercises, and exams</p>
                  </div>
                </div>
                <div className="flex items-center p-6 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-all duration-200">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-4 shadow-sm">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 leading-tight">Practice</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">Complete practice exercises to test your knowledge</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
