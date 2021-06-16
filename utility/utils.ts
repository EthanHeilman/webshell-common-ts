export default class Utils {
    static JSONstringifyOrder(obj: any): Buffer {
        // Ref: https://stackoverflow.com/a/53593328/9186330
        const allKeys: string[] = [];
        JSON.stringify(obj, function (key, value) { allKeys.push(key); return value; });
        allKeys.sort();
        return Buffer.from(JSON.stringify(obj, allKeys), 'utf8');
    }
}