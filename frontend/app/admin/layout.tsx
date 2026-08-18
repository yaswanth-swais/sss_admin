'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  BookOpen,
  Settings,
  Menu,
  X,  
  LogOut
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout from this page?')) {
      localStorage.clear();
      sessionStorage.clear();
      // Redirect to SSS login portal
      window.location.href = 'https://staging.sss.swais.in';
    }
  };

  const menuItems = [
    { id: 'students', name: 'Students', icon: Users, path: '/admin/students', color: 'from-blue-500 to-cyan-500' },
    { id: 'teachers', name: 'Teachers', icon: BookOpen, path: '/admin/teachers', color: 'from-green-500 to-emerald-500' },
    { id: 'others', name: 'Others', icon: Settings, path: '/admin/others', color: 'from-purple-500 to-pink-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? '280px' : '80px' }}
        className="fixed left-0 top-0 h-full bg-white/5 backdrop-blur-xl border-r border-white/10 z-50 overflow-hidden"
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            {sidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center w-full"
              >
                {/* SSS Logo */}
                <div className="w-20 h-20 relative rounded-full overflow-hidden border-2 border-yellow-400/40 shadow-lg shadow-yellow-500/20 bg-white/5 flex-shrink-0">
                  <img
                    src="https://www.image2url.com/r2/default/images/1780034724660-ae70f995-be5a-4e65-a6bd-4afb19e192d7.jpg"
                    alt="SSS School Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center mt-2">
                  <h1 className="text-white font-bold text-xl">SSS School</h1>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider">Admin Portal</p>
                </div>
              </motion.div>
            )}
            {!sidebarOpen && (
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <Menu size={24} />
              </button>
            )}
          </div>

          <nav className="space-y-2 flex-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link href={item.path} key={item.id}>
                  <motion.div
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                      isActive 
                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg` 
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <item.icon size={20} />
                    {sidebarOpen && <span className="font-medium">{item.name}</span>}
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button - Fixed at bottom */}
          <div className="pt-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <LogOut size={20} />
              {sidebarOpen && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-[280px]' : 'ml-[80px]'}`}>
        {/* Welcome Header with Logo */}
        <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span>👋</span>
                  Welcome, Admin!
                </h2>
                <p className="text-white/50 text-sm mt-1">
                  Here's what's happening with SSS School today
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* SSS Logo in Header */}
                <div className="w-12 h-12 relative rounded-full overflow-hidden border border-yellow-400/20 flex-shrink-0">
                  <img
                    src="https://www.image2url.com/r2/default/images/1780034724660-ae70f995-be5a-4e65-a6bd-4afb19e192d7.jpg"
                    alt="SSS School Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-right">
                  <p className="text-white text-sm font-medium">Admin</p>
                  <p className="text-white/40 text-xs">SSS School</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
