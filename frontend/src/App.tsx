import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthLayout from "./pages/auth/layout";
import SigninPage from "./pages/auth/signin";
import AppLayout from "./pages/layout";
import HomePage from "./pages/home";
import SignupPage from "./pages/auth/signup";

export default function App() {
  const authRoutes = [
    {
      element: <SigninPage />,
      path: "/signin",
    },
    {
      element: <SignupPage />,
      path: "/signup",
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
