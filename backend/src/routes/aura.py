import datetime
from fastapi import APIRouter, HTTPException
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    TextClassificationPipeline,
)

from src.models.aura import AuraAnalysisRequest, AuraAnalysisResponse, ToxicityLevel


router = APIRouter(prefix="/aura", tags=["Aura System"])

# Configurations for toxic model
TOXIC_MODEL_NAME = "unitary/unbiased-toxic-roberta"
toxic_tokenizer = AutoTokenizer.from_pretrained(TOXIC_MODEL_NAME)
toxic_model = AutoModelForSequenceClassification.from_pretrained(TOXIC_MODEL_NAME)
toxic_pipeline = TextClassificationPipeline(
    model=toxic_model, tokenizer=toxic_tokenizer
)

# Configurations for emotion model
EMOTION_MODEL_NAME = "SamLowe/roberta-base-go_emotions"
emotion_tokenizer = AutoTokenizer.from_pretrained(EMOTION_MODEL_NAME)
emotion_model = AutoModelForSequenceClassification.from_pretrained(EMOTION_MODEL_NAME)
emotion_pipeline = TextClassificationPipeline(
    model=emotion_model, tokenizer=emotion_tokenizer
)


def analyze_toxicity(text: str) -> dict:
    """
    Analyze the toxicity and negativity of the given text using HuggingFace transformers.

    Args:
        text: The input text to analyze

    Returns:
        dict containing toxicity analysis results
    """
    try:
        results = toxic_pipeline(text)
        score = results[0]["score"]

        return {"is_toxic": score > 0.5, "toxicity_score": score}
    except Exception as e:
        print(f"Error during toxicity analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing text: {str(e)}")


def analyze_emotion(text: str) -> dict:
    """
    Analyze the emotion of the given text using HuggingFace transformers.

    Args:
        text: The input text to analyze

    Returns:
        dict containing emotion analysis results
    """
    try:
        results = emotion_pipeline(text)

        emotion_mapping = {
            # JOY (5 emotions) - Pure happiness, excitement
            "joy": "joy",
            "amusement": "joy",
            "excitement": "joy",
            "love": "joy",
            "pride": "joy",
            # GRATITUDE (2 emotions) - Thankfulness, appreciation
            "gratitude": "gratitude",
            "admiration": "gratitude",
            # ENCOURAGEMENT (4 emotions) - Support, positivity, hope
            "approval": "encouragement",
            "caring": "encouragement",
            "optimism": "encouragement",
            "relief": "encouragement",
            # NEUTRAL (4 emotions) - No strong emotion
            "neutral": "neutral",
            "realization": "neutral",
            "curiosity": "neutral",
            "surprise": "neutral",
            "desire": "neutral",  # Could also be joy, but keeping neutral
            # FRUSTRATION (6 emotions) - Mild negative, annoyance
            "annoyance": "frustration",
            "disappointment": "frustration",
            "disapproval": "frustration",
            "embarrassment": "frustration",
            "nervousness": "frustration",
            "confusion": "frustration",
            # ANGER (3 emotions) - Strong negative, hostility
            "anger": "anger",
            "disgust": "anger",
            "fear": "anger",  # Can also map to frustration
            # SADNESS (3 emotions) - Sorrow, grief
            "sadness": "sadness",
            "grief": "sadness",
            "remorse": "sadness",
        }

        return {
            "emotion_label": emotion_mapping[results[0]["label"]],
            "emotion_score": results[0]["score"]
        }
    except Exception as e:
        print(f"Error during emotion analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing text: {str(e)}")


def get_aura_score(emotion: dict) -> int:
    """
    Calculate aura score based on emotion score.

    Args:
        emotion_score: Emotion score from emotion analysis

    Returns:
        Aura score based on emotion score
    """
    
    if emotion['emotion_label'] in ["joy", "gratitude", "encouragement"]: # Positive emotions contribute to higher aura score
        return emotion['emotion_score'] / 9 # Normalize to 0-1 range so if score is 0.9, aura score will be 0.1
    else:
        return 0.0 # Neutral and negative emotions do not contribute to aura score

