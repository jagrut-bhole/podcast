import { z } from "zod";

const hostSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  image: z.string().url().nullable(),
});

const meetingSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100),
  scheduledAt: z.coerce.date().nullable(),
  inviteCode: z.string().min(6).max(10),
  host: hostSchema,
  status: z.enum(["SCHEDULED", "LIVE", "ENDED"]),
  updatedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  participants: z.array(
    z.object({
      id: z.string(),
      user: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        image: z.string().url().nullable(),
      }),
    }),
  ),
});

export const getResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: meetingSchema,
});

export type GetMeetingResponse = z.infer<typeof getResponseSchema>;
