import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cache, cacheKeys } from "@/lib/redis";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
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
    const userId = (await params).userId;

    const user = await cache.getOrSet(
      cacheKeys.user(userId),
      async () => {
        return await prisma.user.findUnique({
          where: {
            id: userId,
          },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
            hostedMeetings: {
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
              },
            },
          },
        });
      },
      600,
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "User fetched successfully",
        data: user,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server Error while fetching user",
      },
      {
        status: 400,
      },
    );
  }
}
