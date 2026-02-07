"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ensureYearAndMonth } from "./transactions";
import { Prisma } from "@prisma/client";
import { getCurrentDateInKL } from "@/lib/utils";

async function getAuthenticatedUserId() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return session.user.id;
}

export async function getInstallments() {
    const userId = await getAuthenticatedUserId();
    const installments = await prisma.installment.findMany({
        where: { userId },
        include: {
            creditCard: true,
            category: true,
        },
        orderBy: { startDate: "desc" },
    });

    return installments.map((inst: any) => ({
        ...inst,
        totalAmount: Number(inst.totalAmount),
        monthlyPayment: Number(inst.monthlyPayment),
    }));
}

export async function createInstallment(formData: FormData) {
    const userId = await getAuthenticatedUserId();
    const name = formData.get("name") as string;
    const totalAmount = Number(formData.get("totalAmount"));
    const monthlyPayment = Number(formData.get("monthlyPayment"));
    const totalMonths = Number(formData.get("totalMonths"));
    const startDate = new Date(formData.get("startDate") as string);
    const creditCardId = formData.get("creditCardId") as string;
    const categoryId = formData.get("categoryId") as string || null;

    if (!name || !totalAmount || !monthlyPayment || !totalMonths || !creditCardId) {
        return { error: "All fields are required" };
    }

    try {
        await prisma.installment.create({
            data: {
                name,
                totalAmount,
                monthlyPayment,
                totalMonths,
                remainingMonths: totalMonths,
                startDate,
                creditCardId,
                categoryId,
                userId,
            },
        });
        revalidatePath("/settings/credit-cards");
        revalidatePath("/accounts");
        return { success: true };
    } catch {
        return { error: "Failed to create installment" };
    }
}

export async function deleteInstallment(id: string) {
    const userId = await getAuthenticatedUserId();

    try {
        await prisma.installment.delete({
            where: { id, userId },
        });
        revalidatePath("/settings/credit-cards");
        return { success: true };
    } catch {
        return { error: "Failed to delete installment" };
    }
}

export async function payInstallment(id: string) {
    const userId = await getAuthenticatedUserId();
    const date = getCurrentDateInKL();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    try {
        const installment = await prisma.installment.findUnique({
            where: { id, userId },
        });

        if (!installment) return { error: "Installment not found" };
        if (installment.remainingMonths <= 0) return { error: "Installment already completed" };

        const { monthRecord } = await ensureYearAndMonth(userId, year, month);

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Create transaction
            await tx.transaction.create({
                data: {
                    date,
                    amount: installment.monthlyPayment,
                    description: `Installment Payment: ${installment.name}`,
                    type: "expense",
                    monthId: monthRecord.id,
                    creditCardId: installment.creditCardId,
                    categoryId: installment.categoryId,
                    installmentId: installment.id,
                },
            });

            // 2. Decrement remaining months
            await tx.installment.update({
                where: { id, userId },
                data: {
                    remainingMonths: {
                        decrement: 1,
                    },
                },
            });
        });

        revalidatePath("/settings/credit-cards");
        revalidatePath(`/month/${year}/${month}`);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "Failed to process payment" };
    }
}

export async function updateInstallment(id: string, formData: FormData) {
    const userId = await getAuthenticatedUserId();
    const name = formData.get("name") as string;
    const totalAmount = Number(formData.get("totalAmount"));
    const monthlyPayment = Number(formData.get("monthlyPayment"));
    const remainingMonths = Number(formData.get("remainingMonths"));
    const creditCardId = formData.get("creditCardId") as string;
    const categoryId = formData.get("categoryId") as string || null;

    try {
        await prisma.installment.update({
            where: { id, userId },
            data: {
                name,
                totalAmount,
                monthlyPayment,
                remainingMonths,
                creditCardId,
                categoryId,
            },
        });
        revalidatePath("/settings/credit-cards");
        return { success: true };
    } catch {
        return { error: "Failed to update installment" };
    }
}
