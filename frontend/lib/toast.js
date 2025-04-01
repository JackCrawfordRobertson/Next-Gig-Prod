// lib/toast.js
import toast from "react-hot-toast";

export const showToast = ({ title, description, variant }) => {
  const content = (
    <div>
      <p className="font-medium">{title}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );

  if (variant === "destructive" || variant === "error") {
    return toast.error(content);
  } else if (variant === "success") {
    return toast.success(content);
  } else {
    return toast(content);
  }
};
