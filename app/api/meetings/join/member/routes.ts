import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateLiveKitToken } from "@/lib/livekit";

export async function POST(req: NextRequest) {
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

    const { inviteCode } = (await req.json()) as { inviteCode: string };

    if (!inviteCode || inviteCode.length !== 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Invite code is required",
        },
        {
          status: 400,
        },
      );
    }

    const meeting = await prisma.meeting.findUnique({
      where: {
        inviteCode: inviteCode,
      },
      select: {
        id: true,
        status: true,
        livekitRoomName: true,
        hostId: true,
        inviteCode: true,
      },
    });

    if (!meeting) {
      return NextResponse.json(
        {
          success: false,
          message: "Meeting not found",
        },
        {
          status: 404,
        },
      );
    }

    if (meeting.inviteCode !== inviteCode) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid invite code",
        },
        {
          status: 403,
        },
      );
    }

    if (meeting.status === "ENDED") {
      return NextResponse.json(
        {
          success: false,
          message: "Meeting has ended",
        },
        {
          status: 400,
        },
      );
    }

    const participantCount = await prisma.participant.count({
      where: {
        meetingId: meeting.id,
        leftAt: null,
      },
    });

    if (participantCount >= 4 && meeting.hostId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Meeting capacity is fulled!!",
        },
        {
          status: 403,
        },
      );
    }

    const token = await generateLiveKitToken(
      meeting.livekitRoomName,
      session.user.id,
      session.user.name || session.user.email || "Guest",
    );

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
      update: {
        leftAt: null,
      },
    });

    if (meeting.status === "SCHEDULED") {
      await prisma.meeting.update({
        where: {
          id: meeting.id,
        },
        data: {
          status: "LIVE",
          startedAt: new Date(),
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: `${session.user.name} joined the meeting successfully`,
        data: {
          token,
          serverUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL,
          meeting: {
            id: meeting.id,
            livekitRoomName: meeting.livekitRoomName,
          },
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error joining meeting as member: ", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      {
        status: 500,
      },
    );
  }
}
