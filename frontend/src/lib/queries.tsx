import { useQuery } from "@tanstack/react-query";
import {
  getChatsQueryFn,
  getMessagesQueryFn,
  getProfileQueryFn,
  getUsersQueryFn,
} from "./api-functions";

export const useProfileQuery = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: getProfileQueryFn,
    staleTime: 500,
  });
};

export const useUsersQuery = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: getUsersQueryFn,
    staleTime: 200,
  });
};

export const useChatsQuery = () => {
  return useQuery({
    queryKey: ["chats"],
    queryFn: getChatsQueryFn,
  });
};

export const useMessagesQuery = (id: string) => {
  return useQuery({
    queryKey: ["messages", id],
    queryFn: () => getMessagesQueryFn(id),
    enabled: !!id,
  });
};
