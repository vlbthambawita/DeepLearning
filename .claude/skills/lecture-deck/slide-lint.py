#!/usr/bin/env python3
"""Static checks on a deck's source: hard-to-read text, duplicates, and clicks.

    python3 .claude/skills/lecture-deck/slide-lint.py lecture-07
    python3 .claude/skills/lecture-deck/slide-lint.py lecture-07 --only read
    python3 .claude/skills/lecture-deck/slide-lint.py lecture-07 --only dup,click

Three groups of findings, each line prefixed with the slide number:

  read   sentences a student has to work to parse — too long, idioms a
         non-native speaker will miss, acronyms never expanded, rare jargon
         used before it is explained. Every hit is a *candidate*: read the
         sentence and rewrite it if a second-year student would stumble.
  dup    repeated headings, sentences that appear on more than one slide,
         near-duplicate slides, reused SVG <marker> ids (two mounted slides
         with the same id make arrows point at the wrong marker).
  click  bullets that all appear at once, a punchline callout visible before
         the build-up, a poll answer visible before the poll, code-highlight
         ranges past the end of the code, <v-clicks> nested in a v-click.

It reads source only. `npm run check:layout` is the rendered counterpart —
it finds overlapping text and clicks that change nothing on screen.
"""
import re
import sys
import importlib.util
from pathlib import Path
from collections import defaultdict

HERE = Path(__file__).resolve().parent
_spec = importlib.util.spec_from_file_location("slide_stats", HERE / "slide-stats.py")
_stats = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_stats)
slides = _stats.slides

# --- readability ------------------------------------------------------------

LONG_SENTENCE = 22          # visible words; a slide sentence longer than this is a paragraph
LONG_NOTE_FREE = 30         # an aside/callout sentence this long is almost always two ideas

# Phrases that read fine to a native speaker and trip up everyone else. Each
# maps to a plainer alternative the reviewer can use or ignore.
IDIOMS = {
    r"\bthe plot\b": "'the story' — 'plot' also means a chart here",
    r"\bearns its keep\b": "'is worth it'",
    r"\bbookkeeping\b": "'detail'",
    r"\bfor free\b": "'at no extra cost'",
    r"\bboils down to\b": "'comes down to' / 'is'",
    r"\bat the end of the day\b": "drop it",
    r"\bin a nutshell\b": "drop it",
    r"\bthe catch\b": "'the problem'",
    r"\bon paper\b": "'in theory' (or 'by hand')",
    r"\bpays in\b": "'costs'",
    r"\bpays off\b": "'is used'",
    r"\bno free lunch\b": "'there is always a cost'",
    r"\bwearing different clothes\b": "'drawn differently'",
    r"\bleash\b": "'penalty' — say what it pulls toward",
    r"\bknock(s|ed)? down\b": "'solve'",
    r"\bbaked into\b": "'built into'",
    r"\bhands you\b": "'gives you'",
    r"\bget(s)? round\b": "'avoid'",
    r"\bgo(es)? backwards\b": "say what is reversed",
    r"\bon the table\b": "drop it",
    r"\bnot a bug\b": "fine, but say what it is",
    r"\bcheap way\b": "'simple way'",
}

# Acronyms a PGR207 student has by the time of any deck that uses them.
KNOWN_ACRONYMS = {
    "CNN", "MSE", "BCE", "GPU", "CPU", "PDF", "PNG", "RGB", "MNIST", "ReLU",
    "API", "AI", "ML", "DL", "PGR207", "PyTorch", "OK", "I", "II", "III", "IV",
    "TV", "KL", "JS", "EM", "N",
}

ACRONYM = re.compile(r"\b([A-Z][A-Z0-9]{1,6}(?:-[A-Z0-9]+)?)\b")


