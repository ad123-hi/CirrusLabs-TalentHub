from __future__ import annotations

import os
from copy import deepcopy
from typing import Any, cast, overload

import certifi
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from backend.models.job import Application, Job
from backend.models.referral import Referral
from backend.utils.security import hash_password

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

MONGODB_URI = os.getenv("MONGODB_URI") or os.getenv("DATABASE_URL")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "cirruslabs_talent")


ROLE_MAP = {
    "candidate": "employee",
    "employee": "employee",
    "recruiter": "hiring_manager",
    "hiring_manager": "hiring_manager",
}


def normalize_role(role: str | None) -> str:
    return ROLE_MAP.get((role or "").strip().lower(), "employee")


def _create_mongo_db():
    if not MONGODB_URI:
        return None, None

    try:
        client = MongoClient(
            MONGODB_URI,
            serverSelectionTimeoutMS=5000,
            tlsCAFile=certifi.where(),
        )
        client.admin.command("ping")
        return client, client[MONGODB_DB_NAME]
    except PyMongoError:
        return None, None


mongo_client, mongo_db = _create_mongo_db()
users_collection = cast(Collection[Any], mongo_db["users"] if mongo_db is not None else None)
candidates_collection = cast(Collection[Any], mongo_db["candidates"] if mongo_db is not None else None)
recruiters_collection = cast(Collection[Any], mongo_db["recruiters"] if mongo_db is not None else None)
jobs_collection = cast(Collection[Any], mongo_db["jobs"] if mongo_db is not None else None)
applications_collection = cast(Collection[Any], mongo_db["applications"] if mongo_db is not None else None)
referrals_collection = cast(Collection[Any], mongo_db["referrals"] if mongo_db is not None else None)
audit_logs_collection = cast(Collection[Any], mongo_db["audit_logs"] if mongo_db is not None else None)


DEFAULT_PASSWORD_HASH = hash_password("123456")

default_users = {
    "emp-101": {
        "id": "emp-101",
        "name": "Aditya",
        "email": "aditya@cirruslabs.io",
        "role": "employee",
        "password_hash": DEFAULT_PASSWORD_HASH,
        "auth_provider": "local",
        "status": "active",
    },
    "hm-101": {
        "id": "hm-101",
        "name": "Delivery Staffing",
        "email": "staffing@cirruslabs.io",
        "role": "hiring_manager",
        "password_hash": DEFAULT_PASSWORD_HASH,
        "auth_provider": "local",
        "status": "active",
    },
}

default_candidates = {
    "emp-101": {
        "user_id": "emp-101",
        "name": "Aditya",
        "email": "aditya@cirruslabs.io",
        "role": "employee",
        "phone": "",
        "skills": ["React", "JavaScript", "CSS"],
        "resume": "resume-link.pdf",
    }
}

default_recruiters = {
    "hm-101": {
        "user_id": "hm-101",
        "name": "Delivery Staffing",
        "email": "staffing@cirruslabs.io",
        "role": "hiring_manager",
        "company": "CirrusLabs",
        "phone": "",
    }
}

default_jobs = {
    "job-101": Job(
        id="job-101",
        title="Frontend Developer",
        company="CirrusLabs",
        location="Bangalore",
        type="Full-time",
        salary="Internal staffing band L2-L3",
        experience="2-4 years",
        description="Support internal product squads with reusable interfaces, REST API integration, and UI modernization across delivery accounts.",
        skills=["React", "JavaScript", "CSS"],
        recruiter_id="hm-101",
        recruiter_name="Delivery Staffing",
        status="Open",
    ).model_dump(),
    "job-102": Job(
        id="job-102",
        title="Backend Developer",
        company="CirrusLabs",
        location="Remote",
        type="Full-time",
        salary="Internal staffing band L2-L3",
        experience="3-5 years",
        description="Build internal platform APIs, improve service reliability, and support cross-team integrations for delivery engineering.",
        skills=["Python", "FastAPI", "MongoDB"],
        recruiter_id="hm-101",
        recruiter_name="Delivery Staffing",
        status="Open",
    ).model_dump(),
}

