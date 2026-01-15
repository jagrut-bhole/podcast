import { auth } from "@/lib/auth";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
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

    const { title, scheduledAt, participantEmails } = (await req.json()) as {
      title: string;
      scheduledAt?: string | null;
      participantEmails?: string[];
    };

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Title is required",
        },
        {
          status: 400,
        },
      );
    }

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const publicCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const livekitRoomName = `room-${session.user.id}-${Date.now()}`;

    const meeting = await prisma.meeting.create({
      data: {
        title,
        hostId: session.user.id,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        inviteCode,
        publicCode,
        status: "SCHEDULED",
        livekitRoomName,
        startedAt: null,
      },
    });

    let participants: Array<{
      id: string;
      user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
      };
    }> = [];

    if (participantEmails && participantEmails.length > 0) {
      const users = await prisma.user.findMany({
        where: {
          email: {
            in: participantEmails,
          },
        },
        select: {
          id: true,
          email: true,
        },
      });

      if (users.length > 0) {
        await prisma.participant.createMany({
          data: users.map((user) => ({
            meetingId: meeting.id,
            userId: user.id,
          })),
          skipDuplicates: true,
        });

        participants = await prisma.participant.findMany({
          where: {
            meetingId: meeting.id,
          },
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        });
      }
    }

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
      },
      update: {},
    });

    if (
      participantEmails &&
      participantEmails.length > 0 &&
      meeting.scheduledAt
    ) {
      try {
        const emailService = new EmailServices();
        const meetingLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/home`;
        const scheduledDate = new Date(meeting.scheduledAt);
        const formattedDate = scheduledDate.toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        });

        emailService.SendMeetingInvite(
          participantEmails,
          session.user.name || session.user.email || "A colleague",
          meeting.title,
          meetingLink,
          formattedDate,
          meeting.publicCode,
        );

        console.log(
          `Invitation emails sent to ${participantEmails.length} participants`,
        );
      } catch (emailError) {
        console.error("Error sending invitation emails:", emailError);
        // Don't fail the meeting creation if emails fail
      }
    }

    return NextResponse.json({
      success: true,
      message: "Meeting scheduled successfully",
      data: {
        meetingId: meeting.id,
        title: meeting.title,
        scheduledAt: meeting.scheduledAt,
        status: meeting.status,
        inviteCode: meeting.inviteCode,
        publicCode: meeting.publicCode,
        livekitRoomName: meeting.livekitRoomName,
        participants,
      },
    });
  } catch (error) {
    console.error("Error creating meeting: ", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server Error while creating meeting",
      },
      {
        status: 500,
      },
    );
  }
}
