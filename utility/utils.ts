export default class Utils {
    static JSONstringifyOrder(obj: any): Buffer {
        // Ref: https://stackoverflow.com/a/53593328/9186330
        const allKeys: string[] = [];
        JSON.stringify(obj, function (key, value) { allKeys.push(key); return value; });
        allKeys.sort();
        return Buffer.from(JSON.stringify(obj, allKeys), 'utf8');
    }

    static isAgentVersionAtLeast(agentVersion: string, version: number): boolean {
        try {
            const lastNumber = parseInt(agentVersion.split('.')[3]);
            return lastNumber >= version;
        } catch (err) {
            return false;
        }
    }

    static promiseTimeout<Type>(ms: number, promise: Promise<Type>): Promise<Type> {
        // Source:
        // https://italonascimento.github.io/applying-a-timeout-to-your-promises/

        // Create a promise that rejects in <ms> milliseconds
        const timeout = new Promise((_, reject) => {
            const id = setTimeout(() => {
                clearTimeout(id);
                reject('Timed out in ' + ms + 'ms.');
            }, ms);
        });

        return new Promise((res, rej) => {
            Promise.race([promise, timeout])
                .then(value => res(value as Type))
                .catch(error => rej(error));
        });
    }

    static getConnectionNodeUrl(bastionServiceUrl: string, connectionNodeId: string) : string {
        const bastionUrl = new URL(bastionServiceUrl);
        const connectionServiceUrl = bastionUrl.href.split('.bastionzero.com')[0] + '-connect.bastionzero.com/' + connectionNodeId + '/';
        return connectionServiceUrl;
    }
}