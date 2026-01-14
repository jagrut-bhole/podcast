import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
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

    const meetings = await prisma.meeting.findMany({
      where: {
        hostId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        scheduledAt: true,
        status: true,
        inviteCode: true,
        createdAt: true,
        startedAt: true,
        endedAt: true,
        participants: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            chatMessages: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Meetings fetched successfully",
        data: meetings,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching user meetings: ", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server Error while fetching user meetings",
      },
      {
        status: 400,
      },
    );
  }
}

interface MeetingCreateRequest {
  title: string;
  scheduledAt?: string | null;
  participantEmails: string[];
}

export async function POST(req: NextResponse): Promise<NextResponse> {
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

    const data: MeetingCreateRequest = await req.json();

    const inviteCode = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();

    const publicCode = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();

    const meetingCreate = await prisma.meeting.create({
      data: {
        title: data.title,
        hostId: session.user.id,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        inviteCode: inviteCode,
        publicCode: publicCode,
        status: "SCHEDULED",
        livekitRoomName: `${session.user.email}room-${Math.random().toString(36).substring(2, 15)}`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Meeting created successfully",
        data: meetingCreate,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Error creating meeting:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
