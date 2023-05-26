"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis = require("redis");
const KEY = `account1/balance`;
const DEFAULT_BALANCE = 100;
const charges = getCharges();
exports.chargeRequestRedis = async function (input) {
    const redisClient = await getRedisClient();
    return new Promise((resolve, reject) => {
        redisClient.multi().eval(`
            local balance = redis.call('GET', KEYS[1])
            if tonumber(balance) >= tonumber(ARGV[1]) then
                redis.call('DECRBY', KEYS[1], ARGV[1])
            return tonumber(balance)
            end`, 1, KEY, charges)
            .exec((err, results) => {
            if (err) {
                reject(err);
            } else {
                const balance = Number(results[0]);
                const isAuthorized = balance - charges > 0;
                resolve({
                    remainingBalance: isAuthorized ? balance - charges : 0,
                    isAuthorized,
                    charges: isAuthorized ? (balance - charges) / charges : 0
                });
            }
        });
    }).finally(()=> {
        disconnectRedis(redisClient);
    });
};
exports.resetRedis = async function () {
    const redisClient = await getRedisClient();
    const ret = new Promise((resolve, reject) => {
        redisClient.set(KEY, String(DEFAULT_BALANCE), (err, res) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(DEFAULT_BALANCE);
            }
        });
    });
    await disconnectRedis(redisClient);
    return ret;
};
async function getRedisClient() {
    return new Promise((resolve, reject) => {
        try {
            const client = new redis.RedisClient({
                host: process.env.ENDPOINT,
                port: parseInt(process.env.PORT || "6379"),
            });
            client.on("ready", () => {
                console.log('redis client ready');
                resolve(client);
            });
        }
        catch (error) {
            reject(error);
        }
    });
}
async function disconnectRedis(client) {
    return new Promise((resolve, reject) => {
        client.quit((error, res) => {
            if (error) {
                reject(error);
            }
            else if (res == "OK") {
                console.log('redis client disconnected');
                resolve(res);
            }
            else {
                reject("unknown error closing redis connection.");
            }
        });
    });
}
function getCharges() {
    return DEFAULT_BALANCE / 20;
}
