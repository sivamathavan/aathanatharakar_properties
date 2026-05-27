import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const failedAttempts = new Map<string, { count: number; lockUntil: number }>();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login", // Error code passed in query string as ?error=
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
        const { code } = credentials;

        // Check lock status
        const attempts = failedAttempts.get(email);
        if (attempts && attempts.count >= 5 && Date.now() < attempts.lockUntil) {
          throw new Error("Too many failed attempts. Account temporarily locked out.");
        }

        // Find token
        const tokenRecord = await prisma.verificationToken.findFirst({
          where: { identifier: email, token: code },
        });

        if (!tokenRecord) {
          // Increment failed attempts
          const count = (attempts?.count || 0) + 1;
          const lockUntil = count >= 5 ? Date.now() + 15 * 60 * 1000 : 0;
          failedAttempts.set(email, { count, lockUntil });
          throw new Error("Invalid or expired code");
        }

        if (tokenRecord.expires < new Date()) {
          throw new Error("Code has expired");
        }

        // Delete token after successful use
        await prisma.verificationToken.delete({
          where: { identifier_token: { identifier: email, token: code } },
        });

        // Find user
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new Error("No account found with this email");
        }

        // Clear failed attempts
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

        // Check lock status
        const attempts = failedAttempts.get(email);
        if (attempts && attempts.count >= 5 && Date.now() < attempts.lockUntil) {
          throw new Error("Too many failed attempts. Account temporarily locked out.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || user.role !== UserRole.ADMIN || !user.password) {
          // Increment failed attempts
          const count = (attempts?.count || 0) + 1;
          const lockUntil = count >= 5 ? Date.now() + 15 * 60 * 1000 : 0;
          failedAttempts.set(email, { count, lockUntil });
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          // Increment failed attempts
          const count = (attempts?.count || 0) + 1;
          const lockUntil = count >= 5 ? Date.now() + 15 * 60 * 1000 : 0;
          failedAttempts.set(email, { count, lockUntil });
          throw new Error("Invalid credentials");
        }

        // Successful login, clear failed attempts
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
