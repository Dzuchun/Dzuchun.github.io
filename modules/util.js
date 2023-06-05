// @ts-check

/**
 * Deep-merges two objects. For each of simple fields it selects primary value over secondary, or secondary value if primary is absent
 * @param {Object} primary Primary object (one in favor)
 * @param {Object} secondary Secondary object (a fallback)
 * @param {Object} result An object to write result to. Default is a new empty object
 * @returns {Object} Result of a deep merge
 */
export function deepMergeObjects(primary, secondary, result = primary) {
  /** property names of primary object */
  let primaryKeys = Object.keys(primary);
  /** property names of secondary object */
  let secondaryKeys = Object.keys(secondary);
  /** property names of both primary and secondary objects, merged */
  let mergedKeys = Array.from(primaryKeys);
  // I'm forced to use this ugly loop thing, because stream-like operations did not work here for some reason
  for (let k of secondaryKeys) {
    if (!mergedKeys.includes(k)) {
      mergedKeys.push(k);
    }
  }

  if (mergedKeys.length == 0 || typeof primary === "string") {
    // either there are no keys at all (it's a boolean, number or th like that)
    // or primary is a string (which I consider primitive by convention too)
    // there's no further nesting - return one of the objects
    return primary || secondary;
  } else {
    mergedKeys.forEach((/** name of the objects's property */ key) => {
      /** corresponding value of a primary object */
      let primaryValue = primary[key];
      /** corresponding value of a secondary object */
      let secondaryVal = secondary[key];
      if (primaryValue !== null && primaryValue !== undefined) {
        // primary value "exists"
        if (secondaryVal !== null && secondaryVal !== undefined) {
          // secondary value "exists" too
          // use recursion, as there might be deeper nesting
          result[key] = deepMergeObjects(primaryValue, secondaryVal);
        } else {
          // only primary value exists - assign it to result
          result[key] = primaryValue;
        }
      } else {
        // only secondary value exists - assign it to result
        // that's not obvious, but this block executes if either:
        // primary object has some insignificant value for this key,
        // or secondary object has a valid value to supply
        result[key] = secondaryVal;
      }
    });
    return result;
  }
}

/**
 * Something that can be have attributes set and gotten from
 * @typedef {Object} Attributable
 * @method
 * @name getAttribute
 * @param {String} attributeName
 * @returns {String} Value of the attribute
 * @method
 * @name setAttribute
 * @param {String} attributeName
 * @param {String} attributeValue
 */

/**
 * A little helper function to reduce amount of magic strings in code.
 * I need to set element's visibility quite often, so it's no surprise I decided to factor it out.
 * @param {?Attributable} object Object to set visibility for
 * @param {?boolean} isVisible Flag that determines if object is visible
 */
export function setVisibility(object, isVisible) {
  object?.setAttribute("visibility", isVisible ? "visible" : "hidden");
}

/**
 *
 * @param {?Attributable} object Object to get visibility of
 * @returns {boolean} is object is visible
 */
export function getVisibility(object) {
  return object?.getAttribute("visibility") === "visible" ?? false;
}

/**
 * Creates an svg line element that points from center of a graph to it's circle at a specified angle
 * @param {{x0: Number, y0: Number, r0: Number}} geometryDefiner Object contatining relevant fields for positioning
 * @param {Number} begin A start of the line, measured as part of graph circle radius. So, 0.0 is line touching center, 1.0 is line touching the circle
 * @param {Number} end An end of the lime, measured as part of graph circle radius. So, 0.0 is line touching center, 1.0 is line touching the circle
 * @param {Number} angle Angle line should point at in regular math convention. So, 0.0 means "right", pi/2 means "up", so on
 * @returns {SVGLineElement}
 */
export function createLineToAngle(geometryDefiner, begin, end, angle) {
  let res = document.createElementNS("http://www.w3.org/2000/svg", "line"); // creating the line
  res.setAttribute("x1", String(geometryDefiner.x0 + begin * geometryDefiner.r0 * Math.cos(angle))); // setting it's start coords
  res.setAttribute("y1", String(geometryDefiner.y0 - begin * geometryDefiner.r0 * Math.sin(angle)));
  res.setAttribute("x2", String(geometryDefiner.x0 + end * geometryDefiner.r0 * Math.cos(angle))); // setting it's end coords
  res.setAttribute("y2", String(geometryDefiner.y0 - end * geometryDefiner.r0 * Math.sin(angle)));
  return res;
}

/**
 * Sets object's checked field, if object does exist
 * @param {?{checked : boolean} | undefined} object Object to set field for
 * @param {boolean} value
 */
export function setChecked(object, value) {
  if (object) {
    object.checked = value ?? false;
  }
}

/**
 * Sets object's innerHTML field, if object does exist
 * @param {?{innerHTML: String} | undefined} object Object to set field for
 * @param {String} value
 */
export function setHtml(object, value) {
  if (object) {
    object.innerHTML = value;
  }
}

/**
 * Sets object's innerText field, if object does exist
 * @param {?{innerText : String} | undefined} object Object to set field for
 * @param {String} value
 */
export function setText(object, value) {
  if (object) {
    object.innerText = value;
  }
}

/**
 * Sets object's value field, if object does exist
 * @param {?{value : String} | undefined} object Object to set field for
 * @param {String} value
 */
export function setInputText(object, value) {
  if (object) {
    object.value = value;
  }
}

/**
 * Essentially works like a normal toFixed, but it cuts out leading/trailing zeros, or ommits trail altogether, if number is whole
 * @param {Number | String} number Number to use
 * @param {Number} places Max decimal places to display
 * @returns {String} Fancy string representation of mentioned number
 */
export function fancyRound(number, places = 3) {
  if (typeof number !== "number") {
    number = Number(number);
  }
  return Number(number.toFixed(places)).toString();
}
