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
      select: {
        id: true,
        title: true,
        status: true,
        livekitRoomName: true,
        hostId: true,
        viewerCapacity: true,
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

    const token = await generateLiveKitToken(
      meeting.livekitRoomName,
      session.user.id,
      session.user.name || session.user.email || "Guest",
      true,
    );

    return NextResponse.json({
      success: true,
      message: `${session.user.name || "Guest"} joined the meeting successfully as a viewer.`,
      data: {
        token,
        serverUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL,
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
