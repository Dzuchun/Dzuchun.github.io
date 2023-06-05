// @ts-check
import { FunctionZoneLine as FunctionZoneLine, FunctionZonePoly as FunctionZonePoly } from "./zone.js";
import Guideline from "./guideline.js";
import InteractiveTrigonometryState from "./state.js";
import { FUNCTION_LIST, FUNCTION_NAMES, ZONE_TYPE_NAMES, PI, PIx2, EVAL_ALLOWED, FUNCTION_INDEXES } from "./constants.js";
import { deepMergeObjects, setChecked, setInputText, setText, fancyRound, setHtml } from "../../modules/util.js";

/** Guideline snap radius (in radian). Defines furthest (ima butcherrrr!!!) from a guideline pointer can snap */
const SNAP_RADIUS = 0.03;

/** WolframAlpha query string without actual query */
const WOLFRAM_QUERY = "https://www.wolframalpha.com/input?i=";
/** Url pointing to WolframAlpha logo icon I use for buttons */
const WOLFRAM_BUTTON_IMAGE = "https://www.wolframalpha.com/_next/static/images/favicon_1zbE9hjk.ico";
/** Default Interactive Trigonometry page URL but with state string ommited */
const URL_FOR_STATE = "https://dzuchun.github.io/interactive-trigonometry/interactive-trigonometry.html?state=";

/**
 * @param {String} input User input (can be anything)
 * @param {?Object} localization Localization object to use (ignore to use default)
 * @returns {{evaluation: String, literal: String}} Object contatining eval-safe string and a literal representations of user input, or an error message if user input is invalid for some reason
 */
function extractValue(input, localization) {
  /**
   * @type {String}
   * Holds string that is safe to pass in eval() function
   */
  let evalVal = "";
  /**
   * @type {String}
   * Holds string that visually represents user input
   */
  let literalVal = "";
  /**
   * @type {String}
   * Holds user input but presumebly with special word substituted to ї{something}
   */
  // @ts-ignore
  let hiddenVal = input.replaceAll("sqrt", "ї1").replaceAll("√", "ї1");
  if (!hiddenVal.length) {
    // input is empty
    literalVal = localization?.no_input ?? "No input";
  } else if (!EVAL_ALLOWED.test(hiddenVal)) {
    // input likely contained not allowed chars/calls
    literalVal = localization?.bad_input ?? "Bad input";
  } else {
    // input is not empty and passer regex check
    // replace hideout with proper function calls for evaluation
    // @ts-ignore
    evalVal = hiddenVal.replaceAll("ї1", "Math.sqrt");
    // replacing hideouts with visual symbols for representation
    // @ts-ignore
    literalVal = hiddenVal.replaceAll("ї1", "√");
  }
  return {
    evaluation: evalVal,
    literal: literalVal,
  };
}

/**
 * @param {String} texString string contatining tex markup
 * @returns {String} HTML representing katex-rendered math
 */
function renderLatex(texString) {
  // @ts-ignore
  return katex.renderToString(`\\mathrm\{${texString}\}`, {
    displayMode: true,
    throwOnError: false,
  });
}

/**
 * This function is an arccotangent as **I** know it:
 * - x is any real number;
 * - result is a real number from 0 to pi.
 * @param {Number} x
 * @returns {Number}
 */
function acot(x) {
  let res = Math.atan(1.0 / x);
  if (res < 0) {
    res += PI;
  }
  return res;
}

/**
 * This function returns a string that must be appended to a number to signify any overwinds present
 * @param {Number} angle
 * @param {boolean} isRad flag that describes if angle is formatted in radian instead of degree
 * @returns {String} Angle addition string like ' + 6*360°'
 */
function getAngleAppend(angle, isRad) {
  if (angle < 0 || angle > PIx2) {
    // there's some sort of overwind
    let winds = Math.floor(angle / PIx2);
    // for now I'm just gonna add corresponding angle
    let sign = winds > 0 ? "+" : "-";
    // no need in wind's sign now
    winds = Math.abs(winds);
    return ` ${sign} ${winds + "*"}${isRad ? "2π" : "360°"}`;
  } else {
    return "";
  }
}

/**
 * One-line helper function to factor out some constants I would rather not leave in every guideline creation below
 * @param {Object} data A guideline data object. See array of examples [here](../data/default-guidelines.json)
 * @param {Number} typeIndex [Zone type](./constants.js) index
 * @param {Number} functionIndex [Function](./constants.js) index
 * @returns {Guideline} A newly created guideline with a specified data, type & function indexes.
 * Assigned a "dynamic-guideline" CSS class, has no label and point
 */
function createDynamicGuideline(data, typeIndex, functionIndex) {
  return new Guideline(data, ["dynamic-guideline"], undefined, undefined, false, false, typeIndex, functionIndex);
}

/**
 * This function creates and returns guidelines that correspond to a zone.
 * This function is kinda awkwand to write, as it does, in fact, encapsulate insane amount of logic.
 * Beforementioned zone is described by:
 * @param {Number} typeIndex [Zone type](./constants.js) index
 * @param {Number} functionIndex [Function](./constants.js) index
 * @param {Number} functionValue Function value
 * @param {?String} valueLiteral Function value literal to be used on active zones table/labels/other places that require user-native presentation
 * @returns {Guideline[]} Array of guidelines corresponding to given details
 */
function getDynamicGuidelines(typeIndex, functionIndex, functionValue, valueLiteral) {
  // plain-positive and plain-negative zones have no guidelines (by convention)
  if (typeIndex == 0 || typeIndex == 1) {
    return [];
  }
  if (!valueLiteral) {
    // all other zones have literals. this is not OK
    console.warn("Asked for guidelines of literal-using zone without literal: ", valueLiteral); // warn
    return []; // exit
  }
  switch (functionIndex) {
    case 0:
      // guidelines for sine
      if (Math.abs(functionValue) <= 1) {
        // sine has solutions
        return [
          createDynamicGuideline(
            {
              // if functionValue is less than 0, asin will return angle less than 0, vut guideline angle are by convention from 0 to 2pi, so I need to add 2pi in this case
              angle: functionValue > 0 ? Math.asin(functionValue) : Math.asin(functionValue) + PIx2,
              litRad: functionValue > 0 ? `asin(${valueLiteral})` : `asin(${valueLiteral})+2π`,
              litDeg: functionValue > 0 ? (Math.asin(functionValue) / PI) * 180 : (Math.asin(functionValue) / PI) * 180 + 360,
              sin: valueLiteral,
              cos: `√(1 - (${valueLiteral})^2)`,
              cos_tex: `\\sqrt{1 - (${valueLiteral})^2}`,
              tan: `${valueLiteral}/√(1 - (${valueLiteral})^2)`,
              tan_tex: `\\dfrac{${valueLiteral}}{\\sqrt{1 - (${valueLiteral})^2}}`,
              cot: `√(1 - (${valueLiteral})^2)/${valueLiteral}`,
              cot_tex: `\\dfrac{\\sqrt{1 - (${valueLiteral})^2}}{${valueLiteral}}`,
            },
            typeIndex,
            functionIndex
          ),
          createDynamicGuideline(
            {
              angle: PI - Math.asin(functionValue),
              litRad: `π-asin(${valueLiteral})`,
              litDeg: 180 - (Math.asin(functionValue) / PI) * 180,
              sin: valueLiteral,
              cos: `-√(1 - (${valueLiteral})^2)`,
              cos_tex: `-\\sqrt{1 - (${valueLiteral})^2}`,
              tan: `-${valueLiteral}/√(1 - (${valueLiteral})^2)`,
              tan_tex: `-\\dfrac{${valueLiteral}}{\\sqrt{1 - (${valueLiteral})^2}}`,
              cot: `-√(1 - (${valueLiteral})^2)/${valueLiteral}`,
              cot_tex: `-\\dfrac{\\sqrt{1 - (${valueLiteral})^2}}{${valueLiteral}}`,
            },
            typeIndex,
            functionIndex
          ),
        ];
      } else {
        // sine does not have solutions - return no guidelines
        return [];
      }
    case 1:
      // guidelines for cosine
      if (Math.abs(functionValue) <= 1) {
        // cos has solutions
        return [
          createDynamicGuideline(
            {
              angle: Math.acos(functionValue),
              litRad: `acos(${valueLiteral})`,
              litDeg: (Math.acos(functionValue) / PI) * 180,
              sin: `√(1 - (${valueLiteral})^2)`,
              sin_tex: `\\sqrt{1 - (${valueLiteral})^2}`,
              cos: valueLiteral,
              tan: `√(1 - (${valueLiteral})^2)/${valueLiteral}`,
              tan_tex: `\\dfrac{\\sqrt{1 - (${valueLiteral})^2}}{${valueLiteral}}`,
              cot: `${valueLiteral}/√(1 - (${valueLiteral})^2)`,
              cot_tex: `\\dfrac{${valueLiteral}}{\\sqrt{1 - (${valueLiteral})^2}}`,
            },
            typeIndex,
            functionIndex
          ),
          createDynamicGuideline(
            {
              angle: PIx2 - Math.acos(functionValue),
              litRad: `2π-acos(${valueLiteral})`,
              litDeg: (2 - Math.acos(functionValue) / PI) * 180,
              sin: `-√(1 - (${valueLiteral})^2)`,
              sin_tex: `-\\sqrt{1 - (${valueLiteral})^2}`,
              cos: valueLiteral,
              tan: `-√(1 - (${valueLiteral})^2)/${valueLiteral}`,
              tan_tex: `-\\dfrac{\\sqrt{1 - (${valueLiteral})^2}}{${valueLiteral}}`,
              cot: `-${valueLiteral}/√(1 - (${valueLiteral})^2)`,
              cot_tex: `-\\dfrac{${valueLiteral}}{\\sqrt{1 - (${valueLiteral})^2}}`,
            },
            typeIndex,
            functionIndex
          ),
        ];
      } else {
        // cosine does not have solutions - return no guidelines
        return [];
      }
    case 2:
      // guidelines for tangent
      // this one always has solutions
      return [
        createDynamicGuideline(
          {
            angle: functionValue > 0 ? Math.atan(functionValue) : Math.atan(functionValue) + PIx2,
            litRad: functionValue > 0 ? `atan(${valueLiteral})` : `atan(${valueLiteral})+2π`,
            litDeg: functionValue > 0 ? (Math.atan(functionValue) / PI) * 180 : (Math.atan(functionValue) / PI) * 180 + 360,
            sin: `${functionValue < 0 ? "-" : ""}1/√(1 + 1/(${valueLiteral})^2)`,
            sin_tex: `${functionValue < 0 ? "-" : ""}\\dfrac{1}{\\sqrt{1 + \\dfrac{1}{(${valueLiteral})^2}}}`,
            cos: `1/√(1 + (${valueLiteral})^2)`,
            cos_tex: `\\dfrac{1}{\\sqrt{1 + (${valueLiteral})^2}}`,
            tan: valueLiteral,
            cot: `1/(${valueLiteral})`,
            cot_tex: `\\dfrac{1}{${valueLiteral}}`,
          },
          typeIndex,
          functionIndex
        ),
        createDynamicGuideline(
          {
            angle: Math.atan(functionValue) + PI,
            litRad: `atan(${valueLiteral})+π`,
            litDeg: (Math.atan(functionValue) / PI) * 180 + 180,
            sin: `${functionValue > 0 ? "-" : ""}1/√(1 + 1/(${valueLiteral})^2)`,
            sin_tex: `${functionValue > 0 ? "-" : ""}\\dfrac{1}{\\sqrt{1 + \\dfrac{1}{(${valueLiteral})^2}}}`,
            cos: `-1/√(1 + (${valueLiteral})^2)`,
            cos_tex: `-\\dfrac{1}{\\sqrt{1 + (${valueLiteral})^2}}`,
            tan: valueLiteral,
            cot: `1/(${valueLiteral})`,
            cot_tex: `\\dfrac{1}{${valueLiteral}}`,
          },
          typeIndex,
          functionIndex
        ),
        // by convetion, I only return non-cardinal guidelines, as those are always present and thus, trivial
      ];
    case 3:
      // guidelines for cotangent
      // this one always has solutions
      return [
        createDynamicGuideline(
          {
            angle: acot(functionValue),
            litRad: `acot(${valueLiteral})`,
            litDeg: (acot(functionValue) / PI) * 180,
            sin: `1/√(1 + (${valueLiteral})^2)`,
            sin_tex: `\\dfrac{1}{\\sqrt{1 + (${valueLiteral})^2}}`,
            cos: `${functionValue < 0 ? "-" : ""}1/√(1 + 1/(${valueLiteral})^2)`,
            cos_tex: `${functionValue < 0 ? "-" : ""}\\dfrac{1}{\\sqrt{1 + \\dfrac{1}{(${valueLiteral})^2}}}`,
            tan: `1/(${valueLiteral})`,
            tan_tex: `\\dfrac{1}{${valueLiteral}}`,
            cot: valueLiteral,
          },
          typeIndex,
          functionIndex
        ),
        createDynamicGuideline(
          {
            angle: acot(functionValue) + PI,
            litRad: `acot(${valueLiteral})+π`,
            litDeg: (acot(functionValue) / PI) * 180 + 180,
            sin: `-1/√(1 + (${valueLiteral})^2)`,
            sin_tex: `-\\dfrac{1}{\\sqrt{1 + (${valueLiteral})^2}}`,
            cos: `${functionValue > 0 ? "-" : ""}1/√(1 + 1/(${valueLiteral})^2)`,
            cos_tex: `${functionValue > 0 ? "-" : ""}\\dfrac{1}{\\sqrt{1 + \\dfrac{1}{(${valueLiteral})^2}}}`,
            tan: `1/(${valueLiteral})`,
            tan_tex: `\\dfrac{1}{${valueLiteral}}`,
            cot: valueLiteral,
          },
          typeIndex,
          functionIndex
        ),
        // by convetion, I only return non-cardinal guidelines, as those are always present and thus, trivial
      ];
    default:
      // in case functionIndex is not in mentioned set, there are no guidelines for that
      return [];
  }
}

