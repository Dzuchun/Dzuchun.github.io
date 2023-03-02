let svg = document.getElementById("svg");

// #region State-related

// ANGLE
// Toggles
var showAnglePointer;
var showAngleGuidingLines;
var showAngleLabels;
var labelsAreRad;
var currentAngle;
var literalCurrentAngleRadians;
var literalCurrentAngleDegree;
// I want
var angleWantIsRadians;
var angleWantLiteral;
var angleWantIsPi;
var angleWantIsPiSmashed;
// Utils
var angleUtilOverwind;
var angleUtilXMirror;
var angleUtilYMirror;

// #endregion

// #region State updates
function updateState() {
  updateAngleState();
}

function updateAngleState() {
  updateAnglePointer();
  updateAngleGuidingLines();
  updateAngleWant();
  updateAngleCurrent();
  updateAngleLabels();
  updateAngleMirrors();
}

function resetAngleFields() {
  showAnglePointer = true;
  showAngleGuidingLines = false;
  showAngleLabels = false;
  labelsAreRad = false;
  currentAngle = 0;
  literalCurrentAngleRadians = "0";
  literalCurrentAngleDegree = 0.0;

  angleWantIsRadians = false;
  angleWantLiteral = null;
  angleWantIsPi = false;
  angleWantIsPiSmashed = false;

  angleUtilOverwind = false;
  angleUtilXMirror = false;
  angleUtilYMirror = false;
}

const anglePointerToggle = document.getElementById("angle-pointer-toggle");
const angleGuidelinesToggle = document.getElementById(
  "angle-guidelines-toggle"
);
const angleLabelsToggle = document.getElementById("angle-labels-toggle");
const angleDegradToggle = document.getElementById("angle-degrad-toggle");

const angleWantRadiansToggle = document.getElementById("angle-iwant-degrad");
const angleWantInput = document.getElementById("angle-iwant-input");
const angleWantPiToggle = document.getElementById("angle-iwant-pi");

const angleOverwindToggle = document.getElementById("angle-overwind-toggle");
const angleMirrorXToggle = document.getElementById("angle-mirror-x");
const angleMirrorYToggle = document.getElementById("angle-mirror-y");
function resetAngleControls() {
  anglePointerToggle.checked = true;
  angleGuidelinesToggle.checked = false;
  angleLabelsToggle.checked = false;
  angleDegradToggle.checked = false;

  angleWantRadiansToggle.checked = false;
  angleWantInput.value = "";
  angleWantPiToggle.checked = false;

  angleOverwindToggle.checked = false;
  angleMirrorXToggle.checked = false;
  angleMirrorYToggle.checked = false;
}

function defaultAngleState() {
  resetAngleFields();
  resetAngleControls();
  updateAngleState();

  sweepPath.setAttribute("visibility", "hidden");
  if (processId !== null) {
    clearInterval(processId);
    svg.classList.remove("no-transitions");
    processId = null;
  }
}

function transformRadians(literal, winds) {
  // I'm not really into fancy math parsing, so here is a bunch of spagetti:
  let res = literal;
  if (literal === "0") {
    res = `${winds * 2}π`;
    if (res === "0π") res = "0";
  } else if (literal === "π") {
    res = `${winds * 2 + 1}π`;
    if (res === "-1π") {
      res = "-π";
    }
    if (res === "1π") {
      res = "π";
    }
  } else if (literal === "2π") {
    res = `${(winds + 1) * 2}π`;
    if (res === "0π") res = "0";
  } else if (winds != 0) {
    let parts = literal.split("/");
    let numerator = parts[0].slice(0, -1);
    if (numerator === "") numerator = 1;
    else if (numerator === "-") numerator = -1;
    else numerator = Number(numerator);
    let denominator = Number(parts[1]);
    numerator += denominator * winds * 2;
    if (numerator === 1) numerator = "";
    if (numerator === -1) numerator = "-";
    res = `${numerator}π/${denominator}`;
  }
  return res;
}

