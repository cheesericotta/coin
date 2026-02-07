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

export async function getLoans() {
    const userId = await getAuthenticatedUserId();
    const loans = await prisma.loan.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });

    return loans.map((loan: any) => ({
        ...loan,
        totalAmount: Number(loan.totalAmount),
        remainingAmount: Number(loan.remainingAmount),
        interestRate: Number(loan.interestRate),
        monthlyPayment: loan.monthlyPayment ? Number(loan.monthlyPayment) : null,
    }));
}

export async function createLoan(formData: FormData) {
    const userId = await getAuthenticatedUserId();
    const name = formData.get("name") as string;
    const totalAmount = Number(formData.get("totalAmount"));
    const remainingAmount = Number(formData.get("remainingAmount"));
    const interestRate = Number(formData.get("interestRate"));
    const monthlyPayment = formData.get("monthlyPayment") ? Number(formData.get("monthlyPayment")) : null;
    const dueDate = formData.get("dueDate") ? Number(formData.get("dueDate")) : null;

    if (!name || isNaN(totalAmount) || isNaN(interestRate)) {
        return { error: "Name, total amount, and interest rate are required" };
    }

    try {
        await prisma.loan.create({
            data: {
                name,
                totalAmount,
                remainingAmount: isNaN(remainingAmount) ? totalAmount : remainingAmount,
                interestRate,
                monthlyPayment,
                dueDate,
                userId,
            },
        });
        revalidatePath("/loans");
        return { success: true };
    } catch {
        return { error: "Failed to create loan" };
    }
}

export async function updateLoan(id: string, formData: FormData) {
    const userId = await getAuthenticatedUserId();
    const name = formData.get("name") as string;
    const totalAmount = Number(formData.get("totalAmount"));
    const remainingAmount = Number(formData.get("remainingAmount"));
    const interestRate = Number(formData.get("interestRate"));
    const monthlyPayment = formData.get("monthlyPayment") ? Number(formData.get("monthlyPayment")) : null;
    const dueDate = formData.get("dueDate") ? Number(formData.get("dueDate")) : null;

    try {
        await prisma.loan.update({
            where: { id, userId },
            data: {
                name,
                totalAmount,
                remainingAmount,
                interestRate,
                monthlyPayment,
                dueDate,
            },
        });
        revalidatePath("/loans");
        return { success: true };
    } catch {
        return { error: "Failed to update loan" };
    }
}

export async function deleteLoan(id: string) {
    const userId = await getAuthenticatedUserId();

    try {
        await prisma.loan.delete({
            where: { id, userId },
        });
        revalidatePath("/loans");
        return { success: true };
    } catch {
        return { error: "Failed to delete loan" };
    }
}
