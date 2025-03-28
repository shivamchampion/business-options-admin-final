import React from 'react';
import { 
  Shield, 
  Users, 
  Edit3, 
  Key, 
  Lock, 
  ShieldCheck, 
  UserCheck, 
  AlertTriangle 
} from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import Button from '@/components/ui/Button';
import ErrorBoundary from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';

// This is a placeholder for the User Roles page
// It will be implemented later with actual role management functionality

export default function UserRoles() {
  usePageTitle('User Roles');
  
  const roles = [
    {
      name: 'Super Admin',
      description: 'Full access to all features and settings. Cannot be created or deleted.',
      icon: <Shield className="h-8 w-8 text-purple-500" />,
      userCount: 1,
      color: 'bg-purple-50 border-purple-200',
      permissions: [
        'Manage all users and roles',
        'Access all platform settings',
        'Manage all content & listings',
        'View all analytics & reports',
        'Configure payment gateways',
        'System-level configuration'
      ]
    },
    {
      name: 'Admin',
      description: 'Administrative access with limitations on system-level settings.',
      icon: <ShieldCheck className="h-8 w-8 text-blue-500" />,
      userCount: 5,
      color: 'bg-blue-50 border-blue-200',
      permissions: [
        'Manage regular users',
        'Manage content & listings',
        'View analytics & reports',
        'Configure email templates',
        'Manage advisor commissions',
        'Process applications'
      ]
    },
    {
      name: 'Moderator',
      description: 'Permissions to manage content and user-generated content.',
      icon: <Edit3 className="h-8 w-8 text-teal-500" />,
      userCount: 12,
      color: 'bg-teal-50 border-teal-200',
      permissions: [
        'Approve/reject listings',
        'Moderate user content',
        'Process applications',
        'View basic reports',
        'Limited user management',
        'No financial access'
      ]
    },
    {
      name: 'Advisor',
      description: 'Business advisors with limited administrative access.',
      icon: <UserCheck className="h-8 w-8 text-indigo-500" />,
      userCount: 28,
      color: 'bg-indigo-50 border-indigo-200',
      permissions: [
        'Manage assigned listings',
        'View commission reports',
        'Process assigned applications',
        'View advisor dashboard',
        'Limited customer management',
        'No system configuration'
      ]
    }
  ];
  
  return (
    <ErrorBoundary>
      <div>
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Roles</h1>
            <p className="mt-1 text-sm text-gray-500">Manage and configure user roles and permissions in the system</p>
          </div>
        </div>
        
        {/* Coming soon message */}
        <div className="mb-6 p-4 border border-yellow-200 bg-yellow-50 rounded-lg flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-700">
            <p className="font-medium mb-1">Role Management - Coming Soon</p>
            <p>
              The role management functionality is currently in development. This page shows the planned roles and their permissions but does not allow modification yet.
            </p>
          </div>
        </div>
        
        {/* Roles grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <div key={role.name} className={cn("border rounded-lg overflow-hidden", role.color)}>
              <div className="p-6">
                <div className="flex items-start">
                  <div className="mr-4">
                    {role.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{role.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                    <div className="mt-2 flex items-center">
                      <Users className="h-4 w-4 text-gray-500 mr-1" />
                      <span className="text-sm text-gray-600">{role.userCount} users</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Key className="h-4 w-4 mr-1" />
                    Permissions
                  </h4>
                  <ul className="text-sm space-y-2">
                    {role.permissions.map((permission, index) => (
                      <li key={index} className="flex items-center">
                        <Lock className="h-3 w-3 text-gray-400 mr-2" />
                        {permission}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-3 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit3 className="h-4 w-4" />}
                  disabled={role.name === 'Super Admin'}
                >
                  Edit Role
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );
}