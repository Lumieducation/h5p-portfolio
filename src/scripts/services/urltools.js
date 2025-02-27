/** Class representing URL related functions */
export default class URLTools {
  /**
   * Extract fragments from browser URL.
   * @param {function} validate Validation function.
   * @param {Window} hashWindow Window.
   * @returns {object} Fragments.
   */
  static extractFragmentsFromURL(validate, hashWindow) {
    if (!hashWindow.location.hash) {
      return {};
    }

    // Convert fragment string to object with properties
    const fragments = {};
    hashWindow.location.hash.replace('#', '').split('&').forEach((fragment) => {
      if (fragment.indexOf('=') === -1) {
        return; // Skip if incomplete pair
      }

      const argPair = fragment.split('=');
      fragments[argPair[0]] = argPair[1];
    });

    // Optionally validate and ignore fragments
    if (typeof validate === 'function' && !validate(fragments)) {
      return {};
    }

    return fragments;
  }

  /**
   * Create fragments string from fragments object.
   * @param {object} fragments Fragments.
   * @returns {string} Fragments string.
   */
  static createFragmentsString(fragments) {
    const fragmentString = Object.entries(fragments)
      .filter((entry) => entry.length === 2)
      .map((entry) => `${entry[0]}=${entry[1]}`)
      .join('&');

    return `#${fragmentString}`;
  }

  /**
   * Determine whether two fragment objects are equal.
   * @param {object} fragment1 Fragment 1.
   * @param {object} fragment2 Fragment 2.
   * @param {string[]} [limitTo] Keys to limit equality check to.
   * @returns {boolean} True, if fragments are equal.
   */
  static areFragmentsEqual(fragment1, fragment2, limitTo = []) {
    for (const key in fragment1) {
      if (Object.prototype.hasOwnProperty.call(fragment1, key)) {
        if (limitTo.length > 0 && limitTo.indexOf(key) === -1) {
          continue;
        }
        if (!fragment2[key] || fragment1[key].toString() !== fragment2[key].toString()) {
          return false;
        }
      }
    }
    return true;
  }
}