/**
 * Transforms expression to be used in formulae query
 * @param {String} input
 * @returns {String}
 */
function transformForFormulaeQuery(input) {
  // @ts-ignore
  return input.replaceAll(" ", "").replaceAll(",", ".").replaceAll("²", "^2").replaceAll("π", ".pi");
}

/**
 * Transforms expression to be more readable in tex
 * @param {String} input
 * @returns {String}
 */
function transformForTex(input) {
  // @ts-ignore
  return input.replaceAll(",", ".").replaceAll("²", "^2").replaceAll("π", "\\pi").replaceAll("*", "\\cdot ");
}

/**
 * Transforms expression to be more suited for WolframAlpha query
 * @param {String} input
 * @returns {String}
 */
function transformForWolfram(input) {
  // @ts-ignore
  return input.replaceAll(",", ".").replaceAll(".pi", "π").replaceAll("+", "%2b"); // last transform is purely to avoid http args misunderstanding
}

/**
 * Opens new tab and queries WolframAlpha
 * @param {?String} query WolframAlpha query (the one you would usualy input to their site). If falsy or empty string is given, no query will be made
 */
function queryWolfram(query = null) {
  if (query && query?.length) window.open(`${WOLFRAM_QUERY}${transformForWolfram(query)}`, "_blank");
}

/**
 * This class is designed to find and attach relevant events to controls of a graph under specified container
 * Note, that if you pass {@link document} var as a container, it will function perfectly fine, but will only find one occurence of each control element. See {@link document.querySelector} for more details
 * So if you need multiple control sets, consider passing corresponding container for each one
 *
 * You can ommit any controls you have no interest in
 * You may change page layout and visuals (rearrange and regroup elements) - just make sure class names are the same, as this is how code finds them
 *
 * To see an example of usage, visit https://dzuchun.github.io/interactive-trigonometry/interactive-trigonometry.html
 */
export class GraphController {
  /** @type {Element} An element all the controls are in */
  #container;

  /** @type {Guideline[]} Angle guidelines array (used only to not search for them each time) */
  #angleGuideLines;
  /** @type {Guideline[]} Functions guidelines array (used only to not search for them each time) */
  #functionsGuideLines;
  /** @type {?Guideline} A guideline graph is currently at. Null, if pointer is not snapped now */
  #guideline;

  /** @type {{[locName : String] : String}} Holds current localization strings */
  lang;

  /** @type {?HTMLInputElement} Controls if pointer is enabled */
  #pointerToggle;
  /** @type {?HTMLInputElement} Controls if pointer label is visible */
  #pointerLabelToggle;
  /** @type {?HTMLInputElement} Controls if default guidelines are active */
  #defaultGuidelinesToggle;
  /** @type {?HTMLInputElement} Controls if default guidelines are visible */
  #angleLabelsToggle;
  /** @type {?HTMLInputElement} Controls if angle label writes angle on degree or radian */
  #angleDegradToggle;
  /** @type {?HTMLHeadingElement} Displays current angle in degree */
  #angleCurrentDegree;
  /** @type {?HTMLHeadingElement} Displays current angle in radian */
  #angleCurrentRadian;
  /** @type {Number} graph's current angle (TODO probably should remove that) */
  #selectedAngle = 0;
  /** @type {?HTMLInputElement} Controls if specified angle is in radian or degreee */
  #angleWantRadiansToggle;
  /** @type {?HTMLHeadingElement} Shows how input angle is interpreted */
  #angleWantInterpret;
  /** @type {?HTMLInputElement} Holds user input for angle */
  #angleWantInput;
  /** @type {?Number} Holds evaluated user input */
  #angleWantEval;
  /** @type {?String} Holds unevaluated user input in fancy form */
  #angleWantLiteral;
  /** @type {?HTMLInputElement} Controls if pi should not be auto-set if user toggles deg-rad toggle */
  #angleWantPiLock;
  /** @type {?HTMLInputElement} Controls whether inputted angle must be multiplied by pi */
  #angleWantPiToggle;
  /** @type {?HTMLButtonElement} Sets angle to a specified value */
  #angleSetButton;
  /** @type {?HTMLButtonElement} Add specified value to the angle */
  #angleAddButton;
  /** @type {?HTMLButtonElement} Subtracts specified value from the angle */
  #angleSubButton;
  /** @type {?HTMLButtonElement} Sweeps an arc to the specified angle */
  #angleSweepButton;
  /** @type {?HTMLInputElement} Controls if pointer's x-mirror is displayed */
  #mirrorXToggle;
  /** @type {?HTMLInputElement} Controls if pointer's y-mirror is displayed */
  #mirrorYToggle;
  /** @type {?HTMLInputElement} Controls if pointer overwind is allowed */
  #overwindToggle;
  /** @type {?HTMLButtonElement} Adds {@link PIx2} to the current angle */
  #angleAdd2PiButton;
  /** @type {?HTMLButtonElement} Subtracts {@link PIx2} from the current angle */
  #angleSub2PiButton;
  /** @type {?HTMLButtonElement} Adds {@link PI} to the current angle */
  #angleAddPiButton;
  /** @type {?HTMLButtonElement} Subtracts {@link PI} from the current angle */
  #angleSubPiButton;

