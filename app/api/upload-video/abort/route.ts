import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { abortUpload } from "@/lib/aws";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { uploadId, key, meetingId } = await req.json();

    if (!uploadId || !key) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Abort the multipart upload on S3
    await abortUpload(uploadId, key);

    // Update recording status to FAILED if meetingId provided
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error aborting upload:", error);
    return NextResponse.json(
      { error: "Failed to abort upload" },
      { status: 500 },
    );
  }
}
