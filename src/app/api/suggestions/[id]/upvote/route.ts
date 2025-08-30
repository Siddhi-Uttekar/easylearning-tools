import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(request: NextRequest, context: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = context.params;

  try {
    const suggestion = await prisma.featureSuggestion.findUnique({
      where: { id },
    });

    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    await prisma.featureSuggestion.update({
      where: { id },
      data: {
        upvotes: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ message: "Upvoted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Failed to upvote suggestion:", error);
    return NextResponse.json(
      { error: "Failed to upvote suggestion" },
      { status: 500 }
    );
  }
}
