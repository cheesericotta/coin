 
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import {
    Download,
    Upload,
    Trash2,
    AlertTriangle,
    Loader2,
    FileJson
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { exportUserData, importUserData, clearAllUserData } from "@/actions/data-management";

export function DataManagement() {
    const [loading, setLoading] = useState<string | null>(null);

    const handleExport = async () => {
        setLoading("export");
        try {
            const data = await exportUserData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `coin-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success("Data exported successfully");
        } catch (error) {
            toast.error("Failed to export data");
        } finally {
            setLoading(null);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading("import");
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                const result = await importUserData(json);
                if (result.error) {
                    toast.error(result.error);
                } else {
                    toast.success("Data imported successfully");
                    window.location.reload();
                }
            } catch (error) {
                toast.error("Invalid JSON file");
            } finally {
                setLoading(null);
                e.target.value = "";
            }
        };
        reader.readAsText(file);
    };

    const handleClear = async () => {
        setLoading("clear");
        try {
            const result = await clearAllUserData();
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("All data cleared");
                window.location.reload();
            }
        } catch (error) {
            toast.error("Failed to clear data");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="grid gap-6 md:grid-cols-3">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5 text-blue-500" />
                        Export Data
                    </CardTitle>
                    <CardDescription>
                        Download a backup of all your financial data in JSON format.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="outline"
                        className="w-full border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950"
                        onClick={handleExport}
                        disabled={!!loading}
                    >
                        {loading === "export" ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <FileJson className="mr-2 h-4 w-4" />
                        )}
                        Export to JSON
                    </Button>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-emerald-500" />
                        Import Data
                    </CardTitle>
                    <CardDescription>
                        Restore your data from a previous export. This will overwrite current data.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <label className="cursor-pointer">
                        <div className={`
                            flex items-center justify-center gap-2 w-full h-10 px-4 py-2 
                            text-sm font-medium transition-colors rounded-md border
                            border-emerald-200 hover:bg-emerald-50 
                            dark:border-emerald-800 dark:hover:bg-emerald-950
                            ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                        `}>
                            {loading === "import" ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Upload className="mr-2 h-4 w-4" />
                            )}
                            Select File
                        </div>
                        <input
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={handleImport}
                            disabled={!!loading}
                        />
                    </label>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/20 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                        <Trash2 className="h-5 w-5" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription>
                        Permanently delete all your financial records. This cannot be undone.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="destructive"
                                className="w-full bg-rose-500 hover:bg-rose-600"
                                disabled={!!loading}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Clear All Data
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
                                    <AlertTriangle className="h-5 w-5" />
                                    Extreme Caution
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action will permanently delete all your accounts, transactions,
                                    budgets, loans, and categories. This data cannot be recovered.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleClear}
                                    className="bg-rose-500 hover:bg-rose-600 text-white"
                                >
                                    Yes, Clear All My Data
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
    );
}
