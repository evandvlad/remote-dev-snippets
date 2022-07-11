#!/usr/bin/env node

import assert from "node:assert/strict";
import process from "node:process";

import { parse as parseArgs } from "./cli-args-parser.js";

enum CommandName {
	Run = "run",
	List = "list",
}

function assertCommandName(name: string): CommandName {
	const availableCommandNamesList = Object.values(CommandName) as string[];

	assert(
		availableCommandNamesList.includes(name),
		`Unknown command - ${name}. Available commands are - ${availableCommandNamesList.join(", ")}`,
	);

	return name as CommandName;
}

async function importCommand(name: CommandName) {
	const module = await import(`./commands/${name}.js`);
	assert(typeof module.default === "function", "Command should be exported with default export as function");
	return module.default;
}

const [, , name = "", ...args] = process.argv;

const commandName = assertCommandName(name);
const command = await importCommand(commandName);

command(parseArgs(args));
