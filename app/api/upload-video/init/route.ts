import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { initializeUpload } from "@/lib/aws";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { meetingId } = await req.json();

    if (!meetingId) {
      return NextResponse.json(
        { error: "Meeting ID is required" },
        { status: 400 },
      );
    }

    // Verify the meeting exists and user has access
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        participants: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (
      meeting.participants.length === 0 &&
      meeting.hostId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "You are not a participant of this meeting" },
        { status: 403 },
      );
    }

    // Initialize multipart upload
    const { uploadId, key } = await initializeUpload(meetingId);

    // Create or update recording record
    const recording = await prisma.recording.upsert({
      where: { meetingId },
      create: {
        meetingId,
        fileUrl: key,
        status: "PROCESSING",
      },
      update: {
        fileUrl: key,
        status: "PROCESSING",
      },
    });

    return NextResponse.json({
      uploadId,
      key,
      recordingId: recording.id,
    });
  } catch (error) {
    console.error("Error initializing upload:", error);
    return NextResponse.json(
      { error: "Failed to initialize upload" },
      { status: 500 },
    );
  }
}
