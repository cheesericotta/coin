"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Folder, Plus, Trash2, Tag, Pencil } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { createCategory, deleteCategory, updateCategory } from "@/actions/categories";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface CategoriesSettingsProps {
    categories: {
        id: string;
        name: string;
        icon?: string | null;
        color?: string | null;
        isDefault?: boolean;
    }[];
}

export function CategoriesSettings({ categories }: CategoriesSettingsProps) {
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<CategoriesSettingsProps["categories"][0] | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await createCategory(formData);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Category added");
            setOpen(false);
            router.refresh();
        }
        setLoading(false);
    }

    async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!selectedCategory) return;
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await updateCategory(selectedCategory.id, formData);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Category updated");
            setEditOpen(false);
            setSelectedCategory(null);
            router.refresh();
        }
        setLoading(false);
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this category?")) return;
        const result = await deleteCategory(id);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Category deleted");
            router.refresh();
        }
    }

    // Predefined colors for categories
    const colors = [
        "#ef4444", // red
        "#f97316", // orange
        "#f59e0b", // amber
        "#84cc16", // lime
        "#10b981", // emerald
        "#06b6d4", // cyan
        "#3b82f6", // blue
        "#6366f1", // indigo
        "#8b5cf6", // violet
        "#d946ef", // fuchsia
        "#ec4899", // pink
        "#6b7280", // gray
    ];

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
                    <Folder className="h-4 w-4" />
                    <h1 className="text-lg font-semibold">Categories</h1>
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
                        <p className="text-muted-foreground">
                            Manage your spending categories
                        </p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Category
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Category</DialogTitle>
                                <DialogDescription>
                                    Create a new category for your transactions
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="e.g., Groceries, Transport"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Color</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {colors.map((color) => (
                                            <label
                                                key={color}
                                                className="cursor-pointer relative flex items-center justify-center p-0.5 rounded-full border-2 border-transparent hover:border-gray-400 has-[:checked]:border-black dark:has-[:checked]:border-white"
                                            >
                                                <input
                                                    type="radio"
                                                    name="color"
                                                    value={color}
                                                    className="sr-only"
                                                    defaultChecked={color === colors[0]}
                                                />
                                                <span
                                                    className="w-6 h-6 rounded-full"
                                                    style={{ backgroundColor: color }}
                                                />
                                            </label>
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
                                        {loading ? "Adding..." : "Add Category"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Edit Dialog */}
                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Category</DialogTitle>
                                <DialogDescription>
                                    Update category details
                                </DialogDescription>
                            </DialogHeader>
                            {selectedCategory && (
                                <form onSubmit={handleEditSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-name">Name</Label>
                                        <Input
                                            id="edit-name"
                                            name="name"
                                            defaultValue={selectedCategory.name}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Color</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {colors.map((color) => (
                                                <label
                                                    key={color}
                                                    className="cursor-pointer relative flex items-center justify-center p-0.5 rounded-full border-2 border-transparent hover:border-gray-400 has-[:checked]:border-black dark:has-[:checked]:border-white"
                                                >
                                                    <input
                                                        type="radio"
                                                        name="color"
                                                        value={color}
                                                        className="sr-only"
                                                        defaultChecked={color === (selectedCategory.color || colors[0])}
                                                    />
                                                    <span
                                                        className="w-6 h-6 rounded-full"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                </label>
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
                                            {loading ? "Updating..." : "Update Category"}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                        <Card key={category.id} className="group relative">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: category.color || "#6b7280" }}
                                    />
                                    {category.name}
                                </CardTitle>
                                <Tag className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between mt-2">
                                    {category.isDefault && (
                                        <Badge variant="secondary">Default</Badge>
                                    )}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                            onClick={() => {
                                                setSelectedCategory(category);
                                                setEditOpen(true);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDelete(category.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {categories.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <Folder className="h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-4 text-lg font-medium">No categories found</p>
                            <p className="text-muted-foreground">
                                Add your first category to start organizing expenses
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
