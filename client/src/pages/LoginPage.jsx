import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login failed');
        return;
      }

      // Store token
      localStorage.setItem('token', data.token);
      
      // Store user info
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      // Check if password change is required (first login)
      if (data.passwordChangeRequired) {
        navigate('/first-login');
      } else {
        // Redirect based on role
        const role = data.user?.role;
        switch (role) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'hod':
            navigate('/hod/dashboard');
            break;
          case 'teacher':
            navigate('/teacher/dashboard');
            break;
          case 'student':
            navigate('/');
            break;
          default:
            navigate('/');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-display bg-background-light dark:bg-background-dark min-h-screen flex flex-col mesh-background">
      <header className="fixed top-0 w-full z-50 glass-header">
        <div className="max-w-[1280px] mx-auto px-6 h-20 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="p-1.5 bg-primary rounded-lg text-white">
              <svg className="size-6" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor"></path>
              </svg>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">SmartAcademics</h1>
          </a>
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-sm font-semibold hover:text-primary transition-colors" href="/about">About Us</a>
            <a className="text-sm font-semibold hover:text-primary transition-colors" href="/contact">Contact Us</a>
          </nav>
          <div className="flex items-center gap-3">
            <a
              className="px-5 py-2 text-sm font-bold bg-[#f0f1f4] dark:bg-white/10 rounded-lg hover:bg-gray-200 transition-all"
              href="/"
            >
              Home
            </a>
            <a
              className="px-5 py-2 text-sm font-bold bg-primary text-white rounded-lg shadow-lg shadow-primary/20 hover:scale-105 transition-all"
              href="/register"
            >
              Register
            </a>
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12 pt-28">
        <div className="w-full max-w-[480px] space-y-8">
          <div className="bg-white/80 dark:bg-[#1c2130]/80 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[2.5rem] p-10 soft-ui-card">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
                <span className="material-symbols-outlined text-primary text-3xl">verified_user</span>
              </div>
              <h1 className="text-[#111318] dark:text-white text-3xl font-extrabold leading-tight">Secure Portal</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Enterprise Access Management</p>
            </div>
            
            {error && (
              <div className="mb-5 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label className="text-[#111318] dark:text-gray-200 text-sm font-bold ml-1">Enrollment ID or Mobile Number</label>
                <div className="relative">
                  <input
                    className="w-full rounded-xl border border-[#dcdee5] dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-primary/20 focus:border-primary h-14 px-5 text-base text-[#111318] dark:text-white placeholder:text-[#636c88] transition-all"
                    placeholder="Email, Mobile or Enrollment ID"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <span className="material-symbols-outlined text-xl">contact_page</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[#111318] dark:text-gray-200 text-sm font-bold ml-1">Secure Password</label>
                <div className="flex w-full items-stretch rounded-xl border border-[#dcdee5] dark:border-white/10 bg-white/50 dark:bg-black/20 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <input
                    className="flex-1 bg-transparent border-none focus:ring-0 h-14 px-5 text-base text-[#111318] dark:text-white placeholder:text-[#636c88]"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    className="px-4 text-gray-400 hover:text-primary transition-colors"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center px-1 py-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Remember for 30 days</span>
                </label>
              </div>
              <button
                className="w-full bg-primary text-white h-14 rounded-xl text-base font-bold tracking-wide login-btn-hover active:scale-[0.98] transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In to Portal'}
              </button>
              <div className="flex items-center justify-between px-1 pt-4">
                <a className="text-sm font-bold text-primary hover:underline flex items-center gap-1 group" href="/register">
                  Register as Student
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </a>
                <a className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-primary transition-colors" href="/forgot-password">
                  Forgot Password?
                </a>
              </div>
            </form>
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-center gap-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </div>
              <span className="material-symbols-outlined text-sm text-gray-400">lock</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                256-bit AES Encrypted Connection
              </span>
            </div>
          </div>
        </div>
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
            <p className="text-xs text-gray-500 dark:text-gray-500 text-center font-medium">© 2026 SmartAcademics. All rights reserved. v4.2.0 Secure Portal</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
