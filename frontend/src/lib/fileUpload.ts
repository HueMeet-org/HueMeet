import { createClient } from "./supabase/client";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function uploadFile(file: File) {
    const supabase = createClient();

    if (file.size > MAX_FILE_SIZE) {
        throw new Error("File size exceeds the limit of 10MB");
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    const { error } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file);

    if (error) {
        throw error;
    }

    const { data, error: dataError } = await supabase
        .storage
        .from('chat-files')
        .createSignedUrl(fileName, 60 * 60 * 24 * 7) // 7 days

    if (dataError) {
        throw dataError;
    }

    return {
        url: data.signedUrl,
        name: fileName,
        size: file.size,
        type: file.type,
    };
}