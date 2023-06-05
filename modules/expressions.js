export function simplify(expr) {
  try {
    expr = expr.replaceAll(" ", ""); // I don't need spaces
    let parts = `+${expr}`
      .replaceAll(/([0-9]+)\/-([0-9])+/g, "-$1/$2") // move minuses out of denominators
      .replaceAll("+-", "-") // reduce pm
      .replaceAll("-+", "-") // reduce mp
      .replaceAll("--", "+") // reduce mm
      .replaceAll("+", "ї+") // mark pluses for separation
      .replaceAll("-", "ї-") // mark minuses for separation
      .split("ї") // separate parts
      .filter((s) => s.length); // filter out parts that actully have some chars (just in case)
    let gcca = parts
      .map((part) => part.match(/\/[0-9]+/g)?.[0].substring(1))
      .filter((e) => e)
      .map((s) => Number(s))
      .reduce(lcd, 1);
    let totalNumerator = Math.round(parts.map(eval).reduce((a, b) => a + b, 0) * gcca);
    return `${totalNumerator > 0 ? "+" : ""}${totalNumerator}${gcca !== 1 ? `/${gcca}` : ""}`;
  } catch (exc) {
    if (exc.name !== "SyntaxError") {
      throw exc;
    } else {
      return "Bad input";
    }
  }
}

export function gcd(a, b) {
  if (a % b == 0) {
    return b;
  } else if (b % a == 0) {
    return a;
  } else if (a > b) {
    return gcd(a - Math.floor(a / b) * b, b);
  } else {
    return gcd(a, b - Math.floor(b / a) * a);
  }
}

export function lcd(a, b) {
  return (a * b) / gcd(a, b);
}
