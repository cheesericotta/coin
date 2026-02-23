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

export default async function TransactionsPage() {
    const currentDate = getCurrentDateInKL();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const [transactions, categories, creditCards, incomeSources, bankAccounts, loans, installments] = await Promise.all([
        getTransactions(year, month),
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
                                This Month Income
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
                                This Month Expenses
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
                                This Month Payments
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
