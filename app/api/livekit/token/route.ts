import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateLiveKitToken } from "@/lib/livekit";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    console.log("[Token] Session user ID:", session?.user?.id);

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
    console.log("[Token] Meeting ID:", meetingId);

    const meeting = await prisma.meeting.findUnique({
      where: {
        id: meetingId,
      },
    });
    console.log(
      "[Token] Meeting found:",
      meeting?.id,
      "Status:",
      meeting?.status,
      "Host:",
      meeting?.hostId,
    );

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
      console.log("[Token] ERROR: Meeting has ended");
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
    console.log(
      "[Token] Existing participant:",
      existingParticipant?.id,
      "Is host:",
      meeting.hostId === session.user.id,
    );

    // If user is not a participant yet, check if they're the host and add them
    if (!existingParticipant) {
      // Check if user is the host
      const isHost = meeting.hostId === session.user.id;

      if (!isHost) {
        return NextResponse.json(
          {
            success: false,
            message: "You are not authorized to join this meeting",
          },
          {
            status: 403,
          },
        );
      }

      // Add host as participant
      await prisma.participant.create({
        data: {
          meetingId: meeting.id,
          userId: session.user.id,
          joinedAt: new Date(),
        },
      });
    }

    // If meeting is scheduled, update it to LIVE when host joins
    if (meeting.status === "SCHEDULED") {
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: {
          status: "LIVE",
          startedAt: new Date(),
        },
      });
    }

    const token = await generateLiveKitToken(
      meeting.livekitRoomName,
      session.user.id,
      session.user.name || session.user.email || "Guest",
    );

    return NextResponse.json({
      success: true,
      message: "LiveKit token generated successfully",
      data: {
        token,
        serverUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL,
      },
    });
  } catch (error) {
    console.error("[Token] ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
      },
      { status: 500 },
    );
  }
}
