import React from 'react';

const ContactList = ({ 
  contacts, 
  loading, 
  onEdit, 
  onDelete, 
  pagination, 
  currentPage, 
  onPageChange 
}) => {
  console.log('📋 ContactList received:', { contacts, loading });
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center space-x-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-400 text-6xl mb-4">👥</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No contacts found</h3>
        <p className="text-gray-500">Get started by creating your first contact.</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'lead': return 'bg-yellow-100 text-yellow-800';
      case 'prospect': return 'bg-blue-100 text-blue-800';
      case 'customer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {contact.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {contact.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {contact.company || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={⁠ inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(contact.status)} ⁠}>
                    {contact.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {contact.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(contact)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(contact.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {currentPage} of {pagination.totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={!pagination.hasPrev}
                className={`px-3 py-1 text-sm border rounded ${
                  pagination.hasPrev
                    ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    : 'border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!pagination.hasNext}
                className={`px-3 py-1 text-sm border rounded ${
                  pagination.hasNext
                    ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    : 'border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactList;
