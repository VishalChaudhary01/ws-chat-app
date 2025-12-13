import { z } from "zod";
import { idSchema, nameSchema } from ".";

export const createChatSchema = z
  .object({
    isGroup: z.boolean(),

    // For one-to-one chat
    participantId: idSchema.optional(),

    // For group chat
    participantIds: z.array(idSchema).optional(),
    groupName: nameSchema.optional(),
  })
  .refine(
    (data) => {
      // 1-to-1 chat validation
      if (!data.isGroup) {
        return !!data.participantId;
      }

      // Group chat validation
      return (
        data.participantIds &&
        data.participantIds.length >= 2 &&
        !!data.groupName
      );
    },
    {
      message:
        "For group chats, provide participantIds (min 2) and groupName. For 1-to-1 chats, provide participantId.",
      path: ["isGroup"],
    }
  );

export type CreateChatInput = z.infer<typeof createChatSchema>;
