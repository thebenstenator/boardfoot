"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { PLAN_LIMITS } from "@/lib/stripe/plans";

interface Photo {
  id: string;
  storage_path: string;
  url: string;
  created_at: string;
}

interface PhotoGalleryProps {
  projectId: string;
  userId: string;
}

export function PhotoGallery({ projectId, userId }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { tier, isPro } = useSubscription();

  const maxPhotos = PLAN_LIMITS[tier].maxPhotosPerProject;

  useEffect(() => {
    loadPhotos();
  }, [projectId]);

  async function loadPhotos() {
    const supabase = createClient();

    const { data: photoRows } = await supabase
      .from("project_photos")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (!photoRows) {
      setLoading(false);
      return;
    }

    // Get signed URLs for each photo
    const photosWithUrls = await Promise.all(
      photoRows.map(async (row) => {
        const { data } = await supabase.storage
          .from("project-photos")
          .createSignedUrl(row.storage_path, 3600); // 1 hour expiry

        return {
          id: row.id,
          storage_path: row.storage_path,
          url: data?.signedUrl ?? "",
          created_at: row.created_at,
        };
      }),
    );

    setPhotos(photosWithUrls);
    setLoading(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check photo limit
    if (photos.length >= maxPhotos) {
      setShowUpgrade(true);
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Only JPG, PNG, and WEBP images are allowed.");
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be under 10MB.");
      return;
    }

    setUploading(true);
    const supabase = createClient();

    const fileExt = file.name.split(".").pop();
    const storagePath = `${userId}/${projectId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("project-photos")
      .upload(storagePath, file);

    if (uploadError) {
      console.error("Upload failed:", uploadError);
      setUploading(false);
      return;
    }

    // Save to database
    const { data: photoRow, error: dbError } = await supabase
      .from("project_photos")
      .insert({ project_id: projectId, storage_path: storagePath })
      .select()
      .single();

    if (dbError || !photoRow) {
      console.error("Failed to save photo:", dbError);
      setUploading(false);
      return;
    }

    // Get signed URL for new photo
    const { data: signedUrl } = await supabase.storage
      .from("project-photos")
      .createSignedUrl(storagePath, 3600);

    setPhotos((prev) => [
      {
        id: photoRow.id,
        storage_path: storagePath,
        url: signedUrl?.signedUrl ?? "",
        created_at: photoRow.created_at,
      },
      ...prev,
    ]);

    setUploading(false);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(photo: Photo) {
    const supabase = createClient();

    await supabase.storage.from("project-photos").remove([photo.storage_path]);

    await supabase.from("project_photos").delete().eq("id", photo.id);

    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
  }

  if (loading) return null;

  return (
    <>
      {showUpgrade && (
        <UpgradeModal
          feature="Unlimited photo attachments"
          onClose={() => setShowUpgrade(false)}
        />
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Photos</h2>
          <div className="flex items-center gap-2">
            {!isPro && (
              <span className="text-xs text-muted-foreground">
                {photos.length}/{maxPhotos} photos
              </span>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="cursor-pointer text-sm border rounded px-3 py-1
                hover:bg-accent transition-colors disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "+ Add photo"}
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
          className="hidden"
        />

        {photos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No photos yet. Add inspiration images or sketches for reference.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group aspect-square">
                <img
                  src={photo.url}
                  alt="Project photo"
                  className="w-full h-full object-cover rounded-lg border"
                />
                <button
                  onClick={() => handleDelete(photo)}
                  className="cursor-pointer absolute top-1 right-1 bg-black/60 text-white
                    rounded-full w-6 h-6 flex items-center justify-center text-xs
                    opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
