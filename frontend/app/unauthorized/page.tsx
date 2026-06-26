'use client';

import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 w-full max-w-md border border-white/20 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-white/60 mb-6">
          You don't have permission to access this page. This area is restricted to admin users only.
        </p>
        <Link
          href="/"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors inline-block"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
