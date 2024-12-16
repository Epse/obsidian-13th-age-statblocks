import { MarkdownRenderChild, MarkdownRenderer } from "obsidian";

export class StatblockRenderer extends MarkdownRenderChild {
	statblockEl: HTMLDivElement;

	constructor(containerEl: HTMLElement, private params: any) {
		super(containerEl);

		this.statblockEl = this.containerEl.createDiv({ cls: "statblock-13a" });
	}

	async render(): Promise<void> {

		this.statblockEl.createDiv({ cls: "fl-r em", text: this.params.source });
		this.statblockEl.createEl("h1", { cls: "sc nomargin", text: this.params.name });

		if (this.params.blurb) {
			this.statblockEl.createDiv({ cls: "em group", text: this.params.blurb });
		}

		const propertiesBlock = this.statblockEl.createDiv({cls: 'group'});
		if (this.roleText !== undefined) {
			const role = propertiesBlock.createDiv();
			role.createSpan({ cls: "em", text: this.roleText });
			if (this.params.tag) {
				role.createSpan({ cls: "sc", text: ` [${this.params.tag}]` });
			}
		}

		if (this.params.initiative !== undefined) {
			propertiesBlock.createDiv({
				text: `Initiative: ${bonus(this.params.initiative)}`
			});
		}
		if (this.params.vuln !== undefined) {
			propertiesBlock.createDiv({
				text: `Vulnerability: ${this.params.vuln}`,
			});
		}
		if (this.params.resist !== undefined) {
			propertiesBlock.createDiv({
				text: `Resistance: ${this.params.resist}`,
			});
		}

		const attackGroup = this.statblockEl.createDiv({cls: 'group'});
		for (const attack of this.params.attacks || []) {
			await this.renderAttack(attack, attackGroup);
		}
		const traitGroup = this.statblockEl.createDiv({cls: 'group'});
		for (const trait of this.params.traits || []) {
			await this.renderSimpleItem(trait, traitGroup);
		}

		if (this.params.specials?.length > 0) {
			const specialsGroup = this.statblockEl.createDiv({cls: 'group'});
			specialsGroup.createEl("h2", { text: "Nastier Specials" });
			for (const special of this.params.specials) {
				await this.renderSimpleItem(special, specialsGroup);
			}
		}

		const numbers = this.statblockEl.createDiv({ cls: "numbers" });
		const defenses = numbers.createDiv();
		defenses.createDiv({ cls: "bold", text: `AC ${this.params.ac}` });
		defenses.createDiv({ text: `PD ${this.params.pd}` });
		defenses.createDiv({ text: `MD ${this.params.md}` });
		numbers.createDiv({ cls: "bold", text: `HP ${this.params.hp}` });
		numbers.createDiv("");
	}

	get roleText(): string | undefined {
		if (this.params.level === undefined) return undefined;

		const ordinalRules = new Intl.PluralRules("en", { type: "ordinal" });
		const suffixes = {
			zero: "th",
			one: "st",
			two: "nd",
			few: "rd",
			other: "th",
			many: "th",
		};
		const suffix = suffixes[ordinalRules.select(this.params.level)];
		const nth = `${this.params.level}${suffix}`;

		return capitalize(
			[this.params.size, `${nth} level`, this.params.role]
				.join(" ")
				.trim()
		);
	}

	async renderAttack(attack: any, parent: HTMLElement = null) {
		const attackEl = (parent ?? this.statblockEl).createDiv({ cls: "attack" });
		if (attack.tag) {
			attackEl.createSpan({ cls: "em", text: `[${attack.tag}] ` });
		}
		const titleParts = [
			attack.type === "ranged" ? "R:" : "",
			attack.type === "close" ? "C:" : "",
			attack.name,
			attack.attack,
			attack.detail ? `(${attack.detail})` : "",
		];
		attackEl.createSpan({ cls: "bold", text: titleParts.join(" ").trim() });
		attackEl.createSpan({ text: ` — ${attack.hit}` });
		const attackExtraContainer = attackEl.createDiv();


		for (const extra of attack.extras ?? []) {
			await this.renderSimpleItem(extra, attackExtraContainer);
		}
	}

	async renderSimpleItem(trait: any, parent: HTMLElement = null) {
		const el = (parent ?? this.statblockEl).createDiv();
		el.classList.add("simple-item");
		const text = `_${trait.name}:_ ${trait.description}`;
		// TODO source path should probably not be null
		await MarkdownRenderer.renderMarkdown(text, el, "", this);
	}
}

function capitalize(str: string): string {
	const lower = str.toLowerCase();
	return lower[0].toUpperCase() + lower.slice(1);
}

function bonus(stat: number | string): string {
	if (stat === 0) return stat.toString();
	return stat > 0 ? `+${stat}` : `${stat}`;
}
