import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skat",
  description: "Dansk skatteberegning og optimering.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
