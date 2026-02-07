import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppSidebar } from "@/components/app-sidebar";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    return (
        <SidebarProvider>
            <AppSidebar
                user={{
                    name: session.user.name || "User",
                    email: session.user.email || "",
                    avatar: session.user.image || undefined,
                }}
            />
            <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
    );
}
