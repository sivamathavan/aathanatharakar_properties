import { BRAND } from "@/lib/brand";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Admin login" };

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm title={BRAND.name} subtitle="Admin sign in" showSignup={false} />
    </Suspense>
  );
}
