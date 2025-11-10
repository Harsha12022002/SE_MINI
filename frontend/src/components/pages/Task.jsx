
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const Tasks = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  // Build query parameters properly
  const getQueryParams = () => {
    const params = {
      page: currentPage,
      limit: 10,
    };
    
    if (searchTerm) params.search = searchTerm;
    if (statusFilter) params.status = statusFilter;
    if (priorityFilter) params.priority = priorityFilter;
    
    return params;
  };

  const { data: tasksData, isLoading, error } = useQuery({
    queryKey: ['tasks', currentPage, statusFilter, priorityFilter, searchTerm],
    queryFn: () => tasksAPI.getAll(getQueryParams()),
  });

  const createTask = useMutation({
    mutationFn: tasksAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast.success('Task created!');
      setIsModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create'),
  });

  const updateTask = useMutation({
    mutationFn: ({ id, data }) => tasksAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast.success('Task updated!');
      setIsModalOpen(false);
      setEditingTask(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const deleteTask = useMutation({
    mutationFn: tasksAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast.success('Task deleted!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const handleSubmit = (formData) => {
    const payload = {
      ...formData,
      assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
      related_id: formData.related_id ? Number(formData.related_id) : null,
    };

    if (editingTask) {
      updateTask.mutate({ id: editingTask.id, data: payload });
    } else {
      createTask.mutate(payload);
    }
  };

  const handleEdit = (task) => { 
    setEditingTask(task); 
    setIsModalOpen(true); 
  };

  const handleDelete = (id) => { 
    if(window.confirm('Delete this task?')) deleteTask.mutate(id); 
  };

  const handleStatusChange = (id, status) => updateTask.mutate({ id, data: { status } });

  const tasks = tasksData?.tasks || [];
  const pagination = tasksData?.pagination || { 
    currentPage: 1, 
    totalPages: 1, 
    hasPrev: false, 
    hasNext: false 
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800 border border-green-200',
      in_progress: 'bg-blue-100 text-blue-800 border border-blue-200',
      cancelled: 'bg-gray-100 text-gray-800 border border-gray-200',
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  // Handle filter changes - reset to page 1
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusChangeFilter = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handlePriorityChangeFilter = (value) => {
    setPriorityFilter(value);
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPriorityFilter('');
    setCurrentPage(1);
  };

  // Format status for display
  const formatStatusDisplay = (status) => {
    const statusMap = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return statusMap[status] || status;
  };

  // Debug: Log current filters and results
  useEffect(() => {
    console.log('Current filters:', {
      searchTerm,
      statusFilter,
      priorityFilter,
      currentPage,
      tasksCount: tasks.length
    });
  }, [searchTerm, statusFilter, priorityFilter, currentPage, tasks.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Tasks
            </h1>
            <p className="text-gray-600 mt-2">Manage your tasks and assignments</p>
            <div className="text-sm text-gray-500 mt-1">
              Showing {tasks.length} tasks
              {pagination.totalTasks && ` of ${pagination.totalTasks} total`}
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 font-semibold"
          >
            <span>+</span>
            <span>Add Task</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search tasks by title or description..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChangeFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => handlePriorityChangeFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
            >
              <option value="">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            {(searchTerm || statusFilter || priorityFilter) && (
              <button
                onClick={clearFilters}
                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Clear All
              </button>
            )}
          </div>
          
          {/* Active filters indicator */}
          {(searchTerm || statusFilter || priorityFilter) && (
            <div className="text-sm text-gray-600 flex flex-wrap gap-2 items-center">
              <span className="font-medium">Active filters:</span>
              {searchTerm && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center text-sm">
                  Search: "{searchTerm}"
                  <button 
                    onClick={() => handleSearchChange('')}
                    className="ml-2 text-blue-600 hover:text-blue-800 text-lg"
                  >
                    ×
                  </button>
                </span>
              )}
              {statusFilter && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center text-sm">
                  Status: {formatStatusDisplay(statusFilter)}
                  <button 
                    onClick={() => handleStatusChangeFilter('')}
                    className="ml-2 text-green-600 hover:text-green-800 text-lg"
                  >
                    ×
                  </button>
                </span>
              )}
              {priorityFilter && (
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full flex items-center text-sm">
                  Priority: {priorityFilter}
                  <button 
                    onClick={() => handlePriorityChangeFilter('')}
                    className="ml-2 text-yellow-600 hover:text-yellow-800 text-lg"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="p-8 animate-pulse space-y-6">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 rounded flex-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-red-600">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Error loading tasks</h3>
              <p>{error.message}</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl text-gray-400">📝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || statusFilter || priorityFilter 
                  ? 'No tasks match your filters' 
                  : 'No tasks found'
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter || priorityFilter 
                  ? 'Try adjusting your search criteria or clear filters' 
                  : 'Create your first task to get started'
                }
              </p>
              {(searchTerm || statusFilter || priorityFilter) ? (
                <button
                  onClick={clearFilters}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
                >
                  Clear All Filters
                </button>
              ) : (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
                >
                  + Create First Task
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tasks.map(task => (
                <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(task.status)}`}>
                          {formatStatusDisplay(task.status)}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-gray-600 mb-4 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</span>
                        <span>Assigned: {task.assigned_name || 'You'}</span>
                        {task.related_to !== 'general' && (
                          <span>Related: {task.related_to}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-6">
                      <select 
                        value={task.status} 
                        onChange={e => handleStatusChange(task.id, e.target.value)} 
                        className={`text-sm font-medium rounded-xl px-3 py-2 border-0 focus:ring-2 focus:ring-blue-500 ${getStatusColor(task.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleEdit(task)} 
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(task.id)} 
                          className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Page {pagination.currentPage} of {pagination.totalPages} 
                {pagination.totalTasks !== undefined && ` • ${pagination.totalTasks} total tasks`}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(currentPage - 1)} 
                  disabled={!pagination.hasPrev} 
                  className={`px-4 py-2 border rounded-xl font-medium transition-all duration-200 ${
                    pagination.hasPrev 
                      ? 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:shadow-md' 
                      : 'border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Previous
                </button>
                <button 
                  onClick={() => setCurrentPage(currentPage + 1)} 
                  disabled={!pagination.hasNext} 
                  className={`px-4 py-2 border rounded-xl font-medium transition-all duration-200 ${
                    pagination.hasNext 
                      ? 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:shadow-md' 
                      : 'border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Task Form Modal */}
        {isModalOpen && (
          <TaskForm 
            task={editingTask} 
            onSubmit={handleSubmit} 
            onCancel={() => { setIsModalOpen(false); setEditingTask(null); }} 
            loading={createTask.isLoading || updateTask.isLoading}
          />
        )}
      </div>
    </div>
  );
};

// TaskForm component remains the same as your original
const TaskForm = ({ task, onSubmit, onCancel, loading = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    status: 'pending',
    assigned_to: '',
    related_to: 'general',
    related_id: ''
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        assigned_to: task.assigned_to ?? '',
        related_to: task.related_to || 'general',
        related_id: task.related_id ?? ''
      });
    }
  }, [task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      title: formData.title,
      description: formData.description,
      due_date: formData.due_date,
      priority: formData.priority,
      status: formData.status,
      assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
      related_to: formData.related_to,
      related_id: formData.related_id ? Number(formData.related_id) : null
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {task ? 'Edit Task' : 'Add New Task'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input 
              type="text" 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              placeholder="Task title" 
              required 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Task description" 
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-vertical"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
            <input 
              type="date" 
              name="due_date" 
              value={formData.due_date} 
              onChange={handleChange} 
              required 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select 
                name="priority" 
                value={formData.priority} 
                onChange={handleChange} 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select 
                name="status" 
                value={formData.status} 
                onChange={handleChange} 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Related To</label>
              <select 
                name="related_to" 
                value={formData.related_to} 
                onChange={handleChange} 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
              >
                <option value="general">General</option>
                <option value="deal">Deal</option>
                <option value="contact">Contact</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Related ID</label>
              <input 
                type="number" 
                name="related_id" 
                value={formData.related_id} 
                onChange={handleChange} 
                placeholder="Related ID" 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign To User ID</label>
            <input 
              type="number" 
              name="assigned_to" 
              value={formData.assigned_to} 
              onChange={handleChange} 
              placeholder="User ID" 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={onCancel} 
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Tasks;
