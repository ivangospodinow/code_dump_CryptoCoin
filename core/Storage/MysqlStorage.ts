import StorageInterface, { StorageCallback } from "./StorageInterface";

const mysql = require('mysql');

export default class MysqlStorage extends StorageInterface {
    public connection: {query : CallableFunction};

    constructor(settings: Object) {
        super();

        this.connection = mysql.createConnection({ ...settings, multipleStatements: true, });
    }

    get = (namespace: string, key: string, callback: StorageCallback) => {
        this.connection.query(
            "SELECT `value` FROM `" + namespace + "` WHERE `key` = ?",
            [key],
            function queryPutCallback(error: any, result: any) {
                callback(undefined !== result[0] ? result[0]['value'] || '' : '', error);
            });
    }

    put = (namespace: string, key: string, value: string | Object, callback: StorageCallback) => {
        this.connection.query(
            "INSERT INTO `" + namespace + "` (`key`, `value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`);",
            [key, value],
            function queryPutCallback(error: any, result: any) {
                callback(result, error);
            });
    }

    puts = (data: Array<{ namespace: string, key: string, value: string | object }>, callback: StorageCallback) => {
        let sql = "BEGIN;\n";
        let bind: Array<string> = [];
        for (let i: number = 0; i <= data.length - 1; i++) {
            sql += "INSERT INTO `" + data[i].namespace + "` (`key`, `value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`);\n";
            bind.push(data[i].key);
            bind.push(String(typeof data[i].value === 'object' ? JSON.stringify(data[i].value) : data[i].value));
        }
        sql += "COMMIT;\n"

        this.connection.query(
            sql,
            bind,
            function queryPutsCallback(error: any, result: any) {
                callback(result, error);
            });
    }
}
