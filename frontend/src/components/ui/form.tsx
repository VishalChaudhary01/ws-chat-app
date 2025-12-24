import { useState } from "react";
import { cn } from "../../lib/utils";
import { Eye, EyeOff } from "lucide-react";

interface FormContentProps {
  className?: string;
  error?: string;
  children: React.ReactNode;
}
export const FormContent = ({
  className,
  error,
  children,
}: FormContentProps) => {
  return (
    <div className={cn("flex w-full flex-col items-start gap-1", className)}>
      {children}
      <p className="min-h-[1.25rem] text-sm text-orange-500">{error}</p>
    </div>
  );
};

interface HeadingProps {
  className?: string;
  children: React.ReactNode;
}

export const FormHeading = ({ className, children }: HeadingProps) => {
  return (
    <h1
      className={cn(
        "mb-8 bg-linear-to-b from-neutral-800 to-neutral-600 bg-clip-text text-center text-4xl font-bold tracking-tight text-transparent dark:from-neutral-50 dark:to-neutral-200",
        className,
      )}
    >
      {children}
    </h1>
  );
};

export const ColoredHeading = ({ className, children }: HeadingProps) => {
  return (
    <span
      className={cn(
        "relative z-10 inline-block text-white",
        "p-1 after:absolute after:inset-0 after:-z-10 after:h-full after:w-full after:-skew-x-10 after:bg-orange-600 after:content-['']",
        className,
      )}
    >
      {children}
    </span>
  );
};

export const Label = ({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => {
  return (
    <label
      {...props}
      className={cn(
        "text-lg font-medium text-neutral-700 dark:text-neutral-100",
        className,
      )}
    >
      {children}
    </label>
  );
};

export const Input = ({
  className,
  type = "text",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="relative w-full">
      <input
        {...props}
        type={isPassword && show ? "text" : type}
        className={cn(
          "shadow-base w-full rounded-md border border-transparent bg-white px-4 py-2 transition-all duration-200 placeholder:text-neutral-400 focus:border-gray-300 focus:bg-gray-50 focus:outline-none",
          "focus:border-orange-500 dark:bg-neutral-800 dark:focus:bg-neutral-800",
          className,
        )}
      />

      {isPassword && (
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="absolute inset-y-0 right-4 text-gray-500"
        >
          {show ? <Eye /> : <EyeOff />}
        </button>
      )}
    </div>
  );
};

export const Button = ({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      {...props}
      className={cn(
        "mt-4 w-full cursor-pointer rounded-md bg-neutral-900 px-4 py-2 text-base font-medium text-white/90 transition-all duration-150 hover:bg-neutral-800 active:scale-95",
        "hover:-translate-y-0.5",
        className,
      )}
    >
      {children}
    </button>
  );
};
