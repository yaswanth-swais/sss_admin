"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  BookOpen,
  Settings,
  Menu,
  LogOut,
} from "lucide-react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  LanguageProvider,
  useLanguage,
} from "../context/LanguageContext";

/* -------------------------------------------------------------------------- */
/*                          ADMIN LAYOUT TEXTS                                 */
/* -------------------------------------------------------------------------- */

const adminTexts = {
  welcome: "Welcome, Admin!",
  subtitle: "Here's what's happening with SSS School today",

  students: "Students",
  teachers: "Teachers",
  others: "Others",

  logout: "Logout",

  schoolName: "SSS School",
  adminPortal: "Admin Portal",
  adminRole: "Admin",
};

/* -------------------------------------------------------------------------- */
/*                          ADMIN LAYOUT CONTENT                               */
/* -------------------------------------------------------------------------- */

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const {
    language,
    setLanguage,
    translateBulk,
    translations,
    translating,
  } = useLanguage();

  const pathname = usePathname();
  const router = useRouter();

  /* ---------------------------------------------------------------------- */
  /*                         BULK TRANSLATION                               */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    translateBulk(adminTexts);
  }, [language]);

  /* ---------------------------------------------------------------------- */
  /*                              LOGOUT                                    */
  /* ---------------------------------------------------------------------- */

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();

    router.push("/login");
  };

  /* ---------------------------------------------------------------------- */
  /*                          SIDEBAR MENU                                   */
  /* ---------------------------------------------------------------------- */

  const menuItems = [
    {
      id: "students",
      name: adminTexts.students,
      icon: Users,
      path: "/admin/students",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "teachers",
      name: adminTexts.teachers,
      icon: BookOpen,
      path: "/admin/teachers",
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "others",
      name: adminTexts.others,
      icon: Settings,
      path: "/admin/others",
      color: "from-purple-500 to-pink-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* ------------------------------------------------------------------ */}
      {/*                              SIDEBAR                               */}
      {/* ------------------------------------------------------------------ */}

      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? "280px" : "80px",
        }}
        className="fixed left-0 top-0 h-full bg-white/5 backdrop-blur-xl border-r border-white/10 z-50"
      >
        <div className="p-6">
          {/* LOGO + SCHOOL NAME */}

          <div className="flex items-center justify-between mb-8">
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center w-full"
              >
                <div className="w-20 h-20 relative rounded-full overflow-hidden border-2 border-yellow-400/40 bg-white/5">
                  <img
                    src="https://www.image2url.com/r2/default/images/1780034724660-ae70f995-be5a-4e65-a6bd-4afb19e192d7.jpg"
                    alt="SSS School Logo"
                    className="object-cover"
                  />
                </div>

                <div className="text-center mt-2">
                  <h1 className="text-white font-bold text-xl">
                    {translations.schoolName ||
                      adminTexts.schoolName}
                  </h1>

                  <p className="text-white/40 text-[10px] uppercase">
                    {translations.adminPortal ||
                      adminTexts.adminPortal}
                  </p>
                </div>
              </motion.div>
            )}

            {!sidebarOpen && (
              <button
                onClick={() =>
                  setSidebarOpen(!sidebarOpen)
                }
                className="text-white/70 hover:text-white"
              >
                <Menu size={24} />
              </button>
            )}
          </div>

          {/* -------------------------------------------------------------- */}
          {/*                            MENU                                */}
          {/* -------------------------------------------------------------- */}

          <nav className="space-y-2 mt-4">
            {menuItems.map((item) => {
              const isActive =
                pathname === item.path;

              return (
                <Link
                  href={item.path}
                  key={item.id}
                >
                  <motion.div
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <item.icon size={20} />

                    {sidebarOpen && (
                      <span className="font-medium">
                        {translations[item.id] ||
                          item.name}
                      </span>
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* -------------------------------------------------------------- */}
        {/*                            LOGOUT                              */}
        {/* -------------------------------------------------------------- */}

        <div className="absolute bottom-12 left-0 right-0 px-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/10"
          >
            <LogOut size={20} />

            {sidebarOpen && (
              <span className="font-medium">
                {translations.logout ||
                  adminTexts.logout}
              </span>
            )}
          </button>
        </div>
      </motion.aside>

      {/* ------------------------------------------------------------------ */}
      {/*                             MAIN                                  */}
      {/* ------------------------------------------------------------------ */}

      <main
        className={`transition-all duration-300 ${
          sidebarOpen
            ? "ml-[280px]"
            : "ml-[80px]"
        }`}
      >
        {/* -------------------------------------------------------------- */}
        {/*                           HEADER                               */}
        {/* -------------------------------------------------------------- */}

        <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              {/* LEFT SIDE */}

              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span>👋</span>

                  {translations.welcome ||
                    adminTexts.welcome}
                </h2>

                <p className="text-white/50 text-sm mt-1">
                  {translations.subtitle ||
                    adminTexts.subtitle}
                </p>
              </div>

              {/* RIGHT SIDE */}

              <div className="flex items-center gap-4">
                {/* TRANSLATING STATUS */}

                {translating && (
                  <span className="text-yellow-300 text-xs">
                    Translating...
                  </span>
                )}

                {/* LANGUAGE DROPDOWN */}

                <select
                  value={language}
                  onChange={(e) =>
                    setLanguage(e.target.value)
                  }
                  className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 text-sm"
                >
                  <option
                    value="English"
                    className="text-black"
                  >
                    English
                  </option>

                  <option
                    value="Telugu"
                    className="text-black"
                  >
                    Telugu
                  </option>

                  <option
                    value="Hindi"
                    className="text-black"
                  >
                    Hindi
                  </option>
                </select>

                {/* ADMIN DETAILS */}

                <div className="text-right">
                  <p className="text-white text-sm font-medium">
                    {translations.adminRole ||
                      adminTexts.adminRole}
                  </p>

                  <p className="text-white/40 text-xs">
                    {translations.schoolName ||
                      adminTexts.schoolName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------- */}
        {/*                       CHILD PAGE CONTENT                        */}
        {/* -------------------------------------------------------------- */}

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          ADMIN LAYOUT PROVIDER                              */
/* -------------------------------------------------------------------------- */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </LanguageProvider>
  );
}