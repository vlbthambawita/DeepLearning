#!/usr/bin/env python3
"""Per-slide prose budget for the PGR207 decks.

Counts the words the room has to *read* on each slide — speaker notes, code
blocks and maths excluded, since none of those are what makes a slide a wall of
text. Prints the slides over budget so they can become a diagram, be split, or
move into the speaker notes, and every slide with no picture at all — the
skill's rule is a visual on every slide, and a table or an equation does not
count as one. It also lists slides whose speaker notes are missing or too thin
to explain the slide (see the skill's "Speaker notes: explain the slide"),
and every picture slide not followed by its "In words: …" description slide
(see "A description slide after every picture slide"). Last, it sizes the
class cut — the slides flagged `core: true` that `npm run build` turns into the
2-hour class deck (see "The class cut") — and estimates its teaching time.

    python3 .claude/skills/lecture-deck/slide-stats.py               # every deck
    python3 .claude/skills/lecture-deck/slide-stats.py lecture-07    # one deck
    python3 .claude/skills/lecture-deck/slide-stats.py lecture-07 --all
"""
import re
import sys
import statistics
from pathlib import Path

# Budgets are roughly what lectures 01-03 held before prose crept up; see the
# skill's "Text budget" section for where the numbers come from.
BUDGET = {"default": 70, "interactive": 55, "figure": 40, "section": 10, "title": 40, "end": 20,
          "description": 120}
HARD = {"default": 110, "interactive": 70, "figure": 60, "section": 20, "title": 60, "end": 40,
        "description": 160}

# A description slide is headed "In words: <heading of the slide it explains>".
# It is text by design: no picture, no clicks, and its own word budget.
DESCRIPTION_PREFIX = "in words"
NEEDS_DESCRIPTION = {"default", "figure", "interactive"}


def is_description(label):
    return label.strip("\"' ").lower().startswith(DESCRIPTION_PREFIX)


def is_reading_eq(label):
    return label.strip("\"' ").lower().startswith("reading the equation")

COMPONENT = re.compile(r"<([A-Z][A-Za-z0-9]+)[\s/>]")
YAML_LINE = re.compile(r"^\s*(?:[\w-]+\s*:|-\s)")


def is_frontmatter(block):
    lines = [l for l in block.splitlines() if l.strip()]
    if not lines or not any(":" in l for l in lines):
        return False
    return all(YAML_LINE.match(l) for l in lines)


def slides(path):
    """Yield (layout, label, body) per slide. Slides may omit front matter."""
    for layout, label, body, _fm in slides_fm(path):
        yield layout, label, body


def slides_fm(path):
    """As `slides`, plus each slide's raw front matter."""
    blocks = re.split(r"(?m)^---$", path.read_text(encoding="utf-8"))
    if blocks and not blocks[0].strip():
        blocks = blocks[1:]
    i = 0
    while i < len(blocks):
        if is_frontmatter(blocks[i]) and i + 1 < len(blocks):
            fm, body = blocks[i], blocks[i + 1]
            i += 2
        else:
            fm, body = "", blocks[i]   # no front matter: Slidev uses `default`
            i += 1
        layout = (re.search(r"(?m)^layout:\s*(\S+)", fm) or [None, "default"])[1]
        named = re.search(r"(?m)^(?:heading|title):\s*(.+)$", fm)
        head = re.search(r"(?m)^#{1,2}\s+(.+)$", body)
        label = (named.group(1) if named else head.group(1) if head else "").strip()[:46]
        yield layout, label, body, fm


# --- the class cut -----------------------------------------------------------
# Same selection rule as scripts/lib/class-cut.mjs: the title slide, every slide
# flagged `core: true`, every `end` slide, and a `section` divider when at least
# one core slide follows it before the next divider.
CORE = re.compile(r"(?m)^core:\s*true\s*$")
CLASS_MINUTES = 100          # 2 h session minus a 15 min break and 5 min slack
# Rough minutes per slide when taught, by kind — tune if the room runs slower.
MINUTES = {"title": 1, "section": 0.5, "end": 1, "default": 2, "figure": 2,
           "interactive": 4, "poll": 4, "code": 3}


