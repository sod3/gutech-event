"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordInput({
  id,
  disabled,
  ...props
}: ComponentProps<"input"> & { id: string }) {
  const [visible, setVisible] = useState(false);
  const label = visible ? "Hide password" : "Show password";

  return (
    <div className="password-input">
      <input
        {...props}
        id={id}
        type={visible ? "text" : "password"}
        disabled={disabled}
      />
      <button
        type="button"
        className="password-toggle"
        aria-label={label}
        aria-controls={id}
        title={label}
        disabled={disabled}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? (
          <EyeOff size={18} aria-hidden="true" />
        ) : (
          <Eye size={18} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
