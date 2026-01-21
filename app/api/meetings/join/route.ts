import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

    const body = await req.json();
    const { meetingId, code: inviteCode } = body;

    if (!meetingId) {
      return NextResponse.json(
        {
          success: false,
          message: "Meeting ID not found",
        },
        {
          status: 400,
        },
      );
    }

    if (!inviteCode) {
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

    if (meeting.hostId === session.user.id) {
      return NextResponse.json(
        {
          success: true,
          message: "Host joined the meeting successfully",
        },
        {
          status: 200,
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
