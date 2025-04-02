// components/SubscriptionModal.jsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import PayPalButton from "@/components/PayPalButton";

export function SubscriptionModal({ isOpen, onClose, userId, onSuccess }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subscribe Now</DialogTitle>
          <DialogDescription>
            Complete your subscription with PayPal to access all premium features.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <PayPalButton 
            userId={userId} 
            onSuccess={(data) => {
              if (onSuccess) onSuccess(data);
              onClose();
            }} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}