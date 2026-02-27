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

// Helper to serialize Prisma data for client consumption (converts Decimals to numbers/strings)
function serializeData<T>(data: T): T {
    return JSON.parse(JSON.stringify(data));
}

export async function exportUserData() {
    const userId = await getAuthenticatedUserId();

    const [
        categories,
        creditCards,
        incomeSources,
        bankAccounts,
        loans,
        installments,
        years,
    ] = await Promise.all([
        prisma.category.findMany({ where: { userId } }),
        prisma.creditCard.findMany({ where: { userId } }),
        prisma.incomeSource.findMany({ where: { userId } }),
        prisma.bankAccount.findMany({ where: { userId } }),
        prisma.loan.findMany({ where: { userId } }),
        prisma.installment.findMany({ where: { userId } }),
        prisma.year.findMany({
            where: { userId },
            include: {
                months: {
                    include: {
                        budgets: true,
                        transactions: true,
                    },
                },
            },
        }),
    ]);

    return serializeData({
        categories,
        creditCards,
        incomeSources,
        bankAccounts,
        loans,
        installments,
        years,
        exportedAt: new Date().toISOString(),
        version: "1.0",
    });
}

export async function importUserData(data: any) {
    const userId = await getAuthenticatedUserId();

    if (!data || !data.years) {
        return { error: "Invalid data format" };
    }

    try {
        const categories = Array.isArray(data.categories) ? data.categories : [];
        const creditCards = Array.isArray(data.creditCards) ? data.creditCards : [];
        const incomeSources = Array.isArray(data.incomeSources) ? data.incomeSources : [];
        const bankAccounts = Array.isArray(data.bankAccounts) ? data.bankAccounts : [];
        const loans = Array.isArray(data.loans) ? data.loans : [];
        const installments = Array.isArray(data.installments) ? data.installments : [];
        const years = Array.isArray(data.years) ? data.years : [];

        const months = years.flatMap((year: any) =>
            (Array.isArray(year.months) ? year.months : []).map((month: any) => ({
                ...month,
                yearId: year.id,
            }))
        );

        const budgets = months.flatMap((month: any) =>
            (Array.isArray(month.budgets) ? month.budgets : []).map((budget: any) => ({
                ...budget,
                monthId: month.id,
            }))
        );

        const transactions = months.flatMap((month: any) =>
            (Array.isArray(month.transactions) ? month.transactions : []).map((txData: any) => ({
                ...txData,
                monthId: month.id,
            }))
        );

        // Keep clear operation atomic, then do bulk inserts in short standalone queries.
        await prisma.$transaction([
            prisma.year.deleteMany({ where: { userId } }),
            prisma.category.deleteMany({ where: { userId } }),
            prisma.creditCard.deleteMany({ where: { userId } }),
            prisma.incomeSource.deleteMany({ where: { userId } }),
            prisma.bankAccount.deleteMany({ where: { userId } }),
            prisma.loan.deleteMany({ where: { userId } }),
            prisma.installment.deleteMany({ where: { userId } }),
        ]);

        if (categories.length) {
            await prisma.category.createMany({
                data: categories.map((cat: any) => ({
                    id: cat.id,
                    name: cat.name,
                    icon: cat.icon ?? null,
                    color: cat.color ?? null,
                    isDefault: Boolean(cat.isDefault),
                    userId,
                })),
            });
        }

        if (creditCards.length) {
            await prisma.creditCard.createMany({
                data: creditCards.map((card: any) => ({
                    id: card.id,
                    name: card.name,
                    lastFour: card.lastFour ?? null,
                    limit: card.limit ?? null,
                    statementDay: card.statementDay ?? null,
                    dueDay: card.dueDay ?? null,
                    color: card.color ?? null,
                    userId,
                })),
            });
        }

        if (incomeSources.length) {
            await prisma.incomeSource.createMany({
                data: incomeSources.map((source: any) => ({
                    id: source.id,
                    name: source.name,
                    type: source.type,
                    userId,
                })),
            });
        }

        if (bankAccounts.length) {
            await prisma.bankAccount.createMany({
                data: bankAccounts.map((bank: any) => ({
                    id: bank.id,
                    name: bank.name,
                    type: bank.type || "calcu",
                    balance: bank.balance,
                    isSavings: Boolean(bank.isSavings),
                    targetAmount: bank.targetAmount ?? null,
                    growthRate: bank.growthRate ?? null,
                    targetDate: bank.targetDate ? new Date(bank.targetDate) : null,
                    userId,
                })),
            });
        }

        if (loans.length) {
            await prisma.loan.createMany({
                data: loans.map((loan: any) => ({
                    id: loan.id,
                    name: loan.name,
                    totalAmount: loan.totalAmount,
                    remainingAmount: loan.remainingAmount,
                    interestRate: loan.interestRate,
                    monthlyPayment: loan.monthlyPayment ?? null,
                    dueDate: loan.dueDate ?? null,
                    userId,
                })),
            });
        }

        if (installments.length) {
            await prisma.installment.createMany({
                data: installments.map((inst: any) => ({
                    id: inst.id,
                    name: inst.name,
                    totalAmount: inst.totalAmount,
                    monthlyPayment: inst.monthlyPayment,
                    totalMonths: inst.totalMonths,
                    remainingMonths: inst.remainingMonths,
                    startDate: new Date(inst.startDate),
                    creditCardId: inst.creditCardId,
                    categoryId: inst.categoryId ?? null,
                    userId,
                })),
            });
        }

        if (years.length) {
            await prisma.year.createMany({
                data: years.map((year: any) => ({
                    id: year.id,
                    year: year.year,
                    userId,
                })),
            });
        }

        if (months.length) {
            await prisma.month.createMany({
                data: months.map((month: any) => ({
                    id: month.id,
                    month: month.month,
                    yearId: month.yearId,
                })),
            });
        }

        if (budgets.length) {
            await prisma.budget.createMany({
                data: budgets.map((budget: any) => ({
                    id: budget.id,
                    planned: budget.planned,
                    type: budget.type,
                    monthId: budget.monthId,
                    categoryId: budget.categoryId,
                })),
            });
        }

        if (transactions.length) {
            await prisma.transaction.createMany({
                data: transactions.map((txData: any) => ({
                    id: txData.id,
                    date: new Date(txData.date),
                    amount: txData.amount,
                    description: txData.description ?? null,
                    notes: txData.notes ?? null,
                    type: txData.type,
                    monthId: txData.monthId,
                    categoryId: txData.categoryId ?? null,
                    creditCardId: txData.creditCardId ?? null,
                    incomeSourceId: txData.incomeSourceId ?? null,
                    bankAccountId: txData.bankAccountId ?? null,
                    transferToAccountId: txData.transferToAccountId ?? null,
                    loanId: txData.loanId ?? null,
                    installmentId: txData.installmentId ?? null,
                })),
            });
        }

        revalidatePath("/");
        revalidatePath("/settings");
        return { success: true };
    } catch (e) {
        console.error("Import error:", e);
        return { error: "Failed to import data. Please check the file format." };
    }
}

export async function clearAllUserData() {
    const userId = await getAuthenticatedUserId();

    try {
        await prisma.$transaction([
            prisma.year.deleteMany({ where: { userId } }),
            prisma.category.deleteMany({ where: { userId } }),
            prisma.creditCard.deleteMany({ where: { userId } }),
            prisma.incomeSource.deleteMany({ where: { userId } }),
            prisma.bankAccount.deleteMany({ where: { userId } }),
            prisma.loan.deleteMany({ where: { userId } }),
            prisma.installment.deleteMany({ where: { userId } }),
        ]);

        revalidatePath("/");
        revalidatePath("/settings");
        return { success: true };
    } catch (e) {
        console.error("Clear data error:", e);
        return { error: "Failed to clear data" };
    }
}
