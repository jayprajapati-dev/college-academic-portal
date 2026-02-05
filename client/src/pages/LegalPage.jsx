import React from 'react';
import Header from '../components/Header';

const LegalPage = ({ title, lastUpdated, sections }) => {

  return (
  <div className="bg-background-light dark:bg-background-dark text-[#111318] dark:text-gray-100 min-h-screen flex flex-col mesh-background">
    <Header />
    <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 pt-32">
      <nav className="flex items-center gap-2 mb-8 text-sm text-gray-500 dark:text-gray-400">
        <a className="hover:text-primary transition-colors" href="/">Home</a>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-gray-900 dark:text-white font-medium">{title}</span>
      </nav>
      <div className="flex flex-col lg:flex-row gap-12">
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="sticky top-24 p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Table of Contents</h3>
            <nav className="flex flex-col gap-1">
              {sections.map((section) => (
                <a
                  key={section.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${section.primary ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'}`}
                  href={`#${section.id}`}
                >
                  <span className="material-symbols-outlined text-[20px]">{section.icon}</span>
                  <span className="text-sm">{section.label}</span>
                </a>
              ))}
            </nav>
          </div>
        </aside>
        <article className="flex-1 bg-white dark:bg-gray-900 p-8 lg:p-12 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <header className="mb-10 border-b border-gray-100 dark:border-gray-800 pb-8">
            <h2 className="text-5xl font-black text-[#111318] dark:text-white mb-4">{title}</h2>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wide">Official Document</span>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Last updated: {lastUpdated}</p>
            </div>
          </header>
          {sections.map((section) => (
            <section className="mb-12" id={section.id} key={section.id}>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary">{section.icon}</span>
                <h3 className="text-2xl font-bold text-[#111318] dark:text-white">{section.label}</h3>
              </div>
              {section.content}
            </section>
          ))}
        </article>
      </div>
    </main>
    <footer className="bg-white dark:bg-slate-900 border-t border-[#dcdee5] dark:border-[#2d3244] py-12">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="p-1 bg-primary rounded text-white">
              <svg className="size-5" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor"></path>
              </svg>
            </div>
            <h2 className="text-lg font-bold tracking-tight">SmartAcademics</h2>
          </a>
          <div className="flex gap-8 text-sm text-[#636c88] dark:text-slate-400 font-medium">
            <a className="hover:text-primary transition-colors" href="/privacy">Privacy Policy</a>
            <a className="hover:text-primary transition-colors" href="/terms">Terms of Service</a>
            <a className="hover:text-primary transition-colors" href="/disclaimer">Disclaimer</a>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'SmartAcademics Portal',
                    text: 'Check out SmartAcademics - Elite Academic Resource Management Portal',
                    url: window.location.origin
                  }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.origin);
                  alert('Link copied to clipboard!');
                }
              }}
              className="w-10 h-10 rounded-full border border-[#dcdee5] dark:border-[#2d3244] flex items-center justify-center hover:bg-primary hover:text-white transition-colors cursor-pointer"
              title="Share this portal"
            >
              <span className="material-symbols-outlined text-xl">share</span>
            </button>
            <button 
              onClick={() => {
                window.open(window.location.origin, '_blank');
              }}
              className="w-10 h-10 rounded-full border border-[#dcdee5] dark:border-[#2d3244] flex items-center justify-center hover:bg-primary hover:text-white transition-colors cursor-pointer"
              title="Open in new tab"
            >
              <span className="material-symbols-outlined text-xl">open_in_new</span>
            </button>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-[#f0f1f4] dark:border-[#2d3244] text-center text-xs text-[#636c88] dark:text-slate-500">
          © 2026 SmartAcademics. All rights reserved.
        </div>
      </div>
    </footer>
  </div>
  );
};

export default LegalPage;
