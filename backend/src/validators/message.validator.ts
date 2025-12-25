import { z } from "zod";
import { idSchema } from ".";

export const sendMessageSchema = z.object({
  chatId: idSchema.optional(),
  participantId: idSchema.optional(),
  content: z.string("Content is required").min(1, "Content is required"),
  replyToId: idSchema.optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
