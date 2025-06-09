import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiLoader, FiPlus } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { CreateProjectData } from '../../types/projects';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: CreateProjectData) => Promise<void>;
  loading?: boolean;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false
}: CreateProjectModalProps) {
  const [formData, setFormData] = useState<CreateProjectData>({
    title: '',
    description: '',
    category: 'research',
    priority: 'medium',
    status: 'active',
    tags: []
  });

  const [newTag, setNewTag] = useState('');

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !(formData.tags?.includes(newTag.trim()))) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Project title is required');
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form after successful submission
      setFormData({
        title: '',
        description: '',
        category: 'research',
        priority: 'medium',
        status: 'active',
        tags: []
      });
      onClose();
    } catch (error) {
      // Error is handled by parent component
      console.error('Error in CreateProjectModal:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                  Create New Project
                </CardTitle>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  disabled={loading}
                >
                  <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </CardHeader>

              <CardContent className="max-h-[70vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Project Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                        focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="Enter project title..."
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                        focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                      placeholder="Brief description of the project..."
                      disabled={loading}
                    />
                  </div>



                  {/* Category, Priority, Status */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        disabled={loading}
                      >
                        <option value="research">Research</option>
                        <option value="development">Development</option>
                        <option value="analysis">Analysis</option>
                        <option value="strategy">Strategy</option>
                        <option value="marketing">Marketing</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Priority
                      </label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        disabled={loading}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        disabled={loading}
                      >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tags
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                          placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="Add a tag..."
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                          transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading || !newTag.trim()}
                      >
                        <FiPlus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {(formData.tags && formData.tags.length > 0) && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 
                              text-blue-800 dark:text-blue-300 text-sm rounded-full"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="hover:bg-blue-200 dark:hover:bg-blue-800/30 rounded-full p-0.5"
                              disabled={loading}
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700
                        rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                        transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center gap-2"
                      disabled={loading || !formData.title.trim()}
                    >
                      {loading && <FiLoader className="w-4 h-4 animate-spin" />}
                      {loading ? 'Creating...' : 'Create Project'}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 