const snapRadius = 0.1;
function updateAnglePointer() {
  // #region vibility
  let v = showAnglePointer ? "visible" : "hidden";
  pointerLine.setAttribute("visibility", v);
  pointerPoint.setAttribute("visibility", v);
  pointerArc.setAttribute("visibility", v);
  // #endregion

  if (!angleUtilOverwind) {
    while (currentAngle > PIx2) {
      currentAngle -= PIx2;
    }
    while (currentAngle < -PIx2) {
      currentAngle += PIx2;
    }
  }

  if (showAnglePointer) {
    if (showAngleGuidingLines) {
      // #region snapping
      let winds = Math.floor(currentAngle / PIx2);
      let pureAngle = currentAngle % PIx2;
      if (pureAngle < 0) pureAngle += PIx2;
      let snapAngle;
      for (i in guideLineAngles) {
        if (Math.abs(guideLineAngles[i].value - pureAngle) < snapRadius) {
          snapAngle = guideLineAngles[i].value;
          currentAngle = winds * PIx2 + snapAngle;
          literalCurrentAngleDegree = Number(guideLineAngles[i].litDeg) + 360 * winds;
          literalCurrentAngleRadians = transformRadians(
            guideLineAngles[i].litRad,
            winds
          );
          break;
        }
      }
      if (typeof snapAngle === "undefined") {
        literalCurrentAngleDegree = null;
        literalCurrentAngleRadians = null;
      }
      // #endregion
    } else {
      literalCurrentAngleDegree = null;
      literalCurrentAngleRadians = null;
    }
    pointerPoint.style.rotate = -currentAngle + "rad";
    pointerLine.style.rotate = -currentAngle + "rad";

    // #region drawing pointer angle arc
    let path = `M ${x0 + dr} ${y0} `;
    let a = 0;
    sign = Math.sign(currentAngle);
    let rad = dr;
    let dGrow = radGrow * da * dr;

    while (Math.abs(a - currentAngle) > da) {
      a += sign * da;
      if (angleUtilOverwind) {
        rad += dGrow;
        dGrow *= 0.999;
      }
      path += `L ${x0 + rad * Math.cos(a)} ${y0 - rad * Math.sin(a)} `;
    }
    // #endregion
    pointerArc.setAttribute("d", path);
  }
}

function updateAngleGuidingLines() {
  let v = showAngleGuidingLines ? "visible" : "hidden";
  for (i in lines) {
    lines[i].setAttribute("visibility", v);
  }
}

function updateAngleLabels() {
  let v = showAngleLabels ? "visible" : "hidden";
  for (i in labels) {
    labels[i].l.setAttribute("visibility", v);
    labels[i].p.setAttribute("visibility", v);
    pointerLabel.setAttribute("visibility", v);
    pointerLabelBg.setAttribute("visibility", v);
  }

  if (showAngleLabels) {
    let winds = Math.floor(currentAngle / PIx2);
    // Yeah, I do two separate cycles here, since if-statement is heavy to execute.
    if (labelsAreRad) {
      for (i in labels) {
        labels[i].l.innerHTML = transformRadians(labels[i].gda.litRad, winds);
      }
      pointerLabelBg.innerHTML = currentAngleRadian.innerHTML;
      pointerLabel.innerHTML = currentAngleRadian.innerHTML;
    } else {
      for (i in labels) {
        labels[i].l.innerHTML =
          Number(labels[i].gda.litDeg) + 360 * winds + "°";
      }
      pointerLabelBg.innerHTML = currentAngleDegree.innerHTML;
      pointerLabel.innerHTML = currentAngleDegree.innerHTML;
    }
    pointerLabel.setAttribute("x", x0 + 0.75 * r0 * Math.cos(currentAngle));
    pointerLabel.setAttribute("y", y0 - 0.75 * r0 * Math.sin(currentAngle));
    pointerLabelBg.setAttribute("x", x0 + 0.75 * r0 * Math.cos(currentAngle));
    pointerLabelBg.setAttribute("y", y0 - 0.75 * r0 * Math.sin(currentAngle));
  }
}

