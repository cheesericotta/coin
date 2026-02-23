/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getYearlyStats } from "@/actions/transactions";
import { formatCurrency } from "@/lib/utils";
import { MonthlyBreakdownChart } from "@/components/monthly-breakdown-chart";

const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default async function YearlyViewPage({
    params,
}: {
    params: Promise<{ year: string }>;
}) {
    const { year: yearStr } = await params;
    const year = parseInt(yearStr);
    const stats = await getYearlyStats(year);

    const maxMonthlyValue = Math.max(
        ...stats.monthlyData.map((m) => Math.max(m.income, m.expenses)),
        1
    );

    const fullMonthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];

    const chartData = stats.monthlyData.map((d: any) => ({
        month: fullMonthNames[d.month - 1],
        income: d.income,
        expenses: d.expenses,
    }));

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <TrendingUp className="h-4 w-4" />
                    <h1 className="text-lg font-semibold">Yearly Overview</h1>
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Year Navigator */}
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href={`/year/${year - 1}`}>
                            <ChevronLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h2 className="text-2xl font-bold">{year}</h2>
                    <Button variant="outline" size="icon" asChild>
                        <Link href={`/year/${year + 1}`}>
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-emerald-500">
                                {formatCurrency(stats.totalIncome)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-red-500">
                                {formatCurrency(stats.totalExpenses)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-3xl font-bold ${stats.totalIncome - stats.totalExpenses >= 0 ? "text-blue-500" : "text-red-500"}`}>
                                {formatCurrency(stats.totalIncome - stats.totalExpenses)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Monthly Breakdown Chart */}
                <MonthlyBreakdownChart data={chartData} />

                {/* Monthly Detailed List */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="text-lg font-bold uppercase tracking-tight">Monthly Details</CardTitle>
                        <CardDescription className="font-medium text-[10px] uppercase tracking-widest">Detailed breakdown by month</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {stats.monthlyData.map((month, index) => (
                                <Link
                                    key={month.month}
                                    href={`/month/${year}/${month.month}`}
                                    className="block"
                                >
                                    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                                        <div className="w-12 text-sm font-medium">
                                            {monthNames[index]}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 text-xs text-emerald-500 font-bold uppercase tracking-tighter">Income</div>
                                                <Progress
                                                    value={(month.income / maxMonthlyValue) * 100}
                                                    className="flex-1 h-2 bg-emerald-100 dark:bg-emerald-950 [&>div]:bg-emerald-500"
                                                />
                                                <div className="w-24 text-sm text-right font-mono">
                                                    {formatCurrency(month.income)}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 text-xs text-red-500 font-bold uppercase tracking-tighter">Expenses</div>
                                                <Progress
                                                    value={(month.expenses / maxMonthlyValue) * 100}
                                                    className="flex-1 h-2 bg-rose-100 dark:bg-rose-950 [&>div]:bg-red-500"
                                                />
                                                <div className="w-24 text-sm text-right font-mono">
                                                    {formatCurrency(month.expenses)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`w-24 text-right font-bold ${month.income - month.expenses >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                            {month.income - month.expenses >= 0 ? "+" : ""}
                                            {formatCurrency(month.income - month.expenses)}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Spending Categories */}
                {stats.topCategories.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Spending Categories</CardTitle>
                            <CardDescription>Your biggest expense areas this year</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {stats.topCategories.map((cat, index) => {
                                    const percentage = stats.totalExpenses > 0
                                        ? (cat.total / stats.totalExpenses) * 100
                                        : 0;
                                    return (
                                        <div key={cat.id} className="flex items-center gap-4">
                                            <div className="w-8 text-lg font-bold text-muted-foreground">
                                                #{index + 1}
                                            </div>
                                            <div
                                                className="h-4 w-4 rounded-full"
                                                style={{ backgroundColor: cat.color || "#6b7280" }}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">{cat.name}</span>
                                                    <span className="text-muted-foreground">
                                                        {formatCurrency(cat.total)}
                                                    </span>
                                                </div>
                                                <Progress value={percentage} className="mt-1" />
                                            </div>
                                            <div className="w-16 text-right text-sm text-muted-foreground">
                                                {percentage.toFixed(1)}%
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
