import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthLayout from "./pages/auth/layout";
import SigninPage from "./pages/auth/signin";
import AppLayout from "./pages/layout";
import HomePage from "./pages/home";
import SignupPage from "./pages/auth/signup";
import VerifyOTPPage from "./pages/auth/verify-otp";
import ForgotPasswordPage from "./pages/auth/forgot-password";
import ResetPasswordPage from "./pages/auth/reset-password";

export default function App() {
  const authRoutes = [
    {
      element: <SigninPage />,
      path: "/auth/signin",
    },
    {
      element: <SignupPage />,
      path: "/auth/signup",
    },
    {
      element: <VerifyOTPPage />,
      path: "/auth/verify-otp",
    },
    {
      element: <ForgotPasswordPage />,
      path: "/auth/forgot-password",
    },
    {
      element: <ResetPasswordPage />,
      path: "/auth/reset-password",
    },
  ];

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          {authRoutes.map((route) => (
            <Route path={route.path} element={route.element} />
          ))}
        </Route>

        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
