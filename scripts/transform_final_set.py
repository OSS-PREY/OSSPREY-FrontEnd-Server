#!/usr/bin/env python3
"""Transform public/final_set.csv into public/updated_react_set2.json.

Each CSV row becomes one actionable object. The `Features` key is derived from
the row's CATEGORY column (which may contain several categories separated by
" | "):

  - Social categories  -> social feature set (+ shared feature)
  - Any other category -> technical feature set (+ shared feature)

A row that carries both a social and a non-social category receives the union
of both feature sets. `st_num_dev` is shared by both social and technical
groups, so it is always included when either group applies.

The output schema mirrors the keys consumed by the front-end
(src/views/dashboard/Actionables.vue + src/stores/projectStore.js):

  title, importance, category, Features, positive_impact, evidence,
  confidence_score, refs[{link, venue}]
"""

import csv
import json
import os

# -------------------- Feature groups (from product requirements) --------------------
SOCIAL_FEATURES = [
    "s_num_nodes",
    "s_avg_clustering_coef",
    "s_graph_density",
    "s_num_component",
    "s_weighted_mean_degree",
    "s_net_overlap",
]

TECHNICAL_FEATURES = [
    "t_graph_density",
    "t_num_dev_per_file",
    "t_num_dev_nodes",
    "t_num_file_nodes",
    "t_num_file_per_dev",
    "t_net_overlap",
]

# Shared between social and technical groups.
SHARED_FEATURES = ["st_num_dev"]

# Categories that map to the SOCIAL feature set. Everything else is TECHNICAL.
SOCIAL_CATEGORIES = {
    "New Contributor Onboarding and Involvement",
    "Community Collaboration and Engagement",
}

CATEGORY_SEPARATOR = "|"


def parse_categories(raw_category):
    """Split the CATEGORY cell into individual, trimmed category names."""
    if not raw_category:
        return []
    return [c.strip() for c in raw_category.split(CATEGORY_SEPARATOR) if c.strip()]


def assign_features(categories):
    """Return the de-duplicated, ordered feature list for the given categories."""
    has_social = any(c in SOCIAL_CATEGORIES for c in categories)
    has_technical = any(c not in SOCIAL_CATEGORIES for c in categories)

    ordered = []
    if has_social:
        ordered += SOCIAL_FEATURES + SHARED_FEATURES
    if has_technical:
        ordered += TECHNICAL_FEATURES + SHARED_FEATURES

    seen = set()
    deduped = []
    for feature in ordered:
        if feature not in seen:
            seen.add(feature)
            deduped.append(feature)
    return deduped


def to_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def to_int(value, default=0):
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def transform_row(row):
    categories = parse_categories(row.get("CATEGORY", ""))
    features = assign_features(categories)

    link = (row.get("article_link") or "").strip()
    venue = (row.get("venue") or "").strip()
    refs = []
    if link:
        ref = {"link": link}
        if venue:
            ref["venue"] = venue
        refs.append(ref)

    return {
        "title": (row.get("actionable") or "").strip(),
        # No explicit importance column exists; `support` (model-agreement count)
        # is the closest priority signal.
        "importance": to_int(row.get("support")),
        "category": (row.get("CATEGORY") or "").strip(),
        "Features": ", ".join(features),
        "positive_impact": (row.get("impact") or "").strip(),
        "evidence": (row.get("evidence") or "").strip(),
        "confidence_score": to_float(row.get("avg_confidence")),
        "refs": refs,
    }


def main():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_path = os.path.join(repo_root, "public", "final_set.csv")
    json_path = os.path.join(repo_root, "public", "updated_react_set2.json")

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        records = []
        for row in reader:
            record = transform_row(row)
            if record["title"]:
                records.append(record)

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)

    print(f"Wrote {len(records)} actionables -> {json_path}")


if __name__ == "__main__":
    main()
