import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAuthUrl } from "@/lib/square";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default async function LoginPage() {
  // 1. Auto-Redirect if already logged in
  const cookieStore = await cookies();
  const session = cookieStore.get("session_merchant_id");

  if (session?.value) {
    redirect("/dashboard");
  }

  // 2. Get the consistent Auth URL
  const authUrl = getAuthUrl();

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center gap-2">
        <Sparkles className="h-8 w-8 text-[#906CDD]" />
        <h1 className="text-3xl font-bold text-white tracking-tight">neucler</h1>
      </div>

      <Card className="w-full max-w-md bg-white/5 border-white/10 text-white backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription className="text-gray-400">
            Connect your Square POS to access AI insights & tools.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            asChild
            className="w-full h-12 text-lg font-medium bg-white text-black hover:bg-gray-200 transition-all"
          >
            <a href={authUrl}>
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.5 3h-15C3.12 3 2 4.12 2 5.5v13C2 19.88 3.12 21 4.5 21h15c1.38 0 2.5-1.12 2.5-2.5v-13C22 4.12 20.88 3 19.5 3zM10 16H8v-4h2v4zm6 0h-2v-4h2v4zm-3-6H8V8h5v2z" />
              </svg>
              Log in with Square
            </a>
          </Button>
          <p className="mt-4 text-xs text-center text-gray-500">
            By connecting, you agree to our Terms of Service.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}