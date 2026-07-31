#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, basename, extname, dirname } from "path";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Configuration & Paths ───────────────────────────────────────────────────

const FURNI_URL = "https://www.habbo.com.br/gamedata/furnidata_json/1";
const CONFIG_FILE = join(__dirname, "furni-config.json");
const DOCS_DIR = join(__dirname, "..", "src", "content", "docs", "referencia");
const OUTPUT_DIR = join(__dirname, "output");

const CLASSNAME_TYPE_MAP = {
	wf_trg_: "Ativador",
	wf_cnd_: "Condição",
	wf_xtra_: "Extra",
	wf_act_: "Efeito",
	wf_slc_: "Seletor",
	wf_var_: "Variável",
	wf_storage_: "Baús",
	wf_contract_: "Contrato",
	wired: "Condição",
	wired_trigger: "Ativador",
	wired_effect: "Efeito",
	wired_condition: "Condição",
};

const TYPE_FOLDER_MAP = {
	Ativador: "ativadores",
	Condição: "condicoes",
	Efeito: "efeitos",
	Extra: "extras",
	Seletor: "seletores",
	Variável: "variaveis",
	Contrato: "contratos",
	"Tabela de Classificação": "tabelas-de-classificacao",
};

// ── Config Helpers ─────────────────────────────────────────────────────────

function loadConfig() {
	if (!existsSync(CONFIG_FILE)) {
		return {
			relevantCategories: [
				"wired",
				"wired_trigger",
				"wired_effect",
				"wired_condition",
				"wired_add_on",
				"games",
				"leaderboards",
			],
			relevantPrefixes: [
				"wf_trg_",
				"wf_cnd_",
				"wf_act_",
				"wf_xtra_",
				"wf_slc_",
				"wf_var_",
				"wf_storage_",
				"wf_contract_",
				"highscore_",
				"wired",
			],
			ignoredItems: [],
		};
	}
	try {
		const raw = readFileSync(CONFIG_FILE, "utf8");
		return JSON.parse(raw);
	} catch (err) {
		console.error(`⚠️  Erro ao ler ${CONFIG_FILE}: ${err.message}`);
		return { relevantCategories: [], relevantPrefixes: [], ignoredItems: [] };
	}
}

function saveConfig(config) {
	try {
		writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + "\n", "utf8");
	} catch (err) {
		console.error(`❌  Erro ao salvar ${CONFIG_FILE}: ${err.message}`);
	}
}

// ── Item Infer & MDX Helpers ───────────────────────────────────────────────

function inferType(item) {
	if (["games", "leaderboards"].includes(item.category)) {
		return "Tabela de Classificação";
	}

	const prefix = Object.keys(CLASSNAME_TYPE_MAP).find((candidate) =>
		item.classname?.startsWith(candidate),
	);

	return prefix ? CLASSNAME_TYPE_MAP[prefix] : item.category ?? "Desconhecido";
}

function inferSubfolder(item) {
	const type = inferType(item);
	return TYPE_FOLDER_MAP[type] || "outros";
}

