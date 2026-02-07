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

export async function getBankAccounts() {
    const userId = await getAuthenticatedUserId();
    const accounts = await prisma.bankAccount.findMany({
        where: { userId },
        orderBy: { name: "asc" },
    });

    return accounts.map((account: any) => ({
        ...account,
        balance: Number(account.balance),
        targetAmount: account.targetAmount ? Number(account.targetAmount) : null,
        growthRate: account.growthRate ? Number(account.growthRate) : null,
    }));
}

export async function createBankAccount(formData: FormData) {
    const userId = await getAuthenticatedUserId();
    const name = formData.get("name") as string;
    const type = formData.get("type") as string || "Savings";
    const balance = Number(formData.get("balance")) || 0;
    const isSavings = formData.get("isSavings") === "true";
    const targetAmount = formData.get("targetAmount") ? Number(formData.get("targetAmount")) : null;
    const growthRate = Number(formData.get("growthRate")) || 0;
    const targetDate = formData.get("targetDate") ? new Date(formData.get("targetDate") as string) : null;

    if (!name) {
        return { error: "Name is required" };
    }

    try {
        await prisma.bankAccount.create({
            data: {
                name,
                type,
                balance,
                isSavings,
                targetAmount,
                growthRate,
                targetDate,
                userId,
            },
        });
        revalidatePath("/accounts");
        return { success: true };
    } catch {
        return { error: "Failed to create account" };
    }
}

export async function updateBankAccount(id: string, formData: FormData) {
    const userId = await getAuthenticatedUserId();
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const balance = Number(formData.get("balance"));
    const isSavings = formData.get("isSavings") === "true";
    const targetAmount = formData.get("targetAmount") ? Number(formData.get("targetAmount")) : null;
    const growthRate = Number(formData.get("growthRate"));
    const targetDate = formData.get("targetDate") ? new Date(formData.get("targetDate") as string) : null;

    try {
        await prisma.bankAccount.update({
            where: { id, userId },
            data: {
                name,
                type,
                balance,
                isSavings,
                targetAmount,
                growthRate,
                targetDate,
            },
        });
        revalidatePath("/accounts");
        return { success: true };
    } catch {
        return { error: "Failed to update account" };
    }
}

export async function deleteBankAccount(id: string) {
    const userId = await getAuthenticatedUserId();

    try {
        await prisma.bankAccount.delete({
            where: { id, userId },
        });
        revalidatePath("/accounts");
        return { success: true };
    } catch {
        return { error: "Failed to delete account" };
    }
}
