'use client';

import React, { useState, useEffect } from 'react';
import { Tutorial } from '@/services/chapterService';

interface EditTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutorial: Tutorial;
  onSubmit: (tutorial: {
    title: string;
    videoUrl: string;
    links: string[];
    description: string;
  }) => void;
}

export default function EditTutorialModal({ isOpen, onClose, tutorial, onSubmit }: EditTutorialModalProps) {
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [links, setLinks] = useState<string[]>(['']);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (tutorial) {
      setTitle(tutorial.title);
      setVideoUrl(tutorial.videoUrl);
      setLinks(tutorial.links && tutorial.links.length > 0 ? tutorial.links : ['']);
      setDescription(tutorial.description);
    }
  }, [tutorial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filteredLinks = links.filter(link => link.trim() !== '');
    onSubmit({
      title,
      videoUrl,
      links: filteredLinks,
      description,
    });
    handleClose();
  };

  const handleClose = () => {
    setTitle('');
    setVideoUrl('');
    setLinks(['']);
    setDescription('');
    onClose();
  };

  const addLink = () => {
    setLinks([...links, '']);
  };

  const removeLink = (index: number) => {
    if (links.length > 1) {
      setLinks(links.filter((_, i) => i !== index));
    }
  };

  const updateLink = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Edit Tutorial</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video URL
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Links
            </label>
            {links.map((link, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="url"
                  value={link}
                  onChange={(e) => updateLink(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/resource"
                />
                {links.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLink(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addLink}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Add Another Link
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter tutorial description (optional)"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Update Tutorial
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
