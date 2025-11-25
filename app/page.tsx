import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  // Define Scopes: What data do we want?
  const scopes = [
    "MERCHANT_PROFILE_READ",
    "CUSTOMERS_READ",
    "CUSTOMERS_WRITE",
    "ORDERS_READ"
  ].join(" ");

  const isSandbox = process.env.SQUARE_ENVIRONMENT === "sandbox";
  const baseUrl = isSandbox
    ? "https://connect.squareupsandbox.com"
    : "https://connect.squareup.com";

  // --- NEW: Define the Redirect URI dynamically ---
  // This ensures it works on localhost OR your production domain automatically
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/square/callback`;

  // --- ADDED: &redirect_uri=${redirectUri} ---
  const authUrl = `${baseUrl}/oauth2/authorize?client_id=${process.env.SQUARE_APP_ID}&scope=${scopes}&session=false&redirect_uri=${redirectUri}`;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen space-y-6">
      <h1 className="text-4xl font-bold">neucler dashboard</h1>
      <p className="text-muted-foreground">Connect your Square POS to get started.</p>

      <Link href={authUrl}>
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
          Connect Square Account
        </Button>
      </Link>
    </main>
  );
}