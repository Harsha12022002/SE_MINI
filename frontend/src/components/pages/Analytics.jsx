import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsAPI } from '../../services/api';

const Analytics = () => {
  const [period, setPeriod] = useState('month');
  const [forecastMonths, setForecastMonths] = useState(3);
  const [exportLoading, setExportLoading] = useState(false);

  const { data: kpisData, isLoading: kpisLoading } = useQuery({
    queryKey: ['analytics-kpis', period],
    queryFn: () => reportsAPI.getKPIs(period),
  });

  const { data: forecastData, isLoading: forecastLoading } = useQuery({
    queryKey: ['analytics-forecast', forecastMonths],
    queryFn: () => reportsAPI.getForecast(forecastMonths),
  });

  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: ['analytics-insights'],
    queryFn: () => reportsAPI.getInsights(),
  });

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Please log in to export data');
        return;
      }

      // FIXED: Proper template literal syntax
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(
        `${apiUrl}/reports/export/deals`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `deals-export-${new Date().toISOString().split('T')[0]}.csv`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const kpis = kpisData?.reduce((acc, kpi) => {
    acc[kpi.kpi_name] = Number(kpi.value);
    return acc;
  }, {}) || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Track your sales performance and insights in real-time</p>
        </div>
        
        <div className="flex items-center space-x-4 bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
          <span className="text-sm font-medium text-gray-700">Period:</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 text-sm border-0 bg-transparent focus:ring-2 focus:ring-blue-500 rounded-lg"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Deals</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {kpisLoading ? '...' : kpis.total_deals ?? 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl text-blue-600">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Won Deals</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {kpisLoading ? '...' : kpis.won_deals ?? 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl text-green-600">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Value</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {kpisLoading ? '...' : `$${(kpis.total_value ?? 0).toLocaleString()}`}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl text-purple-600">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Conversion Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {kpisLoading ? '...' : `${(kpis.conversion_rate ?? 0).toFixed(1)}%`}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl text-orange-600">📈</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Forecast Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Forecast */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Sales Forecast</h3>
            <select
              value={forecastMonths}
              onChange={(e) => setForecastMonths(parseInt(e.target.value))}
              className="px-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value={1}>1 Month</option>
              <option value={3}>3 Months</option>
              <option value={6}>6 Months</option>
            </select>
          </div>
          
          {forecastLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(item => (
                <div key={item} className="flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 rounded flex-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : forecastData?.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-gray-400">📅</span>
              </div>
              <p className="text-gray-500 font-medium">No forecast data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {forecastData?.map((forecast, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-lg">📊</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">{forecast.month}</span>
                      <p className="text-sm text-gray-500">{forecast.deal_count} deals</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      ${Number(forecast.forecasted_value || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Insights */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Deals</h3>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-sm text-blue-600">🔥</span>
            </div>
          </div>
          
          {insightsLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map(item => (
                <div key={item} className="flex items-center space-x-4">
                  <div className="h-12 bg-gray-200 rounded-xl flex-1"></div>
                </div>
              ))}
            </div>
          ) : insightsData?.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-gray-400">🔍</span>
              </div>
              <p className="text-gray-500 font-medium">No deals data available</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {insightsData?.slice(0, 10).map((deal) => (
                <div key={deal.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{deal.title}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {deal.stage_name} • {deal.days_in_pipeline} days
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-gray-900 text-lg">
                      ${Number(deal.value || 0).toLocaleString()}
                    </p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      deal.outcome === 'won' ? 'bg-green-100 text-green-800' :
                      deal.outcome === 'lost' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {deal.outcome || 'pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Data Export</h3>
            <p className="text-gray-600 mt-1">Export your deals data for external analysis and reporting</p>
          </div>
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <span className="text-lg">📥</span>
                <span>Export to CSV</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;