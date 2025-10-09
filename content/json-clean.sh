#!/usr/bin/env zsh
# json-clean.sh — Keep FIXED originals (files with a .bak sibling) and optional UNRECOVERABLEs; remove others.
# Shell: zsh (pure built-ins; no grep/sed/find). macOS-friendly. No sudo required.
#
# Behaviour:
#   • KEEP   any *.json file F where sibling "F.bak" exists (fixed-in-place originals)
#   • KEEP   any path listed as "UNRECOVERABLE: <path>" in --log (optional)
#   • DELETE all other *.json files (extras like *-fixed.json, *-full.json, sources.json, etc.)
#   • DELETE all *.bak backups
#
# Safety:
#   • DRY RUN by default (prints plan). Add --confirm to act.
#   • --trash moves deletions to macOS Trash via Finder (requires Automation permission for your terminal).
#
# Usage:
#   json-clean.sh [--ext .json,.jsonc] [--log unrecoverables.log] [--trash] [--confirm] [--verbose] PATH...
#
# Examples:
#   json-clean.sh lessons/
#   json-clean.sh --trash --confirm lessons/
#   json-clean.sh --log ./unrecoverable.txt --trash --confirm lessons/

set -euo pipefail
setopt extendedglob null_glob glob_dots

print_usage() {
	echo "Usage: $(basename $0) [--ext .json,.jsonc] [--log unrecoverables.log] [--trash] [--confirm] [--verbose] PATH..."
	echo
	echo "  --ext        Comma-separated extensions to consider (default: .json)"
	echo "  --log        File with lines like 'UNRECOVERABLE: /path/to/file.json' to KEEP those too"
	echo "  --trash      On macOS, move deletions to Trash (Finder) instead of permanent delete"
	echo "  --confirm    Perform deletions (otherwise DRY RUN)"
	echo "  --verbose    Print detailed lists"
	echo "  PATH         One or more files or directories (directories processed recursively)"
}

# Defaults
typeset -a PATHS EXT_ARR CAND_JSON CAND_BAK TO_KEEP TO_DELETE TARGETS
typeset -A KEEP_SET
EXT_LIST=".json"
LOG_PATH=""
USE_TRASH=false
DO_CONFIRM=false
VERBOSE=false

# Parse args
while (( $# > 0 )); do
	case "$1" in
		--ext) EXT_LIST="$2"; shift 2 ;;
		--log) LOG_PATH="$2"; shift 2 ;;
		--trash) USE_TRASH=true; shift ;;
		--confirm) DO_CONFIRM=true; shift ;;
		--verbose) VERBOSE=true; shift ;;
		--help|-h) print_usage; exit 0 ;;
		--*) echo "Unknown option: $1" >&2; print_usage; exit 2 ;;
		*) PATHS+=("$1"); shift ;;
	esac
done

