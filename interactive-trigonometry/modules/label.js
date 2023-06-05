// @ts-check

/**
 * Defines an SVG label consisting of two SVGText elements: an actual label and a background.
 * This allows to create a little contour around main label that will distingush it from background
 */
export class BackgroundedLabel {
  /** @type {SVGTextElement} Acts as background blocker */
  background;
  /** @type {SVGTextElement} Has actual color and text */
  foreground;

  constructor() {
    // create backgournd label
    this.background = document.createElementNS("http://www.w3.org/2000/svg", "text");
    this.background.classList.add("backgroundedlabel", "backgroundedlabel-bg"); // CSS classes by convention
    // positioning
    this.background.setAttribute("dominant-baseline", "middle");
    this.background.setAttribute("text-anchor", "middle");
    // create actual label
    this.foreground = document.createElementNS("http://www.w3.org/2000/svg", "text");
    this.foreground.classList.add("backgroundedlabel", "backgroundedlabel-fg"); // CSS classes by convention
    // positioning
    this.foreground.setAttribute("dominant-baseline", "middle");
    this.foreground.setAttribute("text-anchor", "middle");
  }

  /**
   * @param {String} text
   */
  setText(text) {
    this.background.textContent = text;
    this.foreground.textContent = text;
  }

  /**
   * @param {String} name
   * @param {String} value
   */
  setAttribute(name, value) {
    this.foreground.setAttribute(name, value);
    this.background.setAttribute(name, value);
  }

  /**
   * Sets translation transform for both bg and fg labels
   * @param {Number} x
   * @param {Number} y
   */
  setPosition(x, y) {
    let transformString = `translate(${x}px, ${y}px)`;
    this.transform = transformString;
  }

  /**
   * @param {String} name
   * @returns
   */
  getAttribute(name) {
    return this.background.getAttribute(name) || this.foreground.getAttribute(name);
  }

  /**
   * @param  {String[]} classNames
   */
  addClasses(...classNames) {
    this.foreground.classList.add(...classNames);
    this.background.classList.add(...classNames);
  }

  /**
   * @param  {String[]} classNames
   */
  removeClasses(...classNames) {
    this.foreground.classList.remove(...classNames);
    this.background.classList.remove(...classNames);
  }

  /**
   * @param {String} transformString
   */
  set transform(transformString) {
    this.background.style.transform = transformString;
    this.foreground.style.transform = transformString;
  }

  /**
   * @param {String} rotation
   */
  set rotate(rotation) {
    this.background.style.rotate = rotation;
    this.foreground.style.rotate = rotation;
  }
}