@router.post("/analyze", response_model=AuraAnalysisResponse)
def analyze_aura(request: AuraAnalysisRequest) -> AuraAnalysisResponse:
    """
    Analyze the given text and calculate an aura score.

    - If the text is above the filter level, aura score will be -5
    - Positive/neutral text will have 0 aura score
    - Aura score will be calculated based on the emotion score in frontend side

    Args:
        request: AuraAnalysisRequest containing the text to analyze

    Returns:
        AuraAnalysisResponse with toxicity analysis and aura score
    """
    try:
        toxicity = analyze_toxicity(request.text)
        emotion = analyze_emotion(request.text)

        toxicity_level = ToxicityLevel.SAFE
        if toxicity["is_toxic"]:
            if toxicity["toxicity_score"] > 0.5 and toxicity["toxicity_score"] < 0.7:
                toxicity_level = ToxicityLevel.MILD
            elif toxicity["toxicity_score"] > 0.7 and toxicity["toxicity_score"] < 0.9:
                toxicity_level = ToxicityLevel.MODERATE
            elif toxicity["toxicity_score"] > 0.9:
                toxicity_level = ToxicityLevel.SEVERE
        
        if request.filter_level == "safe":
            if toxicity["is_toxic"]:
                return AuraAnalysisResponse(
                    aura=-5,
                    is_toxic=True,
                    toxicity_level=toxicity_level,
                    toxicity_score=toxicity["toxicity_score"],
                    emotion_label=emotion["emotion_label"],
                    emotion_score=emotion["emotion_score"],
                    message_allowed=False,
                )

        elif request.filter_level == "mild":
            if toxicity["is_toxic"] and toxicity_level == ToxicityLevel.MILD or toxicity_level == ToxicityLevel.MODERATE or toxicity_level == ToxicityLevel.SEVERE:
                return AuraAnalysisResponse(
                    aura=-5,
                    is_toxic=True,
                    toxicity_level=toxicity_level,
                    toxicity_score=toxicity["toxicity_score"],
                    emotion_label=emotion["emotion_label"],
                    emotion_score=emotion["emotion_score"],
                    message_allowed=False,
                )

        elif request.filter_level == "moderate":
            if toxicity["is_toxic"] and toxicity_level == ToxicityLevel.MODERATE or toxicity_level == ToxicityLevel.SEVERE:
                return AuraAnalysisResponse(
                    aura=-5,
                    is_toxic=True,
                    toxicity_level=toxicity_level,
                    toxicity_score=toxicity["toxicity_score"],
                    emotion_label=emotion["emotion_label"],
                    emotion_score=emotion["emotion_score"],
                    message_allowed=False,
                )

        elif request.filter_level == "severe":
            if toxicity["is_toxic"] and toxicity_level == ToxicityLevel.SEVERE:
                return AuraAnalysisResponse(
                    aura=-5,
                    is_toxic=True,
                    toxicity_level=toxicity_level,
                    toxicity_score=toxicity["toxicity_score"],
                    emotion_label=emotion["emotion_label"],
                    emotion_score=emotion["emotion_score"],
                    message_allowed=False,
                )

        return AuraAnalysisResponse(
            aura=get_aura_score(emotion),
            is_toxic=toxicity["is_toxic"],
            toxicity_level=toxicity_level,
            toxicity_score=toxicity["toxicity_score"],
            emotion_label=emotion["emotion_label"],
            emotion_score=emotion["emotion_score"],
            message_allowed=True,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing text: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check endpoint for the aura system."""
    return {"status": "healthy", "service": "aura-system"}


if __name__ == "__main__":
    analyze_emotion("What happened to you? I hope you're doing well!")
