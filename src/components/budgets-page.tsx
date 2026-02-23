"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, PiggyBank, Plus, Trash2 } from "lucide-react";
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createBudget, deleteBudget, updateBudget } from "@/actions/budgets";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

interface BudgetsPageProps {
    year: number;
    month: number;
    budgets: {
        id: string;
        planned: string | number;
        type: string;
        category: {
            id: string;
            name: string;
            color: string | null;
        };
    }[];
    categories: {
        id: string;
        name: string;
        color: string | null;
    }[];
}

export function BudgetsPage({
    year,
    month,
    budgets,
    categories,
}: BudgetsPageProps) {
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [selectedBudget, setSelectedBudget] = useState<BudgetsPageProps["budgets"][0] | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Get categories that don't have a budget yet
    const budgetedCategoryIds = budgets.map((b) => b.category.id);
    const availableCategories = categories.filter(
        (c) => !budgetedCategoryIds.includes(c.id)
    );

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.set("year", year.toString());
        formData.set("month", month.toString());

        const result = await createBudget(formData);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Budget added");
            setOpen(false);
            router.refresh();
        }
        setLoading(false);
    }

    async function handleDelete(id: string) {
        const result = await deleteBudget(id);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Budget deleted");
            router.refresh();
        }
    }

    async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!selectedBudget) return;
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await updateBudget(selectedBudget.id, formData);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Budget updated");
            setEditOpen(false);
            setSelectedBudget(null);
            router.refresh();
        }
        setLoading(false);
    }

    const totalPlanned = budgets.reduce(
        (sum, b) => sum + Number(b.planned),
        0
    );

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/month/${year}/${month}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <PiggyBank className="h-4 w-4" />
                    <h1 className="text-lg font-semibold">Manage Budgets</h1>
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            {monthNames[month - 1]} {year} Budgets
                        </h2>
                        <p className="text-muted-foreground">
                            Set spending limits for each category
                        </p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button disabled={availableCategories.length === 0}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Budget
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Budget</DialogTitle>
                                <DialogDescription>
                                    Set a spending limit for a category
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="categoryId">Category</Label>
                                    <Select name="categoryId" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableCategories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id}>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="h-3 w-3 rounded-full"
                                                            style={{
                                                                backgroundColor: cat.color || "#6b7280",
                                                            }}
                                                        />
                                                        {cat.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="planned">Planned Amount</Label>
                                    <Input
                                        id="planned"
                                        name="planned"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type</Label>
                                    <Select name="type" defaultValue="variable">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fixed">Fixed</SelectItem>
                                            <SelectItem value="variable">Variable</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="flex-1" disabled={loading}>
                                        {loading ? "Adding..." : "Add Budget"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Budget</DialogTitle>
                                <DialogDescription>
                                    Update the planned amount and type
                                </DialogDescription>
                            </DialogHeader>
                            {selectedBudget && (
                                <form onSubmit={handleEditSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Category</Label>
                                        <Input value={selectedBudget.category.name} disabled />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-planned">Planned Amount</Label>
                                        <Input
                                            id="edit-planned"
                                            name="planned"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            defaultValue={Number(selectedBudget.planned)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-type">Type</Label>
                                        <Select name="type" defaultValue={selectedBudget.type}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="fixed">Fixed</SelectItem>
                                                <SelectItem value="variable">Variable</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex gap-2 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => setEditOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" className="flex-1" disabled={loading}>
                                            {loading ? "Updating..." : "Update Budget"}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Summary */}
                <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Aggregate Monthly Budget
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(totalPlanned)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Set for {budgets.length} spending categories</p>
                    </CardContent>
                </Card>

                {/* Budgets Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Budget Items</CardTitle>
                        <CardDescription>
                            {budgets.length} of {categories.length} categories budgeted
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {budgets.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Planned</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {budgets.map((budget) => (
                                        <TableRow key={budget.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="h-3 w-3 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                budget.category.color || "#6b7280",
                                                        }}
                                                    />
                                                    <span className="font-medium">
                                                        {budget.category.name}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{budget.type}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(Number(budget.planned))}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-muted-foreground hover:text-primary"
                                                        onClick={() => {
                                                            setSelectedBudget(budget);
                                                            setEditOpen(true);
                                                        }}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-muted-foreground hover:text-destructive"
                                                        onClick={() => handleDelete(budget.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <PiggyBank className="h-12 w-12 text-muted-foreground/50" />
                                <p className="mt-4 text-lg font-medium">No budgets set</p>
                                <p className="text-muted-foreground">
                                    Add budgets to track your spending limits
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
