"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { signIn } from "next-auth/react";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload, X, Plus, Calendar } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { showToast } from "@/lib/toast";
import { Progress } from "@/components/ui/progress";


function isSpelledCorrectly(text) {
  return /^[a-zA-Z\s]+$/.test(text);
}

// Get user IP address
const getUserIP = async () => {
  try {
    const response = await fetch("https://api64.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch {
    return null;
  }
};

// Get device fingerprint
const getDeviceFingerprint = () =>
  `${navigator.userAgent}-${navigator.language}-${screen.width}x${screen.height}`;

export default function CompleteProfile() {
  const router = useRouter();
  const isDev = process.env.NODE_ENV === "development";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState({
    firstLine: "",
    secondLine: "",
    city: "",
    postcode: "",
  });
  const [profilePicture, setProfilePicture] = useState("/av.svg");
  const [hasUploadedPicture, setHasUploadedPicture] = useState(false);
  const [jobTitles, setJobTitles] = useState([]);
  const [jobLocations, setJobLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  // For adding multiple job titles
  const [jobSearch, setJobSearch] = useState("");

  // For adding multiple job locations
  const [locationInput, setLocationInput] = useState("");

  const [userIP, setUserIP] = useState(null);
  const [deviceFingerprint, setDeviceFingerprint] = useState(null);

  // Form completion progress
  const [formCompletion, setFormCompletion] = useState(0);
  const [incompleteFields, setIncompleteFields] = useState([]);

  //Dob
  const [dateOfBirth, setDateOfBirth] = useState("");


  useEffect(() => {
    const fetchSecurityData = async () => {
      const ip = await getUserIP();
      setUserIP(ip);
      setDeviceFingerprint(getDeviceFingerprint());
    };

    fetchSecurityData();
  }, []);

// Update form completion status
// Update form completion status
useEffect(() => {
  const missingFields = [];

  // Basic field checks
  if (!firstName.trim()) missingFields.push("First Name");
  if (!lastName.trim()) missingFields.push("Last Name");
  if (!email.trim()) missingFields.push("Email");
  if (!password.trim()) missingFields.push("Password");
  if (!confirmPassword.trim()) missingFields.push("Confirm Password");
  
  // Only check password validity if a password is entered
  if (password.trim() && passwordError) missingFields.push("Valid Password");
  
  // Only check if passwords match if both are entered
  if ((password.trim() || confirmPassword.trim()) && password !== confirmPassword) 
    missingFields.push("Matching Passwords");
  
  if (!address.firstLine.trim()) missingFields.push("Address");
  if (!address.city.trim()) missingFields.push("City");
  if (!address.postcode.trim()) missingFields.push("Postcode");
  if (!dateOfBirth.trim()) missingFields.push("Date of Birth");
  if (jobTitles.length === 0) missingFields.push("Job Titles");
  if (jobLocations.length === 0) missingFields.push("Job Locations");
  if (!hasUploadedPicture) missingFields.push("Profile Picture");

  setIncompleteFields(missingFields);

  

  // Calculate completion percentage
  const totalFields = 13; // Total number of required fields
  
  // Force to 0 when form is empty by checking if any field has input
  const hasAnyInput = 
    firstName.trim() || 
    lastName.trim() || 
    email.trim() || 
    password.trim() || 
    confirmPassword.trim() || 
    address.firstLine.trim() || 
    address.city.trim() || 
    address.postcode.trim() || 
    dateOfBirth.trim() ||  // Add this line

    jobTitles.length > 0 || 
    jobLocations.length > 0 || 
    hasUploadedPicture;
  
  if (!hasAnyInput) {
    setFormCompletion(0);
  } else {
    const completedFields = totalFields - missingFields.length;
    const completionPercentage = Math.floor((completedFields / totalFields) * 100);
    setFormCompletion(completionPercentage);
  }
}, [
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
  hasUploadedPicture,
]);

  // Validate Password Strength
  const validatePassword = (value) => {
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

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setPasswordError(validatePassword(e.target.value));
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (e.target.value !== password) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError("");
    }
  };

  // Handle profile picture upload
  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePicture(reader.result);
        setHasUploadedPicture(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle date of birth changes
  const handleDateOfBirthChange = (e) => {
    setDateOfBirth(e.target.value);
  };

  // Handle address changes
  const handleAddressChange = (field, value) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  // Add job title if spelled correctly and under the limit
  const addJobTitle = (title) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    if (!isSpelledCorrectly(trimmed)) {
      showToast({
        title: "Spelling Check",
        description: "Please use only letters and spaces in job titles.",
        variant: "destructive",
      });
      return;
    }

    // Maximum of 3 job titles
    if (jobTitles.length >= 3) {
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

    if (!jobTitles.includes(titleCased)) {
      setJobTitles((prev) => [...prev, titleCased]);
    }
    setJobSearch("");
  };

  // Remove job title
  const removeJobTitle = (title) => {
    setJobTitles((prev) => prev.filter((t) => t !== title));
  };

  // Add a job location
  const addJobLocation = () => {
    if (locationInput.trim()) {
      const loc = locationInput.trim();
      if (!jobLocations.includes(loc)) {
        setJobLocations((prev) => [...prev, loc]);
      }
      setLocationInput("");
    }
  };

  // Remove a location
  const removeJobLocation = (location) => {
    setJobLocations((prev) => prev.filter((loc) => loc !== location));
  };

  // Check if everything is filled out
  const isFormValid = () => {
    return incompleteFields.length === 0;
  };

  const handleSignUp = async () => {
    if (!userIP || !deviceFingerprint) {
      showToast({
        title: "Please Wait",
        description: "Please wait a moment before signing up.",
        variant: "destructive",
      });
      return;
    }

    if (!isFormValid()) {
      showToast({
        title: "Incomplete Form",
        description: `Please complete all required fields: ${incompleteFields.join(
          ", "
        )}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Check if user has already used a free trial
      const usersRef = collection(db, "users");
      const ipQuery = query(usersRef, where("userIP", "==", userIP));
      const fingerprintQuery = query(
        usersRef,
        where("deviceFingerprint", "==", deviceFingerprint)
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

      if (isDev) {
        console.log("DEV MODE: Skipping real Firebase sign-up. Your data:", {
          email,
          password,
          confirmPassword,
          firstName,
          lastName,
          address,
          profilePicture,
          jobTitles,
          jobLocations,
          userIP,
          deviceFingerprint,
        });
        setLoading(false);
        showToast({
          title: "Dev Mode",
          description: "Sign up flow skipped. Check console logs.",
        });
        return;
      }

      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Save user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email,
        firstName,
        lastName,
        dateOfBirth,
        address,
        profilePicture,
        jobTitles,
        jobLocations,
        subscribed: false,
        userIP,
        deviceFingerprint,
        hadPreviousSubscription: true,
      });

      // Sign the user in using NextAuth
      const signInResult = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (signInResult.error) {
        console.error("NextAuth signIn error:", signInResult.error);
        showToast({
          title: "Sign In Error",
          description:
            "Unable to automatically sign you in. Please log in manually.",
          variant: "destructive",
        });
        router.push("/login");
        return;
      }

      // Redirect to subscription page
      router.push("/subscription");
    } catch (error) {
      console.error("Sign-Up Error:", error);
      showToast({
        title: "Sign-Up Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-6">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Complete Your Profile</CardTitle>
            <div className="text-sm text-gray-500">{formCompletion}%</div>
          </div>
          <Progress value={formCompletion} className="h-2 w-full mt-2" />
          {incompleteFields.length > 0 && (
            <p className="text-xs text-amber-600 mt-1">
              Missing: {incompleteFields.slice(0, 3).join(", ")}
              {incompleteFields.length > 3
                ? ` and ${incompleteFields.length - 3} more`
                : ""}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Profile Picture + Name Row */}
          <div className="flex gap-4">
            {/* Profile Picture */}
            <div className="flex flex-col items-center space-y-2 p-2 rounded-lg">
              <div className="relative">
                <Avatar className="w-20 h-20 border border-gray-300 shadow-md">
                  <AvatarImage src={profilePicture} alt="Profile" />
                  <AvatarFallback>
                    <img
                      src="/av.svg"
                      alt="Default Avatar"
                      className="w-full h-full object-fill"
                    />
                  </AvatarFallback>
                </Avatar>
                {!hasUploadedPicture && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-full text-amber-600 text-xs font-medium">
                    Required
                  </div>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                className="flex items-center gap-1 text-xs"
                onClick={() =>
                  document.getElementById("profile-upload").click()
                }
              >
                <Upload className="w-3 h-3" />
                {hasUploadedPicture ? "Change" : "Upload"}
              </Button>
              <Input
                id="profile-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePictureChange}
              />
            </div>

{/* Name Fields */}
<div className="flex-1 space-y-2">
  {/* First & Last Name on one line */}
  <div className="grid grid-cols-2 gap-2">
    <div>
      <Label htmlFor="firstName" className="text-xs">
        First Name *
      </Label>
      <Input
        id="firstName"
        placeholder="First Name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />
    </div>
    <div>
      <Label htmlFor="lastName" className="text-xs">
        Last Name *
      </Label>
      <Input
        id="lastName"
        placeholder="Last Name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />
    </div>
  </div>
  
  {/* Date of Birth */}
  <div>
  <Label htmlFor="dateOfBirth" className="text-xs">
    Date of Birth *
  </Label>
  <div className="relative">
    <Input
      id="dateOfBirth"
      type="text" 
      placeholder="DD/MM/YYYY"
      value={dateOfBirth}
      onChange={(e) => {
        // Allow only digits and slashes
        const value = e.target.value.replace(/[^\d\/]/g, '');
        setDateOfBirth(value);
      }}
      className="h-10 w-full"
    />
    <div 
      className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
      onClick={() => {
        const input = document.getElementById('dateOfBirth-hidden');
        if (input) input.showPicker();
      }}
    >
      <Calendar className="h-4 w-4 text-gray-400" />
    </div>
    <input
      id="dateOfBirth-hidden"
      type="date"
      className="sr-only"
      onChange={(e) => {
        if (e.target.value) {
          // Format the date as DD/MM/YYYY
          const date = new Date(e.target.value);
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          setDateOfBirth(`${day}/${month}/${year}`);
        }
      }}
    />
  </div>
</div>
</div>
          </div>

          {/* Account Details Section */}
          <div>
            <Label htmlFor="email" className="text-xs">
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password Fields in a Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="password" className="text-xs">
                Password *
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={handlePasswordChange}
              />
              {passwordError && (
                <p className="text-red-500 text-xs mt-1">{passwordError}</p>
              )}
            </div>
            <div>
              <Label htmlFor="confirm-password" className="text-xs">
                Confirm Password *
              </Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
              />
              {confirmPasswordError && (
                <p className="text-red-500 text-xs mt-1">
                  {confirmPasswordError}
                </p>
              )}
            </div>
          </div>

          <Separator className="my-1" />

          {/* Address Fields in a Row */}
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-2">
              <Label htmlFor="address-line1" className="text-xs">
                Address Line 1 *
              </Label>
              <Input
                id="address-line1"
                placeholder="First Line of Address"
                value={address.firstLine}
                onChange={(e) =>
                  handleAddressChange("firstLine", e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="city" className="text-xs">
                City *
              </Label>
              <Input
                id="city"
                placeholder="City"
                value={address.city}
                onChange={(e) => handleAddressChange("city", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="postcode" className="text-xs">
                Postcode *
              </Label>
              <Input
                id="postcode"
                placeholder="Postcode"
                value={address.postcode}
                onChange={(e) =>
                  handleAddressChange("postcode", e.target.value)
                }
              />
            </div>
          </div>

          {/* Job Titles */}
          <div>
            <Label className="text-xs">
              Job Titles You Want to Search ({jobTitles.length}/3) *
            </Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Type a job title"
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && jobSearch.trim() !== "") {
                    addJobTitle(jobSearch);
                  }
                }}
                className="h-10" // Explicitly set height
              />
              <Button
                type="button"
                onClick={() => addJobTitle(jobSearch)}
                className="h-10 px-3" // Match input height and adjust padding
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {jobTitles.map((title) => (
                <div
                  key={title}
                  className="flex items-center space-x-1 bg-gray-200 px-2 py-0.5 rounded text-xs"
                >
                  <span>{title}</span>
                  <button type="button" onClick={() => removeJobTitle(title)}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Job Locations */}
          {/* Job Locations */}
          <div>
            <Label className="text-xs">Locations You Want to Search *</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Type a location"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && locationInput.trim() !== "") {
                    addJobLocation();
                  }
                }}
                className="h-10" // Match height with other inputs
              />
              <Button
                type="button"
                onClick={addJobLocation}
                className="h-10 px-3" // Match input height
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {jobLocations.map((loc) => (
                <div
                  key={loc}
                  className="flex items-center space-x-1 bg-gray-200 px-2 py-0.5 rounded text-xs"
                >
                  <span>{loc}</span>
                  <button type="button" onClick={() => removeJobLocation(loc)}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Create Account Button */}
          <div className="pt-2">
            <Button
              onClick={handleSignUp}
              disabled={!isFormValid() || loading}
              className="w-full"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
            {!isFormValid() && (
              <p className="text-xs text-center text-amber-600 mt-1">
                Please complete all required fields
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
