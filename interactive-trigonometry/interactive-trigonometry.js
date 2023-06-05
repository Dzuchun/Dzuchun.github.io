// @ts-check

import { Graph } from "./modules/graph.js";
import { TabsController } from "../modules/tabs.js";
import { GraphController } from "./modules/graphcontroller.js";
import InteractiveTrigonometryState from "./modules/state.js";
import LocalizationManager from "../modules/localization.js";
import { deepMergeObjects as merge } from "../modules/util.js";
import { patchFooter, LOCALIZATION as FOOTER_LOCALIZATION } from "../modules/footer.js";
import Guideline from "./modules/guideline.js";

// load theme, if present
let themeName = localStorage.getItem("themeName");
if (themeName) {
  updateTheme(themeName);
}
// quering elements and performing checks
const AREA_COLORS_LINK = document.getElementById("itn:colors-link"); // find area colors link
if (!(AREA_COLORS_LINK instanceof HTMLLinkElement)) {
  throw new Error("Area colors stylesheet link was not found, but it's requied");
}
const SVG = document.getElementById("svg"); // find SVG graph's based on
if (!(SVG instanceof SVGSVGElement)) {
  throw new Error(`Element with id "svg" must be an <svg> tag, but ${SVG} was found`);
}
const CONTROLS_DIV = document.getElementById("controls"); // element that has all the controls
if (!(CONTROLS_DIV instanceof HTMLDivElement)) {
  throw new Error(`Element with id "controls" must be a <div> tag, but ${CONTROLS_DIV} was found`);
}

const TABS_CONTROLLER = new TabsController(CONTROLS_DIV);

/** @type {{[locName : String] : String}} Holds localization of a default language */
const DEFAULT_LANGUAGE = await fetch("locale/en-US.json")
  .then((response) => response.json())
  .catch((reason) => console.warn(`Could not fetch/parse default language from: ${reason}`)); // load default language
const DEFAULT_GUIDELINES = await fetch("data/default-guidelines.json")
  .then((response) => response.json())
  .catch((reason) => console.warn(`Could not fetch/parse default guidelines: ${reason}`)); // load default guidelines
const DEFAULT_FORMULAE = await fetch("data/default-formulae.json")
  .then((response) => response.json())
  .catch((reason) => console.warn(`Could not fetch/parse default formulae: ${reason}`)); // load default formulae

patchFooter(DEFAULT_LANGUAGE); // generate footer

let state = new InteractiveTrigonometryState(); // create empty state for a program
loadStateFromQuery(); // load state from url query, if possible

const GRAPH = new Graph(SVG, DEFAULT_LANGUAGE, { addConfigure: true });
const CONTROLLER = new GraphController(CONTROLS_DIV, DEFAULT_LANGUAGE);
defaultEventBinding(GRAPH, CONTROLLER); // bind events of graph and controller to each other

CONTROLLER.addDefaultGuidelines(DEFAULT_GUIDELINES);
CONTROLLER.addToFormulae(DEFAULT_FORMULAE);

GRAPH.setState(state);
CONTROLLER.setState(state);
GRAPH.loadUserSavedColors();

const LOCALIZATION = new LocalizationManager("/interactive-trigonometry/locale", DEFAULT_LANGUAGE);
addDefaultLocalization(LOCALIZATION, "svg", "controls", "controls");
updateLanguage(localStorage.getItem("language") ?? "en-US"); // load user-preferred language, if any

/**
 * Binds all event for graph and controller to interact. You may skip this call and bind individual events, if you desire
 * @param {Graph} graph
 * @param {GraphController} controller
 */
