import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  type ForgotPasswordDTO,
} from "../../validators/auth.validator";
import {
  Button,
  ColoredHeading,
  FormContent,
  FormHeading,
  Input,
  Label,
} from "../../components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { forgotPasswordMutationFn } from "../../lib/api-functions";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordDTO>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: forgotPasswordMutationFn,
  });

  const onSubmit = (input: ForgotPasswordDTO) => {
    mutate(input, {
      onSuccess: (res) => {
        localStorage.setItem("stage", res.stage);
        toast.success(res.message);
        navigate("/auth/verify-otp");
      },
      onError: (error: any) => {
        toast.error(error.response.data.message || "Failed to signin");
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="shadow-base flex h-full w-full max-w-lg flex-col items-center rounded-md bg-neutral-100 px-6 py-14 dark:bg-neutral-700"
    >
      <FormHeading>
        Forgot <ColoredHeading>Password</ColoredHeading>
      </FormHeading>

      <FormContent error={errors.email?.message}>
        <Label>Email</Label>
        <Input {...register("email")} />
      </FormContent>

      <Button type="submit" disabled={isPending}>
        Send Request
      </Button>
      <p className="mt-2 text-sm text-neutral-800 dark:text-neutral-400">
        Don't want to reset password?{" "}
        <Link
          to="/auth/signin"
          className="font-medium underline underline-offset-1"
        >
          Sign In
        </Link>
      </p>
    </form>
  );
}