if (( ${#PATHS[@]} == 0 )); then
	echo "No PATHs provided." >&2
	print_usage
	exit 1
fi

OS_NAME="$(uname -s 2>/dev/null || echo Unknown)"

# Helpers
to_lower() { print -r -- "$1" | tr '[:upper:]' '[:lower:]'; }

normpath() {
	typeset p="$1"
	while [[ "$p" == ./* ]]; do p="${p#./}"; done
	while [[ "$p" == *"//"* ]]; do p="${p//\/\//\/}"; done
	if [[ "$p" != "/" && "${p[-1,-1]}" == "/" ]]; then p="${p%/}"; fi
	print -r -- "$p"
}

# Split and normalise extensions to .ext (lowercased)
IFS=',' read -rA EXT_ARR <<< "$EXT_LIST"
for i in {1..${#EXT_ARR[@]}}; do
	typeset ext="${EXT_ARR[$i]}"
	ext="${ext// /}"
	if [[ "${ext[1,1]}" != "." ]]; then ext=".$ext"; fi
	EXT_ARR[$i]="$(to_lower "$ext")"
done

has_ext() {
	typeset f="$1"
	typeset base="${f:t}"
	typeset ext=".${base:e}"
	ext="$(to_lower "$ext")"
	for e in "${EXT_ARR[@]}"; do
		[[ "$ext" == "$e" ]] && return 0
	done
	return 1
}

# Gather candidates (pure zsh globs)
CAND_JSON=()
CAND_BAK=()
for target in "${PATHS[@]}"; do
	if [[ -d "$target" ]]; then
		for ext in "${EXT_ARR[@]}"; do
			for f in "$target"/**/*"$ext"(N.); do
				CAND_JSON+=("$(normpath "$f")")
			done
		done
		for b in "$target"/**/*.bak(N.); do
			CAND_BAK+=("$(normpath "$b")")
		done
	else
		if [[ -f "$target" ]]; then
			if has_ext "$target"; then
				CAND_JSON+=("$(normpath "$target")")
			elif [[ "$target" == *.bak ]]; then
				CAND_BAK+=("$(normpath "$target")")
			fi
		fi
	fi
done

# Build KEEP set: JSONs that have a sibling .bak (fixed-in-place)
KEEP_SET=()
typeset kept_from_bak=0
for jf in "${CAND_JSON[@]}"; do
	if [[ -f "${jf}.bak" ]]; then
		KEEP_SET["$jf"]=1
		((kept_from_bak++))
	fi
done

# Also keep unrecoverables from log (optional; pure zsh parsing)
typeset added_unrec=0
if [[ -n "$LOG_PATH" ]]; then
	if [[ ! -f "$LOG_PATH" ]]; then
		echo "Log not found: $LOG_PATH" >&2
		exit 1
	fi
	while IFS= read -r line || [[ -n "$line" ]]; do
		if [[ "$line" == 'UNRECOVERABLE: '* ]]; then
			typeset p="${line#'UNRECOVERABLE: '}"
			p="$(normpath "$p")"
			if has_ext "$p"; then
				KEEP_SET["$p"]=1
				((added_unrec++))
			fi
		fi
	done < "$LOG_PATH"
fi

# Partition JSON files into KEEP vs DELETE (extras)
TO_KEEP=()
TO_DELETE=()
for jf in "${CAND_JSON[@]}"; do
	if [[ -n "${KEEP_SET[$jf]-}" ]]; then
		TO_KEEP+=("$jf")
	else
		TO_DELETE+=("$jf")
	fi
done

# All backups are deletion targets
typeset -a BAK_TO_DELETE
BAK_TO_DELETE=("${CAND_BAK[@]}")

# Always print a summary (so “nothing happens” never happens)
echo "Scan summary"
echo "  JSON candidates : ${#CAND_JSON[@]}"
echo "  Backups found   : ${#CAND_BAK[@]}"
echo "  Keep (from .bak): $kept_from_bak"
echo "  Keep (unrec log): $added_unrec"
echo "  Delete extras   : ${#TO_DELETE[@]}  (JSON without .bak)"
echo "  Delete backups  : ${#BAK_TO_DELETE[@]}  (*.bak)"
if (( ${#CAND_JSON[@]} == 0 )) && (( ${#CAND_BAK[@]} == 0 )); then
	echo "  Note: No matching files under: ${PATHS[@]}"
fi

if $VERBOSE; then
	if (( ${#TO_KEEP[@]} > 0 )); then
		echo
		echo "KEEP:"
		for f in "${TO_KEEP[@]}"; do echo "  KEEP  $f"; done
	fi
	if (( ${#TO_DELETE[@]} > 0 )); then
		echo
		echo "DELETE (extras):"
		for f in "${TO_DELETE[@]}"; do echo "  DEL   $f"; done
	fi
	if (( ${#BAK_TO_DELETE[@]} > 0 )); then
		echo
		echo "DELETE (backups):"
		for f in "${BAK_TO_DELETE[@]}"; do echo "  DEL   $f"; done
	fi
fi

if ! $DO_CONFIRM; then
	echo
	if $USE_TRASH; then
		echo "Dry run. Add --confirm to move deletions to Trash."
	else
		echo "Dry run. Add --confirm to permanently delete."
	fi
	exit 0
fi

# If using Trash, sanity-check Finder Automation (print a clear note if blocked)
if $USE_TRASH && [[ "$OS_NAME" == "Darwin" ]]; then
	if ! /usr/bin/osascript -e 'tell application "Finder" to get version' >/dev/null 2>&1; then
		echo
		echo "Heads-up: Finder automation seems blocked. Grant your terminal app permission:"
		echo "  System Settings → Privacy & Security → Automation → allow Terminal/iTerm to control Finder."
		echo "Proceeding to attempt Trash moves anyway..."
	fi
fi

trash_file_macos() {
	/usr/bin/osascript >/dev/null 2>&1 <<OSA
try
	tell application "Finder"
		move (POSIX file "$1") to trash
	end tell
end try
OSA
}

TARGETS=("${TO_DELETE[@]}" "${BAK_TO_DELETE[@]}")

if $USE_TRASH && [[ "$OS_NAME" == "Darwin" ]]; then
	echo
	echo "Moving ${#TARGETS[@]} file(s) to Trash..."
else
	echo
	echo "Permanently deleting ${#TARGETS[@]} file(s)..."
fi

typeset deleted=0 failed=0
for f in "${TARGETS[@]}"; do
	if $USE_TRASH && [[ "$OS_NAME" == "Darwin" ]]; then
		if trash_file_macos "$f"; then
			((deleted++))
			$VERBOSE && echo "Trashed: $f"
		else
			((failed++))
			echo "Failed to move to Trash: $f" >&2
		fi
	else
		if /bin/rm -f -- "$f" 2>/dev/null; then
			((deleted++))
			$VERBOSE && echo "Deleted: $f"
		else
			((failed++))
			echo "Failed to delete: $f" >&2
		fi
	fi
done

echo
echo "Done. Affected: $deleted; Failed: $failed; Kept: ${#TO_KEEP[@]}"
if $USE_TRASH && [[ "$OS_NAME" == "Darwin" ]]; then
	echo "If files didn’t appear in Trash, check Automation permissions as noted above."
fi

exit 0
