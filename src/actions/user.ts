"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getAuthenticatedUserId() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return session.user.id;
}

export async function getUserProfile() {
    const userId = await getAuthenticatedUserId();
    return prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
        },
    });
}

export async function updateUserProfile(formData: FormData) {
    const userId = await getAuthenticatedUserId();
    const name = formData.get("name") as string;

    if (!name) {
        return { error: "Name is required" };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { name },
        });
        revalidatePath("/profile");
        revalidatePath("/");
        return { success: true };
    } catch (e) {
        console.error("Update profile error:", e);
        return { error: "Failed to update profile" };
    }
}
