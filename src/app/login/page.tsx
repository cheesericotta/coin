import { Wallet } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="/" className="flex items-center gap-2 self-center font-medium text-white">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex size-8 items-center justify-center rounded-lg">
            <Wallet className="size-5" />
          </div>
          <span className="text-xl font-semibold">Coin Tracker</span>
        </a>
        <LoginForm />
      </div>
    </div>
  );
}
