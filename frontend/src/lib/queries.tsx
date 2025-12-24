import { useQuery } from "@tanstack/react-query";
import { getProfileQueryFn, getUsersQueryFn } from "./api-functions";

export const useProfileQuery = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: getProfileQueryFn,
    staleTime: 5000,
  });
};

export const useUsersQuery = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: getUsersQueryFn,
    staleTime: 200,
  });
};
