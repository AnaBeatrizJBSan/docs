import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { getEntries } from 'astro:content';
import { getRepoBaseUrl, getRepoRoot } from './repo';
import { normalizeSlug } from './utils';
import { getAuthorInfo } from './getAuthorAvatar';

const GIT_COMMIT_SPLIT = '==RECENT_CHANGES_COMMIT==';
const CONTENT_DIR = 'src/content/docs';

function commitKindFromMessage(message: string) {
	const trimmed = message.trim();

	// 1. Check for Conventional Commit prefix at the start of the message (e.g. feat:, fix(scope):, refactor!:, etc.)
	const prefixMatch = trimmed.match(/^([a-z0-9_-]+)(?:\([^)]+\))?!?:/i);
	if (prefixMatch && prefixMatch[1]) {
		const prefix = prefixMatch[1].toLowerCase();

		if (['feat', 'feature', 'add', 'create', 'new', 'init'].includes(prefix)) {
			return 'add';
		}
		if (['remove', 'delete', 'rm', 'drop', 'revert'].includes(prefix)) {
			return 'delete';
		}
		if ([
			'fix', 'docs', 'style', 'refactor', 'perf', 'test',
			'build', 'ci', 'chore', 'update', 'change', 'tweak', 'wip'
		].includes(prefix)) {
			return 'edit';
		}
	}

	// 2. Fallback keyword search within message content if no prefix matched
	if (/\b(add|create|new|init|adiciona|adicionar|criado|criacao)\b/i.test(trimmed)) return 'add';
	if (/\b(remove|delete|rm|drop|revert|removeu|remover|removido|remocao)\b/i.test(trimmed)) return 'delete';
	return 'edit';
}

export async function getRecentChanges(filePath?: string) {
	const limit = 1000;
	const root = getRepoRoot();
	const docsRoot = path.resolve(root, CONTENT_DIR);
	const repoBaseUrl = getRepoBaseUrl(root);

	let filterSlug: string | null = null;
	if (filePath) {
		filterSlug = normalizeSlug(filePath, docsRoot);
	}

	let rawLog = '';
	try {
		const result = spawnSync(
			'git',
			[
				'log',
				'--no-merges',
				'--date=iso-strict',
				`--pretty=format:${GIT_COMMIT_SPLIT}%H|%an|%ae|%ad|%s`,
				'--name-only',
				'--',
				CONTENT_DIR
			],
			{ cwd: root, encoding: 'utf8' }
		);

		rawLog = result.stdout;
	} catch {
		return [];
	}

	const entries = await Promise.all(rawLog
		.split(GIT_COMMIT_SPLIT)
		.filter(Boolean)
		.map(async (chunk) => {
			const lines = chunk.split(/\r?\n/).filter(Boolean);
			const [meta, ...files] = lines;
			if (!meta) return null;

			const [hash, author, authorEmail, date, ...messageParts] = meta.split('|');
			const message = messageParts.join('|').trim();
			let touchedFiles = Array.from(
				new Set(
					files
						.map((file) => file.trim())
						.filter((file) => file && file.startsWith(CONTENT_DIR) && /\.(md|mdx)$/.test(file))
				)
			);

			if (filterSlug && !touchedFiles.some(file => normalizeSlug(path.resolve(root, file), docsRoot) === filterSlug)) {
				return null;
			}

			// Load titles in batch using getEntries
			const slugs = Array.from(new Set(touchedFiles.map(file => normalizeSlug(path.resolve(root, file), docsRoot))));
			const contentEntries = await getEntries(slugs.map(id => ({ collection: 'docs' as const, id })))
				;

			const titleMap = new Map(contentEntries.filter(x => !!x).map(entry => [entry.id, entry.data.title as string || '']));

			const pages = touchedFiles.map((file) => {
				const slug = normalizeSlug(path.resolve(root, file), docsRoot);
				const title = titleMap.get(slug) || "Unknown title";
				return {
					title,
					slug,
				};
			});

			const authorName = author.trim();
			const authorInfo = getAuthorInfo(authorName, authorEmail || '', root);
			const authorQuery = authorInfo.handle || authorName;
			const authorUrl = repoBaseUrl ? `${repoBaseUrl}/commits?author=${encodeURIComponent(authorQuery)}` : undefined;

			return {
				date,
				kind: commitKindFromMessage(message),
				author: authorName,
				authorAvatarUrl: authorInfo.avatarUrl,
				authorUrl,
				message,
				pages,
				commitUrl: repoBaseUrl ? `${repoBaseUrl}/commit/${hash}` : hash,
			};
		})).then(r => r
			.filter(x => !!x));

	return entries;
}
