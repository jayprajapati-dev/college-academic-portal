import React from 'react';

const ForgotPasswordPage = () => (
  <div className="font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-white antialiased min-h-screen flex flex-col">
    <header className="fixed top-0 w-full z-50 bg-white/40 dark:bg-white/5 backdrop-blur-xl border-b border-white/20 dark:border-white/10">
      <div className="max-w-[1280px] mx-auto px-6 md:px-20 lg:px-40 h-20 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="p-1.5 bg-gradient-to-br from-primary to-primary/80 rounded-lg text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-5xl">lock_reset</span>
          </div>
          <div className="flex flex-col">
            <h2 className="text-slate-900 dark:text-white text-lg font-black tracking-tight">SmartAcademics</h2>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Password Recovery</p>
          </div>
        </a>
        <a className="flex items-center justify-center rounded-lg h-11 px-6 bg-primary/10 dark:bg-primary/15 border border-primary/30 dark:border-primary/40 hover:bg-primary hover:text-white text-primary dark:text-primary text-sm font-bold transition-all duration-300 shadow-sm" href="/login">
          <span className="material-symbols-outlined text-lg mr-2">arrow_back</span>
          <span>Return to Login</span>
        </a>
      </div>
    </header>
    <main className="flex flex-1 items-center justify-center p-6 md:p-12 pt-32 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-[100px] -z-10"></div>
      <div className="w-full max-w-[540px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-xl overflow-hidden transition-all duration-500 border border-white/20 dark:border-white/10 shadow-2xl">
        <div className="p-8 pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Security Protocol</p>
                <h3 className="text-slate-900 dark:text-white font-bold text-lg">Identity Verification</h3>
              </div>
              <p className="text-primary text-sm font-bold bg-primary/5 px-3 py-1 rounded-full">Step 1 of 4</p>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-700 ease-in-out" style={{width: '25%'}}></div>
            </div>
          </div>
        </div>
        <div className="px-8 pt-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/5 text-primary mb-6 ring-1 ring-primary/10">
            <span className="material-symbols-outlined text-2xl">lock_reset</span>
          </div>
          <h1 className="text-slate-900 dark:text-white text-2xl font-extrabold tracking-tight">Account Recovery</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 font-medium leading-relaxed">Enter your credentials to securely verify your identity and regain access.</p>
        </div>
        <form className="p-8 space-y-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">University Identifier</label>
            <div className="relative flex items-stretch">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <span className="material-symbols-outlined text-xl">badge</span>
              </div>
              <input className="w-full rounded-xl h-14 border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 pl-12 pr-5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" placeholder="Student or Faculty ID Number" type="text"/>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Assigned Security Challenge</label>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50">
              <div className="size-10 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm text-primary">
                <span className="material-symbols-outlined text-lg">psychology</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm font-semibold italic">"What was the name of your first elementary school?"</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Response</label>
            <div className="relative flex items-stretch">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <span className="material-symbols-outlined text-xl">vpn_key</span>
              </div>
              <input className="w-full rounded-xl h-14 border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 pl-12 pr-12 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" placeholder="Type your security answer here" type="password"/>
              <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors" type="button">
                <span className="material-symbols-outlined text-xl">visibility_off</span>
              </button>
            </div>
          </div>
          <div className="pt-4 flex flex-col gap-5">
            <button className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group" type="submit">
              <span>Verify Identity</span>
              <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
            </button>
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-slate-400 font-medium">Remembered your credentials?</span>
              <a className="text-sm font-bold text-primary hover:text-slate-900 dark:hover:text-slate-100 transition-colors" href="/login">Back to Login</a>
            </div>
          </div>
        </form>
        <div className="p-6 pt-0">
          <div className="w-full py-4 bg-slate-900/5 dark:bg-white/5 rounded-2xl flex items-center justify-center gap-6 px-6 border border-white/20 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">verified_user</span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Enterprise Grade Security</span>
            </div>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800"></div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">encrypted</span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">AES-256 Encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </main>
    <footer className="w-full mt-16 border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
      <div className="px-6 md:px-10 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded text-white">
              <svg className="size-5" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor"></path>
              </svg>
            </div>
            <span className="font-bold text-slate-900 dark:text-white">SmartAcademics</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors font-semibold" href="/privacy">Privacy</a>
            <a className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors font-semibold" href="/terms">Terms</a>
            <a className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors font-semibold" href="/contact">Contact</a>
          </div>
          <div className="flex gap-4">
            <button className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-base">shield</span>
            </button>
          </div>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
          <p className="text-xs text-slate-500 dark:text-slate-500 text-center font-medium">© 2026 SmartAcademics. All rights reserved. v4.2.0 Enterprise Portal</p>
        </div>
      </div>
    </footer>
  </div>
);

export default ForgotPasswordPage;
