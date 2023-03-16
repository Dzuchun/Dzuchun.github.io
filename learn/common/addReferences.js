let un = document.getElementsByClassName("unnumbered");
Array.from(un).forEach((t) => {
  t.title = "copy link";
  t.onclick = () =>
    navigator.clipboard.writeText(`${window.location.href}#${t.id}`);
});
