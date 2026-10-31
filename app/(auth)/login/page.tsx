import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Agent login" };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm title="Agent login" subtitle="Manage your listings and enquiries." />
    </Suspense>
  );
}