const currentAngleDegree = document.getElementById("current-angle-degree");
const currentAngleRadian = document.getElementById("current-angle-radian");
function updateAngleCurrent() {
  currentAngleDegree.innerHTML = `${
    literalCurrentAngleDegree !== null
      ? literalCurrentAngleDegree
      : ((180 / pi) * currentAngle).toFixed(1)
  }°`;
  currentAngleRadian.innerHTML = `${
    literalCurrentAngleRadians !== null
      ? literalCurrentAngleRadians
      : (currentAngle / pi).toFixed(2) + "π"
  }`;
}

function updateAngleWant() {
  angleWantLiteral = angleWantInput.value;

  angleWantPiToggle.checked = angleWantIsPi;

  angleWantPiToggle.parentNode.style.color = angleWantPiToggle.checked ? "green" : "red";
  angleWantPiToggle.parentNode.style.borderColor = angleWantIsPiSmashed ? "black" : "grey";
}

function updateAngleMirrors() {
  let v;
  v = angleUtilXMirror ? "visible" : "hidden";
  mirrorXLine.setAttribute("visibility", v);
  mirrorXPoint.setAttribute("visibility", v);

  v = angleUtilYMirror ? "visible" : "hidden";
  mirrorYLine.setAttribute("visibility", v);
  mirrorYPoint.setAttribute("visibility", v);

  v = angleUtilXMirror && angleUtilYMirror ? "visible" : "hidden";
  mirrorXYLine.setAttribute("visibility", v);
  mirrorXYPoint.setAttribute("visibility", v);

  let rotation = Number(pointerLine.style.rotate.replace("rad", ""));
  if (angleUtilXMirror) {
    mirrorXLine.style.rotate = -rotation + "rad";
    mirrorXPoint.style.rotate = -rotation + "rad";
  }
  if (angleUtilYMirror) {
    mirrorYLine.style.rotate = pi - rotation + "rad";
    mirrorYPoint.style.rotate = pi - rotation + "rad";
  }
  if (angleUtilXMirror && angleUtilYMirror) {
    mirrorXYLine.style.rotate = rotation - pi + "rad";
    mirrorXYPoint.style.rotate = rotation - pi + "rad";
  }
}

// #endregion

// #region Creating trig circle
const x0 = 50;
const y0 = 50;
const r0 = 35;
let trigCircle = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "circle"
);
trigCircle.setAttribute("cx", x0);
trigCircle.setAttribute("cy", y0);
trigCircle.setAttribute("r", r0);
trigCircle.setAttribute("fill", "white");
svg.appendChild(trigCircle);

// #endregion

// #region Creating guidelines

