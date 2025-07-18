import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl",
            socialButtonsBlockButton: "w-full",
            socialButtonsBlockButtonText: "font-medium",
          },
        }}
        redirectUrl="/onboarding"
        afterSignUpUrl="/onboarding"
      />
    </div>
  );
}
