"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Send, Smile, Paperclip, Mic, X } from "lucide-react";
import { Message } from "@/types/messages";

interface ChatInputProps {
    onSendMessage: (content: string) => void;
    disabled?: boolean;
}

export function ChatInput({
    onSendMessage,
    disabled = false,
}: ChatInputProps) {
    const [message, setMessage] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    const adjustHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }, []);

    useEffect(() => {
        adjustHeight();
    }, [message, adjustHeight]);

    const handleSend = () => {
        const trimmed = message.trim();
        if (!trimmed) return;
        onSendMessage(trimmed);
        setMessage("");
        // Reset height
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const hasContent = message.trim().length > 0;

    return (
        <div className="shrink-0 border-t bg-card/80 backdrop-blur-sm">
            {/* Input row */}
            <div className="flex items-end gap-2 p-3 sm:p-4">
                {/* Attachment button */}
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="cursor-pointer rounded-full shrink-0 mb-0.5"
                    disabled={disabled}
                >
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                </Button>

                {/* Textarea container */}
                <div className="flex-1 flex items-end gap-2 rounded-2xl border bg-background dark:bg-input/30 px-3 py-2 transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/50">
                    {/* Emoji button */}
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="cursor-pointer rounded-full shrink-0 h-7 w-7 -ml-1"
                        disabled={disabled}
                    >
                        <Smile className="h-5 w-5 text-muted-foreground" />
                    </Button>

                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message…"
                        disabled={disabled}
                        rows={1}
                        className={cn(
                            "flex-1 resize-none border-0 bg-transparent text-sm leading-relaxed placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed disabled:opacity-50",
                            "max-h-[120px] scrollbar-thin"
                        )}
                    />
                </div>

                {/* Send / Mic button */}
                <Button
                    variant={hasContent ? "default" : "ghost"}
                    size="icon-sm"
                    className={cn(
                        "cursor-pointer rounded-full shrink-0 mb-0.5 transition-all duration-200",
                        hasContent && "scale-105 shadow-md"
                    )}
                    onClick={hasContent ? handleSend : undefined}
                    disabled={disabled}
                >
                    {hasContent ? (
                        <Send className="h-4 w-4" />
                    ) : (
                        <Mic className="h-5 w-5 text-muted-foreground" />
                    )}
                </Button>
            </div>
        </div>
    );
}
