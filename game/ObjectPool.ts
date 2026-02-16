export class ObjectPool<T> {
    private pool: T[] = [];
    private createFn: () => T;
    private resetFn: (item: T) => void;

    constructor(createFn: () => T, resetFn: (item: T) => void, initialSize: number = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    public get(): T {
        const item = this.pool.pop() || this.createFn();
        this.resetFn(item);
        return item;
    }

    public release(item: T) {
        this.pool.push(item);
    }
}
