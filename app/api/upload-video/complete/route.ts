import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { completeUpload, generatePresignedUrl } from "@/lib/aws";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { uploadId, key, parts, meetingId, fileSizeBytes, durationSeconds } =
      await req.json();

    if (!uploadId || !key || !parts || !meetingId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Complete the multipart upload
    const { location } = await completeUpload(uploadId, key, parts);

    // Generate a presigned URL for download (valid for 7 days)
    const downloadUrl = await generatePresignedUrl(key, 7 * 24 * 60 * 60);

    // Update recording and meeting with the file info
    await prisma.recording.update({
      where: { meetingId },
      data: {
        fileUrl: key,
        fileSizeBytes: fileSizeBytes ? BigInt(fileSizeBytes) : null,
        durationSeconds: durationSeconds || null,
        status: "READY",
      },
    });

    await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        downloadUrl,
      },
    });

    return NextResponse.json({
      success: true,
      location,
      downloadUrl,
    });
  } catch (error) {
    console.error("Error completing upload:", error);

    // Update recording status to FAILED
    const { meetingId } = await req.json();
    if (meetingId) {
      await prisma.recording
        .update({
          where: { meetingId },
          data: { status: "FAILED" },
        })
        .catch(() => {
          // Ignore error if recording doesn't exist
        });
    }

    return NextResponse.json(
      { error: "Failed to complete upload" },
      { status: 500 },
    );
  }
}
