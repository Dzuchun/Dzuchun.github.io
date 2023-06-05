// @ts-check
/**
 * This small module defines all function zones functionality
 */

/**
 * @typedef {Object} Geometryholder Describes properties required for configuring visuals
 * @property {Number} x0
 * @property {Number} y0
 * @property {Number} r0
 */

/**
 * Encapsulates basic zone functionality
 */
export class FunctionZone {
  /** @type {?SVGElement} an svg element this area is represented with */
  zoneObject;
  /** @type {Number} */
  typeIndex;
  /** @type {Number} */
  functionIndex;
  /** @type {Number} Value this zone  */
  value;
  /** @type {?String} */
  literal;

  /**
   * @param {Number} typeIndex [Zone type](./constants.js) index
   * @param {Number} functionIndex [Function](./constants.js)
   * @param {Number} value Value to use for visual configuration. Defaults to 0 for positive/negative areas
   * @param {?String} literal Literal to display // TODO might like to remove that
   * @param {?Geometryholder} geometryHolder If supplied, visuals will be inited right away
   */
  constructor(typeIndex, functionIndex, value = 0, literal = null, geometryHolder = null) {
    // assign supplied fields
    this.typeIndex = typeIndex;
    this.functionIndex = functionIndex;
    this.value = value;
    this.literal = literal;
    if (geometryHolder) {
      // visual is already present, init it
      this.initVisual(geometryHolder);
    }
  }

  /**
   * Creates and configures zone's visual element
   * @param {Geometryholder} geometryHolder
   */
  initVisual(geometryHolder) {}

  highlight() {}
  dehighlight() {}

  // Color property dummy
  set color(color) {}
  get color() {
    return "";
  }
}

/**
 * An zone that has SVGLineElement as visuals
 */
export class FunctionZoneLine extends FunctionZone {
  /** Non-highlighted line opacity */
  static #lowOpacity = "0.5";
  /** Highlighted line opacity */
  static #highOpacity = "1.0";
  /** Non-highlighted line width */
  static #lowWidth = "0.3";
  /** Highlighted line width */
  static #highWidth = "1";

  /**
   * @param {Number} typeIndex [Zone type](./constants.js) index
   * @param {Number} functionIndex [Function](./constants.js)
   * @param {Number} value Value to use for visual configuration. Defaults to 0 for positive/negative zones
   * @param {?String} literal Literal to display // TODO might like to remove that
   * @param {?Geometryholder} geometryHolder If supplied, visuals will be inited right away
   */
  constructor(typeIndex, functionIndex, value = 0, literal = null, geometryHolder = null) {
    super(typeIndex, functionIndex, value, literal, geometryHolder);
  }

  /**
   * Creates and configures zone's visual element
   * @param {Geometryholder} geometryHolder
   */
  initVisual(geometryHolder) {
    super.initVisual(geometryHolder);
    this.zoneObject = document.createElementNS("http://www.w3.org/2000/svg", "line");
    this.zoneObject.classList.add("function-zone-line"); // add this class by convention
    this.zoneObject.style.transformOrigin = "center"; // always rotate/move line around center of the visuals
    this.zoneObject.setAttribute("stroke", "rgb(255, 255, 255)"); // make sure object has some default stroke color
    this.dehighlight(); // make sure it's dehighlighted by default
    let R = geometryHolder.r0 * 1.5; // value big enough, that's always beyond the view
    let val = geometryHolder.r0 * this.value;
    switch (this.functionIndex) {
      case 0:
        // it's a sine zone - create long horizontal line
        this.zoneObject.setAttribute("x1", String(geometryHolder.x0 - R));
        this.zoneObject.setAttribute("y1", String(geometryHolder.y0 - val));
        this.zoneObject.setAttribute("x2", String(geometryHolder.x0 + R));
        this.zoneObject.setAttribute("y2", String(geometryHolder.y0 - val));
        break;
      case 1:
        // it's a cosine zone - create long vertical line
        this.zoneObject.setAttribute("x1", String(geometryHolder.x0 + val));
        this.zoneObject.setAttribute("y1", String(geometryHolder.y0 - R));
        this.zoneObject.setAttribute("x2", String(geometryHolder.y0 + val));
        this.zoneObject.setAttribute("y2", String(geometryHolder.x0 + R));
        break;
      case 2:
        // it's a tangent zone - create large tilted line
        this.zoneObject.setAttribute("x1", String(geometryHolder.x0 - R));
        this.zoneObject.setAttribute("y1", String(geometryHolder.y0 + R * this.value));
        this.zoneObject.setAttribute("x2", String(geometryHolder.x0 + R));
        this.zoneObject.setAttribute("y2", String(geometryHolder.y0 - R * this.value));
        break;
      case 3:
        // it's a cotangent zone - create large tilted line
        this.zoneObject.setAttribute("x1", String(geometryHolder.x0 + R * this.value));
        this.zoneObject.setAttribute("y1", String(geometryHolder.y0 - R));
        this.zoneObject.setAttribute("x2", String(geometryHolder.x0 - R * this.value));
        this.zoneObject.setAttribute("y2", String(geometryHolder.y0 + R));
        break;
    }
  }

