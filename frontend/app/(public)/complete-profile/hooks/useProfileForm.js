"use client";

import { useState, useEffect } from "react";
import { calculateFormCompletion, getUserIP, getDeviceFingerprint } from "../utils";
import { useFormValidation } from "./useFormValidation";
import { showToast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { isDevelopmentMode } from "@/lib/environment";
import { isUserTester } from "@/lib/subscription";
import {
  createUserWithEmailAndPassword,
  auth,
  db,
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs
} from "@/lib/firebase";
import { signIn } from "next-auth/react";

const initialFormState = {
  email: "",
  password: "",
  confirmPassword: "",
  passwordError: "",
  confirmPasswordError: "",
  firstName: "",
  lastName: "",
  address: {
    firstLine: "",
    secondLine: "",
    city: "",
    postcode: "",
  },
  profilePicture: "/av.svg",
  hasUploadedPicture: false,
  jobTitles: [],
  jobLocations: [],
  dateOfBirth: "",
  // UI state
  jobSearch: "",
  locationInput: "",
  currentStep: 0,
  // Progress
  formCompletion: 0,
  incompleteFields: [],
  // Security
  userIP: null,
  deviceFingerprint: null,
};

export function useProfileForm() {
  const [formState, setFormState] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState(null);
  const validation = useFormValidation();
  const router = useRouter();
  const isDev = isDevelopmentMode();

  // Fetch security data on mount
  useEffect(() => {
    const fetchSecurityData = async () => {
      try {
        const ip = await getUserIP();
        setFormState(state => ({
          ...state,
          userIP: ip,
          deviceFingerprint: getDeviceFingerprint()
        }));
      } catch (error) {
        console.error("Error fetching security data:", error);
        // Still continue - this shouldn't block the form
      }
    };

    fetchSecurityData();
  }, []);

  // Update form completion whenever form state changes
  useEffect(() => {
    const { percentage, missingFields } = calculateFormCompletion(formState);
    setFormState(state => ({
      ...state, 
      formCompletion: percentage,
      incompleteFields: missingFields
    }));
  }, [
    formState.firstName,
    formState.lastName,
    formState.email,
    formState.password,
    formState.confirmPassword,
    formState.passwordError,
    formState.address,
    formState.dateOfBirth,
    formState.jobTitles,
    formState.jobLocations,
    formState.hasUploadedPicture,
  ]);

  // Field update handlers
  const handleInputChange = (field) => (e) => {
    setFormState({ ...formState, [field]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    const error = validation.validatePassword(value);
    setFormState({
      ...formState,
      password: value,
      passwordError: error,
      confirmPasswordError: formState.confirmPassword 
        ? validation.validateConfirmPassword(value, formState.confirmPassword)
        : formState.confirmPasswordError
    });
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setFormState({
      ...formState,
      confirmPassword: value,
      confirmPasswordError: validation.validateConfirmPassword(formState.password, value)
    });
  };

  const handleAddressChange = (field, value) => {
    setFormState({
      ...formState,
      address: { ...formState.address, [field]: value }
    });
  };

  const handleProfilePictureChange = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormState({
          ...formState,
          profilePicture: reader.result,
          hasUploadedPicture: true
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDateOfBirthChange = (value) => {
    setFormState({ ...formState, dateOfBirth: value });
  };

  // Job titles and locations handlers
  const addJobTitle = (title) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    const { isSpelledCorrectly } = require("../utils");
    if (!isSpelledCorrectly(trimmed)) {
      showToast({
        title: "Spelling Check",
        description: "Please use only letters and spaces in job titles.",
        variant: "destructive",
      });
      return;
    }

    // Maximum of 3 job titles
    if (formState.jobTitles.length >= 3) {
      showToast({
        title: "Maximum Reached",
        description: "You can add a maximum of 3 job titles.",
        variant: "destructive",
      });
      return;
    }

    // Convert to title case (capitalise first letter of each word)
    const titleCased = trimmed
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    if (!formState.jobTitles.includes(titleCased)) {
      setFormState({
        ...formState,
        jobTitles: [...formState.jobTitles, titleCased],
        jobSearch: ""
      });
    } else {
      setFormState({ ...formState, jobSearch: "" });
    }
  };

  const removeJobTitle = (title) => {
    setFormState({
      ...formState,
      jobTitles: formState.jobTitles.filter(t => t !== title)
    });
  };

  const handleJobSearchChange = (e) => {
    setFormState({ ...formState, jobSearch: e.target.value });
  };

  const addJobLocation = () => {
    const loc = formState.locationInput.trim();
    if (loc && !formState.jobLocations.includes(loc)) {
      setFormState({
        ...formState,
        jobLocations: [...formState.jobLocations, loc],
        locationInput: ""
      });
    } else if (loc) {
      setFormState({ ...formState, locationInput: "" });
    }
  };

  const removeJobLocation = (location) => {
    setFormState({
      ...formState,
      jobLocations: formState.jobLocations.filter(loc => loc !== location)
    });
  };

  const handleLocationInputChange = (e) => {
    setFormState({ ...formState, locationInput: e.target.value });
  };

  // Step navigation
  const nextStep = () => {
    if (formState.currentStep < 3) {
      setFormState({ ...formState, currentStep: formState.currentStep + 1 });
    }
  };

  const prevStep = () => {
    if (formState.currentStep > 0) {
      setFormState({ ...formState, currentStep: formState.currentStep - 1 });
    }
  };

  const goToStep = (step) => {
    if (step >= 0 && step <= 3) {
      setFormState({ ...formState, currentStep: step });
    }
  };

  // Form submission - Completely rewritten for clarity and reliability
  const handleSignUp = async () => {
    // Clear any previous errors
    setRegistrationError(null);
    
    // Form validation
    if (formState.incompleteFields.length > 0) {
      const errorMessage = `Please complete all required fields: ${formState.incompleteFields.join(", ")}`;
      setRegistrationError(errorMessage);
      showToast({
        title: "Incomplete Form",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }
  
    // Begin registration process
    setLoading(true);
  
    try {
      // Check if user is a tester - consistent across all environments
      const isATester = await isUserTester(formState.email.toLowerCase());
      console.log(`Tester check for ${formState.email}: ${isATester ? "Is a tester" : "Not a tester"}`);
      
      // Check for existing accounts - only if not a tester
      if (!isATester && !isDev) {
        try {
          // Check if user has already used a free trial via IP or device fingerprint
          const usersRef = collection(db, "users");
          const ipQuery = query(usersRef, where("userIP", "==", formState.userIP));
          const fingerprintQuery = query(
            usersRef,
            where("deviceFingerprint", "==", formState.deviceFingerprint)
          );
    
          const [ipSnapshot, fingerprintSnapshot] = await Promise.all([
            getDocs(ipQuery),
            getDocs(fingerprintQuery),
          ]);
    
          if (!ipSnapshot.empty || !fingerprintSnapshot.empty) {
            const errorMessage = "You have already used a free trial with this device.";
            setRegistrationError(errorMessage);
            showToast({
              title: "Trial Already Used",
              description: errorMessage,
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
        } catch (error) {
          console.warn("Error checking for existing accounts:", error);
          // Continue with registration - don't block on this check
        }
      }
      
      // In development mode, log data and skip actual registration
      if (isDev) {
        console.log("DEV MODE: Registration data:", formState);
        setLoading(false);
        showToast({
          title: "Dev Mode",
          description: "Account created successfully (simulated).",
          variant: "success",
        });
        
        // In dev mode, still redirect to dashboard
        setTimeout(() => router.push("/dashboard"), 1000);
        return;
      }
      
      // PRODUCTION FLOW - Create the actual user account
      
      // 1. Create Firebase Authentication account
      console.log("Creating Firebase Auth account...");
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formState.email,
        formState.password
      );
      
      const user = userCredential.user;
      console.log(`Firebase user created with ID: ${user.uid}`);
      
      // 2. Prepare user data with special flags for testers
      const userData = {
        email: formState.email,
        firstName: formState.firstName,
        lastName: formState.lastName,
        dateOfBirth: formState.dateOfBirth,
        address: formState.address,
        profilePicture: formState.profilePicture,
        jobTitles: formState.jobTitles,
        jobLocations: formState.jobLocations,
        subscribed: isATester,
        onTrial: isATester,
        userIP: formState.userIP || "unknown",
        deviceFingerprint: formState.deviceFingerprint || "unknown",
        hadPreviousSubscription: false,
        createdAt: new Date().toISOString(),
      };
      
      // Add special privileges for testers
      if (isATester) {
        userData.isTester = true;
        userData.subscriptionVerified = true;
        userData.subscriptionActive = true;
      }
      
      // 3. Create user document in Firestore
      console.log("Creating Firestore user document...");
      await setDoc(doc(db, "users", user.uid), userData);
      console.log("Firestore document created successfully");
      
      // 4. Sign in with NextAuth to establish session
      console.log("Creating NextAuth session...");
      const signInResult = await signIn("credentials", {
        redirect: false,
        email: formState.email,
        password: formState.password,
      });
      
      // Handle NextAuth sign-in errors
      if (signInResult?.error) {
        console.error("NextAuth sign-in error:", signInResult.error);
        
        // Even if NextAuth fails, the account was created, so show partial success
        showToast({
          title: "Account Created",
          description: "Your account was created but we couldn't sign you in automatically. Please try logging in.",
          variant: "warning",
        });
        
        // Redirect to login page
        setTimeout(() => router.push("/login"), 2000);
        return;
      }
      
      // 5. Success! Show appropriate message and redirect
      if (isATester) {
        showToast({
          title: "Tester Account Created",
          description: "Your tester account has been created with full access.",
          variant: "success",
        });
      } else {
        showToast({
          title: "Account Created",
          description: "Your account has been created successfully!",
          variant: "success",
        });
      }
      
      // Redirect to dashboard with a slight delay to allow toast to be seen
      setTimeout(() => router.push("/dashboard"), 1000);
      
    } catch (error) {
      console.error("Registration error:", error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/email-already-in-use') {
        const errorMessage = "An account with this email already exists. Please try logging in instead.";
        setRegistrationError(errorMessage);
        showToast({
          title: "Email Already Registered",
          description: errorMessage,
          variant: "warning",
        });
        
        // Redirect to login page after a delay
        setTimeout(() => router.push("/login"), 2000);
      } else {
        // Generic error handling
        const errorMessage = error.message || "An unexpected error occurred during registration.";
        setRegistrationError(errorMessage);
        showToast({
          title: "Registration Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if form is valid for submission
  const isFormValid = () => formState.incompleteFields.length === 0;

  return {
    ...formState,
    loading,
    registrationError,
    handleInputChange,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleAddressChange,
    handleProfilePictureChange,
    handleDateOfBirthChange,
    addJobTitle,
    removeJobTitle,
    handleJobSearchChange,
    addJobLocation,
    removeJobLocation,
    handleLocationInputChange,
    nextStep,
    prevStep,
    goToStep,
    handleSignUp,
    isFormValid
  };
}