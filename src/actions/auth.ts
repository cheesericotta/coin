"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";

export async function registerUser(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email and password are required" };
    }

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return { error: "User already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
        },
    });

    // Create default categories for the user
    const defaultCategories = [
        { name: "Food & Dining", icon: "utensils", color: "#ef4444" },
        { name: "Transport", icon: "car", color: "#3b82f6" },
        { name: "Entertainment", icon: "film", color: "#8b5cf6" },
        { name: "Shopping", icon: "shopping-bag", color: "#f59e0b" },
        { name: "Bills & Utilities", icon: "zap", color: "#10b981" },
        { name: "Health", icon: "heart", color: "#ec4899" },
        { name: "Groceries", icon: "shopping-cart", color: "#06b6d4" },
        { name: "Others", icon: "ellipsis", color: "#6b7280" },
    ];

    await prisma.category.createMany({
        data: defaultCategories.map((cat) => ({
            ...cat,
            userId: user.id,
            isDefault: true,
        })),
    });

    return { success: true, userId: user.id };
}

export async function loginUser(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
        await signIn("credentials", {
            email,
            password,
            redirect: false,
        });
        return { success: true };
    } catch {
        return { error: "Invalid credentials" };
    }
}
