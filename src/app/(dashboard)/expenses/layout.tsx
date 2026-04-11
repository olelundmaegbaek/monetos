import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Udgifter",
  description: "Oversigt over dine udgifter og kategorier.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
