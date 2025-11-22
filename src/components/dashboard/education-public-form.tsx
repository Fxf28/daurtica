// src/components/dashboard/education-public-form.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { createEducationPublic, updateEducationPublic } from "@/lib/api/education-public";
import type { EducationPublic, EducationPublicFormData } from "@/types/education";
import Image from "next/image";

interface EducationPublicFormProps {
  article?: EducationPublic | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EducationPublicForm({ article, onSuccess, onCancel }: EducationPublicFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<EducationPublicFormData>({
    title: "",
    content: "",
    thumbnailUrl: "",
    excerpt: "",
    tags: [],
    isPublished: false,
  });
  const [newTag, setNewTag] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with article data if editing
  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title,
        content: article.content,
        thumbnailUrl: article.thumbnailUrl || "",
        excerpt: article.excerpt || "",
        tags: article.tags || [],
        isPublished: article.isPublished,
      });

      // Set thumbnail preview if article has thumbnail
      if (article.thumbnailUrl) {
        setThumbnailPreview(article.thumbnailUrl);
      }
    }
  }, [article]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi file
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      toast.error("Ukuran file maksimal 2MB");
      return;
    }

    setThumbnailFile(file);
    setThumbnailLoading(true);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setThumbnailPreview(e.target?.result as string);
      setThumbnailLoading(false);
    };
    reader.readAsDataURL(file);

    // Clear the thumbnail URL since we're using file upload
    setFormData(prev => ({ ...prev, thumbnailUrl: "" }));
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Judul dan konten harus diisi");
      return;
    }

    setIsLoading(true);

    try {
      const submitData = {
        title: formData.title,
        content: formData.content,
        tags: formData.tags,
        excerpt: formData.excerpt,
        isPublished: formData.isPublished,
        // Jangan kirim thumbnailUrl jika tidak ada perubahan
        ...(thumbnailFile && { thumbnailFile }),
      };

      if (article) {
        // Update existing article
        await updateEducationPublic(article.id, submitData);
        toast.success("Artikel berhasil diperbarui");
      } else {
        // Create new article
        await createEducationPublic(submitData);
        toast.success("Artikel berhasil dibuat");
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving article:", error);
      toast.error(`Gagal ${article ? 'memperbarui' : 'membuat'} artikel`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const getExcerptLength = () => {
    return formData.excerpt?.length || 0;
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {article ? 'Edit Artikel' : 'Buat Artikel Baru'}
          </DialogTitle>
          <DialogDescription>
            {article
              ? 'Edit artikel edukasi publik Anda'
              : 'Buat artikel edukasi publik baru tentang pengelolaan sampah'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Judul Artikel *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Masukkan judul artikel..."
              required
            />
          </div>

          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label htmlFor="thumbnail">Thumbnail Artikel</Label>

            {/* Upload Area */}
            {!thumbnailPreview && (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                <input
                  ref={fileInputRef}
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                />
                <label htmlFor="thumbnail" className="cursor-pointer">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm">
                    Klik untuk upload thumbnail
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: JPG, PNG, WebP (Maks. 2MB)
                  </p>
                </label>
              </div>
            )}

            {/* Thumbnail Preview */}
            {thumbnailPreview && (
              <div className="space-y-3">
                <div className="relative inline-block">
                  <div className="relative w-48 h-32 rounded-lg overflow-hidden border">
                    {thumbnailLoading ? (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <Image
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>

                  {/* Remove button */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={removeThumbnail}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Ganti Gambar
                  </Button>
                </div>
              </div>
            )}

            {/* Legacy URL Input (hidden but kept for backward compatibility) */}
            <div className="hidden">
              <Input
                id="thumbnailUrl"
                type="url"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tambahkan tag..."
              />
              <Button type="button" onClick={handleAddTag} variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <Label htmlFor="excerpt">Ringkasan (Opsional)</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Ringkasan singkat tentang artikel ini..."
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              {getExcerptLength()}/200 karakter
            </p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Konten Artikel *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Tulis konten artikel edukasi Anda di sini..."
              rows={12}
              required
            />
          </div>

          {/* Publish Switch */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isPublished"
              checked={formData.isPublished}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublished: checked }))}
            />
            <Label htmlFor="isPublished">
              {formData.isPublished ? 'Published' : 'Draft'}
            </Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {article ? 'Perbarui Artikel' : 'Buat Artikel'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}