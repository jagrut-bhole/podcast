import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateLiveKitToken } from "@/lib/livekit";

export async function POST(
    req: NextRequest
): Promise<NextResponse> {
    try {

        const session = await auth();

        if (!session?.user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized"
                },
                {
                    status: 401
                }
            )
        }

        const { title, participantEmails } = (await req.json()) as {
            title: string;
            participantEmails: string[];
        }

        if (!title || !participantEmails) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Title and participant emails are required"
                },
                {
                    status: 400
                }
            )
        }

        const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
        const publicCode = Math.random().toString(36).slice(2, 8).toUpperCase();

        const meeting = await prisma.meeting.create({
            data: {
                title,
                inviteCode,
                publicCode,
                hostId: session.user.id,
                status: "LIVE",
                livekitRoomName: `room-${session.user.id}-${Date.now()}`,
                scheduledAt: new Date(),
                startedAt: new Date(),
            }
        })

        // Add participants
        if (participantEmails && participantEmails.length > 0) {
            const users = await prisma.user.findMany({
                where: { email: { in: participantEmails } },
                select: { id: true }
            });

            if (users.length > 0) {
                await prisma.participant.createMany({
                    data: users.map(u => ({
                        meetingId: meeting.id,
                        userId: u.id,
                        joinedAt: new Date()
                    })),
                    skipDuplicates: true
                });
            }
        }

        // Add host as participant
        await prisma.participant.upsert({
            where: {
                meetingId_userId: {
                    meetingId: meeting.id,
                    userId: session.user.id
                }
            },
            create: {
                meetingId: meeting.id,
                userId: session.user.id,
                joinedAt: new Date()
            },
            update: {}
        });


        const token = await generateLiveKitToken(
            `room-${session.user.id}-${Date.now()}`,
            session.user.id,
            "host"
        )
        return NextResponse.json(
            {
                success: true,
                message: "Meeting started successfully!!!",
                data: {
                    meetingId: meeting.id
                }
            },
            {
                status: 200
            }
        )
    } catch (error) {
        console.log("Error in creating the live meeting!!!");
        return NextResponse.json(
            {
                success: false,
                message: "Error in creating the live meeting!!!"
            },
            {
                status: 500
            }
        )
    }
}