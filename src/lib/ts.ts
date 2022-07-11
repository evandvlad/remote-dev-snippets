type JSONArray = JSONValue[];
type JSONObject = { [x: string]: JSONValue };

export type JSONValue = null | string | number | boolean | JSONArray | JSONObject;
export type JSONStruct = JSONObject | JSONArray;

export function never(value: never): never {
	throw new Error(`Value: "${value}" has never type`);
}

export function cast<T>(value: unknown): T {
	return value as T;
}
