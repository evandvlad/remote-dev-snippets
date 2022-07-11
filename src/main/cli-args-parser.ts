function parseArg(arg: string) {
	const result = arg.match(/^--([^=]+)=(.+)$/);

	if (!result) {
		throw new Error(`Uncorrect arg format - ${arg}`);
	}

	const [, key, value] = result as [all: string, key: string, value: string];

	return { key, value };
}

export function parse(args: string[]) {
	return args.reduce<Record<string, string>>((acc, arg) => {
		const { key, value } = parseArg(arg);
		acc[key] = value;
		return acc;
	}, {});
}
