import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

interface RcContributor {
	login?: string;
	name?: string;
	avatar_url?: string;
	[key: string]: any;
}

let cachedRcContributors: RcContributor[] | null = null;

function getRcContributors(root: string): RcContributor[] {
	if (cachedRcContributors) return cachedRcContributors;

	let currentDir = root;
	while (currentDir) {
		const filePath = path.join(currentDir, '.all-contributorsrc');
		if (fs.existsSync(filePath)) {
			try {
				const content = fs.readFileSync(filePath, 'utf-8');
				const parsed = JSON.parse(content);
				if (Array.isArray(parsed?.contributors)) {
					cachedRcContributors = parsed.contributors;
					return cachedRcContributors!;
				}
			} catch {}
			break;
		}

		const parentDir = path.dirname(currentDir);
		if (parentDir === currentDir) break;
		currentDir = parentDir;
	}

	cachedRcContributors = [];
	return cachedRcContributors;
}

export function getAuthorAvatar(authorName: string, authorEmail: string, root: string): string | undefined {
	const name = authorName.trim();
	const email = authorEmail.trim().toLowerCase();

	const contributors = getRcContributors(root);

	// 1. Try to find matching contributor in .all-contributorsrc by name, login, or email inclusion
	for (const c of contributors) {
		if (!c.avatar_url) continue;

		const cName = c.name?.toLowerCase();
		const cLogin = c.login?.toLowerCase();

		if (cName && cName === name.toLowerCase()) {
			return c.avatar_url;
		}
		if (cLogin && (cLogin === name.toLowerCase() || (email && email.includes(cLogin)))) {
			return c.avatar_url;
		}
	}

	// 2. Check GitHub noreply email (e.g. 12345+username@users.noreply.github.com or username@users.noreply.github.com)
	const githubNoreplyMatch = email.match(/^(?:\d+\+)?([^@]+)@users\.noreply\.github\.com$/i);
	if (githubNoreplyMatch && githubNoreplyMatch[1]) {
		const ghUser = githubNoreplyMatch[1];
		for (const c of contributors) {
			if (c.avatar_url && c.login?.toLowerCase() === ghUser.toLowerCase()) {
				return c.avatar_url;
			}
		}
		return `https://github.com/${ghUser}.png`;
	}

	// 3. Check if authorName matches a single-word GitHub handle
	if (name && !name.includes(' ') && /^[a-z0-9-]+$/i.test(name)) {
		return `https://github.com/${name}.png`;
	}

	// 4. Fallback to Gravatar if email is present
	if (email && email.includes('@')) {
		const hash = crypto.createHash('md5').update(email).digest('hex');
		return `https://www.gravatar.com/avatar/${hash}?d=404`;
	}

	return undefined;
}
