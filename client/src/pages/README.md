# Pages Folder Structure

This folder contains all the page components for the SmartAcademics application.

## Structure

```
pages/
├── index.js                    # Barrel export file (exports all pages)
├── LandingPage.jsx             # Home/Landing page
├── LoginPage.jsx               # User login page
├── RegisterPage.jsx            # User registration page
├── ForgotPasswordPage.jsx      # Password recovery page
├── AboutPage.jsx               # About us page
├── ContactPage.jsx             # Contact form page
├── PrivacyPage.jsx             # Privacy policy page
├── TermsPage.jsx               # Terms & conditions page
├── DisclaimerPage.jsx          # Disclaimer page
└── LegalPage.jsx               # Reusable legal page template
```

## Pages Description

### Main Pages
- **LandingPage**: Landing page with academic explorer, resource cards, and analytics
- **LoginPage**: Secure login portal with encrypted connection
- **RegisterPage**: Student registration with premium design
- **ForgotPasswordPage**: Password recovery with security verification

### Information Pages
- **AboutPage**: Company information, vision, mission, and services
- **ContactPage**: Contact form and support information

### Legal Pages
- **PrivacyPage**: Privacy policy documentation
- **TermsPage**: Terms and conditions
- **DisclaimerPage**: Legal disclaimer
- **LegalPage**: Reusable template for all legal pages (Privacy, Terms, Disclaimer)

## Usage

### Import individual pages:
```javascript
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
```

### Or use barrel import (from index.js):
```javascript
import { LandingPage, LoginPage, RegisterPage } from './pages';
```

## Routing

All pages are routed in `App.js`:
- `/` - LandingPage
- `/login` - LoginPage
- `/register` - RegisterPage
- `/forgot-password` - ForgotPasswordPage
- `/about` - AboutPage
- `/contact` - ContactPage
- `/privacy` - PrivacyPage
- `/terms` - TermsPage
- `/disclaimer` - DisclaimerPage

## Design Features

All pages include:
- ✅ Responsive design (320px - 2560px)
- ✅ Dark mode support
- ✅ Professional headers and footers
- ✅ Mesh backgrounds
- ✅ Glass-morphism effects
- ✅ Smooth transitions and animations
- ✅ Consistent color scheme (Primary: #194ce6)
