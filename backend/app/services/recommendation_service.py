import hashlib
import json
import threading
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Callable, List, Optional
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session
from app.models.recommendation_cache import RecommendationCache
from app.models.travel_profile import TravelProfile
from app.schemas.profile import TravelProfileData
from app.schemas.recommendation import Destination, RecommendationsResponse
from app.services.ai_service import generate_destinations

# Bump this when the prompts change so cached recommendations are regenerated
PROMPT_VERSION = "2"

POPULAR_KEY = "popular"
POPULAR_MAX_AGE = timedelta(days=7)

DEFAULT_RATING = 3
NON_PREFERENCE_FIELDS = {"name", "email"}

# One lock per cache key, so simultaneous requests don't each call Gemini
_locks: defaultdict = defaultdict(threading.Lock)


def has_preferences(profile: TravelProfileData) -> bool:
    """False if the profile is still all defaults: nothing answered, nothing selected, every slider at 3."""
    for value in profile.model_dump(exclude=NON_PREFERENCE_FIELDS).values():
        if isinstance(value, dict):
            if any(rating != DEFAULT_RATING for rating in value.values()):
                return True
        elif isinstance(value, int):
            if value != DEFAULT_RATING:
                return True
        elif value:
            return True
    return False


def _profile_fingerprint(profile: TravelProfileData) -> str:
    preferences = profile.model_dump(exclude=NON_PREFERENCE_FIELDS)
    payload = json.dumps({"v": PROMPT_VERSION, "profile": preferences}, sort_keys=True)
    return hashlib.sha256(payload.encode()).hexdigest()


def _cached_or_generate(
    db: Session,
    key: str,
    fingerprint: str,
    generate: Callable[[], List[Destination]],
    max_age: Optional[timedelta] = None,
) -> List[Destination]:
    def load_fresh() -> Optional[List[Destination]]:
        row = db.get(RecommendationCache, key)
        if row is None or row.fingerprint != fingerprint:
            return None
        if max_age is not None and datetime.now(timezone.utc) - row.created_at > max_age:
            return None
        return [Destination.model_validate(d) for d in row.data]

    cached = load_fresh()
    if cached is not None:
        return cached

    with _locks[key]:
        db.expire_all()  # another request may have just generated these
        cached = load_fresh()
        if cached is not None:
            return cached

        destinations = generate()
        values = [d.model_dump() for d in destinations]
        stmt = insert(RecommendationCache).values(cache_key=key, fingerprint=fingerprint, data=values)
        stmt = stmt.on_conflict_do_update(
            index_elements=[RecommendationCache.cache_key],
            set_={"fingerprint": fingerprint, "data": values, "created_at": func.now()},
        )
        db.execute(stmt)
        db.commit()
        return destinations


def get_popular(db: Session) -> RecommendationsResponse:
    destinations = _cached_or_generate(
        db, POPULAR_KEY, PROMPT_VERSION, lambda: generate_destinations(), max_age=POPULAR_MAX_AGE
    )
    return RecommendationsResponse(personalized=False, destinations=destinations)


def get_for_user(db: Session, user_id: str) -> RecommendationsResponse:
    """Personalized picks if the user has filled in their profile, otherwise popular destinations."""
    row = db.get(TravelProfile, user_id)
    profile = TravelProfileData.model_validate(row.data) if row else None
    if profile is None or not has_preferences(profile):
        return get_popular(db)

    destinations = _cached_or_generate(
        db, f"user:{user_id}", _profile_fingerprint(profile), lambda: generate_destinations(profile)
    )
    return RecommendationsResponse(personalized=True, destinations=destinations)
