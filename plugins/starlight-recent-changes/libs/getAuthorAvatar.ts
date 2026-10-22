import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

interface RcContributor {
	login?: string;
	name?: string;
	avatar_url?: string;
	[key: string]: any;
}

export interface AuthorDetails {
	avatarUrl?: string;
	handle?: string;
	name?: string;
	/** Login recognized from the contributor registry or a GitHub noreply address. */
	githubLogin?: string;
}

const cachedRcContributors = new Map<string, { modified: number; contributors: RcContributor[] }>();

function getRcContributors(root: string): RcContributor[] {
	let currentDir = root;
	while (currentDir) {
		const filePath = path.join(currentDir, '.all-contributorsrc');
		if (fs.existsSync(filePath)) {
			try {
				const modified = fs.statSync(filePath).mtimeMs;
				const cached = cachedRcContributors.get(filePath);
				if (cached?.modified === modified) return cached.contributors;
				const content = fs.readFileSync(filePath, 'utf-8');
				const parsed = JSON.parse(content);
				if (Array.isArray(parsed?.contributors)) {
					cachedRcContributors.set(filePath, { modified, contributors: parsed.contributors });
					return parsed.contributors;
				}
			} catch {}
			break;
		}

		const parentDir = path.dirname(currentDir);
		if (parentDir === currentDir) break;
		currentDir = parentDir;
	}

	return [];
}

export function getAuthorInfo(authorName: string, authorEmail: string, root: string): AuthorDetails {
	const name = authorName.trim();
	const email = authorEmail.trim().toLowerCase();
	const emailNameParts = email.split('@')[0].split(/[.+_]/);

	const contributors = getRcContributors(root);

	// 1. Match registry names/logins or a complete username segment in the email.
	for (const c of contributors) {
		const cName = c.name?.toLowerCase();
		const cLogin = c.login;
		const cLoginLower = cLogin?.toLowerCase();

		if (cName && cName === name.toLowerCase()) {
			return {
				name: c.name || name,
				githubLogin: cLogin,
				avatarUrl: c.avatar_url,
				handle: cLogin || name,
			};
		}
		if (cLoginLower && (cLoginLower === name.toLowerCase() || emailNameParts.includes(cLoginLower))) {
			return {
				name: c.name || name,
				githubLogin: cLogin,
				avatarUrl: c.avatar_url,
				handle: cLogin || name,
			};
		}
	}

	// 2. Check GitHub noreply email (e.g. 12345+username@users.noreply.github.com or username@users.noreply.github.com)
	const githubNoreplyMatch = email.match(/^(?:\d+\+)?([^@]+)@users\.noreply\.github\.com$/i);
	if (githubNoreplyMatch && githubNoreplyMatch[1]) {
		const ghUser = githubNoreplyMatch[1];
		let avatarUrl = `https://github.com/${ghUser}.png`;
		for (const c of contributors) {
			if (c.avatar_url && c.login?.toLowerCase() === ghUser.toLowerCase()) {
				avatarUrl = c.avatar_url;
				break;
			}
		}
		return {
			githubLogin: ghUser,
			avatarUrl,
			handle: ghUser,
		};
	}

	// 3. Check if authorName matches a single-word GitHub handle
	if (name && !name.includes(' ') && /^[a-z0-9-]+$/i.test(name)) {
		return {
			avatarUrl: `https://github.com/${name}.png`,
			handle: name,
		};
	}

	// 4. Fallback to Gravatar if email is present
	let avatarUrl: string | undefined = undefined;
	if (email && email.includes('@')) {
		const hash = crypto.createHash('md5').update(email).digest('hex');
		avatarUrl = `https://www.gravatar.com/avatar/${hash}?d=404`;
	}

	return {
		avatarUrl,
		handle: name,
	};
}

export function getAuthorAvatar(authorName: string, authorEmail: string, root: string): string | undefined {
	return getAuthorInfo(authorName, authorEmail, root).avatarUrl;
}
