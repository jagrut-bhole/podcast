import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateLiveKitToken } from "@/lib/livekit";
import { EmailServices } from "@/services/emails";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const { title, participantEmails } = (await req.json()) as {
      title: string;
      participantEmails: string[];
    };

    if (!title || !participantEmails) {
      return NextResponse.json(
        {
          success: false,
          message: "Title and participant emails are required",
        },
        {
          status: 400,
        },
      );
    }

    const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    const publicCode = Math.random().toString(36).slice(2, 8).toUpperCase();

    const meeting = await prisma.meeting.create({
      data: {
        title,
        inviteCode,
        publicCode,
        hostId: session.user.id,
        status: "LIVE",
        livekitRoomName: `room-${session.user.id}-${Date.now()}`,
        scheduledAt: new Date(),
        startedAt: new Date(),
      },
      select: {
        inviteCode: true,
        publicCode: true,
        id: true,
        title: true,
      }
    });

    // Adding participants
    if (participantEmails && participantEmails.length > 0) {
      const users = await prisma.user.findMany({
        where: { email: { in: participantEmails } },
        select: { id: true },
      });

      if (users.length > 0) {
        await prisma.participant.createMany({
          data: users.map((u) => ({
            meetingId: meeting.id,
            userId: u.id,
            joinedAt: new Date(),
          })),
          skipDuplicates: true,
        });
      }
    }

    // Adding host as participant
    await prisma.participant.upsert({
      where: {
        meetingId_userId: {
          meetingId: meeting.id,
          userId: session.user.id,
        },
      },
      create: {
        meetingId: meeting.id,
        userId: session.user.id,
        joinedAt: new Date(),
      },
      update: {},
    });

    if (participantEmails && participantEmails.length > 0) {
      try {
        const emailService = new EmailServices();
        const meetingLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/home`;
        const currentTime = new Date().toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        });

        await emailService.SendMeetingInvite(
          participantEmails,
          session.user.name || session.user.email || "A colleague",
          meeting.title,
          meetingLink,
          `Now (started at ${currentTime})`,
          meeting.publicCode,
        );

        console.log(
          `Live meeting invitations sent to ${participantEmails.length} participants`,
        );
      } catch (emailError) {
        console.error("Error sending live meeting invitations:", emailError);
      }
    }

    const token = await generateLiveKitToken(
      `room-${session.user.id}-${Date.now()}`,
      session.user.id,
      "host",
    );
    return NextResponse.json(
      {
        success: true,
        message: "Meeting started successfully!!!",
        meetingId: meeting.id,
        publicCode: meeting.publicCode,
        inviteCode: meeting.inviteCode,
        id: meeting.id,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in creating the live meeting:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Error in creating the live meeting!!!",
        error: error instanceof Error ? error.stack : String(error),
      },
      {
        status: 500,
      },
    );
  }
}
