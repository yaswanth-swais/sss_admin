'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  BookOpen,
  Settings, 
  GraduationCap,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SessionManager from '../../components/SessionManager';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  const menuItems = [
    { id: 'students', name: 'Students', icon: Users, path: '/admin/students', color: 'from-blue-500 to-cyan-500' },
    { id: 'teachers', name: 'Teachers', icon: BookOpen, path: '/admin/teachers', color: 'from-green-500 to-emerald-500' },
    { id: 'others', name: 'Others', icon: Settings, path: '/admin/others', color: 'from-purple-500 to-pink-500' },
  ];

  return (
    <SessionManager>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        {/* Sidebar - same as before */}
        <motion.aside 
          initial={false}
          animate={{ width: sidebarOpen ? '280px' : '80px' }}
          className="fixed left-0 top-0 h-full bg-white/5 backdrop-blur-xl border-r border-white/10 z-50"
        >
          {/* Sidebar content - same as before */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-10">
              {sidebarOpen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3"
                >
                  <div className="p-2 rounded-xl">
                    <img className="rounded-xl w-13 h-13" src="https://www.image2url.com/r2/default/images/1780034724660-ae70f995-be5a-4e65-a6bd-4afb19e192d7.jpg"/>
                  </div>
                  <div>
                    <h1 className="text-white font-bold text-xl">SSS School</h1>
                    <p className="text-white/40 text-xs">Admin Portal</p>
                  </div>
                </motion.div>
              )}
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-white/70 hover:text-white transition-colors"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            <nav className="space-y-2">
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
          </div>

          <div className="absolute bottom-8 left-0 right-0 px-6">
            {sidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-white/5 rounded-xl border border-white/10"
              >
                <p className="text-white/30 text-xs text-center">
                  © 2026 SSS School<br />
                  Management System
                </p>
              </motion.div>
            )}
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-[280px]' : 'ml-[80px]'}`}>
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </SessionManager>
  );
}