def class_cut(parsed_fm):
    """Indices (0-based) of the slides that go into the class deck."""
    core = [bool(CORE.search(fm)) for _l, _lb, _b, fm in parsed_fm]
    keep = []
    for i, (layout, _label, _body, _fm) in enumerate(parsed_fm):
        if i == 0 or core[i] or layout == "end":
            keep.append(i)
        elif layout == "section":
            j = i + 1
            while j < len(parsed_fm) and parsed_fm[j][0] != "section":
                if core[j]:
                    keep.append(i)
                    break
                j += 1
    return keep


def teach_minutes(layout, body):
    if "<PollSlide" in body:
        return MINUTES["poll"]
    if layout in ("default", "figure") and "```" in re.sub(r"<!--.*?-->", "", body, flags=re.S):
        return MINUTES["code"]
    return MINUTES.get(layout, 2)


def prose_words(body):
    b = re.sub(r"<!--.*?-->", " ", body, flags=re.S)        # speaker notes
    b = re.sub(r"```.*?```", " ", b, flags=re.S)            # code fences
    b = re.sub(r"\$\$.*?\$\$", " ", b, flags=re.S)          # display maths
    b = re.sub(r"\$[^$\n]*\$", " X ", b)                    # inline maths -> one token
    b = re.sub(r"<[^>]+>", " ", b)                          # tags and components
    b = re.sub(r"[#*`|>_-]", " ", b)
    return len(b.split())


def is_visual(body):
    """Does the slide show anything, or is it words only?"""
    b = re.sub(r"<!--.*?-->", " ", body, flags=re.S)
    return bool(
        COMPONENT.search(b)                          # a component
        or re.search(r"<(img|svg)\b", b)             # a figure or hand-drawn SVG
        or "```mermaid" in b                         # a mermaid diagram
        or re.search(r"(?m)^\s*\|.*\|\s*$", b)       # a markdown table
        or re.search(r"\$\$.*?\$\$", b, re.S)        # a display-maths derivation
    )


# Components that are furniture rather than a picture of anything.
NOT_A_PICTURE = {"Citation", "PollSlide", "LinkCard", "Katex"}


def has_picture(body):
    """Stricter than is_visual: a table or an equation is still something to read."""
    b = re.sub(r"<!--.*?-->", " ", body, flags=re.S)
    parts = set(COMPONENT.findall(b)) - NOT_A_PICTURE
    return bool(
        parts
        or re.search(r"<(img|svg)\b", b)
        or "```mermaid" in b
    )


# A content slide's notes have to walk through what is on screen; this many words
# is the least that can do it. Section, title and end slides only need the point.
NOTES_MIN = 40
NOTES_EXEMPT = {"section", "title", "end"}
CLICKS_NEED_WALKTHROUGH = 3


def notes(body):
    """Slidev's speaker notes: the last comment, and only if it ends the slide."""
    b = body.rstrip()
    if not b.endswith("-->"):
        return None
    start = b.rfind("<!--")
    return b[start + 4:-3].strip() if start != -1 else None


def clicks(body):
    """Rough click count: v-click elements, v-clicks items, code-highlight steps."""
    b = re.sub(r"<!--.*?-->", " ", body, flags=re.S)
    n = len(re.findall(r"\bv-click\b(?!s)", b))
    for block in re.findall(r"<v-clicks\b.*?</v-clicks>", b, flags=re.S):
        n += len(re.findall(r"(?m)^\s*(?:[-*]|\d+\.)\s", block)) or 1
    for rng in re.findall(r"```\w+\s*\{([^}]*\|[^}]*)\}", b):
        n += rng.count("|")
    return n


def notes_problem(layout, body, label=""):
    """None if the notes are fine, else a short reason."""
    text = notes(body)
    if text is None:
        return "none"
    if layout in NOTES_EXEMPT or is_description(label):
        return None
    words = len(text.split())
    if words < NOTES_MIN:
        return f"{words}w"
    if clicks(body) >= CLICKS_NEED_WALKTHROUGH and not re.search(r"(?i)\bclick", text):
        return "no click walkthrough"
    return None


