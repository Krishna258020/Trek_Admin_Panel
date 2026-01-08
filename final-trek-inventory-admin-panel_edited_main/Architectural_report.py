import os
import re
import json
from collections import defaultdict

# ---------------- CONFIG ----------------
SKIP_DIRS = {
    "node_modules", "venv", ".venv", "__pycache__", ".git",
    "dist", "build", ".next", ".output"
}

CODE_EXTENSIONS = (".js", ".jsx", ".ts", ".tsx", ".py")

IMPORT_PATTERNS = [
    re.compile(r'import\s+.*?\s+from\s+[\'"](.+?)[\'"]'),
    re.compile(r'import\s+[\'"](.+?)[\'"]'),
    re.compile(r'require\([\'"](.+?)[\'"]\)'),
    re.compile(r'from\s+(.+?)\s+import'),
]

ENV_PATTERNS = [
    re.compile(r'process\.env\.([A-Z0-9_]+)'),
    re.compile(r'import\.meta\.env\.([A-Z0-9_]+)')
]

FETCH_PATTERNS = [
    re.compile(r'fetch\([\'"](.+?)[\'"]'),
    re.compile(r'axios\.(get|post|put|delete)\([\'"](.+?)[\'"]')
]

ROUTE_PATTERNS = [
    re.compile(r'app\.(get|post|put|delete)\([\'"](.+?)[\'"]'),
    re.compile(r'router\.(get|post|put|delete)\([\'"](.+?)[\'"]')
]

# ---------------- CORE SCAN ----------------
def scan_repo(root):
    imports = defaultdict(list)
    env_vars = defaultdict(set)
    routes = defaultdict(list)
    frontend_calls = set()
    files_by_layer = defaultdict(list)

    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]

        for file in filenames:
            if not file.endswith(CODE_EXTENSIONS):
                continue

            path = os.path.join(dirpath, file)
            rel = os.path.relpath(path, root)

            layer = detect_layer(rel)
            files_by_layer[layer].append(rel)

            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
            except:
                continue

            # Imports
            for pattern in IMPORT_PATTERNS:
                for m in pattern.findall(content):
                    imports[rel].append(m)

            # Env vars
            for pattern in ENV_PATTERNS:
                for m in pattern.findall(content):
                    env_vars[layer].add(m)

            # Backend routes
            for pattern in ROUTE_PATTERNS:
                for method, route in pattern.findall(content):
                    routes["backend"].append([method.upper(), route])

            # Frontend API calls
            for pattern in FETCH_PATTERNS:
                for m in pattern.findall(content):
                    if isinstance(m, tuple):
                        frontend_calls.add(m[1])
                    else:
                        frontend_calls.add(m)

    return imports, env_vars, routes, frontend_calls, files_by_layer


# ---------------- HELPERS ----------------
def detect_layer(path):
    if path.startswith("src"):
        return "frontend"
    if "Backend" in path or "server" in path:
        return "backend"
    if "shared" in path:
        return "shared"
    if path.endswith(("config.ts", "config.js", "json")):
        return "config"
    return "other"


def detect_entries(root):
    entries = {}
    for p in ["src/index.tsx", "src/main.tsx"]:
        if os.path.exists(os.path.join(root, p)):
            entries["frontend"] = p
    for p in ["Backend/server.js", "server.js", "app.js"]:
        if os.path.exists(os.path.join(root, p)):
            entries["backend"] = p
    return entries


def infer_backend(frontend_calls):
    inferred = {
        "required_routes": sorted(frontend_calls),
        "required_env": ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"],
        "required_models": [],
        "required_tables": []
    }

    for route in frontend_calls:
        if "booking" in route:
            inferred["required_models"].append("Booking")
            inferred["required_tables"].append("bookings")

    return inferred


# ---------------- MAIN ----------------
def analyze_repo(root):
    imports, env_vars, routes, frontend_calls, layers = scan_repo(root)
    entries = detect_entries(root)

    repo_type = (
        "fullstack" if "frontend" in entries and "backend" in entries
        else "frontend-only" if "frontend" in entries
        else "backend-only"
    )

    result = {
        "repo": {
            "root": root,
            "type": repo_type
        },
        "entries": entries,
        "layers": layers,
        "imports": imports,
        "env": {k: sorted(v) for k, v in env_vars.items()},
        "routes": {
            "backend": routes.get("backend", []),
            "frontend_calls": sorted(frontend_calls)
        }
    }

    if repo_type == "frontend-only":
        result["backend_inferred"] = infer_backend(frontend_calls)

    return result


if __name__ == "__main__":
    ROOT = os.getcwd()
    output = analyze_repo(ROOT)

    with open("repo_architecture_report.json", "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)

    print("✅ Enterprise repo analysis complete")
    print("📄 Output: repo_architecture_report.json")
