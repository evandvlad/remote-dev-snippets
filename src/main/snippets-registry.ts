import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const snippetsPath = path.resolve(dirname, "../../src/snippets");

class SnippetsRegistry {
	get() {
		return this.#collect("", 2);
	}

	async #collect(subpath: string, depth: number) {
		if (depth === 0) {
			return [];
		}

		const result: string[] = [];
		const pathToDirectory = path.resolve(snippetsPath, subpath);
		const dirents = await fs.readdir(pathToDirectory, { withFileTypes: true, encoding: "utf-8" });

		for (const dirent of dirents) {
			if (dirent.isDirectory()) {
				const newSubpath = this.#createNewSubpath(subpath, dirent.name);
				const subResult = await this.#collect(newSubpath, depth - 1);

				result.push(...subResult);
			}

			if (dirent.isFile()) {
				const basename = path.basename(dirent.name, path.extname(dirent.name));
				result.push(this.#createNewSubpath(subpath, basename));
			}
		}

		return result;
	}

	#createNewSubpath(subpath: string, name: string) {
		return subpath ? [subpath, name].join("/") : name;
	}
}

export default new SnippetsRegistry();
