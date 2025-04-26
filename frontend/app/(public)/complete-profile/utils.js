// Helper functions for form validation and security
export function isSpelledCorrectly(text) {
    return /^[a-zA-Z\s]+$/.test(text);
  }
  
  // Get user IP address
  export const getUserIP = async () => {
    try {
      const response = await fetch("https://api64.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch {
      return null;
    }
  };
  
  // Get device fingerprint
  export const getDeviceFingerprint = () =>
    `${navigator.userAgent}-${navigator.language}-${screen.width}x${screen.height}`;
  
  // Format date string to DD/MM/YYYY
  export const formatDateString = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  // Calculate form completion percentage
  export const calculateFormCompletion = (formData) => {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      passwordError,
      address,
      dateOfBirth,
      jobTitles,
      jobLocations,
      hasUploadedPicture
    } = formData;
  
    const missingFields = [];
  
    if (!firstName.trim()) missingFields.push("First Name");
    if (!lastName.trim()) missingFields.push("Last Name");
    if (!email.trim()) missingFields.push("Email");
    if (!password.trim()) missingFields.push("Password");
    if (!confirmPassword.trim()) missingFields.push("Confirm Password");
    
    if (password.trim() && passwordError) missingFields.push("Valid Password");
    if ((password.trim() || confirmPassword.trim()) && password !== confirmPassword) 
      missingFields.push("Matching Passwords");
    
    if (!address.firstLine.trim()) missingFields.push("Address");
    if (!address.city.trim()) missingFields.push("City");
    if (!address.postcode.trim()) missingFields.push("Postcode");
    if (!dateOfBirth.trim()) missingFields.push("Date of Birth");
    if (jobTitles.length === 0) missingFields.push("Job Titles");
    if (jobLocations.length === 0) missingFields.push("Job Locations");
    if (!hasUploadedPicture) missingFields.push("Profile Picture");
  
    // Calculate completion percentage
    const totalFields = 13; // Total number of required fields
    
    // Force to 0 when form is empty
    const hasAnyInput = 
      firstName.trim() || 
      lastName.trim() || 
      email.trim() || 
      password.trim() || 
      confirmPassword.trim() || 
      address.firstLine.trim() || 
      address.city.trim() || 
      address.postcode.trim() || 
      dateOfBirth.trim() ||
      jobTitles.length > 0 || 
      jobLocations.length > 0 || 
      hasUploadedPicture;
    
    if (!hasAnyInput) {
      return { percentage: 0, missingFields };
    } else {
      const completedFields = totalFields - missingFields.length;
      const completionPercentage = Math.floor((completedFields / totalFields) * 100);
      return { percentage: completionPercentage, missingFields };
    }
  };