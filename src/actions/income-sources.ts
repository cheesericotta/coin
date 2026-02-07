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

export async function getIncomeSources() {
    const userId = await getAuthenticatedUserId();
    return prisma.incomeSource.findMany({
        where: { userId },
        orderBy: { name: "asc" },
    });
}

export async function createIncomeSource(formData: FormData) {
    const userId = await getAuthenticatedUserId();
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;

    if (!name || !type) {
        return { error: "Name and type are required" };
    }

    try {
        await prisma.incomeSource.create({
            data: { name, type, userId },
        });
        revalidatePath("/settings");
        return { success: true };
    } catch {
        return { error: "Income source already exists" };
    }
}

export async function updateIncomeSource(id: string, formData: FormData) {
    const userId = await getAuthenticatedUserId();
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;

    try {
        await prisma.incomeSource.update({
            where: { id, userId },
            data: { name, type },
        });
        revalidatePath("/settings");
        return { success: true };
    } catch {
        return { error: "Failed to update income source" };
    }
}

export async function deleteIncomeSource(id: string) {
    const userId = await getAuthenticatedUserId();

    try {
        await prisma.incomeSource.delete({
            where: { id, userId },
        });
        revalidatePath("/settings");
        return { success: true };
    } catch {
        return { error: "Failed to delete income source" };
    }
}
