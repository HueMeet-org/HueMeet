import { deriveSharedSecret, exportKeys, generateKeyPair, importPrivateKey, importPublicKey } from "./encryption";
import { createClient } from "./supabase/client";

const supabase = createClient();
const publicKeyCache = new Map<string, string>();

// Fetch their public key from Supabase
async function fetchPublicKey(theirUserId: string) {
    // Check cache first
    if (publicKeyCache.has(theirUserId)) {
        return publicKeyCache.get(theirUserId)!;
    }

    const { data: user, error } = await supabase
        .from('profiles')
        .select('public_key')
        .eq('id', theirUserId)
        .single()

    if (error) {
        throw new Error(`Failed to fetch recipient (${theirUserId}) public key: ${error.message}`);
    }

    if (!user?.public_key) {
        throw new Error(`Recipient (${theirUserId}) has not initialized encryption keys yet.`);
    }

    // Cache the public key for future use
    publicKeyCache.set(theirUserId, user.public_key);

    return user.public_key
}

export async function initializeUserKeys(userId: string): Promise<void> {
    // Check if keys already exist
    const existingKey = localStorage.getItem(`private_key_${userId}`);
    if (existingKey) {
        try {
            // Validate key by attempting to import it
            await importPrivateKey(existingKey);
            return;
        } catch (e) {
            console.warn("Existing private key is invalid (likely curve mismatch). Regenerating...", e);
            localStorage.removeItem(`private_key_${userId}`);
            // Proceed to generate new keys
        }
    }

    try {
        // Generate new key pair
        const keyPair = await generateKeyPair()
        const exported = await exportKeys(keyPair)

        // Store private key locally (NEVER upload to server!)
        localStorage.setItem(`private_key_${userId}`, exported.privateKey)

        // Upload public key to Supabase
        const { error } = await supabase
            .from('profiles')
            .update({ public_key: exported.publicKey })
            .eq('id', userId);

        if (error) {
            console.error("Failed to upload public key:", error);
            // If upload fails, we should probably clear local storage so we retry next time
            localStorage.removeItem(`private_key_${userId}`);
            throw error;
        }
    } catch (err) {
        console.error("Error initializing user keys:", err);
        throw err;
    }
}

const sharedKeyCache = new Map<string, CryptoKey>();

/**
 * Get shared encryption key for a specific chat
 * Each chat partner = different shared key (automatically!)
 */
export async function getSharedKeyForChat(
    myUserId: string,
    theirUserId: string
): Promise<CryptoKey> {
    // Check in-memory cache for the derived shared key
    if (sharedKeyCache.has(theirUserId)) {
        return sharedKeyCache.get(theirUserId)!;
    }

    // Get my private key from localStorage
    const myPrivateKeyBase64 = localStorage.getItem(`private_key_${myUserId}`)
    if (!myPrivateKeyBase64) {
        throw new Error('Private key not found. Please initialize keys first.')
    }

    const myPrivateKey = await importPrivateKey(myPrivateKeyBase64);
    const theirPublicKey = await importPublicKey(await fetchPublicKey(theirUserId));

    // 3. Derive shared secret (unique for this chat!)
    const sharedKey = await deriveSharedSecret(myPrivateKey, theirPublicKey)

    // Cache the derived key
    sharedKeyCache.set(theirUserId, sharedKey);

    return sharedKey
}