default_applications = {
    "app-1": Application(
        id="app-1",
        job_id="job-101",
        candidate_id="emp-101",
        candidate_name="Aditya",
        candidate_email="aditya@cirruslabs.io",
        candidate_phone="",
        job_title="Frontend Developer",
        company="CirrusLabs",
        status="Applied",
    ).model_dump()
}

default_referrals = {
    "ref-1": Referral(
        id="ref-1",
        job_id="job-101",
        job_title="Frontend Developer",
        job_location="Bangalore",
        recruiter_id="hm-101",
        recruiter_name="Delivery Staffing",
        referrer_id="emp-101",
        referrer_name="Aditya",
        referrer_email="aditya@cirruslabs.io",
        referred_employee_name="Rahul Kumar",
        referred_employee_email="rahul@cirruslabs.io",
        relationship_note="Worked together on client UI delivery and reusable component libraries.",
        resume="rahul-resume.pdf",
        referral_status="Joined",
        joining_date="2026-10-07",
        eligibility_date="2027-01-07",
        bonus_status="Pending Eligibility",
    ).model_dump(),
    "ref-2": Referral(
        id="ref-2",
        job_id="job-102",
        job_title="Backend Developer",
        job_location="Remote",
        recruiter_id="hm-101",
        recruiter_name="Delivery Staffing",
        referrer_id="emp-101",
        referrer_name="Aditya",
        referrer_email="aditya@cirruslabs.io",
        referred_employee_name="Priya Sharma",
        referred_employee_email="priya@cirruslabs.io",
        relationship_note="Strong API design and debugging skills from platform support projects.",
        resume="priya-resume.pdf",
        referral_status="Selected",
        bonus_status="Not Eligible",
    ).model_dump(),
}

memory_users = deepcopy(default_users)
memory_candidates = deepcopy(default_candidates)
memory_recruiters = deepcopy(default_recruiters)
memory_jobs = deepcopy(default_jobs)
memory_applications = deepcopy(default_applications)
memory_referrals = deepcopy(default_referrals)
memory_audit_logs: dict[str, dict] = {}


def mongo_enabled() -> bool:
    return mongo_db is not None


@overload
def _clean_document(document: None) -> None: ...


@overload
def _clean_document(document: dict) -> dict: ...


def _clean_document(document: dict | None) -> dict | None:
    if document is None:
        return None
    payload = dict(document)
    payload.pop("_id", None)
    return payload


def _normalize_user_document(document: dict | None) -> dict | None:
    if document is None:
        return None
    payload = dict(document)
    payload["role"] = normalize_role(payload.get("role"))
    payload["email"] = str(payload.get("email", "")).lower()
    return payload


def _normalize_candidate_profile(document: dict | None) -> dict | None:
    if document is None:
        return None
    payload = dict(document)
    payload["role"] = "employee"
    payload["email"] = str(payload.get("email", "")).lower()
    return payload


def _normalize_recruiter_profile(document: dict | None) -> dict | None:
    if document is None:
        return None
    payload = dict(document)
    payload["role"] = "hiring_manager"
    payload["email"] = str(payload.get("email", "")).lower()
    return payload


def _normalize_referral_document(document: dict | None) -> dict | None:
    if document is None:
        return None
    payload = dict(document)
    payload["referrer_email"] = str(payload.get("referrer_email", "")).lower()
    payload["referred_employee_email"] = str(payload.get("referred_employee_email", "")).lower()
    return payload


def _ensure_indexes():
    if not mongo_enabled():
        return
    users_collection.create_index("email", unique=True)
    candidates_collection.create_index("user_id", unique=True)
    recruiters_collection.create_index("user_id", unique=True)
    jobs_collection.create_index("id", unique=True)
    applications_collection.create_index([("candidate_id", 1), ("job_id", 1)], unique=True)
    referrals_collection.create_index("id", unique=True)
    referrals_collection.create_index([("job_id", 1), ("referrer_id", 1), ("referred_employee_email", 1)], unique=True)
    audit_logs_collection.create_index("entity_id")


