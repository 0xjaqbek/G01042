import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "PIN",
      credentials: {
        name: { label: "Imię i nazwisko", type: "text" },
        pin: { label: "PIN", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.name || !credentials?.pin) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.name, credentials.name as string))
          .limit(1);

        if (!user || !user.isActive) return null;

        const pinValid = await compare(
          credentials.pin as string,
          user.pin
        );
        if (!pinValid) return null;

        return {
          id: String(user.id),
          name: user.name,
          role: user.role,
          isLeader: user.isLeader,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.isLeader = (user as any).isLeader;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        (session.user as any).role = token.role;
        (session.user as any).isLeader = token.isLeader;
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
