import { useState, useCallback } from 'react';
import { validateForm } from '../utils/validation';

// Custom hook for form handling with validation
export const useForm = (initialValues, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setValues(prev => ({
      ...prev,
      [name]: fieldValue
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  // Handle field blur
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Validate single field on blur
    if (validationRules[name]) {
      const { errors: validationErrors } = validateForm(values, { [name]: validationRules[name] });
      if (validationErrors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: validationErrors[name]
        }));
      }
    }
  }, [values, validationRules]);

  // Validate all fields
  const validate = useCallback(() => {
    if (Object.keys(validationRules).length === 0) {
      return { isValid: true, errors: {} };
    }
    
    const validation = validateForm(values, validationRules);
    setErrors(validation.errors);
    return validation;
  }, [values, validationRules]);

  // Handle form submit
  const handleSubmit = useCallback((onSubmit) => {
    return async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      
      // Mark all fields as touched
      const allTouched = Object.keys(validationRules).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      setTouched(allTouched);
      
      // Validate form
      const validation = validate();
      
      if (validation.isValid) {
        try {
          await onSubmit(values);
        } catch (error) {
          console.error('Form submission error:', error);
        }
      }
      
      setIsSubmitting(false);
    };
  }, [values, validate, validationRules]);

  // Reset form
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Set field value manually
  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Set field error manually
  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    validate,
    reset,
    setFieldValue,
    setFieldError,
    setValues
  };
};

export default useForm;