def seed_defaults_if_needed():
    if mongo_enabled():
        _ensure_indexes()

        if users_collection.count_documents({}) == 0:
            users_collection.insert_many(deepcopy(list(default_users.values())))
        if candidates_collection.count_documents({}) == 0:
            candidates_collection.insert_many(deepcopy(list(default_candidates.values())))
        if recruiters_collection.count_documents({}) == 0:
            recruiters_collection.insert_many(deepcopy(list(default_recruiters.values())))
        if jobs_collection.count_documents({}) == 0:
            jobs_collection.insert_many(deepcopy(list(default_jobs.values())))
        if applications_collection.count_documents({}) == 0:
            applications_collection.insert_many(deepcopy(list(default_applications.values())))
        if referrals_collection.count_documents({}) == 0:
            referrals_collection.insert_many(deepcopy(list(default_referrals.values())))


def find_user_by_email(email: str) -> dict | None:
    lookup = str(email).lower()
    if mongo_enabled():
        document = _normalize_user_document(_clean_document(users_collection.find_one({"email": lookup})))
        if document is not None:
            return document
    return _normalize_user_document(
        deepcopy(next((user for user in memory_users.values() if user["email"] == lookup), None))
    )


def find_user_by_id(user_id: str) -> dict | None:
    if mongo_enabled():
        document = _normalize_user_document(_clean_document(users_collection.find_one({"id": user_id})))
        if document is not None:
            return document
    return _normalize_user_document(deepcopy(memory_users.get(user_id)))


def create_user(user_document: dict) -> dict:
    payload = deepcopy(user_document)
    payload["email"] = str(payload.get("email", "")).lower()
    payload["role"] = normalize_role(payload.get("role"))
    if mongo_enabled():
        users_collection.insert_one(payload)
        return _normalize_user_document(payload) or payload
    memory_users[payload["id"]] = payload
    return _normalize_user_document(deepcopy(payload)) or payload


def update_user(user_id: str, updates: dict) -> dict | None:
    payload = deepcopy(updates)
    if "role" in payload:
        payload["role"] = normalize_role(payload["role"])
    if "email" in payload:
        payload["email"] = str(payload["email"]).lower()
    if mongo_enabled():
        users_collection.update_one({"id": user_id}, {"$set": payload})
        return _normalize_user_document(_clean_document(users_collection.find_one({"id": user_id})))
    if user_id not in memory_users:
        return None
    memory_users[user_id].update(payload)
    return _normalize_user_document(deepcopy(memory_users[user_id]))


def ensure_candidate_profile(profile_document: dict) -> dict:
    payload = deepcopy(profile_document)
    payload["role"] = "employee"
    payload["email"] = str(payload.get("email", "")).lower()
    if mongo_enabled():
        candidates_collection.update_one({"user_id": payload["user_id"]}, {"$set": payload}, upsert=True)
        return _normalize_candidate_profile(_clean_document(candidates_collection.find_one({"user_id": payload["user_id"]}))) or payload
    memory_candidates[payload["user_id"]] = {**memory_candidates.get(payload["user_id"], {}), **payload}
    return _normalize_candidate_profile(deepcopy(memory_candidates[payload["user_id"]])) or payload


def ensure_recruiter_profile(profile_document: dict) -> dict:
    payload = deepcopy(profile_document)
    payload["role"] = "hiring_manager"
    payload["email"] = str(payload.get("email", "")).lower()
    if mongo_enabled():
        recruiters_collection.update_one({"user_id": payload["user_id"]}, {"$set": payload}, upsert=True)
        return _normalize_recruiter_profile(_clean_document(recruiters_collection.find_one({"user_id": payload["user_id"]}))) or payload
    memory_recruiters[payload["user_id"]] = {**memory_recruiters.get(payload["user_id"], {}), **payload}
    return _normalize_recruiter_profile(deepcopy(memory_recruiters[payload["user_id"]])) or payload


def get_candidate_profile(user_id: str) -> dict | None:
    if mongo_enabled():
        document = _normalize_candidate_profile(_clean_document(candidates_collection.find_one({"user_id": user_id})))
        if document is not None:
            return document
    return _normalize_candidate_profile(deepcopy(memory_candidates.get(user_id)))


def get_recruiter_profile(user_id: str) -> dict | None:
    if mongo_enabled():
        document = _normalize_recruiter_profile(_clean_document(recruiters_collection.find_one({"user_id": user_id})))
        if document is not None:
            return document
    return _normalize_recruiter_profile(deepcopy(memory_recruiters.get(user_id)))


