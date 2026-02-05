import React from 'react';

const RegisterPage = () => (
  <div className="bg-background-light dark:bg-background-dark text-[#111318] dark:text-white min-h-screen flex flex-col mesh-background">
    <header className="fixed top-0 w-full z-50 bg-white/40 dark:bg-white/5 backdrop-blur-xl border-b border-white/20 dark:border-white/10">
      <div className="max-w-[1280px] mx-auto px-6 h-20 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="p-1.5 bg-gradient-to-br from-primary to-primary/80 rounded-lg text-white shadow-lg shadow-primary/20">
            <svg className="size-6" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor"></path>
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black tracking-tight">SmartAcademics</h1>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Registration</p>
          </div>
        </a>
        <nav className="hidden md:flex items-center gap-8">
          <a className="text-sm font-semibold hover:text-primary transition-colors" href="/about">About Us</a>
          <a className="text-sm font-semibold hover:text-primary transition-colors" href="/contact">Contact Us</a>
        </nav>
        <div className="flex items-center gap-3">
          <a
            className="px-6 py-2 text-sm font-bold bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
            href="/login"
          >
            Have an Account?
          </a>
        </div>
      </div>
    </header>
    <main className="flex-1 lg:flex pt-20">
      <section className="relative hidden lg:flex lg:w-1/2 flex-col justify-center p-20 pt-12 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/15 dark:to-transparent">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/5 dark:from-primary/10"></div>
        <div className="relative z-10 space-y-8">
          <div className="w-full max-w-sm rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-10 border border-white/20 dark:border-white/10 shadow-2xl">
            <div className="w-full h-56 rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-7xl opacity-70">school</span>
            </div>
          </div>
          <div className="max-w-md">
            <h1 className="text-[#111318] dark:text-white text-5xl font-black leading-tight tracking-tight">Accelerate Your Academic Future</h1>
            <p className="mt-4 text-[#636c88] dark:text-gray-400 text-lg leading-relaxed">Access elite resources, personalized mentoring, and a global network of top-performing scholars from India's leading institutions.</p>
            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-300 shadow-lg"></div>
                <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-400 shadow-lg"></div>
                <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-500 shadow-lg"></div>
              </div>
              <span className="text-sm font-semibold text-primary">Join 50,000+ students worldwide</span>
            </div>
            <div className="mt-8 flex items-center gap-3 text-sm font-medium">
              <span className="material-symbols-outlined text-primary">verified</span>
              <span className="text-[#636c88] dark:text-gray-400">AICTE Approved Platform</span>
            </div>
          </div>
        </div>
      </section>
      <section className="flex flex-1 flex-col items-center justify-center p-6 md:p-12 lg:p-16 lg:w-1/2">
        <div className="w-full max-w-2xl pt-20 lg:pt-0">
          <div className="mb-12">
            <h2 className="text-[#111318] dark:text-white text-4xl font-black leading-tight tracking-tight">Create Your Student Account</h2>
            <p className="text-[#636c88] dark:text-gray-400 mt-3 text-lg">Join thousands of students already benefiting from SmartAcademics premium features.</p>
          </div>
          <form className="space-y-8 bg-white dark:bg-gray-900/80 p-10 md:p-12 rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 dark:border-gray-800 backdrop-blur-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-xl">person</span>
                <h3 className="text-[#111318] dark:text-white text-sm font-bold uppercase tracking-wider">Personal Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-2 flex-1">
                  <span className="text-[#111318] dark:text-gray-300 text-sm font-semibold">Full Name</span>
                  <input className="form-input w-full rounded-lg text-[#111318] dark:text-white border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 transition-all" placeholder="e.g. Alexander Hamilton" type="text"/>
                </label>
                <label className="flex flex-col gap-2 flex-1">
                  <span className="text-[#111318] dark:text-gray-300 text-sm font-semibold">Enrollment Number</span>
                  <input className="form-input w-full rounded-lg text-[#111318] dark:text-white border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 transition-all" placeholder="SA-2024-XXXX" type="text"/>
                </label>
              </div>
              <label className="flex flex-col gap-2">
                <span className="text-[#111318] dark:text-gray-300 text-sm font-semibold">Mobile Number</span>
                <div className="flex">
                  <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 text-sm">+91</span>
                  <input className="form-input w-full rounded-r-lg text-[#111318] dark:text-white border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 transition-all" placeholder="(555) 000-0000" type="tel"/>
                </div>
              </label>
            </div>
            <hr className="border-gray-100 dark:border-gray-800"/>
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-xl">lock</span>
                <h3 className="text-[#111318] dark:text-white text-sm font-bold uppercase tracking-wider">Security Settings</h3>
              </div>
              <label className="flex flex-col gap-2">
                <span className="text-[#111318] dark:text-gray-300 text-sm font-semibold">Password</span>
                <div className="relative">
                  <input className="form-input w-full rounded-lg text-[#111318] dark:text-white border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 pr-12 transition-all" placeholder="••••••••••••" type="password"/>
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors" type="button">
                    <span className="material-symbols-outlined text-xl">visibility</span>
                  </button>
                </div>
                <p className="text-xs text-[#636c88] dark:text-gray-400">Must be at least 8 characters with one special symbol.</p>
              </label>
              <div className="p-4 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/10">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[#111318] dark:text-white text-sm font-bold italic underline decoration-primary decoration-2 underline-offset-4">Security Question</span>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Required</span>
                  </div>
                  <p className="text-[#111318] dark:text-gray-200 text-sm font-medium">What is your favourite color?</p>
                  <input className="form-input w-full rounded-lg text-[#111318] dark:text-white border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 transition-all" placeholder="Enter your secret answer" type="text"/>
                </div>
              </div>
            </div>
            <div className="pt-4 space-y-4">
              <button className="w-full flex items-center justify-center rounded-lg h-14 px-6 bg-primary text-white text-base font-bold hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-primary/30" type="submit">
                <span className="mr-2">Register My Account</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <div className="text-center text-sm">
                <span className="text-[#636c88] dark:text-gray-400">Already have an account?</span>
                <a className="ml-1 text-primary font-bold hover:underline" href="/login">Login here</a>
              </div>
            </div>
          </form>
          <div className="mt-12 flex flex-wrap justify-center gap-8 opacity-40 grayscale">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">verified_user</span>
              <span className="text-xs font-bold uppercase tracking-widest">SSL Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">privacy_tip</span>
              <span className="text-xs font-bold uppercase tracking-widest">Privacy Protected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">workspace_premium</span>
              <span className="text-xs font-bold uppercase tracking-widest">ISO Certified</span>
            </div>
          </div>
        </div>
      </section>
    </main>
    <footer className="w-full mt-20 border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
      <div className="px-6 md:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded text-white">
              <svg className="size-5" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor"></path>
              </svg>
            </div>
            <span className="font-bold text-[#111318] dark:text-white">SmartAcademics</span>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm">
            <a className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-medium" href="/privacy">Privacy</a>
            <a className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-medium" href="/terms">Terms</a>
            <a className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-medium" href="/contact">Support</a>
          </div>
          <div className="flex justify-end gap-4">
            <button className="w-9 h-9 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
              <span className="material-symbols-outlined text-lg">language</span>
            </button>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
          <p className="text-xs text-gray-500 dark:text-gray-500 text-center font-medium">© 2026 SmartAcademics. All rights reserved. v4.2.0 Professional Edition</p>
        </div>
      </div>
    </footer>
  </div>
);

export default RegisterPage;
