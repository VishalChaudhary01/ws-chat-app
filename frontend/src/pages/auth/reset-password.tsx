import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  resetPasswordSchema,
  type ResetPasswordDTO,
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
import { resetPasswordMutationFn } from "../../lib/api-functions";
import { useEffect } from "react";

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordDTO>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: resetPasswordMutationFn,
  });

  const onSubmit = (inputs: ResetPasswordDTO) => {
    mutate(inputs, {
      onSuccess: (res) => {
        toast.success(res.message);
        navigate("/");
      },
      onError: (error: any) => {
        toast.error(error.response.data.message || "Failed to signin");
      },
    });
  };

  useEffect(() => {
    const stage = localStorage.getItem("stage");
    if (stage !== "password_reset") {
      navigate("/signin");
    }
  }, [navigate]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="shadow-base flex h-full w-full max-w-lg flex-col items-center rounded-md bg-neutral-100 px-6 py-14 dark:bg-neutral-700"
    >
      <FormHeading>
        Reset <ColoredHeading>Password</ColoredHeading>
      </FormHeading>

      <FormContent error={errors.password?.message}>
        <Label>New Password</Label>
        <Input {...register("password")} />
      </FormContent>

      <FormContent error={errors.confirmPassword?.message}>
        <Label>Confirm Password</Label>
        <Input type="confirmPassword" {...register("confirmPassword")} />
      </FormContent>

      <Button type="submit" disabled={isPending}>
        Submit
      </Button>
      <p className="mt-2 text-sm text-neutral-800 dark:text-neutral-400">
        Don't want to reset password?{" "}
        <Link to="/signin" className="font-medium underline underline-offset-1">
          Sign In
        </Link>
      </p>
    </form>
  );
}
