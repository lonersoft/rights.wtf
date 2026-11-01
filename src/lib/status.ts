import type { Coverage } from "./jurisdictions";
import type { TopicStatus } from "./schema";
import { BADGE_SIZE, type BadgeSize } from "./ui";

/**
 * Single source of truth for how a legal status looks.
 *
 * This exists because the mapping used to be copied into three pages and a
 * client script, and had already drifted: the homepage server-rendered an
 * amber badge for a `verified` country until JavaScript corrected it.
 *
 * Anything that renders a status imports from here — including client scripts,
 * so the pre-JS markup and the hydrated markup cannot disagree.
 */

export type { TopicStatus };

export type Tone = "neutral" | "ok" | "warn" | "info" | "bad" | "caution" | "accent";

/** Tone -> Tailwind classes. The only place these hue names are allowed. */
export const TONE_CLASS: Record<Tone, string> = {
	neutral: "border-line bg-surface-sunk text-ink-muted",
	ok: "border-ok-line bg-ok-soft text-ok",
	warn: "border-warn-line bg-warn-soft text-warn",
	info: "border-info-line bg-info-soft text-info",
	bad: "border-bad-line bg-bad-soft text-bad",
	caution: "border-caution-line bg-caution-soft text-caution",
	accent: "border-line bg-accent-soft text-accent-ink",
};

/** Dot, glyph and text colour for one topic's legal status. */
export const STATUS_STYLE: Record<TopicStatus, { dot: string; mark: string; text: string }> = {
	protected: { dot: "bg-ok-dot", mark: "✓", text: "text-ok" },
	partial: { dot: "bg-warn-dot", mark: "⚖", text: "text-warn" },
	restricted: { dot: "bg-caution-dot", mark: "!", text: "text-caution" },
	criminalized: { dot: "bg-bad-dot", mark: "✕", text: "text-bad" },
	unknown: { dot: "bg-ink-faint", mark: "?", text: "text-ink-faint" },
};

export const STATUS_TEXT: Record<TopicStatus, string> = {
	protected: "protected",
	partial: "partial",
	restricted: "restricted",
	criminalized: "criminalized",
	unknown: "not verified yet",
};

/** How much of a jurisdiction we have actually checked. */
export const COVERAGE: Record<Coverage, { label: string; short: string; tone: Tone }> = {
	verified: { label: "verified", short: "verified", tone: "ok" },
	imported: { label: "imported, pending check", short: "imported", tone: "warn" },
	submitted: { label: "submitted, pending check", short: "submitted", tone: "accent" },
	partial: { label: "partially verified", short: "partial", tone: "info" },
	stub: { label: "not verified yet", short: "not verified", tone: "neutral" },
};

/**
 * Full class string for a coverage badge. Used by both the Astro markup and the
 * homepage client script, so the first paint matches what JS would render.
 */
export function coverageBadgeClass(coverage: Coverage, size: BadgeSize = "xs"): string {
	return `inline-flex items-center rounded-full border font-bold ${BADGE_SIZE[size]} ${TONE_CLASS[COVERAGE[coverage].tone]}`;
}
