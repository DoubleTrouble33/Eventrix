"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { toast } from "sonner";

interface AvatarUploadProps {
  currentAvatar: string;
  onAvatarChange: (newAvatar: string) => void;
}

export function AvatarUpload({
  currentAvatar,
  onAvatarChange,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
        credentials: "include", // This ensures cookies are sent with the request
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload avatar");
      }

      const data = await response.json();
      onAvatarChange(data.avatar);
      toast.success("Avatar updated successfully");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload avatar",
      );
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative h-32 w-32 overflow-hidden rounded-full">
        <Image
          src={preview || currentAvatar}
          alt="Profile"
          fill
          className="object-cover"
          sizes="(max-width: 128px) 100vw, 128px"
        />
      </div>
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="bg-primary text-primary-foreground hover:bg-primary/90 absolute right-0 bottom-0 rounded-full p-2 shadow-lg transition-colors"
      >
        <Camera className="h-4 w-4" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
