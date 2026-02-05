import React from 'react';
import Header from '../components/Header';

const AboutPage = () => {

  return (
  <div className="bg-background-light dark:bg-background-dark text-[#111318] dark:text-white antialiased min-h-screen flex flex-col mesh-background">
    <Header />
    <main className="pt-20 flex-1">
      <section className="max-w-[1200px] mx-auto px-6 lg:px-10 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <div className="inline-flex px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest w-fit">
              About SmartAcademics
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.1] tracking-tight">
              Empowering <span className="text-primary">Academic</span> Excellence
            </h1>
            <p className="text-lg text-[#636c88] dark:text-slate-400 leading-relaxed max-w-lg">
              SmartAcademics is a digital academic portal for your college that centralizes syllabus, notes, notices, and
              departmental resources in one reliable place.
            </p>
            <div className="flex gap-4">
              <a className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:scale-[1.02] transition-transform" href="/">
                Explore Resources
              </a>
              <a className="border border-[#dcdee5] dark:border-[#2d3244] px-8 py-3 rounded-xl font-bold hover:bg-white/50 transition-colors" href="/contact">
                Our Team
              </a>
            </div>
          </div>
          <div className="relative">
            <div
              className="aspect-[4/3] rounded-2xl bg-cover bg-center shadow-2xl"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBYGr4GUH_OMG77YE8MFzDKQMsdhATnzg6Fwd19a3-5M8wKePJdCuFD7GVmEsfuoywu0gwaSpnIPWfXgVdmFws9l6zMXH27yyjrAGvElgJ8Jq1svarA0i9EEupXyS0_vKDWEC8E_YzstOEF-i5xpGB5kNodkPKfrcr7o8_KyYYqgMcIEKfx3OPSBzNPGMo6y694TvToac6jY5tP66_jjT3V6V9PvLtvQVKKxiT7cBoRmUtQmSSh_OzW4b4xafwxYP9InG7Cd9wELCik')",
              }}
            ></div>
            <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg hidden lg:block border border-[#dcdee5] dark:border-[#2d3244]">
              <p className="text-3xl font-extrabold text-primary">98%</p>
              <p className="text-sm font-medium text-[#636c88] dark:text-slate-400">Success Rate</p>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-white dark:bg-slate-900 border-y border-[#dcdee5] dark:border-[#2d3244]">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center md:text-left">
              <p className="text-3xl font-extrabold text-primary mb-1">10k+</p>
              <p className="text-sm font-medium text-[#636c88] dark:text-slate-400 uppercase tracking-wider">Students Reached</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-3xl font-extrabold text-primary mb-1">500+</p>
              <p className="text-sm font-medium text-[#636c88] dark:text-slate-400 uppercase tracking-wider">Resources Available</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-3xl font-extrabold text-primary mb-1">100+</p>
              <p className="text-sm font-medium text-[#636c88] dark:text-slate-400 uppercase tracking-wider">Expert Mentors</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-3xl font-extrabold text-primary mb-1">50+</p>
              <p className="text-sm font-medium text-[#636c88] dark:text-slate-400 uppercase tracking-wider">Academic Partners</p>
            </div>
          </div>
        </div>
      </section>
      <section className="max-w-[1200px] mx-auto px-6 lg:px-10 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Our Core Philosophy</h2>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full"></div>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-6 rounded-2xl border border-[#dcdee5] dark:border-[#2d3244] bg-white dark:bg-slate-900 p-10 hover:shadow-xl transition-shadow group">
            <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-3xl">visibility</span>
            </div>
            <h3 className="text-2xl font-bold">Our Vision</h3>
            <p className="text-[#636c88] dark:text-slate-400 leading-relaxed text-lg">
              To make high-quality academic resources accessible to every student in our college, regardless of semester or branch.
            </p>
          </div>
          <div className="flex flex-col gap-6 rounded-2xl border border-[#dcdee5] dark:border-[#2d3244] bg-white dark:bg-slate-900 p-10 hover:shadow-xl transition-shadow group">
            <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-3xl">track_changes</span>
            </div>
            <h3 className="text-2xl font-bold">Our Mission</h3>
            <p className="text-[#636c88] dark:text-slate-400 leading-relaxed text-lg">
              Providing structured, easy-to-understand content that helps students learn faster and teachers share updates efficiently.
            </p>
          </div>
        </div>
      </section>
      <section className="bg-background-light dark:bg-[#0d101b] py-20">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-xl">
              <h2 className="text-3xl font-bold tracking-tight mb-4">What We Provide</h2>
              <p className="text-[#636c88] dark:text-slate-400">All academic resources in one platform for your college.</p>
            </div>
            <span className="text-primary font-bold flex items-center gap-2">View all services <span className="material-symbols-outlined">arrow_forward</span></span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-[#dcdee5] dark:border-[#2d3244] flex flex-col gap-4">
              <span className="material-symbols-outlined text-primary text-3xl">menu_book</span>
              <h4 className="text-xl font-bold">Subject Details</h4>
              <p className="text-sm text-[#636c88] dark:text-slate-400 leading-relaxed">Complete syllabus and unit-wise details.</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-[#dcdee5] dark:border-[#2d3244] flex flex-col gap-4">
              <span className="material-symbols-outlined text-primary text-3xl">inventory_2</span>
              <h4 className="text-xl font-bold">Materials</h4>
              <p className="text-sm text-[#636c88] dark:text-slate-400 leading-relaxed">Notes, PDFs, and learning resources.</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-[#dcdee5] dark:border-[#2d3244] flex flex-col gap-4">
              <span className="material-symbols-outlined text-primary text-3xl">campaign</span>
              <h4 className="text-xl font-bold">Notices</h4>
              <p className="text-sm text-[#636c88] dark:text-slate-400 leading-relaxed">Department and college notices in one place.</p>
            </div>
          </div>
        </div>
      </section>
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

export default AboutPage;