function yamlStr(value) {
	if (value == null) return '""';
	const str = String(value);
	if (
		str === "" ||
		/[:#\[\]{}&*!|>'"%@`,]/.test(str) ||
		str.startsWith("-") ||
		str.includes("\n")
	) {
		return `"${str.replace(/"/g, '\\"')}"`;
	}
	return str;
}

function buildMdx(item, items = []) {
	const type = inferType(item);

	const colonIdx = item.name.indexOf(": ");
	const shortLabel = colonIdx !== -1 ? item.name.slice(colonIdx + 2) : item.name;

	let availability = "No catálogo";
	if (item.bc) availability += " e CA";

	const negativeVersion =
		type === "Condição" && !item.classname.startsWith("wf_cnd_neg_")
			? items.find((candidate) => candidate.classname === `wf_cnd_neg_${item.classname.slice("wf_cnd_".length)}`)
			: undefined;

	return `---
title: ${yamlStr(item.name)}
description: ${yamlStr(item.description)}
sidebar:
  label: ${yamlStr(shortLabel)}
  badge:
    text: RASCUNHO
    variant: note
infobox:
	# == Infobox ==
	# hide: false # valor padrão
  title: ${yamlStr(shortLabel)}
	# image: # url preenchida automaticamente

	# == Dados do Mobi ==
  revision: ${item.revision}
  classname: ${item.classname}
  name: ${yamlStr(item.name)}
  description: ${yamlStr(item.description)}
	# product_name: # caso o nome na loja seja diferente do nome do Mobi
	# image_direction: ${item.defaultdir} # valor padrão
	# image_animated_state: 100 # valor padrão
	# icon: # url preenchida automaticamente
  availability: ${yamlStr(availability)}
	# price: # preço em créditos no catálogo
	# release_date: # data de lançamento

	# == Dados do Wired ==
  type: ${yamlStr(type)}
	# requires_bot: false # valor padrão
	# requires_furni: false # valor padrão
	# requires_antena: false # valor padrão
	# requires_contract: false # valor padrão
	# requires_chest: false # valor padrão
	# execution_limit: 100 # valor padrão
	# execution_limit_per_user: 100 # valor padrão

	# == Dados do ${type} ==
${type === "Condição" ? (negativeVersion ? `  negative_version:
    name: ${yamlStr(negativeVersion.name.replace(/^.*?:\\s*/, ""))}
    revision: ${negativeVersion.revision}
    classname: ${negativeVersion.classname}` : "  # negative_version: # se aplicável\n  #   name: # nome para exibição\n  #   description: # descrição para exibição\n  #   revision: # revisão técnica\n  #   classname: # classname técnico") : `  additional_sources: []`}
---

import Infobox from "../../../../components/Infobox.astro"

<Infobox />
`;
}

// ── File Scanner ───────────────────────────────────────────────────────────

function scanDirectoryForDocItems(dirPath) {
	const existing = new Set();
	if (!existsSync(dirPath)) return existing;

	function walk(currentDir) {
		const files = readdirSync(currentDir);
		for (const file of files) {
			const fullPath = join(currentDir, file);
			const stat = statSync(fullPath);
			if (stat.isDirectory()) {
				walk(fullPath);
			} else if (file.endsWith(".mdx") || file.endsWith(".md")) {
				const base = basename(file, extname(file));
				existing.add(base);

				try {
					const content = readFileSync(fullPath, "utf8");
					const match = content.match(/classname:\s*(.+)/);
					if (match) {
						const cn = match[1].trim().replace(/^['"]|['"]$/g, "");
						existing.add(cn);
						existing.add(cn.replace(/\*/g, "-"));
					}
				} catch (_) {}
			}
		}
	}

	walk(dirPath);
	return existing;
}

// ── Main Execution ──────────────────────────────────────────────────────────

async function main() {
	console.log("🌐 Carregando furnidata do Habbo...");
	let data;
	try {
		const res = await fetch(FURNI_URL);
		if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
		data = await res.json();
	} catch (err) {
		console.error(`❌ Falha ao carregar furnidata JSON: ${err.message}`);
		process.exit(1);
	}

	const allItems = [
		...(data.roomitemtypes?.furnitype || []),
		...(data.wallitemtypes?.furnitype || []),
	];

	console.log(`📦 Total de itens carregados da API: ${allItems.length}`);

	const config = loadConfig();
	const relevantCategories = new Set(config.relevantCategories || []);
	const relevantPrefixes = config.relevantPrefixes || [];
	const ignoredItems = new Set(config.ignoredItems || []);

	console.log("🔍 Verificando páginas existentes em src/content/docs/referencia e scripts/output...");
	const existingInDocs = scanDirectoryForDocItems(DOCS_DIR);
	const existingInOutput = scanDirectoryForDocItems(OUTPUT_DIR);

	const missingItems = allItems.filter((item) => {
		if (!item.classname) return false;

		const normClassname = item.classname.replace(/\*/g, "-");

		// Filter out ignored items
		if (ignoredItems.has(item.classname) || ignoredItems.has(normClassname)) {
			return false;
		}

		// Check relevance
		const isRelevantCategory = relevantCategories.has(item.category);
		const matchesPrefix = relevantPrefixes.some((p) => item.classname.startsWith(p));
		const isWiredLine = item.furniline === "wired";

		if (!isRelevantCategory && !matchesPrefix && !isWiredLine) {
			return false;
		}

		// Check if already exists in docs or output
		const alreadyExists =
			existingInDocs.has(item.classname) ||
			existingInDocs.has(normClassname) ||
			existingInOutput.has(item.classname) ||
			existingInOutput.has(normClassname);

		return !alreadyExists;
	});

	if (missingItems.length === 0) {
		console.log("✨ Nenhuma nova página precisa ser criada! Tudo atualizado.");
		return;
	}

	console.log(`\n📋 Encontradas ${missingItems.length} nova(s) página(s) pendente(s).\n`);

	const args = process.argv.slice(2);
	const isAutoAccept = args.includes("--yes") || args.includes("-y") || args.includes("--all");

	let autoAcceptAll = isAutoAccept;
	let createdCount = 0;
	let skippedCount = 0;
	let ignoredCount = 0;

	let rl = null;
	if (!autoAcceptAll && input.isTTY) {
		rl = readline.createInterface({ input, output });
	}

	for (let i = 0; i < missingItems.length; i++) {
		const item = missingItems[i];
		const normClassname = item.classname.replace(/\*/g, "-");
		const subfolder = inferSubfolder(item);

		if (!autoAcceptAll && rl) {
			console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
			console.log(`📌 Item [${i + 1}/${missingItems.length}]`);
			console.log(`  - Nome:        ${item.name}`);
			console.log(`  - Classname:   ${item.classname} (Arquivo: ${normClassname}.mdx)`);
			console.log(`  - ID:          ${item.id}`);
			console.log(`  - Categoria:   ${item.category}`);
			console.log(`  - Subpasta:    scripts/output/${subfolder}/`);
			console.log(`  - Furniline:   ${item.furniline || "N/A"}`);
			console.log(`  - Descrição:   ${item.description}`);
			console.log(`  - Revisão:     ${item.revision}`);
			console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

			const ans = (
				await rl.question(
					"O que fazer? [y] Criar | [n] Pular | [i] Ignorar no config.json | [a] Criar Todos | [q] Sair: "
				)
			)
				.trim()
				.toLowerCase();

			if (ans === "q" || ans === "sair") {
				console.log("👋 Operação encerrada pelo usuário.");
				break;
			}

			if (ans === "i" || ans === "ignorar") {
				if (!config.ignoredItems.includes(item.classname)) {
					config.ignoredItems.push(item.classname);
					ignoredItems.add(item.classname);
					saveConfig(config);
				}
				console.log(`💾 Adicionado '${item.classname}' a ignoredItems em furni-config.json\n`);
				ignoredCount++;
				continue;
			}

			if (ans === "n" || ans === "nao" || ans === "não") {
				console.log(`⏭️  Pulado nesta execução.\n`);
				skippedCount++;
				continue;
			}

			if (ans === "a" || ans === "todos") {
				autoAcceptAll = true;
			}
		}

		// Generate file
		const targetDir = join(OUTPUT_DIR, subfolder);
		mkdirSync(targetDir, { recursive: true });

		const filename = `${normClassname}.mdx`;
		const filepath = join(targetDir, filename);
		const content = buildMdx(item, allItems);

		writeFileSync(filepath, content, "utf8");
		console.log(`✅  Criado: scripts/output/${subfolder}/${filename}`);
		createdCount++;
	}

	if (rl) rl.close();

	console.log(`\n🎉 Concluído!`);
	console.log(`  - ${createdCount} arquivo(s) criado(s) em scripts/output/`);
	console.log(`  - ${ignoredCount} item(ns) adicionado(s) a ignoredItems em furni-config.json`);
	console.log(`  - ${skippedCount} item(ns) pulado(s)`);
}

main().catch((err) => {
	console.error("❌ Erro fatal:", err);
	process.exit(1);
});
