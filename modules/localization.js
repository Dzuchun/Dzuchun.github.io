// @ts-check

import { deepMergeObjects as merge } from "./util.js";

/**
 * This class manages selectors for elements that need to be localized, localization strings name to assign and setter functions that are used to deliver actual localiztion
 */
export default class LocalizationManager {
  /** @type {String} Path to folder with language files */
  #path;
  /** @type {{[locName : String] : String}} Object defining default locatization (used, if present one does not provide required string) */
  #DEFAULT_LANGUAGE;
  /** @type {{[locName : String] : String}} Object defining current locatization */
  lang;
  /** @type {(() => void)[]} Array of callers each setting localization to one element */
  #setters;

  /**
   * @param {String} langPath Path to folder with language files
   * @param {{[locName : String] : String}} DEFAULT_LANGUAGE Object defining default locatization (used to automatically fill in blanks of a newly-loaded language)
   */
  constructor(langPath, DEFAULT_LANGUAGE) {
    this.#path = langPath;
    this.#DEFAULT_LANGUAGE = DEFAULT_LANGUAGE;
    this.#setters = [];
  }

  /**
   * A generic setter for an array of elements
   * @param {NodeListOf<Element>} elements
   * @param {String[]} locNames
   * @param {(element: Element, localizationStrings: String[]) => void} assigner
   */
  #genericSetter(elements, locNames, assigner) {
    elements.forEach((element) =>
      assigner(
        element,
        locNames.map((locName) => this.lang[locName])
      )
    );
  }

  /**
   * Adds localization targets to this manager
   * @param {String} selector CSS selector for the required elements
   * @param {String} locNames String defining localization field names that need to be passed to the assigner. If multiple names needed, separate them with " " (space character)
   * @param {(element: Element, localizationStrings: String[]) => void} assigner Function that must set localization strings to a element's fields of choise. Defaults to setting innerText property to a first localizationStrings element
   * @param {boolean} preQuery If element can be pre-queried. Set to true, if you do not expect your element to change, or selector to select some other element. Can improve performance, as there's no need to find element each time, if it stays the same
   */
  // @ts-expect-error [element may not have a innerText property, but I don't care, it's just a default assigner]
  addTarget(selector, locNames, assigner = (element, string) => (element.innerText = string[0]), preQuery = false) {
    let locNamesArray = locNames.split(" ");
    if (preQuery) {
      let elements = document.querySelectorAll(selector);
      if (!elements.length) {
        // selector did not correspond to any element - nothing to do for a prequery target
        console.info(`Nothing found for prequery taget with selector: ${selector}`, elements);
        return;
      }
      this.#setters.push(() => this.#genericSetter(elements, locNamesArray, assigner)); // push setter that uses just queried elements all the time
    } else {
      this.#setters.push(() => this.#genericSetter(document.querySelectorAll(selector), locNamesArray, assigner)); // push setter that queries elements each time
    }
  }

  /**
   * Loads language with a specified locale
   * @param {String} languageLocale
   * @returns {Promise<{[locName : String] : String} | void>} Language object that was loaded
   */
  async loadLanguage(languageLocale = "en_US") {
    return fetch(`${this.#path}/${languageLocale}.json`)
      .then((response) => response.json())
      .then((language) => {
        // if load suceeded, set manager's fields
        this.lang = merge(language, this.#DEFAULT_LANGUAGE); // merge loaded language with a default one
        return this.lang;
      })
      .catch((reason) => {
        // if load rejected - warn about that
        console.warn(`Could not load language ${languageLocale}, reason: ${reason}`);
        console.trace(this);
      });
  }

  /**
   * Updates all tracked target's localization
   */
  updateLocalization() {
    this.#setters.forEach((target) => target()); // it literaly just invokes them all
  }
}
