import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Indstillinger",
  description: "Appindstillinger og AI-nøgle.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
