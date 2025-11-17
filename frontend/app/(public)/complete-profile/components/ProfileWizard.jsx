"use client";

import { useProfileForm } from "../hooks/useProfileForm";
import FormProgressTracker from "./FormProgressTracker";
import StepNavigation from "./StepNavigation";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Step components
import PersonalInfo from "./steps/PersonalInfo";
import AccountDetails from "./steps/AccountDetails";
import AddressInfo from "./steps/AddressInfo";
import JobPreferences from "./steps/JobPreferences";

// Step titles for the stepper
const STEPS = [
  "Personal Details",
  "Account Details",
  "Address",
  "Job Preferences"
];

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
            dateOfBirth={form.dateOfBirth}
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
    <div className="flex min-h-screen items-center justify-center bg-transparent p-6">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>{STEPS[form.currentStep]}</CardTitle>
            <div className="flex items-center space-x-2">
              {STEPS.map((step, index) => (
                <button
                  key={step}
                  className={`w-2.5 h-2.5 rounded-full ${
                    index === form.currentStep
                      ? "bg-primary"
                      : index < form.currentStep
                      ? "bg-muted-foreground"
                      : "bg-muted"
                  }`}
                  onClick={() => form.goToStep(index)}
                  aria-label={`Go to step ${index + 1}: ${step}`}
                  aria-current={index === form.currentStep ? "step" : undefined}
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