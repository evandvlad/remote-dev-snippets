import { EventEmitter } from "node:events";
import WebSocket, { type RawData } from "ws";

import { stream } from "./lib/events.js";
import { never } from "./lib/ts.js";

import type {
	Messsage as RawMessage,
	ErrorMessage,
	ResponseMessage,
	BroadcastMessage,
	CommandMethod,
	CommandParams,
	CommandResult,
	EventName,
	EventData,
	EventListener,
} from "./devtools-protocol";

const genId = (
	(i) => () =>
		i++
)(1);

const errorMessageEmitter = new EventEmitter();

export { type RemoteDebugger as IRemoteDebugger };

export default class RemoteDebugger {
	static async connect(webSocketDebuggerUrl: string) {
		const ws = new WebSocket(webSocketDebuggerUrl, { perMessageDeflate: false });

		await new Promise((resolve) => {
			ws.once("open", resolve);
		});

		return new this(ws);
	}

	static onErrorMessage(listener: (error: Error) => void) {
		errorMessageEmitter.on("error", listener);
	}

	readonly #ws: WebSocket;

	readonly #emitters = {
		responseMessage: new EventEmitter(),
		broadcastMessage: new EventEmitter(),
		errorMessage: errorMessageEmitter,
	};

	private constructor(ws: WebSocket) {
		this.#ws = ws;
		this.#ws.on("message", this.#processMessage);
	}

	on<T extends EventName>(name: T, listener: EventListener<T>) {
		this.#emitters.broadcastMessage.on(name, listener);

		return () => {
			this.#emitters.broadcastMessage.off(name, listener);
		};
	}

	async send<T extends CommandMethod>(method: T, ...rest: CommandParams<T>) {
		return new Promise<CommandResult<T>>((resolve, reject) => {
			const params = rest.length ? rest[0] : {};

			const request = {
				id: genId(),
				method,
				params,
			};

			this.#emitters.responseMessage.once(
				this.#responseIdToEmitterKey(request.id),
				(data: CommandResult<T> | Error) => {
					if (data instanceof Error) {
						reject(data);
						return;
					}

					resolve(data);
				},
			);

			this.#ws.send(JSON.stringify(request));
		});
	}

	async wait<T extends EventName>(name: T, filter: (data: EventData<T>) => boolean = () => true) {
		return new Promise<EventData<T>>((resolve) => {
			const handler = (data: EventData<T>) => {
				if (filter(data)) {
					this.#emitters.broadcastMessage.off(name, handler);
					resolve(data);
				}
			};

			this.#emitters.broadcastMessage.on(name, handler);
		});
	}

	stream<T extends EventName>(name: T) {
		return stream<EventData<T>>((on) => {
			this.#emitters.broadcastMessage.on(name, on);
		});
	}

	#processMessage = (data: RawData) => {
		const rawMessage = JSON.parse(data.toString()) as RawMessage;

		const isError = "error" in rawMessage;
		const isResponseType = "id" in rawMessage;

		const messageType = `${isResponseType ? "response" : "broadcast"}-${isError ? "error" : "success"}` as const;

		switch (messageType) {
			case "response-success": {
				const message = rawMessage as ResponseMessage;
				this.#emitters.responseMessage.emit(this.#responseIdToEmitterKey(message.id), message.result);
				return;
			}

			case "broadcast-success": {
				const { method, params } = rawMessage as BroadcastMessage;
				this.#emitters.broadcastMessage.emit(method, params);
				return;
			}

			case "broadcast-error": {
				const errorMessage = rawMessage as ErrorMessage;
				this.#emitters.errorMessage.emit("error", new Error(errorMessage.error.message));
				return;
			}

			case "response-error": {
				const errorMessage = rawMessage as ErrorMessage;

				this.#emitters.responseMessage.emit(
					this.#responseIdToEmitterKey(errorMessage.id!),
					new Error(errorMessage.error.message),
				);

				return;
			}

			default:
				never(messageType);
		}
	};

	#responseIdToEmitterKey(id: number) {
		return String(id);
	}
}
