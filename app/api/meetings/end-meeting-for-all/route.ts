import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

    const meeting = await prisma.meeting.findFirst({
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

    if (meeting.hostId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not the host of this meeting",
        },
        {
          status: 403,
        },
      );
    }

    await prisma.meeting.update({
      where: {
        id: meetingId,
      },
      data: {
        status: "ENDED",
        endedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Meeting ended successfully!!",
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error ending meeting: ", error);
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
