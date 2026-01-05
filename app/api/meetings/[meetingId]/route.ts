import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

import { z } from "zod";

import { getResponseSchema } from "./InOutSchema";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> },
): Promise<NextResponse> {
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

    const meetingId = (await params).meetingId;

    const meeting = await prisma.meeting.findUnique({
      where: {
        id: meetingId,
      },
      select: {
        id: true,
        title: true,
        scheduledAt: true,
        inviteCode: true,
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        status: true,
        updatedAt: true,
        createdAt: true,
        participants: {
          include: {
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

    const response = {
      success: true,
      message: "Meeting fetched successfully",
      data: meeting,
    };

    const validated = getResponseSchema.parse(response);

    return NextResponse.json(validated, { status: 200 });
  } catch (error) {
    console.error("Error fetching meeting details: ", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server Error while fetching meeting details",
      },
      {
        status: 400,
      },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> },
) {
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

    const meetingId = (await params).meetingId;
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

    await prisma.meeting.delete({
      where: {
        id: meetingId,
      },
      include: {
        participants: true,
        chatMessages: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Meeting deleted successfully",
      },
      {
        status: 200,
      },
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

const MeetingPatchRequest = z.object({
  title: z.string().optional(),
  scheduledAt: z.coerce.date().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> },
): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const meetingId = (await params).meetingId;
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
          message: "Unauthorized to update this meeting",
        },
        {
          status: 401,
        },
      );
    }

    const body: z.infer<typeof MeetingPatchRequest> = MeetingPatchRequest.parse(
      await req.json(),
    );

    const updatedData: z.infer<typeof MeetingPatchRequest> = {};

    if (body.scheduledAt) {
      updatedData.scheduledAt = body.scheduledAt;
    }

    if (body.title) {
      updatedData.title = body.title;
    }

    const updatedMeeting = await prisma.meeting.update({
      where: {
        id: meetingId,
      },
      data: updatedData,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Meeting details updated successfully",
        data: updatedMeeting,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error updating meeting:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