  // TODO probably should merge those below into an array or th
  /** @type {?HTMLInputElement} Shows that sine value is selected */
  #functionsSelectorSin;
  /** @type {?HTMLInputElement} Shows that cosine value is selected */
  #functionsSelectorCos;
  /** @type {?HTMLInputElement} Shows that tangent value is selected */
  #functionsSelectorTan;
  /** @type {?HTMLInputElement} Shows that cotangent value is selected */
  #functionsSelectorCot;
  /** @type {Number} */
  #selectedFunctionIndex = 0;
  /** @type {?HTMLHeadingElement} Displays selected function's implicit representation in radian */
  #functionsCurrentRad;
  /** @type {?HTMLHeadingElement} Displays selected function's implicit representation in degree */
  #functionsCurrentDeg;
  /** @type {?HTMLHeadingElement} Displays selected function's value as number */
  #functionsCurrentVal;
  /** @type {?HTMLHeadingElement} Displays selected function's value as expression, if aplicable */
  #functionsCurrentVal2;
  /** @type {?HTMLButtonElement} Opens new tab querying WolframAlpha for current function's implicit representation */
  #functionsWolframButton;
  /** @type {?HTMLInputElement} Controls if sine line representation is shown */
  #functionsShowSin;
  /** @type {?HTMLInputElement} Controls if cosine line representation is shown */
  #functionsShowCos;
  /** @type {?HTMLInputElement} Controls if tangent line representation is shown */
  #functionsShowTan;
  /** @type {?HTMLInputElement} Controls if function's line representations have labels near them displaying function values */
  #functionsShowLabels;
  /** @type {?HTMLInputElement} Controls if function guidelines are active */
  #functionsShowGuidelines;
  /** @type {?HTMLInputElement} Controls if function line's labels should always display numbers, even if exact expresion is available */
  #functionsSuppressExpressions;
  /** @type {?HTMLTableElement} Represents active zones as a visual table */
  #activeZonesTable;
  /** @type {?HTMLTableCellElement[][]} Holds active zones table cell, so that we don't query for them each time */
  #activeZonesCells;
  // TODO probably should merge those below into an array or th
  /** @type {?HTMLInputElement} Shows that sine zone will be added */
  #zoneSelectorSin;
  /** @type {?HTMLInputElement} Shows that cosine zone will be added */
  #zoneSelectorCos;
  /** @type {?HTMLInputElement} Shows that tangent zone will be added */
  #zoneSelectorTan;
  /** @type {?HTMLInputElement} Shows that cotangent zone will be added */
  #zoneSelectorCot;
  /** @type {!Number} */
  #selectedFunctionZone = 0;
  /** @type {?HTMLButtonElement} Adds selected function's positive zone */
  #addPositiveZoneButton;
  /** @type {?HTMLButtonElement} Adds selected function's negative zone */
  #addNegativeZoneButton;
  /** @type {?HTMLButtonElement} Adds selected function's equals zone with value specified in {@link #zoneEqualsInput} */
  #addEqualsZoneButton;
  /** @type {?HTMLInputElement} Equals zone user input */
  #zoneEqualsInput;
  /** @type {?HTMLButtonElement} Adds selected function's more zone with value specified in {@link #zoneMoreInput} */
  #addMoreZoneButton;
  /** @type {?HTMLInputElement} More zone user input */
  #zoneMoreInput;
  /** @type {?HTMLButtonElement} Adds selected function's less zone with value specified in {@link #zoneLessInput} */
  #addLessZoneButton;
  /** @type {?HTMLInputElement} Less zone user input */
  #zoneLessInput;

  /**
   * Formulae object
   * @typedef {Object} Formula
   * @property {Number} id Unique id
   * @property {Number[]} parents List of parent formula ids
   * @property {String[]} features List of strings this formula can be found by
   * @property {String} tex String representing formula for tex
   * @property {String} query String formula is presented WolframAlpha
   * @property {?String} wikiref Href to formula's derivation page
   */
  /** @type {Formula[]} List of formula objects currently available to the program */
  #formulaeList = [];
  /** @type {?HTMLInputElement} User input for formula search */
  #formulaeInput;
  /** @type {?HTMLButtonElement} Opens new tab querying WolframAlpha for user's formula input */
  #formulaeWolframButton;
  /** @type {?HTMLButtonElement} Finds formulae that either have user input as feature or selected formula as a parent */
  #formulaeFeaturedButton;
  /** @type {?HTMLButtonElement} Finds formulae that selected formulae has as a parent */
  #formulaeParentsButton;
  /** @type {?Formula} Holds currently selected formula object */
  #selectedFormula;
  /** @type {?Formula} Holds current queried formula object */
  #shownFormula;
  /** @type {?boolean} Holds if currently queried formula is queried for parents */ // TODO probably should change this to a type string or th
  #formulaeShownParents;
  /** @type {?HTMLHeadingElement} Displays current formula query name */
  #formulaeResultName;
  /** @type {Number} Internal use only. Used to prevent id collision accross different controller objects */
  static #formulaeResultId = 0;
  /** @type {?HTMLDivElement} Displays current formula query result */
  #formulaeResult;

  /** @type {?HTMLButtonElement} Copies state string to a clipboard or dumps it into a console, if clipboard is unavailable */
  #clipboardStateButton;
  /** @type {?HTMLButtonElement} Copies url with state string to a clipboard or dumps it into a console, if clipboard is unavailable */
  #clipboardUrlButton;
  /** @type {?HTMLHeadingElement} Displays generated state string */
  #shareGenerateField;
  /** @type {?HTMLInputElement} User input for state string */
  #shareLoadInput;
  /** @type {?HTMLButtonElement} Loads user-inputted state string from {@link #shareLoadInput} */
  #shareLoadButton;

  /**
   * Returns id used for input radiobutton of the specified formula in formula result list
   * @param {Formula} formula
   * @returns {String} Id to use
   */
  static getFormulaRadioId(formula) {
    return `formulae_selected_${GraphController.#formulaeResultId}_${formula.id}`;
  }

  /**
   * @param {Element} container DOM element to search controls in
   * @param {{[locName : String] : String}} langObject object containing localization strings
   */
  constructor(container, langObject) {
    // assign passed anguments
    this.#container = container;
    this.lang = langObject;
    this.#queryControls(); // find all exsiting controls
    this.#generateActiveZonesTable(); // generate active zones table (if one exists)
    this.#patchWolframButtons(); // tune wolfram buttons (if there are any)
    this.#bindEvents(); // bind all relevant eventlisteners (applicable ones)

    this.#updateCurrentFunction();
  }

  #queryControls() {
    // thanks JS for not supporting this[#private_field_name]. enjoy copypaste, I guess...?
    this.#pointerToggle = this.#container.querySelector(".angle-pointer-toggle");
    this.#defaultGuidelinesToggle = this.#container.querySelector(".angle-guidelines-toggle");
    this.#angleLabelsToggle = this.#container.querySelector(".angle-labels-toggle");
    this.#pointerLabelToggle = this.#container.querySelector(".angle-pointer-label-toggle");
    this.#angleDegradToggle = this.#container.querySelector(".angle-degrad-toggle");
    this.#angleCurrentDegree = this.#container.querySelector(".current-angle-degree");
    this.#angleCurrentRadian = this.#container.querySelector(".current-angle-radian");
    this.#angleWantRadiansToggle = this.#container.querySelector(".angle-iwant-degrad");
    this.#angleWantInterpret = this.#container.querySelector(".angle-interpreted-as");
    this.#angleWantInput = this.#container.querySelector(".angle-iwant-input");
    this.#angleWantPiLock = this.#container.querySelector(".angle-iwant-pi-lock");
    this.#angleWantPiToggle = this.#container.querySelector(".angle-iwant-pi");
    this.#angleSetButton = this.#container.querySelector(".angle-setangle-button");
    this.#angleAddButton = this.#container.querySelector(".angle-addangle-button");
    this.#angleSubButton = this.#container.querySelector(".angle-subangle-button");
    this.#angleSweepButton = this.#container.querySelector(".angle-sweepangle-button");
    this.#overwindToggle = this.#container.querySelector(".angle-overwind-toggle");
    this.#mirrorXToggle = this.#container.querySelector(".angle-mirror-x");
    this.#mirrorYToggle = this.#container.querySelector(".angle-mirror-y");
    this.#angleAdd2PiButton = this.#container.querySelector(".angle-add-2pi-button");
    this.#angleSub2PiButton = this.#container.querySelector(".angle-sub-2pi-button");
    this.#angleAddPiButton = this.#container.querySelector(".angle-add-pi-button");
    this.#angleSubPiButton = this.#container.querySelector(".angle-sub-pi-button");

    this.#functionsSelectorSin = this.#container.querySelector(".functions-selector-sin");
    this.#functionsSelectorCos = this.#container.querySelector(".functions-selector-cos");
    this.#functionsSelectorTan = this.#container.querySelector(".functions-selector-tan");
    this.#functionsSelectorCot = this.#container.querySelector(".functions-selector-cot");
    this.#functionsCurrentRad = this.#container.querySelector(".functions-current-rad");
    this.#functionsCurrentDeg = this.#container.querySelector(".functions-current-deg");
    this.#functionsCurrentVal = this.#container.querySelector(".functions-current-val");
    this.#functionsCurrentVal2 = this.#container.querySelector(".functions-current-val2");
    this.#functionsWolframButton = this.#container.querySelector(".functions-wolfram-button");
    this.#functionsShowSin = this.#container.querySelector(".functions-show-sin");
    this.#functionsShowCos = this.#container.querySelector(".functions-show-cos");
    this.#functionsShowTan = this.#container.querySelector(".functions-show-tan");
    this.#functionsShowLabels = this.#container.querySelector(".functions-show-labels");
    this.#functionsShowGuidelines = this.#container.querySelector(".functions-show-guidelines");
    this.#functionsSuppressExpressions = this.#container.querySelector(".functions-suppress-expressions");
    this.#activeZonesTable = this.#container.querySelector(".active-zones-table");
    this.#zoneSelectorSin = this.#container.querySelector(".zone-selector-sin");
    this.#zoneSelectorCos = this.#container.querySelector(".zone-selector-cos");
    this.#zoneSelectorTan = this.#container.querySelector(".zone-selector-tan");
    this.#zoneSelectorCot = this.#container.querySelector(".zone-selector-cot");
    this.#addPositiveZoneButton = this.#container.querySelector(".zones-positive");
    this.#addNegativeZoneButton = this.#container.querySelector(".zones-negative");
    this.#addEqualsZoneButton = this.#container.querySelector(".zones-equals-button");
    this.#zoneEqualsInput = this.#container.querySelector(".zones-equals-input");
    this.#addMoreZoneButton = this.#container.querySelector(".zones-more-button");
    this.#zoneMoreInput = this.#container.querySelector(".zones-more-input");
    this.#addLessZoneButton = this.#container.querySelector(".zones-less-button");
    this.#zoneLessInput = this.#container.querySelector(".zones-less-input");

    this.#formulaeInput = this.#container.querySelector(".formulae-input");
    this.#formulaeWolframButton = this.#container.querySelector(".formulae-wolfram-button");
    this.#formulaeFeaturedButton = this.#container.querySelector(".formulae-featured-button");
    this.#formulaeParentsButton = this.#container.querySelector(".formulae-parents-button");
    this.#formulaeResultName = this.#container.querySelector(".formulae-result-name");
    this.#formulaeResult = this.#container.querySelector(".formulae-result");

