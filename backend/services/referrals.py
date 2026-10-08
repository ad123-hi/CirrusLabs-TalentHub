from __future__ import annotations

from calendar import monthrange
from datetime import date, datetime
from uuid import uuid4

from backend.config.db import create_audit_log, get_referral, list_referrals, update_referral


def parse_iso_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def add_months(value: str, months: int) -> str:
    base = parse_iso_date(value)
    month_index = base.month - 1 + months
    year = base.year + month_index // 12
    month = month_index % 12 + 1
    day = min(base.day, monthrange(year, month)[1])
    return date(year, month, day).isoformat()


def refresh_referral_bonus_statuses(referrals: list[dict] | None = None) -> list[dict]:
    items = referrals if referrals is not None else list_referrals()
    today = date.today()
    refreshed: list[dict] = []

    for referral in items:
        next_referral = referral
        if (
            referral.get("joining_date")
            and referral.get("eligibility_date")
            and referral.get("bonus_status") == "Pending Eligibility"
            and today >= parse_iso_date(referral["eligibility_date"])
        ):
            next_referral = update_referral(
                referral["id"],
                {
                    "bonus_status": "Eligible",
                    "updated_at": datetime.utcnow().isoformat(),
                },
            ) or {**referral, "bonus_status": "Eligible"}
        refreshed.append(next_referral)

    return refreshed


def log_referral_change(actor_id: str, action: str, entity_id: str, old_value: dict | None, new_value: dict | None):
    create_audit_log(
        {
            "id": f"audit-{uuid4().hex[:10]}",
            "actor_id": actor_id,
            "action": action,
            "entity_type": "referral",
            "entity_id": entity_id,
            "old_value": old_value,
            "new_value": new_value,
            "created_at": datetime.utcnow().isoformat(),
        }
    )


def refresh_single_referral(referral_id: str) -> dict | None:
    referral = get_referral(referral_id)
    if referral is None:
        return None
    return refresh_referral_bonus_statuses([referral])[0]