def visible_text(body):
    """What the room reads: no notes, code, display maths, tables or SVG internals.

    Returns (blocks, props, items): blocks are paragraphs or single bullets with
    their source line-wrapping undone, so a sentence is never split by a newline
    and two bullets are never glued into one sentence.
    """
    b = re.sub(r"<!--.*?-->", " ", body, flags=re.S)
    b = re.sub(r"```.*?```", " ", b, flags=re.S)
    b = re.sub(r"\$\$.*?\$\$", " ", b, flags=re.S)
    b = re.sub(r"<svg\b.*?</svg>", " ", b, flags=re.S)
    # Poll questions, card titles and blurbs live in props, and are read by the room.
    props = re.findall(r"""(?<![:\w-])(?:question|title|blurb|label)="([^"]+)\"""", b)
    items = []
    for m in re.finditer(r":items=\"\[(.*?)\]\"", b, flags=re.S):
        items += [i.replace("\\'", "'") for i in re.findall(r"'((?:[^'\\]|\\.)*)'", m.group(1))]
    b = re.sub(r'="[^"]*"', '=""', b)                     # attribute values (arrow fns contain ">")
    b = re.sub(r"\$[^$\n]*\$", " X ", b)
    b = re.sub(r"<[^>]+>", "\n\n", b)
    blocks, cur = [], []
    for line in b.splitlines():
        t = line.strip()
        if not t or t.startswith("|") or t.startswith("::") or re.match(r"^(?:#+\s|---$)", t) and not t.startswith("# "):
            if cur:
                blocks.append(" ".join(cur)); cur = []
            continue
        if re.match(r"^[-*]\s+", t):
            if cur:
                blocks.append(" ".join(cur))
            cur = [re.sub(r"^[-*]\s+", "", t)]
            continue
        if t.startswith("#"):
            if cur:
                blocks.append(" ".join(cur)); cur = []
            continue                                          # headings are titles, not sentences
        cur.append(t)
    if cur:
        blocks.append(" ".join(cur))
    blocks = [re.sub(r"[*`_]", "", x) for x in blocks]
    return blocks, props, items


def sentences(blocks):
    out = []
    for blk in blocks:
        for s in re.split(r"(?<=[.!?])\s+(?=[A-Z])", blk):
            if len(s.split()) >= 3:
                out.append(s.strip())
    return out


def read_checks(deck):
    rows, seen_acr, expanded = [], set(), set()
    for n, (layout, label, body) in enumerate(deck, start=1):
        blocks, props, items = visible_text(body)
        text = "\n".join(blocks)
        full = text + "\n" + "\n".join(props + items)
        # Expansions look like "variational autoencoder (VAE)" or "VAE (variational …)".
        for m in re.finditer(r"\(([A-Z][A-Za-z0-9-]{1,8})\)", full):
            expanded.add(m.group(1))
        for m in re.finditer(r"\b([A-Z][A-Z0-9-]{1,8})[*_]*\s*\(([^)\d][^)]{3,})\)", full):
            expanded.add(m.group(1))
            expanded.update(x for x in re.split(r"[^A-Za-z0-9]+", m.group(1)) if x)
        for s in sentences(blocks) + props + items:
            w = len(s.split())
            limit = LONG_NOTE_FREE if layout == "interactive" else LONG_SENTENCE
            if w > limit:
                rows.append((n, f"long sentence ({w} words): “{s[:110]}…”"))
            for pat, alt in IDIOMS.items():
                if re.search(pat, s, flags=re.I):
                    rows.append((n, f"idiom “{re.search(pat, s, flags=re.I).group(0)}” → {alt}"))
        for m in ACRONYM.finditer(full):
            a = m.group(1)
            if a in KNOWN_ACRONYMS or a in seen_acr or len(a) < 2:
                continue
            seen_acr.add(a)
            if a not in expanded:
                rows.append((n, f"acronym {a} first used here and never expanded on this slide"))
    return rows


# --- duplicates -------------------------------------------------------------

def norm(s):
    return " ".join(re.sub(r"[^a-z0-9 ]", " ", s.lower()).split())


def dup_checks(deck, raw):
    rows = []
    heads = defaultdict(list)
    sent_at = defaultdict(list)
    words = {}
    for n, (layout, label, body) in enumerate(deck, start=1):
        if label:
            heads[norm(label)].append(n)
        blocks, props, items = visible_text(body)
        text = "\n".join(blocks)
        for s in sentences(blocks) + props:
            k = norm(s)
            if len(k.split()) >= 6:
                sent_at[k].append(n)
        words[n] = set(norm(text).split())
    for h, ns in heads.items():
        if len(ns) > 1:
            rows.append((ns[0], f"heading “{h}” repeated on slides {ns}"))
    for s, ns in sent_at.items():
        if len(set(ns)) > 1:
            rows.append((ns[0], f"sentence repeated on slides {sorted(set(ns))}: “{s[:90]}”"))
    ids = sorted(words)
    for i, a in enumerate(ids):
        for b in ids[i + 1:]:
            A, B = words[a], words[b]
            if len(A) > 15 and len(B) > 15:
                j = len(A & B) / len(A | B)
                if j > 0.55:
                    rows.append((a, f"slides {a} and {b} share {j:.0%} of their words — merge or differentiate"))
    markers = defaultdict(list)
    for n, (_, _, body) in enumerate(deck, start=1):
        for m in re.finditer(r"<marker\s+id=\"([^\"]+)\"", body):
            markers[m.group(1)].append(n)
    for mid, ns in markers.items():
        if len(ns) > 1:
            rows.append((ns[0], f"<marker id=\"{mid}\"> defined on slides {ns} — ids must be unique across the deck"))
    return rows


