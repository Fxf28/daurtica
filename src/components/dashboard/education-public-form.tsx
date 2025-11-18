// src/components/dashboard/education-public-form.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2 } from "lucide-react";
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
    }
  }, [article]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Judul dan konten harus diisi");
      return;
    }

    setIsLoading(true);

    try {
      if (article) {
        // Update existing article
        await updateEducationPublic(article.id, formData);
        toast.success("Artikel berhasil diperbarui");
      } else {
        // Create new article
        await createEducationPublic(formData);
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

  // ✅ PERBAIKAN: Helper untuk handle excerpt length
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
            <Label htmlFor="title">Judul Artikel</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Masukkan judul artikel..."
              required
            />
          </div>

          {/* Thumbnail URL */}
          <div className="space-y-2">
            <Label htmlFor="thumbnailUrl">URL Thumbnail (Opsional)</Label>
            <Input
              id="thumbnailUrl"
              type="url"
              value={formData.thumbnailUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
              placeholder="https://example.com/image.jpg"
            />
            {formData.thumbnailUrl && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <Image
                  src={formData.thumbnailUrl}
                  alt="Thumbnail preview"
                  className="w-32 h-20 object-cover rounded border"
                  width={128}
                  height={80}
                />
              </div>
            )}
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
              value={formData.excerpt || ""} // ✅ PERBAIKAN: Default ke empty string
              onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Ringkasan singkat tentang artikel ini..."
              rows={3}
            />
            {/* ✅ PERBAIKAN: Gunakan helper function untuk length */}
            <p className="text-sm text-muted-foreground">
              {getExcerptLength()}/200 karakter
            </p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Konten Artikel</Label>
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