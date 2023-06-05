// @ts-check

/**
 * Helper script that finds special tags in HTML document and replaces them with commonly-used structures.
 * Any class assigned to the tag will be directly inherited to it's input tag. Labels will be assigned similar classes with "-label" appends on them
 */

/**
 * Replaces toggler-anchor tags for an animated toggles. Expected to have a "label" attribute to tell what to white in it's label.
 */
function parseToggles() {
  document.querySelectorAll("toggler-anchor").forEach((toggler) => {
    let classes = toggler.getAttribute("class") ?? "";
    let labelClasses = classes
      .split(" ")
      .map((className) => `${className}-label`)
      .join(" ");
    let label = toggler.getAttribute("label") ?? "";
    toggler.outerHTML = `
<label class="toggle">
    <label class="toggler-wrapper">
        <input type="checkbox" class="${classes}">
        <div class="toggler-slider bool-toggle ${labelClasses}">${label}</div>
    </label>
</label>`;
  });
}

/**
 * Replaces bitoggler-anchor tags for an animated bi-toggles. Expected to have a "label1" and "label2" attributes to tell what to white in it's labels.
 */
function parseBiToggles() {
  document.querySelectorAll("bitoggler-anchor").forEach((bitoggle) => {
    let classes = bitoggle.getAttribute("class") ?? "";
    let labelClasses1 = classes
      .split(" ")
      .map((className) => `${className}-label1`)
      .join(" ");
    let labelClasses2 = classes
      .split(" ")
      .map((className) => `${className}-label2`)
      .join(" ");
    let label1 = bitoggle.getAttribute("label1") ?? "";
    let label2 = bitoggle.getAttribute("label2") ?? "";
    bitoggle.outerHTML = `
<label class="toggle">
    <p class="${labelClasses1}">${label1}</p>
    <label class="toggler-wrapper">
        <input type="checkbox" class="${classes}">
        <div class="toggler-slider">
            <div class="toggler-knob"></div>
        </div>
    </label>
    <p class="${labelClasses2}">${label2}</p>
</label>`;
  });
}

let last_selector_id = 0;
/**
 * Replaces check-selector-anchor tags with an input element wrapped into a label.
 * Expected to have a "label" attributes to tell what to white in the label.
 * Additionaly, tranfers anchor's "type", "name" and "value" attributes
 */
function parseSelectors() {
  document.querySelectorAll("selector-anchor").forEach((selector) => {
    last_selector_id++;
    let id = selector.id || `selector-radio-${last_selector_id}`;
    let classes = selector.getAttribute("class") ?? "";
    let labelClasses = classes
      .split(" ")
      .map((className) => `${className}-label`)
      .join(" ");
    let label = selector.getAttribute("label") ?? "";
    let type = selector.getAttribute("type") ?? "";
    let name = selector.getAttribute("name") ?? "";
    let value = selector.getAttribute("value") ?? "";
    selector.outerHTML = `
      <input id="${id}" class="selector ${classes}" type="${type}" name="${name}" value="${value}" />
      <label for="${id}" class="${labelClasses}">${label}</label>`;
  });
}

parseToggles();
parseBiToggles();
parseSelectors();
