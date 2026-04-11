import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Om",
  description: "Om Monetos og privatlivsmodellen.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
