import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { AccountStatus, UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { createHash } from "crypto";

const MAX_ATTEMPTS = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000;

async function recordFail(key: string) {
  const now = new Date();
  const resetAt = new Date(now.getTime() + LOCK_WINDOW_MS);
  await prisma.rateLimit.upsert({
    where: { key: `fail:${key}` },
    create: { key: `fail:${key}`, count: 1, resetAt },
    update: { count: { increment: 1 }, resetAt },
  }).catch(() => {});
}

async function isLocked(key: string) {
  try {
    const bucket = await prisma.rateLimit.findUnique({
      where: { key: `fail:${key}` }
    });
    if (!bucket) return false;
    if (bucket.resetAt < new Date()) {
      await prisma.rateLimit.delete({ where: { key: `fail:${key}` } }).catch(() => {});
      return false;
    }
    return bucket.count >= MAX_ATTEMPTS;
  } catch (err) {
    return false; // Fail open to avoid blocking valid traffic if DB goes down
  }
}

async function clearFail(key: string) {
  await prisma.rateLimit.delete({ where: { key: `fail:${key}` } }).catch(() => {});
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

        if (await isLocked(email)) {
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
          await recordFail(email);
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

        await clearFail(email);

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

        if (await isLocked(email)) {
          throw new Error(
            "Too many failed attempts. Try again in 15 minutes."
          );
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || user.role !== UserRole.ADMIN || !user.password) {
          await recordFail(email);
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          await recordFail(email);
          throw new Error("Invalid credentials");
        }

        await clearFail(email);

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
        token.lastChecked = Date.now();
      }

      const now = Date.now();
      if (token.id && (!token.lastChecked || (now - (token.lastChecked as number) > 5 * 60 * 1000))) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } });
        if (!dbUser || dbUser.accountStatus === AccountStatus.SUSPENDED || dbUser.accountStatus === AccountStatus.REJECTED) {
          throw new Error("Account is no longer active"); // NextAuth will handle the error
        }
        token.role = dbUser.role; // Dynamically update role
        token.lastChecked = now;
      }

      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }
      return token;
    },
    async session({ session, token }) {
      if (token && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      } else {
        // If token is invalidated (e.g. suspended user), clear the session user
        (session as any).user = null;
      }
      return session;
    },
  },
};
