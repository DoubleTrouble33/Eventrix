"use client";

import { useState } from "react";
import { AuthInput } from "../ui/auth-input";
import { Button } from "../ui/button";

export function SignUpForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
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

    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sign up");
      }

      // Redirect to login or dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error instanceof Error ? error.message : "Failed to sign up",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AuthInput
        label="Name"
        name="name"
        type="text"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        disabled={isLoading}
      />
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
      <AuthInput
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
        disabled={isLoading}
      />
      {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Signing up..." : "Sign Up"}
      </Button>
    </form>
  );
}
