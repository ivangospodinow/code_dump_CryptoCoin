import StorageInterface, { StorageCallback } from "./StorageInterface";
import { DATA_REMOVE_VALUE } from "./Storage";

const mysql = require('mysql');

export default class MysqlStorage extends StorageInterface {
    public connection: { query: CallableFunction };

    constructor(settings: Object) {
        super();

        this.connection = mysql.createConnection({ ...settings, multipleStatements: true, });
    }

    has = (namespace: string, key: string, callback: StorageCallback) => {
        this.connection.query(
            "SELECT EXISTS(SELECT `value` FROM `" + namespace + "` WHERE `key` = ?) AS `exists`",
            [key],
            function queryPutCallback(error: any, result: any) {
                callback(result && undefined !== result[0] ? result[0]['exists'] > 0 : '', error);
            });
    }

    get = (namespace: string, key: string, callback: StorageCallback) => {
        this.connection.query(
            "SELECT `value` FROM `" + namespace + "` WHERE `key` = ?",
            [key],
            function queryPutCallback(error: any, result: any) {
                callback(result && undefined !== result[0] ? result[0]['value'] || '' : '', error);
            });
    }

    put = (namespace: string, key: string, value: string | Object, callback: StorageCallback) => {
        this.connection.query(
            "INSERT INTO `" + namespace + "` (`key`, `value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`);",
            [key, String(typeof value === 'object' ? JSON.stringify(value) : value)],
            function queryPutCallback(error: any, result: any) {
                callback(result, error);
            });
    }

    puts = (data: Array<{ namespace: string, key: string, value: string | object }>, callback: StorageCallback) => {
        let sql = "BEGIN;\n";
        let bind: Array<string> = [];
        for (let i: number = 0; i <= data.length - 1; i++) {
            if (data[i].value === DATA_REMOVE_VALUE) {
                // @TODO dont remove like this!
                sql += "DELETE FROM `" + data[i].namespace + "` WHERE `key` = ?;\n";
                bind.push(data[i].key);
            } else {
                sql += "INSERT INTO `" + data[i].namespace + "` (`key`, `value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`);\n";
                bind.push(data[i].key);
                bind.push(String(typeof data[i].value === 'object' ? JSON.stringify(data[i].value) : data[i].value));
            }
        }
        sql += "COMMIT;\n"

        this.connection.query(
            sql,
            bind,
            function queryPutsCallback(error: any, result: any) {
                callback(result, error);
            });
    }

    seek = (namespace: string, expression: string, offset: number, callback: StorageCallback) => {
        if (expression.length) {
            this.connection.query(
                "SELECT `value` FROM `" + namespace + "` WHERE `key` LIKE ? LIMIT 1 OFFSET ?",
                [expression, offset],
                function querySeekCallback(error: any, result: any) {
                    callback(undefined !== result[0] ? result[0]['value'] || '' : '', error);
                });
        } else {
            this.connection.query(
                "SELECT `value` FROM `" + namespace + "` WHERE 1 LIMIT 1 OFFSET ?",
                [offset],
                function querySeekCallback(error: any, result: any) {
                    callback(undefined !== result[0] ? result[0]['value'] || '' : '', error);
                });
        }

    }
}
