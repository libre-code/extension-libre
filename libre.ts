import { ExtensionContext, commands, window } from 'vscode';
import { Octokit } from '@octokit/rest';
import { join } from 'path';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'fs';

const channel = window
	.createOutputChannel('Libre');

const file = 'libre.json';
const octokit = new Octokit();
const org = 'libre-code';

export function activate(context: ExtensionContext) {
	const path = join(context.extensionPath, 'repositories');

	if (!existsSync(path)) {
		mkdirSync(path);
	}

	context
		.subscriptions
		.push(commands
			.registerCommand('libre.update', async () => {
				octokit
					.repos
					.listForOrg({
						org: org,
						type: 'public'
					})
					.then(({ data }) => data
						.filter(repo => repo.name.startsWith('extension-')))
					.then(repos => repos
						.map(repo => octokit
							.repos
							.getContent({
								owner: org,
								path: file,
								ref: 'libre',
								repo: repo.name
							})
							.then(({ data }) => JSON
								.parse(Buffer
									.from((data as { content: string }).content, 'base64')
									.toString()))))
					.then(exts => Promise
						.all(exts))
					.then(exts => {
						context.globalState.update('extensions', exts);

						readdirSync(path)
							.map(repo => JSON
								.parse(readFileSync(join(repo, file))
									.toString()))
							.filter(ext => !exts
								.includes(ext))
				            .forEach(ext => {
								channel
									.appendLine(`Updating ${ext.name} to version ${ext.version}`);

								// TODO pull repo, package and install
							});
					});
			}));

	context
		.subscriptions
		.push(commands
			.registerCommand('libre.get', () => {
				// TODO get extensions from state, show quick pick, pull repo, package and install
			}));
}

export function deactivate() { }