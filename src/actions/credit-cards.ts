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

export async function getCreditCards() {
    const userId = await getAuthenticatedUserId();
    return prisma.creditCard.findMany({
        where: { userId },
        orderBy: { name: "asc" },
    });
}

export async function createCreditCard(formData: FormData) {
    const userId = await getAuthenticatedUserId();
    const name = formData.get("name") as string;
    const lastFour = formData.get("lastFour") as string | null;
    const color = formData.get("color") as string | null;

    if (!name) {
        return { error: "Credit card name is required" };
    }

    try {
        await prisma.creditCard.create({
            data: { name, lastFour, color, userId },
        });
        revalidatePath("/settings");
        return { success: true };
    } catch {
        return { error: "Credit card already exists" };
    }
}

export async function updateCreditCard(id: string, formData: FormData) {
    const userId = await getAuthenticatedUserId();
    const name = formData.get("name") as string;
    const lastFour = formData.get("lastFour") as string | null;
    const color = formData.get("color") as string | null;

    try {
        await prisma.creditCard.update({
            where: { id, userId },
            data: { name, lastFour, color },
        });
        revalidatePath("/settings");
        return { success: true };
    } catch {
        return { error: "Failed to update credit card" };
    }
}

export async function deleteCreditCard(id: string) {
    const userId = await getAuthenticatedUserId();

    try {
        await prisma.creditCard.delete({
            where: { id, userId },
        });
        revalidatePath("/settings");
        return { success: true };
    } catch {
        return { error: "Failed to delete credit card" };
    }
}
