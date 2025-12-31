import {
  Button,
  ColoredHeading,
  FormHeading,
  Input,
} from "../../components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  resendOTPMutationFn,
  verifyOTPMutationFn,
} from "../../lib/api-functions";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

export default function VerifyOTPPage() {
  const navigate = useNavigate();

  const [code, setCode] = useState<String[]>(Array(6).fill(""));
  const inputRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;

    // allow only digits
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRef.current[index - 1]?.focus();
    }
  };

  const { mutate, isPending } = useMutation({
    mutationFn: verifyOTPMutationFn,
  });

  const { mutate: resendMutate, isPending: resendPending } = useMutation({
    mutationFn: resendOTPMutationFn,
  });

  const verifyCode = async () => {
    const otp = code.join("");

    mutate(
      { otp },
      {
        onSuccess: (res) => {
          console.log(res);
          toast.success(res.message);
          localStorage.setItem("accessToken", res.accessToken);
          navigate("/");
        },
        onError: (error: any) => {
          toast.error(error.response.data.message || "Failed to verify otp");
          setCode(Array(6).fill(""));
          inputRef.current[0]?.focus();
        },
      },
    );
  };

  useEffect(() => {
    if (code.every(Boolean) && !isPending) {
      verifyCode();
    }
  }, [code]);

  const handleResend = async () => {
    if (resendPending) return;

    resendMutate(undefined, {
      onSuccess: (res) => {
        console.log(res);
        toast.success(res.message);
      },
      onError: (error: any) => {
        toast.error(error.response.data.message || "Failed to verify otp");
      },
    });
  };

  useEffect(() => {
    const stage = localStorage.getItem("stage");
    if (stage !== "code_verification") {
      navigate("/auth/signin");
    }
  }, [navigate]);

  return (
    <div className="shadow-base flex h-full w-full max-w-lg flex-col items-center rounded-md bg-neutral-100 px-6 py-14 dark:bg-neutral-700">
      <FormHeading>
        Verify <ColoredHeading>OTP</ColoredHeading>
      </FormHeading>

      <div className="flex gap-1">
        {code.map((digit, index) => (
          <Input
            key={index}
            // @ts-ignore
            ref={(el) => (inputRef.current[index] = el)}
            maxLength={1}
            // @ts-ignore
            value={digit}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="h-12 w-12"
          />
        ))}
      </div>

      <Button onClick={verifyCode} disabled={isPending || code.some((c) => !c)}>
        Verify
      </Button>
      <p className="mt-2 text-sm text-neutral-800 dark:text-neutral-400">
        Don't recieve OTP?{" "}
        <span
          onClick={handleResend}
          className="cursor-pointer font-medium underline underline-offset-1"
        >
          Resend
        </span>
      </p>
    </div>
  );
}
