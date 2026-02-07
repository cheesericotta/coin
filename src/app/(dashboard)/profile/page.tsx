import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserProfile } from "@/actions/user";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Calendar, Camera, ShieldCheck, BadgeCheck } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    const user = await getUserProfile();
    if (!user) {
        redirect("/login");
    }

    const initials = user.name
        ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
        : "U";

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <User className="h-4 w-4" />
                    <h1 className="text-lg font-semibold">Profile</h1>
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
                <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-bold tracking-tight">Account Settings</h2>
                    <p className="text-muted-foreground text-lg">
                        Manage your profile information and account preferences.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Sidebar / Info Card */}
                    <Card className="md:col-span-1 h-fit bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                        <CardHeader className="flex flex-col items-center gap-4">
                            <div className="relative group">
                                <Avatar className="h-24 w-24 border-4 border-white dark:border-slate-800 shadow-xl">
                                    <AvatarImage src={user.image || undefined} />
                                    <AvatarFallback className="text-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <Camera className="text-white h-6 w-6" />
                                </div>
                            </div>
                            <div className="text-center space-y-1">
                                <CardTitle className="text-xl font-bold">{user.name}</CardTitle>
                                <CardDescription className="text-sm font-medium">{user.email}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-2">
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Verified Account</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Main Form */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold">Personal Information</CardTitle>
                                <CardDescription>
                                    Update your name and how you appear on the platform.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ProfileForm user={user} />
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold">Email Address</CardTitle>
                                <CardDescription>
                                    Your email address is used for secure login and notifications.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                    <div className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm">
                                        <Mail className="h-5 w-5 text-indigo-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Primary Email</p>
                                        <p className="font-semibold text-lg">{user.email}</p>
                                    </div>
                                    <BadgeCheck className="h-5 w-5 text-emerald-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
