'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AdminRoute from '@/components/AdminRoute';
import Link from 'next/link';
import { 
  Chapter, 
  PracticeSection,
  getChapters, 
  addTutorialToChapter, 
  addPracticeSectionToChapter, 
  addExamSectionToChapter, 
  updateTutorialInChapter, 
  deleteTutorialFromChapter, 
  updatePracticeSectionInChapter, 
  deletePracticeSectionFromChapter, 
  createChapter,
  updateChapter,
  deleteChapter
} from '@/services/chapterService';
import { userService, UserRole } from '@/services/userService';
import AddTutorialModal from '@/components/AddTutorialModal';
import AddPracticeModal from '@/components/AddPracticeModal';
import AddExamModal from '@/components/AddExamModal';
import EditTutorialModal from '@/components/EditTutorialModal';
import EditPracticeModal from '@/components/EditPracticeModal';
import MobileMenu from '@/components/MobileMenu';

export default function AdminPage() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [activeTab, setActiveTab] = useState<'tutorials' | 'practice' | 'exams' | 'users'>('tutorials');
  const [loading, setLoading] = useState(true);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showEditTutorialModal, setShowEditTutorialModal] = useState(false);
  const [showEditPracticeModal, setShowEditPracticeModal] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<{
    id: string;
    title: string;
    description: string;
    links?: string[];
  } | null>(null);
  const [selectedPractice, setSelectedPractice] = useState<{
    id: string;
    title?: string;
    description?: string;
    imageUrl?: string;
    answerImageUrl?: string;
  } | null>(null);
  const [showCreateChapterModal, setShowCreateChapterModal] = useState(false);
  const [showEditChapterModal, setShowEditChapterModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [users, setUsers] = useState<UserRole[]>([]);

  useEffect(() => {
    loadChapters();
    loadUsers();
  }, []);

  // Handle window resize to close mobile sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadChapters = async () => {
    try {
      const chaptersData = await getChapters();
      setChapters(chaptersData);
      if (chaptersData.length > 0) {
        setSelectedChapter(chaptersData[0]);
      }
    } catch (error) {
      console.error('Error loading chapters:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await userService.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleRoleUpdate = async (uid: string, newRole: 'admin' | 'user') => {
    try {
      await userService.updateUserRole(uid, newRole);
      await loadUsers(); // Reload users to get updated data
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleChapterSelect = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setActiveTab('tutorials');
    // Close sidebar on mobile after chapter selection
    setIsSidebarOpen(false);
  };

  const handleAddTutorial = async (tutorialData: {
    title: string;
    videoUrl: string;
    links: string[];
    description: string;
  }) => {
    if (!selectedChapter) return;
    
    try {
      await addTutorialToChapter(selectedChapter.id!, tutorialData);
      await loadChapters(); // Reload to get updated data
      setShowTutorialModal(false);
    } catch (error) {
      console.error('Error adding tutorial:', error);
    }
  };

  const handleAddPractice = async (practiceData: {
    title?: string;
    description?: string;
    imageFile: File | null;
    answer: string;
    answerType: 'text' | 'code' | 'image' | 'mixed';
    answerImageFile: File | null;
  }) => {
    if (!selectedChapter) return;
    try {
      // Convert practice image to base64 string for storage in Firebase
      let imageUrl = '';
      if (practiceData.imageFile) {
        const reader = new FileReader();
        imageUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(practiceData.imageFile!);
        });
      }

      // Convert answer image to base64 string for storage in Firebase
      let answerImageUrl = '';
      if (practiceData.answerImageFile) {
        const reader = new FileReader();
        answerImageUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(practiceData.answerImageFile!);
        });
      }
      
      // Filter out undefined values to avoid Firebase errors
      const practiceDataToSave: {
        imageUrl: string;
        questions: string[];
        answers: string[];
        answerType: 'text' | 'code' | 'image' | 'mixed';
        answerImageUrl: string;
        title?: string;
        description?: string;
      } = {
        imageUrl: imageUrl,
        questions: [''], // Keep empty for compatibility
        answers: [practiceData.answer], // Store the single answer
        answerType: practiceData.answerType,
        answerImageUrl: answerImageUrl,
      };

      // Only add defined values
      if (practiceData.title !== undefined) practiceDataToSave.title = practiceData.title;
      if (practiceData.description !== undefined) practiceDataToSave.description = practiceData.description;

      await addPracticeSectionToChapter(selectedChapter.id!, practiceDataToSave);
      await loadChapters();
      setShowPracticeModal(false);
    } catch (error) {
      console.error('Error adding practice section:', error);
    }
  };

  const handleEditTutorial = async (tutorialData: {
    title: string;
    description: string;
    links: string[];
  }) => {
    if (!selectedChapter || !selectedTutorial) return;
    try {
      await updateTutorialInChapter(selectedChapter.id!, selectedTutorial.id, tutorialData);
      await loadChapters();
      setShowEditTutorialModal(false);
      setSelectedTutorial(null);
    } catch (error) {
      console.error('Error updating tutorial:', error);
      alert('Error updating tutorial. Please try again.');
    }
  };

  const handleEditPractice = async (practiceData: {
    title?: string;
    description?: string;
    imageFile: File | null;
    answer: string;
    answerType: 'text' | 'code' | 'image' | 'mixed';
    answerImageFile: File | null;
  }) => {
    if (!selectedChapter || !selectedPractice) return;
    try {
      let imageUrl = selectedPractice.imageUrl; // Keep existing image by default
      if (practiceData.imageFile) {
        // Convert new file to base64
        const reader = new FileReader();
        imageUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(practiceData.imageFile!);
        });
      }

      let answerImageUrl = selectedPractice.answerImageUrl; // Keep existing answer image by default
      if (practiceData.answerImageFile) {
        // Convert new answer image to base64
        const reader = new FileReader();
        answerImageUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(practiceData.answerImageFile!);
        });
      }
      
      // Filter out undefined values to avoid Firebase errors
      const practiceDataToSave: Partial<PracticeSection> = {
        imageUrl: imageUrl,
        questions: [''], // Keep empty for compatibility
        answers: [practiceData.answer], // Store the single answer
        answerType: practiceData.answerType,
        answerImageUrl: answerImageUrl,
      };

      // Only add defined values
      if (practiceData.title !== undefined) practiceDataToSave.title = practiceData.title;
      if (practiceData.description !== undefined) practiceDataToSave.description = practiceData.description;

      await updatePracticeSectionInChapter(selectedChapter.id!, selectedPractice.id, practiceDataToSave);
      await loadChapters();
      setShowEditPracticeModal(false);
      setSelectedPractice(null);
    } catch (error) {
      console.error('Error updating practice section:', error);
      alert('Error updating practice section. Please try again.');
    }
  };

  const handleAddExam = async (examData: {
    title: string;
    description: string;
    questions: string[];
    options: string[][];
    correctAnswers: number[];
    timeLimit: number;
    passingScore: number;
  }) => {
    if (!selectedChapter) return;
    
    try {
      await addExamSectionToChapter(selectedChapter.id!, examData);
      await loadChapters(); // Reload to get updated data
      setShowExamModal(false);
    } catch (error) {
      console.error('Error adding exam section:', error);
    }
  };

  const deleteTutorial = async (tutorialId: string) => {
    if (!selectedChapter) return;
    
    if (!confirm('Are you sure you want to delete this tutorial?')) {
      return;
    }

    try {
      await deleteTutorialFromChapter(selectedChapter.id!, tutorialId);
      await loadChapters();
    } catch (error) {
      console.error('Error deleting tutorial:', error);
      alert('Error deleting tutorial. Please try again.');
    }
  };

  const deletePractice = async (practiceId: string) => {
    if (!selectedChapter) return;
    
    if (!confirm('Are you sure you want to delete this practice section?')) {
      return;
    }

    try {
      await deletePracticeSectionFromChapter(selectedChapter.id!, practiceId);
      await loadChapters();
    } catch (error) {
      console.error('Error deleting practice section:', error);
      alert('Error deleting practice section. Please try again.');
    }
  };



  // Chapter management functions
  const handleCreateChapter = async (chapterData: { title: string; description: string }) => {
    try {
      await createChapter(chapterData);
      await loadChapters();
      setShowCreateChapterModal(false);
      alert('Chapter created successfully!');
    } catch (error) {
      console.error('Error creating chapter:', error);
      alert('Failed to create chapter. Please try again.');
    }
  };

  const handleEditChapter = async (chapterData: { title: string; description: string }) => {
    if (!editingChapter) return;
    
    try {
      await updateChapter(editingChapter.id!, chapterData);
      await loadChapters();
      setShowEditChapterModal(false);
      setEditingChapter(null);
      alert('Chapter updated successfully!');
    } catch (error) {
      console.error('Error updating chapter:', error);
      alert('Failed to update chapter. Please try again.');
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteChapter(chapterId);
      await loadChapters();
      if (selectedChapter?.id === chapterId) {
        setSelectedChapter(null);
      }
      alert('Chapter deleted successfully!');
    } catch (error) {
      console.error('Error deleting chapter:', error);
      alert('Failed to delete chapter. Please try again.');
    }
  };

  const openEditChapterModal = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setShowEditChapterModal(true);
  };

  if (loading) {
    return (
      <AdminRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-white">
        <nav className="bg-white shadow-lg border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-2 sm:space-x-8">
                {/* Mobile sidebar toggle button */}
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-all duration-200"
                >
                  <span className="sr-only">Toggle sidebar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="text-xl sm:text-2xl font-heading font-bold text-gray-900 tracking-tight">ICT Admin Panel</h1>
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
                  <Link 
                    href="/admin" 
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-indigo-700 transition-all duration-200"
                  >
                    Admin Panel
                  </Link>
                  <Link 
                    href="/profile" 
                    className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50"
                  >
                    Profile
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="hidden sm:block text-gray-700 text-sm font-medium">Welcome, {currentUser?.email}</span>
                <button
                  onClick={handleLogout}
                  className="hidden sm:block bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all duration-200"
                >
                  <span className="hidden sm:inline">Logout</span>
                  <span className="sm:hidden">Out</span>
                </button>
                <MobileMenu 
                  currentPath="/admin" 
                  userEmail={currentUser?.email} 
                  onLogout={handleLogout} 
                />
              </div>
            </div>
          </div>
        </nav>

        <div className="flex flex-col lg:flex-row h-screen">
          {/* Mobile backdrop overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          
          {/* Sidebar */}
          <div className={`fixed lg:static inset-y-0 left-0 z-50 transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 transition duration-300 ease-in-out w-80 bg-white shadow-xl border-r border-gray-100 overflow-y-auto`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-heading font-bold text-gray-900 tracking-tight">Chapters</h2>
                <div className="flex items-center space-x-2">
                  {/* Create Chapter Button */}
                  <button
                    onClick={() => setShowCreateChapterModal(true)}
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-sm transition-all duration-200"
                    title="Create New Chapter"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  {/* Close button for mobile */}
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="lg:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-all duration-200"
                  >
                    <span className="sr-only">Close sidebar</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {chapters.map((chapter) => (
                  <div key={chapter.id} className="relative group">
                    <button
                      onClick={() => handleChapterSelect(chapter)}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-200 border-2 ${
                        selectedChapter?.id === chapter.id
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-md'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 hover:shadow-sm'
                      }`}
                    >
                      <h3 className="font-semibold text-sm mb-2 leading-tight">{chapter.title}</h3>
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{chapter.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="font-medium">Total: {chapter.tutorials?.length + chapter.practiceSections?.length + chapter.examSections?.length || 0}</span>
                        <div className="flex space-x-2">
                          {chapter.tutorials && chapter.tutorials.length > 0 && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              {chapter.tutorials.length}
                            </span>
                          )}
                          {chapter.practiceSections && chapter.practiceSections.length > 0 && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              {chapter.practiceSections.length}
                            </span>
                          )}
                          {chapter.examSections && chapter.examSections.length > 0 && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              {chapter.examSections.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                    {/* Chapter Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditChapterModal(chapter);
                          }}
                          className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                          title="Edit Chapter"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChapter(chapter.id!);
                          }}
                          className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                          title="Delete Chapter"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto w-full">
            {selectedChapter ? (
              <div className="p-6 lg:p-8">
                {/* Chapter Header */}
                <div className="mb-8">
                  <h2 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900 mb-3 tracking-tight">{selectedChapter.title}</h2>
                  <p className="text-gray-600 text-lg lg:text-xl leading-relaxed max-w-4xl">{selectedChapter.description}</p>
                </div>

                {/* Tab Buttons */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mb-8">
                  <button
                    onClick={() => setActiveTab('tutorials')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-sm ${
                      activeTab === 'tutorials'
                        ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                        : 'bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50 hover:shadow-md border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-center sm:justify-start space-x-3">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm sm:text-base">Tutorials ({selectedChapter.tutorials?.length || 0})</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('practice')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-sm ${
                      activeTab === 'practice'
                        ? 'bg-green-600 text-white shadow-lg transform scale-105'
                        : 'bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50 hover:shadow-md border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-center sm:justify-start space-x-3">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm sm:text-base">Practice ({selectedChapter.practiceSections?.length || 0})</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('exams')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-sm ${
                      activeTab === 'exams'
                        ? 'bg-purple-600 text-white shadow-lg transform scale-105'
                        : 'bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50 hover:shadow-md border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-center sm:justify-start space-x-3">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-sm sm:text-base">Exams ({selectedChapter.examSections?.length || 0})</span>
                    </div>
                  </button>
                </div>

                {/* Content Based on Active Tab */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8">
                  {activeTab === 'tutorials' && (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-heading font-bold text-gray-900 flex items-center">
                          <svg className="w-7 h-7 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Tutorials
                        </h3>
                        <button
                          onClick={() => setShowTutorialModal(true)}
                          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center space-x-3 shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>Add Tutorial</span>
                        </button>
                      </div>
                      {selectedChapter.tutorials && selectedChapter.tutorials.length > 0 ? (
                        <div className="space-y-6">
                          {selectedChapter.tutorials.map((tutorial, index) => (
                            <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                              <h4 className="font-bold text-gray-900 mb-3 text-lg leading-tight">{tutorial.title}</h4>
                              <p className="text-gray-600 mb-4 leading-relaxed">{tutorial.description}</p>
                              <div className="text-sm text-gray-500 font-medium">Video Tutorial</div>
                              {tutorial.links && tutorial.links.length > 0 && (
                                <div className="text-sm text-gray-500 font-medium">Links: {tutorial.links.length}</div>
                              )}
                              <div className="flex items-center mt-4 text-sm text-gray-500">
                                <button
                                  onClick={() => {
                                    setSelectedTutorial(tutorial);
                                    setShowEditTutorialModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-700 mr-4 flex items-center font-medium transition-colors duration-200"
                                  title="Edit Tutorial"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteTutorial(tutorial.id)}
                                  className="text-red-600 hover:text-red-700 flex items-center font-medium transition-colors duration-200"
                                  title="Delete Tutorial"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <svg className="w-20 h-20 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <h3 className="text-xl font-semibold text-gray-500 mb-2">No tutorials available yet</h3>
                          <p className="text-gray-400 leading-relaxed">Tutorials will appear here once added by an administrator.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'practice' && (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-heading font-bold text-gray-900 flex items-center">
                          <svg className="w-7 h-7 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Practice Sections
                        </h3>
                        <button
                          onClick={() => setShowPracticeModal(true)}
                          className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center space-x-3 shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>Add Practice</span>
                        </button>
                      </div>
                      {selectedChapter.practiceSections && selectedChapter.practiceSections.length > 0 ? (
                        <div className="space-y-6">
                          {selectedChapter.practiceSections.map((practice, index) => (
                            <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                              {practice.title && (
                                <h4 className="font-bold text-gray-900 mb-3 text-lg leading-tight">{practice.title}</h4>
                              )}
                              {practice.description && (
                                <p className="text-gray-600 mb-4 leading-relaxed">{practice.description}</p>
                              )}
                              <div className="text-sm text-gray-500 font-medium">Practice Section</div>
                              <div className="flex items-center mt-4 text-sm text-gray-500">
                                <button
                                  onClick={() => {
                                    setSelectedPractice(practice);
                                    setShowEditPracticeModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-700 mr-4 flex items-center font-medium transition-colors duration-200"
                                  title="Edit Practice"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={() => deletePractice(practice.id)}
                                  className="text-red-600 hover:text-red-700 flex items-center font-medium transition-colors duration-200"
                                  title="Delete Practice"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <svg className="w-20 h-20 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h3 className="text-xl font-semibold text-gray-500 mb-2">No practice sections available yet</h3>
                          <p className="text-gray-400 leading-relaxed">Practice sections will appear here once added by an administrator.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'exams' && (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-heading font-bold text-gray-900 flex items-center">
                          <svg className="w-7 h-7 mr-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Exam Sections
                        </h3>
                        <button
                          onClick={() => setShowExamModal(true)}
                          className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center space-x-3 shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>Add Exam</span>
                        </button>
                      </div>
                      {selectedChapter.examSections && selectedChapter.examSections.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {selectedChapter.examSections.map((exam, index) => (
                            <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                              <h4 className="font-bold text-gray-900 mb-3 text-lg leading-tight">{exam.title}</h4>
                              <p className="text-gray-600 mb-4 leading-relaxed">{exam.description}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                                <span className="font-medium">Questions: {exam.questions.length}</span>
                                <span className="font-medium">Time: {exam.timeLimit} min</span>
                                <span className="font-medium">Pass: {exam.passingScore}%</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <button
                                  onClick={() => {
                                    setSelectedExam(exam);
                                    setShowEditExamModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-700 mr-4 flex items-center font-medium transition-colors duration-200"
                                  title="Edit Exam"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteExam(exam.id)}
                                  className="text-red-600 hover:text-red-700 flex items-center font-medium transition-colors duration-200"
                                  title="Delete Exam"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <svg className="w-20 h-20 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <h3 className="text-xl font-semibold text-gray-500 mb-2">No exam sections available yet</h3>
                          <p className="text-gray-400 leading-relaxed">Exam sections will appear here once added by an administrator.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'users' && (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-heading font-bold text-gray-900 flex items-center">
                          <svg className="w-7 h-7 mr-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                          User Management
                        </h3>
                      </div>
                      {users.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full bg-white rounded-xl border border-gray-200 shadow-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                  User
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                  Role
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                  Created
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {users.map((user) => (
                                <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{user.displayName || 'No Name'}</div>
                                      <div className="text-sm text-gray-500">{user.email}</div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                      user.role === 'admin' 
                                        ? 'bg-red-100 text-red-800' 
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                      {user.role}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.createdAt.toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {user.role === 'admin' ? (
                                      <button
                                        onClick={() => handleRoleUpdate(user.uid, 'user')}
                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                        disabled={users.filter(u => u.role === 'admin').length === 1}
                                        title={users.filter(u => u.role === 'admin').length === 1 ? "Cannot remove the last admin" : "Remove admin role"}
                                      >
                                        Remove Admin
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleRoleUpdate(user.uid, 'admin')}
                                        className="text-green-600 hover:text-green-900"
                                        title="Make admin"
                                      >
                                        Make Admin
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <svg className="w-20 h-20 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                          <h3 className="text-xl font-semibold text-gray-500 mb-2">No users found</h3>
                          <p className="text-gray-400 leading-relaxed">Users will appear here once they sign up.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg className="w-20 h-20 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-500 mb-2">Select a chapter to manage content</h3>
                  <p className="text-gray-400 leading-relaxed">Choose a chapter from the sidebar to start managing tutorials, practice sections, and exams.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <AddTutorialModal
          isOpen={showTutorialModal}
          onClose={() => setShowTutorialModal(false)}
          onSubmit={handleAddTutorial}
        />

        <AddPracticeModal
          isOpen={showPracticeModal}
          onClose={() => setShowPracticeModal(false)}
          onSubmit={handleAddPractice}
        />

        <AddExamModal
          isOpen={showExamModal}
          onClose={() => setShowExamModal(false)}
          onSubmit={handleAddExam}
        />

        <EditTutorialModal
          isOpen={showEditTutorialModal}
          onClose={() => setShowEditTutorialModal(false)}
          tutorial={selectedTutorial}
          onSubmit={handleEditTutorial}
        />

        <EditPracticeModal
          isOpen={showEditPracticeModal}
          onClose={() => setShowEditPracticeModal(false)}
          practice={selectedPractice}
          onSubmit={handleEditPractice}
        />

        {/* Create Chapter Modal */}
        {showCreateChapterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Create New Chapter</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateChapter({
                  title: formData.get('title') as string,
                  description: formData.get('description') as string
                });
              }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chapter Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter chapter title"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter chapter description"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateChapterModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Create Chapter
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Chapter Modal */}
        {showEditChapterModal && editingChapter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Edit Chapter</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleEditChapter({
                  title: formData.get('title') as string,
                  description: formData.get('description') as string
                });
              }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chapter Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    defaultValue={editingChapter.title}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter chapter title"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={3}
                    defaultValue={editingChapter.description}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter chapter description"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditChapterModal(false);
                      setEditingChapter(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Update Chapter
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminRoute>
  );
}
