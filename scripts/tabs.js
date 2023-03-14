/**
 * Little script I've writtem myself to generalise tab-like behaviour
 *
 * To use, cleate one or multiple checkboxes with "tab-selector" class. Let thier common name be NAME.
 * Then, setup several elements (so-called tabs) NAME class.
 * To map checkbox to tab, let checkbox value be VALUE, and then set tab id to `${NAME}${VALUE}`.
 *
 * TODO Might want to add automapping on the future.
 */

// source: https://stackoverflow.com/a/34890276
function groupBy(xs, key) {
  return xs.reduce((rv, x) => {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
}

let allTabs = Array.from(document.getElementsByClassName("tab-selector"));
let groupedTabs = groupBy(allTabs, "name");
for (let name in groupedTabs) {
  for (let tab in groupedTabs[name]) {
    groupedTabs[name][tab].onchange = () => {
      let allTabs = Array.from(document.getElementsByClassName(name));
      allTabs.forEach((t) => (t.style.display = "none"));
      allTabs.find(
        (t) => t.id == `${name}${groupedTabs[name][tab].value}`
      ).style.display = "flex";
    };
    if (groupedTabs[name][tab].checked) {
      groupedTabs[name][tab].onchange();
    }
  }
}
