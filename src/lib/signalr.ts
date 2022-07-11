import { type StreamHandlerArg } from "./events.js";
import { never, type JSONValue } from "./ts.js";

interface SentFramePayloadJSON {
	I: number;
	H: string;
	M: string;
	A: JSONValue[];
	S?: JSONValue;
}

interface ReceivedFramePayloadJSON {
	C?: string;
	I?: string;
	G?: string;
	S?: 1;
	T?: 1;
	L?: JSONValue;
	M?: JSONValue[];
	R?: JSONValue;
	P?: JSONValue;
	E?: string;
}

type SentData = {
	requestId: string;
	hub: string;
	method: string;
	args: JSONValue[];
};

type ResponseData = {
	requestId: string;
	result?: JSONValue;
};

type MessageData = JSONValue[];

interface IncomingMessage {
	event: "frame-sent" | "frame-received" | "frame-error";
	data: string;
}

type OutcomingMessage =
	| { event: "sent"; data: SentData }
	| { event: "response"; data: ResponseData }
	| { event: "message"; data: MessageData }
	| { event: "error"; data: string };

export function pipe({ on, send }: StreamHandlerArg<IncomingMessage, OutcomingMessage>) {
	on(({ event, data }) => {
		switch (event) {
			case "frame-error":
				send({ event: "error", data });
				return;

			case "frame-sent": {
				const payload = JSON.parse(data) as SentFramePayloadJSON;

				send({
					event: "sent",
					data: {
						requestId: String(payload.I),
						hub: payload.H,
						method: payload.M,
						args: payload.A,
					},
				});

				return;
			}

			case "frame-received": {
				const payload = JSON.parse(data) as ReceivedFramePayloadJSON;

				if (!Object.keys(payload).length) {
					return;
				}

				if (typeof payload.I !== "undefined") {
					const response: ResponseData = { requestId: payload.I };

					if (typeof payload.R !== "undefined") {
						response.result = payload.R;
					}

					send({ event: "response", data: response });

					return;
				}

				if (typeof payload.M !== "undefined") {
					if (payload.M.length) {
						send({ event: "message", data: payload.M });
					}

					return;
				}

				send({
					event: "error",
					data: `Unknown data format - "${data}"`,
				});

				return;
			}

			default:
				never(event);
		}
	});
}