export function defaultEventBinding(graph, controller) {
  controller.addEventListenerITN("pointer-toggle", (event) => {
    graph.pointerVisible = event.detail.checked;
    graph.pointerLabelVisible = event.detail.label && event.detail.checked; // Show label, if both pointer and label are visible
  });
  controller.addEventListenerITN(
    "pointer-label-toggle",
    (event) => (graph.pointerLabelVisible = event.detail.checked && event.detail.pointer) // Show label if pointer is active
  );
  controller.addEventListenerITN("guideline-labels-visible", (event) =>
    graph.setGuidelineLabelsVisibile(event.detail.labelsToShow, event.detail.labelsToHide, event.detail.override)
  );
  controller.addEventListenerITN("guideline-ticks-visible", (event) =>
    graph.setGuidelineTicksVisibile(event.detail.ticksToShow, event.detail.ticksToHide, event.detail.override)
  );
  controller.addEventListenerITN("add-guidelines", (event) =>
    event.detail.guidelines.forEach((/** @type {Guideline} */ guideline) => graph.addGuideline(guideline))
  );
  controller.addEventListenerITN("pointer-label-set", (event) => graph.setPointerLabelValue(event.detail.value));
  controller.addEventListenerITN("angle-set", (event) => (graph.selectedAngle = event.detail.evalAngle));
  controller.addEventListenerITN("angle-add", (event) => (graph.selectedAngle += event.detail.evalAngle));
  controller.addEventListenerITN("angle-sweep", (event) => {
    let sweeping = graph.sweepTo(event.detail.evalAngle); // try to start sweeping
    if (sweeping) {
      // sweep has stated - cancel event
      event.preventDefault(); // this signals controller that sweep was started
    } else if (sweeping === null) {
      // sweep is already in progress - stop it
      graph.sweepStop();
    } else if (sweeping === false) {
      // sweep has already finished - remove it
      graph.sweepRemove();
    }
    // sweep === undefined must do nothing, as it means sweep is not supported
  });
  controller.addEventListenerITN("mirror-x-toggle", (event) => (graph.mirrorXEnabled = event.detail.checked));
  controller.addEventListenerITN("mirror-y-toggle", (event) => (graph.mirrorYEnabled = event.detail.checked));
  controller.addEventListenerITN("functions-show-funcline", (event) => {
    graph.showFunctionline(event.detail.name, event.detail.show);
    graph.updateFunclines();
  });
  controller.addEventListenerITN("functions-show-labels", (event) => (graph.showFunctionlabels = event.detail.show));
  controller.addEventListenerITN("zones-add", (event) => graph.addZone(event.detail.zone, event.detail.guidelines));
  controller.addEventListenerITN("zones-highlight", (event) => graph.highlightZone(event.detail.typeIndex, event.detail.functionIndex));
  controller.addEventListenerITN("zones-dehighlight", (event) => graph.dehighlightZone(event.detail.typeIndex, event.detail.functionIndex));
  controller.addEventListenerITN("zones-remove", (event) => graph.removeZone(event.detail.type, event.detail.function));
  controller.addEventListenerITN("fetch-state", (event) => {
    let controllerState = controller.getState();
    let graphState = graph.getState();
    let megredState = merge(controllerState, graphState, new InteractiveTrigonometryState());
    event.detail.setter(megredState);
  });
  controller.addEventListenerITN("update-graph-state", (event) => graph.setState(event.detail.state));
  controller.addEventListenerITN("trigger-angle-snap", () => graph.reSetSelectedAngle());
  controller.addEventListenerITN("update-guideline-labels", (event) =>
    graph.setGuidelineLabelsContent(event.detail.guidelines, event.detail.contentProvider)
  );
  controller.addEventListenerITN("update-funclabels", (event) => graph.updateFuncLabelsContent(event.detail.contentProvider));
  graph.addEventListenerITN("selected-angle-set", (event) => controller.updateAngle(event.detail.angle));
  graph.addEventListenerITN("selected-angle-snap", (event) =>
    controller.snapAngle(event.detail.angle, event.detail.setter) ? event.preventDefault() : null
  );
  graph.addEventListenerITN("windcount-change", (event) => controller.updateGuidelineLabelsContent(event.detail.angle));
  graph.addEventListenerITN("pointer-label-set", (event) =>
    controller.updatePointerLabelContent(event.detail.angle) ? event.preventDefault() : null
  );
  graph.addEventListenerITN("overwind-enabled", (event) => (controller.overwindEnabled ? event.preventDefault() : null));

  graph.addEventListenerITN("zone-cell-color", (event) =>
    controller.colorZoneCell(event.detail.typeIndex, event.detail.functionIndex, event.detail.color)
  );
  graph.addEventListenerITN("change-theme", (event) => updateTheme(event.detail.themeName));
  // @ts-expect-error [no, AREA_COLORS_LINK is not null]
  graph.addEventListenerITN("change-zone-colors", (event) => (AREA_COLORS_LINK.href = `zone-colors/${event.detail.colorsName}.css`));
  // @ts-expect-error [no, AREA_COLORS_LINK is not null]
  AREA_COLORS_LINK.onload = () => {
    // on colorsstylesheet load
    graph.loadZoneColors(); // update graph colorlist
    graph.recolorZones(); // update graph zone colors
  };
  graph.addEventListenerITN("change-language", (event) => updateLanguage(event.detail.language));
}

