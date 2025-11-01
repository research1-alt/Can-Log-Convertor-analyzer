import React, { useState } from 'react';
import { User } from '../types';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { UserIcon } from './icons/UserIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';

interface UserManagementPanelProps {
  users: User[];
  onAddUser: (email: string, password: string) => Promise<string | null>;
  onDeleteUser: (email: string) => Promise<void>;
}

const PasswordStrengthIndicator: React.FC<{ password?: string }> = ({ password = '' }) => {
    const getStrength = () => {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return score;
    };

    const strength = getStrength();
    const width = `${(strength / 5) * 100}%`;
    const color = strength < 3 ? 'bg-red-500' : strength < 5 ? 'bg-yellow-500' : 'bg-green-500';

    if (!password) return null;

    return (
        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div className={`h-1.5 rounded-full ${color} transition-all duration-300`} style={{ width }}></div>
        </div>
    );
};

export const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ users, onAddUser, onDeleteUser }) => {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword) {
      setError("Email and password cannot be empty.");
      return;
    }
    if (newUserPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const apiError = await onAddUser(newUserEmail, newUserPassword);
    if (apiError) {
      setError(apiError);
    } else {
      setNewUserEmail('');
      setNewUserPassword('');
    }
    setIsSubmitting(false);
  };

  const standardUsers = users.filter(u => u.role === 'user');

  return (
    <div className="space-y-6">
      <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-md">
        <p><span className="font-bold">Security Notice:</span> This user management system is for demonstration purposes. In a production environment, user data and authentication should be handled by a secure backend server with password hashing.</p>
      </div>

      {/* Add New User Form */}
      <form onSubmit={handleAddUser} className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
            <UserIcon className="w-5 h-5 text-gray-600"/>
            <span>Create New User</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <input
            type="email"
            placeholder="User's Email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-secondary"
            required
          />
          <div>
            <input
              type="password"
              placeholder="Password (min. 8 characters)"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-secondary w-full"
              required
            />
            <PasswordStrengthIndicator password={newUserPassword} />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-brand-primary text-white font-bold rounded-md hover:bg-blue-800 transition-colors disabled:bg-gray-400 self-end"
          >
            {isSubmitting ? 'Adding...' : 'Add User'}
          </button>
        </div>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </form>
      
      {/* Existing Users List */}
      <div className="p-4 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
            <UserGroupIcon className="w-5 h-5 text-gray-600"/>
            <span>Manage Users</span>
        </h3>
        <div className="space-y-2">
          {standardUsers.length > 0 ? (
            standardUsers.map(user => (
              <div key={user.email} className="flex items-center justify-between p-3 bg-white rounded-md border">
                <span className="text-gray-700">{user.email}</span>
                <button
                  onClick={() => onDeleteUser(user.email)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 font-semibold rounded-md hover:bg-red-200 transition-colors"
                >
                  Delete
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No standard users have been created yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};