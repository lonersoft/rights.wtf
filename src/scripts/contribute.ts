/**
 * Form behaviour for /contribute/[code].
 *
 * Validates the full payload live using the same Zod schema that runs at build
 * time and in the submit Worker. The preview always shows the exact JSON that
 * will be committed to git, so there are no surprises in the PR diff.
 */
import { normalizeSubmission, submissionSchema, type Submission } from "../lib/schema";

const form = document.getElementById("contribute-form") as HTMLFormElement | null;
if (form) init(form);

function asInput(el: Element | null): HTMLInputElement | null {
	return el instanceof HTMLInputElement ? el : null;
}
function asSelect(el: Element | null): HTMLSelectElement | null {
	return el instanceof HTMLSelectElement ? el : null;
}
function asTextarea(el: Element | null): HTMLTextAreaElement | null {
	return el instanceof HTMLTextAreaElement ? el : null;
}

function init(form: HTMLFormElement) {
	const code = form.dataset.code ?? "";
	const baseUpdatedAt = form.dataset.updatedAt || undefined;
	const preview = document.getElementById("json-preview") as HTMLPreElement | null;
	const statusEl = document.getElementById("form-status");
	const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement | null;
	const copyBtn = document.getElementById("copy-json") as HTMLButtonElement | null;
	const noteEl = document.getElementById("submit-note");
	const template = document.getElementById("source-row-template") as HTMLTemplateElement | null;

	function collect(): Submission {
		const topics: Record<string, unknown> = {};

		for (const fs of form.querySelectorAll<HTMLElement>("[data-topic]")) {
			const key = fs.dataset.topic;
			if (!key) continue;

			const sources = [...fs.querySelectorAll<HTMLElement>("[data-source]")]
				.map((row) => ({
					label: asInput(row.querySelector('[data-source-field="label"]'))?.value ?? "",
					url: asInput(row.querySelector('[data-source-field="url"]'))?.value ?? "",
					kind: asSelect(row.querySelector('[data-source-field="kind"]'))?.value ?? "monitor",
				}))
				.filter((s) => s.label.trim() !== "" || s.url.trim() !== "");

			topics[key] = {
				status: asSelect(fs.querySelector('[data-field="status"]'))?.value ?? "unknown",
				summary: asTextarea(fs.querySelector('[data-field="summary"]'))?.value ?? "",
				since: asInput(fs.querySelector('[data-field="since"]'))?.value.trim() || undefined,
				sources,
			};
		}

		const credit = asInput(document.getElementById("credit"))?.value.trim() || undefined;

		return {
			code,
			topics: topics as Submission["topics"],
			baseUpdatedAt,
			credit,
		};
	}

	function validate(): { valid: boolean; payload: Submission } {
		const raw = collect();
		const payload = normalizeSubmission(raw);
		const result = submissionSchema.safeParse(payload);

		// Clear all fieldset error blocks
		form.querySelectorAll<HTMLElement>("[data-error]").forEach((el) => {
			el.hidden = true;
			el.textContent = "";
		});

		if (preview) {
			preview.textContent = JSON.stringify(payload, null, "\t");
		}

		if (result.success) {
			if (statusEl) {
				statusEl.textContent = "✓ valid — submitting will open a pull request for review.";
				statusEl.className = "mt-1 text-xs font-semibold text-ok";
			}
			if (submitBtn) {
				submitBtn.disabled = false;
				submitBtn.removeAttribute("aria-disabled");
			}
			return { valid: true, payload };
		}

		// Group problems by topic key (path[1]) or top-level (path[0])
		const count = result.error.issues.length;
		if (statusEl) {
			statusEl.textContent = `${count} problem${count === 1 ? "" : "s"} to fix before submitting`;
			statusEl.className = "mt-1 text-xs font-semibold text-bad";
		}
		if (submitBtn) {
			submitBtn.disabled = true;
			submitBtn.setAttribute("aria-disabled", "true");
		}

		for (const issue of result.error.issues) {
			const topicKey = issue.path[1];
			const target =
				typeof topicKey === "string"
					? form.querySelector<HTMLElement>(`[data-topic="${topicKey}"] [data-error]`)
					: null;

			const el = target ?? statusEl;
			if (!el) continue;
			el.hidden = false;
			const msg = issue.message;
			el.textContent = el.textContent && el !== statusEl ? `${el.textContent}; ${msg}` : msg;
		}

		return { valid: false, payload };
	}

	// Live validation on any input
	form.addEventListener("input", () => validate());
	form.addEventListener("change", () => validate());

	// Add/remove source rows via delegation
	form.addEventListener("click", (e) => {
		const target = e.target as HTMLElement | null;
		if (!target) return;

		const addBtn = target.closest<HTMLElement>("[data-add-source]");
		if (addBtn) {
			const fs = addBtn.closest("[data-topic]");
			const list = fs?.querySelector("[data-sources]");
			if (list && template) {
				list.appendChild(template.content.cloneNode(true));
				const firstInput = list.lastElementChild?.querySelector<HTMLInputElement>("input");
				firstInput?.focus();
				validate();
			}
			return;
		}

		const removeBtn = target.closest<HTMLElement>("[data-remove-source]");
		if (removeBtn) {
			const row = removeBtn.closest("[data-source]");
			row?.remove();
			validate();
		}
	});

	// Copy preview
	copyBtn?.addEventListener("click", async () => {
		if (!preview?.textContent) return;
		try {
			await navigator.clipboard.writeText(preview.textContent);
			const original = copyBtn.textContent;
			copyBtn.textContent = "copied!";
			setTimeout(() => {
				copyBtn.textContent = original;
			}, 1500);
		} catch {
			if (noteEl) noteEl.textContent = "could not copy to clipboard";
		}
	});

	// Submit handler
	form.addEventListener("submit", async (e) => {
		e.preventDefault();
		const { valid, payload } = validate();
		if (!valid || !submitBtn || submitBtn.disabled) return;

		submitBtn.disabled = true;
		if (noteEl) {
			noteEl.textContent = "opening pull request…";
			noteEl.className = "text-[11px] text-ink";
		}

		try {
			const res = await fetch("/api/submit", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const body = (await res.json().catch(() => ({}))) as {
				ok?: boolean;
				prUrl?: string;
				error?: string;
			};

			if (!res.ok || !body.prUrl) {
				throw new Error(body.error ?? `server returned ${res.status}`);
			}

			if (noteEl) {
				noteEl.textContent = "opened! redirecting…";
				noteEl.className = "text-[11px] font-bold text-ok";
			}
			window.location.href = body.prUrl;
		} catch (err) {
			submitBtn.disabled = false;
			if (noteEl) {
				const msg = err instanceof Error ? err.message : "submission failed";
				noteEl.textContent = `error: ${msg}`;
				noteEl.className = "text-[11px] font-semibold text-bad";
			}
		}
	});

	// Initial parse to set up preview and validation state
	validate();
}
