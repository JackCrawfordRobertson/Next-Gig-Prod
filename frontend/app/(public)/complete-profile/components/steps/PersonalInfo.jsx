"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, Calendar, ArrowLeft, X } from "lucide-react";
import { useRef } from "react";
import { useRouter } from "next/navigation";

export default function PersonalInfo({
  firstName,
  lastName,
  firstNameError,
  lastNameError,
  dateOfBirth,
  dateOfBirthError,
  profilePicture,
  hasUploadedPicture,
  onNameChange,
  onDateChange,
  onPhotoChange
}) {
  const fileInputRef = useRef(null);
  const router = useRouter();

  return (
    <div className="space-y-4" aria-labelledby="personal-info-heading">
      {/* Back to Login Button */}
   
      
      <h2 id="personal-info-heading" className="sr-only">Personal Information</h2>
      
      {/* Profile Picture + Name Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Profile Picture */}
        <div className="flex flex-col items-center space-y-2 p-2 rounded-lg">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Photo <span className="text-muted-foreground">(Recommended)</span>
            </p>
          </div>
          <div className="relative">
            <Avatar className="w-20 h-20 border border-border shadow-md overflow-hidden">
              <AvatarImage
                src={profilePicture}
                alt="Profile"
                className="object-cover"
              />
              <AvatarFallback>
                <img
                  src="/av.svg"
                  alt="Default Avatar"
                  className="w-full h-full object-cover"
                />
              </AvatarFallback>
            </Avatar>
            {!hasUploadedPicture && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-background/80 dark:bg-background/95 rounded-full text-muted-foreground text-xs font-medium"
                aria-label="Profile picture optional"
              >
                Optional
              </div>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            className="flex items-center gap-1 text-xs"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload profile picture"
          >
            <Upload className="w-3 h-3" />
            {hasUploadedPicture ? "Change" : "Upload"}
          </Button>
          <Input
            ref={fileInputRef}
            id="profile-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                onPhotoChange(e.target.files[0]);
              }
            }}
            aria-hidden="true"
          />
        </div>

        {/* Name Fields */}
        <div className="flex-1 space-y-2">
          {/* First & Last Name on one line */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <Label htmlFor="firstName" className="text-xs">
                First Name <span aria-hidden="true">*</span>
              </Label>
              <Input
                id="firstName"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => onNameChange('firstName', e.target.value)}
                aria-required="true"
                aria-invalid={!!firstNameError}
                aria-describedby={firstNameError ? "firstName-error" : undefined}
                autoComplete="given-name"
                className={firstNameError ? "border-red-500" : ""}
              />
              {firstNameError && (
                <p id="firstName-error" className="text-red-500 text-xs mt-1 flex items-center gap-1" aria-live="polite">
                  <X className="h-3 w-3" /> {firstNameError}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName" className="text-xs">
                Last Name <span aria-hidden="true">*</span>
              </Label>
              <Input
                id="lastName"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => onNameChange('lastName', e.target.value)}
                aria-required="true"
                aria-invalid={!!lastNameError}
                aria-describedby={lastNameError ? "lastName-error" : undefined}
                autoComplete="family-name"
                className={lastNameError ? "border-red-500" : ""}
              />
              {lastNameError && (
                <p id="lastName-error" className="text-red-500 text-xs mt-1 flex items-center gap-1" aria-live="polite">
                  <X className="h-3 w-3" /> {lastNameError}
                </p>
              )}
            </div>
          </div>
          
          {/* Date of Birth */}
          <div>
            <Label htmlFor="dateOfBirth" className="text-xs">
              Date of Birth <span aria-hidden="true">*</span>
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
                  onDateChange(value);
                }}
                className={`h-10 w-full ${dateOfBirthError ? "border-red-500" : ""}`}
                aria-required="true"
                aria-invalid={!!dateOfBirthError}
                aria-describedby={dateOfBirthError ? "dateOfBirth-error" : undefined}
                autoComplete="bday"
              />
              <div
                className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                onClick={() => {
                  const input = document.getElementById('dateOfBirth-hidden');
                  if (input) input.showPicker();
                }}
                aria-label="Open date picker"
              >
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                id="dateOfBirth-hidden"
                type="date"
                className="sr-only"
                onChange={(e) => {
                  if (e.target.value) {
                    // Format the date as DD/MM/YYYY using the utility
                    const { formatDateString } = require("../../utils");
                    onDateChange(formatDateString(e.target.value));
                  }
                }}
                aria-hidden="true"
              />
            </div>
            {dateOfBirthError && (
              <p id="dateOfBirth-error" className="text-red-500 text-xs mt-1 flex items-center gap-1" aria-live="polite">
                <X className="h-3 w-3" /> {dateOfBirthError}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}