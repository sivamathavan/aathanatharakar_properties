import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Admin login | DK Promoters" };

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm title="டிகே புரமோட்டர்ஸ்" subtitle="Admin sign in" showSignup={false} />
    </Suspense>
  );
}
