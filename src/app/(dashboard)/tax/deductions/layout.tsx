import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fradrag",
  description: "Skattefradrag og befordring.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
