import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-3xl font-semibold">404</h1>
        <p className="text-muted-foreground">Siden findes ikke.</p>
        <Link href="/" className="underline underline-offset-4">
          Tilbage til forsiden
        </Link>
      </div>
    </main>
  );
}
