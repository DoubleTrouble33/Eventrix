"use client";

import { useState } from "react";
import { AuthInput } from "../ui/auth-input";
import { Button } from "../ui/button";

export function SignInForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sign in");
      }

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error instanceof Error ? error.message : "Failed to sign in",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AuthInput
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        disabled={isLoading}
      />
      <AuthInput
        label="Password"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        disabled={isLoading}
      />
      {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
