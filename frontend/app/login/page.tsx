'use client';

import { useState } from 'react';

export const dynamic = 'force-dynamic';

// Define user type to route mapping
const getRedirectPath = (role: string): string => {
  const roleMap: { [key: string]: string } = {
    'admin': '/admin/students',
    'super_admin': '/admin/students',
    'teacher': '/teacher/dashboard',
    'student': '/student/dashboard',
    'parent': '/parent/dashboard',
    'staff': '/staff/dashboard'
  };
  return roleMap[role] || '/';
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user data
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        
        // Get the redirect path based on user role
        const redirectPath = getRedirectPath(data.user.role);
        console.log(`User role: ${data.user.role}, Redirecting to: ${redirectPath}`);
        
        // Redirect based on role
        window.location.href = redirectPath;
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">SSS</span>
          </div>
          <h1 className="text-3xl font-bold text-white">SSS School Admin</h1>
          <p className="text-white/60 mt-2">Sign in to access the dashboard</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-2 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40"
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-white/40 text-xs">Demo: admin@sss.com / admin123 (Admin)</p>
        </div>

        <p className="text-white/30 text-xs text-center mt-6">
          Secure login powered by JWT authentication
        </p>
      </div>
    </div>
  );
}