  /**
   * Sets visuals color
   * @param {String} color Color, as it's expected in DOM attribute
   */
  set color(color) {
    this.zoneObject?.setAttribute("stroke", color);
  }

  /**
   * Gets visuals color
   * @return {String} Color, as it was in DOM attribute, or empty string if visuals were not created yet
   */
  get color() {
    return this.zoneObject?.getAttribute("stroke") ?? ""; // if object was initialised, it always has a stroke color
  }

  highlight() {
    this.zoneObject?.setAttribute("opacity", FunctionZoneLine.#highOpacity);
    this.zoneObject?.setAttribute("stroke-width", FunctionZoneLine.#highWidth);
  }

  dehighlight() {
    this.zoneObject?.setAttribute("opacity", FunctionZoneLine.#lowOpacity);
    this.zoneObject?.setAttribute("stroke-width", FunctionZoneLine.#lowWidth);
  }
}

/**
 * An zone that has SVGPolygonElement as visuals
 */
export class FunctionZonePoly extends FunctionZone {
  static #lowOpacity = "0.15";
  static #highOpacity = "0.5";
  /**
   * @param {Number} typeIndex [Zone type](./constants.js) index
   * @param {Number} functionIndex [Function](./constants.js)
   * @param {Number} value Value to use for visual configuration. Defaults to 0 for positive/negative zones
   * @param {?String} literal Literal to display // TODO might like to remove that
   * @param {?Geometryholder} geometryHolder If supplied, visuals will be inited right away
   */
  constructor(typeIndex, functionIndex, value = 0, literal = null, geometryHolder = null) {
    super(typeIndex, functionIndex, value, literal, geometryHolder);
  }

  /**
   * Creates and configures zone's visual element
   * @param {Geometryholder} geometryHolder
   */
  initVisual(geometryHolder) {
    this.zoneObject = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    this.zoneObject.setAttribute("stroke", "transparent"); // hide plygon stroke
    this.zoneObject.classList.add("function-zone-poly"); // add class bu convention
    this.zoneObject.style.transformOrigin = "center"; // move/rotate polygon aroung center
    this.zoneObject.setAttribute("fill-rule", "evenodd"); // fill with even-odd (here to prevent ambiguity)
    this.dehighlight(); // make sure ploygon looks dehighted by default
    /**
     * Little helper function for polygon paths
     * @param {Number} xOffset X-offset in geometry coords
     * @param {Number} yOffset Y-offset in geometry coords
     * @returns {String} String representation of a point suitable for SVG polygon configuration
     */
    function point(xOffset, yOffset) {
      return `${geometryHolder.x0 + xOffset},${geometryHolder.y0 + yOffset}`;
    }
    let R = geometryHolder.r0 * 1.5; // value big enough, that's always beyond the graph
    let value = geometryHolder.r0 * this.value; // functions value in supplied geometry length
    switch (true) {
      case this.typeIndex == 0 && this.functionIndex == 0: // sine & positive
      case this.typeIndex == 3 && this.functionIndex == 0: // sine & more
        // create large rectangle above X-axis
        this.zoneObject.setAttribute("points", [point(-R, -R), point(R, -R), point(R, -value), point(-R, -value)].join(" ")); // wow, this is INSANELY compact!
        break;
      case this.typeIndex == 1 && this.functionIndex == 0: // sine & negative
      case this.typeIndex == 4 && this.functionIndex == 0: // sine & less
        // create large rectange below X-axis
        this.zoneObject.setAttribute("points", [point(-R, -value), point(R, -value), point(R, R), point(-R, R)].join(" "));
        break;
      case this.typeIndex == 0 && this.functionIndex == 1: // cosine & positive
      case this.typeIndex == 3 && this.functionIndex == 1: // cosine & more
        // create large rectangle on the right from Y-axis
        this.zoneObject.setAttribute("points", [point(value, -R), point(R, -R), point(R, R), point(value, R)].join(" "));
        break;
      case this.typeIndex == 1 && this.functionIndex == 1: // cosine & negative
      case this.typeIndex == 4 && this.functionIndex == 1: // cosine & less
        // create large rectangle on the left from Y-axis
        this.zoneObject.setAttribute("points", [point(-R, -R), point(value, -R), point(value, R), point(-R, R)].join(" "));
        break;
      case this.typeIndex == 0 && this.functionIndex == 2: // tangent & positive
      case this.typeIndex == 3 && this.functionIndex == 2: // tangent & more
        // create butterfly-thing in 1 and 3 quarters
        this.zoneObject.setAttribute(
          "points",
          [point(0, -R), point(R, -R), point(R, -R * this.value), point(-R, R * this.value), point(-R, R), point(0, R)].join(" ")
        );
        break;
      case this.typeIndex == 1 && this.functionIndex == 2: // tangent & negative
      case this.typeIndex == 4 && this.functionIndex == 2: // tangent & less
        // create butterfly-thing in 2 and 4 quarters (kinda hard to describe this share, huh?)
        this.zoneObject.setAttribute(
          "points",
          [point(0, R), point(R, R), point(R, -R * this.value), point(-R, R * this.value), point(-R, -R), point(0, -R)].join(" ")
        );
        break;
      case this.typeIndex == 0 && this.functionIndex == 3: // cotangent & positive
      case this.typeIndex == 3 && this.functionIndex == 3: // cotangent & more
        // create butterfly-thing in 1 and 3 quarters
        this.zoneObject.setAttribute(
          "points",
          [point(R, 0), point(R, -R), point(R * this.value, -R), point(-R * this.value, R), point(-R, R), point(-R, 0)].join(" ")
        );
        break;
      case this.typeIndex == 1 && this.functionIndex == 3: // cotangent & negative
      case this.typeIndex == 4 && this.functionIndex == 3: // cotangent & less
        // create butterfly-thing in 2 and 4 quarters (kinda hard to describe this share, huh?)
        this.zoneObject.setAttribute(
          "points",
          [point(-R, 0), point(-R, -R), point(R * this.value, -R), point(-R * this.value, R), point(R, R), point(R, 0)].join(" ")
        );
        break;
      default:
        // If execution ends up here, something is not OK. Warn about that
        console.warn("Something's up at zone visuals initialization...", this, geometryHolder);
    }
  }

  /**
   * Sets visuals color
   * @param {String} color Color, as it's expected in DOM attribute
   */
  set color(color) {
    this.zoneObject?.setAttribute("fill", color);
  }

  /**
   * Gets visuals color
   * @return {String} Color, as it was in DOM attribute, or empty string if visuals were not created yet
   */
  get color() {
    return this.zoneObject?.getAttribute("fill") ?? "";
  }

  highlight() {
    this.zoneObject?.setAttribute("opacity", FunctionZonePoly.#highOpacity);
  }

  dehighlight() {
    this.zoneObject?.setAttribute("opacity", FunctionZonePoly.#lowOpacity);
  }
}
