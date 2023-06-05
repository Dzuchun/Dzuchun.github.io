// @ts-check
import { sypher, desypher } from "./syph.js";

/** @type {(String | {t: "b" | "w" | "i" | "d" | "s", n: String})[]} Schema used to encode program's state. Contains into about state structure, it's field names and their sufficient type */
const SCHEMA = [
  "angle",
  { t: "b", n: "pointer" },
  { t: "b", n: "pointerLabel" },
  { t: "d", n: "selectedAngle" },
  { t: "b", n: "labels" },
  { t: "b", n: "guideLines" },
  { t: "b", n: "radLabels" },
  { t: "b", n: "inputRad" },
  { t: "s", n: "inputString" },
  { t: "s", n: "inputInterpret" },
  { t: "b", n: "interpretPi" },
  { t: "b", n: "interpretPiLock" },
  { t: "b", n: "mirrorX" },
  { t: "b", n: "mirrorY" },
  { t: "b", n: "overwind" },
  "__",
  "functions",
  { t: "b", n: "guideLines" },
  { t: "b", n: "showSin" },
  { t: "b", n: "showCos" },
  { t: "b", n: "showTan" },
  { t: "b", n: "funcLabels" },
  { t: "b", n: "suppressExpressions" },
  { t: "w", n: "selectedFunctionValue" },
  { t: "w", n: "selectedFunctionZone" },
  { t: "s", n: "zonesDataString" },
  "__",
  "formulae",
  { t: "s", n: "query" },
  { t: "i", n: "selectedId" },
  { t: "i", n: "shownId" },
  { t: "b", n: "shownParents" },
  "__",
];

/**
 * This class holds Interactive Trigonometry state, including both graph and controls states
 */
export default class InteractiveTrigonometryState {
  angle = {
    /** @type {?boolean | undefined} */
    pointer: true,
    /** @type {?boolean | undefined} */
    pointerLabel: false,
    /** @type {?number | undefined} */
    selectedAngle: 0,
    /** @type {?boolean | undefined} */
    labels: false,
    /** @type {?boolean | undefined} */
    guideLines: false,
    /** @type {?boolean | undefined} */
    radLabels: false,
    /** @type {?boolean | undefined} */
    inputRad: false,
    /** @type {?String | undefined} */
    inputString: null,
    /** @type {?String | undefined} */
    inputInterpret: "No input",
    /** @type {?boolean | undefined} */
    interpretPi: false,
    /** @type {?boolean | undefined} */
    interpretPiLock: false,
    /** @type {?boolean | undefined} */
    mirrorX: false,
    /** @type {?boolean | undefined} */
    mirrorY: false,
    /** @type {?boolean | undefined} */
    overwind: false,
  };
  functions = {
    /** @type {?boolean | undefined} */
    guideLines: false,
    /** @type {?boolean | undefined} */
    showSin: false,
    /** @type {?boolean | undefined} */
    showCos: false,
    /** @type {?boolean | undefined} */
    showTan: false,
    /** @type {?boolean | undefined} */
    funcLabels: false,
    /** @type {?boolean | undefined} */
    suppressExpressions: false,
    /** @type {?number | undefined} */
    selectedFunctionValue: 0,
    /** @type {?number | undefined} */
    selectedFunctionZone: 0,
    /** @type {?String | undefined} */
    zonesDataString: null,
    /** @type {?((?String)[][]) | undefined} */
    zonesData: [
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ],
  };
  formulae = {
    /** @type {?String | undefined} */
    query: null,
    selectedId: 0,
    shownId: 0,
    /** @type {?boolean | undefined} */
    shownParents: false,
  };

  /**
   * Encodes state into a base64-like string using {@link sypher}
   * @returns {String}
   */
  encode() {
    this.#encodeZones();
    return sypher(this, SCHEMA);
  }

  /**
   * Decodes state from a base64-like string
   * @param {String} input
   * @returns {InteractiveTrigonometryState} Decoding result, or a halfway-decoded result if some sort of exception happened
   */
  static decode(input) {
    let result = new InteractiveTrigonometryState();
    try {
      /** @type {InteractiveTrigonometryState} */
      result = desypher(SCHEMA, input, result); // this method is insanely error-exposed
      result.#decodeZones();
    } catch (exception) {
      // if any error occured, make sure it's an expected one
      if (!(exception.name === "RangeError" || exception.name === "InvalidCharacterError")) {
        throw exception;
      }
      console.error("BAD STATE INPUT:", input, "GOT EXCEPTION:", exception); // log error
    }
    return result;
  }

  /**
   * Encodes zones stored in {@link this.functions.zonesData} and writes them as a single string to {@link this.functions.zonesDataString}
   */
  #encodeZones() {
    this.functions.zonesDataString = "><"; // start with separator
    for (let typeIndex in this.functions.zonesData) {
      for (let functionIndex in this.functions.zonesData[typeIndex]) {
        if (this.functions.zonesData[typeIndex][functionIndex]) {
          // zone of this type exists - add record about that in the string
          this.functions.zonesDataString += `${typeIndex}|${functionIndex}|${this.functions.zonesData[typeIndex][functionIndex]}><`;
        }
      }
    }
  }

  /**
   * Decodes zones stored in a {@link this.functions.zonesDataString} string and expands them to {@link this.functions.zonesData} (for more convenient use)
   */
  #decodeZones() {
    if (!this.functions.zonesDataString) {
      // no zones data string - nothing to do
      return;
    }
    // pre-init/reset all zones
    this.functions.zonesData = [
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    this.functions.zonesDataString
      .split("><") // this is a separator between zone recordings
      .filter((zoneString) => zoneString) // filter out empty strings (just in case)
      .forEach((zoneString) => {
        let [typeIndex, functionIndex, value] = zoneString.split("|");
        // @ts-expect-error [this.functions.zonesData is not null, as I did reinitialized it right above]
        this.functions.zonesData[typeIndex][functionIndex] = value;
      });
  }
}
