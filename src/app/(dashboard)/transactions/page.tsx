/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import {
    Plus,
    Wallet,
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
import { Button } from "@/components/ui/button";
import { getTransactions } from "@/actions/transactions";
import { getCategories } from "@/actions/categories";
import { getCreditCards } from "@/actions/credit-cards";
import { getIncomeSources } from "@/actions/income-sources";
import { getBankAccounts } from "@/actions/accounts";
import { getLoans } from "@/actions/loans";
import { getInstallments } from "@/actions/installments";
import { formatCurrency, getCurrentDateInKL } from "@/lib/utils";
import { TransactionList } from "@/components/transaction-list";
import { TransactionsMonthFilter } from "@/components/transactions-month-filter";

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const ALL_CURRENT_YEAR_PERIOD = "all-current-year";

function buildPeriodOptions(currentDate: Date) {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const monthlyOptions = Array.from({ length: currentMonth }, (_, index) => {
        const month = index + 1;
        const value = `${currentYear}-${String(month).padStart(2, "0")}`;
        const label = `${monthNames[month - 1]} ${currentYear}`;
        return { value, label };
    });

    return [
        { value: ALL_CURRENT_YEAR_PERIOD, label: `All ${currentYear}` },
        ...monthlyOptions,
    ];
}

function parsePeriod(
    period: string | undefined,
    fallbackYear: number,
    fallbackMonth: number,
    maxMonthInYear: number
) {
    if (period === ALL_CURRENT_YEAR_PERIOD) {
        return { year: fallbackYear, month: fallbackMonth, isAllCurrentYear: true };
    }

    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
        return { year: fallbackYear, month: fallbackMonth, isAllCurrentYear: false };
    }

    const [yearStr, monthStr] = period.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);

    if (
        !Number.isFinite(year) ||
        !Number.isFinite(month) ||
        year !== fallbackYear ||
        month < 1 ||
        month > maxMonthInYear
    ) {
        return { year: fallbackYear, month: fallbackMonth, isAllCurrentYear: false };
    }

    return { year, month, isAllCurrentYear: false };
}

export default async function TransactionsPage({
    searchParams,
}: {
    searchParams: Promise<{ period?: string }>;
}) {
    const currentDate = getCurrentDateInKL();
    const fallbackYear = currentDate.getFullYear();
    const fallbackMonth = currentDate.getMonth() + 1;
    const params = await searchParams;
    const { year, month, isAllCurrentYear } = parsePeriod(params.period, fallbackYear, fallbackMonth, fallbackMonth);
    const selectedPeriod = isAllCurrentYear
        ? ALL_CURRENT_YEAR_PERIOD
        : `${year}-${String(month).padStart(2, "0")}`;
    const periodOptions = buildPeriodOptions(currentDate);

    const monthlyTransactions = isAllCurrentYear
        ? await Promise.all(
            Array.from({ length: fallbackMonth }, (_, index) =>
                getTransactions(fallbackYear, index + 1)
            )
        )
        : [await getTransactions(year, month)];

    const transactions = monthlyTransactions
        .flat()
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const [categories, creditCards, incomeSources, bankAccounts, loans, installments] = await Promise.all([
        getCategories(),
        getCreditCards(),
        getIncomeSources(),
        getBankAccounts(),
        getLoans(),
        getInstallments(),
    ]);

    const totalIncome = transactions
        .filter((t: any) => t.type === "income")
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    const totalExpenses = transactions
        .filter((t: any) => t.type === "expense")
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    const totalPayments = transactions
        .filter((t: any) => t.type === "payment")
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Wallet className="h-4 w-4" />
                    <h1 className="text-lg font-semibold">Transactions</h1>
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">All Transactions</h2>
                        <p className="text-muted-foreground">
                            Manage and view your financial transactions
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <TransactionsMonthFilter
                            selectedPeriod={selectedPeriod}
                            options={periodOptions}
                        />
                        <Button asChild>
                            <Link href="/transactions/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Transaction
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {isAllCurrentYear ? "Current Year Income" : "Selected Month Income"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-500">
                                +{formatCurrency(totalIncome)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {isAllCurrentYear ? "Current Year Expenses" : "Selected Month Expenses"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">
                                -{formatCurrency(totalExpenses)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {isAllCurrentYear ? "Current Year Payments" : "Selected Month Payments"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-500">
                                -{formatCurrency(totalPayments)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Transactions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{transactions.length}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Transactions Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Transaction History</CardTitle>
                        <CardDescription>
                            View and manage all your transactions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TransactionList
                            initialTransactions={transactions}
                            categories={categories}
                            creditCards={creditCards}
                            incomeSources={incomeSources}
                            bankAccounts={bankAccounts}
                            loans={loans}
                            installments={installments}
                        />
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
