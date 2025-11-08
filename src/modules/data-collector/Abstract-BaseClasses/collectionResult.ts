/**
 * Abstract base for collection results
 */
abstract class CollectionResult<T = unknown> {
    constructor(
        public readonly source: string,
        public readonly success: boolean,
        public readonly data?: T,
        public readonly error?: string,
    ) {}

    isSuccess(): this is SuccessResult<T> {
        return this.success;
    }

    isFailure(): this is FailureResult {
        return !this.success;
    }
}

class SuccessResult<T> extends CollectionResult<T> {
    constructor(source: string, data: T) {
        super(source, true, data);
    }
}

class FailureResult extends CollectionResult {
    constructor(source: string, error: string) {
        super(source, false, undefined, error);
    }
}
