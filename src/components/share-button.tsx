"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

interface ShareButtonProps {
    title: string;
    text?: string;
}

export function ShareButton({ title, text }: ShareButtonProps) {
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: text || '',
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert('Link artikel berhasil disalin!');
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="flex items-center gap-2"
        >
            <Share2 className="h-4 w-4" />
            Bagikan
        </Button>
    );
}