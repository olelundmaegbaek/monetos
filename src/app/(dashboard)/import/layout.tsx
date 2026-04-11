import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Importér",
  description: "Importér kontoudtog fra CSV.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
