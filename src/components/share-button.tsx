// src/components/share-button.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ShareButtonProps {
    title: string;
    text?: string;
}

export function ShareButton({ title, text }: ShareButtonProps) {
    const [isSharing, setIsSharing] = useState(false);

    const handleShare = async () => {
        setIsSharing(true);

        try {
            // Check if Web Share API is available
            if (navigator.share) {
                await navigator.share({
                    title: title,
                    text: text || '',
                    url: window.location.href,
                });
                toast.success("Berhasil dibagikan!");
            } else {
                // Fallback: copy to clipboard
                await copyToClipboard(window.location.href);
                toast.success("Link berhasil disalin ke clipboard!");
            }
        } catch (error) {
            // User cancelled share or error occurred
            if (error instanceof Error && error.name !== 'AbortError') {
                console.error('Error sharing:', error);
                // Try fallback to clipboard
                try {
                    await copyToClipboard(window.location.href);
                    toast.success("Link berhasil disalin ke clipboard!");
                } catch (clipboardError) {
                    console.error('Clipboard error:', clipboardError);
                    toast.error("Gagal membagikan link");
                }
            }
        } finally {
            setIsSharing(false);
        }
    };

    const copyToClipboard = async (text: string): Promise<void> => {
        // Check if clipboard API is available
        if (!navigator.clipboard) {
            // Fallback for older browsers
            return fallbackCopyToClipboard(text);
        }

        try {
            await navigator.clipboard.writeText(text);
        } catch (error) {
            // If clipboard fails, use fallback
            console.warn('Clipboard API failed, using fallback:', error);
            return fallbackCopyToClipboard(text);
        }
    };

    const fallbackCopyToClipboard = (text: string): void => {
        try {
            // Create a temporary textarea element
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            // Execute copy command
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (!successful) {
                throw new Error('Fallback copy failed');
            }
        } catch (error) {
            console.error('Fallback copy failed:', error);
            throw new Error('Gagal menyalin link');
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={isSharing}
            className="flex items-center gap-2"
        >
            <Share2 className="h-4 w-4" />
            {isSharing ? "Membagikan..." : "Bagikan"}
        </Button>
    );
}