    this.#clipboardStateButton = this.#container.querySelector(".clipboard-state-button");
    this.#clipboardUrlButton = this.#container.querySelector(".clipboard-url-button");
    this.#shareGenerateField = this.#container.querySelector(".share-generate-field");
    this.#shareLoadInput = this.#container.querySelector(".share-load-input");
    this.#shareLoadButton = this.#container.querySelector(".share-load-button");
  }

  /**
   * Generates active zones table. That includes one row for headers and one column for function names
   */
  #generateActiveZonesTable() {
    if (!(this.#activeZonesTable instanceof HTMLTableElement)) {
      // table not present - nothing to do
      return;
    }
    // table present
    // generating table header
    let headerLine = document.createElement("tr");
    for (let headerName of ["", ...FUNCTION_NAMES]) {
      let header = document.createElement("th");
      header.innerText = headerName;
      headerLine.appendChild(header);
    }
    this.#activeZonesTable.appendChild(headerLine);
    // generating actual table cells
    this.#activeZonesCells = [];
    for (let rowName of ZONE_TYPE_NAMES) {
      let row = document.createElement("tr");
      let typeCell = document.createElement("td");
      typeCell.innerText = rowName;
      typeCell.classList.add(`zones-table-${rowName.toLowerCase()}`);
      row.appendChild(typeCell);
      let rowArray = [];
      for (let cellName of FUNCTION_NAMES) {
        let cell = document.createElement("td");
        cell.style.backgroundColor = "transparent";
        rowArray.push(cell);
        row.appendChild(cell);
      }
      this.#activeZonesTable.appendChild(row);
      this.#activeZonesCells.push(rowArray);
    }
  }

  /**
   * Appends existing WolframAlpha buttons with it's logo
   */
  #patchWolframButtons() {
    /** @type {HTMLButtonElement[]} Buttons to be patched */
    let buttonsToPatch = [];
    // push each of the buttons in list only if they exist
    if (this.#functionsWolframButton) {
      buttonsToPatch.push(this.#functionsWolframButton);
    }
    if (this.#formulaeWolframButton) {
      buttonsToPatch.push(this.#formulaeWolframButton);
    }
    buttonsToPatch.forEach((button) => {
      let image = document.createElement("img"); // image elements of the button
      image.setAttribute("src", WOLFRAM_BUTTON_IMAGE); // set image source
      image.setAttribute("height", "100%"); // set image height, so that it will cover all the button
      image.setAttribute("alt", this.lang.no_wolfram ?? "wolfram unavailable"); // set image alt to tell that WolframAlpha is unavailable, as if this image did fail to load, WolframAlpha is likely down, changed API, or th
      button.appendChild(image); // append image to the button
    });
  }

  /**
   * Fires custom event on this controller.
   * @param {String} eventName Event name (excluding namespace)
   * @param {Object} eventDetails Details object to pass with event
   * @param {boolean} cancelable If event should return true, after processing all listeners and not provoking {@link Event.preventDefault}
   */
  #fireEvent(eventName, eventDetails = {}, cancelable = false) {
    return this.#container.dispatchEvent(new CustomEvent(`itn:ctrl:${eventName}`, { detail: eventDetails, cancelable: cancelable }));
  }

  /**
   * Adds listener to this controller's events
   * @param {String} eventName Event name (excluding namespace)
   * @param {(event : CustomEvent) => any} handler Event handler
   */
  addEventListenerITN(eventName, handler) {
    // @ts-expect-error [I'm sure that all events fired as result of this listener addition, will be CustomEvent(s)]
    this.#container.addEventListener(`itn:ctrl:${eventName}`, handler);
  }

  /**
   * Binds all the events for controls to function properly
   */
  #bindEvents() {
    this.#pointerToggle?.addEventListener("change", () => this.#updatePointer());
    this.#pointerLabelToggle?.addEventListener("change", () => this.#updatePointerLabel());
    this.#angleLabelsToggle?.addEventListener("change", () => {
      this.#setAngleLabelsVisible(); // fire event for graph to update angle labels
      this.updateGuidelineLabelsContent();
    });
    this.#defaultGuidelinesToggle?.addEventListener("change", () => {
      this.#setDefaultGuidelinesActive(); // fire event for graph to update visuals
      this.#triggerAngleSnap(); // trigger pointer snap, pointer may be on/off the guideline now
    });
    this.#angleDegradToggle?.addEventListener("change", () => {
      this.updateGuidelineLabelsContent(); // update angle labels
      this.updatePointerLabelContent(); // update pointer label
    });
    this.#angleWantRadiansToggle?.addEventListener("change", () => {
      if (this.#angleWantPiToggle) {
        // pi multiplier toggle exists
        if (!this.#angleWantPiLock || !this.#angleWantPiLock.checked) {
          // pi multiplier lock does not exist or is not active, so
          // pi multiplier toggle is not locked
          this.#angleWantPiToggle.checked = this.#angleWantRadiansToggle?.checked ?? false;
        }
      }
      this.#updateWantInterpret(); // update angle interpretation
    });
    this.#angleWantInput?.addEventListener("keyup", () => this.#updateWantInterpret()); // Update interpretation field
    this.#angleWantInput?.addEventListener("keypress", (event) => {
      if (event.key == "Enter") {
        // TODO Might be a bad smell or th, but these are just to simplify usage
        // If enter key is pressed, emulate click on #angleSetButton
        this.#angleSetButton?.dispatchEvent(new MouseEvent("click"));
      }
    });
    this.#angleWantPiToggle?.addEventListener("change", () => this.#updateWantInterpret()); // Update interpretation field
    this.#angleSetButton?.addEventListener("click", () => {
      this.#fireEvent("angle-set", { literalAngle: this.#angleWantLiteral, evalAngle: this.#angleWantEval }, true); // ask graph to set pointer to a location
      this.updatePointerLabelContent(); // update pointer label content
    });
    this.#angleAddButton?.addEventListener("click", () =>
      this.#fireEvent("angle-add", { literalAngle: this.#angleWantLiteral, evalAngle: this.#angleWantEval ?? 0 })
    );
    this.#angleSubButton?.addEventListener("click", () =>
      this.#fireEvent("angle-add", { literalAngle: `-(${this.#angleWantLiteral})`, evalAngle: -(this.#angleWantEval ?? 0) })
    );
    this.#angleSweepButton?.addEventListener("click", () => {
      if (!this.#fireEvent("angle-sweep", { literalAngle: this.#angleWantLiteral, evalAngle: this.#angleWantEval }, true)) {
        // if sweep event was cancelled - sweep succesfully began/in progress
        this.#angleSweepButton?.classList.add("sweep-progress");
      } else {
        // if sweep event was not cancelled - sweep has failed/removed
        this.#angleSweepButton?.classList.remove("sweep-progress");
      }
    });
    this.#mirrorXToggle?.addEventListener("change", () => this.#fireEvent("mirror-x-toggle", { checked: this.#mirrorXToggle?.checked }));
    this.#mirrorYToggle?.addEventListener("change", () => this.#fireEvent("mirror-y-toggle", { checked: this.#mirrorYToggle?.checked }));
    this.#overwindToggle?.addEventListener("change", () => this.#triggerAngleSnap());
    this.#angleAdd2PiButton?.addEventListener("click", () => this.#fireEvent("angle-add", { literalAngle: "2π", evalAngle: PIx2 }));
    this.#angleSub2PiButton?.addEventListener("click", () => this.#fireEvent("angle-add", { literalAngle: "-2π", evalAngle: -PIx2 }));
    this.#angleAddPiButton?.addEventListener("click", () => this.#fireEvent("angle-add", { literalAngle: "π", evalAngle: PI }));
    this.#angleSubPiButton?.addEventListener("click", () => this.#fireEvent("angle-add", { literalAngle: "-π", evalAngle: -PI }));
    this.#functionsWolframButton?.addEventListener("click", () =>
      queryWolfram(this.#functionsCurrentRad?.innerHTML || this.#functionsCurrentDeg?.innerHTML)
    );
    this.#functionsShowSin?.addEventListener("change", () => {
      this.#fireEvent("functions-show-funcline", { show: this.#functionsShowSin?.checked, name: "sin" });
      this.#updateFunclabels();
    });
    this.#functionsShowCos?.addEventListener("change", () => {
      this.#fireEvent("functions-show-funcline", { show: this.#functionsShowCos?.checked, name: "cos" });
      this.#updateFunclabels();
    });
    this.#functionsShowTan?.addEventListener("change", () => {
      this.#fireEvent("functions-show-funcline", { show: this.#functionsShowTan?.checked, name: "tan" });
      this.#updateFunclabels();
    });
    this.#functionsShowLabels?.addEventListener("change", () => {
      this.#fireEvent("functions-show-labels", { show: this.#functionsShowLabels?.checked });
      this.#updateFunclabels();
    });
    this.#functionsSuppressExpressions?.addEventListener("change", () => {
      this.#updateFunclabels();
      this.#updatePointerLabel();
    });
    this.#functionsShowGuidelines?.addEventListener("change", () => {
      this.#setFunctionGuidelinesActive(); // update guidelines activenes
      this.#triggerAngleSnap(); // trigger pointer snap, pointer may be on/off the guideline now
    });
    [this.#functionsSelectorSin, this.#functionsSelectorCos, this.#functionsSelectorTan, this.#functionsSelectorCot].forEach((selector) => {
      if (selector instanceof HTMLInputElement) {
        selector.addEventListener("change", () => {
          // on change, update selected function
          this.#selectedFunctionIndex = FUNCTION_INDEXES[selector.value]; // selectors contain function values in their "value" attribute - that's how they are distinguished
          this.#updateCurrentFunction(); // update displayed function value
        });
      }
    });
    [this.#zoneSelectorSin, this.#zoneSelectorCos, this.#zoneSelectorTan, this.#zoneSelectorCot].forEach((selector) => {
      if (selector instanceof HTMLInputElement) {
        selector.addEventListener("change", () => {
          // on change, update selected function
          this.#selectedFunctionZone = FUNCTION_NAMES.indexOf(selector.value);
          this.#updateZoneButtonText(); // zone buttons have their text changed according to zone function selected
          this.#updateZoneInputData(); // zone inputs have their values changed according to zones they represent (if any), and outline color to a color of correponding zone (if any)
        });
      }
    });
    let zoneButtons = [
      this.#addPositiveZoneButton,
      this.#addNegativeZoneButton,
      this.#addEqualsZoneButton,
      this.#addMoreZoneButton,
      this.#addLessZoneButton,
    ]; // zone-adding buttons
    let zoneInputs = [null, null, this.#zoneEqualsInput, this.#zoneMoreInput, this.#zoneLessInput]; // zone input fields (positive and negative types have no input, so these elements are null)
    // set zone buttons events
    zoneButtons.forEach((button, index) => {
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }
      button.addEventListener("click", () => {
        this.#addZone(index, this.#selectedFunctionZone, zoneInputs[index]?.value ?? null);
        this.#fireEvent("zones-highlight", { typeIndex: index, functionIndex: this.#selectedFunctionZone }); // highlight created zone immideately
      });
      button.addEventListener("mouseenter", () =>
        this.#fireEvent("zones-highlight", { typeIndex: index, functionIndex: this.#selectedFunctionZone })
      );
      button.addEventListener("mouseleave", () =>
        this.#fireEvent("zones-dehighlight", { typeIndex: index, functionIndex: this.#selectedFunctionZone })
      );
    });
    // set zone input field events
    zoneInputs.forEach((input, index) => {
      if (!(input instanceof HTMLInputElement)) {
        return;
      }
      input.addEventListener("keypress", (event) => {
        if (event.key == "Enter") {
          this.#addZone(index, this.#selectedFunctionZone, input.value);
          this.#fireEvent("zones-highlight", { typeIndex: index, functionIndex: this.#selectedFunctionZone }); // highlight created zone immideately
        }
      });
      input.addEventListener("focusin", () =>
        this.#fireEvent("zones-highlight", { typeIndex: index, functionIndex: this.#selectedFunctionZone })
      );
      input.addEventListener("focusout", () =>
        this.#fireEvent("zones-dehighlight", { typeIndex: index, functionIndex: this.#selectedFunctionZone })
      );
    });
    if (this.#activeZonesCells) {
      // if there is an active zones table, bind the events to it's cells
      for (let i = 0; i < ZONE_TYPE_NAMES.length; i++) {
        for (let j = 0; j < FUNCTION_NAMES.length; j++) {
          // highlight on hover
          this.#activeZonesCells[i][j].addEventListener("mouseenter", () =>
            this.#fireEvent("zones-highlight", { typeIndex: i, functionIndex: j })
          );
          // dehighlight or dehover
          this.#activeZonesCells[i][j].addEventListener("mouseleave", () =>
            this.#fireEvent("zones-dehighlight", { typeIndex: i, functionIndex: j })
          );
          // remove on click
          this.#activeZonesCells[i][j].addEventListener("click", () => this.#removeZone(i, j));
        }
      }
    }
    this.#formulaeInput?.addEventListener("focus", () => {
      this.#selectedFormula = null; // deselect the current formula
      let radio = this.#container.querySelector('.formulae-result input[type="radio"]:checked'); // query for chencked radio button
      if (radio instanceof HTMLInputElement) {
        radio.checked = false; // deselect radio button, if there is one
      }
    });
    this.#formulaeInput?.addEventListener("keypress", (event) => {
      if (event.key == "Enter") {
        // TODO Might be a bad smell or th, but these are just to simplify usage
        // If enter key is pressed, emulate click on #formulaeFeaturedButton
        this.#formulaeFeaturedButton?.dispatchEvent(new MouseEvent("click"));
      }
    });
    this.#formulaeFeaturedButton?.addEventListener("click", () => this.findFormulaFeatured());
    this.#formulaeParentsButton?.addEventListener("click", () => this.findFormulaParents());
    this.#formulaeWolframButton?.addEventListener("click", () => {
      // Query for selected formula, or if there's none - for user input
      queryWolfram(this.#selectedFormula?.query || this.#formulaeInput?.value);
    });

    this.#clipboardStateButton?.addEventListener("click", () => this.#clipboardState(false)); // clipboard state alone
    this.#clipboardUrlButton?.addEventListener("click", () => this.#clipboardState(true)); // clipboard state with a full URL attached to it
    if (this.#shareLoadButton && this.#shareLoadInput) {
      // these two have no purpose apart form each other
      this.#shareLoadButton.addEventListener("click", () => {
        let newState = InteractiveTrigonometryState.decode(this.#shareLoadInput?.value ?? ""); // decode user-inputted state
        console.info(newState); // log it
        this.setState(newState); // use it for this controller
        this.#fireEvent("update-graph-state", { state: newState }); // send it to graph, so it could update too
      });
    }

    // Substitute spacebar press for slash in any of the inputs. It's really useful
    [this.#angleWantInput, this.#zoneEqualsInput, this.#zoneMoreInput, this.#zoneLessInput, this.#formulaeInput].forEach((input) => {
      if (input instanceof HTMLElement) {
        input.addEventListener("keypress", (e) => {
          if (e.key == " ") {
            e.preventDefault();
            input.value += "/";
          }
        });
      }
    });
  }

  /**
   * Updates {@link #angleWantInterpret} field according to user input in {@link #angleWantInput}
   */
  #updateWantInterpret() {
    if (!(this.#angleWantInterpret && this.#angleWantInput)) {
      // user input does not exist, or there's no place to write it to - exit
      return;
    }

    /** @type {{evaluation : String, literal : String}} object containing both evaluation and literal strings */
    let extracted = extractValue(this.#angleWantInput.value, this.lang);
    let literal = extracted.literal;
    let evaluated = null;
    if (extracted.evaluation.length) {
      // evaluation string is not empty
      try {
        // try to evaluate it
        evaluated = eval(extracted.evaluation);
      } catch (exception) {
        // catch and log any exceptions
        console.log("User input caused exception at evaluation: ", exception);
        // make sure that output is null in this case
        literal = this.lang?.bad_input ?? "Bad input"; // assign error message
        this.#angleWantEval = null; // remove previously calculated value
      }
    }

    if (typeof evaluated !== "number") {
      // Input is bad
      if (extracted.evaluation.length) {
        // there is actually some input
        this.#angleWantInput.classList.add("bad-angle-input"); // visually signify that there's an error
      }
      // in other case, no need to signify an error
      this.#angleWantEval = null; // remove previously calculated value
      this.#angleWantInterpret.innerText = literal; // literal is an error message in this case, so set interpretation to it
      return;
    }

    // Input is ok
    this.#angleWantInput.classList.remove("bad-angle-input"); // visually signify that input is ok

    if (this.#angleWantPiToggle && this.#angleWantPiToggle.checked) {
      // Pi toggle multiplier exists and is active, so
      // User wants input mutiplied by pi
      evaluated *= PI; // multiply value
      literal = `(${literal})*π`; // multiply literaly
    }
    let wantRad = this.#angleWantRadiansToggle && this.#angleWantRadiansToggle.checked;
    if (wantRad) {
      this.#angleWantLiteral = literal; // if input is in radian, I'd like to display it without "(rad)" everywhere...
      literal += " (rad)"; // ...except interpretation field
    } else {
      literal += "°"; // if user input is in degree, I'd like to display it with '°' string everywhere, for clarity
      this.#angleWantLiteral = literal;
      evaluated *= PI / 180; // number is supposed to be in radian, so it's much smaller in this case
    }
    this.#angleWantEval = evaluated; // assign evaluated number to local field
    this.#angleWantInterpret.innerText = literal; // assign interpretation display
  }

  /**
   * @param {InteractiveTrigonometryState} state
   */
  setState(state) {
    setChecked(this.#pointerToggle, state.angle.pointer ?? true);
    setChecked(this.#pointerLabelToggle, state.angle.pointerLabel ?? false);
    setChecked(this.#angleLabelsToggle, state.angle.labels ?? false);
    setChecked(this.#defaultGuidelinesToggle, state.angle.guideLines ?? false);
    setChecked(this.#angleDegradToggle, state.angle.radLabels ?? false);
    setChecked(this.#angleWantRadiansToggle, state.angle.inputRad ?? false);
    setInputText(this.#angleWantInput, state.angle.inputString ?? "");
    setText(this.#angleWantInterpret, state.angle.inputInterpret ?? "");
    setChecked(this.#angleWantPiToggle, state.angle.interpretPi ?? false);
    setChecked(this.#angleWantPiLock, state.angle.interpretPiLock ?? false);
    setChecked(this.#mirrorXToggle, state.angle.mirrorX ?? false);
    setChecked(this.#mirrorYToggle, state.angle.mirrorY ?? false);
    setChecked(this.#overwindToggle, state.angle.overwind ?? false);

    setChecked(this.#functionsShowGuidelines, state.functions.guideLines ?? false);
    setChecked(this.#functionsShowSin, state.functions.showSin ?? false);
    setChecked(this.#functionsShowCos, state.functions.showCos ?? false);
    setChecked(this.#functionsShowTan, state.functions.showTan ?? false);
    setChecked(this.#functionsShowLabels, state.functions.funcLabels ?? false);
    setChecked(this.#functionsSuppressExpressions, state.functions.suppressExpressions ?? false);

    this.#selectedFunctionIndex = state.functions.selectedFunctionValue ?? 0;
    // find and activate corresponding selector
    for (let selector of [this.#functionsSelectorSin, this.#functionsSelectorCos, this.#functionsSelectorTan, this.#functionsSelectorCot]) {
      if (selector instanceof HTMLInputElement && selector.value === FUNCTION_NAMES[this.#selectedFunctionIndex]) {
        setChecked(selector, true);
        break;
      }
    }

    this.#selectedFunctionZone = state?.functions?.selectedFunctionZone ?? 0;
    // find and activate corresponding selector
    for (let selector of [this.#zoneSelectorSin, this.#zoneSelectorCos, this.#zoneSelectorTan, this.#zoneSelectorCot]) {
      if (selector instanceof HTMLInputElement && selector.value === FUNCTION_NAMES[this.#selectedFunctionZone]) {
        setChecked(selector, true);
        break;
      }
    }

    if (state.functions.zonesData) {
      this.#complyWithZoneData(state.functions.zonesData);
    }

    setInputText(this.#formulaeInput, state.formulae.query ?? "");
    /** @type {Formula | undefined} Formula shown at a query result header */
    let shownFormula = this.#formulaeList.find((formula) => formula.id === state.formulae.shownId);
    if (shownFormula) {
      // There is actually a query result
      if (state.formulae.shownParents) {
        // It's a parents query
        this.findFormulaParents(shownFormula);
      } else {
        // It's a featured
        this.findFormulaFeatured(shownFormula);
      }
    }
    this.#selectedFormula = this.#formulaeList.find((formula) => formula.id === state.formulae.selectedId) || null;
    if (this.#selectedFormula) {
      // Some formula is actually selected
      let inputId = GraphController.getFormulaRadioId(this.#selectedFormula);
      let input = document.getElementById(inputId);
      if (!input) {
        console.warn("Formula ", this.#selectedFormula, " is selected, but element with ", inputId, " does not seem to exist");
      } else if (!(input instanceof HTMLInputElement)) {
        console.warn("Element with id ", inputId, " must be a input radiobutton, but it seems to be ", input);
      } else {
        input.checked = true;
      }
    }

    this.#updatePointer();
    this.#updatePointerLabel();
    this.#setAngleLabelsVisible();
    this.updateGuidelineLabelsContent();
    this.#setDefaultGuidelinesActive();
    this.#setFunctionGuidelinesActive();
  }

  /**
   *
   * @param {InteractiveTrigonometryState} result State to write to. Can be specified to prevent excess object creation. Defaults to newly created state object
   * @returns {InteractiveTrigonometryState} State object describing this controller's state
   */
  getState(result = new InteractiveTrigonometryState()) {
    result.angle.pointer = this.#pointerToggle?.checked;
    result.angle.pointerLabel = this.#pointerLabelToggle?.checked;
    result.angle.labels = this.#angleLabelsToggle?.checked;
    result.angle.guideLines = this.#defaultGuidelinesToggle?.checked;
    result.angle.radLabels = this.#angleDegradToggle?.checked;
    result.angle.inputRad = this.#angleWantRadiansToggle?.checked;
    result.angle.inputString = this.#angleWantInput?.value;
    result.angle.inputInterpret = this.#angleWantInterpret?.innerText;
    result.angle.interpretPi = this.#angleWantPiToggle?.checked;
    result.angle.interpretPiLock = this.#angleWantPiLock?.checked;
    result.angle.mirrorX = this.#mirrorXToggle?.checked;
    result.angle.mirrorY = this.#mirrorXToggle?.checked;
    result.angle.overwind = this.#overwindToggle?.checked;

    result.functions.guideLines = this.#functionsShowGuidelines?.checked;
    result.functions.showSin = this.#functionsShowSin?.checked;
    result.functions.showCos = this.#functionsShowCos?.checked;
    result.functions.showTan = this.#functionsShowTan?.checked;
    result.functions.funcLabels = this.#functionsShowLabels?.checked;
    result.functions.suppressExpressions = this.#functionsSuppressExpressions?.checked;
    result.functions.selectedFunctionValue = this.#selectedFunctionIndex;
    result.functions.selectedFunctionZone = this.#selectedFunctionZone;

    result.formulae.query = this.#formulaeInput?.value;
    result.formulae.selectedId = this.#selectedFormula?.id ?? 0;
    result.formulae.shownId = this.#shownFormula?.id ?? 0;
    result.formulae.shownParents = this.#formulaeShownParents ?? false;

    return result;
  }

  /**
   * Fires event to set content of pointer's label at graph according to current selected angle
   * @param {Number} angle Angle to use. Default is currently selected angle in {@link #currentAngle} field
   * @returns {boolean} If content was set
   */
  updatePointerLabelContent(angle = this.#selectedAngle) {
    let content = this.#getPointerLabelContent(angle);
    this.#fireEvent("pointer-label-set", { value: content });
    return true;
  }

  /**
   * Evaluates what pointer's label content should be
   * @param {Number} angle Angle to use. Default is currently selected angle in {@link #currentAngle} field
   * @returns {String} Pointer's label content
   */
  #getPointerLabelContent(angle = this.#selectedAngle) {
    /** @type { boolean } Determines if content must be formatted like radians. True, if there's no element to control that. */
    let isRad = this.#angleDegradToggle?.checked ?? true;

    if (this.#guideline && !this.#functionsSuppressExpressions?.checked) {
      // Pointer did snap to a guideline, and expressions are not suppressed
      // Use guideline to get content
      /** @type {String} Main label content, append excluded */
      let mainContent = isRad ? this.#guideline.literalAngle.radian : fancyRound(this.#guideline.literalAngle.degree, 1) + "°"; // TODO OMG UNIFY GUIDELINE DATA FORMAT!!!
      return mainContent + getAngleAppend(angle, isRad);
    } else {
      // Pointer did not snap on a guideline or expressions are suppressed, so
      // Use something default, like
      return this.#angleDegradToggle?.checked ? `${fancyRound(angle / PI, 2)}π` : `${fancyRound((angle / PI) * 180, 1)}°`;
    }
  }

  /**
   * Fires event to set content of guideline labels at graph according to current selected angle
   * @param {Number} angle Angle to use. Default is currently selected angle in {@link #currentAngle} field
   */
  updateGuidelineLabelsContent(angle = this.#selectedAngle) {
    this.#fireEvent("update-guideline-labels", {
      guidelines: this.#allGuideLines,
      contentProvider: (/** @type {Guideline} */ guideline) => this.#guidelineLabelContent(guideline, angle),
    });
  }

  /**
   * Evaluates what guideline's label content should be
   * @param {Guideline} guideline Guideline to evaluate for
   * @param {Number} angle Angle to evaluate at. Default is currently selected angle in {@link #currentAngle} field
   * @param {boolean} isRadian If guideline content should be expressed in radians. Defaults to this controller's {@link #angleDegradToggle} state, or true if one does not exist
   * @returns {String} Desired content of a label
   */
  #guidelineLabelContent(guideline, angle = this.#selectedAngle, isRadian = this.#angleDegradToggle?.checked ?? true) {
    let mainContent = isRadian ? guideline.literalAngle.radian : `${fancyRound(guideline.literalAngle.degree, 1)}°`; // TODO OMG UNIFY ANGLE FORMAT
    return mainContent + getAngleAppend(angle, isRadian); // TODO SIMPLIFY!!
  }

  /**
   * Updates controller's selected angle
   * @param {Number} angle New angle to use
   */
  updateAngle(angle) {
    this.#selectedAngle = angle;
    // I supply passed angle here just for clarity and optimization (maybe?)
    this.#updateCurrentAngleFields(angle);
    this.#updateCurrentFunction(angle);
    this.#updateFunclabels(angle);
  }

  /**
   *  Updates controller's {@link #angleCurrentDegree} and {@link #angleCurrentRadian} text fields if they exist
   * @param {Number} angle Angle to use. Default is currently selected angle in {@link #currentAngle} field
   */
  #updateCurrentAngleFields(angle = this.#selectedAngle) {
    setHtml(this.#angleCurrentDegree, this.#currentAngleContent(angle, false));
    setHtml(this.#angleCurrentRadian, this.#currentAngleContent(angle, true));
  }

  /**
   * Calculates current angle representation
   * @param {Number} angle Angle to use. Default is currently selected angle in {@link #currentAngle} field
   * @param {boolean} isRadian If it's supposed to be expressed in radian. Defaults to true
   * @returns {String} Current angle content
   */
  #currentAngleContent(angle = this.#selectedAngle, isRadian = true) {
    if (this.#guideline) {
      // pointer snapped at guideline - use it to get content:
      return this.#guidelineLabelContent(this.#guideline, angle, isRadian);
    } else {
      // pointer is not snapped at a guideline - return something default like:
      return isRadian ? `${fancyRound(angle / PI, 2)}π` : `${fancyRound((angle / PI) * 180, 1)}°`;
    }
  }

  /**
   * Fires an event for graph to update it's function labels using provided function IF corresponding {@link #functionsShowLabels} control is active, defaulting to true
   * @param {Number} angle Angle to use. Default is currently selected angle in {@link #currentAngle} field
   */
  #updateFunclabels(angle = this.#selectedAngle) {
    if (!this.#functionsShowLabels || this.#functionsShowLabels.checked) {
      // control is not present, or is active
      this.#fireEvent("update-funclabels", {
        contentProvider: (/** @type { String } */ typeName) => this.#funclineLabelText(typeName, angle),
      });
    }
  }

  /**
   * Calculates function line's label content
   * @param {String} functionName Type of a function line label. Must be of the {@link FUNCTION_NAMES} values
   * @param {Number} angle Angle to use. Default is currently selected angle in {@link #currentAngle} field
   * @returns {String} Function line label's content
   */
  #funclineLabelText(functionName, angle = this.#selectedAngle) {
    let typeIndex = FUNCTION_NAMES.indexOf(functionName);
    if (typeIndex === -1) {
      // function name is incorrect
      console.warn("Supplied functionName does not appear to be correct: ", functionName); // warn about that
      return `Bad function name ${functionName}`; // return error content
    }

    if (this.#guideline && !this.#functionsSuppressExpressions?.checked) {
      // pointer snapped at a guideline and expressions are not suppressed - return value from guideline
      return this.#guideline.literalFunction[functionName];
    } else {
      // pointer did not snap or expressions are suppressed - return something default
      let value = FUNCTION_LIST[typeIndex](angle);
      if (Math.abs(value) < 1000) {
        // value is small enough - return default
        return fancyRound(value, 3);
      }
      // value is quite large
      return Math.sign(value) ? `+${this.lang.infinity}` : `-${this.lang.infinity}`;
    }
  }

  /**
   * Updates displayed content in {@link #functionsCurrentDeg}, {@link #functionsCurrentRad}, {@link #functionsCurrentVal} and {@link #functionsCurrentVal2} fields if they exist
   * @param {Number} angle Angle to use. Default is currently selected angle in {@link #currentAngle} field
   */
  #updateCurrentFunction(angle = this.#selectedAngle) {
    /** @type {(x : Number) => Number} */
    let selectedFunction = FUNCTION_LIST[this.#selectedFunctionIndex];
    if (!selectedFunction) {
      // selected function does not exist
      let error = this.lang.no_input ?? "No input"; // localization or default string for this
      // display error everywhere
      setHtml(this.#functionsCurrentDeg, error);
      setHtml(this.#functionsCurrentRad, error);
      setHtml(this.#functionsCurrentVal, error);
      setHtml(this.#functionsCurrentVal2, ""); // except for val2, as it's just a duplicate
      return;
    }
    // selected fucntion does exist
    /** @type {Number | String} Holds function value or it's html representation */
    let value = selectedFunction(angle); // it's a function value for now
    /** @type {boolean} Arcs as one of the conditions for val2 element to be assigned a value */
    let isFinite = true;
    if (Math.abs(value) > 1000) {
      // value is quite large - use latex to represent
      value = renderLatex("\\pm\\infty"); // it's html representation now
      isFinite = false;
    } else {
      value = fancyRound(value); // it's string representation now
    }
    let functionName = FUNCTION_NAMES[this.#selectedFunctionIndex];
    setHtml(this.#functionsCurrentDeg, `${functionName}(${this.#currentAngleContent(angle, false)})`);
    setHtml(this.#functionsCurrentRad, `${functionName}(${this.#currentAngleContent(angle, true)})`);
    setHtml(this.#functionsCurrentVal, `${value}`);
    if (this.#functionsCurrentVal2 && isFinite && this.#guideline) {
      // val2 field exists, pointer is at a guideline, and result is small enough
      if (`${functionName}_tex` in this.#guideline.texFunction) {
        // there's a tex representation of a function value - render it to html
        this.#functionsCurrentVal2.innerHTML = `=${renderLatex(this.#guideline.texFunction[`${functionName}_tex`])}`;
      } else {
        // use default representation
        this.#functionsCurrentVal2.innerHTML = `=${this.#guideline.literalFunction[functionName]}`;
      }
    } else {
      // val2 field does not exist, pointer did not snap or result is infinite - "hide" val2 fields
      setHtml(this.#functionsCurrentVal2, "");
    }
  }

  /**
   * @param {Formula[]} formulae Array of {@link Formula} that should be added to internal formula array
   */
  addToFormulae(formulae) {
    this.#formulaeList = [...this.#formulaeList, ...formulae];
  }

  /**
   * Displays list of formula object in {@link #formulaeResult} element (if one exists)
   * @param {Formula[]} formulaList Array of formulas to display
   * @param {String} alt String to display, if array is empty. Defaults to corresponding localization string or "No results"
   */
  #formulaeDisplayList(formulaList, alt = this.lang.no_formula ?? "No results") {
    if (!this.#formulaeResult) {
      // no element to display in - nothing to do
      return;
    }
    this.#formulaeResult.innerHTML = ""; // reset element's html
    if (!formulaList.length) {
      // list has no elements - create paragraph with alt text
      let p = document.createElement("p");
      p.innerText = alt;
      this.#formulaeResult.appendChild(p);
      return;
    }
    // list has elements
    let listElement = document.createElement("ul"); // create list for them
    GraphController.#formulaeResultId++; // increment, as it's a new result list
    let radiosName = `selected_formula_${GraphController.#formulaeResultId}`;
    // array methods are good, but I find no reason to create separate function for that stuff...
    for (let formula of formulaList) {
      let label = document.createElement("label"); // create label for formula to reside in
      let inputId = GraphController.getFormulaRadioId(formula); // getting formula label id
      label.setAttribute("for", inputId); // so that label will transfer click to input
      label.innerHTML = renderLatex(formula.tex); // render formula and add it to label html
      let listItem = document.createElement("li"); // create item element to wrap up a label

      let input = document.createElement("input"); // the actual selector
      input.setAttribute("type", "radio"); // it's a radio button
      input.setAttribute("name", radiosName); // name them, so that they won't interfere with other controllers
      input.setAttribute("id", inputId); // assign id
      input.addEventListener("click", () => (this.#selectedFormula = formula)); // select formula in click TODO shouldn't it be "change" event instead?
      listItem.appendChild(input); // append input to label

      listItem.appendChild(label);

      if (formula.wikiref) {
        // formulae has a wikiref
        let wikirefAnchor = document.createElement("a");
        wikirefAnchor.setAttribute("target", "_blank"); // open in new tab
        wikirefAnchor.setAttribute("href", formula.wikiref);
        wikirefAnchor.classList.add("formulae-wikiref"); // CSS class by convention
        listItem.appendChild(wikirefAnchor); // append anchor to label
      }
      listElement.appendChild(listItem);
    }
    this.#formulaeResult.appendChild(listElement); // append created list element (all at once, yesss!!)
  }

  /**
   * Finds and diplays one of two formulae lists:
   * - if there is a selected formulae - formulae having it as a parent
   * - if there is no selected formulae - formulae having user input as feature
   * @param {?Formula} selectedFormula Defaults to value of {@link #selectedFormula} field
   */
  findFormulaFeatured(selectedFormula = this.#selectedFormula) {
    this.#formulaeShownParents = false; // it's not the parents what's displayed now
    let resultList;
    let resultListHeader = this.lang.formula_features ?? "Features of";
    if (selectedFormula) {
      // get features for formula
      let selectedId = Number(selectedFormula.id);
      resultList = this.#formulaeList.filter((formula) => formula.parents.includes(selectedId));
      setHtml(this.#formulaeResultName, `${resultListHeader} ${renderLatex(selectedFormula.tex)}`); // render selected formula in header
      this.#shownFormula = selectedFormula; // update shown formula
    } else {
      // get features for expression
      if (this.#formulaeInput) {
        // input field actually exists
        let input = transformForFormulaeQuery(this.#formulaeInput.value);
        resultList = this.#formulaeList.filter((formula) => formula.features.includes(input));
        setHtml(this.#formulaeResultName, `${resultListHeader} ${renderLatex(transformForTex(this.#formulaeInput.value))}`); // render user input in header
        this.#shownFormula = null; // no formula in shown in this case, just user input
      } else {
        // input field does not exist - no user input
        console.info("No user input exist, and no formula selected - can't find featured"); // inform about that
        resultList = [];
        setHtml(this.#formulaeResultName, `${resultListHeader} ${this.lang.no_field ?? "no field"}`); // render user input in header
        this.#shownFormula = null; // no formula in shown in this case
      }
    }
    this.#selectedFormula = null; // no formula is selected now
    this.#formulaeDisplayList(resultList, this.lang.no_features ?? "No features"); // display result
  }

  /**
   * Finds and diplays lists of formulae that are parents of currently selected or queried formula. If no formula selected, this call is ignored
   * @param {?Formula} selected
   */
  findFormulaParents(selected = this.#selectedFormula || this.#shownFormula) {
    if (!selected) {
      // no formula selected, warn and return
      console.warn("No formula selected, can't find parents"); // TODO add visual identification!!!
      return;
    }
    this.#formulaeShownParents = true; // it's formula parents that are shown now
    let resultList = this.#formulaeList.filter((formula) => selected.parents.includes(formula.id));
    let resultListHeader = this.lang.formula_parents ?? "Parents of"; // added just for clarity
    setHtml(this.#formulaeResultName, `${resultListHeader} ${renderLatex(selected.tex)}`);
    this.#shownFormula = selected; // selected formula query is shown now
    this.#selectedFormula = null; // no formula is selected now
    this.#formulaeDisplayList(resultList, this.lang.no_parents ?? "No Parents"); // display result
  }

  /**
   * Fires an event to ask graph for it's state. Then merges it with controller's current state
   * @returns {InteractiveTrigonometryState} Merged state of this controller and corresponding graphs
   */
  #fetchGraphState() {
    /** @type {?InteractiveTrigonometryState} resulting state */
    let result = null;
    this.#fireEvent("fetch-state", { setter: (/** @type {InteractiveTrigonometryState} */ state) => (result = state) }, true);
    if (!result) {
      // no state from graph received, return own state
      return this.getState();
    }
    // received state from graph
    return deepMergeObjects(result, this.getState(), result);
  }

  /**
   * Looks through state area data and makes this controller comply with it
   * @param {(?String)[][]} areaData
   */
  #complyWithZoneData(areaData) {
    for (let rowIndex in areaData) {
      for (let columnIndex in areaData[rowIndex]) {
        let cell = areaData[rowIndex][columnIndex];
        if (cell) {
          // there is an zone of this type - add it
          this.#addZone(Number(rowIndex), Number(columnIndex), cell);
        } else {
          // there is no zone of this type - remove any
          this.#removeZone(Number(rowIndex), Number(columnIndex));
        }
      }
    }
  }

  /**
   * Adds zone with specified value and type/function indexes. Actumatically changes activeZonesCell (if there is one), and fire corresponding event to the graph
   * @param {Number} typeIndex [Zone type](./constants.js) index
   * @param {Number} functionIndex [Function](./constants.js) index
   * @param {?String} rawValue Raw value of the corresponding function (designed to be user input)
   */
  #addZone(typeIndex, functionIndex, rawValue) {
    let zoneObject, value, literal;
    if (typeIndex == 0 || typeIndex == 1) {
      // these are positive/negative zones, so no value for them needed
      value = null;
      literal = null;
    } else {
      // zone needs a value
      if (!rawValue) {
        // but no value supplied. warn and exit
        console.warn("Zone of type ", typeIndex, " needs a value, but no value was supplied");
        return;
      }
      let extracted = extractValue(rawValue, this.lang);
      if (!extracted.evaluation.length) {
        // user input is bad. warn and exit
        console.warn("Used bad input for zone: ", rawValue);
        return;
      }

      try {
        value = eval(extracted.evaluation); // set value
      } catch (exception) {
        // catch and exit on any exception
        console.warn("User input ", extracted.evaluation, " caused exception on evaluation");
        return;
      }
      literal = extracted.literal; // set literal

      setHtml(this.#activeZonesCells?.[typeIndex]?.[functionIndex], literal); // set active zones cell text
    }

    if (typeIndex == 2) {
      if (!literal) {
        // equals zone needs literal
        return;
      }
      // equals zone uses linezone
      zoneObject = new FunctionZoneLine(2, functionIndex, value, literal);
    } else {
      // all other zones use polyzone
      zoneObject = new FunctionZonePoly(typeIndex, functionIndex, value, literal);
    }
    let guidelines = getDynamicGuidelines(typeIndex, functionIndex, value, literal); // get zone guidelines
    let functionGuidelinesActive = this.#functionsShowGuidelines?.checked ?? true; // use appropriate controller field and fallback to true
    guidelines.forEach((guideline) => (guideline.active = functionGuidelinesActive)); // set guidelines activeness
    this.#fireEvent("zones-add", { zone: zoneObject, guidelines: guidelines }); // ask graph to add this zone and it's guidelines
    this.#functionsGuideLines = [
      ...(this.#functionsGuideLines?.filter(
        (guideline) => !(guideline.typeIndex === typeIndex && guideline.functionIndex === functionIndex) // filter guidelines from possible previous zones of this type
      ) ?? []), // if no guidelines present, or array does not exist - use empty one
      ...guidelines, // append guidelines of newly-created zone
    ]; // add guidelines to this controller's guidelines list
    this.#triggerAngleSnap(); // trigger pointer snap, as it might be on the guideline now
  }

  /**
   * Adds adds array of guideline data to this controller's default guideline list
   * @param {Object[]} dataArray
   */
  addDefaultGuidelines(dataArray) {
    // for each of the data objects, create a guideline with "guideline-default" CSS class, without line
    let newGuidelines = dataArray.map((data) => new Guideline(data, ["guideline-default"], undefined, false)); // create new guidelines
    this.#angleGuideLines = [...(this.#angleGuideLines ?? []), ...newGuidelines]; // add new guidelines to this controller's guidelines array
    this.#fireEvent("add-guidelines", { guidelines: newGuidelines }); // fire event on them, so that graph could update them with visuals
  }

  get #activeGuidelines() {
    return [
      ...(!this.#defaultGuidelinesToggle || this.#defaultGuidelinesToggle.checked ? this.#angleGuideLines : []),
      ...(!this.#functionsShowGuidelines || this.#functionsShowGuidelines.checked ? this.#functionsGuideLines : []),
    ];
  }

  /**
   * Returns all guidelines controller know of
   * @type {Guideline[]}
   */
  get #allGuideLines() {
    return [...(this.#angleGuideLines ?? []), ...(this.#functionsGuideLines ?? [])];
  }

  /**
   * Adds zone with specified value and type/function indexes. Actumatically changes activeZonesCell (if there is one), and fire corresponding event to the graph
   * @param {Number} typeIndex [Zone type](./constants.js) index
   * @param {Number} functionIndex [Function](./constants.js) index
   */
  #removeZone(typeIndex, functionIndex) {
    this.#fireEvent("zones-remove", { type: typeIndex, function: functionIndex }); // fire event for graph to remove zone
    // filter function guidelines, so that these owned by this zone are removed:
    this.#functionsGuideLines = this.#functionsGuideLines?.filter(
      (guideline) => !(guideline.typeIndex === typeIndex && guideline.functionIndex === functionIndex)
    );
    setHtml(this.#activeZonesCells?.[typeIndex][functionIndex], ""); // remove text from active zones cell
    this.#triggerAngleSnap(); // resnap pointer, as it might now be not on a guideline
  }

  /**
   * Defines controller's snapping & overwind logic. Checks if angle snaps to any of active guidelines or steps out of overwind-bound region, and passes it's new value to the setter
   * @param {Number} angle Angle to check snapping for
   * @param {(newAngle: Number) => void} setter Angle setter to pass new angle to
   * @returns {boolean} True if setter function was called
   */
  snapAngle(angle, setter) {
    let guidelines = this.#activeGuidelines;
    let pure = angle % PIx2; // leftover from 2PI
    // The thing is, JS is bad at math and allows this to be negative, so
    if (pure < 0) pure += PIx2; // in this case I add 2PI to leftover
    let winds = Math.floor(angle / PIx2); // number of full-circle winds. If overwind is disable, only 0 and -1 are allowed here
    let overwindTriggered = false; // tells if angle was changed due to overwind rules
    if (!(this.#overwindToggle && this.#overwindToggle.checked)) {
      // overwind toggle is not present or is not checked - overwind disabled
      if (winds > 0) {
        winds = 0;
        overwindTriggered = true;
      } else if (winds < -1) {
        winds = -1;
        overwindTriggered = true;
      }
    }
    let leastDistance = SNAP_RADIUS; // the smallest distance from a guideline that has occured so far
    let guideline = null; // assume that there's no snapping guideline
    // I know about forEach method perfectly well, it's just that I don't feel like using it here
    for (let currentGuideline of guidelines) {
      let distance = Math.abs(currentGuideline.angle - pure); // distance to guideline in process
      if (distance < leastDistance) {
        // distance is less than any previously encountered
        leastDistance = distance; // so it's now the least
        guideline = currentGuideline; // and there is a snapping guideline
      }
    }
    this.#guideline = guideline;
    if (guideline) {
      // there is a snapping guideline, notify the caller
      setter(winds * PIx2 + guideline.angle);
      return true; // setter was called
    }
    if (overwindTriggered) {
      // overwind was troggered, so angle was changed
      setter(winds * PIx2 + pure);
      return true; // setter was called
    }
    return false; // setter was not called
  }

  /**
   * Fires corresponding event if there are any angle guidelines
   * @param {boolean} visible If angle guideline labels should be visible
   */
  #setAngleLabelsVisible(visible = this.#angleLabelsToggle?.checked ?? false) {
    if (this.#angleGuideLines && this.#angleGuideLines.length) {
      this.#fireEvent("guideline-labels-visible", { labelsToShow: this.#angleGuideLines, override: visible });
    }
  }

  /**
   * Fires corresponding event if there are any angle guidelines
   * @param {boolean} visible If angle guidelines should be active. Defaults to {@link #defaultGuidelinesToggle} field state, or true one does not exist
   */
  #setDefaultGuidelinesActive(visible = this.#defaultGuidelinesToggle?.checked ?? true) {
    if (this.#angleGuideLines && this.#angleGuideLines.length) {
      this.#fireEvent("guideline-ticks-visible", { ticksToShow: this.#angleGuideLines, override: visible });
    }
  }

  /**
   * Fires corresponding event if there are any function guidelines
   * @param {boolean} visible If function guidelines should be active. Defaults to {@link #functionsShowGuidelines} field state, or true one does not exist
   */
  #setFunctionGuidelinesActive(visible = this.#functionsShowGuidelines?.checked ?? true) {
    if (this.#functionsGuideLines && this.#functionsGuideLines.length) {
      this.#fireEvent("guideline-ticks-visible", { ticksToShow: this.#functionsGuideLines, override: visible });
    }
  }

  /**
   * Fires corresponding event.
   * It expects for graph to reselect angle it's currently pointing at, and thus trigger snapping one again
   */
  #triggerAngleSnap() {
    this.#fireEvent("trigger-angle-snap");
  }

  /**
   * Fires corresponding event.
   * It expects graph to update pointer's visibility
   */
  #updatePointer() {
    this.#fireEvent("pointer-toggle", {
      checked: this.#pointerToggle?.checked ?? false,
      label: this.#pointerLabelToggle?.checked ?? false,
    });
  }

  // TODO might want to merge these two together
  /**
   * Fires corresponding event.
   * It expects graph to update pointer label's visibility
   */
  #updatePointerLabel() {
    this.#fireEvent("pointer-label-toggle", {
      checked: this.#pointerLabelToggle?.checked,
      pointer: this.#pointerToggle?.checked,
    });
  }

  /**
   * Sets color to this controller's active zones cell
   * @param {Number} typeIndex [Zone type](./constants.js) index
   * @param {Number} functionIndex [Function](./constants.js) index
   * @param {String} color Color as it's expected in DOM attribute
   */
  colorZoneCell(typeIndex, functionIndex, color) {
    if (this.#activeZonesCells?.[typeIndex][functionIndex]) {
      // targeted cell exists
      this.#activeZonesCells[typeIndex][functionIndex].style.backgroundColor = color;
    }
    this.#updateZoneInputData();
  }

  /**
   * Update text on a zone buttons according to the current localization and selected zone function
   */
  #updateZoneButtonText() {
    if (!(this.#selectedFunctionZone in FUNCTION_NAMES)) {
      console.warn("Selected zone function ", this.#selectedFunctionZone, " is not present in FUNCTION_NAMES array");
      return;
    }
    let functionName = FUNCTION_NAMES[this.#selectedFunctionZone];
    functionName = this.lang[functionName] ?? functionName; // try to get localized version
    // set button text with localized text, fallback to default one (specified below)
    setText(this.#addPositiveZoneButton, (this.lang.zone_positive ?? "%s is positive").replace("%s", functionName));
    setText(this.#addNegativeZoneButton, (this.lang.zone_negative ?? "%s is negative").replace("%s", functionName));
    setText(this.#addEqualsZoneButton, (this.lang.zone_equals ?? "%s equals").replace("%s", functionName));
    setText(this.#addMoreZoneButton, (this.lang.zone_more ?? "%s less than").replace("%s", functionName));
    setText(this.#addLessZoneButton, (this.lang.zone_less ?? "%s grater than").replace("%s", functionName));
  }

  /**
   * Update zone input text and outline color
   */
  #updateZoneInputData() {
    if (!this.#activeZonesCells) {
      // active zones table does not exist - nothing to do
      return;
    }
    // set button outlines
    [
      this.#addPositiveZoneButton,
      this.#addNegativeZoneButton,
      this.#addEqualsZoneButton,
      this.#addMoreZoneButton,
      this.#addLessZoneButton,
    ].forEach((button, index) => {
      if (button instanceof HTMLButtonElement) {
        // @ts-expect-error [this.#activeZonesCells is not null, since I've checked for that on top of the method]
        button.style.outlineColor = this.#activeZonesCells[index][this.#selectedFunctionZone].style.backgroundColor ?? "transparent";
      }
    });
    // set input outlines and contents
    [null, null, this.#zoneEqualsInput, this.#zoneMoreInput, this.#zoneLessInput].forEach((input, index) => {
      if (input instanceof HTMLInputElement) {
        // @ts-expect-error [this.#activeZonesCells is not null, since I've checked for that on top of the method]
        input.style.outlineColor = this.#activeZonesCells[index][this.#selectedFunctionZone].style.backgroundColor ?? "transparent";
        // @ts-expect-error [this.#activeZonesCells is not null, since I've checked for that on top of the method]
        let zoneText = this.#activeZonesCells[index][this.#selectedFunctionZone].innerText;
        if (zoneText) {
          input.value = zoneText;
        }
      }
    });
  }

  updateLocalization() {
    this.#updateZoneButtonText();
    this.#updateWantInterpret();
  }

  /**
   * Copies program's state into a clipboard, if applicable
   * @param {boolean} addUrl If URL with predefined state should be copied instead
   */
  #clipboardState(addUrl) {
    let state = this.#fetchGraphState(); // get state to encode
    let encoded = state.encode(); // encode the state
    if (this.#shareGenerateField) {
      // if there is a field to write it to - write the state
      this.#shareGenerateField.innerText = encoded;
    }
    if (addUrl) {
      // if url was actually asked - append it at front
      encoded = URL_FOR_STATE + encoded;
    }
    if (navigator && navigator.clipboard) {
      // if it can be clipboarded - do that
      navigator.clipboard.writeText(encoded);
    } else {
      // otherwise - log it to console
      console.info(addUrl ? "Url to copy:" : "State to copy:", encoded);
    }
  }

  /**
   * @returns {boolean}
   */
  get overwindEnabled() {
    return !this.#overwindToggle || this.#overwindToggle.checked;
  }
}
