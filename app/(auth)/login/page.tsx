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
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        toast.success("Code sent to your email!");
        setStep("otp");
      } else {
        const error = await res.text();
        toast.error(error || "Failed to send code");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      const res = await signIn("otp", {
        email,
        code: otp,
        redirect: false,
      });

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Successfully logged in!");
        router.push("/dashboard");
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
          <CardDescription className="font-sans">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-navy-800 uppercase tracking-wider">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 border-[#E8E0D0] focus:ring-1 focus:ring-gold-500 focus:border-gold-500 rounded-btn text-navy-900"
                />
              </div>
              <Button type="submit" className="w-full h-11 bg-navy-900 text-gold-500 hover:bg-navy-950 font-sans font-bold rounded-btn transition-colors" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isLoading ? "Sending..." : "Send Login Code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-xs font-semibold text-navy-800 uppercase tracking-wider">Enter 6-Digit Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} // only numbers
                  required
                  className="h-11 border-[#E8E0D0] focus:ring-1 focus:ring-gold-500 focus:border-gold-500 rounded-btn text-navy-900 text-center tracking-widest text-lg font-bold"
                />
                <p className="text-xs text-navy-600 mt-1">We sent a code to {email}</p>
              </div>
              <Button type="submit" className="w-full h-11 bg-gold-500 text-navy-900 hover:bg-gold-400 font-sans font-bold rounded-btn transition-colors" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isLoading ? "Verifying..." : "Sign In"}
              </Button>
              <div className="text-center mt-2">
                <button type="button" onClick={() => setStep("email")} className="text-xs text-navy-600 hover:text-gold-600 underline">
                  Wrong email or didn't receive code?
                </button>
              </div>
            </form>
          )}

          <div className="text-center text-sm text-muted-foreground mt-4 border-t border-[#E8E0D0]/50 pt-4">
            Don't have an account?{" "}
            <Link href="/register" className="text-gold-700 font-bold hover:underline underline-offset-4">
              Register here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
