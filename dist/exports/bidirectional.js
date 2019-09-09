"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const maps_1 = require("../exports/maps");
function getReversedBiMap(biMap) {
    return new Proxy(biMap._reverse, {
        get(target, p) {
            if (p === "reversed") {
                return biMap;
            }
            else if (p === "set") {
                return (key, val) => biMap.set(val, key);
            }
            else if (p === "clear") {
                return () => biMap.clear();
            }
            else if (p === "delete") {
                return (key) => maps_1.foldingGet(target, key, (val) => biMap.delete(val));
            }
            else if (p === "hasVal") {
                return (val) => biMap.has(val);
            }
            else if (p === "deleteVal") {
                return (val) => biMap.delete(val);
            }
            else if (p === "getKey") {
                return (val) => biMap.get(val);
            }
            else {
                const field = target[p];
                if (typeof field === "function") {
                    return field.bind(target);
                }
                else {
                    return field;
                }
            }
        }
    });
}
/**
 * Bidirectional Map.
 * In addition to the functions of a standard Map, BiMap allows lookups from value to key.
 *
 * The {@link BiMap#reversed} field allows access to a value-key counterpart Map with an equivalent interface.
 *
 * @remarks
 * Unlike a normal Map, BiMap must maintain the invariant that no two keys may map to the same value (as that would imply a value mapping to two keys, which is impossible).
 * Therefore, when a key is set to a colliding value, the previous key set to that value is deleted.
 *
 * @extends Map
 */
class BiMap extends Map {
    /**
     *
     * @example
     * const biMap1 = new BiMap(existingMap);
     * const biMap2 = new BiMap([["a", 1]]);
     * const biMap3 = new BiMap(Object.entries({"a": 1}))
     *
     * @typeparam K Key type
     * @typeparam T Value type
     * @param forward? {Iterable}
     * An iterable yielding all key-value tuples that will be fed into the Map.
     * Without this, the Map is initialized to empty.
     * @param reverse? {Iterable}
     * An iterable yielding all value-key tuples that will be fed into the reversed Map.
     * If this is provided, it must be the exact reverse of {@link BiMap.constructor.forward}.
     * If it is not provided, BiMap generates it manually.
     */
    constructor(forward, reverse) {
        super();
        if (forward) {
            for (let entry of forward) {
                const [key, value] = entry;
                super.set(key, value);
            }
        }
        this._reverse = reverse
            ? new Map(reverse)
            : maps_1.mapCollect(maps_1.reverseMap(forward || []));
    }
    /**
     * Access the reversed map.
     * This makes some operations very simple, like `biMap.reversed.entries()` to get a list of value-to-key tuples for downstream processing.
     *
     * @remarks
     * The implementation of BiMap maintains two maps in tandem, the original map and the reversed map, so accessing this is a cheap operation.
     *
     * @returns BiMap
     */
    get reversed() {
        return this._reversedProxy || (this._reversedProxy = getReversedBiMap(this));
    }
    set(key, val) {
        if (this._reverse.has(val)) {
            this.delete(this._reverse.get(val));
        }
        super.set(key, val);
        this._reverse.set(val, key);
        return this;
    }
    clear() {
        super.clear();
        this._reverse.clear();
    }
    delete(key) {
        if (super.has(key)) {
            const valueAt = super.get(key);
            this._reverse.delete(valueAt);
        }
        return super.delete(key);
    }
    getKey(val) {
        return this._reverse.get(val);
    }
    deleteVal(val) {
        return maps_1.foldingGet(this._reverse, val, key => this.delete(key), () => false);
    }
    hasVal(val) {
        return this._reverse.has(val);
    }
}
exports.BiMap = BiMap;
