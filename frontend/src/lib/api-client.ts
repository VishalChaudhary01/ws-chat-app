import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: `${baseURL}/api/v1`,
  withCredentials: true,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401) {
      try {
        const { data } = await axios.post(
          `${baseURL}/api/v1/auth/rotate-token`,
          {},
          { withCredentials: true },
        );

        localStorage.setItem("accessToken", data.accessToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        if (!window.location.pathname.includes("/auth")) {
          window.location.href = "/auth/signin";
        }
        return Promise.reject(refreshError);
      }
    } else if (error.response?.status === 403) {
      // Don't attempt rotation, just clear and redirect
      localStorage.removeItem("accessToken");
      if (!window.location.pathname.includes("/signin")) {
        window.location.href = "/signin";
      }
      return Promise.reject(error);
    }
    return Promise.reject(error);
  },
);

export default api;
