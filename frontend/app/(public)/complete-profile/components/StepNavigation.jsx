import { Button } from "@/components/ui/button";

export default function StepNavigation({ 
  currentStep, 
  totalSteps, 
  onPrevious, 
  onNext, 
  onSubmit,
  isLastStep,
  isFormValid,
  loading
}) {
  return (
    <div className="flex justify-between mt-6 pt-2">
      {currentStep > 0 ? (
        <Button 
          type="button" 
          variant="outline" 
          onClick={onPrevious}
          disabled={loading}
        >
          Previous
        </Button>
      ) : (
        <div></div> // Empty div for spacing
      )}
      
      {isLastStep ? (
        <Button
          onClick={onSubmit}
          disabled={!isFormValid || loading}
          className="ml-auto"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onNext}
          disabled={loading}
        >
          Next
        </Button>
      )}
    </div>
  );
}