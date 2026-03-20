import { createClient } from "./supabase/client";
import { getSharedKeyForChat } from "./userKeyManager";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function uploadFile(file: File, senderId: string, receiverId: string) {
    const supabase = createClient();

    if (file.size > MAX_FILE_SIZE) {
        throw new Error("File size exceeds the limit of 10MB");
    }

    // Derive shared key (same pattern as sendMessage for text)
    let sharedKey: CryptoKey | null = null;
    try {
        sharedKey = await getSharedKeyForChat(senderId, receiverId);
    } catch (e) {
        throw new Error("Cannot upload file: Encryption keys are missing or invalid. Please ensure both users have initialized their keys.");

    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    let uploadBlob: Blob = file;
    let fileIv: string | undefined;

    if (sharedKey) {
        const fileBuffer = await file.arrayBuffer();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encryptedBuffer = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            sharedKey,
            fileBuffer
        );
        uploadBlob = new Blob([encryptedBuffer], { type: "application/octet-stream" });
        fileIv = btoa(String.fromCharCode(...iv));
    }

    const { error } = await supabase.storage
        .from('chat-files')
        .upload(fileName, uploadBlob);

    if (error) {
        throw error;
    }

    return {
        name: fileName,
        size: file.size,
        type: file.type,
        fileIv,
    };
}

export async function getFileUrl(path: string): Promise<string> {
    const supabase = createClient();

    const { data, error } = await supabase
        .storage
        .from('chat-files')
        .createSignedUrl(path, 60 * 60); // 1 hour — short-lived

    if (error) throw error;

    return data.signedUrl;
}