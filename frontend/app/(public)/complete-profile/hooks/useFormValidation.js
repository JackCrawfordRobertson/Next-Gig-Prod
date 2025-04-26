export function useFormValidation() {
    // Validate Password Strength
    const validatePassword = (value) => {
      if (!value) return "Password is required";
      
      const minLength = 8;
      const hasUpperCase = /[A-Z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
  
      if (value.length < minLength)
        return "Password must be at least 8 characters long.";
      if (!hasUpperCase)
        return "Password must contain at least one uppercase letter.";
      if (!hasNumber) return "Password must contain at least one number.";
      if (!hasSpecialChar)
        return "Password must contain at least one special character.";
      return "";
    };
  
    // Validate Confirm Password
    const validateConfirmPassword = (password, confirmPassword) => {
      if (!confirmPassword) return "Please confirm your password";
      if (confirmPassword !== password) return "Passwords do not match";
      return "";
    };
  
    // Validate Email
    const validateEmail = (email) => {
      if (!email) return "Email is required";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return "Please enter a valid email address";
      return "";
    };
  
    // Validate Required Field
    const validateRequired = (value, fieldName) => {
      return value ? "" : `${fieldName} is required`;
    };
  
    return {
      validatePassword,
      validateConfirmPassword,
      validateEmail,
      validateRequired
    };
  }