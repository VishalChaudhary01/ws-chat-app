import { CircleUserRound, MoveLeft, Plus } from "lucide-react";
import { useProfileQuery, useUsersQuery } from "../lib/queries";
import React, { useState } from "react";
import { useChatsQuery } from "../lib/queries";
import { Button } from "./ui/form";

interface SidebarProps {
  setSelectedChat: React.Dispatch<React.SetStateAction<Chat | null>>;
  setSelectedUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const Sidebar = ({ setSelectedChat, setSelectedUser }: SidebarProps) => {
  const [showAllUser, setShowAllUsers] = useState(false);

  const { data: profileData } = useProfileQuery();

  const { data: chatData } = useChatsQuery();
  const chats = chatData?.chats;

  const { data: userData } = useUsersQuery();
  const users = userData?.users;

  const handleSelect = (chat: Chat) => {
    setSelectedChat(chat);
    setSelectedUser(null);
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSelectedChat(null);

    const existingChat = chats?.find(
      (chat) =>
        !chat.isGroup &&
        chat.participants.some((p: Participant) => p.id === user.id),
    );

    if (existingChat) {
      setSelectedChat(existingChat);
      setSelectedUser(null);
    } else {
      setSelectedUser(user);
      setSelectedChat(null);
    }
  };

  return (
    <div className="relative flex h-full w-82 flex-col overflow-y-auto border-r border-neutral-300 dark:border-neutral-700">
      {showAllUser
        ? users
            ?.filter((user) => user.id !== profileData?.user.id)
            ?.map((user) => (
              <div
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="flex cursor-pointer items-center justify-start gap-4 border-b border-neutral-300 p-4 dark:border-neutral-700"
              >
                <CircleUserRound className="size-8 text-neutral-700 dark:text-neutral-100" />

                <div className="text-base font-medium text-neutral-800 dark:text-neutral-50">
                  {user.name}
                </div>
              </div>
            ))
        : chats?.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleSelect(chat)}
              className="flex cursor-pointer items-center justify-start gap-4 border-b border-neutral-300 p-4 dark:border-neutral-700"
            >
              <CircleUserRound className="size-8 text-neutral-700 dark:text-neutral-100" />

              <div className="text-base font-medium text-neutral-800 dark:text-neutral-50">
                {chat.isGroup ? chat.groupName : chat?.participants[0]?.name}
              </div>
            </div>
          ))}

      <Button
        onClick={() => setShowAllUsers(!showAllUser)}
        className="absolute right-4 bottom-4 w-fit"
      >
        {showAllUser ? <MoveLeft /> : <Plus />}
      </Button>
    </div>
  );
};
