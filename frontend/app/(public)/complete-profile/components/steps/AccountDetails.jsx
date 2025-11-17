"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
  return (
    <div className="space-y-4" aria-labelledby="account-details-heading">
      <h2 id="account-details-heading" className="sr-only">Account Details</h2>
      
      {/* Email Field */}
      <div>
        <Label htmlFor="email" className="text-xs">
          Email Address <span aria-hidden="true">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={onEmailChange}
          aria-required="true"
          aria-invalid={email === ""}
          autoComplete="email"
        />
      </div>

      {/* Password Fields in a Row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="password" className="text-xs">
            Password <span aria-hidden="true">*</span>
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={onPasswordChange}
            aria-required="true"
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? "password-error" : undefined}
            autoComplete="new-password"
          />
          {passwordError && (
            <p 
              id="password-error" 
              className="text-red-500 text-xs mt-1"
              aria-live="polite"
            >
              {passwordError}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="confirm-password" className="text-xs">
            Confirm Password <span aria-hidden="true">*</span>
          </Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={onConfirmPasswordChange}
            aria-required="true"
            aria-invalid={!!confirmPasswordError}
            aria-describedby={confirmPasswordError ? "confirm-password-error" : undefined}
            autoComplete="new-password"
          />
          {confirmPasswordError && (
            <p 
              id="confirm-password-error" 
              className="text-red-500 text-xs mt-1"
              aria-live="polite"
            >
              {confirmPasswordError}
            </p>
          )}
        </div>
      </div>
      
      {/* Password help text */}
      <div className="text-xs text-muted-foreground">
        <p>Password must contain:</p>
        <ul className="list-disc pl-5 mt-1 space-y-0.5">
          <li>At least 8 characters</li>
          <li>At least one uppercase letter</li>
          <li>At least one number</li>
          <li>At least one special character</li>
        </ul>
      </div>
    </div>
  );
}