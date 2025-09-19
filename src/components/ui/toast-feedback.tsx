import { toast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, XCircle, Info } from "lucide-react";

export const showSuccessToast = (message: string) => {
  toast({
    title: "Success",
    description: message,
    className: "bg-success/10 border-success/20 text-success",
    action: <CheckCircle className="w-5 h-5 text-success" />,
  });
};

export const showErrorToast = (message: string) => {
  toast({
    title: "Error", 
    description: message,
    className: "bg-error/10 border-error/20 text-error",
    action: <XCircle className="w-5 h-5 text-error" />,
  });
};

export const showWarningToast = (message: string) => {
  toast({
    title: "Warning",
    description: message,
    className: "bg-warning/10 border-warning/20 text-yellow-600",
    action: <AlertCircle className="w-5 h-5 text-yellow-600" />,
  });
};

export const showInfoToast = (message: string) => {
  toast({
    title: "Info",
    description: message,
    className: "bg-info/10 border-info/20 text-info",
    action: <Info className="w-5 h-5 text-info" />,
  });
};