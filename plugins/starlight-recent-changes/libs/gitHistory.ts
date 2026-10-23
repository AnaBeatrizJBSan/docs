import { spawnSync } from 'node:child_process';
import { statSync } from 'node:fs';
import path from 'node:path';

export interface HistoryAuthor { name: string; email: string }
export interface HistoryFile { path: string; status: string; previousPath?: string }
export interface HistoryCommit {
	hash: string;
	date: string;
	message: string;
	authors: HistoryAuthor[];
	files: HistoryFile[];
}

export const contentDirectory = 'src/content/docs';
const snapshots = new Map<string, { gitDirectory: string; signature: string; commits: HistoryCommit[] }>();

function fileSignature(file: string): string {
	try {
		const stat = statSync(file);
		return `${stat.mtimeMs}:${stat.size}`;
	} catch { return ''; }
}

/** One shared Git read per repository revision; no Git process per rendered page. */
export function getGitHistory(root = process.cwd()): HistoryCommit[] {
	root = path.resolve(root);
	const cached = snapshots.get(root);
	const gitDirectory = cached?.gitDirectory ?? spawnSync('git', ['rev-parse', '--absolute-git-dir'], {
		cwd: root, encoding: 'utf8', windowsHide: true,
	}).stdout?.trim() ?? '';
	const signature = [
		fileSignature(path.join(gitDirectory, 'logs/HEAD')),
		fileSignature(path.join(gitDirectory, 'HEAD')),
		fileSignature(path.join(root, '.mailmap')),
		fileSignature(path.join(root, '.all-contributorsrc')),
	].join('|');
	if (cached?.signature === signature) return cached.commits;
	const result = spawnSync('git', [
		'log', '--topo-order', '--no-merges', '--find-renames', '--name-status', '-z',
		'--format=%x1e%H%x00%aN%x00%aE%x00%cI%x00%s%x00%B%x00', '--', contentDirectory,
	], { cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
	if (result.status !== 0) {
		console.warn('[starlight-recent-changes] Não foi possível ler o histórico Git da documentação.');
	}
	const commits = result.status === 0 ? parseHistory(result.stdout) : [];
	snapshots.set(root, { gitDirectory, signature, commits });
	return commits;
}

function parseHistory(log: string): HistoryCommit[] {
	const commits: HistoryCommit[] = [];
	for (const chunk of log.split('\x1e').filter(Boolean)) {
		const [hash, name, email, date, message, body, ...tokens] = chunk.split('\0');
		if (!hash || !name || !date || body === undefined) continue;
		const authors = [{ name, email }];
		for (const match of body.matchAll(/^Co-authored-by:\s*(.+?)\s*<([^<>\r\n]+)>\s*$/gim)) {
			authors.push({ name: match[1].trim(), email: match[2].trim() });
		}
		const files: HistoryFile[] = [];
		for (let i = 0; i < tokens.length;) {
			const status = tokens[i++].trim();
			if (!status) continue;
			const first = tokens[i++];
			if (!first) continue;
			const renamed = status[0] === 'R' || status[0] === 'C';
			const filePath = renamed ? tokens[i++] : first;
			if (!filePath?.startsWith(`${contentDirectory}/`) || !/\.mdx?$/.test(filePath)) continue;
			files.push({ path: filePath, status: status[0], ...(renamed ? { previousPath: first } : {}) });
		}
		if (files.length) commits.push({ hash, date, message, authors, files });
	}
	return commits;
}
