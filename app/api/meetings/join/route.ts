import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> },
) {
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

    const meetingId = (await params).meetingId;
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

    const inviteCode = await req.json();
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