def report(deck, show_all):
    path = Path("decks") / deck / "slides.md"
    if not path.exists():
        print(f"  no slides.md for {deck}")
        return

    parsed = list(slides(path))
    rows, by_layout, bare, unnoted, thin, undescribed = [], {}, [], [], [], []
    for n, (layout, label, body) in enumerate(parsed, start=1):
        words = prose_words(body)
        parts = sorted(set(COMPONENT.findall(body)) - {"Citation"})
        kind = "description" if is_description(label) else layout
        by_layout.setdefault(kind, []).append(words)
        rows.append((n, kind, label, words, parts, is_visual(body) or kind == "description"))
        if kind != "description" and not has_picture(body):
            bare.append((n, layout, label))
        if kind in NEEDS_DESCRIPTION and has_picture(body) and not is_reading_eq(label):
            # The description follows the slide, or the "Reading the equation" slide after it.
            k = n
            if k < len(parsed) and is_reading_eq(parsed[k][1]):
                k += 1
            if not (k < len(parsed) and is_description(parsed[k][1])):
                undescribed.append((n, layout, label))
        problem = notes_problem(layout, body, label)
        if problem == "none":
            unnoted.append((n, layout, label))
        elif problem:
            thin.append((n, layout, label, problem))

    print(f"\n{deck}  —  {len(rows)} slides")
    for layout in ("default", "interactive", "figure", "description"):
        v = by_layout.get(layout)
        if v:
            over = sum(1 for w in v if w > BUDGET[layout])
            print(f"  {layout:12s} n={len(v):3d}  median={statistics.median(v):5.0f}"
                  f"  budget={BUDGET[layout]}  over={over}")

    words_only = sum(1 for r in rows if not r[5] and r[1] in ("default", "figure"))
    print(f"  words-only slides: {words_only}")

    print(f"  no picture: {len(bare)}")
    for n, layout, label in bare:
        print(f"      {n:3d} {layout:12s} {label}")

    print(f"  no description: {len(undescribed)}")
    for n, layout, label in undescribed:
        print(f"      {n:3d} {layout:12s} {label}")

    print(f"  no notes: {len(unnoted)}")
    for n, layout, label in unnoted:
        print(f"      {n:3d} {layout:12s} {label}")

    print(f"  thin notes: {len(thin)}")
    for n, layout, label, problem in thin:
        print(f"      {n:3d} {layout:12s} {label}   <- {problem}")

    flagged = [r for r in rows if r[3] > BUDGET.get(r[1], 70)]
    if flagged:
        print(f"  over budget ({len(flagged)}):")
        for n, layout, label, words, parts, visual in flagged:
            mark = "!!" if words > HARD.get(layout, 110) else " ·"
            print(f"   {mark} {n:3d} {layout:12s} {words:4d}w  {label}"
                  f"{'' if visual else '   <- words only'}")
    parsed_fm = list(slides_fm(path))
    keep = class_cut(parsed_fm)
    flagged_core = [i for i, s in enumerate(parsed_fm) if CORE.search(s[3])]
    if not flagged_core:
        print("  class cut: none flagged (add `core: true` to the main-flow slides)")
    else:
        mins = sum(teach_minutes(parsed_fm[i][0], parsed_fm[i][2]) for i in keep)
        mark = "" if mins <= CLASS_MINUTES else f"   <- over {CLASS_MINUTES} min: cut more"
        print(f"  class cut: {len(keep)} of {len(parsed_fm)} slides, ~{mins:.0f} min{mark}")
        bad = [i for i in flagged_core if is_description(parsed_fm[i][1])]
        for i in bad:
            print(f"      {i + 1:3d} core description slide — 'In words' slides are for self-study")
        unpictured = [i for i in flagged_core if not has_picture(parsed_fm[i][2])]
        for i in unpictured:
            print(f"      {i + 1:3d} core slide with no picture — the class cut is diagram-led")
        if show_all:
            for i in keep:
                layout, label, body, _fm = parsed_fm[i]
                print(f"      {i + 1:3d} {layout:12s} {teach_minutes(layout, body):4.1f}m  {label}")

    if show_all:
        print("  all slides:")
        for n, layout, label, words, parts, visual in rows:
            print(f"      {n:3d} {layout:12s} {words:4d}w  {label}  {','.join(parts)}")


def main():
    argv = sys.argv[1:]
    show_all = "--all" in argv
    decks = [a for a in argv if not a.startswith("--")] or sorted(
        p.parent.name for p in Path("decks").glob("lecture-*/slides.md"))
    for deck in decks:
        report(deck, show_all)
    print()


if __name__ == "__main__":
    main()
