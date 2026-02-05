import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';

const ContactPage = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    subject: 'Academic Counseling',
    message: ''
  });
  const [myMessages, setMyMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Check login status
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsLoggedIn(true);
      setCurrentUser(JSON.parse(user));
      fetchMyMessages();
    }
  }, []);

  // Fetch user's messages
  const fetchMyMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/contact/my-messages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setMyMessages(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      alert('Please login to submit a message');
      navigate('/login');
      return;
    }

    if (!formData.message.trim()) {
      alert('Please enter a message');
      return;
    }

    setLoading(true);
    setSubmitSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/contact', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSubmitSuccess(true);
        setFormData({
          subject: 'Academic Counseling',
          message: ''
        });
        // Refresh messages list
        fetchMyMessages();
        
        // Hide success message after 3 seconds
        setTimeout(() => setSubmitSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error submitting message:', error);
      alert(error.response?.data?.message || 'Failed to submit message');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    return status === 'pending' 
      ? <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs font-bold rounded-full">Pending</span>
      : <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-bold rounded-full">Replied</span>;
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#111318] dark:text-white min-h-screen flex flex-col mesh-background">
    <Header />

    {/* Main Content */}
    <main className="flex-1 pt-8">
      <div className="max-w-[1200px] mx-auto w-full px-6 py-8">
      <div className="mb-12">
        <h2 className="text-4xl font-black leading-tight tracking-[-0.033em] mb-3">Get in Touch with Our Academic Team</h2>
        <p className="text-[#636c88] dark:text-gray-400 text-lg max-w-2xl">
          We are here to assist students, faculty, and institutional partners with professional academic guidance.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 flex flex-col gap-8">
          <div>
            <h3 className="text-xl font-bold mb-6">Official Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="bg-primary/10 text-primary p-3 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined">mail</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email Us</p>
                  <p className="text-base font-semibold">support@smartacademics.in</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="bg-primary/10 text-primary p-3 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined">schedule</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Support Hours</p>
                  <p className="text-base font-semibold">Mon-Fri, 9:00 AM - 5:00 PM IST</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-primary/5 dark:bg-primary/10 border-l-4 border-primary p-6 rounded-r-xl">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary mt-1">info</span>
              <div>
                <h4 className="text-base font-bold text-primary mb-2">Academic Support Note</h4>
                <p className="text-sm leading-relaxed text-[#636c88] dark:text-gray-300">
                  Our advisors respond within 24-48 business hours. For quick processing, include your reference ID and department.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl overflow-hidden h-48 relative">
            <img
              alt="Academic Office environment"
              className="w-full h-full object-cover grayscale opacity-50 dark:opacity-30"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSq1BGFBxRGpgCFVyeEPzuIykfjx6v2SVa_fiQxYATIkN8jSp6IVc-pD54B5L5DRYOmD204pvAjHrrPwiMDrlpyTOtog1QJ055R6N7EXhLdc61FwhC05Ak74E70xd7FfUxs9Tz_LeYD_UClLROAUdqoi0CT9kM4l3SXHxFZnPVlOVa8L67dd3MSUOqKeqy4MrxYsF--PYFHQe3GW0mjaT0Xdm99KNxXKcWB5y3OiAJoKM3PCmYrxu10_cmKVu9sSgwgGsq5xkUsgx-"
            />
            <div className="absolute inset-0 bg-primary/10 mix-blend-multiply"></div>
          </div>
        </div>
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none">
            <h3 className="text-2xl font-bold mb-6">Send a Message</h3>
            
            {!isLoggedIn && (
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                  ⚠️ You must be logged in to submit a message. <a href="/login" className="underline hover:text-primary">Login here</a>
                </p>
              </div>
            )}

            {submitSuccess && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                  ✓ Message submitted successfully! Your message is pending review.
                </p>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300" htmlFor="full-name">Full Name</label>
                  <input 
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-900 bg-gray-100 cursor-not-allowed" 
                    id="full-name" 
                    value={currentUser?.name || 'Please login first'} 
                    type="text" 
                    disabled 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300" htmlFor="email">Email Address</label>
                  <input 
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-900 bg-gray-100 cursor-not-allowed" 
                    id="email" 
                    value={currentUser?.email || 'Please login first'} 
                    type="email" 
                    disabled 
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300" htmlFor="subject">Inquiry Type</label>
                <select 
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" 
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  disabled={!isLoggedIn}
                >
                  <option>Academic Counseling</option>
                  <option>Research Collaboration</option>
                  <option>Institutional Partnerships</option>
                  <option>Technical Support</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300" htmlFor="message">Message / Query</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none" 
                  id="message" 
                  name="message"
                  placeholder="Please describe your query in detail..." 
                  rows="5"
                  value={formData.message}
                  onChange={handleInputChange}
                  disabled={!isLoggedIn}
                ></textarea>
              </div>
              <button 
                className={`w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  isLoggedIn && !loading
                    ? 'bg-primary text-white hover:bg-opacity-90 shadow-lg shadow-primary/20'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                type="submit"
                disabled={!isLoggedIn || loading}
              >
                <span>{loading ? 'Submitting...' : 'Submit Message'}</span>
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </form>
            <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
              By submitting this form, you agree to our <a className="underline hover:text-primary" href="/privacy">Privacy Policy</a>.
            </p>
          </div>

          {/* My Messages Section */}
          {isLoggedIn && myMessages.length > 0 && (
            <div className="mt-8 bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl">
              <h3 className="text-2xl font-bold mb-6">My Messages</h3>
              <div className="space-y-4">
                {myMessages.map((msg, index) => (
                  <div key={msg._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-primary">#{index + 1}</span>
                        <div>
                          <h4 className="font-bold text-lg">{msg.subject}</h4>
                          <p className="text-xs text-gray-500">
                            {new Date(msg.createdAt).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(msg.status)}
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-3">
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Your Message:</p>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                    {msg.status === 'replied' && msg.reply && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-500">
                        <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
                          Reply from Admin:
                        </p>
                        <div 
                          className="text-sm text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: msg.reply.message }}
                        />
                        <p className="text-xs text-gray-500 mt-3">
                          Replied on {new Date(msg.reply.repliedAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </main>

    {/* FAQ Section Before Footer */}
    <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-16 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl my-12">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
        Quick FAQ
      </h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-700 rounded-xl p-6 shadow">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
            How do I reset my password?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            You can reset your password by clicking "Change Password" in your profile settings. You'll need your current password.
          </p>
        </div>
        <div className="bg-white dark:bg-slate-700 rounded-xl p-6 shadow">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
            Where can I find study materials?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Access study materials through "My Study Materials" on the landing page. Materials are organized by subject and semester.
          </p>
        </div>
        <div className="bg-white dark:bg-slate-700 rounded-xl p-6 shadow">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
            Can I change my enrollment number?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            No, enrollment number is your unique student ID and cannot be changed. Only admin can update it.
          </p>
        </div>
        <div className="bg-white dark:bg-slate-700 rounded-xl p-6 shadow">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
            How long does the admin respond?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Admin typically responds to messages within 24-48 hours during business days. Submit a message above to get help.
          </p>
        </div>
      </div>
      <div className="text-center mt-8">
        <a 
          href="/faq"
          className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all inline-block"
        >
          View All FAQs
        </a>
      </div>
    </div>

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

export default ContactPage;