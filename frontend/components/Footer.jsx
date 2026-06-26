export default function Footer() {
  return (
    <footer className="bg-[#08080d] py-12 border-t border-white/5 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <span className="font-bold text-2xl text-gradient">SWAIS</span>
          <p className="text-slate-500 mt-2 text-sm max-w-sm">
            AI-powered enterprise intelligence for operations, industry, and education.
          </p>
        </div>
        <div className="text-slate-600 text-sm">
          <p>&copy; {new Date().getFullYear()} Saraf Worldsphere AI Services.</p>
          <p className="mt-1">All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
