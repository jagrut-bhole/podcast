import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

    const userId = session?.user?.id;

    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account deleted successfully",
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error deleting account: ", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
      },
      { status: 500 },
    );
  }
}
