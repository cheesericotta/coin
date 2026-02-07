import {
    ArrowDownRight,
    ArrowUpRight,
    CreditCard,
    DollarSign,
    Landmark,
    PiggyBank,
    TrendingUp,
    Wallet,
} from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { getMonthlyStats, getTransactions } from "@/actions/transactions";
import { getCreditCards } from "@/actions/credit-cards";
import { getBankAccounts } from "@/actions/accounts";
import { formatCurrency, getCurrentDateInKL } from "@/lib/utils";

export default async function DashboardPage() {
    const currentDate = getCurrentDateInKL();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const [stats, transactions, creditCards, bankAccounts] = await Promise.all([
        getMonthlyStats(year, month),
        getTransactions(year, month),
        getCreditCards(),
        getBankAccounts(),
    ]);

    const recentTransactions = transactions.slice(0, 5).map((tx: any) => ({
        ...tx,
        amount: Number(tx.amount),
    }));

    const totalBalance = bankAccounts.reduce((sum: number, a: any) => sum + Number(a.balance), 0);
    const totalSavings = bankAccounts
        .filter((a: any) => a.isSavings)
        .reduce((sum: number, a: any) => sum + Number(a.balance), 0);

    const totalPlanned = stats.categoryBreakdown.reduce(
        (sum: number, cat: any) => sum + cat.planned,
        0
    );
    const totalActual = stats.categoryBreakdown.reduce(
        (sum: number, cat: any) => sum + cat.actual,
        0
    );
    const budgetUtilization =
        totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <h1 className="text-lg font-semibold">Dashboard</h1>
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Welcome Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            {monthNames[month - 1]} {year}
                        </h2>
                        <p className="text-muted-foreground">
                            Your financial overview at a glance
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/transactions/new">
                            <DollarSign className="mr-2 h-4 w-4" />
                            Add Transaction
                        </Link>
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                            <Landmark className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-500">
                                {formatCurrency(totalBalance)}
                            </div>
                            <p className="text-xs text-muted-foreground">Across all accounts</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
                            <PiggyBank className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-500">
                                {formatCurrency(totalSavings)}
                            </div>
                            <p className="text-xs text-muted-foreground">Marked as savings</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">
                                {formatCurrency(stats.totalExpenses)}
                            </div>
                            <p className="text-xs text-muted-foreground">This month</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
                            <TrendingUp className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-500">
                                {budgetUtilization.toFixed(1)}%
                            </div>
                            <Progress value={Math.min(budgetUtilization, 100)} className="mt-2" />
                        </CardContent>
                    </Card>
                </div>

                {/* Category Breakdown and Recent Transactions */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Category Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Category Breakdown
                            </CardTitle>
                            <CardDescription>Planned vs actual spending</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {stats.categoryBreakdown.length > 0 ? (
                                <div className="space-y-4">
                                    {stats.categoryBreakdown.map((cat: any) => {
                                        const percentage =
                                            cat.planned > 0 ? (cat.actual / cat.planned) * 100 : 0;
                                        const isOverBudget = cat.actual > cat.planned;
                                        return (
                                            <div key={cat.id} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="h-3 w-3 rounded-full"
                                                            style={{ backgroundColor: cat.color || "#6b7280" }}
                                                        />
                                                        <span className="text-sm font-medium">{cat.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-muted-foreground">
                                                            {formatCurrency(cat.actual)} / {formatCurrency(cat.planned)}
                                                        </span>
                                                        {isOverBudget && (
                                                            <Badge variant="destructive" className="text-xs">
                                                                Over
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <Progress
                                                    value={Math.min(percentage, 100)}
                                                    className={isOverBudget ? "[&>div]:bg-red-500" : ""}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <PiggyBank className="h-12 w-12 text-muted-foreground/50" />
                                    <p className="mt-2 text-sm text-muted-foreground">
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

                    {/* Recent Transactions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Recent Transactions
                            </CardTitle>
                            <CardDescription>Latest activity this month</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentTransactions.length > 0 ? (
                                <div className="space-y-4">
                                    {recentTransactions.map((tx: any) => (
                                        <div
                                            key={tx.id}
                                            className="flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`flex h-9 w-9 items-center justify-center rounded-full ${tx.type === "income"
                                                        ? "bg-emerald-500/10 text-emerald-500"
                                                        : "bg-red-500/10 text-red-500"
                                                        }`}
                                                >
                                                    {tx.type === "income" ? (
                                                        <ArrowUpRight className="h-4 w-4" />
                                                    ) : (
                                                        <ArrowDownRight className="h-4 w-4" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {tx.description || tx.category?.name || "Transaction"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(tx.date).toLocaleDateString()}
                                                        {tx.creditCard && ` • ${tx.creditCard.name}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <span
                                                className={`text-sm font-semibold ${tx.type === "income" ? "text-emerald-500" : "text-red-500"
                                                    }`}
                                            >
                                                {tx.type === "income" ? "+" : "-"}{formatCurrency(Number(tx.amount))}
                                            </span>
                                        </div>
                                    ))}
                                    <Button variant="outline" className="w-full" asChild>
                                        <Link href="/transactions">View All Transactions</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <Wallet className="h-12 w-12 text-muted-foreground/50" />
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        No transactions this month
                                    </p>
                                    <Button variant="outline" className="mt-4" asChild>
                                        <Link href="/transactions/new">Add Your First Transaction</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Credit Cards Overview */}
                {creditCards.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Your Credit Cards
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {creditCards.map((card: any) => {
                                    const cardTransactions = transactions.filter(
                                        (tx: any) => tx.creditCardId === card.id && tx.type === "expense"
                                    );
                                    const totalSpent = cardTransactions.reduce(
                                        (sum: number, tx: any) => sum + Number(tx.amount),
                                        0
                                    );
                                    return (
                                        <div
                                            key={card.id}
                                            className="flex items-center gap-4 rounded-lg border p-4"
                                            style={{ borderColor: card.color || undefined }}
                                        >
                                            <div
                                                className="flex h-10 w-10 items-center justify-center rounded-lg"
                                                style={{
                                                    backgroundColor: card.color
                                                        ? `${card.color}20`
                                                        : undefined,
                                                }}
                                            >
                                                <CreditCard
                                                    className="h-5 w-5"
                                                    style={{ color: card.color || undefined }}
                                                />
                                            </div>
                                            <div>
                                                <p className="font-medium">{card.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatCurrency(totalSpent)} spent this month
                                                </p>
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
