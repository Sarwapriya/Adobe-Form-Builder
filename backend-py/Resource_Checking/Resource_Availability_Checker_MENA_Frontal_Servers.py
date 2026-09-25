#!/usr/bin/env python3
"""
Resource Availability Checker - 4 MENA Frontal Servers
---------------------------------------------------------
Paste in tracking resource references (full tracking URLs, full/partial file
paths, or bare filenames - any mix, any file type: .png, .gif, .html, .js, etc.)
and this script will:

1. Extract just the resource filename from each line, however it was given.
2. Build the equivalent URL on each of the 4 MENA frontal servers.
3. Hit every generated URL IN PARALLEL and record the HTTP status.
4. Print a clean SUMMARY to the console only.
5. Write full, detailed, line-by-line logs to a log file (not the console).
6. Save a full results CSV and a failed-only CSV for follow-up.

Usage:
    python "Resource_Availability_Checker_MENA_Frontal_Servers.py"

Then paste your list of paths/URLs/filenames, one per line. When done pasting,
enter a blank line (press Enter on an empty line) to start the check.

You can also pipe input in, e.g.:
    cat paths.txt | python "Resource_Availability_Checker_MENA_Frontal_Servers.py"
"""

import re
import sys
import csv
import os
import tempfile
import logging
import concurrent.futures
from datetime import datetime

try:
    import requests
except ImportError:
    sys.exit("This script requires the 'requests' package. Install it with:\n    pip install requests")

# ----------------------------------------------------------------------
# Configuration
# ----------------------------------------------------------------------

# The 4 MENA frontal servers. URL = https://{host}.campaign.adobe.com/res/tracking/{filename}
HOSTS = [
    "samsung-mena-mid-prod7-1",
    "samsung-mena-mid-prod8-1",
    "samsung-mena-mid-prod7-2",
    "samsung-mena-mid-prod8-2",
]

URL_TEMPLATE = "https://{host}.campaign.adobe.com/res/tracking/{filename}"

REQUEST_TIMEOUT = 6        # seconds, per request
MAX_WORKERS = 40           # how many requests run in parallel at once

RUN_STAMP = datetime.now().strftime("%Y%m%d_%H%M%S")
BASE_NAME = f"Resource_Availability_Checker_4_MENA_Frontal_Servers_{RUN_STAMP}"

# Save directly to the system temp folder - avoids any permission issues
# tied to the script's own folder or whatever the working directory happens
# to be (e.g. System32 when launched certain ways).
OUTPUT_DIR = tempfile.gettempdir()

RESULTS_CSV = os.path.join(OUTPUT_DIR, f"{BASE_NAME}_Results.csv")
FAILED_CSV = os.path.join(OUTPUT_DIR, f"{BASE_NAME}_Failed.csv")
LOG_FILE = os.path.join(OUTPUT_DIR, f"{BASE_NAME}_Log.txt")

# Matches a filename with ANY extension (image, html, js, css, whatever),
# whether the input line is a full URL, a full file path, or just a bare
# filename on its own. Captures the last path segment ending in ".ext".
FILENAME_PATTERN = re.compile(r"([^/\\?#\s]+\.[A-Za-z0-9]{1,10})(?:[?#].*)?$")

# ANSI colors for console highlighting (summary only)
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"
BOLD = "\033[1m"


# ----------------------------------------------------------------------
# Logging setup: DETAILED output goes to the log file only.
# The console only ever gets progress + the final summary (printed directly).
# ----------------------------------------------------------------------

logger = logging.getLogger("resource_availability_checker")
logger.setLevel(logging.INFO)
logger.propagate = False  # never bubble up to console

_file_handler = logging.FileHandler(LOG_FILE, encoding="utf-8")
_file_handler.setFormatter(logging.Formatter("%(asctime)s | %(message)s", "%Y-%m-%d %H:%M:%S"))
logger.addHandler(_file_handler)


# ----------------------------------------------------------------------
# Core logic
# ----------------------------------------------------------------------

