"use client";

import { useProfileForm } from "../hooks/useProfileForm";
import FormProgressTracker from "./FormProgressTracker";
import StepNavigation from "./StepNavigation";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Trash2, Clock } from "lucide-react";

// Step components
import PersonalInfo from "./steps/PersonalInfo";
import AccountDetails from "./steps/AccountDetails";
import AddressInfo from "./steps/AddressInfo";
import JobPreferences from "./steps/JobPreferences";

// Step titles and time estimates
const STEPS = [
  { title: "Personal Details", time: "2 min" },
  { title: "Account Details", time: "2 min" },
  { title: "Address", time: "1 min" },
  { title: "Job Preferences", time: "2 min" }
];

// Compatibility helper to get step title
const getStepTitle = (step) => typeof step === 'string' ? step : step.title;
const getStepTime = (step) => typeof step === 'string' ? null : step.time;

export default function ProfileWizard() {
  const form = useProfileForm();
  
  // Render the current step
  const renderStep = () => {
    switch (form.currentStep) {
      case 0:
        return (
          <PersonalInfo
            firstName={form.firstName}
            lastName={form.lastName}
            firstNameError={form.firstNameError}
            lastNameError={form.lastNameError}
            dateOfBirth={form.dateOfBirth}
            dateOfBirthError={form.dateOfBirthError}
            profilePicture={form.profilePicture}
            hasUploadedPicture={form.hasUploadedPicture}
            onNameChange={(field, value) => form.handleInputChange(field)(({ target: { value } }))}
            onDateChange={form.handleDateOfBirthChange}
            onPhotoChange={form.handleProfilePictureChange}
          />
        );
      case 1:
        return (
          <AccountDetails
            email={form.email}
            password={form.password}
            confirmPassword={form.confirmPassword}
            passwordError={form.passwordError}
            confirmPasswordError={form.confirmPasswordError}
            onEmailChange={form.handleInputChange('email')}
            onPasswordChange={form.handlePasswordChange}
            onConfirmPasswordChange={form.handleConfirmPasswordChange}
          />
        );
      case 2:
        return (
          <AddressInfo
            address={form.address}
            onAddressChange={form.handleAddressChange}
          />
        );
      case 3:
        return (
          <JobPreferences
            jobTitles={form.jobTitles}
            jobLocations={form.jobLocations}
            jobSearch={form.jobSearch}
            locationInput={form.locationInput}
            onJobSearchChange={form.handleJobSearchChange}
            onLocationInputChange={form.handleLocationInputChange}
            onAddJobTitle={form.addJobTitle}
            onRemoveJobTitle={form.removeJobTitle}
            onAddJobLocation={form.addJobLocation}
            onRemoveJobLocation={form.removeJobLocation}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-4 sm:p-6">
      <Card className="w-full max-w-lg shadow-lg border border-border">
        <CardHeader className="pb-2">
          {/* Saved Form Alert */}
          {form.isHydrated && form.hasSavedForm() && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="flex items-center justify-between">
                  <span>We found your previous progress.</span>
                  <button
                    type="button"
                    onClick={form.clearSavedForm}
                    className="ml-2 inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-100 transition-colors"
                    aria-label="Clear saved form and start over"
                  >
                    <Trash2 className="h-3 w-3" />
                    Start Over
                  </button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="mb-1 text-lg sm:text-xl">{getStepTitle(STEPS[form.currentStep])}</CardTitle>
              {getStepTime(STEPS[form.currentStep]) && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Takes ~{getStepTime(STEPS[form.currentStep])}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2 self-start sm:self-auto">
              {STEPS.map((step, index) => (
                <button
                  key={getStepTitle(step)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    index === form.currentStep
                      ? "bg-primary"
                      : index < form.currentStep
                      ? "bg-muted-foreground"
                      : "bg-muted"
                  }`}
                  onClick={() => form.goToStep(index)}
                  aria-label={`Go to step ${index + 1}: ${getStepTitle(step)} (${getStepTime(step) || 'no time estimate'})`}
                  aria-current={index === form.currentStep ? "step" : undefined}
                  title={`${getStepTitle(step)} - ${getStepTime(step) || 'calculating'}`}
                />
              ))}
            </div>
          </div>

          <FormProgressTracker
            completion={form.formCompletion}
            incompleteFields={form.incompleteFields}
          />
        </CardHeader>
        
        <CardContent className="pt-4">
          <form onSubmit={(e) => {
            e.preventDefault();
            if (form.currentStep === STEPS.length - 1) {
              form.handleSignUp();
            } else {
              form.nextStep();
            }
          }}>
            {/* Current step content */}
            {renderStep()}
            
            <Separator className="my-4" />
            
            {/* Navigation buttons */}
            <StepNavigation
              currentStep={form.currentStep}
              totalSteps={STEPS.length}
              onPrevious={form.prevStep}
              onNext={form.nextStep}
              onSubmit={form.handleSignUp}
              isLastStep={form.currentStep === STEPS.length - 1}
              isFormValid={form.isFormValid()}
              loading={form.loading}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}