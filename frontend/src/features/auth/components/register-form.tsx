"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { authApi } from "@/features/auth/api/auth-api";
import { useAuthStore } from "@/store/useAuthStore";
import { ApiError } from "@/lib/api-client";
import { registerSchema, RegisterFormData } from "@/lib/schemas/auth.schema";
import { getPostAuthPath } from "@/lib/auth-routing";
import { Layers, Loader2 } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const { user, setUser, isAuthenticated, isLoading } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user is already authenticated, redirect intelligently based on setup state
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(getPostAuthPath(user));
    }
  }, [isAuthenticated, isLoading, user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      const response = await authApi.register(data);
      setUser(response.user);
      toast.success("Account created", {
        description: response.user.email,
      });
      // Replace history entry and route according to user's onboarding state
      router.replace(getPostAuthPath(response.user));
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)]">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--text-3)]" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] p-6">
      {/* Header */}
      <div className="mb-5 flex flex-col items-center text-center">
        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)]">
          <Layers className="h-4 w-4 text-[var(--text-3)]" strokeWidth={1.5} />
        </div>
        <h1 className="text-[14px] font-medium text-[var(--text)]">
          Create an account
        </h1>
        <p className="mt-0.5 text-[12px] text-[var(--text-3)]">
          Issue tracking with keyboard-first speed
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <div>
          <label className="block text-[12px] font-medium text-[var(--text-3)] mb-1">
            Full name
          </label>
          <input
            {...register("name")}
            type="text"
            placeholder="Jane Doe"
            disabled={isSubmitting}
            className="h-8 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2.5 text-[13px] text-[var(--text)] placeholder:text-[var(--text-4)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors duration-100 ease-out disabled:opacity-50"
          />
          {errors.name && (
            <p className="mt-1 text-[12px] text-[var(--danger)]">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[12px] font-medium text-[var(--text-3)] mb-1">
            Work email
          </label>
          <input
            {...register("email")}
            type="email"
            placeholder="name@company.com"
            disabled={isSubmitting}
            className="h-8 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2.5 text-[13px] text-[var(--text)] placeholder:text-[var(--text-4)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors duration-100 ease-out disabled:opacity-50"
          />
          {errors.email && (
            <p className="mt-1 text-[12px] text-[var(--danger)]">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[12px] font-medium text-[var(--text-3)] mb-1">
            Password (min 8 characters)
          </label>
          <input
            {...register("password")}
            type="password"
            placeholder="••••••••"
            disabled={isSubmitting}
            className="h-8 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2.5 text-[13px] text-[var(--text)] placeholder:text-[var(--text-4)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors duration-100 ease-out disabled:opacity-50"
          />
          {errors.password && (
            <p className="mt-1 text-[12px] text-[var(--danger)]">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 flex h-8 w-full items-center justify-center rounded-[var(--radius)] bg-[var(--accent)] text-[13px] font-medium text-[var(--text)] transition-colors duration-100 ease-out hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin text-[var(--text)]" strokeWidth={1.5} />
          ) : (
            "Create account"
          )}
        </button>
      </form>

      {/* Footer Link */}
      <div className="mt-5 text-center text-[12px] text-[var(--text-4)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[var(--text-3)] hover:text-[var(--text)] transition-colors duration-100 ease-out"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
