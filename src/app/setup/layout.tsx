import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Opsætning",
  description: "Konfigurer din husstand og lås pengeskabet op.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
