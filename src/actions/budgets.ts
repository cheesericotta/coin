"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";

async function getAuthenticatedUserId() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return session.user.id;
}

async function ensureYearAndMonth(userId: string, year: number, month: number) {
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

export async function getBudgets(year: number, month: number) {
    const userId = await getAuthenticatedUserId();

    const yearRecord = await prisma.year.findUnique({
        where: { userId_year: { userId, year } },
    });

    if (!yearRecord) return [];

    const monthRecord = await prisma.month.findUnique({
        where: { yearId_month: { yearId: yearRecord.id, month } },
        include: {
            budgets: {
                include: { category: true },
            },
        },
    });

    return monthRecord?.budgets || [];
}

export async function createBudget(formData: FormData) {
    const userId = await getAuthenticatedUserId();
    const year = parseInt(formData.get("year") as string);
    const month = parseInt(formData.get("month") as string);
    const categoryId = formData.get("categoryId") as string;
    const planned = formData.get("planned") as string;
    const type = formData.get("type") as string;

    if (!categoryId || !planned || !type) {
        return { error: "All fields are required" };
    }

    const { monthRecord } = await ensureYearAndMonth(userId, year, month);

    try {
        await prisma.budget.create({
            data: {
                monthId: monthRecord.id,
                categoryId,
                planned: new Decimal(planned),
                type,
            },
        });
        revalidatePath(`/month/${year}/${month}`);
        return { success: true };
    } catch {
        return { error: "Budget for this category already exists" };
    }
}

export async function updateBudget(id: string, formData: FormData) {
    const planned = formData.get("planned") as string;
    const type = formData.get("type") as string;

    try {
        await prisma.budget.update({
            where: { id },
            data: { planned: new Decimal(planned), type },
        });
        revalidatePath("/");
        return { success: true };
    } catch {
        return { error: "Failed to update budget" };
    }
}

export async function deleteBudget(id: string) {
    try {
        await prisma.budget.delete({
            where: { id },
        });
        revalidatePath("/");
        return { success: true };
    } catch {
        return { error: "Failed to delete budget" };
    }
}

export async function copyBudgetsFromPreviousMonth(year: number, month: number) {
    const userId = await getAuthenticatedUserId();

    // Calculate previous month
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth === 0) {
        prevMonth = 12;
        prevYear--;
    }

    const prevYearRecord = await prisma.year.findUnique({
        where: { userId_year: { userId, year: prevYear } },
    });

    if (!prevYearRecord) {
        return { error: "No previous month data found" };
    }

    const prevMonthRecord = await prisma.month.findUnique({
        where: { yearId_month: { yearId: prevYearRecord.id, month: prevMonth } },
        include: { budgets: true },
    });

    if (!prevMonthRecord || prevMonthRecord.budgets.length === 0) {
        return { error: "No budgets found in previous month" };
    }

    const { monthRecord } = await ensureYearAndMonth(userId, year, month);

    for (const budget of prevMonthRecord.budgets) {
        await prisma.budget.upsert({
            where: { monthId_categoryId: { monthId: monthRecord.id, categoryId: budget.categoryId } },
            update: { planned: budget.planned, type: budget.type },
            create: {
                monthId: monthRecord.id,
                categoryId: budget.categoryId,
                planned: budget.planned,
                type: budget.type,
            },
        });
    }

    revalidatePath(`/month/${year}/${month}`);
    return { success: true };
}
