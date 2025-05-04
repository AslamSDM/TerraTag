import React, { useEffect, useState } from "react";
import { StatusMessageProps } from "../types";

const StatusMessage: React.FC<StatusMessageProps> = ({ message }) => {
  const [visible, setVisible] = useState(false);
  const [messageType, setMessageType] = useState<
    "info" | "success" | "error" | "loading"
  >("info");

  useEffect(() => {
    // Determine the type of message
    if (!message) {
      setVisible(false);
      return;
    }

    setVisible(true);

    if (message.toLowerCase().includes("error")) {
      setMessageType("error");
    } else if (
      message.toLowerCase().includes("successful") ||
      message.toLowerCase().includes("updated") ||
      message.toLowerCase().includes("refreshed")
    ) {
      setMessageType("success");
    } else if (
      message.toLowerCase().includes("processing") ||
      message.toLowerCase().includes("waiting") ||
      message.toLowerCase().includes("fetching") ||
      message.toLowerCase().includes("getting")
    ) {
      setMessageType("loading");
    } else {
      setMessageType("info");
    }

    // Auto-hide success messages after 3 seconds
    if (messageType === "success") {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message, messageType]);

  if (!message || !visible) return null;

  // Icons for different message types
  const icons = {
    info: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-blue-400"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 16v-4"></path>
        <path d="M12 8h.01"></path>
      </svg>
    ),
    success: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-emerald-400"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    ),
    error: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-red-400"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    ),
    loading: (
      <svg
        className="animate-spin h-5 w-5 text-blue-400"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    ),
  };

  // Background and border colors for different message types
  const styles = {
    info: "bg-blue-900/80 border-blue-700",
    success: "bg-emerald-900/80 border-emerald-700",
    error: "bg-red-900/80 border-red-700",
    loading: "bg-blue-900/80 border-blue-700",
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <div
        className={`flex items-start gap-3 p-4 rounded-lg shadow-lg backdrop-blur-sm border ${styles[messageType]} max-w-md`}
      >
        <div className="flex-shrink-0 mt-0.5">{icons[messageType]}</div>
        <div className="text-sm text-white">{message}</div>
        <button
          onClick={() => setVisible(false)}
          className="ml-auto -mr-1 -mt-1 text-white/70 hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default StatusMessage;
