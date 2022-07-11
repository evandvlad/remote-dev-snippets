import { type IRemoteDebugger } from "../../remote-debugger.js";
import { stream } from "../../lib/events.js";
import { pipe as signalrPipe } from "../../lib/signalr.js";
import { funcToStringExpr } from "../../lib/data-conversion.js";

export default async function (rd: IRemoteDebugger) {
	await Promise.all([rd.send("Network.enable"), rd.send("Runtime.enable")]);

	stream
		.aggregate(
			rd.stream("Network.webSocketFrameSent").map(({ response }) => ({
				event: "frame-sent" as const,
				data: response.payloadData,
			})),

			rd.stream("Network.webSocketFrameReceived").map(({ response }) => ({
				event: "frame-received" as const,
				data: response.payloadData,
			})),

			rd.stream("Network.webSocketFrameError").map(({ errorMessage }) => ({
				event: "frame-error" as const,
				data: errorMessage,
			})),
		)
		.pipe(signalrPipe)
		.on((data) => {
			rd.send("Runtime.evaluate", {
				expression: funcToStringExpr((data) => {
					console.log(data);
				}, data),
			});
		});
}
