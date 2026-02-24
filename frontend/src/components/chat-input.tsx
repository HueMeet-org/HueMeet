"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Send, Smile, Paperclip, Mic, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { analyzeAura, ToxicityLevel } from "@/lib/aura/service";

interface ChatInputProps {
    onSendMessage: (content: string, file?: any) => void;
    disabled?: boolean;
}

export function ChatInput({
    onSendMessage,
    disabled = false,
}: ChatInputProps) {
    const [message, setMessage] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const removeFile = () => {
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

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

    const handleSend = async () => {
        const trimmed = message.trim();
        if (!trimmed && !file) return;

        // send only safe messages
        const response = await analyzeAura(trimmed, ToxicityLevel.SAFE);
        if (response.is_toxic) {
            toast.error("Message is toxic");
            return;
        }

        try {
            onSendMessage(trimmed, file || undefined);
            setMessage("");
            removeFile();
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            toast.error("Failed to send message: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const hasContent = message.trim().length > 0 || !!file;

    return (
        <div className="shrink-0 border-t bg-card/80 backdrop-blur-sm">
            {/* Input row */}
            {file && (
                <div className="mx-4 mt-2 mb-1 p-2 bg-muted/50 rounded-lg flex items-center justify-between border w-fit max-w-[calc(100%-2rem)]">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm truncate max-w-50">{file.name}</span>
                        <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-6 w-6 ml-2 rounded-full hover:bg-background/80"
                        onClick={removeFile}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}
            <div className="flex items-end gap-2 p-3 sm:p-4">
                {/* Attachment button */}
                <Input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                />
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="cursor-pointer rounded-full shrink-0 mb-0.5"
                    disabled={disabled}
                    onClick={() => fileInputRef.current?.click()}
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
                            "max-h-30 scrollbar-thin"
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
