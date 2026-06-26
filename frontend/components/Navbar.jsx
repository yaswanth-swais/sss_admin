'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import SolutionsMegaMenu from './SolutionsMegaMenu';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSelector(state => state.user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [solutionsMenuOpen, setSolutionsMenuOpen] = useState(false);

  // Determine if we're technically "logged in" based on Redux state
  const isLoggedIn = !!user;

  const links = [
    { name: 'Home', path: '/' },
    { name: 'Platform', path: '/platform' },
    { name: 'Solutions', path: '/solutions' },
    { name: 'Industries', path: '/industries' },
    { name: 'Academy', path: '/academy' },
    { name: 'Collaborations', path: '/collaborations' },
    { name: 'Company', path: '/company' },
    { name: 'Insights', path: '/insights' },
    { name: 'Contact', path: '/contact' },
  ];

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="shrink-0 group flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
            <span className="font-bold text-2xl tracking-tight text-gradient">SWAIS</span>
          </Link>

          <div className="hidden xl:block">
            <div className="ml-10 flex items-baseline space-x-1">
              {links.map(link => (
                link.name === 'Solutions' ? (
                  <button
                    key={link.name}
                    type="button"
                    onClick={() => setSolutionsMenuOpen(true)}
                    className={`nav-btn ${solutionsMenuOpen ? 'active' : ''}`}
                  >
                    {link.name}
                  </button>
                ) : (
                  <Link
                    key={link.name}
                    href={link.path}
                    className={`nav-btn ${pathname === link.path ? 'active' : ''}`}
                  >
                    {link.name}
                  </Link>
                )
              ))}
            </div>
          </div>

          <div className="hidden xl:flex gap-4 items-center">
            {isLoggedIn ? (
              <Link href="/dashboard" className="px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-400 hover:to-purple-400 transition-all text-sm font-semibold tracking-wide shadow-lg shadow-cyan-500/20">
                Go to Dashboard
              </Link>
            ) : (
              <button 
                onClick={handleLogin}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-400 hover:to-purple-400 transition-all text-sm font-semibold tracking-wide shadow-lg shadow-cyan-500/20"
              >
                Get Started
              </button>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="xl:hidden p-2 rounded-lg text-slate-400 hover:bg-white/5 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-white/5 bg-[#0a0a0f]/95 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-1">
            {links.map(link => (
              link.name === 'Solutions' ? (
                <button
                  key={link.name}
                  type="button"
                  onClick={() => { setSolutionsMenuOpen(true); setMobileMenuOpen(false); }}
                  className="block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-slate-400 hover:text-slate-200 hover:bg-white/5"
                >
                  {link.name}
                </button>
              ) : (
                <Link
                  key={link.name}
                  href={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname === link.path ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                >
                  {link.name}
                </Link>
              )
            ))}
            <div className="pt-3 mt-3 border-t border-white/5">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-semibold"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <button
                  onClick={() => { handleLogin(); setMobileMenuOpen(false); }}
                  className="w-full px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-semibold"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {solutionsMenuOpen && (
        <SolutionsMegaMenu onClose={() => setSolutionsMenuOpen(false)} />
      )}
    </nav>
  );
}
