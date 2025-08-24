'use client';

import React, { useState } from 'react';
import { ExamSection } from '@/services/chapterService';

interface AddExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (examSection: Omit<ExamSection, 'id' | 'createdAt'>) => void;
}

export default function AddExamModal({ isOpen, onClose, onAdd }: AddExamModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    questions: [''],
    options: [['', '', '', '']],
    correctAnswers: [0],
    timeLimit: 30,
    passingScore: 70
  });

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, ''],
      options: [...formData.options, ['', '', '', '']],
      correctAnswers: [...formData.correctAnswers, 0]
    });
  };

  const removeQuestion = (index: number) => {
    if (formData.questions.length > 1) {
      const newQuestions = formData.questions.filter((_, i) => i !== index);
      const newOptions = formData.options.filter((_, i) => i !== index);
      const newCorrectAnswers = formData.correctAnswers.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        questions: newQuestions,
        options: newOptions,
        correctAnswers: newCorrectAnswers
      });
    }
  };

  const updateQuestion = (index: number, value: string) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = value;
    setFormData({
      ...formData,
      questions: newQuestions
    });
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[questionIndex][optionIndex] = value;
    setFormData({
      ...formData,
      options: newOptions
    });
  };

  const updateCorrectAnswer = (questionIndex: number, value: number) => {
    const newCorrectAnswers = [...formData.correctAnswers];
    newCorrectAnswers[questionIndex] = value;
    setFormData({
      ...formData,
      correctAnswers: newCorrectAnswers
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter out empty questions
    const validQuestions = formData.questions.filter(q => q.trim() !== '');
    const validOptions = formData.options.filter((_, i) => formData.questions[i].trim() !== '');
    const validCorrectAnswers = formData.correctAnswers.filter((_, i) => formData.questions[i].trim() !== '');
    
    if (validQuestions.length > 0) {
      onAdd({
        title: formData.title,
        description: formData.description,
        questions: validQuestions,
        options: validOptions,
        correctAnswers: validCorrectAnswers,
        timeLimit: formData.timeLimit,
        passingScore: formData.passingScore
      });
      setFormData({
        title: '',
        description: '',
        questions: [''],
        options: [['', '', '', '']],
        correctAnswers: [0],
        timeLimit: 30,
        passingScore: 70
      });
      onClose();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-[700px] shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Exam Section</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter exam section title"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter exam section description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700">
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  id="timeLimit"
                  name="timeLimit"
                  value={formData.timeLimit}
                  onChange={handleChange}
                  min="1"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="passingScore" className="block text-sm font-medium text-gray-700">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  id="passingScore"
                  name="passingScore"
                  value={formData.passingScore}
                  onChange={handleChange}
                  min="1"
                  max="100"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Questions & Options
                </label>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-300 rounded-md hover:bg-indigo-50"
                >
                  + Add Question
                </button>
              </div>
              
              {formData.questions.map((question, questionIndex) => (
                <div key={questionIndex} className="border border-gray-200 rounded-md p-3 mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Question {questionIndex + 1}</span>
                    {formData.questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(questionIndex)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => updateQuestion(questionIndex, e.target.value)}
                    placeholder="Enter question"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mb-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Options:</label>
                    {formData.options[questionIndex].map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name={`correct-${questionIndex}`}
                          value={optionIndex}
                          checked={formData.correctAnswers[questionIndex] === optionIndex}
                          onChange={() => updateCorrectAnswer(questionIndex, optionIndex)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                          placeholder={`Option ${optionIndex + 1}`}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Add Exam Section
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