// TODO separate param finding into different function
/**
 * Checks search query for "state" parameter, and attempts to load program state from it
 */
function loadStateFromQuery() {
  let search = /([^&=]+)=?([^&]*)/g; // regex for query parameter
  let query = window.location.search.substring(1); // query params string
  /** @type {{[locName : String] : String}} Query params object */
  let queryParams = {};
  let match;
  while ((match = search.exec(query))) {
    queryParams[match[1]] = match[2];
  } // some magic
  if (!("state" in queryParams)) {
    // not "state" param in query - nothing to do
    return;
  }
  state = InteractiveTrigonometryState.decode(queryParams["state"]); // load state from state param
}

/**
 * Adds default targets to provided localization manager
 * @param {LocalizationManager} localizationManager
 * @param {String} graphId
 * @param {String} controllerId
 * @param {String} tabsId
 */
function addDefaultLocalization(localizationManager, graphId, controllerId, tabsId) {
  /** @type {(element : Element, localizationStirngs: String[])=>any} */
  const setLang = (element, locale) => element.setAttribute("lang", locale[0]);
  /** @type {(element : Element, localizationStirngs: String[])=>any} */
  const setPlaceholder = (element, placeholder) => element.setAttribute("placeholder", placeholder[0]);
  /** @type {(element : HTMLInputElement, localizationStirngs: String[])=>any} */
  const setValue = (element, placeholder) => (element.value = placeholder[0]);
  /** @type {(String | ((element: Element, localizationStirngs: String[]) => any))[][]} */
  [
    // tabs localization
    ["tab_1", `#${tabsId} .tabs-label:nth-of-type(1)`],
    ["tab_2", `#${tabsId} .tabs-label:nth-of-type(2)`],
    ["tab_3", `#${tabsId} .tabs-label:nth-of-type(3)`],
    ["tab_4", `#${tabsId} .tabs-label:nth-of-type(4)`],
    // graph localization
    ["sp", `#${graphId}`, setLang],
    ["cf_title", `#${graphId} ~ .graph-configure .graph-configure-header`],
    ["sp", `#${graphId} ~ .graph-configure .graph-configure-language-select`, setValue],
    ["cf_theme", `#${graphId} ~ .graph-configure .graph-configure-theme-label`],
    ["cf_acol", `#${graphId} ~ .graph-configure .graph-configure-areacolors-label`],
    ["cf_mask", `#${graphId} ~ .graph-configure .graph-configure-mask-label`],
    // controls localization
    ["sp", `#${controllerId}`, setLang],
    ["toggles", `#${controllerId} .toggles-angle-header`],
    ["pointer", `#${controllerId} .angle-pointer-toggle-label`],
    ["pointer_label", `#${controllerId} .angle-pointer-label-toggle-label`],
    ["guidelines", `#${controllerId} .angle-guidelines-toggle-label`],
    ["angle_labels", `#${controllerId} .angle-labels-toggle-label`],
    ["deg_option", `#${controllerId} .angle-degrad-toggle-label1`],
    ["rad_option", `#${controllerId} .angle-degrad-toggle-label2`],
    ["current", `#${controllerId} .current-angle-header`],
    ["deg_option", `#${controllerId} .current-angle-degree-label`],
    ["rad_option", `#${controllerId} .current-angle-radian-label`],
    ["angle_manipulation", `#${controllerId} .angle-iwant-header-label`],
    ["deg_option", `#${controllerId} .angle-iwant-degrad-label1`],
    ["rad_option", `#${controllerId} .angle-iwant-degrad-label2`],
    ["interpret_as", `#${controllerId} .angle-interpreted-as-label`],
    ["want_input_placeholder", `#${controllerId} .angle-iwant-input`, setPlaceholder],
    ["set", `#${controllerId} .angle-setangle-button`],
    ["add", `#${controllerId} .angle-addangle-button`],
    ["sub", `#${controllerId} .angle-subangle-button`],
    ["sweep", `#${controllerId} .angle-sweepangle-button`],
    ["util", `#${controllerId} .angle-utils-header`],
    ["x_mirror", `#${controllerId} .angle-mirror-x-label`],
    ["y_mirror", `#${controllerId} .angle-mirror-y-label`],
    ["overwind", `#${controllerId} .angle-overwind-toggle-label`],
    ["toggles", `#${controllerId} .toggles-functions-header`],
    ["values", `#${controllerId} .header-values`],
    ["sin", `#${controllerId} .functions-show-sin-label`],
    ["cos", `#${controllerId} .functions-show-cos-label`],
    ["tancot", `#${controllerId} .functions-show-tan-label`],
    ["function_labels", `#${controllerId} .functions-show-labels-label`],
    ["guidelines", `#${controllerId} .functions-show-guidelines-label`],
    ["suppress_expressions", `#${controllerId} .functions-suppress-expressions-label`],
    ["function_zones", `#${controllerId} .zones-header`],
    ["positive", `#${controllerId} .active-zones-table .zones-table-positive`],
    ["negative", `#${controllerId} .active-zones-table .zones-table-negative`],
    ["equals", `#${controllerId} .active-zones-table .zones-table-equals`],
    ["more", `#${controllerId} .active-zones-table .zones-table-more`],
    ["less", `#${controllerId} .active-zones-table .zones-table-less`],
    ["add_zones", `#${controllerId} .zones-add-header`],
    ["formulae_input_placeholder", `#${controllerId} .formulae-input`, setPlaceholder],
    ["formulae_featured", `#${controllerId} .formulae-featured-button`],
    ["formulae_parents", `#${controllerId} .formulae-parents-button`],
    ["clipboard_state", `#${controllerId} .clipboard-state-button`],
    ["clipboard_url", `#${controllerId} .clipboard-url-button`],
    ["share_load_placeholder", `#${controllerId} .share-load-input`, setPlaceholder],
    ["share_load", `#${controllerId} .share-load-button`],
  ]
    .concat(FOOTER_LOCALIZATION)
    .forEach(([localizationNames, selector, setter]) => {
      if (!(typeof localizationNames === "string" && typeof selector === "string")) {
        // bad types...
        console.warn(`Bad localization triplet: [${typeof localizationNames}, ${typeof selector}, ${typeof setter}]`);
        return; // effectively continue
      }
      // @ts-expect-error [Have no ides how selector is still capable of being function BUT string at the same time an not being able to be passd for String param]
      localizationManager.addTarget(selector, localizationNames, setter, true);
    });
}

