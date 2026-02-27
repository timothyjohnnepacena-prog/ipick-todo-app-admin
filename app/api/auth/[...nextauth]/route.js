import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const client = await clientPromise;
        const db = client.db("kanban_db");

        const user = await db.collection("users").findOne({ 
          username: credentials.username 
        });

        if (user && user.isAdmin === true) {
          const isPasswordCorrect = await bcrypt.compare(
            credentials.password, 
            user.password
          );

          if (isPasswordCorrect) {
            return { 
              id: user._id.toString(), 
              name: user.name, 
              email: user.email, 
              username: user.username,
              isAdmin: user.isAdmin
            };
          }
        }
        
        return null;
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.username = token.username;
        session.user.id = token.id;
        session.user.isAdmin = token.isAdmin;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username;
        token.id = user.id;
        token.isAdmin = user.isAdmin;
      }
      return token;
    }
  },
  pages: {
    signIn: '/login', 
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };