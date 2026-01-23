import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadChunk } from "@/lib/aws";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const uploadId = formData.get("uploadId") as string;
    const key = formData.get("key") as string;
    const partNumber = parseInt(formData.get("partNumber") as string);
    const chunk = formData.get("chunk") as Blob;

    if (!uploadId || !key || !partNumber || !chunk) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const arrayBuffer = await chunk.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadChunk(uploadId, key, partNumber, buffer);

    return NextResponse.json({
      etag: result.etag,
      partNumber: result.partNumber,
    });
  } catch (error) {
    console.error("Error uploading chunk:", error);
    return NextResponse.json(
      { error: "Failed to upload chunk" },
      { status: 500 },
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; 

