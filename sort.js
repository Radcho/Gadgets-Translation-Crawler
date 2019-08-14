/**
 * Sorts the keys on an object.
 *
 * @param {any} unsorted A property to sort. If an object or array, it will sort the keys. Otherwise it returns the passed value.
 * @returns {any} Object with sorted keys, if unsorted wasn't an object returns whatever was passed.
 */
function sortObject(unsorted) {
    if (typeof (unsorted) !== 'object' || unsorted === null) {
        return unsorted;
    }

    const copy = Array.isArray(unsorted) ? [] : {};
    const keys = Object.keys(unsorted).sort();

    keys.forEach((key) => {
        copy[key] = sortObject(unsorted[key]);
    });

    return copy;
}

module.exports = sortObject;