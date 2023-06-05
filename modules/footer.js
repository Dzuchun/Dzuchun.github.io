// @ts-check

const issueTrackerLink = "https://github.com/Dzuchun/Dzuchun.github.io/issues";
const sourceRepoLink = "https://github.com/Dzuchun/Dzuchun.github.io/tree/master/interactive-trigonometry";
const emailLink = "mailto:Infernodambik@gmail.com";
const telegramLink = "tg:https://t.me/dzuchun_ch";

/**
 * Creates my custom footer with all "relevant" links to show
 * @param {?{[locName : String] : String}} lang
 * @param {boolean} cleanFooter If footer should be cleared on this call
 */
export function patchFooter(lang, cleanFooter = false) {
  let footer = document.querySelector("footer"); // find footer if there's any
  if (!footer) {
    // no footer present - create one. It must be empty, right..?
    footer = document.createElement("footer");
    document.body.appendChild(footer);
  } else if (cleanFooter) {
    // footer was present, and is asked to be cleaned
    footer.innerHTML = "";
  }
  footer.classList.add("patched-footer"); // CSS class by convention
  footer.setAttribute("lang", lang?.sp ?? "en-US"); // lang attribute, "for fun"

  // now, I could've done all that by just assigning innerHTML to a single string, but I'll leave it a this sort of really ugly code until I migrate to node, or th

  let links = document.createElement("p");
  links.classList.add("footer-links-label");
  links.innerText = lang?.links ?? "Useful links:";

  let issueTracker = document.createElement("a");
  issueTracker.classList.add("footer-issue-tracker");
  issueTracker.target = "_blank";
  issueTracker.href = issueTrackerLink;
  issueTracker.innerText = lang?.issue_tracker ?? "Issue tracker";

  let sourceRepo = document.createElement("a");
  sourceRepo.classList.add("footer-source-repo");
  sourceRepo.target = "_blank";
  sourceRepo.href = sourceRepoLink;
  sourceRepo.innerText = lang?.source_repo ?? "Source code";

  let list = document.createElement("ul");
  list.classList.add("footer-list");
  [links, issueTracker, sourceRepo].forEach((element) => {
    let li = document.createElement("li");
    li.appendChild(element);
    list.appendChild(li);
  });

  let contacts = document.createElement("p");
  contacts.classList.add("footer-contacts-label");
  contacts.innerText = lang?.contacts ?? "Contacts:";

  let email = document.createElement("a");
  email.classList.add("footer-email");
  email.target = "_blank";
  email.href = emailLink;
  email.innerText = lang?.email ?? "email";

  let telegram = document.createElement("a");
  telegram.classList.add("footer-telegram");
  telegram.target = "_blank";
  telegram.href = telegramLink;
  telegram.innerText = lang?.telegram ?? "telegram";

  let contactsList = document.createElement("ul");
  contactsList.classList.add("contacts");
  [contacts, email, telegram].forEach((element) => {
    let li = document.createElement("li");
    li.appendChild(element);
    contactsList.appendChild(li);
  });

  let copyright = document.createElement("p");
  copyright.innerHTML = "&#9400dzuchun, all rights reversed (of course they are)";

  footer.appendChild(list);
  footer.appendChild(contactsList);
  footer.appendChild(copyright);
}

/** @type {(String | ((element: Element, localizationStrings: String[]) => void))[][]} */
export const LOCALIZATION = [
  ["sp", "footer", (element, strings) => element.setAttribute("lang", strings[0])],
  ["links", "footer .footer-links-label"],
  ["issue_tracker", "footer .footer-issue-tracker"],
  ["source_repo", "footer .footer-source-repo"],
  ["email", "footer .footer-email"],
  ["telegram", "footer .footer-telegram"],
  ["contacts", "footer .footer-contacts-label"],
];
