#!/usr/bin/env bash
# json-fix.sh — Validate and repair malformed JSON files (recursively if given a directory).
# Shell: bash (macOS & Linux)
# Requires: python3
# Optional: jq (for pretty output)
#
# Usage:
#   json-fix.sh [--check] [--in-place] [--backup] [--format] [--ext .json,.jsonc] [--python /path/to/python3] PATH...
#
# Examples:
#   json-fix.sh --check file.json
#   json-fix.sh --in-place --backup ./lessons
#   json-fix.sh --format --ext .json,.jsonc ./configs
#   json-fix.sh --python /opt/homebrew/bin/python3 lessons/

set -euo pipefail

print_usage() {
    echo "Usage: $(basename "$0") [--check] [--in-place] [--backup] [--format] [--ext .json,.jsonc] [--python /path/python3] PATH..."
    echo
    echo "  PATH may be a file or a directory (directories are processed recursively)."
    echo "  --check       Validate only; exit nonzero if any file is invalid."
    echo "  --in-place    Write fixed/pretty output back to the original files."
    echo "  --backup      With --in-place, also write a .bak copy first."
    echo "  --format      Pretty-print valid JSON (still attempts repair if invalid)."
    echo "  --ext         Comma-separated list of extensions to include (default: .json)."
    echo "  --python      Explicit path to python3 interpreter."
}

DO_CHECK=false
DO_INPLACE=false
DO_BACKUP=false
DO_FORMAT=false
EXT_LIST=".json"
PY_PATH=""
PATHS=()

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --check) DO_CHECK=true; shift ;;
        --in-place) DO_INPLACE=true; shift ;;
        --backup) DO_BACKUP=true; shift ;;
        --format) DO_FORMAT=true; shift ;;
        --ext) EXT_LIST="$2"; shift 2 ;;
        --python) PY_PATH="$2"; shift 2 ;;
        --help|-h) print_usage; exit 0 ;;
        --*) echo "Unknown option: $1" >&2; print_usage; exit 2 ;;
        *) PATHS+=("$1"); shift ;;
    esac
done

