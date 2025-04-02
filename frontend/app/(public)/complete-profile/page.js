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
import { Upload, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

function isSpelledCorrectly(text) {
  return /^[a-zA-Z\s]+$/.test(text);
}

// ✅ Get user IP address
const getUserIP = async () => {
  try {
    const response = await fetch("https://api64.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch {
    return null;
  }
};

// ✅ Get device fingerprint
const getDeviceFingerprint = () =>
  `${navigator.userAgent}-${navigator.language}-${screen.width}x${screen.height}`;

export default function CompleteProfile() {
  const router = useRouter();
  const isDev = process.env.NODE_ENV === "development"; // ← Check dev vs production

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState({
    firstLine: "",
    secondLine: "",
    city: "",
    postcode: "",
  });
  const [profilePicture, setProfilePicture] = useState("/av.jpeg");
  const [jobTitles, setJobTitles] = useState([]);
  const [jobLocations, setJobLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  // For adding multiple job titles
  const [jobSearch, setJobSearch] = useState("");

  // For adding multiple job locations
  const [locationInput, setLocationInput] = useState("");

  const [userIP, setUserIP] = useState(null);
  const [deviceFingerprint, setDeviceFingerprint] = useState(null);

  useEffect(() => {
    const fetchSecurityData = async () => {
      const ip = await getUserIP();
      setUserIP(ip);
      setDeviceFingerprint(getDeviceFingerprint());
    };

    fetchSecurityData();
  }, []);

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
  };

  // Handle profile picture upload
  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setProfilePicture(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle address changes
  const handleAddressChange = (field, value) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  // Add a job title if spelled correctly
  const addJobTitle = (title) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    if (!isSpelledCorrectly(trimmed)) {
      alert("Please double-check your spelling (letters and spaces only).");
      return;
    }

    if (!jobTitles.includes(trimmed)) {
      setJobTitles((prev) => [...prev, trimmed]);
    }
    setJobSearch("");
  };

  // Remove job title
  const removeJobTitle = (title) => {
    setJobTitles((prev) => prev.filter((t) => t !== title));
  };

  // Add a location on Enter
  const handleAddJobLocation = (e) => {
    if (e.key === "Enter" && locationInput.trim()) {
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
    return (
      firstName.trim() !== "" &&
      lastName.trim() !== "" &&
      email.trim() !== "" &&
      password.trim() !== "" &&
      confirmPassword.trim() !== "" &&
      !passwordError &&
      address.firstLine.trim() !== "" &&
      address.city.trim() !== "" &&
      address.postcode.trim() !== "" &&
      jobTitles.length > 0 &&
      jobLocations.length > 0 &&
      profilePicture &&
      profilePicture !== "/av.jpeg"
    );
  };

  const handleSignUp = async () => {
    if (!userIP || !deviceFingerprint) {
      alert("Please wait a moment before signing up.");
      return;
    }

    if (!isFormValid()) {
      alert("Please complete all fields before proceeding.");
      return;
    }

    setLoading(true);

    try {
      // ✅ Check if user has already used a free trial (either same IP OR same fingerprint)
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
        alert("You have already used a free trial.");
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
        alert("Dev mode - Sign up flow skipped. Check console logs.");
        return;
      }

      // ✅ Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // ✅ Save user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email,
        firstName,
        lastName,
        address,
        profilePicture,
        jobTitles,
        jobLocations,
        subscribed: false,
        userIP, 
        deviceFingerprint,
        hadPreviousSubscription: true,
      });

      // ✅ Sign the user in using NextAuth
      const signInResult = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (signInResult.error) {
        console.error("NextAuth signIn error:", signInResult.error);
        alert("Unable to automatically sign you in. Please log in manually.");
        router.push("/login");
        return;
      }

      // ✅ Redirect to subscription page
      router.push("/subscription");
    } catch (error) {
      console.error("Sign-Up Error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-6">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture Upload */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="w-24 h-24 border border-gray-300 shadow-md">
              <AvatarImage src={profilePicture || "/av.jpeg"} alt="Profile" />
              <AvatarFallback>
                <img
                  src="/av.jpeg"
                  alt="Default Avatar"
                  className="w-full h-full object-cover"
                />
              </AvatarFallback>
            </Avatar>

            <Button
              type="button"
              className="flex items-center gap-2"
              onClick={() => document.getElementById("profile-upload").click()}
            >
              <Upload className="w-4 h-4" />
              Upload Profile Picture
            </Button>
            <Input
              id="profile-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfilePictureChange}
            />
          </div>

          {/* First Name, Last Name in a two-column grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <Input
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            id="password"
            type="password"
            placeholder="Enter a strong password"
            value={password}
            onChange={handlePasswordChange}
          />
          {passwordError && (
            <p className="text-red-500 text-sm">{passwordError}</p>
          )}
          <Input
            id="confirm-password"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
          />

          <Separator />

          {/* Address Fields */}
          <Input
            placeholder="First Line of Address"
            value={address.firstLine}
            onChange={(e) => handleAddressChange("firstLine", e.target.value)}
          />
          <div className="flex gap-2">
            <Input
              placeholder="City"
              value={address.city}
              onChange={(e) => handleAddressChange("city", e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Postcode"
              value={address.postcode}
              onChange={(e) => handleAddressChange("postcode", e.target.value)}
              className="w-32"
            />
          </div>

          {/* Job Titles */}
          <div>
            <Label className="mb-2 block">Job Titles You Want to Search</Label>
            <Input
              placeholder="Type a job title then press Enter"
              value={jobSearch}
              onChange={(e) => setJobSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && jobSearch.trim() !== "") {
                  addJobTitle(jobSearch);
                }
              }}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {jobTitles.map((title) => (
                <div
                  key={title}
                  className="flex items-center space-x-2 bg-gray-200 px-2 py-1 rounded"
                >
                  <span className="text-sm">{title}</span>
                  <button type="button" onClick={() => removeJobTitle(title)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Job Locations */}
          <div>
            <Label className="mb-2 block">Locations You Want to Search</Label>
            <Input
              placeholder="Type a location then press Enter"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={handleAddJobLocation}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {jobLocations.map((loc) => (
                <div
                  key={loc}
                  className="flex items-center space-x-2 bg-gray-200 px-2 py-1 rounded"
                >
                  <span className="text-sm">{loc}</span>
                  <button type="button" onClick={() => removeJobLocation(loc)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Create Account Button */}
          <Button onClick={handleSignUp} disabled={!isFormValid() || loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </CardContent>
        <CardFooter />
      </Card>
    </div>
  );
}