def update_candidate_profile(user_id: str, updates: dict) -> dict | None:
    if mongo_enabled():
        candidates_collection.update_one({"user_id": user_id}, {"$set": updates})
        return _normalize_candidate_profile(_clean_document(candidates_collection.find_one({"user_id": user_id})))
    if user_id not in memory_candidates:
        return None
    memory_candidates[user_id].update(updates)
    return _normalize_candidate_profile(deepcopy(memory_candidates[user_id]))


def update_recruiter_profile(user_id: str, updates: dict) -> dict | None:
    if mongo_enabled():
        recruiters_collection.update_one({"user_id": user_id}, {"$set": updates})
        return _normalize_recruiter_profile(_clean_document(recruiters_collection.find_one({"user_id": user_id})))
    if user_id not in memory_recruiters:
        return None
    memory_recruiters[user_id].update(updates)
    return _normalize_recruiter_profile(deepcopy(memory_recruiters[user_id]))


def list_jobs(search_term: str = "", location: str = "", recruiter_id: str | None = None) -> list[dict]:
    if mongo_enabled():
        query: dict = {}
        if recruiter_id:
            query["recruiter_id"] = recruiter_id
        if search_term:
            query["title"] = {"$regex": search_term, "$options": "i"}
        if location:
            query["location"] = {"$regex": location, "$options": "i"}
        documents = [_clean_document(item) for item in jobs_collection.find(query).sort("created_at", -1)]
        if documents:
            return documents

    items = list(memory_jobs.values())
    if recruiter_id:
        items = [item for item in items if item.get("recruiter_id") == recruiter_id]
    if search_term:
        items = [item for item in items if search_term.lower() in item.get("title", "").lower()]
    if location:
        items = [item for item in items if location.lower() in item.get("location", "").lower()]
    return deepcopy(items)


def get_job(job_id: str) -> dict | None:
    if mongo_enabled():
        document = _clean_document(jobs_collection.find_one({"id": job_id}))
        if document is not None:
            return document
    return deepcopy(memory_jobs.get(job_id))


def create_job(job_document: dict) -> dict:
    payload = deepcopy(job_document)
    if mongo_enabled():
        jobs_collection.insert_one(payload)
        return payload
    memory_jobs[payload["id"]] = payload
    return deepcopy(payload)


def update_job(job_id: str, updates: dict) -> dict | None:
    if mongo_enabled():
        jobs_collection.update_one({"id": job_id}, {"$set": updates})
        return _clean_document(jobs_collection.find_one({"id": job_id}))
    if job_id not in memory_jobs:
        return None
    memory_jobs[job_id].update(updates)
    return deepcopy(memory_jobs[job_id])


def delete_job(job_id: str) -> bool:
    if mongo_enabled():
        result = jobs_collection.delete_one({"id": job_id})
        return result.deleted_count > 0
    return memory_jobs.pop(job_id, None) is not None


def list_applications(candidate_id: str | None = None, job_id: str | None = None) -> list[dict]:
    if mongo_enabled():
        query: dict = {}
        if candidate_id:
            query["candidate_id"] = candidate_id
        if job_id:
            query["job_id"] = job_id
        documents = [_clean_document(item) for item in applications_collection.find(query).sort("applied_at", -1)]
        if documents:
            return documents

    items = list(memory_applications.values())
    if candidate_id:
        items = [item for item in items if item.get("candidate_id") == candidate_id]
    if job_id:
        items = [item for item in items if item.get("job_id") == job_id]
    return deepcopy(items)


def find_application(candidate_id: str, job_id: str) -> dict | None:
    if mongo_enabled():
        document = _clean_document(applications_collection.find_one({"candidate_id": candidate_id, "job_id": job_id}))
        if document is not None:
            return document
    return deepcopy(
        next(
            (
                application
                for application in memory_applications.values()
                if application["candidate_id"] == candidate_id and application["job_id"] == job_id
            ),
            None,
        )
    )


def get_application(application_id: str) -> dict | None:
    if mongo_enabled():
        document = _clean_document(applications_collection.find_one({"id": application_id}))
        if document is not None:
            return document
    return deepcopy(memory_applications.get(application_id))


def create_application(application_document: dict) -> dict:
    payload = deepcopy(application_document)
    if mongo_enabled():
        applications_collection.insert_one(payload)
        return payload
    memory_applications[payload["id"]] = payload
    return deepcopy(payload)


