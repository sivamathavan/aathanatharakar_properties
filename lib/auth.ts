import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { AccountStatus, UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { createHash } from "crypto";

// Lockout state. In-memory; on serverless this is per-instance only.
// Treat as a best-effort defence; primary brute-force protection should
// come from the rate-limited send-otp endpoint and (eventually) Upstash.
const failedAttempts = new Map<string, { count: number; lockUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000;

function recordFail(key: string) {
  const cur = failedAttempts.get(key);
  const count = (cur?.count || 0) + 1;
  const lockUntil = count >= MAX_ATTEMPTS ? Date.now() + LOCK_WINDOW_MS : 0;
  failedAttempts.set(key, { count, lockUntil });
}

function isLocked(key: string) {
  const attempts = failedAttempts.get(key);
  return !!(
    attempts &&
    attempts.count >= MAX_ATTEMPTS &&
    Date.now() < attempts.lockUntil
  );
}

export function hashOtp(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "otp",
      name: "OTP Login",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.code) {
          throw new Error("Missing email or code");
        }

        const email = credentials.email.toLowerCase().trim();
        const code = String(credentials.code).trim();

        if (!/^[0-9]{6}$/.test(code)) {
          throw new Error("Invalid code format");
        }

        if (isLocked(email)) {
          throw new Error(
            "Too many failed attempts. Try again in 15 minutes."
          );
        }

        const codeHash = hashOtp(code);

        // Look up by identifier + hashed token
        const tokenRecord = await prisma.verificationToken.findFirst({
          where: { identifier: email, token: codeHash },
        });

        if (!tokenRecord) {
          recordFail(email);
          throw new Error("Invalid or expired code");
        }

        if (tokenRecord.expires < new Date()) {
          await prisma.verificationToken
            .deleteMany({ where: { identifier: email, token: codeHash } })
            .catch(() => {});
          throw new Error("Code has expired. Please request a new one.");
        }

        // Single-use token
        await prisma.verificationToken
          .deleteMany({ where: { identifier: email, token: codeHash } })
          .catch(() => {});

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          throw new Error("No account found with this email");
        }

        if (
          user.accountStatus === AccountStatus.SUSPENDED ||
          user.accountStatus === AccountStatus.REJECTED
        ) {
          throw new Error(
            "Your account is not active. Please contact support."
          );
        }

        failedAttempts.delete(email);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const email = credentials.email.toLowerCase().trim();

        if (isLocked(email)) {
          throw new Error(
            "Too many failed attempts. Try again in 15 minutes."
          );
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || user.role !== UserRole.ADMIN || !user.password) {
          recordFail(email);
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          recordFail(email);
          throw new Error("Invalid credentials");
        }

        failedAttempts.delete(email);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || UserRole.PROPERTY_LISTER;
      }
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
};