def read_pasted_input():
    """Read multi-line pasted input from stdin. Stops at first blank line or EOF."""
    print("Paste your tracking resource paths/URLs/filenames below (one per line).")
    print("Any file type is fine: .png, .gif, .html, .js, etc.")
    print("Press Enter on an empty line when you're done:\n")

    lines = []
    for line in sys.stdin:
        stripped = line.rstrip("\n")
        if stripped.strip() == "":
            break
        lines.append(stripped)
    return lines


def extract_filename(line: str):
    """
    Extract just the resource filename from a line, regardless of whether
    it's a full tracking URL, a full/partial file path, or already just a
    bare filename (e.g. 'FF_OC_F2H26.html'). Any extension is accepted.
    """
    match = FILENAME_PATTERN.search(line.strip())
    return match.group(1) if match else None


def build_urls(filename: str):
    """Build the full tracking URL for every configured MENA frontal server."""
    return [URL_TEMPLATE.format(host=host, filename=filename) for host in HOSTS]


def check_url(url: str) -> dict:
    """Hit a URL and return status info. Any exception is treated as unavailable."""
    result = {"url": url, "status_code": None, "ok": False, "elapsed_ms": None, "error": None}
    try:
        resp = requests.head(url, timeout=REQUEST_TIMEOUT, allow_redirects=True)
        if resp.status_code in (405, 501):  # server doesn't support HEAD - fall back to GET
            resp = requests.get(url, timeout=REQUEST_TIMEOUT, allow_redirects=True, stream=True)
            resp.close()
        result["status_code"] = resp.status_code
        result["ok"] = resp.ok
        result["elapsed_ms"] = round(resp.elapsed.total_seconds() * 1000, 1)
    except requests.exceptions.RequestException as exc:
        result["error"] = str(exc)
    return result


def process_lines(lines: list[str]) -> list[dict]:
    """Extract filenames, de-duplicate, check all URLs in parallel, log everything."""
    filename_to_lines: dict[str, list[str]] = {}
    unresolved = []

    for line in lines:
        if not line.strip():
            continue
        filename = extract_filename(line)
        if not filename:
            unresolved.append(line)
            logger.info(f"UNRECOGNIZED LINE (no filename found): {line}")
            continue
        filename_to_lines.setdefault(filename, []).append(line)

    unique_filenames = sorted(filename_to_lines.keys())
    url_to_filename = {}
    for filename in unique_filenames:
        for url in build_urls(filename):
            url_to_filename[url] = filename

    urls_to_check = sorted(url_to_filename.keys())
    total = len(urls_to_check)
    dup_count = sum(len(v) - 1 for v in filename_to_lines.values() if len(v) > 1)

    print(f"Found {len(unique_filenames)} unique resource(s) -> {total} unique URL(s) to check "
          f"(running up to {MAX_WORKERS} in parallel)...")
    if dup_count:
        print(f"  ({dup_count} duplicate input line(s) collapsed into their existing resource)")
    logger.info(f"Starting check: {len(lines)} input line(s), {len(unique_filenames)} unique "
                f"filename(s), {total} unique URL(s), {MAX_WORKERS} parallel workers.")

    status_by_url = {}
    completed = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_map = {executor.submit(check_url, url): url for url in urls_to_check}
        for future in concurrent.futures.as_completed(future_map):
            url = future_map[future]
            info = future.result()
            status_by_url[url] = info

            if info["error"]:
                logger.info(f"UNAVAILABLE | {url} | error={info['error']}")
            elif not info["ok"]:
                logger.info(f"HTTP {info['status_code']} | {url} | {info['elapsed_ms']} ms")
            else:
                logger.info(f"OK {info['status_code']} | {url} | {info['elapsed_ms']} ms")

            completed += 1
            if completed % 10 == 0 or completed == total:
                print(f"\r  Progress: {completed}/{total} URLs checked...", end="", flush=True)
    print()

    results = []
    for line in unresolved:
        results.append({
            "source_line": line, "filename": None, "url": None,
            "status_code": None, "ok": False, "elapsed_ms": None,
            "error": "Could not extract a filename from this line",
        })
    # One row per unique (filename, host) URL - never repeated, even if the
    # same filename/URL appeared on multiple input lines. source_line shows
    # the first occurrence, plus a count if it appeared more than once.
    for filename in unique_filenames:
        source_lines = filename_to_lines[filename]
        source_display = source_lines[0]
        if len(source_lines) > 1:
            source_display += f"  (+{len(source_lines) - 1} duplicate input line(s))"
        for url in build_urls(filename):
            info = status_by_url[url]
            results.append({
                "source_line": source_display, "filename": filename, "url": url,
                "status_code": info["status_code"], "ok": info["ok"],
                "elapsed_ms": info["elapsed_ms"], "error": info["error"],
            })
    return results


