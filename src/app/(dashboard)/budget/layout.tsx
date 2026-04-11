import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Budget",
  description: "Planlæg og følg dit månedlige budget.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
