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
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Clear existing data
            await tx.year.deleteMany({ where: { userId } });
            await tx.category.deleteMany({ where: { userId } });
            await tx.creditCard.deleteMany({ where: { userId } });
            await tx.incomeSource.deleteMany({ where: { userId } });
            await tx.bankAccount.deleteMany({ where: { userId } });
            await tx.loan.deleteMany({ where: { userId } });
            await tx.installment.deleteMany({ where: { userId } });

            // 2. Import Categories
            const categoryMap = new Map();
            if (data.categories) {
                for (const cat of data.categories) {
                    const newCat = await tx.category.create({
                        data: {
                            name: cat.name,
                            icon: cat.icon,
                            color: cat.color,
                            isDefault: cat.isDefault,
                            userId,
                        },
                    });
                    categoryMap.set(cat.id, newCat.id);
                }
            }

            // 3. Import Credit Cards
            const cardMap = new Map();
            if (data.creditCards) {
                for (const card of data.creditCards) {
                    const newCard = await tx.creditCard.create({
                        data: {
                            name: card.name,
                            lastFour: card.lastFour,
                            limit: card.limit,
                            statementDay: card.statementDay ?? null,
                            dueDay: card.dueDay ?? null,
                            color: card.color,
                            userId,
                        },
                    });
                    cardMap.set(card.id, newCard.id);
                }
            }

            // 4. Import Income Sources
            const incomeMap = new Map();
            if (data.incomeSources) {
                for (const source of data.incomeSources) {
                    const newSource = await tx.incomeSource.create({
                        data: {
                            name: source.name,
                            type: source.type,
                            userId,
                        },
                    });
                    incomeMap.set(source.id, newSource.id);
                }
            }

            // 5. Import Bank Accounts
            const bankMap = new Map();
            if (data.bankAccounts) {
                for (const bank of data.bankAccounts) {
                    const newBank = await tx.bankAccount.create({
                        data: {
                            name: bank.name,
                            type: bank.type || "Savings",
                            balance: bank.balance,
                            isSavings: bank.isSavings,
                            targetAmount: bank.targetAmount,
                            growthRate: bank.growthRate,
                            targetDate: bank.targetDate ? new Date(bank.targetDate) : null,
                            userId,
                        },
                    });
                    bankMap.set(bank.id, newBank.id);
                }
            }

            // 6. Import Loans
            const loanMap = new Map();
            if (data.loans) {
                for (const loan of data.loans) {
                    const newLoan = await tx.loan.create({
                        data: {
                            name: loan.name,
                            totalAmount: loan.totalAmount,
                            remainingAmount: loan.remainingAmount,
                            interestRate: loan.interestRate,
                            monthlyPayment: loan.monthlyPayment,
                            dueDate: loan.dueDate,
                            userId,
                        },
                    });
                    loanMap.set(loan.id, newLoan.id);
                }
            }

            // 7. Import Installments
            const instMap = new Map();
            if (data.installments) {
                for (const inst of data.installments) {
                    const newInst = await tx.installment.create({
                        data: {
                            name: inst.name,
                            totalAmount: inst.totalAmount,
                            monthlyPayment: inst.monthlyPayment,
                            totalMonths: inst.totalMonths,
                            remainingMonths: inst.remainingMonths,
                            startDate: new Date(inst.startDate),
                            creditCardId: cardMap.get(inst.creditCardId),
                            categoryId: inst.categoryId ? categoryMap.get(inst.categoryId) : null,
                            userId,
                        },
                    });
                    instMap.set(inst.id, newInst.id);
                }
            }

            // 8. Import Years, Months, Budgets, and Transactions
            if (data.years) {
                for (const year of data.years) {
                    const newYear = await tx.year.create({
                        data: {
                            year: year.year,
                            userId,
                        },
                    });

                    if (year.months) {
                        for (const month of year.months) {
                            const newMonth = await tx.month.create({
                                data: {
                                    month: month.month,
                                    yearId: newYear.id,
                                },
                            });

                            if (month.budgets) {
                                for (const budget of month.budgets) {
                                    await tx.budget.create({
                                        data: {
                                            planned: budget.planned,
                                            type: budget.type,
                                            monthId: newMonth.id,
                                            categoryId: categoryMap.get(budget.categoryId),
                                        },
                                    });
                                }
                            }

                            if (month.transactions) {
                                for (const txData of month.transactions) {
                                    await tx.transaction.create({
                                        data: {
                                            date: new Date(txData.date),
                                            amount: txData.amount,
                                            description: txData.description,
                                            notes: txData.notes,
                                            type: txData.type,
                                            monthId: newMonth.id,
                                            categoryId: txData.categoryId ? categoryMap.get(txData.categoryId) : null,
                                            creditCardId: txData.creditCardId ? cardMap.get(txData.creditCardId) : null,
                                            incomeSourceId: txData.incomeSourceId ? incomeMap.get(txData.incomeSourceId) : null,
                                            bankAccountId: txData.bankAccountId ? bankMap.get(txData.bankAccountId) : null,
                                            loanId: txData.loanId ? loanMap.get(txData.loanId) : null,
                                            installmentId: txData.installmentId ? instMap.get(txData.installmentId) : null,
                                        },
                                    });
                                }
                            }
                        }
                    }
                }
            }
        });

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
