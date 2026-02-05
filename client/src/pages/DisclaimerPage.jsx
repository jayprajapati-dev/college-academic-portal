import React from 'react';
import LegalPage from './LegalPage';

const DisclaimerPage = () => (
  <LegalPage
    title="Disclaimer"
    lastUpdated="February 2, 2026"
    sections={[
      {
        id: 'introduction',
        label: 'Introduction',
        icon: 'info',
        primary: true,
        content: (
          <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
            SmartAcademics provides academic information for educational use only. We do not guarantee completeness or accuracy of
            every resource.
          </p>
        ),
      },
      {
        id: 'content',
        label: 'Content Responsibility',
        icon: 'description',
        content: (
          <p className="text-gray-700 dark:text-gray-300">
            Uploaded materials are the responsibility of the respective teacher, HOD, or admin. Students should verify with official
            department notices when needed.
          </p>
        ),
      },
      {
        id: 'liability',
        label: 'Limitation of Liability',
        icon: 'shield',
        content: (
          <p className="text-gray-700 dark:text-gray-300">
            SmartAcademics and the institution are not liable for any academic loss or decision based solely on portal content.
          </p>
        ),
      },
      {
        id: 'contact',
        label: 'Contact Us',
        icon: 'mail',
        content: (
          <p className="text-gray-700 dark:text-gray-300">For questions, contact <a className="text-primary font-bold" href="mailto:support@smartacademics.in">support@smartacademics.in</a>.</p>
        ),
      },
    ]}
  />
);

export default DisclaimerPage;
