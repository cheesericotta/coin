/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import {
    ArrowDownRight,
    ArrowUpRight,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Copy,
    Plus,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getMonthlyStats, getTransactions } from "@/actions/transactions";
import { copyBudgetsFromPreviousMonth } from "@/actions/budgets";
import { formatCurrency } from "@/lib/utils";

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

export default async function MonthlyViewPage({
    params,
}: {
    params: Promise<{ year: string; month: string }>;
}) {
    const { year: yearStr, month: monthStr } = await params;
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    const stats = await getMonthlyStats(year, month);
    const transactions = await getTransactions(year, month);

    // Calculate previous and next month
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth === 0) {
        prevMonth = 12;
        prevYear--;
    }
    let nextYear = year;
    let nextMonth = month + 1;
    if (nextMonth === 13) {
        nextMonth = 1;
        nextYear++;
    }

    const totalPlanned = stats.categoryBreakdown.reduce(
        (sum: number, cat: any) => sum + cat.planned,
        0
    );
    const totalActual = stats.categoryBreakdown.reduce(
        (sum: number, cat: any) => sum + cat.actual,
        0
    );

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Calendar className="h-4 w-4" />
                    <h1 className="text-lg font-semibold">Monthly View</h1>
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Month Navigator */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href={`/month/${prevYear}/${prevMonth}`}>
                                <ChevronLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <h2 className="text-2xl font-bold">
                            {monthNames[month - 1]} {year}
                        </h2>
                        <Button variant="outline" size="icon" asChild>
                            <Link href={`/month/${nextYear}/${nextMonth}`}>
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <form
                            action={async () => {
                                "use server";
                                await copyBudgetsFromPreviousMonth(year, month);
                            }}
                        >
                            <Button variant="outline" type="submit">
                                <Copy className="mr-2 h-4 w-4" />
                                Copy from {monthNames[prevMonth - 1]}
                            </Button>
                        </form>
                        <Button asChild>
                            <Link href={`/month/${year}/${month}/budgets`}>
                                <Plus className="mr-2 h-4 w-4" />
                                Manage Budgets
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 shadow-sm transition-all hover:shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Income
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(stats.totalIncome)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/20 shadow-sm transition-all hover:shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Expenses
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                                {formatCurrency(stats.totalExpenses)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/20 shadow-sm transition-all hover:shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Planned
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(totalPlanned)}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 shadow-sm transition-all hover:shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Budget Variance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`text-2xl font-bold ${totalPlanned - totalActual >= 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-600 dark:text-rose-400"
                                    }`}
                            >
                                {totalPlanned - totalActual >= 0 ? "+" : ""}
                                {formatCurrency(totalPlanned - totalActual)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Planned vs Actual Table */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="text-lg font-bold uppercase tracking-tight">Planned vs Actual by Category</CardTitle>
                        <CardDescription className="font-medium text-[10px] uppercase tracking-widest">
                            Compare your budgeted amounts with actual spending
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats.categoryBreakdown.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Planned</TableHead>
                                        <TableHead className="text-right">Actual</TableHead>
                                        <TableHead className="text-right">Variance</TableHead>
                                        <TableHead className="w-[200px]">Progress</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.categoryBreakdown.map((cat: any) => {
                                        const percentage =
                                            cat.planned > 0 ? (cat.actual / cat.planned) * 100 : 0;
                                        const isOverBudget = cat.actual > cat.planned;
                                        return (
                                            <TableRow key={cat.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="h-3 w-3 rounded-full"
                                                            style={{ backgroundColor: cat.color || "#6b7280" }}
                                                        />
                                                        <span className="font-medium">{cat.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{cat.type}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(cat.planned)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(cat.actual)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span
                                                        className={
                                                            cat.variance >= 0 ? "text-emerald-500" : "text-red-500"
                                                        }
                                                    >
                                                        {cat.variance >= 0 ? "+" : ""}
                                                        {formatCurrency(cat.variance)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Progress
                                                            value={Math.min(percentage, 100)}
                                                            className={`flex-1 ${isOverBudget ? "[&>div]:bg-red-500" : ""
                                                                }`}
                                                        />
                                                        <span className="text-xs text-muted-foreground w-12 text-right">
                                                            {percentage.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <p className="text-muted-foreground">
                                    No budgets set for this month
                                </p>
                                <Button variant="outline" className="mt-4" asChild>
                                    <Link href={`/month/${year}/${month}/budgets`}>
                                        Set Up Budgets
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Transactions List */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold uppercase tracking-tight">Transactions</CardTitle>
                                <CardDescription className="font-medium text-[10px] uppercase tracking-widest">
                                    {transactions.length} transactions this month
                                </CardDescription>
                            </div>
                            <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 font-bold uppercase tracking-tight text-[10px]">
                                <Link href="/transactions/new">
                                    <Plus className="mr-2 h-3 w-3" />
                                    Add Transaction
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {transactions.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Payment Method</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((tx: any) => (
                                        <TableRow key={tx.id}>
                                            <TableCell>
                                                {new Date(tx.date).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {tx.type === "income" ? (
                                                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                                                    ) : (
                                                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                                                    )}
                                                    {tx.description || "-"}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {tx.category ? (
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="h-2 w-2 rounded-full"
                                                            style={{
                                                                backgroundColor: tx.category.color || "#6b7280",
                                                            }}
                                                        />
                                                        {tx.category.name}
                                                        {tx.loanId && (
                                                            <Badge variant="outline" className="text-[10px] h-4 px-1 bg-red-500/10 text-red-500 border-red-500/20 ml-2">
                                                                Loan
                                                            </Badge>
                                                        )}
                                                    </div>
                                                ) : tx.incomeSource ? (
                                                    tx.incomeSource.name
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {tx.creditCard?.name || tx.bankAccount?.name || "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span
                                                    className={`font-medium ${tx.type === "income"
                                                        ? "text-emerald-500"
                                                        : "text-red-500"
                                                        }`}
                                                >
                                                    {tx.type === "income" ? "+" : "-"}{formatCurrency(Number(tx.amount))}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <p className="text-muted-foreground">No transactions yet</p>
                                <Button variant="outline" className="mt-4" asChild>
                                    <Link href="/transactions/new">Add Your First Transaction</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
