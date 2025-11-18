// src/components/test-education-generate.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, X, RefreshCw } from "lucide-react";
import { generateEducationPersonal, regenerateEducationPersonal, getEducationPersonalById } from "@/lib/api/education-personal";
import { toast } from "sonner";
import type { EducationPersonalContent } from "@/types/education";

interface TestResult {
  id: string;
  prompt: string;
  tags: string[];
  status: 'generating' | 'completed' | 'error' | 'regenerating';
  title: string;
  createdAt: string; // Hanya string, tidak ada Date
  generatedContent?: EducationPersonalContent;
}

export function TestEducationGenerate() {
  const [prompt, setPrompt] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Prompt tidak boleh kosong");
      return;
    }

    setLoading(true);
    try {
      const response = await generateEducationPersonal({
        prompt: prompt.trim(),
        tags: tags
      });

      toast.success("Generasi artikel dimulai! Silakan tunggu...");

      // Add to results dengan status pending
      const newResult: TestResult = {
        id: response.id,
        prompt: prompt.trim(),
        tags: [...tags],
        status: 'generating',
        title: 'Generating...',
        createdAt: new Date().toISOString()
      };

      setResults(prev => [newResult, ...prev]);
      startPolling(response.id);

    } catch (error) {
      console.error("Generation failed:", error);
      if (error instanceof Error && error.message.includes("Prompt harus terkait")) {
        toast.error(error.message);
      } else {
        toast.error("Gagal memulai generasi artikel");
      }
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (id: string) => {
    const poll = async () => {
      try {
        const article = await getEducationPersonalById(id);

        // Convert Date to string jika diperlukan
        const createdAt = typeof article.createdAt === 'string'
          ? article.createdAt
          : article.createdAt.toISOString();

        if (article.title !== "Generating..." && article.title !== "Regenerating...") {
          // ✅ PERBAIKAN: Pastikan type-nya sesuai dengan TestResult
          const completedResult: TestResult = {
            id: article.id,
            prompt: article.prompt,
            tags: article.tags,
            title: article.title,
            createdAt: createdAt,
            status: 'completed',
            generatedContent: article.generatedContent
          };

          setResults(prev => prev.map(item =>
            item.id === id ? completedResult : item
          ));
          toast.success("Artikel berhasil digenerate!");
        } else {
          // Masih generating, poll lagi dalam 2 detik
          setTimeout(() => poll(), 2000);
        }
      } catch (error) {
        console.error("Polling error:", error);
        // Update status jadi error
        setResults(prev => prev.map(item =>
          item.id === id
            ? { ...item, status: 'error', title: 'Generation Failed' }
            : item
        ));
      }
    };

    // Start polling setelah 3 detik (beri waktu untuk proses)
    setTimeout(() => poll(), 3000);
  };

  const handleRegenerate = async (id: string) => {
    setRegeneratingId(id);
    try {
      await regenerateEducationPersonal(id);
      toast.success("Regenerasi artikel dimulai!");

      // Update status di results
      setResults(prev => prev.map(item =>
        item.id === id
          ? { ...item, status: 'regenerating', title: 'Regenerating...' }
          : item
      ));

      // Start polling untuk regenerated content
      startPolling(id);

    } catch (error) {
      console.error("Regeneration failed:", error);
      toast.error("Gagal memulai regenerasi artikel");
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Education Content Generation</CardTitle>
          <CardDescription>
            Test generate konten edukasi menggunakan Inngest & Gemini AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Prompt</label>
            <Input
              placeholder="Masukkan prompt untuk generate konten edukasi..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleGenerate();
                }
              }}
            />
          </div>

          {/* Tags Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags (Opsional)</label>
            <div className="flex gap-2">
              <Input
                placeholder="Tambahkan tag..."
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={loading || !currentTag.trim()}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Tags Display */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      disabled={loading}
                      className="hover:bg-muted rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starting Generation...
              </>
            ) : (
              "Generate Content"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generation Results</CardTitle>
            <CardDescription>
              {results.length} article(s) generated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result) => (
              <div key={result.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    <h3 className="font-semibold">{result.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Prompt: {result.prompt}
                    </p>
                    {result.tags && result.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {result.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant={
                        result.status === 'completed' ? 'default' :
                          result.status === 'error' ? 'destructive' : 'secondary'
                      }>
                        {result.status}
                      </Badge>
                      <span className="text-muted-foreground">
                        {new Date(result.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRegenerate(result.id)}
                    disabled={regeneratingId === result.id || result.status === 'regenerating'}
                  >
                    {regeneratingId === result.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Show content preview for completed articles */}
                {result.status === 'completed' && result.generatedContent && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Preview:</h4>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm line-clamp-3">
                        {result.generatedContent.content.substring(0, 200)}...
                      </p>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {result.generatedContent.sections?.slice(0, 3).map((section, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {section.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}