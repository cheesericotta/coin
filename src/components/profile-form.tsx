"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateUserProfile } from "@/actions/user";
import { useRouter } from "next/navigation";

interface ProfileFormProps {
    user: {
        id: string;
        name: string | null;
        email: string;
    };
}

export function ProfileForm({ user }: ProfileFormProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await updateUserProfile(formData);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Profile updated successfully!");
            router.refresh();
        }
        setLoading(false);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                    <Input
                        id="name"
                        name="name"
                        defaultValue={user.name || ""}
                        placeholder="Your name"
                        className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-emerald-500"
                        required
                    />
                </div>
                <div className="space-y-2 opacity-60">
                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label>
                    <Input
                        value={user.email}
                        disabled
                        className="bg-slate-100 dark:bg-slate-950 cursor-not-allowed border-slate-200 dark:border-slate-800"
                    />
                    <p className="text-[10px] text-muted-foreground italic">Email address cannot be changed in this version.</p>
                </div>
            </div>
            <div className="flex justify-end pt-4">
                <Button
                    type="submit"
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8"
                >
                    {loading ? "Saving Changes..." : "Save Changes"}
                </Button>
            </div>
        </form>
    );
}
