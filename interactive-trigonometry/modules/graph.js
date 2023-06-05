// @ts-check

import { BackgroundedLabel } from "./label.js";
import Guideline from "./guideline.js";
import InteractiveTrigonometryState from "./state.js";
import { FunctionZone } from "./zone.js";
import { COLORS_NAMES, FUNCTION_INDEXES, FUNCTION_NAMES, LANGUAGES, PI, PIx2, THEME_NAMES, ZONE_TYPE_NAMES } from "./constants.js";
import { getVisibility, setVisibility } from "../../modules/util.js";

/** @type {Number} Defines how far from the center pointer label is */
const POINTER_LABEL_POSITION = 0.4;
/** @type {Number} Determies by how much axes extend over the circle. 1 means not extending */
const AXES_EXTEND = 1.2;
/** @type {Number} Determines how many frames per second sweep animation would have */
const SWEEP_FPS = 60;

/**
 * Represents pointer and it's visual elements
 */
class CompoundPointer {
  /** @type {SVGLineElement} Actual line of the pointer */
  line;
  /** @type {SVGCircleElement} Little circle on pointer's end */
  tip;

  /**
   * @param {Graph} graph
   */
  constructor(graph) {
    this.line = document.createElementNS("http://www.w3.org/2000/svg", "line"); // create pointer line
    this.line.classList.add("pointer", "pointer-line"); // I add these classes by convention
    this.line.style.transformOrigin = "center"; // transform over center
    // position line from center to the right
    this.line.setAttribute("x1", String(graph.x0));
    this.line.setAttribute("y1", String(graph.y0));
    this.line.setAttribute("x2", String(graph.x0 + graph.r0));
    this.line.setAttribute("y2", String(graph.y0));

    this.tip = document.createElementNS("http://www.w3.org/2000/svg", "circle"); // create pointer tip
    this.tip.classList.add("pointer", "pointer-tip"); // I add these classes by convention
    this.tip.style.transformOrigin = "center"; // transform over center
    // position tip on the right
    this.tip.setAttribute("cx", String(graph.x0 + graph.r0));
    this.tip.setAttribute("cy", String(graph.y0));
    this.tip.setAttribute("r", "0.5"); // radius is just some arbitrary value, but it can be changed with CCS, I guess...?
  }

  /**
   * Sets attribute for all pointer's elements. Use like a normal setAttribute function
   * @param {String} attributeName
   * @param {String} attributeValue
   */
  setAttribute(attributeName, attributeValue) {
    this.line.setAttribute(attributeName, attributeValue);
    this.tip.setAttribute(attributeName, attributeValue);
  }

  /**
   * Get attribute from some of pointer's elements. Use like a normal getAttribute function
   * @param {String} attributeName
   */
  getAttribute(attributeName) {
    return this.line.getAttribute(attributeName) || this.tip.getAttribute(attributeName);
  }

  /**
   * Adds class to all pointer's elements
   * @param {String[]} classNames
   */
  addClasses(...classNames) {
    this.line.classList.add(...classNames);
    this.tip.classList.add(...classNames);
  }

  /**
   * Remove class of all pointer's elements
   * @param {String[]} classNames
   */
  removeClass(...classNames) {
    this.line.classList.remove(...classNames);
    this.tip.classList.remove(...classNames);
  }

  /**
   * @param {Number} angle Angle in radian to set
   */
  set angle(angle) {
    let attributeValue = `${-angle}rad`;
    this.line.style.rotate = attributeValue;
    this.tip.style.rotate = attributeValue;
  }

  /**
   * @returns {Number} Angle in radians
   */
  get angle() {
    let attributeValue = this.line.style.rotate ?? this.tip.style.rotate;
    return -Number(attributeValue.replace("rad", ""));
  }
}

/**
 * Represents all program's visual drawing
 */
export class Graph {
  /** @type {SVGSVGElement} This graph's SVG element */
  #svg;
  /** @type {Number} X-poistion of a circle center */
  #x0;
  /** @type {Number} Y-poistion of a circle center */
  #y0;
  /** @type {Number} Radius of a circle */
  #r0;
  /**
   * @typedef {Object} PointersHolder
   * @property {CompoundPointer} original
   * @property {CompoundPointer} xMirror
   * @property {CompoundPointer} yMirror
   * @property {CompoundPointer} xyMirror
   * @property {{path: SVGPathElement, dr: Number, da: Number, radGrow: Number}} arc
   * @property {BackgroundedLabel} label
   */
  /** @type {?PointersHolder} Holds all pointer-related objects */
  #pointersHolder; // Pointer object
  /** @type {?SVGPathElement} Path used to highlight sweep */
  #sweepArc;
  /** @type {?Number} Process id responsible for sweeping */
  #sweepProcessId;
  /**
   * @typedef {Object} FunctionLinesHolder
   * @property {{sin: SVGLineElement, cos: SVGLineElement, tan: SVGLineElement}} lines
   * @property {{sin: BackgroundedLabel, cos: BackgroundedLabel, tan1: BackgroundedLabel, tan2: BackgroundedLabel, cot1: BackgroundedLabel, cot2: BackgroundedLabel, tancot: BackgroundedLabel[]}} labels
   * @property {boolean} showLabels
   */
  /** @type {?FunctionLinesHolder} Holds all funcline-realted stuff */
  #functionLinesHolder;
  /**
   * @typedef {Object} ZoneCompound
   * @property {FunctionZone} zone
   * @property {Guideline[]} guidelines
   * @property {?Number} colorIndex
   */
  /** @type {(?ZoneCompound)[][]} Holds active function zones */
  #functionZones;
  /** @type {HTMLElement} Dummy object for event setting. I would rather not use parent svg for that, since I assume it's already quite loaded with events */
  #eventDummy;
  /**
   * @typedef {Object} ColorCompound
   * @property {String} color
   * @property {?ZoneCompound} zoneCompound
   */
  /** @type {ColorCompound[]} Array of object representing zone color strings and fucntion zone they are used for */
  #zoneColorList;
  /** @type {?String} Object holding zones mask attribute or null is mask is not being applied now */
  #zonesMask;

  /** @type {{[locName : String] : String}} Holds current localization strings */
  lang;

