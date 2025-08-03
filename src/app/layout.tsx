import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Rianna - AI Transcript Analyzer',
  description: 'Advanced transcript analysis and scoring system with AI integration',
  keywords: 'transcript, analysis, AI, scoring, speech-to-text',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <div className="flex flex-col min-h-screen">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-primary-600">Rianna</h1>
                  <span className="ml-2 text-sm text-gray-500">AI Transcript Analyzer</span>
                </div>
                <nav className="flex space-x-8">
                  <a href="/" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                    Dashboard
                  </a>
                  <a href="/upload" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                    Upload
                  </a>
                  <a href="/analytics" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                    Analytics
                  </a>
                  <a href="/settings" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                    Settings
                  </a>
                </nav>
              </div>
            </div>
          </header>
          
          <main className="flex-1">
            {children}
          </main>
          
          <footer className="bg-white border-t">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="py-4 text-center text-sm text-gray-500">
                © 2024 Rianna. AI-powered transcript analysis system.
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}