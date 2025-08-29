import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: "phone-otp",
      name: "Phone OTP",
      credentials: {
        phone: { label: "Phone", type: "text" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        console.log(credentials);
        if (!credentials?.phone || !credentials?.otp) {
          return null;
        }
        const formattedPhone = `+91${credentials.phone}`;
        // Verify the OTP with the database
        const otpRecord = await prisma.otp.findFirst({
          where: {
            phone: formattedPhone,
            otpHash: credentials.otp, // In production, compare with hashed OTP
            expiresAt: {
              gt: new Date(),
            },
            verifiedAt: null, // Not already verified
          },
          orderBy: {
            createdAt: "desc",
          },
        });
        console.log("OTP Record:", otpRecord);
        if (!otpRecord) {
          return null;
        }

        // Mark OTP as verified
        await prisma.otp.update({
          where: { id: otpRecord.id },
          data: { verifiedAt: new Date() },
        });

        // Find or create user
        let user = await prisma.user.findUnique({
          where: { phone: credentials.phone },
        });

        if (!user) {
          user = await prisma.user.create({
            data: { phone: credentials.phone },
          });
        }

        return {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.phone = token.phone as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