# ----------------------------------------------------------------------
# Output: console gets ONLY the summary. Everything else -> log file.
# ----------------------------------------------------------------------

def print_summary(results: list[dict]):
    checked = [r for r in results if r["filename"] is not None]
    unresolved_count = len(results) - len(checked)
    ok_count = sum(1 for r in checked if r["ok"])
    fail_count = len(checked) - ok_count

    print(f"\n{BOLD}Summary{RESET} — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  {GREEN}OK: {ok_count}{RESET}")
    print(f"  {RED}Failed/unavailable: {fail_count}{RESET}")
    if unresolved_count:
        print(f"  {YELLOW}Unrecognized input lines: {unresolved_count}{RESET}")

    if fail_count:
        print(f"\n{BOLD}Failed resources (by filename):{RESET}")
        failed_filenames = sorted({r["filename"] for r in checked if not r["ok"]})
        for fn in failed_filenames:
            hosts_failed = [r for r in checked if r["filename"] == fn and not r["ok"]]
            print(f"  {RED}- {fn}{RESET}  ({len(hosts_failed)} of {len(HOSTS)} server(s) failed)")

    print(f"\nOutput folder: {OUTPUT_DIR}")
    print(f"Detailed per-URL log: {LOG_FILE}")


def _write_csv(rows: list[dict], fieldnames: list[str], preferred_path: str):
    """Write rows to preferred_path (temp dir); retry with a fresh timestamped name if locked."""
    base = os.path.basename(preferred_path)
    stamp = datetime.now().strftime("%H%M%S")
    stem, dot, ext = base.rpartition(".")
    fallback_name = f"{stem}_{stamp}.{ext}" if dot else f"{base}_{stamp}"
    candidates = [preferred_path, os.path.join(tempfile.gettempdir(), fallback_name)]

    last_error = None
    for path in candidates:
        try:
            with open(path, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                for r in rows:
                    writer.writerow(r)
            return path
        except OSError as exc:
            last_error = exc
            continue

    logger.info(f"Failed to write CSV anywhere. Last error: {last_error}")
    return None


def save_csv(results: list[dict]):
    fieldnames = ["source_line", "filename", "url", "status_code", "ok", "elapsed_ms", "error"]
    written = _write_csv(results, fieldnames, RESULTS_CSV)
    if written:
        print(f"Full results CSV: {written}")
    else:
        print(f"{RED}Could not save results CSV (see log file for details).{RESET}")


def save_failed_csv(results: list[dict]):
    failed = [
        {
            "source_line": r["source_line"], "filename": r["filename"], "url": r["url"],
            "status_code": r["status_code"], "error": r["error"] or f"HTTP {r['status_code']}",
        }
        for r in results if not r["ok"]
    ]
    fieldnames = ["source_line", "filename", "url", "status_code", "error"]
    written = _write_csv(failed, fieldnames, FAILED_CSV)
    if written:
        print(f"Failed URLs CSV: {written}  ({len(failed)} entries)")
    else:
        print(f"{RED}Could not save failed-URLs CSV (see log file for details).{RESET}")


# ----------------------------------------------------------------------
# Entry point
# ----------------------------------------------------------------------

def main():
    lines = read_pasted_input()
    if not lines:
        print("No input received. Exiting.")
        return

    results = process_lines(lines)
    print_summary(results)
    save_csv(results)
    save_failed_csv(results)

    try:
        input("\nDone. Press Enter to close this window...")
    except EOFError:
        pass


if __name__ == "__main__":
    main()
