import { useMemo, useRef } from "react";
import axios from "axios";
import { useAuth } from "@clerk/react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Axios instance that sends the signed-in user's Clerk session token with every request.
// The instance is stable across renders, so it's safe to use in useEffect dependencies.
export const useApi = () => {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  return useMemo(() => {
    const instance = axios.create({ baseURL: API_URL });
    instance.interceptors.request.use(async (config) => {
      const token = await getTokenRef.current();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    return instance;
  }, []);
};
