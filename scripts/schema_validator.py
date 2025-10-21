import os
import sys
import json
from typing import Any, Dict, List, Tuple, Union, Optional, cast

# Flexible type checker supporting tuples of types and optional fields

def validate_type(value: Any, expected: Union[type, Tuple[type, ...], List[type]], optional: bool = False) -> bool:
    if value is None:
        return optional
    if isinstance(expected, list):
        expected = tuple(expected)
    return isinstance(value, expected)


def coerce_to_str(value: Any) -> str:
    if value is None:
        return ""
    return str(value)


# Validation utilities

def ensure_string_list(items: Any) -> Tuple[bool, List[str]]:
    if items is None:
        return False, []
    if not isinstance(items, list):
        return False, []
    str_items = []
    for i in items:
        if not isinstance(i, str):
            return False, []
        str_items.append(i)
    return True, str_items


def derive_correct_index_from_string(correct: str, choices: List[str]) -> int:
    # Try direct match first
    try:
        idx = choices.index(correct)
        return idx
    except ValueError:
        pass
    # Try normalized match (case-insensitive, trimmed)
    normalized = correct.strip().lower()
    for i, c in enumerate(choices):
        if c.strip().lower() == normalized:
            return i
    # Try letter mapping (A/B/C/D -> 0..3)
    letter_map = {"a": 0, "b": 1, "c": 2, "d": 3}
    if normalized in letter_map:
        return letter_map[normalized]
    return -1  # not found


# Lesson validation (flexible)

def validate_lesson(lesson: Dict[str, Any], file_path: str, idx: Optional[int] = None) -> List[str]:
    errors: List[str] = []

    # id: accept int or str (coerce to str)
    if "id" in lesson and not validate_type(lesson.get("id"), (int, str)):
        errors.append("Field id should be int or str")

    # title: prefer string
    if "title" in lesson and not validate_type(lesson.get("title"), str):
        errors.append("Field title should be a string")

    # objectives: list or string; string is allowed (single objective)
    if "objectives" in lesson:
        objectives = lesson.get("objectives")
        if isinstance(objectives, str):
            pass
        elif isinstance(objectives, list):
            ok, _ = ensure_string_list(objectives)
            if not ok:
                errors.append("Field objectives should be a list of strings")
        else:
            errors.append("Field objectives should be a list or a string")

    # next: string or list of strings
    if "next" in lesson:
        nxt = lesson.get("next")
        if isinstance(nxt, str):
            pass
        elif isinstance(nxt, list):
            ok, _ = ensure_string_list(nxt)
            if not ok:
                errors.append("Field next should be a list of strings")
        else:
            errors.append("Field next should be a string or a list of strings")

    # code: accept string or object; do not enforce nested fields
    if "code" in lesson and not isinstance(lesson.get("code"), (str, dict)):
        errors.append("Field code should be a string or an object")

    # Optional metadata accepted: lastUpdated, version, sources
    # If present, perform light type checks
    if "lastUpdated" in lesson and not isinstance(lesson.get("lastUpdated"), str):
        errors.append("Field lastUpdated should be a string (ISO date)")
    if "version" in lesson and not isinstance(lesson.get("version"), (str, int)):
        errors.append("Field version should be a string or int")
    # sources: optional metadata, accept string, list, or object without strict enforcement
    if "sources" in lesson:
        val = lesson.get("sources")
        if val is None:
            pass
        elif isinstance(val, (str, dict, list)):
            # Allow list of strings or list of objects; no strict checks
            pass
        else:
            # Only flag if type is wildly unexpected
            errors.append("Field sources should be string, list, or object")

    return errors


# Question validation (flexible, aligned with DataService)

def validate_question(q: Dict[str, Any], file_path: str, idx: int) -> List[str]:
    errors: List[str] = []

    # Basic identifiers
    if "id" in q and not validate_type(q.get("id"), (int, str)):
        errors.append(f"Question {idx}: Field id should be int or str")

    if not q.get("question") or not isinstance(q.get("question"), str):
        errors.append(f"Question {idx}: Missing or invalid question text")

    # Determine type
    qtype = q.get("type") or q.get("questionType")
    choices = q.get("choices")
    correct = q.get("correctAnswer") if "correctAnswer" in q else q.get("correctIndex")

    # If choices are provided, ensure they are strings
    if choices is not None:
        ok, choices_list = ensure_string_list(choices)
        if not ok:
            errors.append(f"Question {idx}: choices should be a list of strings")
            choices_list = []
    else:
        choices_list = []

    is_multiple_choice_declared = (qtype in ("multiple-choice", "true-false"))
    is_multiple_choice_inferred = (len(choices_list) > 0 and correct is not None)
    is_multiple_choice = is_multiple_choice_declared or is_multiple_choice_inferred

    if is_multiple_choice:
        # Require choices list
        if len(choices_list) == 0:
            errors.append(f"Question {idx}: Multiple-choice questions require a non-empty choices list")
        # Require a correct answer/index
        if correct is None:
            errors.append(f"Question {idx}: Multiple-choice questions require correctAnswer or correctIndex")
        else:
            if isinstance(correct, str):
                derived = derive_correct_index_from_string(correct, choices_list)
                if derived == -1:
                    # Non-fatal: cannot derive, warn as error to keep report honest
                    errors.append(f"Question {idx}: correctAnswer string does not match any choice")
                else:
                    q["correctIndex"] = derived
            elif isinstance(correct, int):
                if len(choices_list) > 0 and (correct < 0 or correct >= len(choices_list)):
                    errors.append(f"Question {idx}: correctAnswer index {correct} out of range")
            else:
                errors.append(f"Question {idx}: correctAnswer should be int or str")
    else:
        # Open-ended: choices/correctAnswer not required
        pass

    # Optional fields
    if "difficulty" in q and q.get("difficulty") is not None and not isinstance(q.get("difficulty"), str):
        errors.append(f"Question {idx}: difficulty should be a string if present")
    # explanation optional but if present should be string
    if "explanation" in q and not isinstance(q.get("explanation"), str):
        errors.append(f"Question {idx}: explanation should be a string")

    return errors


