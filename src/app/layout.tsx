import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import { DataProvider } from "./contexts/DataContext";
import { ToastContainer } from "react-toastify";

export const metadata: Metadata = {
  title: "Tags vault",
  description: "A simple tags vault",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <DataProvider>
          <main>
            {children}{" "}
            <ToastContainer position="bottom-right" autoClose={3000} />
          </main>
        </DataProvider>
      </body>
    </html>
  );
}
