import React from 'react';
import LegalPage from './LegalPage';

const PrivacyPage = () => (
  <LegalPage
    title="Privacy Policy"
    lastUpdated="February 2, 2026"
    sections={[
      {
        id: 'introduction',
        label: 'Introduction',
        icon: 'info',
        primary: true,
        content: (
          <>
            <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 mb-6 italic">
              SmartAcademics respects your privacy. This policy explains how we collect, use, and protect information when you use the
              portal.
            </p>
            <p className="leading-relaxed text-gray-700 dark:text-gray-300">
              By using SmartAcademics, you agree to this policy. If you do not agree, please do not use the platform.
            </p>
          </>
        ),
      },
      {
        id: 'data-collection',
        label: 'Data Collection',
        icon: 'database',
        content: (
          <ul className="space-y-4 text-gray-700 dark:text-gray-300">
            <li className="flex gap-3"><span className="text-primary font-bold">•</span><span><strong>Account Data:</strong> name, email, mobile number, role.</span></li>
            <li className="flex gap-3"><span className="text-primary font-bold">•</span><span><strong>Academic Data:</strong> branch, semester, assigned subjects.</span></li>
            <li className="flex gap-3"><span className="text-primary font-bold">•</span><span><strong>Usage Data:</strong> login times, pages visited, device/browser info.</span></li>
          </ul>
        ),
      },
      {
        id: 'data-usage',
        label: 'Data Usage',
        icon: 'description',
        content: (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-background-light dark:bg-gray-800 rounded-lg">
              <h4 className="font-bold mb-2">Portal Operations</h4>
              <p className="text-sm">To provide login, dashboards, and academic resources.</p>
            </div>
            <div className="p-4 bg-background-light dark:bg-gray-800 rounded-lg">
              <h4 className="font-bold mb-2">Communication</h4>
              <p className="text-sm">To send important notices and account updates.</p>
            </div>
          </div>
        ),
      },
      {
        id: 'protection',
        label: 'Protection Assurance',
        icon: 'verified_user',
        content: (
          <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl">
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
              Passwords are hashed. Access is role-based. We secure data in transit and at rest.
            </p>
          </div>
        ),
      },
      {
        id: 'cookies',
        label: 'Cookies Policy',
        icon: 'cookie',
        content: (
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            We use cookies for session management and security. You can clear cookies from your browser at any time.
          </p>
        ),
      },
      {
        id: 'contact',
        label: 'Contact Us',
        icon: 'mail',
        content: (
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 inline-block min-w-[300px]">
            <p className="font-bold">Privacy Support Team</p>
            <p className="text-sm text-gray-500 mb-2">SmartAcademics</p>
            <a className="text-primary font-bold hover:underline" href="mailto:privacy@smartacademics.in">privacy@smartacademics.in</a>
          </div>
        ),
      },
    ]}
  />
);

export default PrivacyPage;
