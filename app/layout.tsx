"use client";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <title>iPick To Do Admin</title>
                <meta name="description" content="Admin dashboard for iPick Todo App" />
                <link rel="icon" href="/icon.png" />
            </head>
            <body>
                <SessionProvider>
                    {children}
                </SessionProvider>
            </body>
        </html>
    );
}
