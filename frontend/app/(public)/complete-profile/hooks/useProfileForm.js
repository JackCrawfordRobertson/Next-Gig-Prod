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
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  auth,
  db,
  signIn
} from "@/lib/firebase";

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
  const validation = useFormValidation();
  const router = useRouter();
  const isDev = isDevelopmentMode();

  // Fetch security data on mount
  useEffect(() => {
    const fetchSecurityData = async () => {
      const ip = await getUserIP();
      setFormState(state => ({
        ...state,
        userIP: ip,
        deviceFingerprint: getDeviceFingerprint()
      }));
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

  // Form submission
  const handleSignUp = async () => {
    if (!formState.userIP || !formState.deviceFingerprint) {
      showToast({
        title: "Please Wait",
        description: "Please wait a moment before signing up.",
        variant: "destructive",
      });
      return;
    }
  
    if (formState.incompleteFields.length > 0) {
      showToast({
        title: "Incomplete Form",
        description: `Please complete all required fields: ${formState.incompleteFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }
  
    setLoading(true);
  
    try {
      // First, check if this email is a tester - do this in ALL environments
      console.log(`Checking if ${formState.email} is a registered tester...`);
      const isATester = await isUserTester(formState.email.toLowerCase());
      console.log(`Tester check result for ${formState.email}: ${isATester}`);
      
      // Only check for previous trials if NOT a tester
      if (!isATester) {
        console.log("Not a tester - checking for previous trial usage");
        // Check if user has already used a free trial
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
          showToast({
            title: "Trial Already Used",
            description: "You have already used a free trial.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      } else {
        console.log(`User ${formState.email} is a tester - skipping trial usage check`);
      }
  
      if (isDev) {
        console.log("DEV MODE: Skipping real Firebase sign-up. Your data:", formState);
        setLoading(false);
        showToast({
          title: "Dev Mode",
          description: "Sign up flow skipped. Check console logs.",
        });
        return;
      }
  
      try {
        // Try to create user in Firebase Authentication
        console.log(`Attempting to create user with email: ${formState.email}`);
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formState.email,
          formState.password
        );
        const user = userCredential.user;
        console.log(`User created successfully with ID: ${user.uid}`);
  
        // Set special flags for testers
        const specialPrivileges = isATester ? {
          isTester: true,
          // Testers get unlimited access without trials
          subscriptionVerified: true,
          subscriptionActive: true,
        } : {};
  
        // Save user data in Firestore
        await setDoc(doc(db, "users", user.uid), {
          email: formState.email,
          firstName: formState.firstName,
          lastName: formState.lastName,
          dateOfBirth: formState.dateOfBirth,
          address: formState.address,
          profilePicture: formState.profilePicture,
          jobTitles: formState.jobTitles,
          jobLocations: formState.jobLocations,
          subscribed: isATester, // Testers are auto-subscribed
          onTrial: isATester, // Testers get perpetual "trial"
          userIP: formState.userIP,
          deviceFingerprint: formState.deviceFingerprint,
          // FIX: Default to false for new users
          hadPreviousSubscription: false,
          // Add creation timestamp
          createdAt: new Date().toISOString(),
          // Add any special privileges for testers
          ...specialPrivileges
        });
  
        console.log("User document created in Firestore");
  
        // If this is a tester, show a special message
        if (isATester) {
          showToast({
            title: "Tester Account Created",
            description: "Your tester account has been set up with full access.",
            variant: "success",
          });
        }
  
        // Sign the user in using NextAuth
        const signInResult = await signIn("credentials", {
          redirect: false,
          email: formState.email,
          password: formState.password,
        });
        
        if (signInResult?.error) {
          console.error("NextAuth sign-in error:", signInResult.error);
          throw new Error(signInResult.error);
        }
        
        console.log("User signed in successfully with NextAuth");
        
        // Redirect to dashboard
        router.push("/dashboard");
        
      } catch (error) {
        console.error("Sign-Up Error:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        
        // Handle the "email already in use" error more gracefully
        if (error.code === 'auth/email-already-in-use') {
          showToast({
            title: "Email Already Registered",
            description: "An account with this email already exists. Please try logging in instead.",
            variant: "warning",
          });
          // Redirect to login page
          setTimeout(() => router.push("/login"), 2000);
        } else {
          showToast({
            title: "Sign-Up Error",
            description: error.message || "An unexpected error occurred",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      // Handle outer try/catch errors
      console.error("Outer error in sign-up process:", error);
      showToast({
        title: "Registration Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if form is valid for submission
  const isFormValid = () => formState.incompleteFields.length === 0;

  return {
    ...formState,
    loading,
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