/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { Prisma } from "@prisma/client";

async function getAuthenticatedUserId() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return session.user.id;
}

export async function ensureYearAndMonth(userId: string, year: number, month: number) {
    let yearRecord = await prisma.year.findUnique({
        where: { userId_year: { userId, year } },
    });

    if (!yearRecord) {
        yearRecord = await prisma.year.create({
            data: { year, userId },
        });
    }

    let monthRecord = await prisma.month.findUnique({
        where: { yearId_month: { yearId: yearRecord.id, month } },
    });

    if (!monthRecord) {
        monthRecord = await prisma.month.create({
            data: { month, yearId: yearRecord.id },
        });
    }

    return { yearRecord, monthRecord };
}

export async function getTransactions(year: number, month: number) {
    const userId = await getAuthenticatedUserId();

    const yearRecord = await prisma.year.findUnique({
        where: { userId_year: { userId, year } },
    });

    if (!yearRecord) return [];

    const monthRecord = await prisma.month.findUnique({
        where: { yearId_month: { yearId: yearRecord.id, month } },
        include: {
            transactions: {
                include: {
                    category: true,
                    creditCard: true,
                    incomeSource: true,
                    bankAccount: true,
                    loan: true,
                },
                orderBy: { date: "desc" },
            },
        },
    });

    const transactions = monthRecord?.transactions || [];

    return transactions.map((tx: any) => ({
        ...tx,
        amount: Number(tx.amount),
        bankAccount: tx.bankAccount ? {
            ...tx.bankAccount,
            balance: Number(tx.bankAccount.balance),
            targetAmount: tx.bankAccount.targetAmount ? Number(tx.bankAccount.targetAmount) : null,
            growthRate: tx.bankAccount.growthRate ? Number(tx.bankAccount.growthRate) : null,
        } : null,
        loan: tx.loan ? {
            ...tx.loan,
            totalAmount: Number(tx.loan.totalAmount),
            remainingAmount: Number(tx.loan.remainingAmount),
            interestRate: Number(tx.loan.interestRate),
            monthlyPayment: tx.loan.monthlyPayment ? Number(tx.loan.monthlyPayment) : null,
        } : null,
    }));
}

export async function createTransaction(formData: FormData) {
    const userId = await getAuthenticatedUserId();
    const dateStr = formData.get("date") as string;
    const date = new Date(dateStr);
    const [year, month] = dateStr.split("-").map(Number);
    const amount = formData.get("amount") as string;
    const description = formData.get("description") as string;
    const notes = formData.get("notes") as string;
    const type = formData.get("type") as string;
    const categoryId = formData.get("categoryId") as string;
    const creditCardId = formData.get("creditCardId") as string;
    const incomeSourceId = formData.get("incomeSourceId") as string;
    const bankAccountId = formData.get("bankAccountId") as string;

    const loanId = formData.get("loanId") as string;

    if (!amount || !type) {
        return { error: "Amount and type are required" };
    }

    const { monthRecord } = await ensureYearAndMonth(userId, year, month);

    try {
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            await tx.transaction.create({
                data: {
                    date,
                    amount: new Decimal(amount),
                    description: description || null,
                    notes: notes || null,
                    type,
                    monthId: monthRecord.id,
                    categoryId: categoryId || null,
                    creditCardId: creditCardId || null,
                    incomeSourceId: incomeSourceId || null,
                    bankAccountId: bankAccountId || null,
                    loanId: loanId || null,
                },
            });

            // Update Bank Account balance if linked
            if (bankAccountId) {
                await tx.bankAccount.update({
                    where: { id: bankAccountId, userId },
                    data: {
                        balance: type === "income"
                            ? { increment: new Decimal(amount) }
                            : { decrement: new Decimal(amount) },
                    },
                });
            }

            // If it's a loan payment, update the loan's remaining amount
            if (loanId && type === "expense") {
                await tx.loan.update({
                    where: { id: loanId, userId },
                    data: {
                        remainingAmount: {
                            decrement: new Decimal(amount),
                        },
                    },
                });
            }
        });

        revalidatePath(`/month/${year}/${month}`);
        revalidatePath("/transactions");
        revalidatePath("/accounts");
        revalidatePath("/loans");
        revalidatePath("/");
        return { success: true };
    } catch (e) {
        console.error("Create transaction error:", e);
        return { error: "Failed to create transaction" };
    }
}

