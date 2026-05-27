import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";

const failedAttempts = new Map<string, { count: number; lockUntil: number }>();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours for admin
  },
  pages: {
    signIn: "/login",
    error: "/login", // Error code passed in query string as ?error=
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
      from: process.env.SMTP_USER,
      async sendVerificationRequest({ identifier, url, provider }) {
        if (process.env.NODE_ENV !== 'production' || process.env.SMTP_USER === 'yourgmail@gmail.com') {
          console.log(`\n======================================================`);
          console.log(`Login link for ${identifier}:`);
          console.log(`${url}`);
          console.log(`======================================================\n`);
          return;
        }
        
        const { createTransport } = require("nodemailer")
        const transport = createTransport(provider.server)
        const result = await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: `Sign in to Aadana Tharakar`,
          text: `Sign in here: ${url}`,
          html: `<p>Click <a href="${url}">here</a> to sign in.</p>`,
        })
        const failed = result.rejected.concat(result.pending).filter(Boolean)
        if (failed.length) {
          throw new Error(`Email(s) (${failed.join(", ")}) could not be sent`)
        }
      }
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
