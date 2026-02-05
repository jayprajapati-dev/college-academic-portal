// Form Validation Utility

// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (Indian format)
export const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// URL validation
export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Password strength validation
export const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Required field validation
export const isRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined && value !== '';
};

// Min length validation
export const minLength = (value, min) => {
  return value && value.length >= min;
};

// Max length validation
export const maxLength = (value, max) => {
  return value && value.length <= max;
};

// Number range validation
export const isInRange = (value, min, max) => {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
};

// Code validation (uppercase alphanumeric)
export const isValidCode = (code) => {
  const codeRegex = /^[A-Z0-9]+$/;
  return codeRegex.test(code);
};

// Semester number validation
export const isValidSemester = (semester) => {
  const num = Number(semester);
  return Number.isInteger(num) && num >= 1 && num <= 12;
};

// Marks validation
export const isValidMarks = (marks) => {
  const num = Number(marks);
  return !isNaN(num) && num >= 0 && num <= 100;
};

// Form validation helper
export const validateForm = (formData, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = formData[field];
    const fieldRules = rules[field];
    
    // Required validation
    if (fieldRules.required && !isRequired(value)) {
      errors[field] = `${fieldRules.label || field} is required`;
      return;
    }
    
    // Skip other validations if field is empty and not required
    if (!value && !fieldRules.required) {
      return;
    }
    
    // Email validation
    if (fieldRules.type === 'email' && !isValidEmail(value)) {
      errors[field] = 'Invalid email address';
      return;
    }
    
    // Phone validation
    if (fieldRules.type === 'phone' && !isValidPhone(value)) {
      errors[field] = 'Invalid phone number (10 digits, starting with 6-9)';
      return;
    }
    
    // URL validation
    if (fieldRules.type === 'url' && !isValidURL(value)) {
      errors[field] = 'Invalid URL';
      return;
    }
    
    // Min length validation
    if (fieldRules.minLength && !minLength(value, fieldRules.minLength)) {
      errors[field] = `Minimum ${fieldRules.minLength} characters required`;
      return;
    }
    
    // Max length validation
    if (fieldRules.maxLength && !maxLength(value, fieldRules.maxLength)) {
      errors[field] = `Maximum ${fieldRules.maxLength} characters allowed`;
      return;
    }
    
    // Range validation
    if (fieldRules.min !== undefined && fieldRules.max !== undefined) {
      if (!isInRange(value, fieldRules.min, fieldRules.max)) {
        errors[field] = `Value must be between ${fieldRules.min} and ${fieldRules.max}`;
        return;
      }
    }
    
    // Custom validation
    if (fieldRules.custom) {
      const customError = fieldRules.custom(value, formData);
      if (customError) {
        errors[field] = customError;
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Example usage:
/*
const formRules = {
  name: {
    required: true,
    label: 'Name',
    minLength: 3,
    maxLength: 50
  },
  email: {
    required: true,
    type: 'email',
    label: 'Email'
  },
  semester: {
    required: true,
    min: 1,
    max: 8,
    custom: (value) => {
      if (!Number.isInteger(Number(value))) {
        return 'Semester must be a whole number';
      }
    }
  }
};

const { isValid, errors } = validateForm(formData, formRules);
*/
