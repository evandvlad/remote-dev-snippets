import { Buffer } from "node:buffer";

import { type JSONStruct, type JSONValue } from "./ts.js";

export function jsonToBase64(data: JSONStruct) {
	return Buffer.from(JSON.stringify(data)).toString("base64");
}

export function base64ToUtf8(data: string) {
	return Buffer.from(data, "base64").toString("utf-8");
}

export function funcToStringExpr<A extends JSONValue[], R = void>(func: (...args: A) => R, ...args: A) {
	return `(${func.toString()})(...${JSON.stringify(args)});`;
}

export function funcToStringFuncBody<A extends JSONValue[], R = void>(func: (...args: A) => R, ...args: A) {
	return `return ${funcToStringExpr(func, ...args)}`;
}
