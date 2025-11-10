import React from 'react';

const ContactStats = ({ stats }) => {
  console.log('ContactStats received:', stats);

  // If stats is null/undefined or not an array, show loading
  if (!stats || typeof stats !== 'object') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  // If your stats is an object with total, leads, prospects, customers properties
  if (stats.total !== undefined) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Contacts */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Contacts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
            </div>
            <div className="text-2xl"></div>
          </div>
        </div>

        {/* Leads */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.leads || 0}</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          </div>
        </div>

        {/* Prospects */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Prospects</p>
              <p className="text-2xl font-bold text-gray-900">{stats.prospects || 0}</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Customers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.customers || 0}</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
        </div>
      </div>
    );
  }

  // If your stats is an array (fallback)
  const totalContacts = Array.isArray(stats) ? stats.reduce((sum, item) => sum + (item.count || 0), 0) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Total Contacts */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Contacts</p>
            <p className="text-2xl font-bold text-gray-900">{totalContacts}</p>
          </div>
          <div className="text-2xl"></div>
        </div>
      </div>

      {/* Status Breakdown */}
      {Array.isArray(stats) && stats.map((stat) => {
        const getStatusInfo = (status) => {
          switch (status) {
            case 'lead':
              return { color: 'bg-yellow-500', label: 'Leads' };
            case 'prospect':
              return { color: 'bg-blue-500', label: 'Prospects' };
            case 'customer':
              return { color: 'bg-green-500', label: 'Customers' };
            default:
              return { color: 'bg-gray-500', label: status };
          }
        };

        const statusInfo = getStatusInfo(stat.status);
        return (
          <div key={stat.status} className="bg-white rounded-lg shadow p-6 border-l-4 border-gray-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{statusInfo.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.count || 0}</p>
              </div>
              <div className={⁠ w-3 h-3 rounded-full ${statusInfo.color} ⁠}></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ContactStats;
