import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateLiveKitToken } from "@/lib/livekit";

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

    const { meetingId } = (await req.json()) as { meetingId: string };

    const meeting = await prisma.meeting.findUnique({
      where: {
        id: meetingId,
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

    const existingParticipant = await prisma.participant.findUnique({
      where: {
        meetingId_userId: {
          meetingId: meeting.id,
          userId: session.user.id,
        },
      },
    });

    if (!existingParticipant) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not a participant in this meeting",
        },
        {
          status: 403,
        },
      );
    }

    const token = generateLiveKitToken(
      meeting.livekitRoomName,
      session.user.id,
      session.user.name || session.user.email,
    );

    return NextResponse.json({
      success: true,
      message: "LiveKit token generated successfully",
      data: {
        token,
        serveUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL,
      },
    });
  } catch (error) {
    console.error("Error generating LiveKit token: ", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
      },
      { status: 500 },
    );
  }
}
