import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transaktioner",
  description: "Søg og kategoriser transaktioner.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
