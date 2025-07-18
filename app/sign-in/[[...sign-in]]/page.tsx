import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SignInPage() {
  const { userId } = await auth();

  if (userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">You&apos;re already signed in!</h2>
          <p className="text-gray-600 mb-6">
            You can go to your dashboard or sign out to use a different account.
          </p>
          <div className="space-y-4">
            <Link 
              href="/dashboard"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link 
              href="/sign-out"
              className="block w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl",
            socialButtonsBlockButton: "w-full",
            socialButtonsBlockButtonText: "font-medium",
          },
        }}
        redirectUrl="/dashboard"
        afterSignInUrl="/dashboard"
      />
    </div>
  );
}
