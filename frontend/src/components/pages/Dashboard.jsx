import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsAPI } from "../../services/api";

const Dashboard = () => {
  const { data: kpisData, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => reportsAPI.getKPIs('month')
  });

  const { data: forecastData, isLoading: forecastLoading } = useQuery({
    queryKey: ['dashboard-forecast'],
    queryFn: () => reportsAPI.getForecast(3)
  });

  if (kpisLoading || forecastLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpisData?.map(kpi => (
          <div key={kpi.kpi_name} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
              {kpi.kpi_name.replace('_', ' ')}
            </h3>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Sales Forecast</h2>
        <div className="space-y-4">
          {forecastData?.map(forecast => (
            <div key={forecast.month} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
              <span className="text-gray-700 font-medium">{forecast.month}</span>
              <span className="text-lg font-semibold text-blue-600">${forecast.forecasted_value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
