type Subscriber<T> = (message: T) => void;

type StreamSubscriber<T> = (subscriber: Subscriber<T>) => void;

export interface StreamHandlerArg<In, Out> {
	on: StreamSubscriber<In>;
	send: (message: Out) => void;
}

type StreamHandler<In, Out> = (arg: StreamHandlerArg<In, Out>) => void;

interface Stream<In> {
	on: StreamSubscriber<In>;
	pipe: <Out>(handler: StreamHandler<In, Out>) => Stream<Out>;
	filter: (handler: (message: In) => boolean) => Stream<In>;
	filterAsync: (handler: (message: In) => Promise<boolean>) => Stream<In>;
	map: <Out>(handler: (message: In) => Out) => Stream<Out>;
	mapAsync: <Out>(handler: (message: In) => Promise<Out>) => Stream<Out>;
}

export function pubSub<T>() {
	let subscribers: Array<Subscriber<T>> = [];

	return {
		on: (subscriber: Subscriber<T>) => {
			subscribers.push(subscriber);
		},

		off: (subscriber: Subscriber<T>) => {
			subscribers = subscribers.filter((activeSubscriber) => subscriber !== activeSubscriber);
		},

		send: (message: T) => {
			subscribers.forEach((subscriber) => {
				subscriber(message);
			});
		},
	};
}

function stream<In>(subscriber: StreamSubscriber<In>) {
	const instance: Stream<In> = {
		on: subscriber,

		pipe: <Out>(handler: StreamHandler<In, Out>) => {
			const { on, send } = pubSub<Out>();
			handler({ on: subscriber, send });
			return stream<Out>(on);
		},

		filter: (handler: (message: In) => boolean) =>
			instance.pipe(({ on, send }) => {
				on((message) => {
					if (handler(message) === true) {
						send(message);
					}
				});
			}),

		filterAsync: (handler: (message: In) => Promise<boolean>) =>
			instance.pipe(({ on, send }) => {
				on(async (message) => {
					if ((await handler(message)) === true) {
						send(message);
					}
				});
			}),

		map: <Out>(handler: (message: In) => Out) =>
			instance.pipe<Out>(({ on, send }) => {
				on((message) => {
					send(handler(message));
				});
			}),

		mapAsync: <Out>(handler: (message: In) => Promise<Out>) =>
			instance.pipe<Out>(({ on, send }) => {
				on(async (message) => {
					send(await handler(message));
				});
			}),
	};

	return instance;
}

stream.aggregate = <T extends unknown[]>(...streams: { [K in keyof T]: Stream<T[K]> }): Stream<T[number]> => {
	const { on, send } = pubSub<T[number]>();

	streams.forEach((stream) => {
		stream.on(send);
	});

	return stream(on);
};

export { stream };
