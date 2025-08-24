'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { Chapter, getChapters } from '@/services/chapterService';
import MobileMenu from '@/components/MobileMenu';

export default function DashboardPage() {
  const { currentUser, logout, isAdmin } = useAuth();
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [activeTab, setActiveTab] = useState<'tutorials' | 'practice' | 'exams'>('tutorials');
  const [expandedSolutions, setExpandedSolutions] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [prismLoaded, setPrismLoaded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    loadChapters();
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

  // Additional effect to highlight code blocks when they become visible
  useEffect(() => {
    const highlightVisibleCode = () => {
      if (window.Prism) {
        // Find all code blocks that are currently visible
        const codeBlocks = document.querySelectorAll('pre code');
        codeBlocks.forEach((block) => {
          if (block.textContent && !block.classList.contains('prism-highlighted')) {
            window.Prism.highlightElement(block);
            block.classList.add('prism-highlighted');
          }
        });
      }
    };

    // Highlight visible code blocks
    highlightVisibleCode();

    // Set up an observer to highlight code blocks when they become visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && window.Prism) {
          const codeBlock = entry.target.querySelector('code');
          if (codeBlock && codeBlock.textContent && !codeBlock.classList.contains('prism-highlighted')) {
            window.Prism.highlightElement(codeBlock);
            codeBlock.classList.add('prism-highlighted');
          }
        }
      });
    });

    // Observe all pre elements
    document.querySelectorAll('pre').forEach((pre) => {
      observer.observe(pre);
    });

    return () => {
      observer.disconnect();
    };
  }, [expandedSolutions, prismLoaded]);

  // Effect to handle image loading and re-highlight code
  useEffect(() => {
    const handleImageLoad = () => {
      // Re-highlight code blocks after images load
      if (window.Prism) {
        setTimeout(() => {
          window.Prism.highlightAll();
        }, 100);
      }
    };

    // Listen for image load events
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      img.addEventListener('load', handleImageLoad);
      img.addEventListener('error', handleImageLoad); // Also handle error cases
    });

    return () => {
      images.forEach(img => {
        img.removeEventListener('load', handleImageLoad);
        img.removeEventListener('error', handleImageLoad);
      });
    };
  }, [expandedSolutions]);

  // Effect to specifically handle code highlighting for solutions with images
  useEffect(() => {
    if (prismLoaded && window.Prism) {
      // Find all expanded solutions that have both code and images
      const expandedSolutionsWithImages = Array.from(expandedSolutions).map(id => {
        const practice = selectedChapter?.practiceSections?.find(p => 
          (p.id || p.title) === id || p.title === id
        );
        return practice;
      }).filter(p => p && p.answerImageUrl);

      // Re-highlight code blocks in solutions with images
      expandedSolutionsWithImages.forEach(practice => {
        if (practice) {
          const codeBlock = document.querySelector(`code[data-practice-id="${practice.id || practice.title}"]`);
          if (codeBlock && codeBlock.textContent && !codeBlock.classList.contains('prism-highlighted')) {
            setTimeout(() => {
              window.Prism.highlightElement(codeBlock);
              codeBlock.classList.add('prism-highlighted');
            }, 200); // Slightly longer delay for solutions with images
          }
        }
      });
    }
  }, [expandedSolutions, prismLoaded, selectedChapter]);

  // MutationObserver to watch for DOM changes and re-highlight code
  useEffect(() => {
    if (!prismLoaded || !window.Prism) return;

    const observer = new MutationObserver((mutations) => {
      let shouldRehighlight = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              // Check if new code blocks were added
              if (element.querySelector && element.querySelector('pre code')) {
                shouldRehighlight = true;
              }
              // Check if the element itself is a code block
              if (element.tagName === 'CODE' && element.classList.contains('language-javascript')) {
                shouldRehighlight = true;
              }
            }
          });
        }
      });

      if (shouldRehighlight) {
        setTimeout(() => {
          window.Prism.highlightAll();
        }, 100);
      }
    });

    // Observe the entire document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
    };
  }, [prismLoaded]);

  // Load Prism.js when component mounts
  useEffect(() => {
    const loadPrism = async () => {
      // Check if Prism is already loaded
      if (window.Prism) {
        setPrismLoaded(true);
        window.Prism.highlightAll();
        return;
      }

      // Load Prism CSS if not already loaded
      if (!document.querySelector('link[href*="prism-tomorrow"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css';
        document.head.appendChild(link);
      }

      // Load Prism JS if not already loaded
      if (!document.querySelector('script[src*="prism-core"]')) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js';
        script.onload = () => {
          // Load autoloader
          const autoloader = document.createElement('script');
          autoloader.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js';
          autoloader.onload = () => {
            setPrismLoaded(true);
            // Highlight all code blocks after loading
            if (window.Prism) {
              window.Prism.highlightAll();
            }
          };
          autoloader.onerror = () => {
            // Fallback: try to highlight manually if autoloader fails
            setPrismLoaded(true);
            if (window.Prism) {
              window.Prism.highlightAll();
            }
          };
          document.head.appendChild(autoloader);
        };
        script.onerror = () => {
          console.error('Failed to load Prism.js');
        };
        document.head.appendChild(script);
      }
    };

    loadPrism();
  }, []);

  // Highlight code when solutions are expanded or Prism is loaded
  useEffect(() => {
    if (prismLoaded && window.Prism) {
      // Small delay to ensure DOM is fully rendered
      setTimeout(() => {
        window.Prism.highlightAll();
      }, 50);
    }
  }, [expandedSolutions, prismLoaded]);

  const loadChapters = async () => {
    try {
      const chaptersData = await getChapters();
      // Show all chapters from Firebase
      setChapters(chaptersData);
      // Set the first chapter as selected by default
      if (chaptersData.length > 0) {
        setSelectedChapter(chaptersData[0]);
      }
    } catch (error) {
      console.error('Error loading chapters:', error);
    } finally {
      setLoading(false);
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
    setActiveTab('tutorials'); // Reset to tutorials tab when selecting a new chapter
    // Close sidebar on mobile after chapter selection
    setIsSidebarOpen(false);
  };

  const toggleSolution = (practiceId: string) => {
    const newExpanded = new Set(expandedSolutions);
    if (newExpanded.has(practiceId)) {
      newExpanded.delete(practiceId);
    } else {
      newExpanded.add(practiceId);
    }
    setExpandedSolutions(newExpanded);
  };

  const copyToClipboard = async (text: string, practiceId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCodeId(practiceId);
      setTimeout(() => setCopiedCodeId(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  // Function to check if URL is a blob URL and convert if possible
  const getValidImageUrl = (imageUrl: string): string => {
    if (imageUrl.startsWith('blob:')) {
      // This is a blob URL that won't work - return a placeholder
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCAxMDBMMTQwIDEwMEwxMTAgNzBMMTAwIDEwMEwxMTAgMTMwTDgwIDEwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
    }
    return imageUrl;
  };

  const getTotalContentCount = (chapter: Chapter) => {
    const tutorialsCount = chapter.tutorials?.length || 0;
    const practiceCount = chapter.practiceSections?.length || 0;
    const examCount = chapter.examSections?.length || 0;
    return tutorialsCount + practiceCount + examCount;
  };

  // Function to extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Function to detect if content is code
  const isCodeContent = (content: string, answerType?: string): boolean => {
    if (!content) return false;
    
    // Check for common code patterns
    const codePatterns = [
      /function\s+\w+\s*\(/, // function declarations
      /const\s+\w+\s*=/, // const declarations
      /let\s+\w+\s*=/, // let declarations
      /var\s+\w+\s*=/, // var declarations
      /import\s+/, // import statements
      /export\s+/, // export statements
      /console\.log/, // console.log
      /if\s*\(/, // if statements
      /for\s*\(/, // for loops
      /while\s*\(/, // while loops
      /return\s+/, // return statements
      /class\s+\w+/, // class declarations
      /=>\s*{/, // arrow functions
      /\.\w+\(/, // method calls
      /new\s+\w+/, // new keyword
      /try\s*{/, // try blocks
      /catch\s*\(/, // catch blocks
      /async\s+function/, // async functions
      /await\s+/, // await keyword
      /Promise\./, // Promise methods
      /\.then\(/, // .then() calls
      /\.catch\(/, // .catch() calls
      /<[^>]*>/, // HTML tags
      /css\s*{/, // CSS blocks
      /@media/, // CSS media queries
      /\.\w+\s*{/, // CSS selectors
      /sql/i, // SQL keywords
      /select\s+.+from/i, // SQL SELECT
      /insert\s+into/i, // SQL INSERT
      /update\s+.+set/i, // SQL UPDATE
      /delete\s+from/i, // SQL DELETE
      /create\s+table/i, // SQL CREATE TABLE
      /python/i, // Python keywords
      /def\s+\w+/, // Python function definitions
      /import\s+\w+/, // Python imports
      /print\s*\(/, // Python print
      /if\s+\w+:/, // Python if statements
      /for\s+\w+\s+in/, // Python for loops
      /class\s+\w+/, // Python class definitions
    ];

    // Check if content contains code patterns
    const hasCodePatterns = codePatterns.some(pattern => pattern.test(content));
    
    // Check for code-like structure (multiple lines with indentation, brackets, etc.)
    const lines = content.split('\n');
    const hasMultipleLines = lines.length > 1;
    const hasIndentation = lines.some(line => line.startsWith('  ') || line.startsWith('\t'));
    const hasBrackets = content.includes('{') && content.includes('}');
    const hasParentheses = content.includes('(') && content.includes(')');
    const hasSemicolons = content.includes(';');
    const hasQuotes = content.includes('"') || content.includes("'") || content.includes('`');
    
    // Calculate code probability
    let codeProbability = 0;
    if (hasCodePatterns) codeProbability += 0.6;
    if (hasMultipleLines) codeProbability += 0.2;
    if (hasIndentation) codeProbability += 0.1;
    if (hasBrackets) codeProbability += 0.1;
    if (hasParentheses) codeProbability += 0.1;
    if (hasSemicolons) codeProbability += 0.1;
    if (hasQuotes) codeProbability += 0.1;
    
    // Also check if it's explicitly marked as code
    if (answerType === 'code') codeProbability += 0.3;
    
    return codeProbability >= 0.3; // Threshold for considering content as code
  };

  // Function to detect programming language
  const detectLanguage = (content: string): string => {
    if (!content) return 'javascript';
    
    const languagePatterns = {
      javascript: [
        /function\s+\w+\s*\(/, /const\s+\w+\s*=/, /let\s+\w+\s*=/, /var\s+\w+\s*=/,
        /import\s+/, /export\s+/, /console\.log/, /=>\s*{/, /Promise\./, /async\s+function/
      ],
      python: [
        /def\s+\w+/, /import\s+\w+/, /print\s*\(/, /if\s+\w+:/, /for\s+\w+\s+in/,
        /class\s+\w+/, /__init__/, /self\./, /import\s+os/, /import\s+sys/
      ],
      html: [
        /<html/, /<head/, /<body/, /<div/, /<span/, /<p/, /<h[1-6]/, /<!DOCTYPE/,
        /<script/, /<style/, /<link/, /<meta/
      ],
      css: [
        /css\s*{/, /@media/, /\.\w+\s*{/, /#\w+\s*{/, /margin:/, /padding:/,
        /color:/, /background:/, /font-size:/, /display:/
      ],
      sql: [
        /select\s+.+from/i, /insert\s+into/i, /update\s+.+set/i, /delete\s+from/i,
        /create\s+table/i, /alter\s+table/i, /drop\s+table/i, /where\s+/i
      ]
    };

    for (const [language, patterns] of Object.entries(languagePatterns)) {
      if (patterns.some(pattern => pattern.test(content))) {
        return language;
      }
    }
    
    return 'javascript'; // Default to JavaScript
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
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
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-indigo-700 transition-all duration-200"
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
                  currentPath="/dashboard" 
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
              <div className="space-y-3">
                {chapters.map((chapter) => (
                  <button
                    key={chapter.id}
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
                      <span className="font-medium">{getTotalContentCount(chapter)} items</span>
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
                      <h3 className="text-2xl font-heading font-bold text-gray-900 mb-6 flex items-center">
                        <svg className="w-7 h-7 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Tutorials
                      </h3>
                      {selectedChapter.tutorials && selectedChapter.tutorials.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6">
                          {selectedChapter.tutorials.map((tutorial, index) => (
                            <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                              <h4 className="font-bold text-gray-900 mb-3 text-lg leading-tight">{tutorial.title}</h4>
                              <p className="text-gray-600 mb-4 leading-relaxed">{tutorial.description}</p>
                              
                              {/* YouTube Video iframe */}
                              {getYouTubeVideoId(tutorial.videoUrl) && (
                                <div className="mb-3">
                                  <div className="w-full max-w-4xl mx-auto">
                                    <iframe
                                      className="w-full h-48 sm:h-72 md:h-80 lg:h-96 xl:h-[432px] rounded-lg"
                                      src={`https://www.youtube.com/embed/${getYouTubeVideoId(tutorial.videoUrl)}`}
                                      title={tutorial.title}
                                      frameBorder="0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    ></iframe>
                                  </div>
                                </div>
                              )}

                              {/* Additional Links */}
                              {tutorial.links && tutorial.links.length > 0 && (
                                <div className="mb-3">
                                  <h5 className="text-sm font-medium text-gray-700 mb-2">Additional Resources:</h5>
                                  <div className="space-y-2">
                                    {tutorial.links.map((link, linkIndex) => (
                                      <a
                                        key={linkIndex}
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                                      >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        {link}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <span className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Video Tutorial
                                </span>
                                <a 
                                  href={tutorial.videoUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
                                >
                                  Open in YouTube
                                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
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
                      <h3 className="text-2xl font-heading font-bold text-gray-900 mb-6 flex items-center">
                        <svg className="w-7 h-7 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Practice Sections
                      </h3>
                      {selectedChapter.practiceSections && selectedChapter.practiceSections.length > 0 ? (
                        <div className="space-y-8">
                          {selectedChapter.practiceSections.map((practice, index) => (
                            <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                              {practice.title && (
                                <h4 className="font-bold text-gray-900 mb-3 text-xl leading-tight">{practice.title}</h4>
                              )}
                              {practice.description && (
                                <p className="text-gray-600 mb-5 leading-relaxed">{practice.description}</p>
                              )}
                              
                              {/* Practice Image */}
                              {practice.imageUrl && (
                                <div className="mb-6">
                                  <div className="w-full max-w-2xl mx-auto">
                                    <div className="relative w-full h-96 rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200" onClick={() => openImageModal(getValidImageUrl(practice.imageUrl!))}>
                                      <img 
                                        src={getValidImageUrl(practice.imageUrl)}
                                        alt={practice.title}
                                        className="w-full h-full object-contain rounded-xl"
                                        onError={(e) => {
                                          console.error('Image failed to load:', practice.imageUrl);
                                          // Show a placeholder image instead of hiding
                                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCAxMDBMMTQwIDEwMEwxMTAgNzBMMTAwIDEwMEwxMTAgMTMwTDgwIDEwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                                          e.currentTarget.style.cursor = 'default';
                                          e.currentTarget.onclick = null; // Disable click for broken images
                                        }}
                                        onLoad={() => console.log('Image loaded successfully:', practice.imageUrl)}
                                      />
                                      {practice.imageUrl.startsWith('blob:') && (
                                        <div className="absolute inset-0 bg-yellow-100 bg-opacity-75 flex items-center justify-center">
                                          <div className="text-center text-yellow-800">
                                            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                            <p className="text-sm font-medium">Image needs to be re-uploaded</p>
                                            <p className="text-xs">This image was created with an old method</p>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                alert('Please go to Admin Panel and re-upload this image. The old upload method is no longer supported.');
                                              }}
                                              className="mt-2 px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                                            >
                                              How to Fix
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                      <div className="absolute top-3 right-3 bg-white/90 rounded-full p-2 shadow-lg">
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Single Answer Section */}
                              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <h5 className="font-bold text-gray-900 mb-4 text-lg">Practice Question</h5>
                                <p className="text-gray-700 mb-4 leading-relaxed">Look at the image above and solve the practice problem.</p>
                                
                                {/* Collapsible Solution */}
                                <div>
                                  <button
                                    onClick={() => toggleSolution(`${practice.id || index}`)}
                                    className="flex items-center text-sm text-green-600 hover:text-green-700 font-semibold transition-colors duration-200"
                                  >
                                    <span>{expandedSolutions.has(`${practice.id || index}`) ? 'Hide' : 'Show'} Solution</span>
                                    <svg 
                                      className={`w-5 h-5 ml-2 transform transition-transform duration-200 ${
                                        expandedSolutions.has(`${practice.id || index}`) ? 'rotate-180' : ''
                                      }`} 
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  
                                  {expandedSolutions.has(`${practice.id || index}`) && (
                                    <div className="mt-4 p-4 bg-white rounded-xl border border-green-200 shadow-sm">
                                      <h6 className="text-sm font-bold text-green-800 mb-3 uppercase tracking-wide">Solution:</h6>
                                      
                                      {/* Text/Code Answer */}
                                      {practice.answers && practice.answers[0] && (
                                        <div className="mb-4">
                                          {isCodeContent(practice.answers[0], practice.answerType) ? (
                                            <div className="relative">
                                              <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-bold text-green-800 uppercase tracking-wide">Code Solution</span>
                                                <div className="flex items-center space-x-2">
                                                  <button
                                                    onClick={() => copyToClipboard(practice.answers[0], practice.id || '')}
                                                    className={`flex items-center text-xs px-3 py-2 rounded-lg transition-all duration-200 font-medium ${
                                                      copiedCodeId === (practice.id || '') 
                                                        ? 'text-green-800 bg-green-200 shadow-sm' 
                                                        : 'text-green-700 hover:text-green-800 bg-green-100 hover:bg-green-200 hover:shadow-sm'
                                                    }`}
                                                    title="Copy code"
                                                  >
                                                    {copiedCodeId === (practice.id || '') ? (
                                                      <>
                                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Copied!
                                                      </>
                                                    ) : (
                                                      <>
                                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                        Copy
                                                      </>
                                                    )}
                                                  </button>
                                                </div>
                                              </div>
                                              <div className="code-block">
                                                <pre className="text-sm overflow-x-auto bg-gray-900 rounded-lg p-4">
                                                  <code 
                                                    key={`${practice.id}-${expandedSolutions.has(`${practice.id || index}`)}-${practice.answerImageUrl ? 'with-image' : 'no-image'}`}
                                                    className={`language-${detectLanguage(practice.answers[0])}`}
                                                    data-practice-id={practice.id || index}
                                                  >
                                                    {practice.answers[0]}
                                                  </code>
                                                </pre>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="relative">
                                              <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-bold text-green-800 uppercase tracking-wide">Text Solution</span>
                                              </div>
                                              <p className="text-sm text-green-700 leading-relaxed">{practice.answers[0]}</p>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      
                                      {/* Answer Image */}
                                      {practice.answerImageUrl && (
                                        <div className="mt-4">
                                          <div className="flex items-center justify-between mb-3">
                                            <p className="text-sm font-bold text-green-800">Answer Image:</p>
                                          </div>
                                          <div className="relative w-full max-w-md mx-auto">
                                            <div className="relative w-full h-80 rounded-xl border border-green-200 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200" onClick={() => openImageModal(getValidImageUrl(practice.answerImageUrl!))}>
                                              <img 
                                                src={getValidImageUrl(practice.answerImageUrl)}
                                                alt="Answer"
                                                className="w-full h-full object-contain rounded-xl"
                                                onError={(e) => {
                                                  console.error('Answer image failed to load:', practice.answerImageUrl);
                                                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCAxMDBMMTQwIDEwMEwxMTAgNzBMMTAwIDEwMEwxMTAgMTMwTDgwIDEwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                                                  e.currentTarget.style.cursor = 'default';
                                                  e.currentTarget.onclick = null;
                                                }}
                                              />
                                              <div className="absolute top-3 right-3 bg-white/90 rounded-full p-2 shadow-lg">
                                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                </svg>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
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
                      <h3 className="text-2xl font-heading font-bold text-gray-900 mb-6 flex items-center">
                        <svg className="w-7 h-7 mr-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Exam Sections
                      </h3>
                      {selectedChapter.examSections && selectedChapter.examSections.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {selectedChapter.examSections.map((exam, index) => (
                            <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                              <h4 className="font-bold text-gray-900 mb-3 text-lg leading-tight">{exam.title}</h4>
                              <p className="text-gray-600 mb-4 leading-relaxed">{exam.description}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="font-medium">Questions: {exam.questions.length}</span>
                                <span className="font-medium">Time: {exam.timeLimit} min</span>
                                <span className="font-medium">Pass: {exam.passingScore}%</span>
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
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg className="w-20 h-20 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-500 mb-2">Select a chapter to view content</h3>
                  <p className="text-gray-400 leading-relaxed">Choose a chapter from the sidebar to get started.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={closeImageModal}>
          <div className="relative max-w-5xl max-h-[90vh] mx-4">
            <img 
              src={selectedImage} 
              alt="Practice Image"
              className="w-full h-full object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={closeImageModal}
              className="absolute top-6 right-6 bg-white/95 hover:bg-white text-gray-800 rounded-full p-3 shadow-xl transition-all duration-200 hover:scale-110"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
