from pydantic import BaseModel
from typing import Optional
from enum import Enum

class ToxicityLevel(str, Enum):
    SAFE = "safe"
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"

class EmotionLabel(str, Enum):
    JOY = "joy"
    GRATITUDE = "gratitude"
    ENCOURAGEMENT = "encouragement"
    NEUTRAL = "neutral"
    FRUSTRATION = "frustration"
    ANGER = "anger"
    SADNESS = "sadness"

class AuraAnalysisRequest(BaseModel):
    """Request model for aura analysis."""
    text: str
    filter_level: Optional[ToxicityLevel] = ToxicityLevel.SAFE


class AuraAnalysisResponse(BaseModel):
    """Response model for aura analysis."""
    aura: int
    is_toxic: bool
    toxicity_level: Optional[ToxicityLevel]
    toxicity_score: Optional[float]
    emotion_label: EmotionLabel
    emotion_score: float
    message_allowed: bool
