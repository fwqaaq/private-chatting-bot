import type { Context } from 'grammy';

export function catchError<T, C extends Context, E extends new (messages: string, ctx: C) => Error>(
	p: Promise<T>,
	errors: E[]
): Promise<[undefined, T] | [InstanceType<E>]> {
	return p
		.then((v) => [undefined, v] as [undefined, T])
		.catch((e) => {
			if (e === undefined) return [e];
			if (errors.some((err) => e instanceof err)) {
				return [e];
			}
			throw e;
		});
}
