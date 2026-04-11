import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil",
  description: "Husstandsindstillinger.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