const pi = Math.PI;
const guideLineAngles = [
  {
    value: 0,
    litDeg: 0,
    litRad: "0",
    sin: "0",
    cos: "1",
    tan: "0",
    ctan: undefined,
  },
  {
    value: pi / 6,
    litDeg: 30,
    litRad: "π/6",
    sin: "√3/2",
    cos: "1/2",
    tan: "1/√3",
    ctan: "√3",
  },
  {
    value: pi / 4,
    litDeg: 45,
    litRad: "π/4",
    sin: "1/√2",
    cos: "1/√2",
    tan: "1",
    ctan: "1",
  },
  {
    value: pi / 3,
    litDeg: 60,
    litRad: "π/3",
    sin: "√3/2",
    cos: "1/2",
    tan: "√3",
    ctan: "1/√3",
  },
  {
    value: pi / 2,
    litDeg: 90,
    litRad: "π/2",
    sin: "1",
    cos: "0",
    tan: undefined,
    ctan: "0",
  },
  {
    value: (2 * pi) / 3,
    litDeg: 120,
    litRad: "2π/3",
    sin: "√3/2",
    cos: "-1/2",
    tan: "-√3",
    ctan: "-1/√3",
  },
  {
    value: (3 * pi) / 4,
    litDeg: 135,
    litRad: "3π/4",
    sin: "1/√2",
    cos: "-1/√2",
    tan: "-1",
    ctan: "-1",
  },
  {
    value: (5 * pi) / 6,
    litDeg: 150,
    litRad: "5π/6",
    sin: "1/2",
    cos: "-√3/2",
    tan: "-1/√3",
    ctan: "-√3",
  },
  {
    value: pi,
    litDeg: "180",
    litRad: "π",
    sin: "0",
    cos: "-1",
    tan: "0",
    ctan: undefined,
  },
  {
    value: (7 * pi) / 6,
    litDeg: 210,
    litRad: "7π/6",
    sin: "-1/2",
    cos: "-√3/2",
    tan: "1/√3",
    ctan: "√3",
  },
  {
    value: (5 * pi) / 4,
    litDeg: 225,
    litRad: "5π/4",
    sin: "-1/√2",
    cos: "-1/√2",
    tan: "1",
    ctan: "1",
  },
  {
    value: (4 * pi) / 3,
    litDeg: 240,
    litRad: "4π/3",
    sin: "-√3/2",
    cos: "-1/2",
    tan: "√3",
    ctan: "1/√3",
  },
  {
    value: (3 * pi) / 2,
    litDeg: 270,
    litRad: "3π/2",
    sin: "-1",
    cos: "0",
    tan: undefined,
    ctan: "0",
  },
  {
    value: (5 * pi) / 3,
    litDeg: 300,
    litRad: "5π/3",
    sin: "-√3/2",
    cos: "1/2",
    tan: "-√3",
    ctan: "-1/√3",
  },
  {
    value: (7 * pi) / 4,
    litDeg: 315,
    litRad: "7π/4",
    sin: "-1/√2",
    cos: "1/√2",
    tan: "-1",
    ctan: "-1",
  },
  {
    value: (11 * pi) / 6,
    litDeg: 330,
    litRad: "11π/6",
    sin: "-1/2",
    cos: "√3/2",
    tan: "-1/√3",
    ctan: "-√3",
  },
  {
    value: 2 * pi,
    litDeg: 360,
    litRad: "2π",
    sin: "0",
    cos: "1",
    tan: "0",
    ctan: undefined,
  },
];

let lines = [];

function createLineToAngle(alpha) {
  let res = document.createElementNS("http://www.w3.org/2000/svg", "line");
  res.setAttribute("x1", x0 + 0.95 * r0 * Math.cos(alpha));
  res.setAttribute("y1", y0 - 0.95 * r0 * Math.sin(alpha));
  res.setAttribute("x2", x0 + 1.05 * r0 * Math.cos(alpha));
  res.setAttribute("y2", y0 - 1.05 * r0 * Math.sin(alpha));
  res.setAttribute("stroke", "grey");
  return res;
}

function addLine(angle) {
  let line = createLineToAngle(angle);
  lines.push(line);
  svg.appendChild(line);
}

for (i in guideLineAngles) {
  addLine(guideLineAngles[i].value);
}

// #endregion

// #region Creating pointer
let pointerLine = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "line"
);
pointerLine.setAttribute("visibility", "hidden");
pointerLine.setAttribute("stroke", "green");
pointerLine.setAttribute("x1", x0);
pointerLine.setAttribute("y1", y0);
pointerLine.setAttribute("x2", x0 + r0);
pointerLine.setAttribute("y2", y0);
pointerLine.style.transformOrigin = "center";
svg.appendChild(pointerLine);

let pointerPoint = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "circle"
);
pointerPoint.setAttribute("visibility", "hidden");
pointerPoint.setAttribute("r", 0.5);
pointerPoint.setAttribute("stroke", "green");
pointerPoint.setAttribute("cx", x0 + r0);
pointerPoint.setAttribute("cy", y0);
pointerPoint.style.transformOrigin = "center";
svg.appendChild(pointerPoint);
// #endregion