export async function updateTransaction(id: string, formData: FormData) {
    const userId = await getAuthenticatedUserId();
    const dateStr = formData.get("date") as string;
    const date = new Date(dateStr);
    const amount = new Decimal(formData.get("amount") as string);
    const description = formData.get("description") as string;
    const notes = formData.get("notes") as string;
    const type = formData.get("type") as string;
    const categoryId = formData.get("categoryId") as string;
    const creditCardId = formData.get("creditCardId") as string;
    const incomeSourceId = formData.get("incomeSourceId") as string;
    const bankAccountId = formData.get("bankAccountId") as string;
    const loanId = formData.get("loanId") as string;

    const [year, month] = dateStr.split("-").map(Number);

    try {
        const oldTx = await prisma.transaction.findFirst({
            where: { id, month: { year: { userId } } },
            include: { month: { include: { year: true } } },
        });

        if (!oldTx) return { error: "Transaction not found" };

        const { monthRecord } = await ensureYearAndMonth(userId, year, month);

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Reverse OLD effects
            if (oldTx.bankAccountId) {
                await tx.bankAccount.update({
                    where: { id: oldTx.bankAccountId, userId },
                    data: {
                        balance: oldTx.type === "income"
                            ? { decrement: oldTx.amount }
                            : { increment: oldTx.amount },
                    },
                });
            }
            if (oldTx.loanId && oldTx.type === "expense") {
                await tx.loan.update({
                    where: { id: oldTx.loanId, userId },
                    data: { remainingAmount: { increment: oldTx.amount } },
                });
            }
            if (oldTx.installmentId && oldTx.type === "expense") {
                await tx.installment.update({
                    where: { id: oldTx.installmentId, userId },
                    data: { remainingMonths: { increment: 1 } },
                });
            }

            // 2. Apply NEW effects
            if (bankAccountId) {
                await tx.bankAccount.update({
                    where: { id: bankAccountId, userId },
                    data: {
                        balance: type === "income"
                            ? { increment: amount }
                            : { decrement: amount },
                    },
                });
            }
            if (loanId && type === "expense") {
                await tx.loan.update({
                    where: { id: loanId, userId },
                    data: { remainingAmount: { decrement: amount } },
                });
            }
            // Preserve installment link; re-apply its effect if the updated tx is still an expense.
            const finalInstallmentId = oldTx.installmentId;
            if (finalInstallmentId && type === "expense") {
                await tx.installment.update({
                    where: { id: finalInstallmentId, userId },
                    data: { remainingMonths: { decrement: 1 } },
                });
            }

            // 3. Update transaction
            await tx.transaction.update({
                where: { id },
                data: {
                    date,
                    amount,
                    description: description || null,
                    notes: notes || null,
                    type,
                    monthId: monthRecord.id,
                    categoryId: categoryId || null,
                    creditCardId: creditCardId || null,
                    incomeSourceId: incomeSourceId || null,
                    bankAccountId: bankAccountId || null,
                    loanId: loanId || null,
                    installmentId: finalInstallmentId,
                },
            });
        });

        revalidatePath(`/month/${year}/${month}`);
        revalidatePath(`/month/${oldTx.month.year.year}/${oldTx.month.month}`);
        revalidatePath("/transactions");
        revalidatePath("/accounts");
        revalidatePath("/loans");
        revalidatePath("/");
        return { success: true };
    } catch (e) {
        console.error("Update transaction error:", e);
        return { error: "Failed to update transaction" };
    }
}

