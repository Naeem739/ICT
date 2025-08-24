'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import MobileMenu from '@/components/MobileMenu';
import ProfileImage from '@/components/ProfileImage';
import { userService } from '@/services/userService';
import { Camera, Edit3, Save, X, User, Mail, Calendar, Shield } from 'lucide-react';

export default function ProfilePage() {
  const { currentUser, logout, userRole, isAdmin, updateProfile } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(userRole?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userRole?.displayName) {
      setDisplayName(userRole.displayName);
    }
    // Load profile image from user data
    if (userRole?.profileImage) {
      setProfileImage(userRole.profileImage);
    }
  }, [userRole]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size must be less than 5MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPEG, PNG, or GIF)');
        return;
      }

      setImageUploading(true);
      setError('');

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = e.target?.result as string;
          console.log('Image loaded, size:', result.length, 'characters');
          
          setProfileImage(result);
          
          // Save to database
          console.log('Saving profile image to database...');
          await updateProfile({ profileImage: result });
          console.log('Profile image saved successfully');
          
          setImageUploading(false);
        } catch (error) {
          console.error('Image upload error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to save profile image';
          setError(errorMessage);
          setImageUploading(false);
        }
      };
      
      reader.onerror = () => {
        setError('Failed to read image file');
        setImageUploading(false);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const removeProfileImage = async () => {
    try {
      console.log('Removing profile image...');
      setProfileImage(null);
      await updateProfile({ profileImage: null });
      console.log('Profile image removed successfully');
    } catch (error) {
      console.error('Remove profile image error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove profile image';
      setError(errorMessage);
      // Revert the UI state if the operation failed
      if (userRole?.profileImage) {
        setProfileImage(userRole.profileImage);
      }
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('Saving profile with display name:', displayName);
      console.log('Current user:', currentUser?.uid);
      console.log('Current userRole:', userRole);
      
      // Save profile updates to database
      await updateProfile({ displayName });
      
      console.log('Profile saved successfully');
      setIsEditing(false);
      setLoading(false);
    } catch (error) {
      console.error('Profile save error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setDisplayName(userRole?.displayName || '');
    setIsEditing(false);
    setError('');
  };

  const openImageUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-lg border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-2 sm:space-x-8">
                <h1 className="text-xl sm:text-2xl font-heading font-bold text-gray-900 tracking-tight">ICT Dashboard</h1>
                <div className="hidden sm:flex space-x-6">
                  <Link 
                    href="/home" 
                    className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50"
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
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-indigo-700 transition-all duration-200"
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
                  currentPath="/profile" 
                  userEmail={currentUser?.email} 
                  onLogout={handleLogout} 
                />
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8 text-white">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                {/* Profile Image */}
                <div className="relative group">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-white/20 border-4 border-white/30 shadow-lg">
                    <ProfileImage 
                      src={profileImage} 
                      alt="Profile" 
                      size="xl"
                      className="w-full h-full"
                    />
                  </div>
                  
                  {/* Image Upload Overlay */}
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <button
                      onClick={openImageUpload}
                      className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                      title="Change Photo"
                    >
                      <Camera className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  {/* Remove Image Button */}
                  {profileImage && (
                    <button
                      onClick={removeProfileImage}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                      title="Remove Photo"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>

                {/* Profile Info */}
                <div className="text-center sm:text-left flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                    {displayName || 'No Name Set'}
                  </h1>
                  <p className="text-indigo-100 text-lg mb-2">{currentUser?.email}</p>
                  <div className="flex items-center justify-center sm:justify-start space-x-4 text-indigo-100">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {userRole?.role === 'admin' ? 'Administrator' : 'User'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        Joined {userRole?.createdAt?.toLocaleDateString() || 'Recently'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit Button */}
                <div className="flex space-x-2">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={loading}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>{loading ? 'Saving...' : 'Save'}</span>
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="p-6 sm:p-8">
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Error: {error}</span>
                    <button
                      onClick={() => setError('')}
                      className="text-red-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Personal Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Personal Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          placeholder="Enter your display name"
                        />
                      ) : (
                        <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                          {displayName || 'No name set'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account Settings */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Account Settings
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Profile Photo
                      </label>
                      <div className="space-y-3">
                        <button
                          onClick={openImageUpload}
                          disabled={imageUploading}
                          className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                          <Camera className="w-4 h-4" />
                          <span>{imageUploading ? 'Uploading...' : 'Upload Photo'}</span>
                        </button>
                        <p className="text-xs text-gray-500 text-center">
                          Supported formats: JPEG, PNG, GIF (max 5MB)
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Status
                      </label>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-700 font-medium">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
