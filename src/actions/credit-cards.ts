/* eslint-disable @typescript-eslint/no-explicit-any */
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
    const cards = await prisma.creditCard.findMany({
        where: { userId },
        include: {
            transactions: {
                select: {
                    amount: true,
                    type: true,
                    bankAccountId: true,
                    installmentId: true,
                },
            },
        },
        orderBy: { name: "asc" },
    });

    return cards.map((card: any) => {
        const balances = card.transactions.reduce((acc: { total: number; excludingInstallments: number }, tx: any) => {
            const amount = Number(tx.amount);

            if (tx.type === "expense") {
                acc.total += amount;
                if (!tx.installmentId) {
                    acc.excludingInstallments += amount;
                }
                return acc;
            }

            if (tx.type === "income" || (tx.type === "payment" && tx.bankAccountId)) {
                acc.total -= amount;
                if (!tx.installmentId) {
                    acc.excludingInstallments -= amount;
                }
                return acc;
            }

            return acc;
        }, { total: 0, excludingInstallments: 0 });

        return {
            id: card.id,
            name: card.name,
            lastFour: card.lastFour,
            limit: card.limit ? Number(card.limit) : null,
            statementDay: card.statementDay,
            dueDay: card.dueDay,
            color: card.color,
            balance: balances.total,
            balanceExcludingInstallments: Math.max(balances.excludingInstallments, 0),
        };
    });
}

export async function createCreditCard(formData: FormData) {
    const userId = await getAuthenticatedUserId();
    const name = formData.get("name") as string;
    const lastFour = formData.get("lastFour") as string | null;
    const limit = formData.get("limit") ? Number(formData.get("limit")) : null;
    const color = formData.get("color") as string | null;
    const statementDay = Number(formData.get("statementDay"));
    const dueDay = Number(formData.get("dueDay"));

    if (!name) {
        return { error: "Credit card name is required" };
    }

    if (!Number.isFinite(statementDay) || statementDay < 1 || statementDay > 31) {
        return { error: "Statement date must be between 1 and 31" };
    }
    if (!Number.isFinite(dueDay) || dueDay < 1 || dueDay > 31) {
        return { error: "Payment due date must be between 1 and 31" };
    }

    try {
        await prisma.creditCard.create({
            data: { name, lastFour, limit, statementDay, dueDay, color, userId },
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
    const limit = formData.get("limit") ? Number(formData.get("limit")) : null;
    const color = formData.get("color") as string | null;
    const statementDay = Number(formData.get("statementDay"));
    const dueDay = Number(formData.get("dueDay"));

    if (!Number.isFinite(statementDay) || statementDay < 1 || statementDay > 31) {
        return { error: "Statement date must be between 1 and 31" };
    }
    if (!Number.isFinite(dueDay) || dueDay < 1 || dueDay > 31) {
        return { error: "Payment due date must be between 1 and 31" };
    }

    try {
        await prisma.creditCard.update({
            where: { id, userId },
            data: { name, lastFour, limit, statementDay, dueDay, color },
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
