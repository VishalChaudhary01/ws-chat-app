import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "./ui/form";
import { sendMessageMutationFn } from "../lib/api-functions";
import { toast } from "sonner";
import { useState } from "react";

interface ChatFormProps {
  chatId?: string;
  userId?: string;
  onMessageSent?: (chatId?: string) => void;
}

export const ChatForm = ({ chatId, userId, onMessageSent }: ChatFormProps) => {
  const [content, setContent] = useState("");

  const client = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: sendMessageMutationFn,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!content.trim()) return;

    if (!chatId && !userId) {
      toast.error("Please select a chat or user");
      return;
    }

    mutate(
      {
        content: content.trim(),
        chatId: chatId || undefined,
        participantId: chatId ? undefined : userId,
      },
      {
        onSuccess: (res) => {
          setContent("");
          client.invalidateQueries({ queryKey: ["messages", res.chatId] });

          if (userId) {
            client.invalidateQueries({ queryKey: ["chats"] });
          }

          onMessageSent?.(chatId);
        },

        onError: (error: any) => {
          toast.error(error?.response?.data?.message || "Failed to signup");
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="group relative m-4">
      <Input
        name="content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full rounded-full border-orange-500 pr-20"
      />
      <button
        type="submit"
        disabled={isPending}
        className="absolute inset-y-0 right-0 cursor-pointer rounded-r-full bg-orange-500 px-4 text-base font-medium text-white hover:bg-orange-600"
      >
        Send
      </button>
    </form>
  );
};