// #region Creating mirrors

let mirrorXLine = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "line"
);
mirrorXLine.setAttribute("visibility", "hidden");
mirrorXLine.setAttribute("stroke", "green");
mirrorXLine.setAttribute("x1", x0);
mirrorXLine.setAttribute("y1", y0);
mirrorXLine.setAttribute("x2", x0 + r0);
mirrorXLine.setAttribute("y2", y0);
mirrorXLine.setAttribute("opacity", 0.4);
mirrorXLine.style.transformOrigin = "center";
svg.appendChild(mirrorXLine);
let mirrorXPoint = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "circle"
);
mirrorXPoint.setAttribute("visibility", "hidden");
mirrorXPoint.setAttribute("r", 0.5);
mirrorXPoint.setAttribute("stroke", "green");
mirrorXPoint.setAttribute("cx", x0 + r0);
mirrorXPoint.setAttribute("cy", y0);
mirrorXPoint.setAttribute("opacity", 0.4);
mirrorXPoint.style.transformOrigin = "center";
svg.appendChild(mirrorXPoint);

let mirrorYLine = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "line"
);
mirrorYLine.setAttribute("visibility", "hidden");
mirrorYLine.setAttribute("stroke", "green");
mirrorYLine.setAttribute("x1", x0);
mirrorYLine.setAttribute("y1", y0);
mirrorYLine.setAttribute("x2", x0 + r0);
mirrorYLine.setAttribute("y2", y0);
mirrorYLine.setAttribute("opacity", 0.4);
mirrorYLine.style.transformOrigin = "center";
svg.appendChild(mirrorYLine);
let mirrorYPoint = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "circle"
);
mirrorYPoint.setAttribute("visibility", "hidden");
mirrorYPoint.setAttribute("r", 0.5);
mirrorYPoint.setAttribute("stroke", "green");
mirrorYPoint.setAttribute("cx", x0 + r0);
mirrorYPoint.setAttribute("cy", y0);
mirrorYPoint.setAttribute("opacity", 0.4);
mirrorYPoint.style.transformOrigin = "center";
svg.appendChild(mirrorYPoint);

let mirrorXYLine = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "line"
);
mirrorXYLine.setAttribute("visibility", "hidden");
mirrorXYLine.setAttribute("stroke", "green");
mirrorXYLine.setAttribute("x1", x0);
mirrorXYLine.setAttribute("y1", y0);
mirrorXYLine.setAttribute("x2", x0 + r0);
mirrorXYLine.setAttribute("y2", y0);
mirrorXYLine.setAttribute("opacity", 0.125);
mirrorXYLine.style.transformOrigin = "center";
svg.appendChild(mirrorXYLine);

let mirrorXYPoint = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "circle"
);
mirrorXYPoint.setAttribute("visibility", "hidden");
mirrorXYPoint.setAttribute("r", 0.5);
mirrorXYPoint.setAttribute("stroke", "green");
mirrorXYPoint.setAttribute("cx", x0 + r0);
mirrorXYPoint.setAttribute("cy", y0);
mirrorXYPoint.setAttribute("opacity", 0.125);
mirrorXYPoint.style.transformOrigin = "center";
svg.appendChild(mirrorYPoint);

// #endregion

// #region Creating circle arc
const PIx2 = Math.PI * 2;
const dr = r0 / 10;
const radGrow = 0.05;
const da = 0.05;
let pointerArc = document.createElementNS("http://www.w3.org/2000/svg", "path");
pointerArc.setAttribute("visibility", "hidden");
pointerArc.setAttribute("stroke", "green");
pointerArc.setAttribute("stroke-width", "0.2");
pointerArc.setAttribute("fill", "transparent");
pointerArc.style.pointerEvents = "none";
svg.appendChild(pointerArc);
// #endregion

// #region Creating sweep arc

let sweepPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
sweepPath.setAttribute("visibility", "hidden");
sweepPath.setAttribute("stroke", "green");
sweepPath.setAttribute("opacity", "0.4");
sweepPath.setAttribute("stroke-width", "3");
sweepPath.setAttribute("fill", "transparent");
svg.appendChild(sweepPath);

// #endregion

// #region Creating labels

let labels = [];

for (i in guideLineAngles) {
  let label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  let gDA = guideLineAngles[i];
  label.innerHTML = `label for ${gDA.value}`;
  label.setAttribute("x", x0 + (r0 + 7) * Math.cos(gDA.value));
  if (gDA.value == 0) {
    label.setAttribute("y", y0 - (r0 + 7) * Math.sin(gDA.value) - 2);
  } else if (gDA.value == PIx2) {
    label.setAttribute("y", y0 - (r0 + 7) * Math.sin(gDA.value) + 2);
  } else {
    label.setAttribute("y", y0 - (r0 + 7) * Math.sin(gDA.value));
  }
  label.setAttribute("visibility", "hidden");
  label.setAttribute("class", "angle-label");
  label.setAttribute("dominant-baseline", "middle");
  label.setAttribute("text-anchor", "middle");
  svg.appendChild(label);

  let labelPoint = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  labelPoint.setAttribute("cx", x0 + r0 * Math.cos(gDA.value));
  labelPoint.setAttribute("cy", y0 - r0 * Math.sin(gDA.value));
  labelPoint.setAttribute("r", 0.3);
  labelPoint.setAttribute("fill", "black");
  svg.appendChild(labelPoint);

  labels.push({ l: label, gda: gDA, p: labelPoint });
}

let pointerLabelBg = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "text"
);
pointerLabelBg.setAttribute("visibility", "hidden");
pointerLabelBg.setAttribute("class", "angle-label");
pointerLabelBg.setAttribute("dominant-baseline", "middle");
pointerLabelBg.setAttribute("text-anchor", "middle");
pointerLabelBg.setAttribute("x", x0);
pointerLabelBg.setAttribute("y", y0);
pointerLabelBg.setAttribute("class", "pointer-label-bg");
svg.appendChild(pointerLabelBg);

let pointerLabel = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "text"
);
pointerLabel.setAttribute("visibility", "hidden");
pointerLabel.setAttribute("class", "angle-label");
pointerLabel.setAttribute("dominant-baseline", "middle");
pointerLabel.setAttribute("text-anchor", "middle");
pointerLabel.setAttribute("x", x0);
pointerLabel.setAttribute("y", y0);
pointerLabel.setAttribute("class", "pointer-label");
svg.appendChild(pointerLabel);

// #endregion

// #region Handling events

svg.onmouseup = onClick;
svg.onmousemove = onClick;
svg.onmousedown = onClick;

function onClick(e) {
  if (e.buttons == 1) {
    interact(e);
  }
}

svg.ontouchstart = onTouch;
svg.ontouchmove = onTouch;

function onTouch(e) {
  e.preventDefault();
  let t = e.touches[0];
  interact(t);
}

function interact(point) {
  let p = svg.createSVGPoint();
  p.x = point.clientX;
  p.y = point.clientY;
  let pt = p.matrixTransform(svg.getScreenCTM().inverse());
  let x = pt.x - x0;
  let y = pt.y - y0;
  if (
    showAnglePointer &&
    Math.abs(x) < r0 &&
    Math.abs(y) < r0 &&
    Math.abs(Math.hypot(x, y) - r0) < 0.7 * r0
  ) {
    let angle = Math.atan2(-y, x);
    let windedAngle = -Number(pointerPoint.style.rotate.replace("rad", ""));
    let sign = Math.sign(windedAngle - angle);

    while (Math.abs(windedAngle - angle) > pi) {
      // animation rounding
      angle += sign * PIx2;
    }
    currentAngle = angle;
    updateState();
  }
}

