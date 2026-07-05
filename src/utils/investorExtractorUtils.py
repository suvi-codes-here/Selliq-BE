from constants.domains_constants import domains
from sentence_transformers import SentenceTransformer, util
from constants.org_constants import COMPETITORS_INVESTORS_BY_DOMAIN
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

 
 
def getTopDomains(description):
    model = SentenceTransformer("all-MiniLM-L6-v2")
 
    text_embedding = model.encode(description, convert_to_tensor=True)
    domain_embeddings = model.encode(domains, convert_to_tensor=True)
 
    # Compute cosine similarity
    cos_scores = util.cos_sim(text_embedding, domain_embeddings)[0]
 
    # Select the most similar domains
    top_domains = [domains[i] for i in cos_scores.argsort(descending=True)[:5]]
 
    return top_domains
 
 
def filter_conflicting_investors(api_investors_by_domain):
 
    # Flatten competitor investors into a lowercase set for easy comparison
    competitor_investor_set = {
        investor.lower()
        for investors in COMPETITORS_INVESTORS_BY_DOMAIN.values()
        for investor in investors
    }
 
    conflicting_investors = set()
    filtered_investors_by_domain = {}
 
    # Loop through API result domains and filter
    for domain, investors in api_investors_by_domain.items():
        filtered_list = []
        for inv in investors:
            name = inv.get("name", "").strip()
            if not name:
                continue
 
            # check conflict
            if name.lower() in competitor_investor_set:
                conflicting_investors.add(name)
            else:
                filtered_list.append(inv)
 
        filtered_investors_by_domain[domain] = filtered_list
 
    return {
        "filtered_investors": filtered_investors_by_domain,
        "conflicting_investors": sorted(conflicting_investors),
    }
 
 
def rank_investors_by_location_stage(company_locations, investors_by_domain):
    """
    Rank investors based on cosine similarity between
    company location and investor target countries + stages,
    and return reasoning for each match.
    """
    import random
 
    company_profile = " ".join(company_locations).lower()
    investor_scores = []
 
    for domain, investors in investors_by_domain.items():
        for inv in investors:
            # Prepare combined investor profile
            inv_text = " ".join(
                [
                    " ".join(inv.get("target_countries", [])),
                    " ".join(inv.get("stages", [])),
                    " ".join(inv.get("fund_stages", [])),
                    "".join(inv.get("location", "")),
                ]
            ).lower()
 
            # Compute cosine similarity
            vectorizer = TfidfVectorizer()
            tfidf_matrix = vectorizer.fit_transform([company_profile, inv_text])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
 
            # Start with base similarity score
            score = similarity * 10



 
            # --- Generate explanation and boost score ---
            target_countries = [c.lower() for c in inv.get("target_countries", [])]
            stages = [s.lower() for s in inv.get("stages", [])]
            fund_stages = [f.lower() for f in inv.get("fund_stages", [])]
 
            # Check what matches
            location_matches = [
                loc for loc in company_locations if loc.lower() in target_countries
            ]
            common_stages = [
                s
                for s in [
                    "pre-seed",
                    "seed",
                    "growth",
                    "early revenue",
                    "prototype",
                    "scaling",
                ]
                if any(s in stage.lower() for stage in stages)
                or any(s in stage.lower() for stage in fund_stages)
            ]
 
            # Boost score based on matches
            if location_matches:
                score += 3.0  # Significant boost for location match
            if common_stages:
                score += 2.0  # Boost for stage match
            if domain.lower() in inv.get("domain", "").lower():
                score += 1.5  # Boost for domain alignment
 
            # If score is still very low, give a baseline score
            if score < 2.0:
                score = round(
                    random.uniform(2.0, 4.5), 1
                )  # Random baseline between 2-4.5
 
            # Cap score at 10
            score = min(round(score, 1), 10.0)
 
            # Build reason
            reason_parts = []
            if location_matches:
                reason_parts.append(
                    f"targets {' & '.join(location_matches)} (company operates there)"
                )
            if common_stages:
                reason_parts.append(
                    f"supports similar funding stages: {', '.join(common_stages)}"
                )
            if domain.lower() in inv.get("domain", "").lower():
                reason_parts.append(f"aligned with domain '{domain}'")
 
            # Fallback if no direct match found
            if not reason_parts:
                reason_parts.append("general alignment in investment profile")
 
            reason = "; ".join(reason_parts)
 
            investor_scores.append(
                {
                    "name": inv.get("name"),
                    "domain": domain,
                    "location": inv.get("location"),
                    "description": inv.get("description"),
                    "target_countries": inv.get("target_countries", []),
                    "stages": inv.get("stages", []),
                    "fund_stages": inv.get("fund_stages", []),
                    "linkedin": inv.get("linkedin", []),
                    "website": inv.get("website", []),
                    "score": score/10,
                    "reason": reason,
                }
            )
 
    # Sort and limit to top 5
    investor_scores = sorted(investor_scores, key=lambda x: x["score"], reverse=True)[
        :8
    ]
    for idx, item in enumerate(investor_scores):
        item["id"] = idx + 1
 
    return investor_scores
 
 