"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, X, RefreshCw, AlertCircle } from "lucide-react";
import { generateEducationPersonal, regenerateEducationPersonal, getEducationPersonalById, getEducationPersonalUsage } from "@/lib/api/education-personal";
import { toast } from "sonner";
import type { EducationPersonalContent, GenerateEducationPersonalResponse, RegenerateEducationPersonalResponse, EducationPersonal } from "@/types/education";

interface TestResult {
  id: string;
  prompt: string;
  tags: string[];
  status: 'generating' | 'completed' | 'error' | 'regenerating';
  title: string;
  createdAt: string;
  generatedContent?: EducationPersonalContent;
}

interface UsageInfo {
  current: number;
  limit: number;
  remaining: number;
}

interface TestEducationGenerateProps {
  onGenerateSuccess?: (articleId: string) => void;
  onNewArticleCreated?: (article: EducationPersonal) => void;
}

export function TestEducationGenerate({ onGenerateSuccess, onNewArticleCreated }: TestEducationGenerateProps) {
  const [prompt, setPrompt] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);

  // Load usage info on component mount
  useEffect(() => {
    loadUsageInfo();
  }, []);

  const loadUsageInfo = async () => {
    try {
      setLoadingUsage(true);
      const usage = await getEducationPersonalUsage();
      setUsageInfo(usage);
    } catch (error) {
      console.error("Failed to load usage info:", error);
      // Fallback to default values if API fails
      setUsageInfo({ current: 0, limit: 10, remaining: 10 });
    } finally {
      setLoadingUsage(false);
    }
  };

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
      const response: GenerateEducationPersonalResponse = await generateEducationPersonal({
        prompt: prompt.trim(),
        tags: tags
      });

      // Update usage info dari response
      if (response.usage) {
        setUsageInfo(response.usage);
      }

      toast.success("Generasi artikel dimulai! Silakan tunggu...");

      // Add to results dengan status pending
      const newResult: TestResult = {
        id: response.data.id,
        prompt: prompt.trim(),
        tags: [...tags],
        status: 'generating',
        title: 'Generating...',
        createdAt: new Date().toISOString()
      };

      setResults(prev => [newResult, ...prev]);

      // Notify parent tentang article baru (placeholder)
      if (onNewArticleCreated) {
        onNewArticleCreated({
          ...response.data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // Start polling dengan callback untuk success
      startPolling(response.data.id, () => {
        // Ketika generate sukses, panggil callback
        if (onGenerateSuccess) {
          onGenerateSuccess(response.data.id);
        }
      });

      // Reset form setelah generate
      setPrompt("");
      setTags([]);

    } catch (error: unknown) {
      console.error("Generation failed:", error);

      const errorMessage = error instanceof Error ? error.message : "Gagal memulai generasi artikel";

      if (errorMessage.includes("Limit Exceeded") || errorMessage.includes("batas generate")) {
        toast.error(errorMessage, {
          duration: 5000,
          icon: <AlertCircle className="h-4 w-4 text-red-500" />,
        });
        // Refresh usage info ketika limit exceeded
        loadUsageInfo();
      } else if (errorMessage.includes("overload") || errorMessage.includes("timeout")) {
        toast.error("Model AI sedang overload. Silakan coba lagi dalam 1-2 menit.", {
          duration: 8000,
          icon: <AlertCircle className="h-4 w-4 text-orange-500" />,
        });
      } else if (errorMessage.includes("rate limit")) {
        toast.error("Terlalu banyak request. Silakan tunggu beberapa saat sebelum mencoba lagi.", {
          duration: 8000,
          icon: <AlertCircle className="h-4 w-4 text-orange-500" />,
        });
      } else {
        toast.error("Gagal memulai generasi artikel");
      }
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (id: string, onSuccess?: () => void) => {
    const poll = async () => {
      try {
        const article = await getEducationPersonalById(id);

        const createdAt = typeof article.createdAt === 'string'
          ? article.createdAt
          : article.createdAt.toISOString();

        if (article.title !== "Generating..." && article.title !== "Regenerating...") {
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

          // Refresh usage info setelah generate selesai
          loadUsageInfo();

          // Panggil callback success jika ada
          if (onSuccess) {
            onSuccess();
          }
        } else {
          setTimeout(() => poll(), 2000);
        }
      } catch (error) {
        console.error("Polling error:", error);
        setResults(prev => prev.map(item =>
          item.id === id
            ? { ...item, status: 'error', title: 'Generation Failed' }
            : item
        ));
      }
    };

    setTimeout(() => poll(), 3000);
  };

  const handleRegenerate = async (id: string) => {
    setRegeneratingId(id);
    try {
      const response: RegenerateEducationPersonalResponse = await regenerateEducationPersonal(id);

      // Update usage info dari response
      if (response.usage) {
        setUsageInfo(response.usage);
      }

      toast.success("Regenerasi artikel dimulai!");

      setResults(prev => prev.map(item =>
        item.id === id
          ? { ...item, status: 'regenerating', title: 'Regenerating...' }
          : item
      ));

      // Start polling untuk regenerate dengan callback
      startPolling(id, () => {
        // Ketika regenerate sukses, panggil callback
        if (onGenerateSuccess) {
          onGenerateSuccess(id);
        }
      });

    } catch (error: unknown) {
      console.error("Regeneration failed:", error);

      const errorMessage = error instanceof Error ? error.message : "Gagal memulai regenerasi artikel";

      if (errorMessage.includes("Limit Exceeded") || errorMessage.includes("batas generate")) {
        toast.error(errorMessage, {
          duration: 5000,
          icon: <AlertCircle className="h-4 w-4 text-red-500" />,
        });
        // Refresh usage info ketika limit exceeded
        loadUsageInfo();
      } else if (errorMessage.includes("overload") || errorMessage.includes("timeout")) {
        toast.error("Model AI sedang overload. Silakan coba lagi dalam 1-2 menit.", {
          duration: 8000,
          icon: <AlertCircle className="h-4 w-4 text-orange-500" />,
        });
      } else if (errorMessage.includes("rate limit")) {
        toast.error("Terlalu banyak request. Silakan tunggu beberapa saat sebelum mencoba lagi.", {
          duration: 8000,
          icon: <AlertCircle className="h-4 w-4 text-orange-500" />,
        });
      } else {
        toast.error("Gagal memulai regenerasi artikel");
      }
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  // Calculate progress percentage
  const progressPercentage = usageInfo ? (usageInfo.current / usageInfo.limit) * 100 : 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Konten Edukasi Personal</CardTitle>
          <CardDescription>
            Generate konten edukasi menggunakan AI - Maksimal 10 generate per hari
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Usage Info - SELALU DITAMPILKAN */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            {loadingUsage ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Memuat info batas generate...</span>
              </div>
            ) : usageInfo ? (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Limit Generate Hari Ini:</span>
                  <span className="font-semibold">{usageInfo.current} / {usageInfo.limit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${progressPercentage >= 90 ? 'bg-red-500' :
                        progressPercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>
                    {usageInfo.remaining > 0
                      ? `Sisa: ${usageInfo.remaining} generate`
                      : 'Batas telah tercapai'
                    }
                  </span>
                  <span>Reset: 00:00 WIB</span>
                </div>

                {/* Warning message when approaching limit */}
                {usageInfo.remaining <= 2 && usageInfo.remaining > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    ⚠️ Hati-hati! Hanya tersisa {usageInfo.remaining} generate hari ini.
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-2">
                <span className="text-sm text-muted-foreground">
                  Gagal memuat info batas generate
                </span>
              </div>
            )}
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Prompt</label>
            <Input
              placeholder="Masukkan prompt untuk generate konten edukasi..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading || (usageInfo?.remaining === 0)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !loading && usageInfo?.remaining !== 0) {
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
                disabled={loading || (usageInfo?.remaining === 0)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={loading || !currentTag.trim() || (usageInfo?.remaining === 0)}
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
            disabled={loading || !prompt.trim() || (usageInfo?.remaining === 0)}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starting Generation...
              </>
            ) : usageInfo?.remaining === 0 ? (
              "Batas Generate Hari Ini Telah Habis"
            ) : (
              "Generate Content"
            )}
          </Button>

          {usageInfo?.remaining === 0 && (
            <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">
                Batas generate hari ini telah habis
              </p>
              <p className="text-xs text-red-600 mt-1">
                Limit akan direset besok pukul 00:00 WIB
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hasil Generate (Realtime)</CardTitle>
            <CardDescription>
              {results.length} artikel telah digenerate - Konten akan otomatis muncul di list
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
                    disabled={regeneratingId === result.id || result.status === 'regenerating' || (usageInfo?.remaining === 0)}
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