/**
 * The content contract.
 *
 * This lives outside `content.config.ts` because three consumers need it and
 * only one of them is Astro: the build (via astro:content), the contribution
 * form (browser), and the submit Worker (server). If this file ever imports
 * `astro:content`, the other two stop working — so it imports nothing but zod.
 *
 * The rule the whole site rests on: a topic may not make a claim without a
 * source. That is enforced here, which means it is enforced at build time, in
 * the browser before submit, and again in the Worker.
 */
import { z } from "zod";

export const CODE_RE = /^[a-z]{2}(-[a-z0-9]{1,3})?$/;

/** Primary law > court ruling > government > monitor > local org. */
export const sourceKinds = [
	"primary-law",
	"court-ruling",
	"government",
	"monitor",
	"local-org",
] as const;

export const sourceSchema = z
	.object({
		label: z.string().min(3).max(200),
		url: z.string().url().max(500),
		kind: z.enum(sourceKinds).default("monitor"),
	})
	.strict();

export const statusSchema = z.enum([
	"protected",
	"partial",
	"restricted",
	"criminalized",
	"unknown",
]);

export type TopicStatus = z.infer<typeof statusSchema>;

export const topicKeys = [
	"decriminalization",
	"marriage",
	"genderRecognition",
	"conversionTherapy",
	"asylum",
] as const;

export type TopicKey = (typeof topicKeys)[number];

const CLAIM_MESSAGE = "a topic that is not 'unknown' needs at least one source";

const claimShape = {
	status: statusSchema.default("unknown"),
	summary: z.string().max(1200).default(""),
	since: z.string().max(80).optional(),
	sources: z.array(sourceSchema).max(12).default([]),
};

const hasSource = (t: { status: TopicStatus; sources: unknown[] }) =>
	t.status === "unknown" || t.sources.length > 0;

/**
 * What a submitter is allowed to send. Deliberately narrower than the stored
 * topic: no `verifiedAt`, because only a maintainer stamps that.
 */
export const submittedTopicSchema = z
	.object(claimShape)
	.strict()
	.refine(hasSource, { message: CLAIM_MESSAGE });

/** What the build reads off disk. */
export const topicSchema = z
	.object({ ...claimShape, verifiedAt: z.string().max(20).optional() })
	.strict()
	.refine(hasSource, { message: CLAIM_MESSAGE });

export const helplineSchema = z
	.object({
		name: z.string().min(1).max(120),
		contact: z.string().min(1).max(200),
		url: z.string().url().max(500).optional(),
	})
	.strict();

/**
 * Trust tier. Provenance, not confidence:
 *  - verified:  a maintainer checked it against primary law
 *  - imported:  bulk import from a monitor, not checked against primary law
 *  - submitted: came in through the public form, waiting for a maintainer
 *  - stub:      nothing but helplines
 */
export const verificationSchema = z.enum(["verified", "imported", "submitted", "stub"]);

export type Verification = z.infer<typeof verificationSchema>;

export const topicsSchema = z
	.object({
		decriminalization: topicSchema,
		marriage: topicSchema,
		genderRecognition: topicSchema,
		conversionTherapy: topicSchema,
		asylum: topicSchema,
	})
	.strict();

export const jurisdictionSchema = z
	.object({
		code: z.string().regex(CODE_RE),
		name: z.string().min(1).max(120),
		parent: z.string().nullable().default(null),
		region: z.string().max(120).optional(),
		verification: verificationSchema.default("stub"),
		updatedAt: z.string().max(20).optional(),
		helplines: z.array(helplineSchema).default([]),
		topics: topicsSchema,
	})
	.strict();

export type JurisdictionData = z.infer<typeof jurisdictionSchema>;

/**
 * The public API payload. `.strict()` is a security control, not tidiness: a
 * submitter sending `verification: "verified"` gets a 400 rather than having
 * the field quietly dropped by a filter someone later forgets to update.
 *
 * Note what is absent: `name`, `parent`, `helplines`, `verification`,
 * `updatedAt`. Those come from the canonical list or the existing file.
 */
export const submissionSchema = z
	.object({
		code: z.string().regex(CODE_RE),
		topics: z
			.object({
				decriminalization: submittedTopicSchema,
				marriage: submittedTopicSchema,
				genderRecognition: submittedTopicSchema,
				conversionTherapy: submittedTopicSchema,
				asylum: submittedTopicSchema,
			})
			.strict(),
		/** What the form saw when it loaded, so a stale base is visible. */
		baseUpdatedAt: z.string().max(20).optional(),
		/** Optional public credit. Rendered as "claimed, unverified". */
		credit: z.string().max(80).optional(),
		/** Optional Cloudflare Turnstile token for abuse protection. */
		turnstileToken: z.string().max(2048).optional(),
	})
	.strict();

export type Submission = z.infer<typeof submissionSchema>;

/** Trim empty source rows so a blank row is not a validation error. */
export function normalizeSubmission(input: Submission): Submission {
	const topics = Object.fromEntries(
		Object.entries(input.topics).map(([key, t]) => [
			key,
			{
				...t,
				summary: t.summary.trim(),
				since: t.since?.trim() || undefined,
				sources: t.sources.filter((s) => s.url.trim() && s.label.trim()),
			},
		]),
	);
	return { ...input, credit: input.credit?.trim() || undefined, topics } as Submission;
}
