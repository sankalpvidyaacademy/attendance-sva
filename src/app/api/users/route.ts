import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { generateUserId, generatePassword } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const className = searchParams.get("class");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (role) {
      where.role = role;
    }

    if (className) {
      where.class = className;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { userId: { contains: search } },
      ];
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        userId: true,
        name: true,
        role: true,
        class: true,
        subjects: true,
        chatId: true,
        phone: true,
        plainPassword: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Parse subjects JSON for each user
    const parsedUsers = users.map((user) => ({
      ...user,
      subjects: user.subjects ? JSON.parse(user.subjects) : null,
    }));

    return NextResponse.json(parsedUsers);
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, role, class: className, subjects, phone } = body;

    if (!name || !role) {
      return NextResponse.json(
        { error: "name and role are required" },
        { status: 400 }
      );
    }

    const userId = generateUserId(name);
    const plainPassword = generatePassword();
    const hashedPassword = await hashPassword(plainPassword);

    const user = await db.user.create({
      data: {
        userId,
        name,
        role,
        password: hashedPassword,
        plainPassword,
        class: className || null,
        subjects: subjects ? JSON.stringify(subjects) : null,
        phone: phone || null,
      },
    });

    // Return user without password hash, but include plain text password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        ...userWithoutPassword,
        subjects: user.subjects ? JSON.parse(user.subjects) : null,
        plainPassword, // So admin can give it to the user
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
