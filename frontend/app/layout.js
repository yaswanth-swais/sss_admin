import './globals.css';
import Providers from '../components/Providers';

export const metadata = {
  title: 'SWAIS – Saraf Worldsphere AI Services',
  description: 'Intelligent enterprise platforms that improve operational visibility, productivity, and decision-making.',
  keywords: 'AI, Analytics, Enterprise, Operations, Visibility',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-[#0a0a0f] text-slate-200 min-h-screen flex flex-col selection:bg-cyan-500 selection:text-white">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
