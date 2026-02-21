"use client";

import { useEffect, useState } from "react";
import { Message } from "@/types/messages";
import { getFileUrl } from "@/lib/fileUpload";
import { getSharedKeyForChat } from "@/lib/userKeyManager";
import { Loader2, FileIcon, Download, AlertTriangle, Unlock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import Link from "next/link";

interface FileAttachmentProps {
    message: Message;
    isOwn: boolean;
}

export function FileAttachment({ message, isOwn }: FileAttachmentProps) {
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [hasStartedFileLoading, sethasStartedFileLoading] = useState<boolean>(false);

    useEffect(() => {
        let isMounted = true;
        let objectUrl: string | null = null;

        async function loadAttachment() {
            if (!message.fileUrl) {
                if (isMounted) setIsDecrypting(false);
                return;
            }

            // If the fileUrl is already a resolved URL (like an optimistic update or data URL), use it directly
            if (message.fileUrl.startsWith("http") || message.fileUrl.startsWith("data:") || message.fileUrl.startsWith("blob:")) {
                if (isMounted) {
                    setFileUrl(message.fileUrl);
                    setIsDecrypting(false);
                }
                return;
            }

            // ONLY run download if user has clicked download
            if (!hasStartedFileLoading) {
                if (isMounted) setIsDecrypting(false);
                return;
            }

            if (isMounted) setIsDecrypting(true);

            // Otherwise, it’s a storedPath from the database
            const storedPath = message.fileUrl;
            try {
                const signedUrl = await getFileUrl(storedPath);

                if (message.fileIv) {
                    // Try to get shared key
                    const myUserId = message.isMessageFromCurrentUser ? message.senderId : message.receiverId;
                    const theirUserId = message.isMessageFromCurrentUser ? message.receiverId : message.senderId;

                    let sharedKey: CryptoKey | null = null;
                    try {
                        sharedKey = await getSharedKeyForChat(myUserId, theirUserId);
                    } catch (e) {
                        if (isMounted) {
                            setError("Cannot get decryption keys for this file.");
                            setIsDecrypting(false);
                        }
                        return;
                    }

                    if (sharedKey) {
                        const response = await fetch(signedUrl);
                        if (!response.ok) {
                            throw new Error("Failed to download encrypted file");
                        }
                        const encryptedBuffer = await response.arrayBuffer();
                        const iv = Uint8Array.from(atob(message.fileIv), c => c.charCodeAt(0));

                        const decryptedBuffer = await crypto.subtle.decrypt(
                            { name: "AES-GCM", iv },
                            sharedKey,
                            encryptedBuffer
                        );

                        const mimeType = message.fileType || "application/octet-stream";
                        const blob = new Blob([decryptedBuffer], { type: mimeType });
                        objectUrl = URL.createObjectURL(blob);
                        if (isMounted) {
                            setFileUrl(objectUrl);
                            setIsDecrypting(false);
                        }
                    }
                } else {
                    // File is not encrypted
                    if (isMounted) {
                        setFileUrl(signedUrl);
                        setIsDecrypting(false);
                    }
                }
            } catch (err: any) {
                console.error("Failed to load attachment:", err);
                if (isMounted) {
                    setError("Failed to load attachment.");
                    setIsDecrypting(false);
                }
            }
        }

        loadAttachment();

        return () => {
            isMounted = false;
            // Clean up object URL if we created one to prevent memory leaks
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [message, hasStartedFileLoading]);

    if (!message.fileUrl) return null;

    if (error) {
        return (
            <div className={cn("flex items-center gap-2 p-3 rounded-lg border text-sm", isOwn ? "bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground" : "bg-destructive/10 border-destructive/20 text-destructive")}>
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
            </div>
        );
    }

    // If it hasn't started and we do not have a pre-resolved fileUrl, render a block that asks user to download.
    if (!fileUrl && !hasStartedFileLoading) {
        const isImage = message.fileType?.startsWith("image/");
        if (isImage) {
            return (
                <div onClick={() => sethasStartedFileLoading(true)} className={cn("relative rounded-lg overflow-hidden my-1 flex flex-col items-center justify-center p-8 border cursor-pointer hover:opacity-80 transition-opacity min-w-32", isOwn ? "bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground" : "bg-background/50 border-border text-foreground")}>
                    <div className="flex flex-col items-center gap-2 opacity-80">
                        <Download className="h-6 w-6" />
                        <span className="text-xs font-medium">{message.fileSize ? (message.fileSize / 1024).toFixed(0) + " KB" : "Image"}</span>
                    </div>
                </div>
            );
        }

        return (
            <Button
                onClick={() => sethasStartedFileLoading(true)}
                variant="outline"
                className={cn(
                    "flex w-full h-auto items-center justify-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                    isOwn ? "bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20 text-black" : "bg-background/50 border-border hover:bg-background/80 text-foreground"
                )}
            >
                <div className={cn("h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center shrink-0", isOwn ? "text-black" : "")}>
                    <Lock className="h-4 w-4" />
                </div>
                <div className={cn("flex-1 overflow-hidden pointer-events-none text-left flex flex-col", isOwn ? "text-black" : "")}>
                    <p className="text-sm font-medium truncate max-w-37.5">{message.fileName || "File"}</p>
                    <p className="text-xs font-semibold opacity-90 mt-0.5">Click to decrypt</p>
                </div>
                <Unlock className={cn("h-4 w-4 shrink-0 opacity-70 pointer-events-none ", isOwn ? "text-black" : "")} />
            </Button>
        );
    }

    if (isDecrypting || !fileUrl) {
        return (
            <div className={cn("flex items-center justify-center p-6 rounded-lg border my-1", isOwn ? "bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground" : "bg-background/50 border-border text-foreground")}>
                <div className="flex flex-col items-center gap-2 opacity-70">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-xs font-medium">{message.fileIv ? "Decrypting..." : "Downloading..."}</span>
                </div>
            </div>
        );
    }

    const isImage = message.fileType?.startsWith("image/");

    if (isImage) {
        return (
            <div className="relative rounded-lg overflow-hidden my-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={fileUrl}
                    alt={message.fileName || "Image"}
                    className="object-cover max-h-75 w-auto h-auto rounded-lg"
                />
            </div>
        );
    }

    return (
        <Link
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={message.fileName || "file"}
            className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                isOwn ? "bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20 text-primary-foreground" : "bg-background/50 border-border hover:bg-background/80 text-foreground"
            )}
        >
            <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center shrink-0">
                <FileIcon className="h-4 w-4" />
            </div>
            <div className="flex-1 overflow-hidden pointer-events-none text-left">
                <p className="text-sm font-medium truncate max-w-37.5">{message.fileName || "File"}</p>
                <p className="text-xs opacity-70">{message.fileSize ? (message.fileSize / 1024).toFixed(0) + " KB" : "Unknown size"}</p>
            </div>
            <Download className="h-4 w-4 shrink-0 opacity-70 pointer-events-none" />
        </Link>
    );
}