export async function deleteTransaction(id: string) {
    const userId = await getAuthenticatedUserId();

    try {
        const transaction = await prisma.transaction.findFirst({
            where: {
                id,
                month: { year: { userId } },
            },
            include: {
                month: { include: { year: true } },
            },
        });

        if (!transaction) return { error: "Transaction not found" };

        const { amount, type, bankAccountId, loanId, installmentId } = transaction;
        const year = transaction.month.year.year;
        const month = transaction.month.month;

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Reverse bank account balance
            if (bankAccountId) {
                await tx.bankAccount.update({
                    where: { id: bankAccountId, userId },
                    data: {
                        balance: type === "income"
                            ? { decrement: amount }
                            : { increment: amount },
                    },
                });
            }

            // 2. Reverse loan amount
            if (loanId && type === "expense") {
                await tx.loan.update({
                    where: { id: loanId, userId },
                    data: {
                        remainingAmount: { increment: amount },
                    },
                });
            }

            // 3. Reverse installment count
            if (installmentId && type === "expense") {
                await tx.installment.update({
                    where: { id: installmentId, userId },
                    data: {
                        remainingMonths: { increment: 1 },
                    },
                });
            }

            // 4. Delete the transaction
            await tx.transaction.delete({
                where: { id },
            });
        });

        revalidatePath(`/month/${year}/${month}`);
        revalidatePath("/transactions");
        revalidatePath("/accounts");
        revalidatePath("/loans");
        revalidatePath("/settings/credit-cards");
        revalidatePath("/");
        return { success: true };
    } catch (e) {
        console.error("Delete transaction error:", e);
        return { error: "Failed to delete transaction" };
    }
}

export async function getMonthlyStats(year: number, month: number) {
    const userId = await getAuthenticatedUserId();

    const yearRecord = await prisma.year.findUnique({
        where: { userId_year: { userId, year } },
    });

    if (!yearRecord) {
        return { totalIncome: 0, totalExpenses: 0, balance: 0, categoryBreakdown: [] };
    }

    const monthRecord = await prisma.month.findUnique({
        where: { yearId_month: { yearId: yearRecord.id, month } },
        include: {
            transactions: { include: { category: true } },
            budgets: { include: { category: true } },
        },
    });

    if (!monthRecord) {
        return { totalIncome: 0, totalExpenses: 0, balance: 0, categoryBreakdown: [] };
    }

    const transactions = monthRecord.transactions;
    const budgets = monthRecord.budgets;

    const totalIncome = transactions
        .filter((t: any) => t.type === "income")
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
        .filter((t: any) => t.type === "expense")
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    // Category breakdown with planned vs actual
    const categoryBreakdown = budgets.map((budget: any) => {
        const actual = transactions
            .filter((t: any) => t.categoryId === budget.categoryId && t.type === "expense")
            .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

        return {
            id: budget.category.id,
            name: budget.category.name,
            color: budget.category.color,
            icon: budget.category.icon,
            planned: Number(budget.planned),
            actual,
            variance: Number(budget.planned) - actual,
            type: budget.type,
        };
    });

    return {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        categoryBreakdown,
    };
}

export async function getYearlyStats(year: number) {
    const userId = await getAuthenticatedUserId();

    const yearRecord = await prisma.year.findUnique({
        where: { userId_year: { userId, year } },
        include: {
            months: {
                include: {
                    transactions: { include: { category: true } },
                    budgets: true,
                },
            },
        },
    });

    if (!yearRecord) {
        return { monthlyData: [], totalIncome: 0, totalExpenses: 0, topCategories: [] };
    }

    const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const monthNum = i + 1;
        const monthRecord = yearRecord.months.find((m: any) => m.month === monthNum);
        const transactions = monthRecord?.transactions || [];

        const income = transactions
            .filter((t: any) => t.type === "income")
            .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

        const expenses = transactions
            .filter((t: any) => t.type === "expense")
            .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

        return { month: monthNum, income, expenses };
    });

    const allTransactions = yearRecord.months.flatMap((m: any) => m.transactions);
    const totalIncome = allTransactions
        .filter((t: any) => t.type === "income")
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    const totalExpenses = allTransactions
        .filter((t: any) => t.type === "expense")
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    // Top spending categories
    const categoryTotals: Record<string, { name: string; color: string | null; total: number }> = {};
    allTransactions
        .filter((t: any) => t.type === "expense" && t.category)
        .forEach((t: any) => {
            const catId = t.categoryId!;
            if (!categoryTotals[catId]) {
                categoryTotals[catId] = { name: t.category!.name, color: t.category!.color, total: 0 };
            }
            categoryTotals[catId].total += Number(t.amount);
        });

    const topCategories = Object.entries(categoryTotals)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

    return { monthlyData, totalIncome, totalExpenses, topCategories };
}