if [[ ${#PATHS[@]} -eq 0 ]]; then
    echo "No files or directories provided." >&2
    print_usage
    exit 1
fi

# Resolve python3 robustly
resolve_python() {
    if [[ -n "$PY_PATH" && -x "$PY_PATH" ]]; then
        echo "$PY_PATH"; return 0
    fi
    for p in /usr/bin/python3 /opt/homebrew/bin/python3 /usr/local/bin/python3 \
             /Library/Frameworks/Python.framework/Versions/3.12/bin/python3 \
             /Library/Frameworks/Python.framework/Versions/3.11/bin/python3; do
        [[ -x "$p" ]] && { echo "$p"; return 0; }
    done
    if command -v python3 >/dev/null 2>&1; then
        command -v python3
        return 0
    fi
    echo ""
    return 1
}

PY_BIN="$(resolve_python || true)"
if [[ -z "$PY_BIN" ]]; then
    echo "python3 not found. Provide it with --python /path/to/python3." >&2
    exit 127
fi

JQ_BIN=""
if command -v jq >/dev/null 2>&1; then
    JQ_BIN="$(command -v jq)"
fi

# Lowercase helper (portable to old bash)
to_lower() { tr '[:upper:]' '[:lower:]'; }

# Split EXT_LIST into a bash array (comma-separated), normalise to .ext (lowercase)
IFS=',' read -r -a EXT_ARR <<< "$EXT_LIST"
for i in "${!EXT_ARR[@]}"; do
    ext="${EXT_ARR[$i]}"
    ext="${ext// /}"
    [[ "${ext:0:1}" != "." ]] && ext=".$ext"
    EXT_ARR[$i]="$(printf "%s" "$ext" | to_lower)"
done

# Check if a file extension is in EXT_ARR
has_included_ext() {
    local f="$1"
    local base="${f##*/}"
    local ext=".${base##*.}"
    ext="$(printf "%s" "$ext" | to_lower)"
    local e
    for e in "${EXT_ARR[@]}"; do
        if [[ "$ext" == "$e" ]]; then
            return 0
        fi
    done
    return 1
}

# Python program that validates/repairs JSON. Invoked via heredoc.
# Modes: "format-only" or "repair"
run_python_repair() {
    local mode="$1"
    local path="$2"
    if [[ "$mode" == "format-only" ]]; then
        "$PY_BIN" - "$path" --format-only <<'PYCODE'
import io, json, sys, re, argparse

def strip_bom(s):
    return s[1:] if s and s[0] == "\ufeff" else s

def remove_comments(s):
    out=[];i=0;n=len(s);in_str=False;esc=False;quote=""
    while i<n:
        c=s[i]
        if in_str:
            out.append(c)
            if esc: esc=False
            elif c=="\\": esc=True
            elif c==quote: in_str=False
            i+=1
        else:
            if c in ("\"", "'"):
                in_str=True; quote=c; out.append(c); i+=1
            elif c=="/" and i+1<n and s[i+1]=="/":
                i+=2
                while i<n and s[i] not in ("\n","\r"): i+=1
            elif c=="/" and i+1<n and s[i+1]=="*":
                i+=2
                while i+1<n and not (s[i]=="*" and s[i+1]=="/"): i+=1
                i+=2 if i+1<n else 1
            else:
                out.append(c); i+=1
    return "".join(out)

def pretty(s):
    return json.dumps(json.loads(s), ensure_ascii=False, indent=2, sort_keys=False) + "\n"

ap=argparse.ArgumentParser(add_help=False)
ap.add_argument("path")
ap.add_argument("--format-only", action="store_true")
args=ap.parse_args()

with io.open(args.path, "r", encoding="utf-8", errors="replace") as f:
    raw=f.read()

try:
    json.loads(raw)
    sys.stdout.write(pretty(raw))
    sys.exit(0)
except Exception:
    sys.stderr.write("INVALID\n")
    sys.exit(3)
PYCODE
    else
        "$PY_BIN" - "$path" <<'PYCODE'
import io, json, sys, re, argparse

def load_json_strict(s): return json.loads(s)
def strip_bom(s): return s[1:] if s and s[0] == "\ufeff" else s

def remove_comments(s):
    out=[];i=0;n=len(s);in_str=False;esc=False;quote=""
    while i<n:
        c=s[i]
        if in_str:
            out.append(c)
            if esc: esc=False
            elif c=="\\": esc=True
            elif c==quote: in_str=False
            i+=1
        else:
            if c in ("\"", "'"):
                in_str=True; quote=c; out.append(c); i+=1
            elif c=="/" and i+1<n and s[i+1]=="/":
                i+=2
                while i<n and s[i] not in ("\n","\r"): i+=1
            elif c=="/" and i+1<n and s[i+1]=="*":
                i+=2
                while i+1<n and not (s[i]=="*" and s[i+1]=="/"): i+=1
                i+=2 if i+1<n else 1
            else:
                out.append(c); i+=1
    return "".join(out)

def remove_trailing_commas(s):
    out=[];i=0;n=len(s);in_str=False;esc=False;quote=""
    while i<n:
        c=s[i]
        if in_str:
            out.append(c)
            if esc: esc=False
            elif c=="\\": esc=True
            elif c==quote: in_str=False
            i+=1
        else:
            if c in ("\"", "'"):
                in_str=True; quote=c; out.append(c); i+=1
            elif c==",":
                j=i+1
                while j<n and s[j] in (" ","\t","\n","\r"): j+=1
                if j<n and s[j] in ("]","}"):
                    i+=1; continue
                out.append(c); i+=1
            else:
                out.append(c); i+=1
    return "".join(out)

def convert_single_quoted_strings(s):
    out=[];i=0;n=len(s);in_str=False;esc=False;quote=""
    while i<n:
        c=s[i]
        if not in_str:
            if c=="'":
                in_str=True; quote="'"; out.append("\""); i+=1
            elif c=="\"":
                in_str=True; quote="\""; out.append(c); i+=1
            else:
                out.append(c); i+=1
        else:
            if quote=="'":
                if c=="\\":
                    out.append(c); i+=1
                    if i<n: out.append(s[i]); i+=1
                elif c=="'":
                    out.append("\""); in_str=False; quote=""; i+=1
                elif c=="\"":
                    out.append("\\\""); i+=1
                else:
                    out.append(c); i+=1
            else:
                out.append(c)
                if esc: esc=False
                elif c=="\\": esc=True
                elif c=="\"": in_str=False; quote=""
                i+=1
    return "".join(out)

def quote_unquoted_keys(s):
    out=[];i=0;n=len(s);in_str=False;esc=False;quote=""
    while i<n:
        c=s[i]
        if in_str:
            out.append(c)
            if esc: esc=False
            elif c=="\\": esc=True
            elif c==quote: in_str=False
            i+=1; continue
        if c in ("\"", "'"):
            in_str=True; quote=c; out.append(c); i+=1; continue
        if c in "{,":
            out.append(c); i+=1
            j=i
            while j<n and s[j] in (" ","\t","\n","\r"):
                out.append(s[j]); j+=1
            start=j
            while j<n and (s[j].isalnum() or s[j] in ("_","-","$")):
                j+=1
            if j>start:
                k=j
                while k<n and s[k] in (" ","\t","\n","\r"):
                    k+=1
                if k<n and s[k]==":":
                    key=s[start:j]
                    out.append("\""+key+"\""); out.append(s[j:k]); out.append(":")
                    i=k+1; continue
            i=start; continue
        out.append(c); i+=1
    return "".join(out)

def replace_non_json_literals(s):
    pattern=re.compile(r"(?<![\\w\\$])(?:NaN|Infinity|-Infinity)(?![\\w\\$])")
    out=[];i=0;n=len(s);in_str=False;esc=False;quote="";buf=[]
    while i<n:
        c=s[i]
        if in_str:
            buf.append(c)
            if esc: esc=False
            elif c=="\\": esc=True
            elif c==quote: in_str=False
            i+=1
        else:
            if c in ("\"", "'"):
                segment="".join(buf); segment=pattern.sub("null", segment); out.append(segment)
                buf=[]; in_str=True; quote=c; out.append(c); i+=1
            else:
                buf.append(c); i+=1
    segment="".join(buf); segment=pattern.sub("null", segment); out.append(segment)
    return "".join(out)

def tidy_whitespace(s): return s.replace("\r\n","\n").replace("\r","\n")

def attempt_repairs(text):
    candidates=[]
    stages=[("original", text)]
    stages.append(("strip_bom", strip_bom(text)))
    stages.append(("no_comments", remove_comments(stages[-1][1])))
    stages.append(("no_trailing_commas", remove_trailing_commas(stages[-1][1])))
    stages.append(("single_to_double_quotes", convert_single_quoted_strings(stages[-1][1])))
    stages.append(("quote_unquoted_keys", quote_unquoted_keys(stages[-1][1])))
    stages.append(("replace_non_json_literals", replace_non_json_literals(stages[-1][1])))
    stages.append(("tidy_whitespace", tidy_whitespace(stages[-1][1])))
    for name, s in stages:
        try:
            load_json_strict(s)
            return s, name, None
        except Exception as e:
            candidates.append((name, e))
    try:
        repaired=tidy_whitespace(replace_non_json_literals(quote_unquoted_keys(convert_single_quoted_strings(remove_trailing_commas(remove_comments(strip_bom(text)))))))
        load_json_strict(repaired)
        return repaired, "combined_repairs", None
    except Exception as e:
        return None, None, (candidates, e)

def pretty(s): return json.dumps(json.loads(s), ensure_ascii=False, indent=2, sort_keys=False)+"\n"

ap=argparse.ArgumentParser(add_help=False)
ap.add_argument("path")
args=ap.parse_args()
with io.open(args.path, "r", encoding="utf-8", errors="replace") as f:
    raw=f.read()
try:
    json.loads(raw)
    sys.stdout.write(pretty(raw))
    sys.exit(0)
except Exception:
    pass
repaired, where, err = attempt_repairs(raw)
if repaired is not None:
    sys.stdout.write(pretty(repaired))
    sys.exit(0)
else:
    sys.stderr.write("UNRECOVERABLE\n")
    if err:
        last_stage_errors, final_exc = err
        for name, exc in last_stage_errors[-3:]:
            sys.stderr.write(f"Stage {name} failed: {exc}\n")
        if final_exc:
            sys.stderr.write(f"Final error: {final_exc}\n")
    sys.exit(4)
PYCODE
    fi
}

format_with_jq() {
    if [[ -n "$JQ_BIN" ]]; then
        "$JQ_BIN" . 2>/dev/null || cat
    else
        cat
    fi
}

process_file() {
    local path="$1"
    [[ -f "$path" ]] || return 0
    if ! has_included_ext "$path"; then
        return 0
    fi
    echo "Processing: $path"

    if $DO_CHECK; then
        if "$PY_BIN" - "$path" <<'PYCODE' 2>/dev/null
import json, io, sys
p=sys.argv[1]
with io.open(p, "r", encoding="utf-8", errors="strict") as f:
    s=f.read()
json.loads(s)
PYCODE
        then
            echo "[OK] $path"
            return 0
        else
            echo "[INVALID] $path"
            return 1
        fi
    fi

    local tmp_out
    tmp_out="$(mktemp "${TMPDIR:-/tmp}/jsonfix.XXXXXX")"

    if $DO_FORMAT; then
        if run_python_repair "format-only" "$path" > "$tmp_out"; then
            :
        else
            echo "[FAILED] $path" >&2
            rm -f "$tmp_out"
            return 1
        fi
    else
        if run_python_repair "repair" "$path" > "$tmp_out" 2> "${tmp_out}.err"; then
            :
        else
            echo "[FAILED] $path" >&2
            if [[ -s "${tmp_out}.err" ]]; then head -n 5 "${tmp_out}.err" >&2; fi
            rm -f "$tmp_out" "${tmp_out}.err"
            return 1
        fi
    fi

    if $DO_INPLACE; then
        if $DO_BACKUP; then
            cp -p "$path" "$path.bak"
        fi
        format_with_jq < "$tmp_out" > "$path"
        echo "[FIXED] $path"
    else
        format_with_jq < "$tmp_out"
    fi

    rm -f "$tmp_out" "${tmp_out}.err" 2>/dev/null || true
    return 0
}

process_dir() {
    local dir="$1"
    # Build a proper grouped -name expression: \( -name "*.json" -o -name "*.jsonc" \)
    local -a find_args
    find_args=(-type f "(")
    local first=1
    local e
    for e in "${EXT_ARR[@]}"; do
        if [[ $first -eq 1 ]]; then
            find_args+=(-name "*${e}")
            first=0
        else
            find_args+=(-o -name "*${e}")
        fi
    done
    find_args+=(")")
    # Use -print0 for safety with spaces
    find "$dir" "${find_args[@]}" -print0 | while IFS= read -r -d '' f; do
        if ! process_file "$f"; then
            overall=1
        fi
    done
}

overall=0
for target in "${PATHS[@]}"; do
    if [[ -d "$target" ]]; then
        process_dir "$target"
    else
        if ! process_file "$target"; then
            overall=1
        fi
    fi
done

exit $overall