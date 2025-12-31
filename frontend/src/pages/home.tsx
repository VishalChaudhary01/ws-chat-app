import { useEffect, useState } from "react";
import { Sidebar } from "../components/sidebar";
import {
  useChatsQuery,
  useMessagesQuery,
  useProfileQuery,
} from "../lib/queries";
import { cn } from "../lib/utils";
import { ChatForm } from "../components/chat-form";
import { CircleUserRound, Loader2, MessageSquare } from "lucide-react";
import { getWebSocketClient } from "../lib/websocket-instance";
import { useQueryClient } from "@tanstack/react-query";

export default function HomePage() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const queryClient = useQueryClient();

  const { data: userData } = useProfileQuery();
  const userId = userData?.user.id;

  const { data: chatData } = useChatsQuery();
  const chats = chatData?.chats;

  const { data, isPending } = useMessagesQuery(selectedChat?.id ?? "");

  useEffect(() => {
    const ws = getWebSocketClient();
    if (!ws) return;
    ws.on("open", () => {
      console.log("WS connected!");
    });

    ws.on("new_message", (payload) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", payload?.message?.chatId],
      });
    });

    return () => ws.close();
  }, []);

  useEffect(() => {
    if (selectedUser && chats) {
      const existingChat = chats.find(
        (chat) =>
          !chat.isGroup &&
          chat.participants.some((p: Participant) => p.id === selectedUser.id),
      );

      if (existingChat) {
        setSelectedChat(existingChat);
        setSelectedUser(null);
      }
    }
  }, [selectedUser, chats]);

  const renderEmptyState = () => (
    <div className="flex h-full flex-col items-center justify-center text-neutral-500">
      <MessageSquare className="mb-4 size-16" />
      <p className="text-lg font-medium">Select a chat to start messaging</p>
      <p className="text-sm">Choose a conversation from the sidebar</p>
    </div>
  );

  const renderChatHeader = () => {
    if (!selectedChat && !selectedUser) return null;

    let displayName = "New Chat";

    if (selectedChat) {
      displayName = selectedChat.isGroup
        ? selectedChat.groupName || "Group Chat"
        : selectedChat.participants[0]?.name || "Unknown User";
    }

    if (!selectedChat && selectedUser) {
      displayName = selectedUser?.name || "Unknown User";
    }

    return (
      <div className="flex h-14 items-center border-b border-neutral-200 bg-white px-4 dark:border-neutral-700 dark:bg-neutral-800">
        <div className="flex items-center justify-start gap-2">
          <CircleUserRound className="size-8 text-neutral-700 dark:text-neutral-100" />

          <div className="text-base font-medium text-neutral-800 dark:text-neutral-50">
            {displayName}
          </div>
        </div>
      </div>
    );
  };

  const renderMessages = () => {
    if (!selectedChat && !selectedUser) {
      return renderEmptyState();
    }

    if (selectedUser && !selectedChat) {
      return (
        <div className="flex h-full items-center justify-center text-neutral-400">
          <p>No messages yet. Start the conversation!</p>
        </div>
      );
    }

    if (isPending && selectedChat) {
      return (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="size-8 animate-spin text-orange-500" />
        </div>
      );
    }

    if (!data?.chat?.messages.length) {
      return (
        <div className="flex h-full items-center justify-center text-neutral-400">
          <p>No messages yet. Start the conversation!</p>
        </div>
      );
    }

    return (
      <>
        {data.chat.messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.sender.id === userId ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[60%] px-4 py-2 wrap-break-word shadow-sm",
                message.sender.id === userId
                  ? "rounded-l-xl rounded-br-xl border border-orange-200 bg-orange-50 dark:border-orange-700 dark:bg-orange-900"
                  : "rounded-r-xl rounded-bl-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-500 dark:bg-neutral-700",
              )}
            >
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}
      </>
    );
  };

  const handleMessageSent = (newChatId?: string) => {
    if (selectedUser && newChatId) {
      const newChat = chats?.find((chat) => chat.id === newChatId);
      if (newChat) {
        setSelectedChat(newChat);
      }
      setSelectedUser(null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-48px)] w-full">
      <Sidebar
        setSelectedChat={setSelectedChat}
        setSelectedUser={setSelectedUser}
      />
      <div className="flex flex-1 flex-col">
        {renderChatHeader()}

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
          {renderMessages()}
        </div>
        {(selectedChat || selectedUser) && (
          <ChatForm
            chatId={selectedChat?.id}
            userId={selectedUser?.id ?? undefined}
            onMessageSent={handleMessageSent}
          />
        )}
      </div>
    </div>
  );
}
