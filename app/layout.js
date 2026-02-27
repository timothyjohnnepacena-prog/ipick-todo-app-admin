"use client";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

// Metadata cannot be exported from a Client Component file if using 'use client'
// However, we can use a plain <title> tag in the head for immediate results
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>iPick Admin | Management Portal</title>
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