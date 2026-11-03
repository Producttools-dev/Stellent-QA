import { Suspense } from "react";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Create account — Stellent QA" };

export default function SignupPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="flex items-center justify-center gap-2 font-semibold">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
            Q
          </span>
          Stellent QA
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Create your account</CardTitle>
            <CardDescription>Start monitoring your sites in minutes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={null}>
              <AuthForm mode="signup" />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
