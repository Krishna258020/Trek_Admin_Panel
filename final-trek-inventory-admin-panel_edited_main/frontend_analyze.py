import os
import re
import json
from collections import defaultdict

SKIP_DIRS = {
    "node_modules", "venv", ".venv", "__pycache__", ".git",
    "dist", "build", ".next"
}

CODE_EXTENSIONS = (".ts", ".tsx", ".js", ".jsx")

FETCH_PATTERNS = [
    re.compile(r'fetch\(\s*[`\'"](.+?)[`\'"]'),
    re.compile(r'axios\.(get|post|put|delete)\(\s*[`\'"](.+?)[`\'"]')
]

QUERY_PATTERN = re.compile(r'new URLSearchParams\(\s*{([^}]+)}')
HEADER_PATTERN = re.compile(r'headers\s*:\s*{([^}]+)}')
FIELD_ACCESS_PATTERN = re.compile(r'\.(\w+)')

# ---------------- CORE ----------------
def scan_frontend(root):
    api_calls = defaultdict(lambda: {
        "method": "GET",
        "called_from": [],
        "query_params": set(),
        "headers": set(),
        "response_fields": set()
    })

    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]

        for file in filenames:
            if not file.endswith(CODE_EXTENSIONS):
                continue

            path = os.path.join(dirpath, file)
            rel = os.path.relpath(path, root)

            try:
                content = open(path, encoding="utf-8", errors="ignore").read()
            except:
                continue

            # Detect API calls
            for pattern in FETCH_PATTERNS:
                for match in pattern.findall(content):
                    if isinstance(match, tuple):
                        method, url = match
                        method = method.upper()
                    else:
                        url = match
                        method = "GET"

                    api_calls[url]["method"] = method
                    api_calls[url]["called_from"].append(rel)

                    # Query params
                    for q in QUERY_PATTERN.findall(content):
                        keys = re.findall(r'(\w+)\s*:', q)
                        api_calls[url]["query_params"].update(keys)

                    # Headers
                    for h in HEADER_PATTERN.findall(content):
                        keys = re.findall(r'(\w+)\s*:', h)
                        api_calls[url]["headers"].update(keys)

                    # Response usage
                    for field in FIELD_ACCESS_PATTERN.findall(content):
                        if field not in {"map", "filter", "length"}:
                            api_calls[url]["response_fields"].add(field)

    return api_calls


# ---------------- BACKEND INFERENCE ----------------
def infer_backend(api_calls):
    files = {
        "routes": set(),
        "controllers": set(),
        "services": set(),
        "models": set(),
        "middleware": {"auth.js"},
        "config": {"db.js"}
    }

    entities = defaultdict(set)

    for route in api_calls:
        if "booking" in route:
            files["routes"].add("bookingRoutes.js")
            files["controllers"].add("bookingController.js")
            files["services"].add("bookingService.js")
            files["services"].add("taxService.js")
            files["models"].add("Booking.js")

            entities["Booking"].update({
                "id", "tbrId", "vendorId",
                "trekCompanyName", "completedDate",
                "basefare", "status"
            })
            entities["Tax"].update({
                "gst", "commissionGst",
                "tcs", "tds", "totalLiability"
            })

    return files, entities


# ---------------- MAIN ----------------
def build_backend_contract(root):
    api_calls = scan_frontend(root)
    files, entities = infer_backend(api_calls)

    output = {
        "backend_required": {
            "routes": {},
            "entities": {},
            "files_to_create": {},
            "env_required": [
                "DB_HOST",
                "DB_USER",
                "DB_PASSWORD",
                "DB_NAME",
                "JWT_SECRET"
            ]
        }
    }

    for url, meta in api_calls.items():
        output["backend_required"]["routes"][url] = {
            "method": meta["method"],
            "called_from": meta["called_from"],
            "query_params": sorted(meta["query_params"]),
            "headers": sorted(meta["headers"]),
            "response_fields": sorted(meta["response_fields"])
        }

    for entity, fields in entities.items():
        output["backend_required"]["entities"][entity] = {
            "fields": sorted(fields)
        }

    for k, v in files.items():
        output["backend_required"]["files_to_create"][k] = sorted(v)

    return output


if __name__ == "__main__":
    ROOT = os.getcwd()
    contract = build_backend_contract(ROOT)

    with open("backend_contract.json", "w", encoding="utf-8") as f:
        json.dump(contract, f, indent=2)

    print("✅ Backend contract generated")
    print("📄 Output: backend_contract.json")
