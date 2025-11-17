"use client";

import { useState, useEffect } from "react";
import { calculateFormCompletion, getUserIP, getDeviceFingerprint } from "../utils";
import { useFormValidation } from "./useFormValidation";
import { showToast } from "@/lib/utils/toast";
import { useRouter } from "next/navigation";
import { isDevelopmentMode } from "@/lib/utils/environment";
import { isUserTester } from "@/lib/subscriptions/subscription";
import { useNextAuthStrategy } from "@/lib/auth/auth-strategy";
import { hash } from "bcryptjs";

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
} from "@/lib/data/firebase";
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

    // Maximum of 1 location
    if (formState.jobLocations.length >= 1) {
      showToast({
        title: "Maximum Reached",
        description: "You can add only 1 location.",
        variant: "destructive",
      });
      return;
    }

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
    setRegistrationError(null);
    
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
  
    setLoading(true);
  
    try {
      // Hash password
      const hashedPassword = await hash(formState.password, 12);

      // Create user in Firestore directly
      const usersRef = collection(db, "users");

      // Check if email already exists
      const q = query(usersRef, where("email", "==", formState.email.toLowerCase()));
      const existingUserSnapshot = await getDocs(q);

      if (!existingUserSnapshot.empty) {
        throw new Error("Email already registered");
      }

      // Create new user document
      const newUserRef = doc(collection(db, "users"));
      const userId = newUserRef.id;

      // FREE ACCESS MODE: All users get immediate access
      const userData = {
        email: formState.email.toLowerCase(),
        password: hashedPassword,
        firstName: formState.firstName,
        lastName: formState.lastName,
        dateOfBirth: formState.dateOfBirth,
        address: formState.address,
        profilePicture: formState.profilePicture,
        jobTitles: formState.jobTitles,
        jobLocations: formState.jobLocations,
        subscribed: true,  // FREE MODE: All users get full access
        onTrial: false,
        isTester: false,
        userIP: formState.userIP || "unknown",
        deviceFingerprint: formState.deviceFingerprint || "unknown",
        createdAt: new Date().toISOString(),
        emailVerified: new Date().toISOString(),
      };
      
      await setDoc(newUserRef, userData);
      
      // Sign in with NextAuth
      const signInResult = await signIn("credentials", {
        redirect: false,
        email: formState.email,
        password: formState.password,
      });

      if (signInResult?.error) {
        throw new Error("Failed to sign in after registration");
      }

      // FREE ACCESS MODE: All users get immediate full access
      showToast({
        title: "Account Created Successfully!",
        description: "You now have full access to Next Gig.",
        variant: "success",
      });

      // Wait for session to be established
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push("/dashboard");
      
    } catch (error) {
      console.error("Registration error:", error);
      
      const errorMessage = error.message || "An unexpected error occurred during registration.";
      setRegistrationError(errorMessage);
      showToast({
        title: "Registration Error",
        description: errorMessage,
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