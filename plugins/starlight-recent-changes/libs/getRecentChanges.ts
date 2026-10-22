import path from 'node:path';
import { getCollection } from 'astro:content';
import { getRepoBaseUrl, getRepoRoot } from './repo';
import { normalizeSlug } from './utils';
import { getAuthorInfo } from './getAuthorAvatar';
import { contentDirectory, getGitHistory } from './gitHistory.ts';

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
	const root = getRepoRoot();
	const docsRoot = path.resolve(root, contentDirectory);
	const repoBaseUrl = getRepoBaseUrl(root);
	const titles = new Map((await getCollection('docs')).map((entry) => [entry.id, entry.data.title]));
	const filterSlug = filePath ? normalizeSlug(filePath, docsRoot) : undefined;
	return [...getGitHistory(root)].sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
		.filter((commit) => !filterSlug || commit.files.some((file) => normalizeSlug(path.resolve(root, file.path), docsRoot) === filterSlug))
		.map((commit) => {
			const author = commit.authors[0];
			const info = getAuthorInfo(author.name, author.email, root);
			return {
				date: commit.date, kind: commitKindFromMessage(commit.message),
				author: author.name, authorAvatarUrl: info.avatarUrl,
				authorUrl: repoBaseUrl ? `${repoBaseUrl}/commits?author=${encodeURIComponent(info.handle || author.name)}` : undefined,
				message: commit.message,
				pages: commit.files.map((file) => {
					const slug = normalizeSlug(path.resolve(root, file.path), docsRoot);
					return { slug, title: titles.get(slug) || path.basename(slug) };
				}),
				commitUrl: repoBaseUrl ? `${repoBaseUrl}/commit/${commit.hash}` : commit.hash,
			};
		});
}
