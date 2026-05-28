"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Enter your admin email and password");
      return;
    }
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        toast.error(res.error || "Invalid credentials");
      } else {
        toast.success("Welcome back, Admin");
        router.push("/admin");
        router.refresh();
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-cream p-4">
      <Card className="w-full max-w-md border-[#E8E0D0] bg-white shadow-sm font-sans">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-3xl font-display font-bold tracking-tight text-navy-900">
            ஆதனத் தரகர்
          </CardTitle>
          <CardDescription className="flex items-center justify-center gap-1.5 text-navy-700">
            <ShieldCheck className="w-3.5 h-3.5 text-gold-600" /> Admin Portal Login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold text-navy-800 uppercase tracking-wider">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@aadanatharakar.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11 border-[#E8E0D0] rounded-btn"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold text-navy-800 uppercase tracking-wider">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-11 border-[#E8E0D0] rounded-btn"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-navy-900 text-gold-500 hover:bg-navy-950 hover:text-gold-400 font-bold rounded-btn disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Signing in...
                </>
              ) : (
                "Sign in to Admin"
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground mt-4">
            <Link href="/" className="hover:underline underline-offset-4">
              Return to Website
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
