'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface MobileMenuProps {
  currentPath: string;
  userEmail?: string;
  onLogout: () => void;
}

export default function MobileMenu({ currentPath, userEmail, onLogout }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isAdmin } = useAuth();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const menuItems = [
    { href: '/home', label: 'Home', active: currentPath === '/home' },
    { href: '/dashboard', label: 'Dashboard', active: currentPath === '/dashboard' },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin Panel', active: currentPath === '/admin' }] : []),
    { href: '/profile', label: 'Profile', active: currentPath === '/profile' },
  ];

  return (
    <div className="sm:hidden">
      {/* Mobile menu button */}
      <button
        onClick={toggleMenu}
        className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
        aria-expanded="false"
      >
        <span className="sr-only">Open main menu</span>
        {isOpen ? (
          <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile menu */}
      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white shadow-lg border-b border-gray-200 z-50">
          <div className="px-2 pt-2 pb-3 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200 ${
                  item.active
                    ? 'bg-white text-indigo-700 border-2 border-indigo-200 shadow-sm'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-gray-200 pt-2">
            <div className="px-3 py-2 text-sm text-gray-500">
              Welcome, {userEmail}
              {isAdmin && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Admin
                </span>
              )}
            </div>
            <button
              onClick={() => {
                closeMenu();
                onLogout();
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
