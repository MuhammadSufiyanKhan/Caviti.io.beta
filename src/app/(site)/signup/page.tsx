"use client";

import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";

export default function SignupPage() {
  const router = useRouter();

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free. You only need it to save reports. Analyzing products works without one."
    >
        <AuthForm
          mode="signup"
          onSuccess={() => {
            router.push("/dashboard");
            router.refresh();
          }}
        />
    </AuthShell>
  );
}
