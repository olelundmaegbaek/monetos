import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overblik",
  description: "Samlet økonomisk overblik.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
