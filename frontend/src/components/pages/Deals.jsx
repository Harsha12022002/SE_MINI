import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const Deals = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    value: '',
    stage_id: 1,
    outcome: 'pending',
    close_date: '',
    contact_id: ''
  });

  const API_URL = 'http://localhost:5000/api';

  const getAuthHeader = () => {
    const token = localStorage.getItem('authToken');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // ✅ useCallback prevents ESLint missing-dependency warning
  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/deals`, getAuthHeader());
      console.log('Created deal:', res.data);

      setDeals(res.data.deals || []);
    } catch (err) {
      console.error('Error fetching deals:', err);
      alert(err.response?.data?.message || 'Failed to fetch deals');
    }
    setLoading(false);
  }, [API_URL]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const createDeal = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      title: formData.title,
      description: formData.description || '',
      value: formData.value ? parseFloat(formData.value) : null,
      stage_id: parseInt(formData.stage_id, 10),
      outcome: formData.outcome || 'pending',
      close_date: formData.close_date || null,
      contact_id: formData.contact_id ? parseInt(formData.contact_id, 10) : null
    };

    try {
      await axios.post(`${API_URL}/deals`, payload, getAuthHeader());
      alert('Deal created successfully!');
      setFormData({
        title: '',
        description: '',
        value: '',
        stage_id: 1,
        outcome: 'pending',
        close_date: '',
        contact_id: ''
      });
      setShowForm(false);
      fetchDeals();
    } catch (err) {
      console.error('Error creating deal:', err);
      alert(err.response?.data?.message || 'Failed to create deal');
    }

    setLoading(false);
  };

  const getOutcomeColor = (outcome) => {
    switch (outcome) {
      case 'won': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'lost': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  const getStageColor = (stageId) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-emerald-100 text-emerald-800 border-emerald-200'
    ];
    return colors[stageId - 1] || colors[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Deals Pipeline
            </h1>
            <p className="text-gray-600 mt-2">Manage your sales deals and track progress</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 font-semibold"
          >
            <span>{showForm ? "✕" : "+"}</span>
            <span>{showForm ? "Cancel" : "Add Deal"}</span>
          </button>
        </div>

        {/* Add Deal Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Create New Deal</h3>
            <form onSubmit={createDeal}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Deal title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Value ($)</label>
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stage ID *</label>
                  <input
                    type="number"
                    name="stage_id"
                    value={formData.stage_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    name="outcome"
                    value={formData.outcome}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Close Date</label>
                  <input
                    type="date"
                    name="close_date"
                    value={formData.close_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact ID</label>
                  <input
                    type="number"
                    name="contact_id"
                    value={formData.contact_id}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="1"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-vertical"
                    placeholder="Deal description"
                    rows="3"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    'Create Deal'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Deals List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Deals Pipeline ({deals.length})</h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Loading deals...</p>
            </div>
          ) : (
            <div className="p-6">
              {deals.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl text-gray-400">💼</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No deals found</h3>
                  <p className="text-gray-600 mb-6">Get started by creating your first deal.</p>
                  <button 
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
                  >
                    + Add Deal
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {deals.map(deal => (
                    <div key={deal.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-gray-900 text-lg flex-1 pr-4">{deal.title}</h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getOutcomeColor(deal.outcome)}`}>
                          {deal.outcome}
                        </span>
                      </div>
                      
                      {deal.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{deal.description}</p>
                      )}
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Value</span>
                          <span className="text-lg font-bold text-gray-900">
                            ${deal.value ? Number(deal.value).toLocaleString() : '0'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Stage</span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStageColor(deal.stage_id)}`}>
                            {deal.stage_name || `Stage ${deal.stage_id}`}
                          </span>
                        </div>
                        
                        {deal.close_date && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Close Date</span>
                            <span className="text-sm text-gray-600">{new Date(deal.close_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Deals;
