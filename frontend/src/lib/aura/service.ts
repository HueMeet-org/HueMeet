import { toast } from "sonner";

const FASTAPI_HOST = process.env.NEXT_PUBLIC_FASTAPI_HOST;

export enum ToxicityLevel {
    SAFE = "safe",
    MILD = "mild",
    MODERATE = "moderate",
    SEVERE = "severe",
}

export const analyzeAura = async (text: string, filter_level: ToxicityLevel) => {
    const response = await fetch(`${FASTAPI_HOST}/aura/analyze`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            text,
            filter_level,
        }),
    }).then((res) => res.json()).catch((err) => {
        console.error(err);
        return { is_toxic: false, aura_score: 0 };
    });

    if (response.is_toxic) {
        toast.error("Message is toxic");
        return {
            is_toxic: response.is_toxic,
            aura_score: response.aura_score,
        };
    }

    return {
        is_toxic: response.is_toxic,
        aura_score: response.aura,
    };
}