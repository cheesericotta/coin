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

export async function getCategories() {
    const userId = await getAuthenticatedUserId();
    return prisma.category.findMany({
        where: { userId },
        orderBy: { name: "asc" },
    });
}

export async function createCategory(formData: FormData) {
    const userId = await getAuthenticatedUserId();
    const name = formData.get("name") as string;
    const icon = formData.get("icon") as string | null;
    const color = formData.get("color") as string | null;

    if (!name) {
        return { error: "Category name is required" };
    }

    try {
        await prisma.category.create({
            data: { name, icon, color, userId },
        });
        revalidatePath("/settings");
        return { success: true };
    } catch {
        return { error: "Category already exists" };
    }
}

export async function updateCategory(id: string, formData: FormData) {
    const userId = await getAuthenticatedUserId();
    const name = formData.get("name") as string;
    const icon = formData.get("icon") as string | null;
    const color = formData.get("color") as string | null;

    try {
        await prisma.category.update({
            where: { id, userId },
            data: { name, icon, color },
        });
        revalidatePath("/settings");
        return { success: true };
    } catch {
        return { error: "Failed to update category" };
    }
}

export async function deleteCategory(id: string) {
    const userId = await getAuthenticatedUserId();

    try {
        await prisma.category.delete({
            where: { id, userId },
        });
        revalidatePath("/settings");
        return { success: true };
    } catch {
        return { error: "Failed to delete category" };
    }
}
