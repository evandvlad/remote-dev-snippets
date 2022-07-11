import { type IRemoteDebugger } from "../../remote-debugger.js";
import { funcToStringExpr } from "../../lib/data-conversion.js";

export default async function (rd: IRemoteDebugger) {
	await rd.send("Runtime.enable");

	const { names } = await rd.send("Runtime.globalLexicalScopeNames");
	
	rd.send("Runtime.evaluate", {
		expression: funcToStringExpr((data) => {
			console.log(data);
		}, names),
	});
}