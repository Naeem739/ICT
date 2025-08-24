'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { userService, UserRole } from '@/services/userService';

interface AuthContextType {
  currentUser: User | null;
  userRole: UserRole | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  refreshUserRole: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<UserRole, 'displayName' | 'profileImage'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to load user role from Firestore
  const loadUserRole = async (user: User) => {
    try {
      console.log('Loading user role for:', user.uid);
      
      let role = await userService.getUserRole(user.uid);
      
      // If user document doesn't exist, try to create it
      if (!role) {
        console.log('User document not found, attempting to create it...');
        try {
          role = await userService.ensureUserDocument(user.uid, user.email || '', user.displayName || '');
          console.log('User document created successfully');
        } catch (createError) {
          console.error('Failed to create user document:', createError);
          // Don't throw here, just set role to null
          role = null;
        }
      }
      
      setUserRole(role);
      
      // Update last login time if we have a valid role
      if (role) {
        try {
          await userService.updateLastLogin(user.uid);
          console.log('Last login time updated');
        } catch (loginError) {
          console.error('Failed to update last login time:', loginError);
        }
      }
    } catch (error) {
      console.error('Error loading user role:', error);
      setUserRole(null);
    }
  };

  // Function to refresh user role (useful after role updates)
  const refreshUserRole = async () => {
    if (currentUser) {
      await loadUserRole(currentUser);
    }
  };

  // Function to update user profile
  const updateProfile = async (updates: Partial<Pick<UserRole, 'displayName' | 'profileImage'>>) => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    try {
      // First update the database
      await userService.updateUserProfile(currentUser.uid, updates);
      
      // Then update local state only after successful database update
      if (userRole) {
        const updatedUserRole = {
          ...userRole,
          ...updates
        };
        setUserRole(updatedUserRole);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  async function signup(email: string, password: string, displayName?: string) {
    let userCredential: any = null;
    
    try {
      console.log('Starting signup process for:', email);
      
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('Firebase Auth user created:', user.uid);
      
      // Create user role in Firestore (first user becomes admin)
      console.log('Creating user role in Firestore...');
      await userService.createUserRole(user.uid, email, displayName);
      
      console.log('User role created successfully, loading user role...');
      
      // Load the user role immediately
      await loadUserRole(user);
      
      console.log('Signup process completed successfully');
    } catch (error) {
      console.error('Signup process failed:', error);
      
      // If user creation in Firestore failed, we should clean up the Firebase Auth user
      if (error instanceof Error && error.message.includes('Failed to create user') && userCredential?.user) {
        try {
          console.log('Cleaning up Firebase Auth user due to Firestore creation failure');
          await userCredential.user.delete();
        } catch (cleanupError) {
          console.error('Failed to cleanup Firebase Auth user:', cleanupError);
        }
      }
      
      throw error;
    }
  }

  function login(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Load user role when user signs in
        await loadUserRole(user);
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    isAdmin: userRole?.role === 'admin',
    login,
    signup,
    logout,
    loading,
    refreshUserRole,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
