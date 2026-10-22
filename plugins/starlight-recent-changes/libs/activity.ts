import path from 'node:path';
import { getAuthorInfo } from './getAuthorAvatar.ts';
import { getGitHistory } from './gitHistory.ts';

export interface PageContributor {
	name: string;
	login?: string;
	avatarUrl?: string;
	profileUrl?: string;
	lastContributedAt: string;
}

export interface ActivityPage { id: string; filePath?: string }
export interface PageUpdate { id: string; date: string; kind: 'add' | 'edit' }

const relativePath = (file: string, root: string) => path.relative(root, path.resolve(root, file)).replace(/\\/g, '/');
const githubLogin = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;

export function getPageContributors(filePath: string, root = process.cwd()): PageContributor[] {
	let currentPath = relativePath(filePath, root);
	const contributors = new Map<string, PageContributor>();
	for (const commit of getGitHistory(root)) {
		const file = commit.files.find((file) => file.path === currentPath);
		if (!file) continue;
		for (const author of commit.authors) {
			if (/\[bot\]|^(github-actions|dependabot)$/i.test(author.name)) continue;
			const info = getAuthorInfo(author.name, author.email, root);
			const login = info.githubLogin && githubLogin.test(info.githubLogin) ? info.githubLogin : undefined;
			const key = (login ?? author.email ?? author.name).toLowerCase();
			const previous = contributors.get(key);
			if (!previous || Date.parse(commit.date) > Date.parse(previous.lastContributedAt)) contributors.set(key, {
				name: info.name ?? author.name, login, avatarUrl: login ? info.avatarUrl : undefined,
				profileUrl: login ? `https://github.com/${login}` : undefined,
				lastContributedAt: commit.date,
			});
		}
		if (file.status === 'R' && file.previousPath) currentPath = file.previousPath;
		if (file.status === 'A') break;
	}
	return [...contributors.values()].sort((a, b) => Date.parse(b.lastContributedAt) - Date.parse(a.lastContributedAt));
}

/** Summarize only the caller's eligible, currently published pages. */
export function getRecentlyUpdatedPages(
	pages: readonly ActivityPage[],
	{ root = process.cwd(), limit = 6 }: { root?: string; limit?: number } = {},
): PageUpdate[] {
	if (limit <= 0) return [];
	const eligible = new Map(pages.filter((page) => page.filePath).map((page) => [relativePath(page.filePath!, root), page.id]));
	const updates = new Map<string, PageUpdate>();
	for (const commit of getGitHistory(root)) {
		for (const file of commit.files) {
			const id = eligible.get(file.path);
			if (!id || updates.has(id) || file.status === 'D') continue;
			updates.set(id, { id, date: commit.date, kind: file.status === 'A' ? 'add' : 'edit' });
		}
	}
	return [...updates.values()].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, limit);
}
