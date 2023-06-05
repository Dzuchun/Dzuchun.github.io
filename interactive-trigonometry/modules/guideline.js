// @ts-check
import { Graph } from "./graph.js";
import { setVisibility, createLineToAngle } from "./../../modules/util.js";

/**
 * This class represents guideline data and it's svg elements
 */
export default class Guideline {
  /** @type {boolean | SVGLineElement} Line svg element or a flag that determines if one should be created */
  line;
  /** @type {boolean | SVGCircleElement } Little point at the trig circle or a flag that determines if one should be created */
  point;
  /** @type {boolean | SVGTextElement } Label svg element or a flag that determines if one should be created */
  label;
  /** @type {?SVGLineElement} Tick svg element. Should appear only if this guideline is active */
  tick;
  /** @type {boolean} A flag determining if guideline is active or not. False by default. */
  active = false;
  /** @type {String[]} CSS class names to assign guideline's visual elements on creation */
  classes;

  /** @type {Number} Angle value in radians (used for snapping and drawing) */
  angle;
  /** @type {Object} Object containing literal angle representations */
  literalAngle;
  /** @type {Object} Object containing literal functions values representation */
  literalFunction;
  /** @type {Object} Object containing literal functions values for tex representation */
  texFunction;

  /** @type {?Number} Zone type index this line is added for */
  typeIndex;
  /** @type {?Number} Function index this line is added for */
  functionIndex;

  /**
   * @param {Object} data Object contatining guideline data. See array of examples [here](../data/default-guidelines.json)
   * @param {String[]} classes List of CSS class names to be added to all guideline's visual elements
   * @param {?Graph} graph Graph to use for visual elements creation. Mey be ommited, bu visual elements will not be created in this case
   * @param {boolean} line Flag determining, if this guideline should have visual line from the origin to circle
   * @param {boolean} point Flag determining, if this guideline should have little point on the circle at it's position
   * @param {boolean} label Flag determining, if this guideline should have label near it's end on circle to indicate it's angle value
   * @param {?Number} typeIndex Zone type index this line is added for. Completely optional, used only for data transfer (TODO probably should factor them out from this class, as they are compltely unused here)
   * @param {?Number} functionIndex Function index this line is added for. Completely optional, used only for data transfer (TODO probably should factor them out from this class, as they are compltely unused here)
   */
  constructor(data, classes = [], graph = null, line = true, point = true, label = true, typeIndex = null, functionIndex = null) {
    this.line = line;
    this.point = point;
    this.label = label;

    this.classes = ["guideline", ...classes]; // I always add "guideline" class to the elements by convention

    this.angle = data.angle; // data always contains angle by convention

    this.literalAngle = {
      degree: data.litDeg,
      radian: data.litRad,
    }; // data always contains angle litertal values by convention

    this.literalFunction = {
      sin: data.sin,
      cos: data.cos,
      tan: data.tan,
      cot: data.cot,
    }; // data always contains literal function values by convention

    this.texFunction = {};
    for (let propertyName in data) {
      if (propertyName.endsWith("_tex")) {
        // name ends with _tex - it's a function tex representation
        this.texFunction[propertyName] = data[propertyName];
      }
    } // data may or may not contain tex representations for each of the function values

    this.typeIndex = typeIndex;
    this.functionIndex = functionIndex;

    if (graph instanceof Graph) {
      // if graph pbject was passed - init visual elements
      this.initVisual(graph);
    }
  }

  /**
   * @param {((element : SVGElement) => void)} consumer Function to call on each initialised element
   * @param {Object[]} except Array of this guideline's elements that must be ommited
   */
  #forInitialised(consumer, except = []) {
    for (let element of [this.line, this.point, this.tick, this.label]) {
      // check all possible elements
      if (element instanceof SVGElement && !except.includes(element)) {
        consumer(element);
      }
    }
  }

  /**
   * @param {Graph} graph Grapg used to init visual objects for. After intialization, these will be automatically appended to the graph.
   */
  initVisual(graph) {
    this.tick = createLineToAngle(graph, 0.95, 1.05, this.angle); // create tick (always present)
    this.tick.classList.add("guideline-tick"); // all ticks have this class by convention
    this.setActive();

    if (this.point) {
      // point should be created
      this.point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      this.point.setAttribute("cx", String(graph.x0 + graph.r0 * Math.cos(this.angle)));
      this.point.setAttribute("cy", String(graph.y0 - graph.r0 * Math.sin(this.angle)));
      this.point.setAttribute("r", "0.3");
      this.point.classList.add("guideline-point"); // all points have this class by convention
    }

    if (this.label) {
      // label should be created
      this.label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      // text alignment settings
      this.label.setAttribute("dominant-baseline", "middle");
      this.label.setAttribute("text-anchor", "middle");
      this.label.textContent = `${this.angle} plase replace me`; // this is a dummy content that is expected to be replaced
      this.label.setAttribute("x", String(graph.x0 + (graph.r0 + 7) * Math.cos(this.angle)));
      // Offset label a bit, if it's a 0-360 label, so that won't iverlap with it's neighbour
      // TODO probably need to remove this piece of edgecase, but I can't figure out how yet
      if (this.angle == 0) {
        this.label.setAttribute("y", String(graph.y0 - (graph.r0 + 7) * Math.sin(this.angle) - 2));
      } else if (this.angle == Math.PI * 2) {
        this.label.setAttribute("y", String(graph.y0 - (graph.r0 + 7) * Math.sin(this.angle) + 2));
      } else {
        this.label.setAttribute("y", String(graph.y0 - (graph.r0 + 7) * Math.sin(this.angle)));
      }
      this.label.classList.add("guideline-label"); // all labels have this class by convention
    }

    if (this.line) {
      // line must be created
      this.line = createLineToAngle(graph, 0.0, 1.0, this.angle);
      this.line.classList.add("guideline-line"); // all lines have this class by convention
    }

    // assigning additional classes to initialised elements
    this.#forInitialised((element) => {
      // add additional classes
      element.classList.add(...this.classes); // spread operator or th
      graph.addChild(element); // add this element to graph
    });
  }

  /**
   * @param {String} color Color value as it's expected to be in DOM attribute
   */
  set color(color) {
    this.#forInitialised((element) => element.setAttribute("stroke", color));
  }

  /**
   * Used to remove visual elements from graph
   * @param {Graph} graph
   */
  removeVisual(graph) {
    this.#forInitialised((element) => graph.removeChild(element));
  }

  /**
   * Used to set visibility of all elements except for tick (since it's signifying activeness)
   * @param {boolean} visible
   */
  setVisible(visible) {
    this.#forInitialised((element) => setVisibility(element, visible), [this.tick]);
  }

  /**
   *  Used to set guideline's activeness visually (changed visibility of it's tick)
   * @param {boolean} active Guidelines visibility (if ommited, {@link Guideline.active} field is used)
   */
  setActive(active = this.active) {
    setVisibility(this.tick, active);
    this.active = active;
  }
}
