
import type ProtocolMapping from "devtools-protocol/types/protocol-mapping";

export { Protocol } from "devtools-protocol/types/protocol";

type Commands = ProtocolMapping.Commands;

export type CommandMethod = keyof Commands;
export type CommandParams<T extends CommandMethod = CommandMethod> = Commands[T]["paramsType"];
export type CommandResult<T extends CommandMethod> = Commands[T]["returnType"];

type Events = ProtocolMapping.Events;

export type EventName = keyof Events;
export type EventData<T extends EventName> = Events[T][0];
export type EventListener<T extends EventName> = (data: EventData<T>) => void;

export interface ErrorMessage {
	id?: number;
	error: {
		code: number;
		message: string;
	};
}

export interface ResponseMessage {
	id: number;
	result: CommandResult<CommandMethod>;
}

export interface BroadcastMessage {
	method: EventName;
	params: EventData<EventName>;
}

export type Messsage = ResponseMessage | BroadcastMessage | ErrorMessage;
