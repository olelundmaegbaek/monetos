import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pension",
  description: "Pensionsoptimering og skattefordel.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
