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

function getLastDayOfMonth(year: number, monthIndex: number) {
    return new Date(year, monthIndex + 1, 0).getDate();
}

function createStatementDate(year: number, monthIndex: number, statementDay: number) {
    const day = Math.min(statementDay, getLastDayOfMonth(year, monthIndex));
    return new Date(year, monthIndex, day);
}

function getFirstStatementDateAfter(startDate: Date, statementDay: number) {
    const year = startDate.getFullYear();
    const monthIndex = startDate.getMonth();
    const sameMonth = createStatementDate(year, monthIndex, statementDay);
    if (startDate <= sameMonth) {
        return sameMonth;
    }
    const nextMonthIndex = (monthIndex + 1) % 12;
    const nextYear = monthIndex === 11 ? year + 1 : year;
    return createStatementDate(nextYear, nextMonthIndex, statementDay);
}

function addMonthsKeepingStatementDay(baseDate: Date, statementDay: number, monthsToAdd: number) {
    const year = baseDate.getFullYear();
    const monthIndex = baseDate.getMonth();
    const totalMonths = monthIndex + monthsToAdd;
    const targetYear = year + Math.floor(totalMonths / 12);
    const targetMonthIndex = totalMonths % 12;
    return createStatementDate(targetYear, targetMonthIndex, statementDay);
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
    const currentBalancePayment = Number(formData.get("currentBalancePayment") || 0);
    const startDate = new Date(formData.get("startDate") as string);
    const creditCardId = formData.get("creditCardId") as string;
    const categoryId = formData.get("categoryId") as string || null;

    if (!name || !totalAmount || !monthlyPayment || !totalMonths || !creditCardId) {
        return { error: "All fields are required" };
    }

    try {
        const normalizedPaidAmount = Number.isFinite(currentBalancePayment) ? Math.max(currentBalancePayment, 0) : 0;
        const paidMonths = monthlyPayment > 0 ? Math.floor(normalizedPaidAmount / monthlyPayment) : 0;
        const remainderAmount = monthlyPayment > 0 ? normalizedPaidAmount - paidMonths * monthlyPayment : 0;
        const remainingMonths = Math.max(totalMonths - Math.min(paidMonths, totalMonths), 0);

        const creditCard = await prisma.creditCard.findUnique({
            where: { id: creditCardId, userId },
            select: { statementDay: true },
        });

        if (!creditCard?.statementDay) {
            return { error: "Credit card statement date is required" };
        }

        const totalPaymentCount = normalizedPaidAmount > 0
            ? paidMonths + (remainderAmount > 0 ? 1 : 0)
            : 0;

        const firstStatementDate = getFirstStatementDateAfter(startDate, creditCard.statementDay);
        const scheduledTransactions = [];
        if (totalPaymentCount > 0) {
            for (let i = 0; i < totalPaymentCount; i++) {
                const amount = i < paidMonths ? monthlyPayment : remainderAmount;
                const date = addMonthsKeepingStatementDay(firstStatementDate, creditCard.statementDay, i);
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                const { monthRecord } = await ensureYearAndMonth(userId, year, month);
                scheduledTransactions.push({ amount, date, monthId: monthRecord.id });
            }
        }

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const installment = await tx.installment.create({
                data: {
                    name,
                    totalAmount,
                    monthlyPayment,
                    totalMonths,
                    remainingMonths,
                    startDate,
                    creditCardId,
                    categoryId,
                    userId,
                },
            });

            if (scheduledTransactions.length > 0) {
                for (const scheduled of scheduledTransactions) {
                    await tx.transaction.create({
                        data: {
                            date: scheduled.date,
                            amount: scheduled.amount,
                            description: `Installment Balance Payment: ${name}`,
                            type: "expense",
                            monthId: scheduled.monthId,
                            creditCardId,
                            categoryId,
                            installmentId: installment.id,
                        },
                    });
                }
            }
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
