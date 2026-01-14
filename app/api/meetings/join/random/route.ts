import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
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

    const { publicCode } = (await req.json()) as { publicCode: string };

    if (!publicCode || publicCode.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Public code is required",
        },
        {
          status: 400,
        },
      );
    }

    const meeting = await prisma.meeting.findFirst({
      where: {
        publicCode: publicCode,
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

    if (meeting.status !== "LIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "Meeting is not live",
        },
        {
          status: 400,
        },
      );
    }

    const participant = await prisma.participant.upsert({
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

    const token = await generateLiveKitToken(
      meeting.livekitRoomName,
      session.user.id,
      session.user.name || session.user.email,
    );

    return NextResponse.json({
      success: true,
      message: `${session.user.name} joined the meeting successfully as a guest.`,
      data: {
        participantId: participant.id,
        token,
        serverUrl: process.env.LIVEKIT_URL,
        meeting: {
          id: meeting.id,
          title: meeting.title,
          livekitRoomName: meeting.livekitRoomName,
        },
      },
    });
  } catch (error) {
    console.error("Error joining meeting: ", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server Error while joining meeting",
      },
      {
        status: 400,
      },
    );
  }
}
