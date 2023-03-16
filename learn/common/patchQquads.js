let qquads = document.getElementsByClassName("qquad");
Array.from(qquads).forEach((qquad) => {
  let s = qquad.nextElementSibling;
  let c = s.innerHTML;
  c = "&emsp;&emsp;" + c;
  s.innerHTML = c;
});
