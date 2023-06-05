// @ts-check

/**
 * Little class I've writtem myself to (more or less) generalise tab-like behaviour
 *
 * To use, pass to it a list of containers with two elements each: a tab bar and a content field.
 * Tab bar must be container (a list, for example), containing a bunch of buttons, divs, you name it. These are assigned a "tabs-label--" class. Active label is additionaly assigned a "tabs-label-active--" class.
 * A content field must contain the same number of elements as tabbar does. These are assigned a "tabs-content--" class.
 *
 * Once you do that, it automatically maps labels to content, and registers label click events.
 */
export class TabsController {
  /** @type {HTMLElement[]} Holds label elements */
  #labels;
  /** @type {HTMLElement[]} Holds content elements */
  #contents;

  /**
   * @param {Element} element
   * @returns
   */
  constructor(element) {
    if (element.children.length < 2) {
      // element does not have tabbar and content container
      console.warn(`Element ${element} does not have enough children, two required. Mappinds were not created`);
      return;
    }
    /** @type {HTMLElement[]} */
    // @ts-ignore [I'm sure these are HTML elements]
    this.#labels = Array.from(element.children[0].children); // first child is a tabbar
    /** @type {HTMLElement[]} */
    // @ts-ignore [I'm sure these are HTML elements]
    this.#contents = Array.from(element.children[1].children); // second child is a content container
    if (this.#labels.length != this.#contents.length) {
      // arrays do not equal in length, warn user
      console.warn(
        `Element's ${element} labels and contents differ in length: ${this.#labels} vs ${this.#contents}. Mappinds were not created`
      );
      return;
    }
    this.#labels.forEach((label, index) => {
      // for each label
      label.classList.add("tabs-label"); // CSS class by convention
      label.addEventListener("click", () => this.activateTab(index)); // on click, select content with this label's index
    });
    this.#contents.forEach((content) => content.classList.add("tabs-content")); // CSS class for contents
    this.activateTab(0); // Initially select first tab
  }

  /**
   * Marks label and content with specidied indexes as active by adding CSS classes to them and changing visibility
   * @param {Number} activeIndex
   */
  activateTab(activeIndex) {
    this.#contents.forEach((content, index) => content.classList[index === activeIndex ? "remove" : "add"]("hidden-content-tab")); // show only active content
    this.#labels.forEach((label, index) => label.classList[index == activeIndex ? "add" : "remove"]("tabs-label-active")); // add "tabs-label-active" CSS class only to an active label
  }

  /**
   * @returns {{index: Number, label: HTMLElement | undefined, content: HTMLElement | undefined}}
   */
  getActive() {
    let index = this.#labels.findIndex((label) => label.classList.contains("tabs-label-active")); // identify active label by CSS class
    return { index: index, label: this.#labels[index], content: this.#contents[index] }; // indexers will return undefined if no active label was found
  }
}
