import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupDTO } from "../../validators/auth.validator";
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
import { signupMutationFn } from "../../lib/api-functions";

export default function SignupPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupDTO>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: signupMutationFn,
  });

  const onSubmit = (inputs: SignupDTO) => {
    mutate(inputs, {
      onSuccess: (res) => {
        toast.success(res.message);
        localStorage.setItem("stage", res.stage);
        navigate("/auth/verify-otp");
      },
      onError: (error: any) => {
        toast.error(error.response.data.message || "Failed to signup");
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="shadow-base flex h-full w-full max-w-lg flex-col items-center rounded-md bg-neutral-100 px-6 py-14 dark:bg-neutral-700"
    >
      <FormHeading>
        Welcome! <ColoredHeading>Signup</ColoredHeading>
      </FormHeading>

      <FormContent error={errors.name?.message}>
        <Label>Name</Label>
        <Input {...register("name")} />
      </FormContent>
      <FormContent error={errors.email?.message}>
        <Label>Email</Label>
        <Input {...register("email")} />
      </FormContent>

      <FormContent error={errors.password?.message}>
        <Label>Password</Label>
        <Input type="password" {...register("password")} />
      </FormContent>

      <Button type="submit" disabled={isPending}>
        Sign Up
      </Button>
      <p className="mt-2 text-sm text-neutral-800 dark:text-neutral-400">
        Already have an account?{" "}
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
