"use client";

import { useState } from "react";
import { Plus, PiggyBank, Target, TrendingUp, Trash2, Pencil, Landmark, Wallet, CreditCard as CardIcon } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { createBankAccount, deleteBankAccount, updateBankAccount } from "@/actions/accounts";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface AccountsDashboardProps {
    accounts: {
        id: string;
        name: string;
        type: string;
        balance: number;
        isSavings: boolean;
        targetAmount: number | null;
        growthRate: number | null;
        targetDate: Date | null;
    }[];
}

export function AccountsDashboard({ accounts }: AccountsDashboardProps) {
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<AccountsDashboardProps["accounts"][0] | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await createBankAccount(formData);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Account added");
            setOpen(false);
        }
        setLoading(false);
    }

    async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!selectedAccount) return;
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await updateBankAccount(selectedAccount.id, formData);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Account updated");
            setEditOpen(false);
            setSelectedAccount(null);
        }
        setLoading(false);
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this account?")) return;
        const result = await deleteBankAccount(id);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Account deleted");
        }
    }

    // Calculate total balance vs total savings
    const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
    const savingsAccounts = accounts.filter(a => a.isSavings);
    const totalSavings = savingsAccounts.reduce((sum, a) => sum + Number(a.balance), 0);

    // Simple projection for savings accounts
    const projectionData = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const projected = savingsAccounts.reduce((sum, a) => {
            const annualRate = Number(a.growthRate || 0) / 100;
            const monthlyRate = annualRate / 12;
            return sum + (Number(a.balance) * Math.pow(1 + monthlyRate, month));
        }, 0);
        return {
            name: `Month ${month}`,
            value: projected,
        };
    });

    const getAccountIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case "cash": return <Wallet className="h-4 w-4" />;
            case "credit": return <CardIcon className="h-4 w-4" />;
            default: return <Landmark className="h-4 w-4" />;
        }
    };

    return (
        <div className="flex flex-1 flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Accounts</h2>
                    <p className="text-muted-foreground">
                        Manage your bank accounts, wallets and savings
                    </p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Account
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Account</DialogTitle>
                            <DialogDescription>
                                Create a new bank account or wallet
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" name="name" placeholder="e.g., Maybank, Cash" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                <Select name="type" defaultValue="Savings">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Savings">Savings Account</SelectItem>
                                        <SelectItem value="Checking">Checking Account</SelectItem>
                                        <SelectItem value="Cash">Cash / Wallet</SelectItem>
                                        <SelectItem value="Investment">Investment</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="balance">Initial Balance</Label>
                                <Input id="balance" name="balance" type="number" step="0.01" placeholder="0.00" />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label>Mark as Savings</Label>
                                    <p className="text-xs text-muted-foreground">Include in total savings calculation</p>
                                </div>
                                <Switch name="isSavings" value="true" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="targetAmount">Target Amount (Optional)</Label>
                                <Input id="targetAmount" name="targetAmount" type="number" step="0.01" placeholder="0.00" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="growthRate">Annual Return (%) (Optional)</Label>
                                <Input id="growthRate" name="growthRate" type="number" step="0.01" placeholder="e.g. 4.0" />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button type="submit" className="flex-1" disabled={loading}>
                                    {loading ? "Adding..." : "Add Account"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Account</DialogTitle>
                            <DialogDescription>
                                Update account details
                            </DialogDescription>
                        </DialogHeader>
                        {selectedAccount && (
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name">Name</Label>
                                    <Input id="edit-name" name="name" defaultValue={selectedAccount.name} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-type">Type</Label>
                                    <Select name="type" defaultValue={selectedAccount.type}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Savings">Savings Account</SelectItem>
                                            <SelectItem value="Checking">Checking Account</SelectItem>
                                            <SelectItem value="Cash">Cash / Wallet</SelectItem>
                                            <SelectItem value="Investment">Investment</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-balance">Current Balance</Label>
                                    <Input id="edit-balance" name="balance" type="number" step="0.01" defaultValue={selectedAccount.balance} />
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <Label>Mark as Savings</Label>
                                        <p className="text-xs text-muted-foreground">Include in total savings calculation</p>
                                    </div>
                                    <Switch name="isSavings" value="true" defaultChecked={selectedAccount.isSavings} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-targetAmount">Target Amount (Optional)</Label>
                                    <Input id="edit-targetAmount" name="targetAmount" type="number" step="0.01" defaultValue={selectedAccount.targetAmount ?? ""} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-growthRate">Annual Return (%) (Optional)</Label>
                                    <Input id="edit-growthRate" name="growthRate" type="number" step="0.01" defaultValue={selectedAccount.growthRate ?? ""} />
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="flex-1" disabled={loading}>
                                        {loading ? "Updating..." : "Update Account"}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Total Balance Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                        <Landmark className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
                        <p className="text-xs text-muted-foreground">
                            Across {accounts.length} accounts
                        </p>
                    </CardContent>
                </Card>

                {/* Total Savings Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
                        <PiggyBank className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalSavings)}</div>
                        <p className="text-xs text-muted-foreground">
                            {savingsAccounts.length} savings accounts
                        </p>
                    </CardContent>
                </Card>

                {/* Growth Chart */}
                <Card className="col-span-full lg:col-span-1">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">1-Year Projection</CardTitle>
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[60px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={projectionData}>
                                    <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground text-center">
                            Based on savings accounts only
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {accounts.map((account) => {
                    const progress = account.targetAmount ? (Number(account.balance) / Number(account.targetAmount)) * 100 : 0;
                    return (
                        <Card key={account.id} className="group relative overflow-hidden">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {getAccountIcon(account.type)}
                                        <CardTitle className="text-base font-medium">{account.name}</CardTitle>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                            onClick={() => {
                                                setSelectedAccount(account);
                                                setEditOpen(true);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDelete(account.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold mb-2">{formatCurrency(Number(account.balance))}</div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs text-muted-foreground capitalize">{account.type}</span>
                                    {account.isSavings && (
                                        <span className="text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded">Savings</span>
                                    )}
                                </div>
                                {account.targetAmount && account.isSavings && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Target: {formatCurrency(Number(account.targetAmount))}</span>
                                            <span>{progress.toFixed(0)}%</span>
                                        </div>
                                        <Progress value={progress} className="h-2" />
                                    </div>
                                )}
                                {account.growthRate && account.isSavings && (
                                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                                        <span>{Number(account.growthRate)}% APY</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
