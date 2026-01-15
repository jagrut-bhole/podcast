import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
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

    const { meetingId } = await req.json();

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

    if (meeting.hostId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized to delete this meeting",
        },
        {
          status: 401,
        },
      );
    }

    await prisma.meeting.delete({
      where: {
        id: meetingId,
      },
      include: {
        participants: true,
        chatMessages: true,
        recordings: true,
      },
    });
    return NextResponse.json(
      {
        success: true,
        message: "Meeting deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting meeting:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
