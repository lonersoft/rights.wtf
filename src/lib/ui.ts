/**
 * Shared class strings for form controls and small UI parts.
 *
 * Kept as constants rather than components because <input> and <select> need
 * different wrappers but must look identical, and the badge sizing has to be
 * usable from plain client scripts as well as Astro components.
 */
export const FIELD_CLASS =
	"w-full rounded-xl border border-line-strong bg-accent-soft/30 px-3.5 py-2.5 text-sm text-ink transition-colors focus:border-accent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent-soft-2";

/**
 * Badge sizes. These are the only sizes — callers must not add px/py/text
 * utilities on top, because Tailwind resolves conflicts by stylesheet order,
 * not by the order classes appear in the attribute.
 */
export const BADGE_SIZE = {
	xs: "px-2 py-0.5 text-[10px]",
	sm: "px-2.5 py-0.5 text-[11px]",
	md: "px-2.5 py-1 text-[11px]",
} as const;

export type BadgeSize = keyof typeof BADGE_SIZE;
