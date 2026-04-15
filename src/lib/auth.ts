import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

class InvalidCredentials extends CredentialsSignin {
  code = "credentials";
}

class AccountInactive extends CredentialsSignin {
  code = "account_inactive";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new InvalidCredentials();
        }

        const account = await prisma.account.findUnique({
          where: { username: credentials.username as string },
          include: { practitioner: true },
        });

        if (!account) throw new InvalidCredentials();

        if (!account.isActive) throw new AccountInactive();

        const isValid = await bcrypt.compare(
          credentials.password as string,
          account.password
        );

        if (!isValid) throw new InvalidCredentials();

        return {
          id: account.id,
          username: account.username,
          role: account.role,
          name: account.practitioner?.name ?? account.username,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).username = token.username;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});