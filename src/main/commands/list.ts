import snippetsRegistry from "../snippets-registry.js";

export default async function () {
	const snippets = await snippetsRegistry.get();
	console.log(snippets.join("\n"));
}
