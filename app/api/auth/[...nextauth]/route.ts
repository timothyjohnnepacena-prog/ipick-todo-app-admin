import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    return null;
                }

                const username = String(credentials.username).trim();
                const password = String(credentials.password);

                if (username.length < 3 || password.length < 1) {
                    return null;
                }

                const client = await clientPromise;
                const db = client.db("kanban_db");

                const user = await db.collection("users").findOne({
                    username: username,
                });

                if (user && user.isAdmin === true) {
                    const isPasswordCorrect = await bcrypt.compare(
                        password,
                        user.password as string
                    );

                    if (isPasswordCorrect) {
                        return {
                            id: user._id.toString(),
                            name: user.name as string,
                            email: user.email as string,
                            username: user.username as string,
                            isAdmin: user.isAdmin as boolean,
                        };
                    }
                }

                return null;
            },
        }),
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
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60,
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
