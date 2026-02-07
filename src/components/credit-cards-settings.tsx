"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, DollarSign, Plus, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { createCreditCard, deleteCreditCard, updateCreditCard } from "@/actions/credit-cards";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

const colors = [
    "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e",
    "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6",
    "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
];

import { formatCurrency, getCurrentDateInKL } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
    createInstallment,
    deleteInstallment,
    getInstallments,
    payInstallment,
    updateInstallment
} from "@/actions/installments";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, History, Pencil as EditPencil } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

interface CreditCardsSettingsProps {
    creditCards: {
        id: string;
        name: string;
        lastFour: string | null;
        limit: number | null;
        color: string | null;
        balance: number;
    }[];
    installments: {
        id: string;
        name: string;
        totalAmount: number;
        monthlyPayment: number;
        totalMonths: number;
        remainingMonths: number;
        startDate: string;
        creditCardId: string;
        categoryId: string | null;
        category: {
            name: string;
            color: string | null;
        } | null;
        creditCard: {
            name: string;
        };
    }[];
    categories: {
        id: string;
        name: string;
        color: string | null;
    }[];
}

export function CreditCardsSettings({ creditCards, installments, categories }: CreditCardsSettingsProps) {
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [installmentOpen, setInstallmentOpen] = useState(false);
    const [editInstallmentOpen, setEditInstallmentOpen] = useState(false);
    const [selectedCard, setSelectedCard] = useState<CreditCardsSettingsProps["creditCards"][0] | null>(null);
    const [selectedInstallment, setSelectedInstallment] = useState<CreditCardsSettingsProps["installments"][0] | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedColor, setSelectedColor] = useState(colors[4]);
    const [installmentDate, setInstallmentDate] = useState<Date | undefined>(getCurrentDateInKL());
    const [deleteCardOpen, setDeleteCardOpen] = useState(false);
    const [cardToDelete, setCardToDelete] = useState<string | null>(null);
    const [deleteInstOpen, setDeleteInstOpen] = useState(false);
    const [instToDelete, setInstToDelete] = useState<string | null>(null);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.set("color", selectedColor);

        const result = await createCreditCard(formData);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Credit card added");
            setOpen(false);
            router.refresh();
        }
        setLoading(false);
    }

    async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!selectedCard) return;
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.set("color", selectedColor);

        const result = await updateCreditCard(selectedCard.id, formData);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Credit card updated");
            setEditOpen(false);
            setSelectedCard(null);
            router.refresh();
        }
        setLoading(false);
    }

    async function handleDelete(id: string) {
        setCardToDelete(id);
        setDeleteCardOpen(true);
    }

    async function confirmDeleteCard() {
        if (!cardToDelete) return;
        const result = await deleteCreditCard(cardToDelete);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Credit card deleted");
            setDeleteCardOpen(false);
            setCardToDelete(null);
            router.refresh();
        }
    }

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/settings">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <CreditCard className="h-4 w-4" />
                    <h1 className="text-lg font-semibold">Credit Cards</h1>
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Credit Cards</h2>
                        <p className="text-muted-foreground">
                            Manage your payment methods
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Dialog open={open} onOpenChange={(val) => {
                            setOpen(val);
                            if (val) setSelectedColor(colors[4]);
                        }}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Credit Card
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Credit Card</DialogTitle>
                                    <DialogDescription>
                                        Add a new credit card to track your spending
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Card Name</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            placeholder="e.g., Visa Platinum"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="limit">Credit Limit (optional)</Label>
                                        <Input
                                            id="limit"
                                            name="limit"
                                            type="number"
                                            step="0.01"
                                            placeholder="5000.00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastFour">Last 4 Digits (optional)</Label>
                                        <Input
                                            id="lastFour"
                                            name="lastFour"
                                            placeholder="1234"
                                            maxLength={4}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Color</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {colors.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    className={`h-8 w-8 rounded-full transition-transform ${selectedColor === color
                                                        ? "ring-2 ring-offset-2 ring-offset-background scale-110"
                                                        : ""
                                                        }`}
                                                    style={{ backgroundColor: color, ["--tw-ring-color" as string]: color } as React.CSSProperties}
                                                    onClick={() => setSelectedColor(color)}
                                                />
                                            ))}
                                        </div>
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
                                            {loading ? "Adding..." : "Add Card"}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={editOpen} onOpenChange={setEditOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Credit Card</DialogTitle>
                                    <DialogDescription>
                                        Update your credit card details
                                    </DialogDescription>
                                </DialogHeader>
                                {selectedCard && (
                                    <form onSubmit={handleEditSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-name">Card Name</Label>
                                            <Input
                                                id="edit-name"
                                                name="name"
                                                defaultValue={selectedCard.name}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-limit">Credit Limit (optional)</Label>
                                            <Input
                                                id="edit-limit"
                                                name="limit"
                                                type="number"
                                                step="0.01"
                                                defaultValue={selectedCard.limit || ""}
                                                placeholder="5000.00"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-lastFour">Last 4 Digits (optional)</Label>
                                            <Input
                                                id="edit-lastFour"
                                                name="lastFour"
                                                defaultValue={selectedCard.lastFour || ""}
                                                placeholder="1234"
                                                maxLength={4}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Color</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {colors.map((color) => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        className={`h-8 w-8 rounded-full transition-transform ${selectedColor === color
                                                            ? "ring-2 ring-offset-2 ring-offset-background scale-110"
                                                            : ""
                                                            }`}
                                                        style={{ backgroundColor: color, ["--tw-ring-color" as string]: color } as React.CSSProperties}
                                                        onClick={() => setSelectedColor(color)}
                                                    />
                                                ))}
                                            </div>
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
                                                {loading ? "Updating..." : "Update Card"}
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {creditCards.map((card) => {
                        const usagePercent = card.limit ? (card.balance / card.limit) * 100 : 0;
                        const isOverLimit = usagePercent > 100;

                        return (
                            <Card
                                key={card.id}
                                className="relative overflow-hidden group transition-all hover:shadow-md border-l-4"
                                style={{ borderColor: card.color || undefined }}
                            >
                                <div
                                    className="absolute inset-0 opacity-5"
                                    style={{ backgroundColor: card.color || undefined }}
                                />
                                <CardHeader className="relative pb-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <CreditCard
                                                className="h-8 w-8"
                                                style={{ color: card.color || undefined }}
                                            />
                                            <div>
                                                <CardTitle className="text-lg">{card.name}</CardTitle>
                                                {card.lastFour && (
                                                    <CardDescription>•••• {card.lastFour}</CardDescription>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                onClick={() => {
                                                    setSelectedCard(card);
                                                    setSelectedColor(card.color || colors[4]);
                                                    setEditOpen(true);
                                                }}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDelete(card.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="relative space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase font-semibold">Balance</p>
                                            <p className="text-2xl font-bold">{formatCurrency(card.balance)}</p>
                                        </div>
                                        {card.limit && (
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground uppercase font-semibold">Limit</p>
                                                <p className="font-medium text-muted-foreground">{formatCurrency(card.limit)}</p>
                                            </div>
                                        )}
                                    </div>

                                    {card.limit && (
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs">
                                                <span className={isOverLimit ? "text-destructive font-bold" : "text-muted-foreground"}>
                                                    Usage: {usagePercent.toFixed(1)}%
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {formatCurrency(card.limit - card.balance)} available
                                                </span>
                                            </div>
                                            <Progress
                                                value={Math.min(usagePercent, 100)}
                                                className={`h-2 ${isOverLimit ? "[&>div]:bg-destructive" : ""}`}
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="mt-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Installments</h2>
                            <p className="text-muted-foreground">
                                Track fixed-term payments tied to your credit cards
                            </p>
                        </div>
                        <Dialog open={installmentOpen} onOpenChange={setInstallmentOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Installment
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Installment</DialogTitle>
                                    <DialogDescription>
                                        Track a recurring purchase installment
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    setLoading(true);
                                    const formData = new FormData(e.currentTarget);
                                    if (installmentDate) {
                                        formData.set("startDate", installmentDate.toISOString());
                                    }
                                    const result = await createInstallment(formData);
                                    if (result.error) toast.error(result.error);
                                    else {
                                        toast.success("Installment added");
                                        setInstallmentOpen(false);
                                        setInstallmentDate(new Date());
                                        router.refresh();
                                    }
                                    setLoading(false);
                                }} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="inst-name">Item Name</Label>
                                        <Input id="inst-name" name="name" placeholder="e.g., iPhone 15 IPP" required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="inst-total">Total Amount</Label>
                                            <Input id="inst-total" name="totalAmount" type="number" step="0.01" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="inst-monthly">Monthly Payment</Label>
                                            <Input id="inst-monthly" name="monthlyPayment" type="number" step="0.01" required />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="inst-months">Total Months</Label>
                                            <Input id="inst-months" name="totalMonths" type="number" required />
                                        </div>
                                        <div className="space-y-2 flex flex-col">
                                            <Label className="mb-2">Start Date</Label>
                                            <DatePicker date={installmentDate} setDate={setInstallmentDate} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="inst-card">Credit Card</Label>
                                        <Select name="creditCardId" required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a card" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {creditCards.map(card => (
                                                    <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="inst-category">Category</Label>
                                        <Select name="categoryId">
                                            <SelectTrigger id="inst-category">
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map(cat => (
                                                    <SelectItem key={cat.id} value={cat.id}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color || "#6b7280" }} />
                                                            {cat.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex gap-2 pt-4">
                                        <Button type="button" variant="outline" className="flex-1" onClick={() => setInstallmentOpen(false)}>Cancel</Button>
                                        <Button type="submit" className="flex-1" disabled={loading}>{loading ? "Adding..." : "Add Installment"}</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={editInstallmentOpen} onOpenChange={setEditInstallmentOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Installment</DialogTitle>
                                    <DialogDescription>
                                        Update your installment details
                                    </DialogDescription>
                                </DialogHeader>
                                {selectedInstallment && (
                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        setLoading(true);
                                        const formData = new FormData(e.currentTarget);
                                        const result = await updateInstallment(selectedInstallment.id, formData);
                                        if (result.error) toast.error(result.error);
                                        else {
                                            toast.success("Installment updated");
                                            setEditInstallmentOpen(false);
                                            router.refresh();
                                        }
                                        setLoading(false);
                                    }} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-inst-name">Item Name</Label>
                                            <Input id="edit-inst-name" name="name" defaultValue={selectedInstallment.name} required />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-inst-total">Total Amount</Label>
                                                <Input id="edit-inst-total" name="totalAmount" type="number" step="0.01" defaultValue={selectedInstallment.totalAmount} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-inst-monthly">Monthly Payment</Label>
                                                <Input id="edit-inst-monthly" name="monthlyPayment" type="number" step="0.01" defaultValue={selectedInstallment.monthlyPayment} required />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-inst-remaining">Remaining Months</Label>
                                                <Input id="edit-inst-remaining" name="remainingMonths" type="number" defaultValue={selectedInstallment.remainingMonths} required />
                                            </div>
                                            <div className="space-y-2 flex flex-col justify-end">
                                                <Label htmlFor="edit-inst-card" className="mb-2">Credit Card</Label>
                                                <Select name="creditCardId" defaultValue={selectedInstallment.creditCardId}>
                                                    <SelectTrigger id="edit-inst-card">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {creditCards.map(card => (
                                                            <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-inst-category">Category</Label>
                                            <Select name="categoryId" defaultValue={selectedInstallment.categoryId || undefined}>
                                                <SelectTrigger id="edit-inst-category">
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map(cat => (
                                                        <SelectItem key={cat.id} value={cat.id}>
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color || "#6b7280" }} />
                                                                {cat.name}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex gap-2 pt-4">
                                            <Button type="button" variant="outline" className="flex-1" onClick={() => setEditInstallmentOpen(false)}>Cancel</Button>
                                            <Button type="submit" className="flex-1" disabled={loading}>{loading ? "Updating..." : "Update Installment"}</Button>
                                        </div>
                                    </form>
                                )}
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {installments.map((inst) => (
                            <Card key={inst.id} className="group relative">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100">
                                                {inst.creditCard.name}
                                            </Badge>
                                            {inst.category && (
                                                <Badge variant="outline" className="flex items-center gap-1.5">
                                                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: inst.category.color || "#6b7280" }} />
                                                    {inst.category.name}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => {
                                                    setSelectedInstallment(inst);
                                                    setEditInstallmentOpen(true);
                                                }}
                                            >
                                                <EditPencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => {
                                                    setInstToDelete(inst.id);
                                                    setDeleteInstOpen(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <CardTitle className="text-base mt-2">{inst.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase">Monthly</p>
                                            <p className="text-xl font-bold text-emerald-600">{formatCurrency(inst.monthlyPayment)}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            className="h-8 gap-1"
                                            variant="outline"
                                            disabled={loading || inst.remainingMonths <= 0}
                                            onClick={async () => {
                                                setLoading(true);
                                                const result = await payInstallment(inst.id);
                                                if (result.error) toast.error(result.error);
                                                else {
                                                    toast.success("Payment recorded");
                                                    router.refresh();
                                                }
                                                setLoading(false);
                                            }}
                                        >
                                            <DollarSign className="h-3 w-3" />
                                            Pay
                                        </Button>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="text-xs text-muted-foreground uppercase">Remaining</div>
                                        <div className="text-right">
                                            <p className="font-semibold">{inst.remainingMonths} / {inst.totalMonths} months</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Progress value={((inst.totalMonths - inst.remainingMonths) / inst.totalMonths) * 100} className="h-1.5" />
                                        <div className="flex justify-between text-[10px] text-muted-foreground">
                                            <span>Start: {new Date(inst.startDate).toLocaleDateString()}</span>
                                            <span>Total: {formatCurrency(inst.totalAmount)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {installments.length === 0 && (
                        <div className="rounded-lg border border-dashed p-8 text-center">
                            <History className="mx-auto h-8 w-8 text-muted-foreground/50" />
                            <p className="mt-2 text-sm font-medium">No installments tracked</p>
                            <p className="text-xs text-muted-foreground">Add installments to track long-term credit card commitments</p>
                        </div>
                    )}
                </div >

                {
                    creditCards.length === 0 && (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                <CreditCard className="h-12 w-12 text-muted-foreground/50" />
                                <p className="mt-4 text-lg font-medium">No credit cards yet</p>
                                <p className="text-muted-foreground">
                                    Add your first credit card to track spending
                                </p>
                            </CardContent>
                        </Card>
                    )
                }
            </div >
            {/* Delete Card Confirmation */}
            < AlertDialog open={deleteCardOpen} onOpenChange={setDeleteCardOpen} >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Credit Card?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this credit card and all its transaction history. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setCardToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteCard} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog >

            {/* Delete Installment Confirmation */}
            < AlertDialog open={deleteInstOpen} onOpenChange={setDeleteInstOpen} >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Installment?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this installment? This will not delete past transactions.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setInstToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={async () => {
                            if (instToDelete) {
                                await deleteInstallment(instToDelete);
                                setDeleteInstOpen(false);
                                setInstToDelete(null);
                                router.refresh();
                            }
                        }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog >
        </>
    );
}
