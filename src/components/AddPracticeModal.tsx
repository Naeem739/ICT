'use client';

import React, { useState } from 'react';

interface AddPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (practice: {
    title?: string;
    description?: string;
    imageFile: File | null;
    answer: string;
    answerType: 'text' | 'code' | 'image' | 'mixed';
    answerImageFile: File | null;
  }) => void;
}

export default function AddPracticeModal({ isOpen, onClose, onSubmit }: AddPracticeModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [answer, setAnswer] = useState('');
  const [answerType, setAnswerType] = useState<'text' | 'code' | 'image' | 'mixed'>('text');
  const [answerImageFile, setAnswerImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that at least one of title, description, or image is provided
    if (!title.trim() && !description.trim() && !imageFile) {
      alert('Please provide at least one of: Title, Description, or Image');
      return;
    }

    // Validate answer based on type
    if (answerType === 'text' || answerType === 'code') {
      if (!answer.trim()) {
        alert('Please provide an answer');
        return;
      }
    } else if (answerType === 'image') {
      if (!answerImageFile) {
        alert('Please select an answer image');
        return;
      }
    } else if (answerType === 'mixed') {
      if (!answer.trim() && !answerImageFile) {
        alert('Please provide either text/code answer or answer image');
        return;
      }
    }

    // Validate image files if provided
    if (imageFile) {
      if (imageFile.size > 5 * 1024 * 1024) {
        alert('Practice image file size must be less than 5MB');
        return;
      }
      if (!imageFile.type.startsWith('image/')) {
        alert('Please select a valid practice image file');
        return;
      }
    }

    if (answerImageFile) {
      if (answerImageFile.size > 5 * 1024 * 1024) {
        alert('Answer image file size must be less than 5MB');
        return;
      }
      if (!answerImageFile.type.startsWith('image/')) {
        alert('Please select a valid answer image file');
        return;
      }
    }

    setIsUploading(true);
    
    try {
      await onSubmit({
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        imageFile,
        answer,
        answerType,
        answerImageFile,
      });
      handleClose();
    } catch (error) {
      console.error('Error submitting practice:', error);
      alert('Error adding practice section. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setImageFile(null);
    setAnswer('');
    setAnswerType('text');
    setAnswerImageFile(null);
    setIsUploading(false);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
  };

  const handleAnswerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAnswerImageFile(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Practice Section</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title (Optional)
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter practice title (optional)"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter practice description (optional)"
              />
            </div>
          </div>

          <div>
            <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700 mb-1">
              Practice Image (Optional)
            </label>
            <input
              type="file"
              id="imageFile"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Upload an image file (JPG, PNG, GIF) - Optional</p>
            <p className="text-xs text-gray-400 mt-1">Note: At least one of Title, Description, or Image must be provided</p>
          </div>

          <div>
            <label htmlFor="answerType" className="block text-sm font-medium text-gray-700 mb-1">
              Answer Type
            </label>
            <select
              id="answerType"
              value={answerType}
              onChange={(e) => setAnswerType(e.target.value as 'text' | 'code' | 'image' | 'mixed')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="text">Text Answer</option>
              <option value="code">Code Answer</option>
              <option value="image">Image Answer</option>
              <option value="mixed">Mixed (Text/Code + Image)</option>
            </select>
          </div>

          {(answerType === 'text' || answerType === 'code' || answerType === 'mixed') && (
            <div>
              <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-1">
                {answerType === 'code' ? 'Code Answer' : 'Text Answer'}
              </label>
              <textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={answerType === 'code' ? 8 : 4}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  answerType === 'code' ? 'font-mono text-sm' : ''
                }`}
                placeholder={
                  answerType === 'code' 
                    ? 'Enter the code solution...' 
                    : 'Enter the text answer...'
                }
              />
            </div>
          )}

          {(answerType === 'image' || answerType === 'mixed') && (
            <div>
              <label htmlFor="answerImageFile" className="block text-sm font-medium text-gray-700 mb-1">
                Answer Image
              </label>
              <input
                type="file"
                id="answerImageFile"
                accept="image/*"
                onChange={handleAnswerImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Upload an image file for the answer (JPG, PNG, GIF)</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                'Add Practice'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
