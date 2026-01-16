import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
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

    const { meetingId, message } = await req.json();

    if (!meetingId || !message) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        {
          status: 400,
        },
      );
    }

    await prisma.chatMessage.create({
      data: {
        meetingId,
        message,
        userId: session.user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Chat saved successfully",
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in saving the chat", error);
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
