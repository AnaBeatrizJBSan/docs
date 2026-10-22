import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { getPageContributors, getRecentlyUpdatedPages } from '../libs/activity.ts';

async function repository(t: import('node:test').TestContext) {
	const root = await mkdtemp(path.join(os.tmpdir(), 'docs-activity-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: 'pipe' });
	git('init', '--initial-branch=main');
	git('config', 'user.name', 'Alice');
	git('config', 'user.email', 'alice@users.noreply.github.com');
	await mkdir(path.join(root, 'src/content/docs'), { recursive: true });
	await writeFile(path.join(root, '.all-contributorsrc'), JSON.stringify({ contributors: [
		{ login: 'alice', name: 'Alice Example', avatar_url: 'https://github.com/alice.png' },
		{ login: 'bob', name: 'Bob Example', avatar_url: 'https://github.com/bob.png' },
	] }));
	async function commit(file: string, content: string, author: string, date: string, message: string) {
		await writeFile(path.join(root, 'src/content/docs', file), content);
		git('add', '.');
		execFileSync('git', ['commit', '-m', message, `--author=${author}`], {
			cwd: root, stdio: 'pipe', env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
		});
	}
	return { root, git, commit };
}

test('orders unique contributors by latest participation, includes coauthors and follows renames', async (t) => {
	const { root, git, commit } = await repository(t);
	await commit('old.mdx', 'First', 'Alice <alice@users.noreply.github.com>', '2026-01-01T12:00:00Z', 'docs: start');
	await commit('old.mdx', 'Second', 'Bob <bob@users.noreply.github.com>', '2026-01-02T12:00:00Z', 'docs: improve');
	git('mv', 'src/content/docs/old.mdx', 'src/content/docs/new.mdx');
	await commit('new.mdx', 'Second', 'Alice <123+alice@users.noreply.github.com>', '2026-01-03T12:00:00Z', 'docs: rename\n\nCo-authored-by: Carol <carol@users.noreply.github.com>');
	await commit('new.mdx', 'Automated', 'dependabot[bot] <bot@users.noreply.github.com>', '2026-01-04T12:00:00Z', 'chore: automatic');
	const contributors = getPageContributors(path.join(root, 'src/content/docs/new.mdx'), root);
	assert.deepEqual(contributors.map(({ login }) => login), ['alice', 'carol', 'bob']);
	assert.equal(contributors[0].name, 'Alice Example');
	assert.equal(contributors[0].profileUrl, 'https://github.com/alice');
	assert.equal(Date.parse(contributors[2].lastContributedAt), Date.parse('2026-01-02T12:00:00Z'));
	assert.equal(contributors.length, 3);
});

test('summarizes existing pages once and uses file status rather than the commit message for new pages', async (t) => {
	const { root, git, commit } = await repository(t);
	await commit('guide.mdx', 'First', 'Alice <alice@users.noreply.github.com>', '2026-01-01T12:00:00Z', 'docs: existing page');
	await commit('removed.mdx', 'Gone', 'Alice <alice@users.noreply.github.com>', '2026-01-02T12:00:00Z', 'docs: temporary');
	await commit('new.mdx', 'New', 'Alice <alice@users.noreply.github.com>', '2026-01-03T12:00:00Z', 'fix: actually adds a page');
	await commit('guide.mdx', 'Latest', 'Bob <bob@users.noreply.github.com>', '2026-01-04T12:00:00Z', 'feat: actually edits a page');
	git('rm', 'src/content/docs/removed.mdx');
	git('commit', '-m', 'docs: remove');
	const pages = ['guide', 'new'].map((id) => ({ id, filePath: path.join(root, 'src/content/docs', `${id}.mdx`) }));
	assert.deepEqual(getRecentlyUpdatedPages(pages, { root }).map(({ id, kind }) => ({ id, kind })), [
		{ id: 'guide', kind: 'edit' }, { id: 'new', kind: 'add' },
	]);
	assert.equal(getRecentlyUpdatedPages(pages, { root, limit: 1 })[0].id, 'guide');
	assert.deepEqual(getRecentlyUpdatedPages(pages, { root, limit: 0 }), []);
});

test('refreshes the shared snapshot after a new commit and does not reuse identities across repositories', async (t) => {
	const { root, commit } = await repository(t);
	await commit('page.mdx', 'First', 'Alice <alice@users.noreply.github.com>', '2026-01-01T12:00:00Z', 'docs: start');
	const file = path.join(root, 'src/content/docs/page.mdx');
	assert.equal(getPageContributors(file, root)[0].login, 'alice');
	await commit('page.mdx', 'Second', 'Bob <bob@users.noreply.github.com>', '2026-01-02T12:00:00Z', 'docs: edit');
	assert.deepEqual(getPageContributors(file, root).map(({ login }) => login), ['bob', 'alice']);
	const other = await repository(t);
	await writeFile(path.join(other.root, '.all-contributorsrc'), JSON.stringify({ contributors: [
		{ login: 'different-alice', name: 'Alice', avatar_url: 'https://github.com/different-alice.png' },
	] }));
	await other.commit('page.mdx', 'Other', 'Alice <alice@example.com>', '2026-01-01T12:00:00Z', 'docs: other');
	assert.equal(getPageContributors(path.join(other.root, 'src/content/docs/page.mdx'), other.root)[0].login, 'different-alice');
});

test('keeps earlier contributors through a backdated rename and orders people by their latest date', async (t) => {
	const { root, git, commit } = await repository(t);
	await commit('old.mdx', 'First', 'Alice <alice@users.noreply.github.com>', '2026-01-02T12:00:00Z', 'docs: start');
	git('mv', 'src/content/docs/old.mdx', 'src/content/docs/new.mdx');
	await commit('new.mdx', 'First', 'Bob <bob@users.noreply.github.com>', '2026-01-01T12:00:00Z', 'docs: rename');
	assert.deepEqual(getPageContributors(path.join(root, 'src/content/docs/new.mdx'), root).map(({ login }) => login), ['alice', 'bob']);
});

test('does not guess GitHub profiles or merge different people from a shared first name', async (t) => {
	const { root, commit } = await repository(t);
	await commit('page.mdx', 'First', 'Alex <alex-one@example.com>', '2026-01-01T12:00:00Z', 'docs: start');
	await commit('page.mdx', 'Second', 'Alex <alex-two@example.com>', '2026-01-02T12:00:00Z', 'docs: edit');
	const people = getPageContributors(path.join(root, 'src/content/docs/page.mdx'), root);
	assert.equal(people.length, 2);
	assert.ok(people.every((person) => person.login === undefined && person.profileUrl === undefined));
});

test('does not identify a person from a username substring inside an unrelated email', async (t) => {
	const { root, commit } = await repository(t);
	await commit('page.mdx', 'First', 'Malcolm <malice@example.com>', '2026-01-01T12:00:00Z', 'docs: start');
	const [person] = getPageContributors(path.join(root, 'src/content/docs/page.mdx'), root);
	assert.equal(person.name, 'Malcolm');
	assert.equal(person.profileUrl, undefined);
});
