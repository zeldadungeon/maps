export class LocalStorage {
    private static instances = <{ [key: string]: LocalStorage }>{};
    private key: string;
    private data: { [key: string]: any };

    private constructor(key: string) {
        // TODO check if localstorage is supported and allowed, else provide cookie shim
        // https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#Feature-detecting_localStorage
        this.key = key;
        const data = localStorage.getItem(key);
        this.data = data ? JSON.parse(data) : {};
    }

    public static getStore(namespace: string, item: string): LocalStorage {
        const key = `maps-${namespace}-${item}`;
        if (!LocalStorage.instances[key]) {
            LocalStorage.instances[key] = new LocalStorage(key);
        }

        return LocalStorage.instances[key];
    }

    public static getLegacyItem(key: string): any {
        const val = localStorage.getItem(key);

        return val ? JSON.parse(val) : undefined;
    }

    public getAllKeys(): string[] {
        return Object.keys(this.data);
    }

    public getItem(key: string): any {
        return this.data[key];
    }

    public setItem(key: string, value: any): void {
        this.data[key] = value;
        this.save();
    }

    public clear(): void {
        this.data = {};
        this.save();
    }

    private save(): void {
        localStorage.setItem(this.key, JSON.stringify(this.data));
    }
}