# --- clicks -----------------------------------------------------------------

def click_checks(deck):
    rows = []
    for n, (layout, label, body) in enumerate(deck, start=1):
        b = re.sub(r"<!--.*?-->", " ", body, flags=re.S)
        code = re.findall(r"```(\w+)?\s*(\{[^}\n]*\})?[^\n]*\n(.*?)```", b, flags=re.S)
        stripped = re.sub(r"```.*?```", " ", b, flags=re.S)
        clicks = len(re.findall(r"\bv-click\b(?!s)", stripped)) + len(re.findall(r"<v-clicks", stripped))

        # Bullets outside <v-clicks> all appear at once.
        outside = re.sub(r"<v-clicks.*?</v-clicks>", " ", stripped, flags=re.S)
        loose = [l for l in outside.splitlines() if re.match(r"\s*[-*]\s+\S", l)]
        if len(loose) >= 2:
            rows.append((n, f"{len(loose)} bullets outside <v-clicks> — they all appear at once"))

        # A punchline visible from the start, above build-up that is clicked in.
        for m in re.finditer(r"<div(?![^>]*v-click)[^>]*class=\"[^\"]*dl-(callout|reveal)[^\"]*\"", stripped):
            if clicks:
                rows.append((n, f"dl-{m.group(1)} has no v-click but the slide builds — the conclusion shows before the argument"))

        if "<PollSlide" in stripped and re.search(r"dl-reveal", stripped) and not re.search(r"<div[^>]*v-click[^>]*dl-reveal|<div[^>]*dl-reveal[^>]*v-click", stripped):
            rows.append((n, "poll answer (dl-reveal) is not behind a click"))

        for m in re.finditer(r"<(div|span|g)\b[^>]*\bv-click\b(?!s)[^>]*>", stripped):
            tag = m.group(1)
            depth, i = 1, m.end()
            close = re.compile(rf"<{tag}\b[^>]*?(?<!/)>|</{tag}>")
            for mm in close.finditer(stripped, i):
                depth += -1 if mm.group(0).startswith("</") else 1
                if depth == 0:
                    if "<v-clicks" in stripped[i:mm.start()]:
                        rows.append((n, "<v-clicks> nested inside a v-click element — its clicks will do nothing"))
                    break

        for lang, rng, src in code:
            if lang == "mermaid":
                continue
            nlines = len(src.rstrip("\n").split("\n"))
            if not rng:
                if nlines > 4:
                    rows.append((n, f"{nlines}-line code block with no click-highlight range"))
                continue
            for part in rng.strip("{}").split("|"):
                for seg in part.split(","):
                    seg = seg.strip()
                    if seg in ("all", "none", "") or not re.match(r"^\d+(-\d+)?$", seg):
                        continue
                    hi = int(seg.split("-")[-1])
                    if hi > nlines:
                        rows.append((n, f"code highlight {seg} goes past line {nlines}"))

        words = _stats.prose_words(body)
        if clicks == 0 and layout in ("default", "figure") and words > 35 and "<PollSlide" not in b:
            rows.append((n, f"{words} words and no clicks — the whole slide lands at once"))
    return rows


def main():
    argv = sys.argv[1:]
    only = None
    if "--only" in argv:
        only = set(argv[argv.index("--only") + 1].split(","))
    decks = [a for a in argv if not a.startswith("--") and (only is None or a not in ",".join(only))]
    decks = [d for d in decks if (Path("decks") / d / "slides.md").exists()] or sorted(
        p.parent.name for p in Path("decks").glob("lecture-*/slides.md"))
    total = 0
    for d in decks:
        path = Path("decks") / d / "slides.md"
        deck = list(slides(path))
        groups = {"read": read_checks(deck), "dup": dup_checks(deck, path.read_text()), "click": click_checks(deck)}
        print(f"\n{d} — {len(deck)} slides")
        for g, rows in groups.items():
            if only and g not in only:
                continue
            print(f"  {g}: {len(rows)}")
            for n, msg in sorted(rows):
                label = deck[n - 1][1][:34]
                print(f"    {n:3d} {label:34s}  {msg}")
            total += len(rows)
    print()
    sys.exit(1 if total else 0)


if __name__ == "__main__":
    main()
