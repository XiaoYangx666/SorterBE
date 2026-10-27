export function worldDeferredObject<T extends object>(getter: () => T): T {
	return getter();
}
