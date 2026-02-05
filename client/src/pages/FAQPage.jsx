import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const FAQPage = () => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      category: 'Account & Login',
      questions: [
        {
          q: 'How do I reset my password?',
          a: 'You can reset your password by clicking on "Change Password" in your profile settings. You will need your current password to set a new one.'
        },
        {
          q: 'What should I do if I forget my enrollment number?',
          a: 'Your enrollment number is displayed on your student profile. If you cannot access it, please contact the admin team.'
        },
        {
          q: 'Can I change my email address?',
          a: 'Email addresses are managed by the admin team. Please contact your administrator if you need to change your registered email.'
        }
      ]
    },
    {
      category: 'Study Materials & Resources',
      questions: [
        {
          q: 'Where can I find study materials for my subjects?',
          a: 'You can access study materials by clicking "My Study Materials" on the landing page. Materials are organized by subject and semester.'
        },
        {
          q: 'Can I download study materials?',
          a: 'Yes, most materials are available for download. Click on any material to view download options.'
        },
        {
          q: 'How often are new materials uploaded?',
          a: 'Teachers upload materials regularly. Check back often or contact your teacher for the latest content.'
        }
      ]
    },
    {
      category: 'Profile & Settings',
      questions: [
        {
          q: 'Can I edit my profile information?',
          a: 'You can edit your full name through the profile settings. Enrollment number, mobile, branch, and semester cannot be changed by you.'
        },
        {
          q: 'How do I update my contact information?',
          a: 'Contact information updates (mobile number, address) require admin approval. Please submit a request through the contact form.'
        },
        {
          q: 'What information is visible to other users?',
          a: 'Your name and enrollment number are visible. Other profile details are private.'
        }
      ]
    },
    {
      category: 'Technical Issues',
      questions: [
        {
          q: 'I cannot login. What should I do?',
          a: 'Please ensure you are using your correct enrollment number or email and password. If the issue persists, contact the admin team.'
        },
        {
          q: 'The application is running slowly. How can I fix it?',
          a: 'Try clearing your browser cache, disabling extensions, or using a different browser. Contact support if the issue continues.'
        },
        {
          q: 'Which browsers are supported?',
          a: 'The application works best on Chrome, Firefox, Safari, and Edge. Please keep your browser updated.'
        }
      ]
    },
    {
      category: 'Academic & Semester',
      questions: [
        {
          q: 'Can I change my semester or branch?',
          a: 'Semester and branch changes require admin approval. Please submit a formal request through the contact page.'
        },
        {
          q: 'When does each semester start and end?',
          a: 'Semester dates are managed by your institution. Check your academic calendar or contact your HOD.'
        },
        {
          q: 'How do I access materials from previous semesters?',
          a: 'Contact your teacher or department head to request access to previous semester materials.'
        }
      ]
    },
    {
      category: 'Support & Contact',
      questions: [
        {
          q: 'How do I contact support?',
          a: 'You can submit a message through our Contact Us page. The admin team will respond to your inquiry.'
        },
        {
          q: 'What is the expected response time?',
          a: 'Admin typically responds to queries within 24-48 hours during business days.'
        },
        {
          q: 'Can I schedule a meeting with my HOD?',
          a: 'Contact your HOD directly or use the "Contact Us" form to request a meeting.'
        }
      ]
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-[#111318] dark:text-white transition-colors duration-300">
      <Header />

      {/* Main Content */}
      <div className="pt-24 max-w-[1200px] mx-auto px-6 lg:px-10 py-12">
        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Find answers to common questions about Smart College Academic Portal
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqs.map((section, sectionIndex) => (
            <div key={sectionIndex} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
              {/* Category Title */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h2 className="text-2xl font-bold text-white">
                  {section.category}
                </h2>
              </div>

              {/* Questions */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {section.questions.map((item, qIndex) => {
                  const globalIndex = `${sectionIndex}-${qIndex}`;
                  return (
                    <div key={qIndex} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <button
                        onClick={() => toggleFAQ(globalIndex)}
                        className="w-full text-left flex items-center justify-between gap-4"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
                          {item.q}
                        </h3>
                        <span className={`flex-shrink-0 text-2xl text-blue-600 transition-transform duration-300 ${
                          openIndex === globalIndex ? 'rotate-180' : ''
                        }`}>
                          ▼
                        </span>
                      </button>

                      {/* Answer */}
                      {openIndex === globalIndex && (
                        <div className="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                          <p>{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Didn't find your answer?
          </h2>
          <p className="text-blue-100 mb-6">
            Feel free to contact us directly. Our team is here to help!
          </p>
          <button
            onClick={() => navigate('/contact')}
            className="px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-all inline-block"
          >
            Contact Us
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-[#dcdee5] dark:border-[#2d3244] py-12 mt-16">
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

export default FAQPage;