/**
 * Updates document's theme link href
 * @param {String} themeName
 */
function updateTheme(themeName) {
  let link = document.getElementById("itn:theme-link");
  if (!(link instanceof HTMLLinkElement)) {
    // link do not exist or is invalid
    console.warn(`Atempted to change theme to "${themeName}", but link element was not found`);
    return;
  }
  localStorage.setItem("themeName", themeName);
  link.href = `themes/${themeName}/styles.css`;
}

/**
 * Loads and updates language to specified one
 * @param {String} langName
 */
async function updateLanguage(langName) {
  if (langName.startsWith("ru-")) {
    // pigglang selected - prompt user for confirmation
    if (window.confirm(`${LOCALIZATION.lang?.lang_sure ?? "Are you sure about setting language to"} ${langName}?`)) {
      // break all stylesheets
      // @ts-expect-error [element selector literaly says stylesheet is a link element]
      document.querySelectorAll("link[rel=stylesheet]").forEach((stylesheet) => (stylesheet.href = ""));
    } else {
      // user is a sane person, and prevented this fatal mistake
      langName = LOCALIZATION?.lang?.sp ?? "en-US"; // prevent possible "damage"
    }
  }
  let currentLanguage = await LOCALIZATION.loadLanguage(langName ?? localStorage.getItem("language"));
  if (!currentLanguage) {
    // language failed to load - nothing to do
    return;
  }
  LOCALIZATION.updateLocalization();
  GRAPH.lang = currentLanguage; // use this language for graph
  CONTROLLER.lang = currentLanguage; // use this language for controller
  CONTROLLER.updateLocalization();
  localStorage.setItem("language", currentLanguage.sp);
}
