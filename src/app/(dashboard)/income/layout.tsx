import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Indkomst",
  description: "Oversigt over dine indtægter.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