function reactWantPi(event) {
  if (event.type == "contextmenu") {
    // % 2 != 0 will do trigger (fore some reason), if buttons=2
    // right click is held
    angleWantIsPiSmashed = !angleWantIsPiSmashed;
    event.preventDefault();
  }

  if (event.buttons == 1 || event.buttons == 3) {
    // left click is held
    angleWantIsPi = !angleWantIsPi;
  }

  updateState();
}

function interpretAngleInner() {
  updateAngleWant();
  if (angleWantLiteral === null) {
    return undefined;
  } else if (angleWantLiteral.includes("/")) {
    let parts = angleWantLiteral.split("/");
    if (parts.length != 2) {
      return undefined;
    } else {
      return Number(parts[0]) / Number(parts[1]);
    }
  } else {
    return Number(angleWantLiteral);
  }
}

function interpretAngle() {
  let a = interpretAngleInner();

  if (angleWantIsPi) {
    a *= pi;
  }

  if (!angleWantIsRadians) {
    a *= pi / 180;
  }

  return a;
}

function getSweepPath(current, target) {
  let res = [
    {
      a: current,
      p: `M ${x0 + r0 * Math.cos(current)} ${y0 - r0 * Math.sin(current)} `,
    },
  ];
  let a = current;
  let s = Math.sign(target - current);
  do {
    a += s * da;
    res.push({
      a: a,
      p: `L ${x0 + r0 * Math.cos(a)} ${y0 - r0 * Math.sin(a)} `,
    });
  } while (Math.abs(a - target) > da);
  res.push({
    a: target,
    p: `L ${x0 + r0 * Math.cos(target)} ${y0 - r0 * Math.sin(target)} `,
  });
  return res;
}

function actionSetAngle() {
  let iWantInterpret = interpretAngle();
  if (iWantInterpret != 0 && !iWantInterpret) {
    return;
  }
  currentAngle = iWantInterpret;
  updateState();
}

function actionAddAngle() {
  let iWantInterpret = interpretAngle();
  if (iWantInterpret != 0 && !iWantInterpret) {
    return;
  }
  currentAngle += iWantInterpret;
  updateState();
}

function actionSubAngle() {
  let iWantInterpret = interpretAngle();
  if (iWantInterpret != 0 && !iWantInterpret) {
    return;
  }
  currentAngle -= iWantInterpret;
  updateState();
}

let processId = null;
function actionSweepAngle() {
  let iWantInterpret = interpretAngle();
  if (iWantInterpret != 0 && !iWantInterpret) {
    return;
  }
  if (sweepPath.getAttribute("visibility") === "visible") {
    sweepPath.setAttribute("visibility", "hidden");
    if (processId !== null) {
      clearInterval(processId);
      svg.classList.remove("no-transitions");
      processId = null;
    }
  } else {
    if (processId === null) {
      let path = getSweepPath(currentAngle, iWantInterpret);
      sweepPath.setAttribute("d", "");
      sweepPath.setAttribute("visibility", "visible");
      let id = 0;
      svg.classList.add("no-transitions");
      processId = setInterval(() => {
        sweepPath.setAttribute("d", sweepPath.getAttribute("d") + path[id].p);
        currentAngle = path[id].a;
        id++;
        if (id >= path.length) {
          clearInterval(processId);
          svg.classList.remove("no-transitions");
          processId = null;
          currentAngle = iWantInterpret;
        }
        updateState();
      }, 20);
    }
  }
}

// #endregion

// #region Fraction input
const spaceKey = 32;
const allowedKeys = [
  // Neigher of these work on mobile, I persume:
  45, // hyphen
  173, // minus sign
  48,
  49,
  50,
  51,
  52,
  53,
  54,
  55,
  56,
  57, // digits
  188, // comma
  8, // backspace
];
function fractionInput() {
  var e = window.event;
  var key = e.which;
  if (key == spaceKey) {
    e.preventDefault();
    e.target.value += "/";
  } else if (!allowedKeys.includes(key)) {
    e.preventDefault();
  }
}
// #endregion

defaultAngleState();
