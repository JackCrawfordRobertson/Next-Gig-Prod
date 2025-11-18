export function useFormValidation() {
    // Validate Password Strength
    const validatePassword = (value) => {
      if (!value) return "Create a strong password to secure your account";

      const minLength = 8;
      const hasUpperCase = /[A-Z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

      if (value.length < minLength)
        return `Add ${minLength - value.length} more character${minLength - value.length !== 1 ? 's' : ''} to reach the minimum length`;
      if (!hasUpperCase)
        return "Add an uppercase letter (A-Z) to strengthen your password";
      if (!hasNumber)
        return "Add a number (0-9) to strengthen your password";
      if (!hasSpecialChar)
        return "Add a special character (!@#$%^&*) to strengthen your password";
      return "";
    };

    // Validate Confirm Password
    const validateConfirmPassword = (password, confirmPassword) => {
      if (!confirmPassword) return "Re-enter your password to confirm it matches";
      if (confirmPassword !== password) return "Passwords don't match. Double-check your password";
      return "";
    };

    // Validate Email
    const validateEmail = (email) => {
      if (!email) return "Enter your email address to create your account";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return "Enter a valid email address (e.g., name@example.com)";
      return "";
    };

    // Validate Name Fields
    const validateName = (value, fieldName) => {
      if (!value) return `${fieldName} is required to complete your profile`;
      if (value.trim().length < 2) return `${fieldName} must be at least 2 characters long`;
      if (!/^[a-zA-Z\s'-]+$/.test(value)) return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
      return "";
    };

    // Validate Date of Birth
    const validateDateOfBirth = (value) => {
      if (!value) return "Enter your date of birth to verify your age";
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) return "You must be at least 18 years old to create an account";
      if (age > 120) return "Please enter a valid date of birth";
      return "";
    };

    // Validate Address Fields
    const validateAddress = (value, fieldName) => {
      if (!value || !value.trim()) return `${fieldName} is required to complete your profile`;
      if (value.trim().length < 3) return `${fieldName} must be at least 3 characters`;
      return "";
    };

    // Validate Postcode
    const validatePostcode = (value) => {
      if (!value) return "Postcode is required to verify your location";
      if (!/^[A-Z0-9\s-]{2,10}$/i.test(value)) return "Enter a valid postcode (letters, numbers, spaces, and hyphens only)";
      return "";
    };

    // Validate Job Title
    const validateJobTitle = (value) => {
      if (!value || !value.trim()) return "Enter a job title you're interested in";
      if (value.trim().length < 2) return "Job title must be at least 2 characters";
      if (!/^[a-zA-Z\s]+$/.test(value)) return "Job title can only contain letters and spaces";
      return "";
    };

    // Validate Job Location
    const validateJobLocation = (value) => {
      if (!value || !value.trim()) return "Enter a location where you'd like to work";
      if (value.trim().length < 2) return "Location must be at least 2 characters";
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
      validateName,
      validateDateOfBirth,
      validateAddress,
      validatePostcode,
      validateJobTitle,
      validateJobLocation,
      validateRequired
    };
  }