def update_application(application_id: str, updates: dict) -> dict | None:
    if mongo_enabled():
        applications_collection.update_one({"id": application_id}, {"$set": updates})
        return _clean_document(applications_collection.find_one({"id": application_id}))
    if application_id not in memory_applications:
        return None
    memory_applications[application_id].update(updates)
    return deepcopy(memory_applications[application_id])


def count_applications_for_job(job_id: str) -> int:
    if mongo_enabled():
        return applications_collection.count_documents({"job_id": job_id})
    return len([item for item in memory_applications.values() if item["job_id"] == job_id])


def list_referrals(referrer_id: str | None = None, recruiter_id: str | None = None) -> list[dict]:
    if mongo_enabled():
        query: dict = {}
        if referrer_id:
            query["referrer_id"] = referrer_id
        if recruiter_id:
            query["recruiter_id"] = recruiter_id
        documents = [_normalize_referral_document(_clean_document(item)) for item in referrals_collection.find(query).sort("created_at", -1)]
        return [item for item in documents if item is not None]

    items = list(memory_referrals.values())
    if referrer_id:
        items = [item for item in items if item.get("referrer_id") == referrer_id]
    if recruiter_id:
        items = [item for item in items if item.get("recruiter_id") == recruiter_id]
    return [_normalize_referral_document(deepcopy(item)) for item in items if item is not None]


def get_referral(referral_id: str) -> dict | None:
    if mongo_enabled():
        document = _normalize_referral_document(_clean_document(referrals_collection.find_one({"id": referral_id})))
        if document is not None:
            return document
    return _normalize_referral_document(deepcopy(memory_referrals.get(referral_id)))


def find_referral(job_id: str, referrer_id: str, referred_employee_email: str) -> dict | None:
    email = str(referred_employee_email).lower()
    if mongo_enabled():
        document = _normalize_referral_document(
            _clean_document(
                referrals_collection.find_one(
                    {"job_id": job_id, "referrer_id": referrer_id, "referred_employee_email": email}
                )
            )
        )
        if document is not None:
            return document
    return _normalize_referral_document(
        deepcopy(
            next(
                (
                    item
                    for item in memory_referrals.values()
                    if item["job_id"] == job_id
                    and item["referrer_id"] == referrer_id
                    and item["referred_employee_email"] == email
                ),
                None,
            )
        )
    )


def create_referral(referral_document: dict) -> dict:
    payload = deepcopy(referral_document)
    payload["referrer_email"] = str(payload.get("referrer_email", "")).lower()
    payload["referred_employee_email"] = str(payload.get("referred_employee_email", "")).lower()
    if mongo_enabled():
        referrals_collection.insert_one(payload)
        return _normalize_referral_document(payload) or payload
    memory_referrals[payload["id"]] = payload
    return _normalize_referral_document(deepcopy(payload)) or payload


def update_referral(referral_id: str, updates: dict) -> dict | None:
    payload = deepcopy(updates)
    if "referrer_email" in payload:
        payload["referrer_email"] = str(payload["referrer_email"]).lower()
    if "referred_employee_email" in payload:
        payload["referred_employee_email"] = str(payload["referred_employee_email"]).lower()
    if mongo_enabled():
        referrals_collection.update_one({"id": referral_id}, {"$set": payload})
        return _normalize_referral_document(_clean_document(referrals_collection.find_one({"id": referral_id})))
    if referral_id not in memory_referrals:
        return None
    memory_referrals[referral_id].update(payload)
    return _normalize_referral_document(deepcopy(memory_referrals[referral_id]))


def create_audit_log(log_document: dict) -> dict:
    payload = deepcopy(log_document)
    if mongo_enabled():
        audit_logs_collection.insert_one(payload)
        return payload
    memory_audit_logs[payload["id"]] = payload
    return deepcopy(payload)


def list_audit_logs(entity_id: str) -> list[dict]:
    if mongo_enabled():
        return [_clean_document(item) for item in audit_logs_collection.find({"entity_id": entity_id}).sort("created_at", -1)]
    return deepcopy([item for item in memory_audit_logs.values() if item.get("entity_id") == entity_id])


seed_defaults_if_needed()
