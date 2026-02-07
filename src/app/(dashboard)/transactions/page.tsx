import Link from "next/link";
import {
    ArrowDownRight,
    ArrowUpRight,
    Filter,
    Plus,
    Search,
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTransactions } from "@/actions/transactions";
import { formatCurrency, getCurrentDateInKL } from "@/lib/utils";

export default async function TransactionsPage() {
    const currentDate = getCurrentDateInKL();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const transactions = await getTransactions(year, month);

    const totalIncome = transactions
        .filter((t: any) => t.type === "income")
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    const totalExpenses = transactions
        .filter((t: any) => t.type === "expense")
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
                        <Button variant="outline">
                            <Filter className="mr-2 h-4 w-4" />
                            Filter
                        </Button>
                        <Button asChild>
                            <Link href="/transactions/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Transaction
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
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
                        {transactions.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Payment Method</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((tx: any) => (
                                        <TableRow key={tx.id} className="cursor-pointer hover:bg-muted/50">
                                            <TableCell className="font-medium">
                                                {new Date(tx.date).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {tx.type === "income" ? (
                                                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                                                    ) : (
                                                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                                                    )}
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span>{tx.description || "-"}</span>
                                                            {tx.loanId && (
                                                                <Badge variant="outline" className="text-[10px] h-4 px-1 bg-red-500/10 text-red-500 border-red-500/20">
                                                                    Loan
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
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
                                                    <Badge variant="outline">{tx.incomeSource.name}</Badge>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>
                                            <TableCell>{tx.creditCard?.name || tx.bankAccount?.name || "-"}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={tx.type === "income" ? "default" : "secondary"}
                                                    className={
                                                        tx.type === "income"
                                                            ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                                            : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                                    }
                                                >
                                                    {tx.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span
                                                    className={`font-semibold ${tx.type === "income" ? "text-emerald-500" : "text-red-500"
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
                                <Search className="h-12 w-12 text-muted-foreground/50" />
                                <p className="mt-4 text-lg font-medium">No transactions found</p>
                                <p className="text-muted-foreground">
                                    Start by adding your first transaction
                                </p>
                                <Button className="mt-4" asChild>
                                    <Link href="/transactions/new">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Transaction
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