def validate_quiz(quiz: Union[Dict[str, Any], List[Any]], file_path: str) -> List[str]:
    errors: List[str] = []

    # Top-level quiz fields are optional; perform light checks if present
    if isinstance(quiz, dict):
        if "id" in quiz and not validate_type(quiz.get("id"), (int, str)):
            errors.append("Quiz id should be int or str")
        if "title" in quiz and not isinstance(quiz.get("title"), str):
            errors.append("Quiz title should be a string")
        if "topic" in quiz and not isinstance(quiz.get("topic"), str):
            errors.append("Quiz topic should be a string")
        if "difficulty" in quiz and quiz.get("difficulty") is not None and not isinstance(quiz.get("difficulty"), str):
            errors.append("Quiz difficulty should be a string if present")

    # Find questions array in flexible shapes
    questions = None
    if isinstance(quiz, list):
        questions = quiz
    else:
        qdict = cast(Dict[str, Any], quiz)
        for key in ("questions", "items", "questionList"):
            if isinstance(qdict.get(key), list):
                questions = qdict.get(key)
                break
    if questions is None:
        errors.append("Quiz missing questions array")
        return errors

    # Validate each question
    for idx, q in enumerate(questions):
        if not isinstance(q, dict):
            errors.append(f"Question {idx}: should be an object")
            continue
        q_errors = validate_question(q, file_path, idx)
        errors.extend(q_errors)

    return errors


def infer_file_type(file_path: str) -> str:
    lower = file_path.lower()
    name = os.path.basename(lower)
    if name.endswith("-lesson.json"):
        return "lesson"
    if name.endswith("-quiz.json"):
        return "quiz"
    if "/lessons/" in lower and name.endswith(".json") and name != "sources.json":
        return "lesson"
    if "/quizzes/" in lower and name.endswith(".json"):
        return "quiz"
    return "unknown"


def validate_file(file_path: str) -> Tuple[str, List[str]]:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        return "unknown", [f"Invalid JSON: {e}"]
    except Exception as e:
        return "unknown", [f"Error reading file: {e}"]

    file_type = infer_file_type(file_path)

    errors: List[str] = []
    if file_type == "lesson":
        if isinstance(data, list):
            for idx, item in enumerate(data):
                if not isinstance(item, dict):
                    errors.append(f"Lesson {idx}: should be an object")
                    continue
                errors.extend(validate_lesson(item, file_path, idx))
        elif isinstance(data, dict):
            errors.extend(validate_lesson(data, file_path))
        else:
            errors.append("Lesson file should be an object or array")
    elif file_type == "quiz":
        if isinstance(data, dict) or isinstance(data, list):
            errors.extend(validate_quiz(data, file_path))
        else:
            errors.append("Quiz file should be an object or array")
    else:
        # Skip unknown files (e.g., sources.json) without marking invalid
        return "unknown", []

    return file_type, errors


def main(content_dir: str):
    total = 0
    valid = 0
    invalid = 0
    unknown = 0
    details: List[str] = []

    for root, _, files in os.walk(content_dir):
        for name in files:
            if not name.endswith('.json'):
                continue
            path = os.path.join(root, name)
            total += 1
            file_type, errs = validate_file(path)
            if len(errs) == 0:
                valid += 1
                print(f"✅ Valid ({file_type}): {os.path.relpath(path, content_dir)}")
            else:
                if any("Unknown file type" in e for e in errs):
                    unknown += 1
                invalid += 1
                print(f"❌ Invalid ({file_type}): {os.path.relpath(path, content_dir)}")
                for e in errs[:20]:
                    print(f"  - {e}")
                if len(errs) > 20:
                    print(f"  ... {len(errs) - 20} more issues")

    print("")
    print("Summary:")
    print(f"  Total files: {total}")
    print(f"  Valid:       {valid}")
    print(f"  Invalid:     {invalid}")
    print(f"  Unknown:     {unknown}")

    # Exit 1 if any invalid to make CI aware; otherwise 0
    sys.exit(1 if invalid > 0 else 0)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/schema_validator.py <content_dir>")
        sys.exit(2)
    main(sys.argv[1])