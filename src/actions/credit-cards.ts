"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

import { Prisma } from "@prisma/client";

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
                },
            },
        },
        orderBy: { name: "asc" },
    });

    return cards.map((card: any) => {
        const balance = card.transactions.reduce((acc: number, tx: any) => {
            // Expenses increase credit card "balance" (debt)
            // Income (payments) decrease it
            // Special case: if it has a bankAccountId and type is 'expense', 
            // it's a payment from an account to the card
            if (tx.bankAccountId && tx.type === "expense") {
                return acc - Number(tx.amount);
            }

            return tx.type === "expense"
                ? acc + Number(tx.amount)
                : acc - Number(tx.amount);
        }, 0);

        return {
            id: card.id,
            name: card.name,
            lastFour: card.lastFour,
            limit: card.limit ? Number(card.limit) : null,
            color: card.color,
            balance: balance,
        };
    });
}

export async function createCreditCard(formData: FormData) {
    const userId = await getAuthenticatedUserId();
    const name = formData.get("name") as string;
    const lastFour = formData.get("lastFour") as string | null;
    const limit = formData.get("limit") ? Number(formData.get("limit")) : null;
    const color = formData.get("color") as string | null;

    if (!name) {
        return { error: "Credit card name is required" };
    }

    try {
        await prisma.creditCard.create({
            data: { name, lastFour, limit, color, userId },
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

    try {
        await prisma.creditCard.update({
            where: { id, userId },
            data: { name, lastFour, limit, color },
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
