import React from 'react';
import LegalPage from './LegalPage';

const TermsPage = () => (
  <LegalPage
    title="Terms & Conditions"
    lastUpdated="February 2, 2026"
    sections={[
      {
        id: 'introduction',
        label: 'Introduction',
        icon: 'info',
        primary: true,
        content: (
          <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
            These terms govern your use of SmartAcademics. By using the portal, you agree to comply with all rules and policies.
          </p>
        ),
      },
      {
        id: 'usage',
        label: 'Acceptable Use',
        icon: 'verified_user',
        content: (
          <ul className="space-y-3 text-gray-700 dark:text-gray-300">
            <li>• Use the portal only for academic purposes.</li>
            <li>• Do not share login credentials with others.</li>
            <li>• Do not upload harmful or unauthorized content.</li>
          </ul>
        ),
      },
      {
        id: 'content',
        label: 'Content Ownership',
        icon: 'description',
        content: (
          <p className="text-gray-700 dark:text-gray-300">
            Content uploaded by teachers, HODs, or admins remains the responsibility of the uploader and the institution.
          </p>
        ),
      },
      {
        id: 'termination',
        label: 'Account Control',
        icon: 'shield',
        content: (
          <p className="text-gray-700 dark:text-gray-300">
            Admins may suspend accounts that violate rules or misuse the platform.
          </p>
        ),
      },
      {
        id: 'contact',
        label: 'Contact Us',
        icon: 'mail',
        content: (
          <p className="text-gray-700 dark:text-gray-300">Questions? Email us at <a className="text-primary font-bold" href="mailto:support@smartacademics.in">support@smartacademics.in</a></p>
        ),
      },
    ]}
  />
);

export default TermsPage;