  /**
   * @param {SVGSVGElement} svg SVG element to draw visuals on
   * @param {{[locName : String] : String}} langObject Holds current localization strings
   * @param {{[element: String] : boolean | undefined}} includeFlags Holds flags that define if some visual feature must be used
   * @param {{[element: String] : Object}} visualSettings Holds additional visual settings
   */
  constructor(
    svg,
    langObject,
    { addAxes = true, addCircle = true, addPointer = true, addSweep = true, addFuncLines = true, addConfigure = false } = {},
    { purgeSvg = false, viewBoxSize = 95, relativeCircleRadius = 0.75, zoneMaskBegin = 0.8, zoneMaskEnd = 1.2 } = {}
  ) {
    this.lang = langObject;
    this.#eventDummy = document.createElement("div");
    this.#svg = svg;
    if (purgeSvg) {
      // remove all elements svg contains now
      for (let element of svg.children) {
        svg.removeChild(element);
      }
    }
    // calculate basic geometrical params
    let x0 = (this.#x0 = viewBoxSize / 2.0);
    let y0 = (this.#y0 = viewBoxSize / 2.0);
    let r0 = (this.#r0 = (viewBoxSize / 2.0) * relativeCircleRadius);
    // set those params to svg
    svg.setAttribute("viewBox", `0 0 ${viewBoxSize} ${viewBoxSize}`);
    svg.classList.add("graph"); // CSS class by convention

    // creating mask
    this.#createZoneMask(viewBoxSize, zoneMaskBegin, zoneMaskEnd);

    // binding controls
    this.#bindControlEvents();

    if (addAxes) {
      this.#createAxes();
    }

    if (addCircle) {
      let mainCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      mainCircle.setAttribute("cx", String(x0));
      mainCircle.setAttribute("cy", String(y0));
      mainCircle.setAttribute("r", String(r0));
      mainCircle.setAttribute("fill", "transparent"); // circle is transparent on the inside
      this.addChild(mainCircle);
    }

    if (addPointer) {
      this.#createPointers();
    } else {
      this.#pointersHolder = null;
    }

    if (addSweep) {
      this.#sweepArc = document.createElementNS("http://www.w3.org/2000/svg", "path");
      this.#sweepArc.classList.add("sweep-arc"); // add CSS class by convention
      this.#sweepArc.setAttribute("stroke-width", "3");
      this.#sweepArc.setAttribute("fill", "transparent"); // no fill for sweep arc, as it's an arc
      this.addChild(this.#sweepArc);
    } else {
      this.#sweepArc = null;
    }
    this.#sweepProcessId = null; // sweep process could not be started, so this is null

    if (addFuncLines) {
      this.#createFunctionLines();
    } else {
      this.#functionLinesHolder = null;
    }

    // init function zones-related fields
    this.#functionZones = [
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];

    this.loadZoneColors(); // load zone colors

    if (addConfigure) {
      this.#createConfigure();
    }

    let useMaskCheckbox = document.getElementById(`${svg.id}_use_mask`); // it's supposed to be a use mask switch
    if (useMaskCheckbox instanceof HTMLInputElement) {
      // there is a mask switch
      let useMask = localStorage.getItem(`${svg.id}_usesmask`) === "true";
      // if there's a saved user preference, use it to determine if mask's enabled
      this.useZoneMask(useMask);
      // TODO THIS DEPENDS ON SVG HAVING ID BUT I SEE NO OTHER OPTION, OH WAIT I SEE ONE IT'S TERRIBLE
      useMaskCheckbox.checked = useMask;
    }
  }

  /**
   * Intended to be used only on graph creation
   * @param {Number} viewSize
   * @param {Number} maskBegin
   * @param {Number} maskEnd
   */

  #createZoneMask(viewSize, maskBegin, maskEnd) {
    let defs = this.#svg.querySelector("defs");
    if (!defs) {
      // defs tag does not exist yet
      defs = document.createElementNS("http://www.w3.org/2000/svg", "defs"); // create it
      this.#svg.appendChild(defs); // append it
    }

    let gradient = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
    gradient.setAttribute("id", "gradient");
    // center gradient on the center of graph
    gradient.setAttribute("cx", String(this.#x0));
    gradient.setAttribute("cy", String(this.#y0));
    gradient.setAttribute("gradientUnits", "userSpaceOnUse"); // use graph coordiantes to configure gradient

    // start of a gradient
    let beginStop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    beginStop.setAttribute("offset", `${((this.#r0 * maskBegin) / viewSize) * 200}%`); // before the circle
    beginStop.setAttribute("stop-color", "black"); // fully transparent
    gradient.appendChild(beginStop);

    // peak of the gradient
    let middleStop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    middleStop.setAttribute("offset", `${(this.#r0 / viewSize) * 200}%`); // exactly on a circle
    middleStop.setAttribute("stop-color", "white"); // fully opaque
    gradient.appendChild(middleStop);

    // end of the gradient
    let endStop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    endStop.setAttribute("offset", `${((this.#r0 * maskEnd) / viewSize) * 200}%`); // after the circle
    endStop.setAttribute("stop-color", "black"); // fullt transparent again
    gradient.appendChild(endStop);

    defs.appendChild(gradient);

    let mask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
    mask.setAttribute("id", "zones_mask");
    mask.setAttribute("maskUnits", "userSpaceOnUse"); // use graph coordiantes to configure mask
    // adding rectangle covering all the view
    let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "0");
    rect.setAttribute("y", "0");
    rect.setAttribute("width", "100%");
    rect.setAttribute("height", "100%");
    rect.setAttribute("fill", "url(#gradient)"); // using gradient to fill rectangle
    mask.appendChild(rect); // using rectangle to define mask
    defs.appendChild(mask); // add mask to SVG
  }

  /**
   * Intended to be used only on graph creation
   */
  #bindControlEvents() {
    /** @type {(event : MouseEvent) => void} Handler for mouse click */
    let processClick = (event) => {
      if (event.buttons == 1) {
        // LMB click
        processInteraction(event);
      }
    };

    /** @type {(event : TouchEvent) => void} Handler for screen touch */
    let processTouch = (event) => {
      event.preventDefault(); // Make sure touches are not moving the prespective
      let touch = event.touches[0]; // get only first touch
      processInteraction(touch);
    };

    /** @type {((point : {clientX: Number, clientY: Number}) => void)} Universal interaction handler */
    let processInteraction = (point) => {
      // Some svg magic to ensure correct point
      let userPoint = this.#svg.createSVGPoint();
      userPoint.x = point.clientX;
      userPoint.y = point.clientY;
      let realPoint = userPoint.matrixTransform(this.#svg.getScreenCTM()?.inverse());
      // These are coordinates I actually use.
      let interactionX = realPoint.x - this.#x0;
      let interactionY = realPoint.y - this.#y0;
      if (getVisibility(this.#pointersHolder?.original) && Math.hypot(interactionX, interactionY) > 0.1 * this.#r0) {
        // pointer is visible and interaction is not too close to the center
        let angle = Math.atan2(-interactionY, interactionX); // angle of interaction (not winded)
        // selection
        let windedAngle = this.selectedAngle; // previous angle of interaction (may be winded)
        let sign = Math.sign(windedAngle - angle); // defines if real (winded) angle is greater or lesser than interaction (not winded) angle
        while (Math.abs(windedAngle - angle) > PI) {
          // angles differ more than half-turn
          angle += sign * PIx2; // add full turn to interaction angle
        }
        // interaction angle is not reasonably distant from revious one
        this.selectedAngle = angle; // set new angle
      }
    };
    // set correcponsing handlers
    this.#svg.ontouchstart = processTouch;
    this.#svg.ontouchmove = processTouch;
    this.#svg.onmouseup = processClick;
    this.#svg.onmousemove = processClick;
    this.#svg.onmousedown = processClick;
  }

  /**
   * Little helper function used to create, configure and append axis to the SVG. Intended to be used on graph creation
   * @param {Number} xSpread How mush axis points to positive X direction
   * @param {Number} ySpread How mush axis points to positive Y direction
   * @param {String} labelText Text to write on a label
   */
  #addCircleAxis(xSpread, ySpread, labelText) {
    let axis = document.createElementNS("http://www.w3.org/2000/svg", "line"); // axis itself
    // set position
    axis.setAttribute("x1", String(this.#x0 - xSpread));
    axis.setAttribute("y1", String(this.#y0 - ySpread));
    axis.setAttribute("x2", String(this.#x0 + xSpread));
    axis.setAttribute("y2", String(this.#y0 + ySpread));
    axis.setAttribute("marker-end", "url(#marker_arrowhead)");
    axis.classList.add("trigcircle-axis", "trigcircle-axis-line"); // add CSS classes by convention
    this.#svg.appendChild(axis); // append axis itself to the SVG
    let label = document.createElementNS("http://www.w3.org/2000/svg", "text"); // axis label
    // set position and positioning attributed
    label.setAttribute("dominant-baseline", "bottom");
    label.setAttribute("text-anchor", "begin");
    label.setAttribute("x", String(this.#x0 + xSpread + 1.5)); // here are some arbitrary constants that prevent
    label.setAttribute("y", String(this.#y0 + ySpread - 1.5)); // visual colision of axis and it's label
    label.classList.add("trigcircle-axis", "trigcircle-axis-label"); // add CSS classes by convention
    label.textContent = labelText; // set label content
    this.#svg.appendChild(label); // append label to SVG
  }

  /**
   * Intended to be used only on graph creation
   */
  #createAxes() {
    // creating arrowhead
    // (idk what's going on, just some SVG magic)
    let marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", "marker_arrowhead");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("refX", "0");
    marker.setAttribute("refY", "3.5");
    marker.setAttribute("orient", "auto");
    let polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", "0 0, 10 3.5, 0 7");
    marker.appendChild(polygon);
    this.#svg.appendChild(marker);

    this.#addCircleAxis(AXES_EXTEND * this.#r0, 0, "X"); // add X-axis
    this.#addCircleAxis(0, -AXES_EXTEND * this.#r0, "Y"); // add Y-axis
  }

  /**
   * Intended to be used only on graph creation
   */
  #createPointers() {
    // creating original pointer (one dragged by user)
    let original = new CompoundPointer(this);
    original.addClasses("pointer-original"); // CSS classes by convention
    original.setAttribute("opacity", "1.0");
    // creating mirrors
    let xMirror = new CompoundPointer(this);
    xMirror.addClasses("pointer-xmirror"); // CSS classes by convention
    let yMirror = new CompoundPointer(this);
    yMirror.addClasses("pointer-ymirror"); // CSS classes by convention
    let xyMirror = new CompoundPointer(this);
    xyMirror.addClasses("pointer-xmirror", "pointer-ymirror"); // CSS classes by convention
    // creating pointer arc (visual thing that indicates angle)
    let arcPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arcPath.classList.add("pointer", "pointer-original", "pointer-arc"); // CSS classes by convention
    arcPath.setAttribute("stroke-width", "0.2");
    arcPath.setAttribute("fill", "transparent"); // no filling, as it's supposed to be arc
    arcPath.style.pointerEvents = "none"; // no clicking, as it's just a decoration
    // assembling object containing all arc information
    let arc = {
      path: arcPath, // SVG element
      dr: 0.1 * this.#r0, // it's radius
      radGrow: 0.05, // it's radius growth over angle (in overwind mode)
      da: 0.05, // it's angle increment (must be small enough for it to look like actual arc)
    };

    // creating pointer label
    let label = new BackgroundedLabel();
    label.addClasses("pointer", "pointer-original", "pointer-label");
    // assembling object to hold all pointer-related stuff
    this.#pointersHolder = {
      original: original,
      xMirror: xMirror,
      yMirror: yMirror,
      xyMirror: xyMirror,
      arc: arc,
      label: label,
    };

    // append all pointer-related elements to SVG
    [
      this.#pointersHolder.original.line,
      this.#pointersHolder.original.tip,
      this.#pointersHolder.xMirror.line,
      this.#pointersHolder.xMirror.tip,
      this.#pointersHolder.yMirror.line,
      this.#pointersHolder.yMirror.tip,
      this.#pointersHolder.xyMirror.line,
      this.#pointersHolder.xyMirror.tip,
      this.#pointersHolder.arc.path,
      this.#pointersHolder.label.background,
      this.#pointersHolder.label.foreground,
    ].forEach((element) => {
      this.addChild(element);
    });
  }

  /**
   * Intended to be used only on graph creation
   */
  #createFunctionLines() {
    // create sine line
    let sinLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    // vertical line from a pointer tip to X-axis
    sinLine.setAttribute("x1", String(this.#x0));
    sinLine.setAttribute("y1", String(this.#y0));
    sinLine.setAttribute("x2", String(this.#x0));
    sinLine.setAttribute("y2", String(this.#y0 - this.#r0));
    sinLine.classList.add("function-sin"); // adding CSS class by convention
    // create cosine line
    let cosLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    // horizontal line from a pointer tip to Y-axis
    cosLine.setAttribute("x1", String(this.#x0));
    cosLine.setAttribute("y1", String(this.#y0));
    cosLine.setAttribute("x2", String(this.#x0 + this.#r0));
    cosLine.setAttribute("y2", String(this.#y0));
    cosLine.classList.add("function-cos"); // adding CSS class by convention
    // create tan/cot line
    let tanLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    // large line parallel to the pointer
    tanLine.setAttribute("x1", String(this.#x0 - 5 * this.#r0));
    tanLine.setAttribute("y1", String(this.#y0));
    tanLine.setAttribute("x2", String(this.#x0 + 5 * this.#r0));
    tanLine.setAttribute("y2", String(this.#y0));
    tanLine.classList.add("function-tan"); // adding CSS class by convention
    // preform ing common operation on lines
    for (let line of [sinLine, cosLine, tanLine]) {
      line.style.transformOrigin = "center"; // transform around graph center
      line.classList.add("function-line"); // adding CSS class by convention
      this.addChild(line); // add to the graph
    }
    // assembling an object to store all function lines
    let lines = {
      sin: sinLine,
      cos: cosLine,
      tan: tanLine,
    };
    // creating function line labels
    let sinLabel = new BackgroundedLabel(); // one for sine
    sinLabel.addClasses("function-sin"); // adding CSS class by convention
    let cosLabel = new BackgroundedLabel(); // one for cosine
    cosLabel.addClasses("function-cos"); // adding CSS class by convention
    // 4 more for tan & cot
    let tan1Label = new BackgroundedLabel();
    tan1Label.addClasses("function-tan"); // adding CSS class by convention
    let tan2Label = new BackgroundedLabel();
    tan2Label.addClasses("function-tan"); // adding CSS class by convention
    let cot1Label = new BackgroundedLabel();
    cot1Label.addClasses("function-cot"); // adding CSS class by convention
    let cot2Label = new BackgroundedLabel();
    cot2Label.addClasses("function-cot"); // adding CSS class by convention
    // assembling an object to store them all
    let labels = {
      sin: sinLabel,
      cos: cosLabel,
      tan1: tan1Label,
      tan2: tan2Label,
      cot1: cot1Label,
      cot2: cot2Label,
      tancot: [tan1Label, tan2Label, cot1Label, cot2Label],
    };
    // performing common operations
    for (let label of [sinLabel, cosLabel, tan1Label, tan2Label, cot1Label, cot2Label]) {
      label.addClasses("function-label"); // adding CSS class by convention
      // adding label elements to the graph
      this.#svg.appendChild(label.background);
      this.#svg.appendChild(label.foreground);
    }
    // assembling an object to hold on all the objects created & if function lines labels are shown
    this.#functionLinesHolder = {
      lines: lines,
      labels: labels,
      showLabels: false,
    };
  }

  /**
   * Intended to be used only on graph creation
   */
  #createConfigure() {
    if (!this.#svg.parentElement) {
      // svg has no parent element, what's the point?
      console.warn("Asked for a configure menu for SVG without a parent element, skipping");
      return;
    }

    let configure = document.createElement("details"); // configure menu parent element
    configure.classList.add("graph-configure"); // CSS class
    configure.style.position = "absolute"; // make it float on top of graph
    let summary = document.createElement("summary"); // this holds image visible while menu is not opened
    summary.classList.add("graph-configure-summary"); // CSS class
    let summaryImage = document.createElement("img"); // actual image
    summaryImage.classList.add("graph-configure-image"); // CSS class
    summary.appendChild(summaryImage);
    configure.appendChild(summary); // add image to parent
    let configureHeader = document.createElement("h1"); // this is a text that describes the program
    configureHeader.innerText = "Interactive trigonometry v1.0"; // TODO add versioning, I guess?
    configureHeader.classList.add("graph-configure-header"); // CSS class
    configure.appendChild(configureHeader); // add header to menu
    let configureContainer = document.createElement("div"); //  this is a main menu container
    configureContainer.classList.add("graph-configure-container"); // CSS class
    configure.appendChild(configureContainer); // add container to parent
    let languageLabel = document.createElement("label"); // this labels displays selected language text representation
    let languageId = `${this.#svg.id}_language`; // TODO THIS DEPENDS ON SVG HAVING ID BUT I SEE NO OTHER OPTION, OH WAIT I SEE ONE IT'S TERRIBLE
    languageLabel.setAttribute("for", languageId);
    configureContainer.appendChild(languageLabel); // add language label
    let languageIcon = document.createElement("img"); // this icon displays little globe so that it's more apparent to describe language
    languageIcon.classList.add("graph-configure-language-icon"); // CSS class
    languageLabel.appendChild(languageIcon); // add image to label
    let languageSelect = document.createElement("select"); // actual language selector
    languageSelect.setAttribute("id", languageId);
    languageSelect.classList.add("graph-configure-language-select"); // CSS class
    languageSelect.addEventListener("change", () => {
      // on change, update selected language
      this.changeLanguage(languageSelect.value);
    });
    LANGUAGES.forEach((language) => {
      // add option for each of the supported languages
      let option = document.createElement("option");
      option.innerHTML = language.name; // option text is language's name
      option.setAttribute("value", language.sp); // option value is language's spur (don't ask me why it's spur, I HAVE NO IDEA HELP)
      languageSelect.appendChild(option);
    });
    configureContainer.appendChild(languageSelect); // add language selection to the container
    let themeLabel = document.createElement("label"); // this label shows currently selected theme
    themeLabel.innerText = "Theme";
    let themeSelectId = `${this.#svg.id}_select_theme`; // TODO THIS DEPENDS ON SVG HAVING ID BUT I SEE NO OTHER OPTION, OH WAIT I SEE ONE IT'S TERRIBLE
    themeLabel.setAttribute("for", themeSelectId);
    themeLabel.classList.add("graph-configure-theme-label"); // CSS class
    configureContainer.appendChild(themeLabel); // add colors label to container
    let themeSelect = document.createElement("select"); // actual theme selector
    themeSelect.setAttribute("id", themeSelectId);
    themeSelect.classList.add("graph-configure-areacolors-select"); // CSS class
    themeSelect.addEventListener("change", () => {
      // on change, update selected theme
      this.#fireEvent("change-theme", { themeName: themeSelect.value });
    });
    THEME_NAMES.forEach((themeName) => {
      // for each of the supported themes
      let option = document.createElement("option");
      option.innerText = themeName; // option text is color scheme name
      option.setAttribute("value", themeName); // as well as option value
      themeSelect.appendChild(option);
    });
    configureContainer.appendChild(themeSelect); // add theme to container
    let selectedTheme = localStorage.getItem("themeName");
    if (selectedTheme) {
      themeSelect.value = selectedTheme; // update to selected theme, is there's any
    }
    let areaColorsLabel = document.createElement("label"); // this label shows currently selected color scheme
    areaColorsLabel.innerText = "Area colors";
    let colorsSelectId = `${this.#svg.id}_select_color`; // TODO THIS DEPENDS ON SVG HAVING ID BUT I SEE NO OTHER OPTION, OH WAIT I SEE ONE IT'S TERRIBLE
    areaColorsLabel.setAttribute("for", colorsSelectId);
    areaColorsLabel.classList.add("graph-configure-areacolors-label"); // CSS class
    configureContainer.appendChild(areaColorsLabel); // add colors label to container
    let areaColorsSelect = document.createElement("select"); // actual color scheme selector
    areaColorsSelect.setAttribute("id", colorsSelectId);
    areaColorsSelect.classList.add("graph-configure-areacolors-select"); // CSS class
    areaColorsSelect.addEventListener("change", () => {
      // on change, update selected colors
      this.changeAreaColorsLink(areaColorsSelect.value);
    });
    COLORS_NAMES.forEach((colorName) => {
      // for each of the supported color schemes
      let option = document.createElement("option");
      option.innerText = colorName; // option text is color scheme name
      option.setAttribute("value", colorName); // as well as option value
      areaColorsSelect.appendChild(option);
    });
    configureContainer.appendChild(areaColorsSelect); // add color selection to container
    let maskLabel = document.createElement("label");
    maskLabel.innerText = "Use mask";
    let useMaskId = `${this.#svg.id}_use_mask`; // TODO THIS DEPENDS ON SVG HAVING ID BUT I SEE NO OTHER OPTION, OH WAIT I SEE ONE IT'S TERRIBLE
    maskLabel.setAttribute("for", useMaskId);
    maskLabel.classList.add("graph-configure-mask-label"); // CSS class
    configureContainer.appendChild(maskLabel);
    let useMask = document.createElement("input"); // actual mask usage input
    useMask.setAttribute("type", "checkbox"); // it's a checkbox
    useMask.setAttribute("id", useMaskId);
    useMask.checked = Boolean(this.#zonesMask || false);
    useMask.addEventListener("change", () => {
      // on change, update if mask is visible
      this.useZoneMask(useMask.checked ?? false);
    });
    configureContainer.appendChild(useMask);

    this.#svg.parentElement.appendChild(configure);
  }

  /**
   * Adds child to graph's SVG and performs required operations
   * @param {SVGElement} child
   */
  addChild(child) {
    this.#svg.appendChild(child);
  }

  /**
   * Removes child from graph's SVG and performs required operations
   * @param {SVGElement} child
   */
  removeChild(child) {
    this.#svg.removeChild(child);
  }

  /**
   * Adds event listener for ITN-specific events
   * @param {String} eventName
   * @param {(event : CustomEvent) => void} eventHandler
   */
  addEventListenerITN(eventName, eventHandler) {
    // @ts-expect-error [I'm sure that all events fired as result of this listener addition, will be CustomEvent(s)]
    this.#eventDummy.addEventListener(`itn:grph:${eventName}`, eventHandler);
  }

  /**
   * Fires ITN specific event
   * @param {String} name Name of the event
   * @param {Object} detail
   * @param {boolean} cancellable
   * @returns {boolean} If event was NOT cancelled (if it can be cancelled), plain true otherwise
   */
  #fireEvent(name, detail = {}, cancellable = false) {
    return this.#eventDummy.dispatchEvent(
      new CustomEvent(`itn:grph:${name}`, {
        detail: detail,
        cancelable: cancellable,
      })
    );
  }

  /**
   * Checks if some graph component is enabled. By default, component is considered enabled, if it's "not falsy", i.e. not null or undefined
   * @param {?Object} component Component to check
   * @param {?String} message Message to log if component is not enabled.
   * @param {((object : ?Object) => boolean)} predicate Custom predicate to determine of component is enabled
   * @returns {boolean} True, isf component is enable, false otherwise
   */
  #assertEnabled(component, message = `field ${component} is not enabled!`, predicate = (object) => object) {
    if (predicate(component)) {
      return true;
    }
    // predicate returned false - tell about the problem
    console.error(message);
    console.error("(This message signifies bad API usage, or some other program issue, please contact the page author)");
    console.error("Graph object: ", this);
    console.trace("Stack trace: ");
    return false;
  }

  /**
   * Checks if sweed arc is present in this graph
   * @returns {boolean}
   */
  #assertHasSweep() {
    return this.#assertEnabled(this.#sweepArc, "Sweep arc is not enabled!");
  }

  /**
   * Checks if pointer is present in this graph
   * @returns {boolean}
   */
  #assertHasPointer() {
    return this.#assertEnabled(this.#pointersHolder, "Pointer is not enabled!");
  }

  /**
   * Checks if zones are present in this graph
   * @returns {boolean}
   */
  #assertHasZones() {
    return this.#assertEnabled(this.#functionZones, "Zones are not enabled!");
  }

  /**
   * Checks if function lines are present in this graph
   * @returns {boolean}
   */
  #assertHasFunclines() {
    return this.#assertEnabled(this.#functionLinesHolder, "Function lines are not enabled!");
  }

  /**
   * Helper function to siplify path generation
   * @param {Number} angle
   * @param {Number} distance
   * @returns {String} String representation of a point at angle {@link angle} and distance from origin {@link distance}
   */
  #getPathPoint(angle, distance) {
    return `${this.#x0 + distance * Math.cos(angle)} ${this.#y0 - distance * Math.sin(angle)}`;
  }

  /**
   * Starts sweep process, stops it, or clear a sweep arc in order
   * @param {Number} angle Angle to SWEEP TO
   * @param {((angle: Number, progress: Number) => void)} onStep Function to call on each frame of sweeping
   * @param {() => void} onComplete Function to all on sweep end
   * @returns {?boolean | undefined} Depending on sweep state:
   * - true, if sweep process started as a result of this call
   * - false, if sweep process has already finished, but arc's not removed
   * - null, if sweep process is in progress
   * - undefined if sweep is not supported for this graph
   */
  sweepTo(angle, onStep = () => {}, onComplete = () => {}) {
    if (!(this.#assertHasSweep() && this.#assertHasPointer())) {
      // there's no arc or no pointer present - sweep is not supported
      return;
    }
    // sweep is allowed
    if (this.#sweepProcessId) {
      // process id is not null - process is ongoing
      return null;
    }
    // sweep is not ongoing
    if (getVisibility(this.#sweepArc)) {
      // sweep has finished, but was not cleared
      return false;
    }
    // sweep must be performed now
    let currentSweepingAngle = this.selectedAngle; // we are now at a currently selected angle
    // I decode to write all points in path to the array, so that I could reveal arc one point at the time
    let path = [{ angle: currentSweepingAngle, pointString: `M ${this.#getPathPoint(currentSweepingAngle, this.#r0)} ` }]; // path begins here
    let sign = Math.sign(angle - currentSweepingAngle); // holds if target angle is greater or less than current one
    // @ts-expect-error [I've already handled this.#pointersHolder being null at the beginning]
    while (Math.abs(currentSweepingAngle - angle) > this.#pointersHolder.arc.da) {
      // while we are not close to the taget angle
      // @ts-expect-error [I've already handled this.#pointersHolder being null at the beginning]
      currentSweepingAngle += sign * this.#pointersHolder.arc.da; // increment angle a bit
      path.push({ angle: currentSweepingAngle, pointString: `L ${this.#getPathPoint(currentSweepingAngle, this.#r0)} ` }); // add new point to the array
    }
    path.push({ angle: angle, pointString: `L ${this.#getPathPoint(angle, this.#r0)} ` }); // add last point to the array, so that arc would end exactly where it's asked to
    // @ts-expect-error [I've already handled this.#sweepArc being null at the beginning]
    this.#sweepArc.setAttribute("d", ""); // reset arc's path
    // @ts-expect-error [I've already handled this.#sweepArc being null at the beginning]
    this.#sweepArc.setAttribute("visibility", "visible"); // make it visible
    // and now we have an empty arc! lets reveal it step-by-step
    let pointIndex = 0;
    this.#sweepProcessId = setInterval(() => {
      // on regular intervals
      let point = path[pointIndex];
      // @ts-expect-error [I've already handled this.#sweepArc being null at the beginning]
      this.#sweepArc.setAttribute("d", this.#sweepArc.getAttribute("d") + point.pointString); // append arc's path
      this.selectedAngle = point.angle; // set the selected angle
      onStep(point.angle, pointIndex / path.length); // callback for a step
      pointIndex++; // increment point's index
      if (pointIndex >= path.length) {
        // points array has ended
        this.sweepStop(); // remove the process
        onComplete(); // call about completion
      }
    }, 1000 / SWEEP_FPS);
    // sweep started
    return true;
  }

  /**
   * Attempts to stop sweeping process. Does nothing if there's none
   * @returns {boolean | undefined} If sweep process was stopped as a result of this call, or undefined if sweep is not supported by this graph
   */
  sweepStop() {
    if (!this.#assertHasSweep()) {
      // sweep is not supported
      return;
    }
    if (this.#sweepProcessId === null) {
      // no sweep process is going
      return false;
    }
    // sweep is happening
    clearInterval(this.#sweepProcessId); // stop the process
    this.#sweepProcessId = null; // remove the id
    return true; // sweep was stopped
  }

  /**
   * Removes (hides) sweep arc, stopping any sweep process if there's any
   */
  sweepRemove() {
    if (!this.#assertHasSweep()) {
      return;
    }
    this.sweepStop(); // stop the process, if there's any
    setVisibility(this.#sweepArc, false); // hide the arc
  }

  /**
   * Adds zone to this graph and any provided guidelines
   * @param {FunctionZone} zone
   * @param {Guideline[]} guidelines
   */
  addZone(zone, guidelines = []) {
    if (!this.#assertHasZones()) {
      // no zones for this graph
      return;
    }
    zone.initVisual(this); // create zone's visual element
    if (!(zone.zoneObject instanceof SVGElement)) {
      // zone object was not initialised or was initialies incorrectly, abort zone addition
      return;
    }
    let typeIndex = zone.typeIndex;
    let functionIndex = zone.functionIndex;
    if (this.#functionZones[typeIndex][functionIndex]) {
      // zone of the same type present, remove it
      this.removeZone(typeIndex, functionIndex);
    }
    this.#svg.appendChild(zone.zoneObject); // add zone's object to graph TODO probably shoould move this code to zone
    guidelines.forEach(this.addGuideline, this); // add guidelines
    let zoneCompound = { zone: zone, guidelines: guidelines, colorIndex: null }; // represents newly created zone
    this.#functionZones[typeIndex][functionIndex] = zoneCompound; // add zone and it's guidelines to array for zones
    this.#colorZone(zoneCompound); // assign color to a zone
    if (this.#zonesMask) {
      // zone mask should be used, add it:
      zone.zoneObject.setAttribute("mask", this.#zonesMask);
    }
  }

  /**
   * Makes corresponding zone highlighted
   * @param {Number} typeIndex
   * @param {Number} functionIndex
   */
  highlightZone(typeIndex, functionIndex) {
    if (!this.#assertHasZones()) {
      // zones are not enabled
      return;
    }
    this.#functionZones[typeIndex][functionIndex]?.zone.highlight();
  }

  /**
   * Makes corresponding zone dehighlighted
   * @param {Number} typeIndex
   * @param {Number} functionIndex
   */
  dehighlightZone(typeIndex, functionIndex) {
    if (!this.#assertHasZones()) {
      // zones are not enabled
      return;
    }
    this.#functionZones[typeIndex][functionIndex]?.zone.dehighlight();
  }

  /**
   * Removes zone and it's guidelines from this graph
   * @param {Number} typeIndex
   * @param {Number} functionIndex
   */
  removeZone(typeIndex, functionIndex) {
    if (!this.#assertHasZones()) {
      // zones are not enabled
      return;
    }
    let zoneCompound = this.#functionZones[typeIndex][functionIndex];
    if (!zoneCompound) {
      // no zone of this type - nothing to do
      return;
    }
    if (zoneCompound.zone.zoneObject) {
      this.#svg.removeChild(zoneCompound.zone.zoneObject); // remove zone's object
    }
    zoneCompound.guidelines.forEach(this.removeGuideline, this); // remove zone's guidelines
    this.#deColorZone(zoneCompound); // remove color from this zone
    this.#functionZones[typeIndex][functionIndex] = null; // remove zone of this type
  }

  /**
   * Removes all zones currently repsent on graph
   */
  removeAllZones() {
    if (!this.#assertHasZones()) {
      // zones are not enabled
      return;
    }
    // regular iteration over all possible zones
    for (let typeIndex = 0; typeIndex < ZONE_TYPE_NAMES.length; typeIndex++) {
      for (let functionIndex = 0; functionIndex < FUNCTION_NAMES.length; functionIndex++) {
        this.removeZone(typeIndex, functionIndex);
      }
    }
  }

  /**
   * @param {InteractiveTrigonometryState} state State load settings from
   */
  setState(state) {
    this.pointerVisible = state.angle.pointer ?? true;
    this.xMirrorVisible = state.angle.mirrorX ?? true;
    this.yMirrorVisible = state.angle.mirrorY ?? true;
    this.pointerLabelVisible = state.angle.pointerLabel ?? false;
    this.#updatePointerLabel();
    this.selectedAngle = state?.angle?.selectedAngle ?? 0;
    this.showFunctionline("sin", state.functions.showSin ?? false);
    this.showFunctionline("cos", state.functions.showCos ?? false);
    this.showFunctionline("tan", state.functions.showTan ?? false);
    this.showFunctionlabels = state.functions.funcLabels ?? false;
    this.updateFunclines();
  }

  /**
   * Compiles this graph's present zones as a zonesDataArray suitable for state persistence
   * @returns {(?String)[][]}
   */
  #getZonesDataArray() {
    let areasDataArray = [];
    for (let typeIndex in this.#functionZones) {
      areasDataArray[typeIndex] = [];
      for (let functionIndex in this.#functionZones[typeIndex]) {
        let zoneCompound = this.#functionZones[typeIndex][functionIndex];
        if (!zoneCompound) {
          // no area of this type - set cell to null
          areasDataArray[typeIndex][functionIndex] = null;
          continue;
        }
        // area present - extract value
        areasDataArray[typeIndex][functionIndex] = zoneCompound.zone.literal ?? "0"; // if zone has literal, just write 0
      }
    }
    return areasDataArray;
  }

  /**
   * @param {InteractiveTrigonometryState} state State to write settings to. Defaults to new {@link InteractiveTrigonometryState} object
   * @returns {InteractiveTrigonometryState} State that has this graph's settings set
   */
  getState(state = new InteractiveTrigonometryState()) {
    state.angle.pointer = getVisibility(this.#pointersHolder?.original);
    state.angle.mirrorX = getVisibility(this.#pointersHolder?.xMirror);
    state.angle.mirrorY = getVisibility(this.#pointersHolder?.yMirror);
    state.angle.pointerLabel = this.pointerLabelVisible;
    state.angle.selectedAngle = this.selectedAngle;
    state.functions.showSin = getVisibility(this.#functionLinesHolder?.lines.sin);
    state.functions.showCos = getVisibility(this.#functionLinesHolder?.lines.cos);
    state.functions.showTan = getVisibility(this.#functionLinesHolder?.lines.tan);
    state.functions.funcLabels = this.#functionLinesHolder?.showLabels;
    state.functions.zonesData = this.#getZonesDataArray();
    return state;
  }

  /**
   * Fires an event for controller to snap supplied angle to some guideline to it's liking
   * @param {Number} angle Angle to use. Defaults to {@link selectedAngle}
   * @returns {Number} New angle value, whether it did snap or not
   */
  snapAngle(angle = this.selectedAngle) {
    this.#fireEvent("selected-angle-snap", { angle: angle, setter: (/** @type {Number} */ newAngle) => (angle = newAngle) }, true);
    // event it set to be cancellable to guarantee it's handled synchronously
    return angle;
  }

  /**
   * Fires and event that must be cancelled to allow overwind
   * @returns {boolean} True if overwind is enabled
   */
  #overwindEnabled() {
    return !this.#fireEvent("overwind-enabled", {}, true);
  }

  /**
   * GRAPH MUST HAVE A POINTER.
   * Generates and assigns appropriate path to pointer arc.
   * @param {Number} angle Angle to use. Defaults to {@link selectedAngle}
   */
  #generatePointerArc(angle = this.selectedAngle) {
    /** @type {PointersHolder} */
    // @ts-expect-error [this.#pointersHolder is not null, as this method is only called if pointer is present]
    let pointersHolder = this.#pointersHolder; // TODO remove this bloat in TS
    let currentAngle = 0; // path starts at angle 0
    let sign = Math.sign(angle); // holds if pointer arc goes to positive on negative direction
    let rad = pointersHolder.arc.dr; // arc radius starts as this value
    let path = `M ${this.#getPathPoint(currentAngle, rad)} `; // here will be path we're generating
    let dGrow = pointersHolder.arc.radGrow * pointersHolder.arc.da * pointersHolder.arc.dr; // by how much radius must change at each step
    let overwindEnabled = this.#overwindEnabled(); // if angle overwind is enabled (i.e. if we must increase the radius)
    while (Math.abs(currentAngle - angle) > pointersHolder.arc.da) {
      // while current angle it far enough from pointer's angle
      currentAngle += sign * pointersHolder.arc.da; // increment it
      if (overwindEnabled) {
        // if overwind os enabled
        rad += dGrow; // increase a radius by bit
        dGrow *= 0.999; // descrease the increment. this gives a nice damping
      }
      path += `L ${this.#getPathPoint(currentAngle, rad)} `; // append the path
    }
    path += `L ${this.#getPathPoint(angle, rad)} `; // one last point for arc to end exactly on pointer
    pointersHolder.arc.path.setAttribute("d", path);
  }

  /**
   * Sets value of a pointer label if one exists and is visible
   * @param {String} value
   */
  setPointerLabelValue(value) {
    if (this.#pointersHolder?.label && getVisibility(this.#pointersHolder.label)) {
      // pointer label exists and is visible
      this.#pointersHolder.label.setText(value);
    }
  }

  /**
   * Fires event so that someone else could call {@link this.setPointerLabelValue}
   * @param {Number} angle Angle to use. Defaults to {@link selectedAngle}
   * @returns {boolean} True, if noone did so
   */
  #askToSetPointerLabel(angle) {
    return this.#fireEvent("pointer-label-set", { angle: angle }, true);
  }

  /**
   * Updates the value of a pointer label.
   * @param {Number} angle Angle to use. Defaults to {@link selectedAngle}
   */
  #updatePointerLabelValue(angle = this.selectedAngle) {
    if (this.#askToSetPointerLabel(angle)) {
      this.setPointerLabelValue(angle.toFixed(2));
    }
  }

  /**
   * Moves pointer label and updates it's value
   * @param {Number} angle Angle to use. Defaults to {@link selectedAngle}
   */
  #updatePointerLabel(angle = this.selectedAngle) {
    this.#pointersHolder?.label.setPosition(
      this.#x0 + POINTER_LABEL_POSITION * this.#r0 * Math.cos(angle),
      this.#y0 - POINTER_LABEL_POSITION * this.#r0 * Math.sin(angle)
    );
    this.#updatePointerLabelValue(angle);
  }

  /**
   * Updates positions of function labels
   * @param {Number} angle Angle to use. Defaults to {@link selectedAngle}
   */
  updateFuncLabels(angle = this.selectedAngle) {
    if (!this.#assertHasFunclines()) {
      // no funclines for this graph - nothing to do
      return;
    }
    /** @type {FunctionLinesHolder} */
    // @ts-expect-error [I guaranteed that this.#functionLinesHolder is not null as assertion has passed]
    let functionLinesHolder = this.#functionLinesHolder; // TODO remove this bloat in TS
    if (!functionLinesHolder.showLabels) {
      // labels are not shown
      setVisibility(functionLinesHolder.labels.sin, false);
      setVisibility(functionLinesHolder.labels.cos, false);
      setVisibility(functionLinesHolder.labels.tan1, false);
      setVisibility(functionLinesHolder.labels.tan2, false);
      setVisibility(functionLinesHolder.labels.cot1, false);
      setVisibility(functionLinesHolder.labels.cot2, false);
      return; // nothing to do anymore
    }
    // labels are shown
    let showSinLabel = getVisibility(functionLinesHolder.lines.sin);
    let showCosLabel = getVisibility(functionLinesHolder.lines.cos);
    let showTanLabel = getVisibility(functionLinesHolder.lines.tan);
    // TODO following positioning looks kinda random, definitely need to refactor that somehow...
    if (showSinLabel) {
      functionLinesHolder.labels.sin.transform = `translate(${
        this.#x0 + this.#r0 * Math.cos(angle) + 0.1 * this.#r0 * Math.cos(2 * angle)
      }px, ${this.#y0 - (this.#r0 * Math.sin(angle)) / 2}px)`;
    }
    if (showCosLabel) {
      functionLinesHolder.labels.cos.transform = `translate(${this.#x0 + (this.#r0 * Math.cos(angle)) / 2}px, ${
        this.#y0 - this.#r0 * Math.sin(angle) - 0.05 * this.#r0 * Math.cos(2 * angle)
      }px)`;
    }
    if (showTanLabel) {
      functionLinesHolder.labels.tan1.transform = `translate(${this.#x0 + 1.2 * this.#r0 * Math.cos(angle - 0.15)}px, ${
        this.#y0 - 1.2 * this.#r0 * Math.sin(angle - 0.1)
      }px)`;

      functionLinesHolder.labels.tan2.transform = `translate(${this.#x0 - 1.2 * this.#r0 * Math.cos(angle - 0.15)}px, ${
        this.#y0 + 1.2 * this.#r0 * Math.sin(angle - 0.1)
      }px)`;

      functionLinesHolder.labels.cot1.transform = `translate(${this.#x0 + 1.2 * this.#r0 * Math.cos(angle + 0.15)}px, ${
        this.#y0 - 1.2 * this.#r0 * Math.sin(angle + 0.1)
      }px)`;

      functionLinesHolder.labels.cot2.transform = `translate(${this.#x0 - 1.2 * this.#r0 * Math.cos(angle + 0.15)}px, ${
        this.#y0 + 1.2 * this.#r0 * Math.sin(angle + 0.1)
      }px)`;
    }
    setVisibility(functionLinesHolder.labels.sin, showSinLabel);
    setVisibility(functionLinesHolder.labels.cos, showCosLabel);
    setVisibility(functionLinesHolder.labels.tan1, showTanLabel);
    setVisibility(functionLinesHolder.labels.tan2, showTanLabel);
    setVisibility(functionLinesHolder.labels.cot1, showTanLabel);
    setVisibility(functionLinesHolder.labels.cot2, showTanLabel);
  }

  /**
   * Updates positions of function lines as well as their labels
   * @param {Number} angle Angle to use. Defaults to {@link selectedAngle}
   */
  updateFunclines(angle = this.selectedAngle) {
    if (!this.#assertHasPointer()) {
      // no pointer for this graph - nothing to do
      return;
    }
    /** @type {PointersHolder} */
    // @ts-expect-error [this.#pointersHolder is not null, as assertion call has passed]
    let pointersHolder = this.#pointersHolder; // TODO remove this bloat in TS
    if (!this.#assertHasFunclines()) {
      // no funclines for this graph - nothing to do
      return;
    }
    /** @type {FunctionLinesHolder} */
    // @ts-expect-error [I guaranteed that this.#functionLinesHolder is not null as assertion has passed]
    let functionLinesHolder = this.#functionLinesHolder; // TODO remove this bloat in TS
    if (getVisibility(functionLinesHolder.lines.sin)) {
      // sinline visible
      functionLinesHolder.lines.sin.style.transform = `translate(${this.#r0 * Math.cos(angle)}px, 0px) scale(1.0, ${Math.sin(angle)})`;
    }
    if (getVisibility(functionLinesHolder.lines.cos)) {
      // cosline visible
      functionLinesHolder.lines.cos.style.transform = `translate(0px, ${-this.#r0 * Math.sin(angle)}px) scale(${Math.cos(angle)}, 1.0)`;
    }
    if (getVisibility(functionLinesHolder.lines.tan)) {
      // tanline visible
      functionLinesHolder.lines.tan.style.rotate = pointersHolder.original.line.style.rotate;
    }
    this.updateFuncLabels(angle);
  }

  /**
   * @returns {Number} Angle this graph's pointer is currently at, or 0 if pointer is not present
   */
  get selectedAngle() {
    return this.#pointersHolder?.original?.angle ?? 0;
  }

  /**
   * Sets an angle this graph's pointer is currently at.
   * List of operations it peforms:
   * - handles snapping & overwind
   * - sets angle to pointer & it's mirrors
   * - generates angle pointer arc
   * - moves pointer label
   * - moves and updates function lines
   * @param {Number} angle
   */
  set selectedAngle(angle) {
    if (!this.#assertHasPointer()) {
      // no pointer for this graph - nothing to do
      return;
    }
    /** @type {PointersHolder} */
    // @ts-expect-error [this.#pointersHolder is not null, as assertion call has passed]
    let pointersHolder = this.#pointersHolder; // TODO remove this bloat in TS
    // snapping & overwind
    angle = this.snapAngle(angle);
    // windcount change signaling
    if (Math.floor(angle / (PIx2 + 1e-4)) !== Math.floor(this.selectedAngle / (PIx2 + 1e-4))) {
      // angle is crossing a 0-360 line
      // these 1e-4 things are needed for this to trigger even on angle=2PI and angle=0
      this.#fireEvent("windcount-change", { angle: angle, changeUp: angle > this.selectedAngle });
    }
    // set angle to pointer and it's mirrors
    pointersHolder.original.angle = angle;
    if (getVisibility(pointersHolder.xMirror)) {
      pointersHolder.xMirror.angle = -angle;
    }
    if (getVisibility(pointersHolder.yMirror)) {
      pointersHolder.yMirror.angle = PI - angle;
    }
    if (getVisibility(pointersHolder.xyMirror)) {
      pointersHolder.xyMirror.angle = angle - PI;
    }
    this.#generatePointerArc(angle);
    if (this.pointerLabelVisible) {
      this.#updatePointerLabel(angle);
    }
    if (this.#functionLinesHolder) {
      // function lines are present, safe to call
      this.updateFunclines(angle);
    }
    // Setting off an event, so that everyone can update their fields, if nesessary.
    this.#fireEvent("selected-angle-set", { angle: angle });
  }

  /**
   * Resets selected angle, as if user clicks on the same spot pointer is at now
   */
  reSetSelectedAngle() {
    this.selectedAngle = Number(this.selectedAngle);
  }

  /**
   * Sets visibility to guideline labels (and little dots on a circle, if one present)
   * @param {Guideline[]} labelsToShow Guidelines that must have their labels shown
   * @param {Guideline[]} labelsToHide Guidelines that must have their labels hidden
   * @param {boolean} visibility If set to false, two previous arguments are effectively swapped
   */
  setGuidelineLabelsVisibile(labelsToShow, labelsToHide = [], visibility = true) {
    labelsToShow.forEach((guideline) => {
      setVisibility(guideline.label, visibility);
      setVisibility(guideline.point, visibility);
    });
    labelsToHide.forEach((guideline) => {
      setVisibility(guideline.label, !visibility);
      setVisibility(guideline.point, !visibility);
    });
  }

  /**
   * Sets visibility to guideline ticks
   * @param {Guideline[]} ticksToShow Guidelines that must have their labels shown
   * @param {Guideline[]} ticksToHide Guidelines that must have their labels hidden
   * @param {boolean} visibility If set to false, two previous arguments are effectively swapped
   */
  setGuidelineTicksVisibile(ticksToShow, ticksToHide = [], visibility = true) {
    ticksToShow.forEach((guideline) => setVisibility(guideline.tick, visibility));
    ticksToHide.forEach((guideline) => setVisibility(guideline.tick, !visibility));
  }

  /**
   * @param {boolean} visibility
   */
  set pointerLabelVisible(visibility) {
    setVisibility(this.#pointersHolder?.label, visibility);
    if (visibility) {
      this.#updatePointerLabel();
    }
  }

  /**
   * @returns {boolean}
   */
  get pointerLabelVisible() {
    return getVisibility(this.#pointersHolder?.label);
  }

  /**
   * @param {boolean} enabled
   */
  set mirrorXEnabled(enabled) {
    if (!this.#pointersHolder) {
      // no pointers - return immideately
      return;
    }
    // pointers exist
    setVisibility(this.#pointersHolder?.xMirror, enabled);
    setVisibility(this.#pointersHolder?.xyMirror, enabled && getVisibility(this.#pointersHolder?.yMirror));
    if (enabled) {
      // x mirror visible
      let angle = this.selectedAngle;
      this.#pointersHolder.xMirror.angle = -angle;
      if (getVisibility(this.#pointersHolder.yMirror)) {
        // xy mirror visible
        this.#pointersHolder.xyMirror.angle = angle - PI;
      }
    }
  }

  /**
   * @param {boolean} enabled
   */
  set mirrorYEnabled(enabled) {
    if (!this.#pointersHolder) {
      // no pointers - return immideately
      return;
    }
    // pointers exist
    setVisibility(this.#pointersHolder.yMirror, enabled);
    setVisibility(this.#pointersHolder.xyMirror, enabled && getVisibility(this.#pointersHolder?.xMirror));
    if (enabled) {
      // y mirror visible
      let angle = this.selectedAngle;
      this.#pointersHolder.yMirror.angle = PI - angle;
      if (getVisibility(this.#pointersHolder.xMirror)) {
        // xy mirror visible
        this.#pointersHolder.xyMirror.angle = angle - PI;
      }
    }
  }

  /**
   * Sets visibility to a specified function line
   * @param {String} functionName Function name. Mut be contained in {@link FUNCTION_NAMES}
   * @param {boolean} show Whether function line this this name should be shown
   */
  showFunctionline(functionName, show) {
    if (!this.#assertHasFunclines()) {
      // no funclines for this graph
      return;
    }
    if (!(functionName in FUNCTION_INDEXES)) {
      // no function with this name
      return;
    }
    let functionIndex = FUNCTION_INDEXES[functionName];
    /** @type {FunctionLinesHolder} */
    // @ts-expect-error [I guaranteed that this.#functionLinesHolder is not null as assertion has passed]
    let functionLinesHolder = this.#functionLinesHolder; // TODO remove this bloat in TS
    if (functionIndex == 3) {
      // no separate line for cot, so use tan line instead
      functionIndex = 2;
    }
    setVisibility(functionLinesHolder.lines[functionName], show); // set visibility to line
    if (functionIndex == 2) {
      // tangent line has more labels than 1
      functionLinesHolder.labels["tancot"].forEach((label) => setVisibility(label, show && functionLinesHolder.showLabels)); // set visiblity to all tangent labels
    } else {
      // all other lines have exactly 1
      setVisibility(functionLinesHolder.labels[functionName], show); // set visiblity to function label
    }
  }

  /**
   * Sets visibility of function line's labels
   * @param {boolean} show
   */
  set showFunctionlabels(show) {
    if (!this.#assertHasFunclines()) {
      // no funclines for this graph
      return;
    }
    // @ts-expect-error [I guaranteed that this.#functionLinesHolder is not null as assertion has passed]
    this.#functionLinesHolder.showLabels = show; // set field
    this.updateFunclines(); // update lines (so that filed change can be reacted to)
  }

  /**
   * Sets function line's VISIBLE labels content using provided function
   * @param {(functionName: String) => String} contentProvider Function that's used to generate content for function lines
   */
  updateFuncLabelsContent(contentProvider) {
    if (!this.#assertHasFunclines()) {
      // no funclines for this graph
      return;
    }
    /** @type {FunctionLinesHolder} */
    // @ts-expect-error [I guaranteed that this.#functionLinesHolder is not null as assertion has passed]
    let functionLinesHolder = this.#functionLinesHolder; // TODO remove this bloat in TS
    if (!functionLinesHolder.showLabels) {
      // all labels are not shown, ignore the call
      return;
    }
    // labels are shown if their respective line is visible
    if (getVisibility(functionLinesHolder.lines.sin)) {
      // sinlabel visible
      functionLinesHolder.labels.sin.setText(contentProvider("sin"));
    }
    if (getVisibility(functionLinesHolder.lines.cos)) {
      // coslabel visible
      functionLinesHolder.labels.cos.setText(contentProvider("cos"));
    }
    if (getVisibility(functionLinesHolder.lines.tan)) {
      // tanlabels visible
      let tanContent = contentProvider("tan");
      functionLinesHolder.labels.tan1.setText(tanContent);
      functionLinesHolder.labels.tan2.setText(tanContent);
      let cotContent = contentProvider("cot");
      functionLinesHolder.labels.cot1.setText(cotContent);
      functionLinesHolder.labels.cot2.setText(cotContent);
    }
  }

  /**
   * Assigns color to a zone and it's guidelines
   * @param {ZoneCompound} zoneCompound
   */
  #colorZone(zoneCompound) {
    /** @type {?String} zone color string representation */
    let color = null;
    /** @type {?Number} zone color index */
    let colorIndex = zoneCompound.colorIndex;
    if (colorIndex !== null) {
      // zone already has an asigned color - use it
      color = this.#zoneColorList[colorIndex].color;
    }
    if (!color || colorIndex === null) {
      // color was not yet assigned or is no longer valid
      // let's find new color for zone!
      let numberOfColors = this.#zoneColorList.length;
      for (let index = 0; index < numberOfColors; index++) {
        // for each of currently available colors,
        let colorCompound = this.#zoneColorList[index];
        if (!colorCompound.zoneCompound || colorCompound.zoneCompound === zoneCompound) {
          // this color has no zone assigned to it yet, or it's actually this zone's color
          color = colorCompound.color;
          zoneCompound.colorIndex = colorIndex = index; // assign color to zone
          break; // color found - break the loop
        }
      }
      if (!color || colorIndex === null) {
        // no color for this zone. this can only happed if there are not enough color specified
        // warn about it
        console.warn("Could not find color for zone ", zoneCompound);
        return;
      }
    }
    this.#zoneColorList[colorIndex].zoneCompound = zoneCompound; // assign zone to color
    // zone certainly has a color now
    this.#recolorZone(zoneCompound); // visually color zone
  }

  /**
   * Recolors all present zones
   */
  recolorZones() {
    this.#functionZones.forEach((row) =>
      row.forEach((zone) => {
        if (zone) {
          this.#colorZone(zone); // zone is present - recolor it
        }
      })
    );
  }

  /**
   * Removes color from a present zone
   * @param {ZoneCompound} zoneCompound
   */
  #deColorZone(zoneCompound) {
    let colorIndex = zoneCompound.colorIndex;
    if (colorIndex === null) {
      // color index was not set for this zone or is lost
      // let's check all the colors, just to be sure
      let numberOfColors = this.#zoneColorList.length;
      for (let index = 0; index < numberOfColors; index++) {
        let colorCompound = this.#zoneColorList[index];
        if (colorCompound.zoneCompound === zoneCompound) {
          // yeah, this color is assigned to our zone...
          colorIndex = index;
          break;
        }
      }
      if (colorIndex === null) {
        // no color assigned to zone - nothing to do
        return;
      }
    }
    // color is assigned. redo that
    this.#zoneColorList[colorIndex].zoneCompound = null;
    zoneCompound.colorIndex = null;
    this.#fireEvent("zone-cell-color", {
      color: "transparent",
      typeIndex: zoneCompound.zone.typeIndex,
      functionIndex: zoneCompound.zone.functionIndex,
    }); // notify controller to make "active zone" cell thing transparent again
  }

  /**
   * Loads zone colors from document's styles. Those must have a name like "--itn-ac[somenumber]" where somenumber are subsequent integers. May contain as many colors as you want, just make sure to provide enough to cover all possible zone types. [Example](../zone-colors/default.css)
   */
  loadZoneColors() {
    this.#zoneColorList = []; // reset colors list
    let style = window.getComputedStyle(document.documentElement); // style of the current document
    let currentColorIndex = 1;
    /** @type {String} String representation of a color */
    let color;
    while ((color = style.getPropertyValue(`--itn-ac${currentColorIndex}`))) {
      // while there is a next color in styles
      this.#zoneColorList.push({ color: color, zoneCompound: null }); // add one more color to the list
      currentColorIndex++;
    }
  }

  /**
   * Assigns color of the zone to it's visual elements
   * @param {ZoneCompound} zoneCompound
   * @returns
   */
  #recolorZone(zoneCompound) {
    /** @type {ColorCompound | undefined} colorCompound of the zone or undefined, if zone has no color or it's color index is not present in the colors array */
    let colorCompound = this.#zoneColorList[zoneCompound.colorIndex ?? -1];
    if (zoneCompound.colorIndex === null || !colorCompound) {
      console.warn("No color for zone", zoneCompound);
      // zone has no color
      return;
    }
    // zone has a valid color
    zoneCompound.zone.color = colorCompound.color; // Assign color to zone's visual element
    // @ts-expect-error [Lol, why would colorCompound possibly be undefined? Like, TS literaly says it's of type ColorCompound without a doublt if you place it somewhere here]
    zoneCompound.guidelines.forEach((guideline) => (guideline.color = colorCompound.color)); // assign color to zone's guidelines
    this.#fireEvent("zone-cell-color", {
      color: colorCompound.color,
      typeIndex: zoneCompound.zone.typeIndex,
      functionIndex: zoneCompound.zone.functionIndex,
    }); // set out an event, so that any controller could color it's "active zone" cell thing
  }

  /**
   * Sets content to a guideline labels from a guideline set that exist and are visible
   * @param {Guideline[]} guidelines Guideline set to use
   * @param {(guideline: Guideline) => String} contentProvider Content provider to get content
   */
  setGuidelineLabelsContent(guidelines, contentProvider) {
    guidelines
      .filter((guideline) => guideline.label instanceof SVGTextElement && getVisibility(guideline.label)) // only set labels that exist and are visible
      // @ts-expect-error [guideline.label is an SVG text element, as I used this as a filter condition]
      .forEach((guideline) => (guideline.label.innerHTML = contentProvider(guideline))); // get and set content for these labels
  }

  /**
   * @param {boolean} use If mask should be used for this graph's zones
   */
  useZoneMask(use) {
    this.#zonesMask = use ? "url(#zones_mask)" : null;
    localStorage.setItem(`${this.#svg.id}_usesmask`, String(use)); // TODO THIS DEPENDS ON SVG HAVING ID BUT I SEE NO OTHER OPTION, OH WAIT I SEE ONE IT'S TERRIBLE
    this.remaskZones();
  }

  /**
   * Checks is zones mask must be applied for this graph and updates present zones attribute
   */
  remaskZones() {
    /** @type {(zoneCompound: ?ZoneCompound) => void} Setter function that must set mask attribute if mask should be applied and remove mask attribute if mask should not be applied */
    let maskSetter = this.#zonesMask
      ? (zoneCompound) => zoneCompound?.zone?.zoneObject?.setAttribute("mask", maskAttr)
      : (zoneCompound) => zoneCompound?.zone?.zoneObject?.removeAttribute("mask");
    let maskAttr = this.#zonesMask ?? ""; // attribute must be zone mask url if mask's used and empty string if not
    this.#functionZones.forEach((row) => row.forEach(maskSetter));
  }

  /**
   * Adds a guideline to this graph
   * @param {Guideline} guideline
   */
  addGuideline(guideline) {
    guideline.initVisual(this); // initialise and add guideline's visual elements to this graph
  }

  /**
   * Removes guideline from this graph
   * @param {Guideline} guideline
   */
  removeGuideline(guideline) {
    guideline.removeVisual(this);
  }

  /**
   * Updates user preference for a zones colorset and fires corresponding event
   * @param {String} areaColorsName
   */
  changeAreaColorsLink(areaColorsName) {
    localStorage.setItem(`${this.#svg.id}_areaColorsName`, areaColorsName); // TODO THIS DEPENDS ON SVG HAVING ID BUT I SEE NO OTHER OPTION, OH WAIT I SEE ONE IT'S TERRIBLE
    this.#fireEvent("change-zone-colors", { colorsName: areaColorsName });
  }

  /**
   * Uses local storage to load user-preferred colorset
   */
  loadUserSavedColors() {
    let savedColorsName = localStorage.getItem(`${this.#svg.id}_areaColorsName`) || localStorage.getItem("areaColorsName"); // TODO THIS DEPENDS ON SVG HAVING ID BUT I SEE NO OTHER OPTION, OH WAIT I SEE ONE IT'S TERRIBLE
    if (!savedColorsName) {
      // no user-preferred colorset, nothing to do
      return;
    }
    this.changeAreaColorsLink(savedColorsName); // change colors to user-preferred
    let colorsSelect = document.getElementById(`${this.#svg.id}_select_color`); // this must be a color selection element // TODO THIS DEPENDS ON SVG HAVING ID BUT I SEE NO OTHER OPTION, OH WAIT I SEE ONE IT'S TERRIBLE
    if (colorsSelect instanceof HTMLSelectElement) {
      // colors selection element exists - set it's value to one that user did select
      colorsSelect.value = savedColorsName;
    }
  }

  /**
   * Updates user preference for a language and fires corresponding event
   * @param {String} languageLocale
   */
  changeLanguage(languageLocale) {
    localStorage.setItem(`${this.#svg.id}_language`, languageLocale); // save user preference // TODO THIS DEPENDS ON SVG HAVING ID BUT I SEE NO OTHER OPTION, OH WAIT I SEE ONE IT'S TERRIBLE
    this.#fireEvent("change-language", { language: languageLocale });
  }

  /**
   * @param {boolean} visible
   */
  set pointerVisible(visible) {
    setVisibility(this.#pointersHolder?.original, visible ?? true);
    setVisibility(this.#pointersHolder?.arc.path, visible ?? true);
  }

  /**
   * @param {boolean} visible
   */
  set xMirrorVisible(visible) {
    setVisibility(this.#pointersHolder?.xMirror, visible ?? false);
    setVisibility(this.#pointersHolder?.xyMirror, (visible && getVisibility(this.#pointersHolder?.yMirror)) ?? false);
  }

  /**
   * @param {boolean} visible
   */
  set yMirrorVisible(visible) {
    setVisibility(this.#pointersHolder?.yMirror, visible ?? false);
    setVisibility(this.#pointersHolder?.xyMirror, (getVisibility(this.#pointersHolder?.xMirror) && visible) ?? false);
  }

  /**
   * Wrapper for a private field, so it won't get changed
   * @returns {Number}
   */
  get x0() {
    return this.#x0;
  }

  /**
   * Wrapper for a private field, so it won't get changed
   * @returns {Number}
   */
  get y0() {
    return this.#y0;
  }

  /**
   * Wrapper for a private field, so it won't get changed
   * @returns {Number}
   */
  get r0() {
    return this.#r0;
  }
}
