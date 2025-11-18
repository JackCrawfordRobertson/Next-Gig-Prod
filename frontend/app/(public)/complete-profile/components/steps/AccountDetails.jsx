"use client";

import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Check, X } from "lucide-react";

// Password strength checker
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "" };

  let score = 0;
  const hasLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (hasLength) score += 25;
  if (hasUppercase) score += 25;
  if (hasNumber) score += 25;
  if (hasSpecial) score += 25;

  let label = "";
  let color = "";

  if (score <= 25) {
    label = "Weak";
    color = "bg-red-500";
  } else if (score <= 50) {
    label = "Fair";
    color = "bg-orange-500";
  } else if (score <= 75) {
    label = "Good";
    color = "bg-yellow-500";
  } else {
    label = "Strong";
    color = "bg-green-500";
  }

  return { score, label, color, hasLength, hasUppercase, hasNumber, hasSpecial };
};

export default function AccountDetails({
  email,
  password,
  confirmPassword,
  passwordError,
  confirmPasswordError,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailExists, setEmailExists] = useState(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const emailCheckTimeoutRef = useRef(null);

  const passwordStrength = getPasswordStrength(password);

  // Debounced email existence check
  const handleEmailChange = async (e) => {
    onEmailChange(e);
    const emailValue = e.target.value;

    if (!emailValue) {
      setEmailExists(null);
      return;
    }

    // Debounce: only check after user stops typing for 800ms
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current);
    }

    setCheckingEmail(true);
    emailCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch("/api/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailValue.toLowerCase() })
        });
        const { exists } = await response.json();
        setEmailExists(exists);
      } catch (error) {
        console.error("Email check failed:", error);
        setEmailExists(null);
      } finally {
        setCheckingEmail(false);
      }
    }, 800);
  };

  return (
    <div className="space-y-5" aria-labelledby="account-details-heading">
      <h2 id="account-details-heading" className="sr-only">Account Details</h2>

      {/* Email Field with Real-time Validation */}
      <div>
        <Label htmlFor="email" className="text-xs font-semibold">
          Email Address <span aria-hidden="true" className="text-red-500">*</span>
        </Label>
        <div className="relative mt-1">
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={handleEmailChange}
            aria-required="true"
            aria-invalid={emailExists === true}
            aria-describedby={emailExists ? "email-exists-error" : email ? "email-success" : undefined}
            autoComplete="email"
            className={emailExists === true ? "border-red-500 pr-10" : emailExists === false && email ? "border-green-500 pr-10" : ""}
          />
          {checkingEmail && (
            <span className="absolute right-3 top-3 text-muted-foreground">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
          )}
          {!checkingEmail && emailExists === false && email && (
            <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" aria-hidden="true" />
          )}
          {emailExists === true && (
            <X className="absolute right-3 top-3 h-4 w-4 text-red-500" aria-hidden="true" />
          )}
        </div>
        {emailExists === true && (
          <p id="email-exists-error" className="text-red-500 text-xs mt-2 flex items-center gap-1" aria-live="polite">
            <X className="h-3 w-3" /> This email is already registered. <a href="/login" className="underline font-semibold">Try logging in</a>
          </p>
        )}
        {emailExists === false && email && (
          <p id="email-success" className="text-green-600 text-xs mt-2 flex items-center gap-1" aria-live="polite">
            <Check className="h-3 w-3" /> Email available
          </p>
        )}
      </div>

      {/* Password Field with Strength Meter */}
      <div>
        <Label htmlFor="password" className="text-xs font-semibold">
          Password <span aria-hidden="true" className="text-red-500">*</span>
        </Label>
        <div className="relative mt-1">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter password"
            value={password}
            onChange={onPasswordChange}
            aria-required="true"
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? "password-error" : "password-strength"}
            autoComplete="new-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Password Strength Meter */}
        {password && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Password Strength</p>
              <span className={`text-xs font-semibold ${
                passwordStrength.color === 'bg-red-500' ? 'text-red-500' :
                passwordStrength.color === 'bg-orange-500' ? 'text-orange-500' :
                passwordStrength.color === 'bg-yellow-500' ? 'text-yellow-500' :
                'text-green-500'
              }`}>
                {passwordStrength.label}
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                style={{ width: `${passwordStrength.score}%` }}
                role="progressbar"
                aria-valuenow={passwordStrength.score}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label={`Password strength: ${passwordStrength.label}`}
              />
            </div>
          </div>
        )}

        {/* Password Requirements Checklist */}
        {password && (
          <ul className="mt-3 space-y-1.5 text-xs">
            <li className="flex items-center gap-2">
              {passwordStrength.hasLength ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={passwordStrength.hasLength ? "text-green-600 font-medium" : "text-muted-foreground"}>
                At least 8 characters
              </span>
            </li>
            <li className="flex items-center gap-2">
              {passwordStrength.hasUppercase ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={passwordStrength.hasUppercase ? "text-green-600 font-medium" : "text-muted-foreground"}>
                At least one uppercase letter
              </span>
            </li>
            <li className="flex items-center gap-2">
              {passwordStrength.hasNumber ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={passwordStrength.hasNumber ? "text-green-600 font-medium" : "text-muted-foreground"}>
                At least one number
              </span>
            </li>
            <li className="flex items-center gap-2">
              {passwordStrength.hasSpecial ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={passwordStrength.hasSpecial ? "text-green-600 font-medium" : "text-muted-foreground"}>
                At least one special character
              </span>
            </li>
          </ul>
        )}

        {passwordError && (
          <p
            id="password-error"
            className="text-red-500 text-xs mt-2 flex items-center gap-1"
            aria-live="polite"
          >
            <X className="h-3 w-3" /> {passwordError}
          </p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div>
        <Label htmlFor="confirm-password" className="text-xs font-semibold">
          Confirm Password <span aria-hidden="true" className="text-red-500">*</span>
        </Label>
        <div className="relative mt-1">
          <Input
            id="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={onConfirmPasswordChange}
            aria-required="true"
            aria-invalid={!!confirmPasswordError}
            aria-describedby={confirmPasswordError ? "confirm-password-error" : confirmPassword && !confirmPasswordError ? "confirm-password-success" : undefined}
            autoComplete="new-password"
            className={confirmPassword && !confirmPasswordError && password === confirmPassword ? "border-green-500 pr-10" : "pr-10"}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {confirmPassword && !confirmPasswordError && password === confirmPassword && (
          <p id="confirm-password-success" className="text-green-600 text-xs mt-2 flex items-center gap-1" aria-live="polite">
            <Check className="h-3 w-3" /> Passwords match
          </p>
        )}
        {confirmPasswordError && (
          <p
            id="confirm-password-error"
            className="text-red-500 text-xs mt-2 flex items-center gap-1"
            aria-live="polite"
          >
            <X className="h-3 w-3" /> {confirmPasswordError}
          </p>
        )}
      </div>
    </div>
  );
}