#!/usr/bin/env python3
"""Per-slide prose budget for the PGR207 decks.

Counts the words the room has to *read* on each slide — speaker notes, code
blocks and maths excluded, since none of those are what makes a slide a wall of
text. Prints the slides over budget so they can become a diagram, be split, or
move into the speaker notes.

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
BUDGET = {"default": 70, "interactive": 55, "figure": 40, "section": 10, "title": 40, "end": 20}
HARD = {"default": 110, "interactive": 70, "figure": 60, "section": 20, "title": 60, "end": 40}

COMPONENT = re.compile(r"<([A-Z][A-Za-z0-9]+)[\s/>]")
YAML_LINE = re.compile(r"^\s*(?:[\w-]+\s*:|-\s)")


def is_frontmatter(block):
    lines = [l for l in block.splitlines() if l.strip()]
    if not lines or not any(":" in l for l in lines):
        return False
    return all(YAML_LINE.match(l) for l in lines)


def slides(path):
    """Yield (layout, label, body) per slide. Slides may omit front matter."""
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
        yield layout, label, body


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


def report(deck, show_all):
    path = Path("decks") / deck / "slides.md"
    if not path.exists():
        print(f"  no slides.md for {deck}")
        return

    rows, by_layout = [], {}
    for n, (layout, label, body) in enumerate(slides(path), start=1):
        words = prose_words(body)
        parts = sorted(set(COMPONENT.findall(body)) - {"Citation"})
        by_layout.setdefault(layout, []).append(words)
        rows.append((n, layout, label, words, parts, is_visual(body)))

    print(f"\n{deck}  —  {len(rows)} slides")
    for layout in ("default", "interactive", "figure"):
        v = by_layout.get(layout)
        if v:
            over = sum(1 for w in v if w > BUDGET[layout])
            print(f"  {layout:12s} n={len(v):3d}  median={statistics.median(v):5.0f}"
                  f"  budget={BUDGET[layout]}  over={over}")

    words_only = sum(1 for r in rows if not r[5] and r[1] in ("default", "figure"))
    print(f"  words-only slides: {words_only}")

    flagged = [r for r in rows if r[3] > BUDGET.get(r[1], 70)]
    if flagged:
        print(f"  over budget ({len(flagged)}):")
        for n, layout, label, words, parts, visual in flagged:
            mark = "!!" if words > HARD.get(layout, 110) else " ·"
            print(f"   {mark} {n:3d} {layout:12s} {words:4d}w  {label}"
                  f"{'' if visual else '   <- words only'}")
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
