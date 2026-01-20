import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse, NextRequest } from "next/server";
import { generatePresignedUrl } from "@/lib/aws";

export async function GET(req: NextRequest): Promise<NextResponse> {
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

    const { searchParams } = new URL(req.url);
    const meetingId = searchParams.get("meetingId");

    if (!meetingId) {
      return NextResponse.json(
        {
          success: false,
          message: "Meeting ID not found in request",
        },
        {
          status: 400,
        },
      );
    }

    const recording = await prisma.recording.findUnique({
      where: {
        meetingId: meetingId,
      },
      select: {
        fileUrl: true,
        status: true,
      },
    });

    if (!recording) {
      return NextResponse.json(
        {
          success: false,
          message: "Recording not found for this meeting",
        },
        {
          status: 404,
        },
      );
    }

    if (recording.status !== "READY") {
      return NextResponse.json(
        {
          success: false,
          message: `Recording is ${recording.status.toLowerCase()}. Please wait until it's ready.`,
        },
        {
          status: 400,
        },
      );
    }

    if (!recording.fileUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Download URL not available for this meeting",
        },
        {
          status: 400,
        },
      );
    }

    const downloadUrl = await generatePresignedUrl(recording.fileUrl, 3600);

    return NextResponse.json(
      {
        success: true,
        message: "Meeting Download Link Generated",
        data: {
          downloadUrl,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error downloading meeting:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server Error while downloading meeting",
      },
      {
        status: 400,
      },
    );
  }
}
