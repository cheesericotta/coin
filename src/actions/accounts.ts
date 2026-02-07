"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getCurrentDateInKL } from "@/lib/utils";

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

export async function getSavingsGrowthStats() {
    const userId = await getAuthenticatedUserId();
    const now = getCurrentDateInKL();
    const currentYear = now.getFullYear();

    const accounts = await prisma.bankAccount.findMany({
        where: { userId, isSavings: true },
    });

    const startOfYear = new Date(currentYear, 0, 1);

    const stats = await Promise.all(accounts.map(async (account: any) => {
        const transactions = await prisma.transaction.findMany({
            where: {
                bankAccountId: account.id,
                date: {
                    gte: startOfYear,
                },
            },
            select: {
                amount: true,
                type: true,
            },
        });

        const growthAmount = transactions.reduce((sum: number, tx: any) => {
            return tx.type === "income"
                ? sum + Number(tx.amount)
                : sum - Number(tx.amount);
        }, 0);

        const currentBalance = Number(account.balance);
        const startingBalance = currentBalance - growthAmount;
        const growthPercentage = startingBalance !== 0
            ? (growthAmount / startingBalance) * 100
            : growthAmount > 0 ? 100 : 0;

        return {
            accountId: account.id,
            accountName: account.name,
            currentBalance,
            growthAmount,
            growthPercentage,
            startingBalance,
        };
    }));

    const totalGrowthAmount = stats.reduce((sum, s) => sum + s.growthAmount, 0);
    const totalStartingBalance = stats.reduce((sum, s) => sum + s.startingBalance, 0);
    const totalGrowthPercentage = totalStartingBalance !== 0
        ? (totalGrowthAmount / totalStartingBalance) * 100
        : totalGrowthAmount > 0 ? 100 : 0;

    return {
        byAccount: stats,
        totalGrowthAmount,
        totalGrowthPercentage,
    };
}
