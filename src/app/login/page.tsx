"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include", // Important for cookies
      });

      const data = await response.json();

      if (response.ok && data.user) {
        // Successful login - redirect to dashboard
        console.log("Login successful, redirecting to dashboard...");
        router.replace("/dashboard"); // Use replace instead of push to prevent going back to login
        router.refresh(); // Refresh to update auth state
      } else {
        // Handle specific error messages
        const errorMessage = data.error || "Invalid email or password";
        console.error("Login failed:", errorMessage);
        setError(errorMessage);
        setIsLoading(false);
      }
    } catch (error) {
      // Log the error for debugging
      console.error("Login error:", error);
      setError("An error occurred during login. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-white">
      {/* Logo */}
      <div className="absolute top-8 left-8 z-10">
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent"
          onClick={() => router.push("/")}
        >
          <Image
            src="/img/eventrix.svg"
            alt="Eventrix Logo"
            width={120}
            height={40}
            className="cursor-pointer transition-transform hover:scale-105"
          />
        </Button>
      </div>

      {/* Login Form */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-200 p-8 shadow-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div
                className="relative rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
                role="alert"
              >
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 bg-white"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="mt-1 bg-white"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="mr-2 h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>
            </div>
          </form>
          <div className="text-center">
            <Link
              href="/register"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Don&rsquo;t have an account ? Register !
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
