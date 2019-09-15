"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const should = require("should");
const ts_stream_1 = require("ts-stream");
const streams_1 = require("../exports/streams");
const describe_this_1 = require("./describe-this");
const utils_1 = require("../types/utils");
const exports_1 = require("exports");
// Have to require should to monkey-patch it onto objects,
// but have to import should to get the types. Yuck!
require('should');
function valAfterMs(val, ms = 0) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(val);
        }, ms);
    });
}
function afterMs(fn, ms = 0) {
    return new Promise(resolve => {
        setTimeout(() => resolve(fn()), ms);
    });
}
describe_this_1.describeThis(streams_1.EventualMap, subject => {
    describe("constructor", () => {
        it("Returns a BiMap when initialized with one", async () => {
            const eventual = subject(ts_stream_1.Stream.from([
                valAfterMs(utils_1.tuple(["A", 92]), 15)
            ]), { seed: new exports_1.BiMap() });
            const result = (await eventual.finalMap).getKey(92);
            should.equal(result, "A");
        });
    });
    describe("get", () => {
        it("Returns a promise that is fulfilled when the stream entry comes through", async () => {
            const eventual = subject(ts_stream_1.Stream.from([
                valAfterMs(utils_1.tuple(["A", 92]), 15)
            ]));
            const result = await eventual.get("A");
            utils_1.defined(result).should.equal(92);
        });
        it("Returns the first value to be returned with key", async () => {
            const eventual = subject(ts_stream_1.Stream.from([
                valAfterMs(utils_1.tuple(["A", 92]), 15),
                valAfterMs(utils_1.tuple(["A", 922]), 20),
                valAfterMs(utils_1.tuple(["A", 9222]), 30)
            ]));
            const result = await eventual.get("A");
            utils_1.defined(result).should.equal(92);
            await afterMs(async () => {
                const result = await eventual.get("A");
                utils_1.defined(result).should.equal(92);
            }, 1);
            const result2 = await eventual.finalMap;
            utils_1.defined(result2.get("A")).should.equal(92);
        });
        it("With a provided seed, plants key-entry pairs on the seed", async () => {
            const eventual = subject(ts_stream_1.Stream.from([
                valAfterMs(utils_1.tuple(["A", 92]), 15),
                valAfterMs(utils_1.tuple(["A", 922]), 20),
                valAfterMs(utils_1.tuple(["B", 111]), 30),
                valAfterMs(utils_1.tuple(["A", 9222]), 30)
            ]), {
                seed: new Map([["B", 0]])
            });
            const result = await eventual.finalMap;
            utils_1.defined(result.get("A")).should.equal(92);
            utils_1.defined(result.get("B")).should.equal(0);
            utils_1.defined(await eventual.get("B")).should.equal(0);
        });
    });
    describe("getNow", () => {
        it("Returns whatever value is currently loaded into the underlying map", async () => {
            const eventual = subject(ts_stream_1.Stream.from([
                valAfterMs(utils_1.tuple(["A", 92]), 15),
                valAfterMs(utils_1.tuple(["A", 922]), 20),
                valAfterMs(utils_1.tuple(["B", 111]), 30),
                valAfterMs(utils_1.tuple(["A", 9222]), 30)
            ]));
            const result = eventual.getNow("A");
            should.equal(result, undefined);
            await afterMs(() => {
                const result = eventual.getNow("A");
                should.equal(result, 92);
            }, 16);
            await afterMs(() => {
                const result = eventual.getNow("A");
                should.equal(result, 92);
            }, 21 - 16);
            await afterMs(() => {
                const result = eventual.getNow("A");
                should.equal(result, 92);
            }, 31 - 21);
        });
    });
});