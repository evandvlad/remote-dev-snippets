import assert from "node:assert/strict";

import { cast } from "../../lib/ts.js";
import RemoteDebugger from "../../remote-debugger.js";
import snippetsRegistry from "../snippets-registry.js";

async function assertParams(params: Record<string, string>) {
	assert("snippet" in params, "Snippet wasn't set");
	assert("web-socket-debugger-url" in params, "Web socket debugger url wasn't set");

	const snippets = await snippetsRegistry.get();
	const snippet = params["snippet"]!;

	assert(snippets.includes(snippet), `Snippet - ${snippet} wasn't found`);

	return cast<{
		snippet: string;
		"web-socket-debugger-url": string;
	}>(params);
}

export default async function (parameters: Record<string, string>) {
	const params = await assertParams(parameters);

	RemoteDebugger.onErrorMessage((e) => {
		console.error(e);
	});

	const rd = await RemoteDebugger.connect(params["web-socket-debugger-url"]);

	const module = await import(`../../snippets/${params.snippet}.js`);
	assert(typeof module.default === "function", "Snippet should be exported with default export as function");

	module.default(rd);
}
