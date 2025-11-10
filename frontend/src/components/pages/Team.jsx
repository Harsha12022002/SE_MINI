import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { teamAPI } from '../../services/api';

const Team = () => {
  const [activeTab, setActiveTab] = useState('members');
  const [taskStatusFilter, setTaskStatusFilter] = useState('');
  const [interactionTypeFilter, setInteractionTypeFilter] = useState('');

  // Fetch team members
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: teamAPI.getAll,
  });

  // Fetch team tasks (for managers/admins)
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['team-tasks', taskStatusFilter],
    queryFn: () => teamAPI.getTasks({ status: taskStatusFilter }),
    enabled: activeTab === 'tasks',
  });

  // Fetch team interactions
  const { data: interactionsData, isLoading: interactionsLoading } = useQuery({
    queryKey: ['team-interactions', interactionTypeFilter],
    queryFn: () => teamAPI.getInteractions({ action_type: interactionTypeFilter }),
    enabled: activeTab === 'activities',
  });

  // Fetch team performance (for managers/admins)
  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ['team-performance'],
    queryFn: teamAPI.getPerformance,
    enabled: activeTab === 'performance',
  });

  // Fetch user dashboard
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['team-dashboard'],
    queryFn: teamAPI.getDashboard,
    enabled: activeTab === 'dashboard',
  });

  const members = membersData || [];
  const tasks = tasksData?.tasks || [];
  const interactions = interactionsData?.interactions || [];
  const performance = performanceData || {};
  const dashboard = dashboardData || {};

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-600">Manage your team and track performance</p>
        </div>
        <div className="text-sm text-gray-500">
          Total Members: {members.length}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { id: 'members', name: 'Team Members' },
              { id: 'tasks', name: 'Team Tasks' },
              { id: 'activities', name: 'Activities' },
              { id: 'performance', name: 'Performance' },
              { id: 'dashboard', name: 'My Dashboard' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Team Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
              {membersLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(item => (
                    <div key={item} className="flex items-center space-x-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">👥</div>
                  <p className="text-gray-500">No team members found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {members.map((member) => (
                    <div key={member.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {member.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{member.username}</h4>
                          <p className="text-sm text-gray-600">{member.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              member.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              member.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {member.role}
                            </span>
                            <span className="text-xs text-gray-500">
                              Last login: {member.last_login ? new Date(member.last_login).toLocaleDateString() : 'Never'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Team Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Team Tasks</h3>
                <select
                  value={taskStatusFilter}
                  onChange={(e) => setTaskStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              {tasksLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(item => (
                    <div key={item} className="flex items-center space-x-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">✅</div>
                  <p className="text-gray-500">No team tasks found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <p className="text-sm text-gray-600">
                          Assigned to: {task.assigned_name} • 
                          Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                        </p>
                        {task.related_title && (
                          <p className="text-xs text-gray-500">Related to: {task.related_title}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {task.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">Priority: {task.priority}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Team Activities</h3>
                <select
                  value={interactionTypeFilter}
                  onChange={(e) => setInteractionTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Actions</option>
                  <option value="create">Created</option>
                  <option value="update">Updated</option>
                  <option value="delete">Deleted</option>
                </select>
              </div>
              
              {interactionsLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(item => (
                    <div key={item} className="flex items-center space-x-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : interactions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📝</div>
                  <p className="text-gray-500">No team activities found</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {interactions.map((interaction) => (
                    <div key={interaction.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-semibold">
                        {interaction.user_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{interaction.user_name}</span> 
                          {' '}{interaction.action_type}d {interaction.target_type}
                        </p>
                        <p className="text-xs text-gray-600">{interaction.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(interaction.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Team Performance</h3>
              
              {performanceLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(item => (
                    <div key={item} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <>
                  {/* User Performance */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4">User Performance</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {performance.userPerformance?.map((user) => (
                        <div key={user.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium text-gray-900">{user.username}</h5>
                              <p className="text-sm text-gray-600">{user.email} • {user.role}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              ${Number(user.total_revenue || 0).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-center">
                            <div>
                              <p className="text-2xl font-bold text-blue-600">{user.total_deals || 0}</p>
                              <p className="text-xs text-gray-600">Total Deals</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-600">{user.won_deals || 0}</p>
                              <p className="text-xs text-gray-600">Won Deals</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-purple-600">{user.total_tasks || 0}</p>
                              <p className="text-xs text-gray-600">Tasks</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-orange-600">{user.completed_tasks || 0}</p>
                              <p className="text-xs text-gray-600">Completed</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Activity Summary */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4">Activity Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {performance.activitySummary?.map((activity) => (
                        <div key={activity.action_type} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-gray-900">{activity.count}</p>
                          <p className="text-sm text-gray-600 capitalize">{activity.action_type}s</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">My Dashboard</h3>
              
              {dashboardLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(item => (
                    <div key={item} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">{dashboard.quickStats?.pending_deals || 0}</p>
                      <p className="text-sm text-blue-700">Pending Deals</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-yellow-600">{dashboard.quickStats?.pending_tasks || 0}</p>
                      <p className="text-sm text-yellow-700">Pending Tasks</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{dashboard.quickStats?.new_leads || 0}</p>
                      <p className="text-sm text-green-700">New Leads</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-purple-600">${Number(dashboard.quickStats?.monthly_revenue || 0).toLocaleString()}</p>
                      <p className="text-sm text-purple-700">Monthly Revenue</p>
                    </div>
                  </div>

                  {/* Upcoming Deadlines */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4">Upcoming Deadlines</h4>
                    {dashboard.upcomingDeadlines?.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No upcoming deadlines</p>
                    ) : (
                      <div className="space-y-2">
                        {dashboard.upcomingDeadlines?.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{item.title}</p>
                              <p className="text-sm text-gray-600 capitalize">{item.type}</p>
                            </div>
                            <p className="text-sm text-gray-500">
                              {new Date(item.due_date).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Activities */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4">Recent Activities</h4>
                    {dashboard.recentActivities?.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No recent activities</p>
                    ) : (
                      <div className="space-y-2">
                        {dashboard.recentActivities?.map((activity) => (
                          <div key={activity.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-semibold">
                              {activity.user_name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">{activity.user_name}</span> 
                                {' '}{activity.action_type}d {activity.target_type}
                              </p>
                              <p className="text-xs text-gray-600">{activity.description}</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              {new Date(activity.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Team;
