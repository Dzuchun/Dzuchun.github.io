let svg = document.getElementById("svg");

// #region State fields

// ANGLE
// Toggles
var showAnglePointer;
var showAngleGuidingLines;
var showAngleLabels;
var showPointerLabel;
var labelsAreRad;
var currentAngle;
var literalCurrentAngleRadians;
var literalCurrentAngleDegree;
var currentGuideline;
// I want
var angleWantIsRadians;
var angleWantLiteral;
var angleWantIsPi;
var angleWantIsPiSmashed;
// Utils
var angleUtilOverwind;
var angleUtilXMirror;
var angleUtilYMirror;

// FUNCTIONS
// Toggles
var functionsShowSin;
var functionsShowCos;
var functionsShowTan;
var functionsShowLabels;

// Current
var functionsCurrentName;

// Areas
var functionsAreasData;
var functionsAreasEqualsLiteral;
var functionsAreasMoreLiteral;
var functionsAreasLessLiteral;

// FORMULAE
var formulaeQuery;
var formulaeCurrentShown;
var formulaeCurrentId;
var formulaeCurrentType;

// #endregion

// #region State updates
function updateState() {
  updateAngleState();
  updateFunctionsState();
}

// #region Angle state

function defaultAngleState() {
  resetAngleFields();
  resetAngleControls();

  sweepPath.setAttribute("visibility", "hidden");
  if (processId !== null) {
    clearInterval(processId);
    svg.classList.remove("no-transitions");
    processId = null;
  }
}

function resetAngleFields() {
  showAnglePointer = true;
  showAngleGuidingLines = false;
  showAngleLabels = false;
  showPointerLabel = false;
  labelsAreRad = false;
  currentAngle = 0;
  literalCurrentAngleRadians = "0";
  literalCurrentAngleDegree = 0.0;
  currentGuideline = null;

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
const anglePointerLabelToggle = document.getElementById(
  "angle-pointer-label-toggle"
);
const angleDegradToggle = document.getElementById("angle-degrad-toggle");

const angleWantRadiansToggle = document.getElementById("angle-iwant-degrad");
const angleWantInput = document.getElementById("angle-iwant-input");
const angleWantPiToggle = document.getElementById("angle-iwant-pi");

const angleOverwindToggle = document.getElementById("angle-overwind-toggle");
const angleMirrorXToggle = document.getElementById("angle-mirror-x");
const angleMirrorYToggle = document.getElementById("angle-mirror-y");
function resetAngleControls() {
  anglePointerToggle.checked = showAnglePointer;
  angleGuidelinesToggle.checked = showAngleGuidingLines;
  angleLabelsToggle.checked = showAngleLabels;
  anglePointerLabelToggle.checked = showPointerLabel;
  angleDegradToggle.checked = labelsAreRad;

  angleWantRadiansToggle.checked = angleWantIsRadians;
  angleWantInput.value = angleWantLiteral;
  angleWantPiToggle.checked = angleWantIsPi;

  angleOverwindToggle.checked = angleUtilOverwind;
  angleMirrorXToggle.checked = angleUtilXMirror;
  angleMirrorYToggle.checked = angleUtilYMirror;
}

function updateAngleState() {
  updateAnglePointer();
  updateAngleGuidingLines();
  updateAngleWant();
  updateAngleCurrent();
  updateAngleLabels();
  updateAngleMirrors();
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

const snapRadius = 0.05;
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
      let pureAngle = currentAngle % PIx2;
      if (pureAngle < 0) pureAngle += PIx2;
      let winds = Math.floor(currentAngle / PIx2);
      let snapAngle;
      for (i in dynamicGuidelines) {
        if (Math.abs(dynamicGuidelines[i].value - pureAngle) < snapRadius) {
          snapAngle = dynamicGuidelines[i].value;
          currentAngle = winds * PIx2 + snapAngle;
          literalCurrentAngleDegree = Number(
            dynamicGuidelines[i].litDeg + 360 * winds
          ).toFixed(1);
          literalCurrentAngleRadians =
            dynamicGuidelines[i].litRad +
            (winds !== 0 ? ` ${winds > 0 ? `+${2 * winds}` : 2 * winds}π` : "");
          currentGuideline = dynamicGuidelines[i];
          break;
        }
      }
      if (!snapAngle && showAngleLabels) {
        for (i in defaultGuidelines) {
          if (Math.abs(defaultGuidelines[i].value - pureAngle) < snapRadius) {
            snapAngle = defaultGuidelines[i].value;
            currentAngle = winds * PIx2 + snapAngle;
            literalCurrentAngleDegree =
              Number(defaultGuidelines[i].litDeg) + 360 * winds;
            literalCurrentAngleRadians = transformRadians(
              defaultGuidelines[i].litRad,
              winds
            );
            currentGuideline = defaultGuidelines[i];
            break;
          }
        }
      }
      if (typeof snapAngle === "undefined") {
        literalCurrentAngleDegree = null;
        literalCurrentAngleRadians = null;
        currentGuideline = null;
      }
      // #endregion
    } else {
      literalCurrentAngleDegree = null;
      literalCurrentAngleRadians = null;
      currentGuideline = null;
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
  let v = showAngleGuidingLines && showAngleLabels ? "visible" : "hidden";
  for (i in lines) {
    lines[i].setAttribute("visibility", v);
  }
}

function updateAngleLabels() {
  let v = showAngleLabels ? "visible" : "hidden";
  for (i in labels) {
    labels[i].l.setAttribute("visibility", v);
    labels[i].p.setAttribute("visibility", v);
  }

  if (showAngleLabels) {
    let winds = Math.floor(currentAngle / PIx2);
    // Yeah, I do two separate cycles here, since if-statement is heavy to execute.
    if (labelsAreRad) {
      for (i in labels) {
        labels[i].l.innerHTML = transformRadians(labels[i].gda.litRad, winds);
      }
    } else {
      for (i in labels) {
        labels[i].l.innerHTML =
          Number(labels[i].gda.litDeg) + 360 * winds + "°";
      }
    }
  }

  v = showPointerLabel ? "visible" : "hidden";
  pointerLabel.setAttribute("visibility", v);
  pointerLabelBg.setAttribute("visibility", v);

  if (showPointerLabel) {
    if (labelsAreRad) {
      pointerLabelBg.innerHTML = currentAngleRadian.innerHTML;
      pointerLabel.innerHTML = currentAngleRadian.innerHTML;
    } else {
      pointerLabelBg.innerHTML = currentAngleDegree.innerHTML;
      pointerLabel.innerHTML = currentAngleDegree.innerHTML;
    }
    pointerLabel.style.transform = `translate(${
      x0 + 0.75 * r0 * Math.cos(currentAngle)
    }px, ${y0 - 0.75 * r0 * Math.sin(currentAngle)}px)`;
    pointerLabelBg.style.transform = `translate(${
      x0 + 0.75 * r0 * Math.cos(currentAngle)
    }px, ${y0 - 0.75 * r0 * Math.sin(currentAngle)}px)`;
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

  angleWantPiToggle.parentNode.style.color = angleWantPiToggle.checked
    ? "green"
    : "red";
  angleWantPiToggle.parentNode.style.borderColor = angleWantIsPiSmashed
    ? "black"
    : "grey";
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

// #region Functions state

function defaultFunctionsState() {
  resetFunctionFields();
  resetFunctionsControls();
}

function resetFunctionFields() {
  functionsShowSin = false;
  functionsShowCos = false;
  functionsShowTan = false;
  functionsShowLabels = false;

  functionsCurrentName = null;

  functionsAreasEqualsLiteral = null;
  functionsAreasMoreLiteral = null;
  functionsAreasLessLiteral = null;
  functionsAreasData = [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];

  for (let i in colorsList) {
    colorsList[i].used = false;
  }

  dynamicGuidelines = [];
}

const functionsShowSinToggle = document.getElementById("functions-show-sin");
const functionsShowCosToggle = document.getElementById("functions-show-cos");
const functionsShowTanToggle = document.getElementById("functions-show-tan");
const functionsShowLabelsToggle = document.getElementById(
  "functions-show-labels"
);

const functionsCurrentNameSelect = document.getElementById(
  "functions-current-name"
);
const functionsCurrentFunctionDeg = document.getElementById(
  "functions-current-function-deg"
);
const functionsCurrentFunctionRad = document.getElementById(
  "functions-current-function-rad"
);
const functionsCurrentFunctionValue = document.getElementById(
  "functions-current-function-val"
);

const functionsAreasEqualsInput = document.getElementById(
  "functions-equals-input"
);
const functionsAreasTableCells = [
  [
    document.getElementById("E-sin"),
    document.getElementById("E-cos"),
    document.getElementById("E-tan"),
    document.getElementById("E-cot"),
  ],
  [
    document.getElementById("P-sin"),
    document.getElementById("P-cos"),
    document.getElementById("P-tan"),
    document.getElementById("P-cot"),
  ],
  [
    document.getElementById("N-sin"),
    document.getElementById("N-cos"),
    document.getElementById("N-tan"),
    document.getElementById("N-cot"),
  ],
  [
    document.getElementById("M-sin"),
    document.getElementById("M-cos"),
    document.getElementById("M-tan"),
    document.getElementById("M-cot"),
  ],
  [
    document.getElementById("L-sin"),
    document.getElementById("L-cos"),
    document.getElementById("L-tan"),
    document.getElementById("L-cot"),
  ],
];

const functionsAreasMoreInput = document.getElementById("functions-more-input");
const functionsAreasLessInput = document.getElementById("functions-less-input");

const functionsAreasPositiveButton = document.getElementById(
  "functions-areas-positive"
);
const functionsAreasNegativeButton = document.getElementById(
  "functions-areas-negative"
);
const functionsAreasEqualsButton = document.getElementById(
  "functions-areas-equals"
);
const functionsAreasMoreButton = document.getElementById(
  "functions-areas-more"
);
const functionsAreasLessButton = document.getElementById(
  "functions-areas-less"
);

function resetFunctionsControls() {
  functionsShowSinToggle.checked = functionsShowSin;
  functionsShowCosToggle.checked = functionsShowCos;
  functionsShowTanToggle.checked = functionsShowTan;
  functionsShowLabelsToggle.checked = functionsShowLabels;

  functionsCurrentNameSelect.display_function = functionsCurrentNameSelect;
  functionsCurrentFunctionDeg.innerHTML = "";
  functionsCurrentFunctionRad.innerHTML = "";
  functionsCurrentFunctionValue.innerHTML = "";

  var functionRadios = document.getElementsByName("display_function");
  for (let i in functionRadios) functionRadios[i].checked = false;

  functionsAreasEqualsInput.value = functionsAreasEqualsLiteral;
  functionsAreasMoreInput.value = functionsAreasMoreLiteral;
  functionsAreasLessInput.value = functionsAreasLessLiteral;

  for (let i in functionsAreasTableCells) {
    for (let j in functionsAreasTableCells[i]) {
      functionsAreasTableCells[i][j].style.backgroundColor = "white";
      functionsAreasTableCells[i][j].innerHTML = "";
    }
  }

  for (let i in functionAreas) {
    for (let j in functionAreas[i]) {
      functionAreas[i][j].setAttribute("visibility", "hidden");
    }
  }

  functionsAreasPositiveButton.innerHTML = "Positive";
  functionsAreasNegativeButton.innerHTML = "Negative";
  functionsAreasEqualsButton.innerHTML = "Equals";
  functionsAreasMoreButton.innerHTML = "More";
  functionsAreasLessButton.innerHTML = "Less";
}

function updateFunctionsState() {
  updateFunctionsLines();
  updateFunctionsLabels();
  updateFunctionsCurrent();
  updateFunctionsAreas();
}

function updateFunctionsLines() {
  if (functionsShowSin) {
    functionsSinLine.style.transform = `translate(${
      r0 * Math.cos(currentAngle)
    }px, 0px) scale(1.0, ${Math.sin(currentAngle)})`;
  }

  if (functionsShowCos) {
    functionsCosLine.style.transform = `translate(0px, ${
      -r0 * Math.sin(currentAngle)
    }px) scale(${Math.cos(currentAngle)}, 1.0)`;
  }

  if (functionsShowTan) {
    functionsTanLine.style.rotate = pointerLine.style.rotate;
  }

  // #region Visibility
  functionsSinLine.setAttribute(
    "visibility",
    functionsShowSin ? "visible" : "hidden"
  );
  functionsCosLine.setAttribute(
    "visibility",
    functionsShowCos ? "visible" : "hidden"
  );
  functionsTanLine.setAttribute(
    "visibility",
    functionsShowTan ? "visible" : "hidden"
  );
  // #endregion
}

function updateFunctionsLabels() {
  if (!functionsShowLabels) {
    functionsSinLabelBg.setAttribute("visibility", "hidden");
    functionsCosLabelBg.setAttribute("visibility", "hidden");
    functionsTanLabelBg1.setAttribute("visibility", "hidden");
    functionsTanLabelBg2.setAttribute("visibility", "hidden");
    functionscTanLabelBg1.setAttribute("visibility", "hidden");
    functionscTanLabelBg2.setAttribute("visibility", "hidden");

    functionsSinLabel.setAttribute("visibility", "hidden");
    functionsCosLabel.setAttribute("visibility", "hidden");
    functionsTanLabel1.setAttribute("visibility", "hidden");
    functionsTanLabel2.setAttribute("visibility", "hidden");
    functionscTanLabel1.setAttribute("visibility", "hidden");
    functionscTanLabel2.setAttribute("visibility", "hidden");
  } else {
    let v;
    if (functionsShowSin) {
      v = Math.sin(currentAngle).toFixed(3);
      if (currentGuideline !== null) {
        v = currentGuideline.sin;
      }
      functionsSinLabelBg.setAttribute("visibility", "visible");
      functionsSinLabelBg.innerHTML = v;
      functionsSinLabelBg.style.transform = `translate(${
        r0 * Math.cos(currentAngle) + 0.1 * r0 * Math.cos(2 * currentAngle)
      }px, ${(-r0 * Math.sin(currentAngle)) / 2}px)`;

      functionsSinLabel.setAttribute("visibility", "visible");
      functionsSinLabel.innerHTML = v;
      functionsSinLabel.style.transform = `translate(${
        r0 * Math.cos(currentAngle) + 0.1 * r0 * Math.cos(2 * currentAngle)
      }px, ${(-r0 * Math.sin(currentAngle)) / 2}px)`;
    } else {
      functionsSinLabel.setAttribute("visibility", "hidden");
      functionsSinLabelBg.setAttribute("visibility", "hidden");
    }

    if (functionsShowCos) {
      v = Math.cos(currentAngle).toFixed(3);
      if (currentGuideline !== null) {
        v = currentGuideline.cos;
      }
      functionsCosLabelBg.setAttribute("visibility", "visible");
      functionsCosLabelBg.innerHTML = v;
      functionsCosLabelBg.style.transform = `translate(${
        (r0 * Math.cos(currentAngle)) / 2
      }px, ${
        -r0 * Math.sin(currentAngle) - 0.05 * r0 * Math.cos(2 * currentAngle)
      }px)`;

      functionsCosLabel.setAttribute("visibility", "visible");
      functionsCosLabel.innerHTML = v;
      functionsCosLabel.style.transform = `translate(${
        (r0 * Math.cos(currentAngle)) / 2
      }px, ${
        -r0 * Math.sin(currentAngle) - 0.05 * r0 * Math.cos(2 * currentAngle)
      }px)`;
    } else {
      functionsCosLabel.setAttribute("visibility", "hidden");
      functionsCosLabelBg.setAttribute("visibility", "hidden");
    }

    if (functionsShowTan) {
      v = Math.tan(currentAngle);
      if (Math.abs(v) > 1000) {
        v = "±∞";
      } else {
        v = v.toFixed(3);
      }
      if (currentGuideline !== null) {
        v = currentGuideline.tan;
      }
      functionsTanLabelBg1.innerHTML = v;
      functionsTanLabel1.innerHTML = v;
      functionsTanLabelBg2.innerHTML = v;
      functionsTanLabel2.innerHTML = v;

      v = `translate(${1.2 * r0 * Math.cos(currentAngle - 0.15)}px, ${
        -1.2 * r0 * Math.sin(currentAngle - 0.1)
      }px)`;
      functionsTanLabelBg1.style.transform = v;
      functionsTanLabel1.style.transform = v;

      v = `translate(${-1.2 * r0 * Math.cos(currentAngle - 0.15)}px, ${
        1.2 * r0 * Math.sin(currentAngle - 0.1)
      }px)`;
      functionsTanLabelBg2.style.transform = v;
      functionsTanLabel2.style.transform = v;

      v = 1.0 / Math.tan(currentAngle);
      if (Math.abs(v) > 1000) {
        v = "±∞";
      } else {
        v = v.toFixed(3);
      }
      if (currentGuideline !== null) {
        v = currentGuideline.cot;
      }
      functionscTanLabelBg1.innerHTML = v;
      functionscTanLabel1.innerHTML = v;
      functionscTanLabelBg2.innerHTML = v;
      functionscTanLabel2.innerHTML = v;

      v = `translate(${1.2 * r0 * Math.cos(currentAngle + 0.15)}px, ${
        -1.2 * r0 * Math.sin(currentAngle + 0.1)
      }px)`;
      functionscTanLabelBg1.style.transform = v;
      functionscTanLabel1.style.transform = v;

      v = `translate(${-1.2 * r0 * Math.cos(currentAngle + 0.15)}px, ${
        1.2 * r0 * Math.sin(currentAngle + 0.1)
      }px)`;
      functionscTanLabelBg2.style.transform = v;
      functionscTanLabel2.style.transform = v;

      functionsTanLabel1.setAttribute("visibility", "visible");
      functionsTanLabelBg1.setAttribute("visibility", "visible");
      functionsTanLabel2.setAttribute("visibility", "visible");
      functionsTanLabelBg2.setAttribute("visibility", "visible");

      functionscTanLabel1.setAttribute("visibility", "visible");
      functionscTanLabelBg1.setAttribute("visibility", "visible");
      functionscTanLabel2.setAttribute("visibility", "visible");
      functionscTanLabelBg2.setAttribute("visibility", "visible");
    } else {
      functionsTanLabel1.setAttribute("visibility", "hidden");
      functionsTanLabelBg1.setAttribute("visibility", "hidden");
      functionsTanLabel2.setAttribute("visibility", "hidden");
      functionsTanLabelBg2.setAttribute("visibility", "hidden");

      functionscTanLabel1.setAttribute("visibility", "hidden");
      functionscTanLabelBg1.setAttribute("visibility", "hidden");
      functionscTanLabel2.setAttribute("visibility", "hidden");
      functionscTanLabelBg2.setAttribute("visibility", "hidden");
    }
  }
}

function updateFunctionsCurrent() {
  let func =
    functionsCurrentName == "sin"
      ? Math.sin
      : functionsCurrentName == "cos"
      ? Math.cos
      : functionsCurrentName == "tan"
      ? Math.tan
      : functionsCurrentName == "cot"
      ? (x) => 1.0 / Math.tan(x)
      : null;
  if (!func) {
    // no fucntion selected
    functionsCurrentFunctionDeg.innerHTML = "";
    functionsCurrentFunctionRad.innerHTML = "";
    functionsCurrentFunctionValue.innerHTML = "";
  } else {
    var val = func(currentAngle);
    if (Math.abs(val) > 1000) {
      val = katexNormalRender("\\pm\\infty");
    } else {
      val = val.toFixed(3);
    }
    functionsCurrentFunctionDeg.innerHTML = `${functionsCurrentName}(${currentAngleDegree.innerHTML})`;
    functionsCurrentFunctionRad.innerHTML = `${functionsCurrentName}(${currentAngleRadian.innerHTML})`;
    functionsCurrentFunctionValue.innerHTML = `=${val}`;
    if (currentGuideline && Math.abs(val) <= 1000) {
      functionsCurrentFunctionValue.innerHTML =
        (currentGuideline[functionsCurrentName + "_tex"]
          ? `=${katexNormalRender(
              currentGuideline[functionsCurrentName + "_tex"]
            )}`
          : "=" + currentGuideline[functionsCurrentName]) +
        functionsCurrentFunctionValue.innerHTML;
    }
  }
}

function updateFunctionsAreas(name) {
  ["E", "M", "L"].forEach((t) => {
    let c = desypherId(`${t}-${name}`);
    if (c.ai != -1 && c.fi != -1 && functionsAreasData[c.ai][c.fi]) {
      let inp =
        c.at == "E"
          ? functionsAreasEqualsInput
          : c.at == "M"
          ? functionsAreasMoreInput
          : c.at == "L"
          ? functionsAreasLessInput
          : null;
      inp.value = functionsAreasData[c.ai][c.fi].literal;
    }
  });
  updateFunctionAreasLiterals();
  if (name) {
    functionsAreasPositiveButton.innerHTML = `Positive ${name}`;
    functionsAreasNegativeButton.innerHTML = `Negative ${name}`;
    functionsAreasEqualsButton.innerHTML = `${name} = `;
    functionsAreasMoreButton.innerHTML = `${name} > `;
    functionsAreasLessButton.innerHTML = `${name} < `;
  }
}

function updateFunctionAreasLiterals() {
  functionsAreasEqualsLiteral = functionsAreasEqualsInput.value;
  functionsAreasMoreLiteral = functionsAreasMoreInput.value;
  functionsAreasLessLiteral = functionsAreasLessInput.value;
}

// #endregion

// #region Formulae state

function defaultFormulaeState() {
  resetFormulaeFields();
  resetFormulaeControls();
}

function resetFormulaeFields() {
  formulaeQuery = null;
  formulaeCurrentId = null;
  formulaeCurrentShown = [];
  formulaeCurrentType = null;
}

const formulaeInput = document.getElementById("formulae-input");
const formulaeResultName = document.getElementById("formulae-result-name");
const formulaeResult = document.getElementById("formulae-result");
function resetFormulaeControls() {
  formulaeInput.value = formulaeQuery;

  if (formulaeCurrentType) {
    formulaeResultName.innerHTML = `${formulaeCurrentType.prefix} ${
      formulaeCurrentType.id
        ? katexNormalRender(
            formulaeBase.find((f) => f.id == formulaeCurrentType.id).tex
          )
        : formulaeQuery
    }`;
  } else {
    formulaeResultName.innerHTML = "";
  }
  if (formulaeCurrentShown.length > 0) {
    formulaeDisplayList(
      formulaeBase.filter((formula) =>
        formulaeCurrentShown.includes(formula.id)
      )
    );
  } else {
    formulaeResult.innerHTML = "";
  }
  if (formulaeCurrentId !== null) {
    Array.from(document.getElementsByName("formulae_selected")).find(
      (e) => e.value == formulaeCurrentId
    ).checked = true;
  }
}

// #endregion

// #region Program state

function generateState() {
  let state = {
    showAnglePointer: showAnglePointer, // bit
    showAngleGuidingLines: showAngleGuidingLines, // bit
    showAngleLabels: showAngleLabels, // bit
    showPointerLabel: showPointerLabel, // bit
    labelsAreRad: labelsAreRad, // bit
    currentAngle: currentAngle, // float64
    literalCurrentAngleRadians: literalCurrentAngleRadians, // string
    literalCurrentAngleDegree: literalCurrentAngleDegree, // string
    currentGuideline: currentGuideline, // 2*float64 + 4*string
    angleWantIsRadians: angleWantIsRadians, // bit
    angleWantLiteral: angleWantLiteral, // string
    angleWantIsPi: angleWantIsPi, // bit
    angleWantIsPiSmashed: angleWantIsPiSmashed, // bit
    angleUtilOverwind: angleUtilOverwind, // bit
    angleUtilXMirror: angleUtilXMirror, // bit
    angleUtilYMirror: angleUtilYMirror, // bit

    functionsShowSin: functionsShowSin, // bit
    functionsShowCos: functionsShowCos, // bit
    functionsShowTan: functionsShowTan, // bit
    functionsShowLabels: functionsShowLabels, // bit
    functionsCurrentName: functionsCurrentName, // 2bits, in fact
    functionsAreasData: functionsAreasData, // at most 16bytes (don't think gonna need more than 16 colors) + 16strings

    formulaeQuery: formulaeQuery, // string
    formulaeCurrentId: formulaeCurrentId, // byte (don't think ever gonna need more than 256 formulas)
    formulaeCurrentShown: formulaeCurrentShown, // bytearray
    formulaeCurrentType: formulaeCurrentType, // 2bits + byte
  };
  return JSON.stringify(state);
  //return btoa(JSON.stringify(state));
}

const compactBitsNeeded = 20;
const compactBytesForBitsNeeded = Math.ceil(compactBitsNeeded / 8.0);
const compactBytesNeeded = compactBytesForBitsNeeded + 1 * 2 + 64 * 3;
function compactState(state) {
  // Yeah, i'm going to go through entire hassle of bytecoding and decoding program state just so that statestring would be less cumbersome (AS IT MUST BE!)
  // but not now...
  let bytes = parseInt(
    (showAngleGuidingLines ? "1" : "0") +
      (showAngleGuidingLines ? "1" : "0") +
      (showAngleGuidingLines ? "1" : "0") +
      (showAngleGuidingLines ? "1" : "0") +
      (showAngleGuidingLines ? "1" : "0") +
      (showAngleGuidingLines ? "1" : "0") +
      (showAngleGuidingLines ? "1" : "0") +
      (showAngleGuidingLines ? "1" : "0") +
      (showAngleGuidingLines ? "1" : "0") +
      (showAngleGuidingLines ? "1" : "0") +
      (showAngleGuidingLines ? "1" : "0") +
      (showAngleGuidingLines ? "1" : "0") +
      (showAngleGuidingLines ? "1" : "0") +
      (showAngleGuidingLines ? "1" : "0") +
      (showAngleGuidingLines ? "1" : "0") +
      (showAngleGuidingLines ? "1" : "0") +
      (labelsAreRad ? "1" : "0") +
      (showAngleLabels ? "1" : "0") +
      (showAngleGuidingLines ? "1" : "0") +
      (showAnglePointer ? "1" : "0"),
    2
  );
}

function decompactState(binary) {}

function loadState(state) {
  //let res = JSON.parse(atob(state));
  let res = JSON.parse(state);
  // #region Setting fields
  resetAngleFields();
  showAnglePointer = res.showAnglePointer;
  showAngleGuidingLines = res.showAngleGuidingLines;
  showAngleLabels = res.showAngleLabels;
  showPointerLabel = res.showPointerLabel;
  labelsAreRad = res.labelsAreRad;
  currentAngle = res.currentAngle;
  literalCurrentAngleRadians = res.literalCurrentAngleRadians;
  literalCurrentAngleDegree = res.literalCurrentAngleDegree;
  currentGuideline = res.currentGuideline;
  angleWantIsRadians = res.angleWantIsRadians;
  angleWantLiteral = res.angleWantLiteral;
  angleWantIsPi = res.angleWantIsPi;
  angleWantIsPiSmashed = res.angleWantIsPiSmashed;
  angleUtilOverwind = res.angleUtilOverwind;
  angleUtilXMirror = res.angleUtilXMirror;
  angleUtilYMirror = res.angleUtilYMirror;

  resetFunctionFields();
  functionsShowSin = res.functionsShowSin;
  functionsShowCos = res.functionsShowCos;
  functionsShowTan = res.functionsShowTan;
  functionsShowLabels = res.functionsShowLabels;
  functionsCurrentName = res.functionsCurrentName;
  functionsAreasData = res.functionsAreasData;

  resetFormulaeFields();
  formulaeQuery = res.formulaeQuery;
  formulaeCurrentId = res.formulaeCurrentId;
  formulaeCurrentShown = res.formulaeCurrentShown;
  formulaeCurrentType = res.formulaeCurrentType;
  // #endregion
  resetAngleControls();
  resetFunctionsControls();
  let funcs = document.getElementsByName("display_function");
  for (let i in funcs) {
    funcs[i].checked = funcs[i].value == functionsCurrentName;
  }
  for (let i in functionsAreasData) {
    for (let j in functionsAreasData[i]) {
      if (functionsAreasData[i][j]) {
        functionsAreaLoad(i, j, functionsAreasData[i][j]);
      }
    }
  }

  resetFormulaeControls();
  updateState();
}

// #endregion

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

let defaultGuidelines;
const defaultFunctionsTolerance = 0.001;
const defaultFunctions = {
  sin: [
    0.0,
    1.0,
    -1.0,
    1.0 / 2,
    -1.0 / 2,
    1.0 / Math.sqrt(2),
    -1.0 / Math.sqrt(2),
    Math.sqrt(3) / 2,
    -Math.sqrt(3) / 2,
  ],
  cos: [
    0.0,
    1.0,
    -1.0,
    1.0 / 2,
    -1.0 / 2,
    1.0 / Math.sqrt(2),
    -1.0 / Math.sqrt(2),
    Math.sqrt(3) / 2,
    -Math.sqrt(3) / 2,
  ],
  tan: [
    0.0,
    1.0,
    -1.0,
    1.0 / Math.sqrt(3),
    -1.0 / Math.sqrt(3),
    Math.sqrt(3),
    -Math.sqrt(3),
  ],
  cot: [
    0.0,
    1.0,
    -1.0,
    1.0 / Math.sqrt(3),
    -1.0 / Math.sqrt(3),
    Math.sqrt(3),
    -Math.sqrt(3),
  ],
};
let loadGuidelines = fetch("./default-guidelines.json").then(async (r) =>
  r.json().then((res) => {
    defaultGuidelines = res;
  })
);
let dynamicGuidelines;

function initGuidelines() {
  for (i in defaultGuidelines) {
    addLine(defaultGuidelines[i].value);
  }
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

function initGuidelineLabels() {
  for (let i in defaultGuidelines) {
    let label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    let gDA = defaultGuidelines[i];
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
    label.setAttribute("visibility", "hidden");
    svg.appendChild(label);

    let labelPoint = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    labelPoint.setAttribute("cx", x0 + r0 * Math.cos(gDA.value));
    labelPoint.setAttribute("cy", y0 - r0 * Math.sin(gDA.value));
    labelPoint.setAttribute("r", 0.3);
    labelPoint.setAttribute("fill", "black");
    labelPoint.setAttribute("visibility", "hidden");
    svg.appendChild(labelPoint);

    labels.push({ l: label, gda: gDA, p: labelPoint });
  }
}

let pointerLabelBg = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "text"
);
pointerLabelBg.setAttribute("visibility", "hidden");
pointerLabelBg.setAttribute("class", "angle-label");
pointerLabelBg.setAttribute("dominant-baseline", "middle");
pointerLabelBg.setAttribute("text-anchor", "middle");
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
pointerLabel.setAttribute("class", "pointer-label");
svg.appendChild(pointerLabel);

// #endregion

// #region Creating functions lines

//const functionsLinesDashPattern="0.5,0.5";
const functionsLinesOpacity = 0.4;
let functionsSinLine = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "line"
);
functionsSinLine.setAttribute("visibility", "hidden");
functionsSinLine.setAttribute("stroke", "blue");
//functionsSinLine.setAttribute("stroke-dasharray", functionsLinesDashPattern);
functionsSinLine.setAttribute("opacity", functionsLinesOpacity);
functionsSinLine.style.transformOrigin = "center";
functionsSinLine.setAttribute("x1", x0);
functionsSinLine.setAttribute("y1", y0);
functionsSinLine.setAttribute("x2", x0);
functionsSinLine.setAttribute("y2", y0 - r0);
svg.appendChild(functionsSinLine);

let functionsCosLine = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "line"
);
functionsCosLine.setAttribute("visibility", "hidden");
functionsCosLine.setAttribute("stroke", "red");
//functionsCosLine.setAttribute("stroke-dasharray", functionsLinesDashPattern);
functionsCosLine.setAttribute("opacity", functionsLinesOpacity);
functionsCosLine.style.transformOrigin = "center";
functionsCosLine.setAttribute("x1", x0);
functionsCosLine.setAttribute("y1", y0);
functionsCosLine.setAttribute("x2", x0 + r0);
functionsCosLine.setAttribute("y2", y0);
svg.appendChild(functionsCosLine);

let functionsTanLine = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "line"
);
functionsTanLine.setAttribute("visibility", "hidden");
functionsTanLine.setAttribute("stroke", "purple");
//functionsTanLine.setAttribute("stroke-dasharray", functionsLinesDashPattern);
functionsTanLine.setAttribute("opacity", functionsLinesOpacity);
functionsTanLine.style.transformOrigin = "center";
functionsTanLine.setAttribute("x1", x0 - 5 * r0);
functionsTanLine.setAttribute("y1", y0);
functionsTanLine.setAttribute("x2", x0 + 5 * r0);
functionsTanLine.setAttribute("y2", y0);
svg.appendChild(functionsTanLine);

// #endregion

// #region Creating functions labels

let functionsSinLabelBg = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "text"
);
functionsSinLabelBg.setAttribute("visibility", "hidden");
functionsSinLabelBg.setAttribute("class", "functions-label-bg");
functionsSinLabelBg.setAttribute("dominant-baseline", "middle");
functionsSinLabelBg.setAttribute("text-anchor", "middle");
functionsSinLabelBg.setAttribute("x", x0);
functionsSinLabelBg.setAttribute("y", y0);
svg.appendChild(functionsSinLabelBg);
let functionsSinLabel = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "text"
);
functionsSinLabel.setAttribute("visibility", "hidden");
functionsSinLabel.setAttribute("class", "functions-label sin-label");
functionsSinLabel.setAttribute("dominant-baseline", "middle");
functionsSinLabel.setAttribute("text-anchor", "middle");
functionsSinLabel.setAttribute("x", x0);
functionsSinLabel.setAttribute("y", y0);
svg.appendChild(functionsSinLabel);

let functionsCosLabelBg = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "text"
);
functionsCosLabelBg.setAttribute("visibility", "hidden");
functionsCosLabelBg.setAttribute("class", "functions-label-bg");
functionsCosLabelBg.setAttribute("dominant-baseline", "middle");
functionsCosLabelBg.setAttribute("text-anchor", "middle");
functionsCosLabelBg.setAttribute("x", x0);
functionsCosLabelBg.setAttribute("y", y0);
svg.appendChild(functionsCosLabelBg);
let functionsCosLabel = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "text"
);
functionsCosLabel.setAttribute("visibility", "hidden");
functionsCosLabel.setAttribute("class", "functions-label cos-label");
functionsCosLabel.setAttribute("dominant-baseline", "middle");
functionsCosLabel.setAttribute("text-anchor", "middle");
functionsCosLabel.setAttribute("x", x0);
functionsCosLabel.setAttribute("y", y0);
svg.appendChild(functionsCosLabel);

let functionsTanLabelBg1 = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "text"
);
functionsTanLabelBg1.setAttribute("visibility", "hidden");
functionsTanLabelBg1.setAttribute("class", "functions-label-bg");
functionsTanLabelBg1.setAttribute("dominant-baseline", "middle");
functionsTanLabelBg1.setAttribute("text-anchor", "middle");
functionsTanLabelBg1.setAttribute("x", x0);
functionsTanLabelBg1.setAttribute("y", y0);
svg.appendChild(functionsTanLabelBg1);
let functionsTanLabel1 = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "text"
);
functionsTanLabel1.setAttribute("visibility", "hidden");
functionsTanLabel1.setAttribute("class", "functions-label tan-label");
functionsTanLabel1.setAttribute("dominant-baseline", "middle");
functionsTanLabel1.setAttribute("text-anchor", "middle");
functionsTanLabel1.setAttribute("x", x0);
functionsTanLabel1.setAttribute("y", y0);
svg.appendChild(functionsTanLabel1);

let functionsTanLabelBg2 = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "text"
);
functionsTanLabelBg2.setAttribute("visibility", "hidden");
functionsTanLabelBg2.setAttribute("class", "functions-label-bg");
functionsTanLabelBg2.setAttribute("dominant-baseline", "middle");
functionsTanLabelBg2.setAttribute("text-anchor", "middle");
functionsTanLabelBg2.setAttribute("x", x0);
functionsTanLabelBg2.setAttribute("y", y0);
svg.appendChild(functionsTanLabelBg2);
let functionsTanLabel2 = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "text"
);
functionsTanLabel2.setAttribute("visibility", "hidden");
functionsTanLabel2.setAttribute("class", "functions-label tan-label");
functionsTanLabel2.setAttribute("dominant-baseline", "middle");
functionsTanLabel2.setAttribute("text-anchor", "middle");
functionsTanLabel2.setAttribute("x", x0);
functionsTanLabel2.setAttribute("y", y0);
svg.appendChild(functionsTanLabel2);

let functionscTanLabelBg1 = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "text"
);
functionscTanLabelBg1.setAttribute("visibility", "hidden");
functionscTanLabelBg1.setAttribute("class", "functions-label-bg");
functionscTanLabelBg1.setAttribute("dominant-baseline", "middle");
functionscTanLabelBg1.setAttribute("text-anchor", "middle");
functionscTanLabelBg1.setAttribute("x", x0);
functionscTanLabelBg1.setAttribute("y", y0);
svg.appendChild(functionscTanLabelBg1);
let functionscTanLabel1 = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "text"
);
functionscTanLabel1.setAttribute("visibility", "hidden");
functionscTanLabel1.setAttribute("class", "functions-label tan-label");
functionscTanLabel1.setAttribute("dominant-baseline", "middle");
functionscTanLabel1.setAttribute("text-anchor", "middle");
functionscTanLabel1.setAttribute("x", x0);
functionscTanLabel1.setAttribute("y", y0);
svg.appendChild(functionscTanLabel1);

let functionscTanLabelBg2 = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "text"
);
functionscTanLabelBg2.setAttribute("visibility", "hidden");
functionscTanLabelBg2.setAttribute("class", "functions-label-bg");
functionscTanLabelBg2.setAttribute("dominant-baseline", "middle");
functionscTanLabelBg2.setAttribute("text-anchor", "middle");
functionscTanLabelBg2.setAttribute("x", x0);
functionscTanLabelBg2.setAttribute("y", y0);
svg.appendChild(functionscTanLabelBg2);
let functionscTanLabel2 = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "text"
);
functionscTanLabel2.setAttribute("visibility", "hidden");
functionscTanLabel2.setAttribute("class", "functions-label tan-label");
functionscTanLabel2.setAttribute("dominant-baseline", "middle");
functionscTanLabel2.setAttribute("text-anchor", "middle");
functionscTanLabel2.setAttribute("x", x0);
functionscTanLabel2.setAttribute("y", y0);
svg.appendChild(functionscTanLabel2);

// #endregion

// #region Creating function areas

const functionsAreasLinesNormal = 0.5;
const functionsAreasLinesHighlight = 1.0;
const functionsAreasNormal = 0.3;
const functionsAreasHighlight = 0.5;
const functionsAreasOpacity = 0.6;
const functionsSinEquals = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "line"
);
functionsSinEquals.setAttribute("visibility", "hidden");
functionsSinEquals.setAttribute("stroke", "black");
functionsSinEquals.setAttribute("opacity", functionsAreasLinesNormal);
functionsSinEquals.style.transformOrigin = "center";
functionsSinEquals.setAttribute("x1", x0 - 5 * r0);
functionsSinEquals.setAttribute("y1", y0);
functionsSinEquals.setAttribute("x2", x0 + 5 * r0);
functionsSinEquals.setAttribute("y2", y0);
svg.appendChild(functionsSinEquals);

const functionsCosEquals = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "line"
);
functionsCosEquals.setAttribute("visibility", "hidden");
functionsCosEquals.setAttribute("stroke", "black");
functionsCosEquals.setAttribute("opacity", functionsAreasLinesNormal);
functionsCosEquals.style.transformOrigin = "center";
functionsCosEquals.setAttribute("x1", x0);
functionsCosEquals.setAttribute("y1", y0 - 5 * r0);
functionsCosEquals.setAttribute("x2", x0);
functionsCosEquals.setAttribute("y2", y0 + 5 * r0);
svg.appendChild(functionsCosEquals);

const functionsTanEquals = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "line"
);
functionsTanEquals.setAttribute("visibility", "hidden");
functionsTanEquals.setAttribute("stroke", "black");
functionsTanEquals.setAttribute("opacity", functionsAreasLinesNormal);
functionsTanEquals.style.transformOrigin = "center";
functionsTanEquals.setAttribute("x1", x0 - 5 * r0);
functionsTanEquals.setAttribute("y1", y0);
functionsTanEquals.setAttribute("x2", x0 + 5 * r0);
functionsTanEquals.setAttribute("y2", y0);
svg.appendChild(functionsTanEquals);

const functionsCotEquals = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "line"
);
functionsCotEquals.setAttribute("visibility", "hidden");
functionsCotEquals.setAttribute("stroke", "black");
functionsCotEquals.setAttribute("opacity", functionsAreasLinesNormal);
functionsCotEquals.style.transformOrigin = "center";
functionsCotEquals.setAttribute("x1", x0 - 5 * r0);
functionsCotEquals.setAttribute("y1", y0);
functionsCotEquals.setAttribute("x2", x0 + 5 * r0);
functionsCotEquals.setAttribute("y2", y0);
svg.appendChild(functionsCotEquals);

const functionsSinMore = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "rect"
);
functionsSinMore.setAttribute("visibility", "hidden");
functionsSinMore.setAttribute("stroke", "transparent");
functionsSinMore.setAttribute("fill", "black");
functionsSinMore.setAttribute("opacity", functionsAreasNormal);
functionsSinMore.style.transformOrigin = "center";
functionsSinMore.setAttribute("x", x0 - 2.5 * r0);
functionsSinMore.setAttribute("y", y0 - 5 * r0);
functionsSinMore.setAttribute("width", 5 * r0);
functionsSinMore.setAttribute("height", 5 * r0);
svg.appendChild(functionsSinMore);

const functionsCosMore = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "rect"
);
functionsCosMore.setAttribute("visibility", "hidden");
functionsCosMore.setAttribute("stroke", "transparent");
functionsCosMore.setAttribute("fill", "black");
functionsCosMore.setAttribute("opacity", functionsAreasNormal);
functionsCosMore.style.transformOrigin = "center";
functionsCosMore.setAttribute("x", x0);
functionsCosMore.setAttribute("y", y0 - 2.5 * r0);
functionsCosMore.setAttribute("width", 5 * r0);
functionsCosMore.setAttribute("height", 5 * r0);
svg.appendChild(functionsCosMore);

const functionsTanMore = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "polygon"
);
functionsTanMore.setAttribute("visibility", "hidden");
functionsTanMore.setAttribute("stroke", "transparent");
functionsTanMore.setAttribute("fill", "black");
functionsTanMore.setAttribute("opacity", functionsAreasNormal);
functionsTanMore.style.transformOrigin = "center";
functionsTanMore.setAttribute("fill-rule", "evenodd");
svg.appendChild(functionsTanMore);

const functionsCotMore = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "polygon"
);
functionsCotMore.setAttribute("visibility", "hidden");
functionsCotMore.setAttribute("stroke", "transparent");
functionsCotMore.setAttribute("fill", "black");
functionsCotMore.setAttribute("opacity", functionsAreasNormal);
functionsCotMore.style.transformOrigin = "center";
functionsCotMore.setAttribute("fill-rule", "evenodd");
svg.appendChild(functionsCotMore);

const functionsSinLess = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "rect"
);
functionsSinLess.setAttribute("visibility", "hidden");
functionsSinLess.setAttribute("stroke", "transparent");
functionsSinLess.setAttribute("fill", "black");
functionsSinLess.setAttribute("opacity", functionsAreasNormal);
functionsSinLess.style.transformOrigin = "center";
functionsSinLess.setAttribute("x", x0 - 2.5 * r0);
functionsSinLess.setAttribute("y", y0);
functionsSinLess.setAttribute("width", 5 * r0);
functionsSinLess.setAttribute("height", 5 * r0);
svg.appendChild(functionsSinLess);

const functionsCosLess = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "rect"
);
functionsCosLess.setAttribute("visibility", "hidden");
functionsCosLess.setAttribute("stroke", "transparent");
functionsCosLess.setAttribute("fill", "black");
functionsCosLess.setAttribute("opacity", functionsAreasNormal);
functionsCosLess.style.transformOrigin = "center";
functionsCosLess.setAttribute("x", x0 - 5 * r0);
functionsCosLess.setAttribute("y", y0 - 2.5 * r0);
functionsCosLess.setAttribute("width", 5 * r0);
functionsCosLess.setAttribute("height", 5 * r0);
svg.appendChild(functionsCosLess);

const functionsTanLess = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "polygon"
);
functionsTanLess.setAttribute("visibility", "hidden");
functionsTanLess.setAttribute("stroke", "transparent");
functionsTanLess.setAttribute("fill", "black");
functionsTanLess.setAttribute("opacity", functionsAreasNormal);
functionsTanLess.style.transformOrigin = "center";
functionsTanLess.setAttribute("fill-rule", "evenodd");
svg.appendChild(functionsTanLess);

const functionsCotLess = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "polygon"
);
functionsCotLess.setAttribute("visibility", "hidden");
functionsCotLess.setAttribute("stroke", "transparent");
functionsCotLess.setAttribute("fill", "black");
functionsCotLess.setAttribute("opacity", functionsAreasNormal);
functionsCotLess.style.transformOrigin = "center";
functionsCotLess.setAttribute("fill-rule", "evenodd");
svg.appendChild(functionsCotLess);

const functionsSinPositive = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "rect"
);
functionsSinPositive.setAttribute("visibility", "hidden");
functionsSinPositive.setAttribute("stroke", "transparent");
functionsSinPositive.setAttribute("fill", "black");
functionsSinPositive.setAttribute("opacity", functionsAreasNormal);
functionsSinPositive.style.transformOrigin = "center";
functionsSinPositive.setAttribute("x", x0 - 2.5 * r0);
functionsSinPositive.setAttribute("y", y0 - 5 * r0);
functionsSinPositive.setAttribute("width", 5 * r0);
functionsSinPositive.setAttribute("height", 5 * r0);
svg.appendChild(functionsSinPositive);

const functionsCosPositive = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "rect"
);
functionsCosPositive.setAttribute("visibility", "hidden");
functionsCosPositive.setAttribute("stroke", "transparent");
functionsCosPositive.setAttribute("fill", "black");
functionsCosPositive.setAttribute("opacity", functionsAreasNormal);
functionsCosPositive.style.transformOrigin = "center";
functionsCosPositive.setAttribute("x", x0);
functionsCosPositive.setAttribute("y", y0 - 2.5 * r0);
functionsCosPositive.setAttribute("width", 5 * r0);
functionsCosPositive.setAttribute("height", 5 * r0);
svg.appendChild(functionsCosPositive);

const functionsTanPositive = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "polygon"
);
functionsTanPositive.setAttribute("visibility", "hidden");
functionsTanPositive.setAttribute("stroke", "transparent");
functionsTanPositive.setAttribute("fill", "black");
functionsTanPositive.setAttribute("opacity", functionsAreasNormal);
functionsTanPositive.style.transformOrigin = "center";
functionsTanPositive.setAttribute("fill-rule", "evenodd");
functionsTanPositive.setAttribute(
  "points",
  `${x0 - 5 * r0},${y0} ${x0 - 5 * r0},${y0 + 5 * r0} ${x0},${
    y0 + 5 * r0
  } ${x0},${y0 - 5 * r0} ${x0 + 5 * r0},${y0 - 5 * r0} ${x0 + 5 * r0},${y0}`
);
svg.appendChild(functionsTanPositive);

const functionsCotPositive = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "polygon"
);
functionsCotPositive.setAttribute("visibility", "hidden");
functionsCotPositive.setAttribute("stroke", "transparent");
functionsCotPositive.setAttribute("fill", "black");
functionsCotPositive.setAttribute("opacity", functionsAreasNormal);
functionsCotPositive.style.transformOrigin = "center";
functionsCotPositive.setAttribute("fill-rule", "evenodd");
functionsCotPositive.setAttribute(
  "points",
  `${x0 - 5 * r0},${y0} ${x0 - 5 * r0},${y0 + 5 * r0} ${x0},${
    y0 + 5 * r0
  } ${x0},${y0 - 5 * r0} ${x0 + 5 * r0},${y0 - 5 * r0} ${x0 + 5 * r0},${y0}`
);
svg.appendChild(functionsCotPositive);

const functionsSinNegative = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "rect"
);
functionsSinNegative.setAttribute("visibility", "hidden");
functionsSinNegative.setAttribute("stroke", "transparent");
functionsSinNegative.setAttribute("fill", "black");
functionsSinNegative.setAttribute("opacity", functionsAreasNormal);
functionsSinNegative.style.transformOrigin = "center";
functionsSinNegative.setAttribute("x", x0 - 2.5 * r0);
functionsSinNegative.setAttribute("y", y0);
functionsSinNegative.setAttribute("width", 5 * r0);
functionsSinNegative.setAttribute("height", 5 * r0);
svg.appendChild(functionsSinNegative);

const functionsCosNegative = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "rect"
);
functionsCosNegative.setAttribute("visibility", "hidden");
functionsCosNegative.setAttribute("stroke", "transparent");
functionsCosNegative.setAttribute("fill", "black");
functionsCosNegative.setAttribute("opacity", functionsAreasNormal);
functionsCosNegative.style.transformOrigin = "center";
functionsCosNegative.setAttribute("x", x0 - 5 * r0);
functionsCosNegative.setAttribute("y", y0 - 2.5 * r0);
functionsCosNegative.setAttribute("width", 5 * r0);
functionsCosNegative.setAttribute("height", 5 * r0);
svg.appendChild(functionsCosNegative);

const functionsTanNegative = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "polygon"
);
functionsTanNegative.setAttribute("visibility", "hidden");
functionsTanNegative.setAttribute("stroke", "transparent");
functionsTanNegative.setAttribute("fill", "black");
functionsTanNegative.setAttribute("opacity", functionsAreasNormal);
functionsTanNegative.style.transformOrigin = "center";
functionsTanNegative.setAttribute("fill-rule", "evenodd");
functionsTanNegative.setAttribute(
  "points",
  `${x0 - 5 * r0},${y0} ${x0 + 5 * r0},${y0} ${x0 + 5 * r0},${
    y0 + 5 * r0
  } ${x0},${y0 + 5 * r0} ${x0},${y0 - 5 * r0} ${x0 - 5 * r0},${y0 - 5 * r0}`
);
svg.appendChild(functionsTanNegative);

const functionsCotNegative = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "polygon"
);
functionsCotNegative.setAttribute("visibility", "hidden");
functionsCotNegative.setAttribute("stroke", "transparent");
functionsCotNegative.setAttribute("fill", "black");
functionsCotNegative.setAttribute("opacity", functionsAreasNormal);
functionsCotNegative.style.transformOrigin = "center";
functionsCotNegative.setAttribute("fill-rule", "evenodd");
functionsCotNegative.setAttribute(
  "points",
  `${x0 - 5 * r0},${y0} ${x0 + 5 * r0},${y0} ${x0 + 5 * r0},${
    y0 + 5 * r0
  } ${x0},${y0 + 5 * r0} ${x0},${y0 - 5 * r0} ${x0 - 5 * r0},${y0 - 5 * r0}`
);
svg.appendChild(functionsCotNegative);

// #endregion
const functionAreas = [
  [
    functionsSinEquals,
    functionsCosEquals,
    functionsTanEquals,
    functionsCotEquals,
  ],
  [
    functionsSinPositive,
    functionsCosPositive,
    functionsTanPositive,
    functionsCotPositive,
  ],
  [
    functionsSinNegative,
    functionsCosNegative,
    functionsTanNegative,
    functionsCotNegative,
  ],
  [functionsSinMore, functionsCosMore, functionsTanMore, functionsCotMore],
  [functionsSinLess, functionsCosLess, functionsTanLess, functionsCotLess],
];

// #region Loading formulae base

let formulaeBase;
let fomulaePromise = fetch("./formulae.json").then(async (f) =>
  f.json().then((r) => (formulaeBase = r))
);

// #endregion

// #region Loading colors

let colorsList = [];
let colorsListPromise = fetch("./colors.json").then(async (f) =>
  f.json().then((r) => {
    for (let i in r) {
      colorsList.push({
        color: r[i],
        used: false,
      });
    }
  })
);

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

function interpretLiteral(literal) {
  if (literal === null) {
    return undefined;
  } else if (literal.length == 0) {
    return null;
  } else if (literal.includes("/")) {
    let parts = literal.split("/");
    if (parts.length != 2) {
      return undefined;
    } else {
      return Number(parts[0]) / Number(parts[1]);
    }
  } else {
    return Number(literal);
  }
}

function interpretAngle() {
  let a = interpretLiteral(angleWantLiteral);

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
  updateAngleWant();
  let iWantInterpret = interpretAngle();
  if (iWantInterpret != 0 && !iWantInterpret) {
    return;
  }
  currentAngle = iWantInterpret;
  updateState();
}

function actionAddAngle() {
  updateAngleWant();
  let iWantInterpret = interpretAngle();
  if (iWantInterpret != 0 && !iWantInterpret) {
    return;
  }
  currentAngle += iWantInterpret;
  updateState();
}

function actionSubAngle() {
  updateAngleWant();
  let iWantInterpret = interpretAngle();
  if (iWantInterpret != 0 && !iWantInterpret) {
    return;
  }
  currentAngle -= iWantInterpret;
  updateState();
}

let processId = null;
function actionSweepAngle() {
  updateAngleWant();
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

const wolframQuery = "https://www.wolframalpha.com/input?i=";
function actionFunctionAskWolfram() {
  let angle = currentAngle;
  if (currentGuideline) {
    angle = currentGuideline.litRad;
  }
  if (functionsCurrentFunctionRad.innerHTML.length > 0) {
    window.open(wolframQuery + `${functionsCurrentName}(${angle})`);
  }
}

function functionsAreaLoad(ai, fi, data) {
  let an =
    ai == 0
      ? "E"
      : ai == 1
      ? "P"
      : ai == 2
      ? "N"
      : ai == 3
      ? "M"
      : ai == 4
      ? "L"
      : null;
  let fn =
    fi == 0
      ? "sin"
      : fi == 1
      ? "cos"
      : fi == 2
      ? "tan"
      : fi == 3
      ? "cot"
      : null;
  functionsAreaAdd(`${an}-${fn}`, data.literal);
}

function functionsAreaAdd(id, literal) {
  let input;
  if (literal !== null) {
    input = interpretLiteral(literal);
    if (input === null) {
      // delete area
      actionFunctionsRemoveArea(id);
      return;
    }
    if (!input && input != 0) {
      // input is invalid
      return;
    }
  }
  let c = desypherId(id);
  if (c.fi == -1 || c.ai == -1) {
    // id is invalid
    return;
  }

  // selecting color
  let colorInd = null;
  if (functionsAreasData[c.ai][c.fi]) {
    // area for this type exists, reuse the color
    colorInd = functionsAreasData[c.ai][c.fi].color;
    colorsList[colorInd].used = true;
  } else {
    for (let i in colorsList) {
      if (!colorsList[i].used) {
        colorInd = i;
        colorsList[i].used = true;
        break;
      }
    }
  }
  let color = colorsList[colorInd].color;

  let cell = functionsAreasTableCells[c.ai][c.fi];
  cell.style.background = color;
  if (literal !== null) {
    cell.innerHTML = literal;
  }
  functionsAreasData[c.ai][c.fi] = {
    color: colorInd,
    literal: literal,
  };
  let a = functionAreas[c.ai][c.fi];
  a.setAttribute("visibility", "visible");
  a.setAttribute("stroke", color);
  a.setAttribute("fill", color);

  // determine if should create new guides
  let createGuides = true;
  for (let i in defaultFunctions[c.fn]) {
    if (
      Math.abs(defaultFunctions[c.fn][i] - input) < defaultFunctionsTolerance
    ) {
      createGuides = false;
      break;
    }
  }
  dynamicGuidelines = dynamicGuidelines.filter((g) => g.id !== id);
  switch (true) {
    case c.fn == "sin":
      a.style.transform = `translate(0px, ${-r0 * input}px)`;
      if (Math.abs(input) < 1 && createGuides) {
        dynamicGuidelines.push({
          id: id,
          value: Math.asin(input),
          litRad: `asin(${literal})`,
          litDeg: (Math.asin(input) / pi) * 180,
          sin: literal,
          cos: `√(1 - (${literal})^2)`,
          cos_tex: `\\sqrt{1 - (${literal})^2}`,
          tan: `${literal}/√(1 - (${literal})^2)`,
          tan_tex: `\\dfrac{${literal}}{\\sqrt{1 - (${literal})^2}}`,
          cot: `√(1 - (${literal})^2)/${literal}`,
          cot_tex: `\\dfrac{\\sqrt{1 - (${literal})^2}}{${literal}}`,
        });
        dynamicGuidelines.push({
          id: id,
          value: pi - Math.asin(input),
          litRad: `π-asin(${literal})`,
          litDeg: pi - (Math.asin(input) / pi) * 180,
          sin: literal,
          cos: `-√(1 - (${literal})^2)`,
          cos_tex: `-\\sqrt{1 - (${literal})^2}`,
          tan: `-${literal}/√(1 - (${literal})^2)`,
          tan_tex: `-\\dfrac{${literal}}{\\sqrt{1 - (${literal})^2}}`,
          cot: `-√(1 - (${literal})^2)/${literal}`,
          cot_tex: `-\\dfrac{\\sqrt{1 - (${literal})^2}}{${literal}}`,
        });
      }
      break;
    case c.fn == "cos":
      a.style.transform = `translate(${r0 * input}px, 0px)`;
      if (Math.abs(input) < 1 && createGuides) {
        dynamicGuidelines.push({
          id: id,
          value: Math.acos(input),
          litRad: `acos(${literal})`,
          litDeg: (Math.acos(input) / pi) * 180,
          sin: `√(1 - (${literal})^2)`,
          sin_tex: `\\sqrt{1 - (${literal})^2}`,
          cos: literal,
          tan: `√(1 - (${literal})^2)/${literal}`,
          tan_tex: `\\dfrac{\\sqrt{1 - (${literal})^2}}{${literal}}`,
          cot: `${literal}/√(1 - (${literal})^2)`,
          cot_tex: `\\dfrac{${literal}}{\\sqrt{1 - (${literal})^2}}`,
        });
        dynamicGuidelines.push({
          id: id,
          value: -Math.acos(input),
          litRad: `-acos(${literal})`,
          litDeg: (-Math.acos(input) / pi) * 180,
          sin: `-√(1 - (${literal})^2)`,
          sin_tex: `-\\sqrt{1 - (${literal})^2}`,
          cos: literal,
          tan: `-√(1 - (${literal})^2)/${literal}`,
          tan_tex: `-\\dfrac{\\sqrt{1 - (${literal})^2}}{${literal}}`,
          cot: `-${literal}/√(1 - (${literal})^2)`,
          cot_tex: `-\\dfrac{${literal}}{\\sqrt{1 - (${literal})^2}}`,
        });
      }
      break;
    case c.fn == "tan":
      if (c.at == "E") {
        a.style.transform = `rotate(${-Math.atan(input)}rad)`;
      } else if (c.at == "M") {
        a.setAttribute(
          "points",
          `${x0},${y0 - 5 * r0} ${x0 + 5 * r0},${y0 - 5 * r0} ${x0 + 5 * r0},${
            y0 - 5 * r0 * input
          } ${x0 - 5 * r0},${y0 + 5 * r0 * input}  ${x0 - 5 * r0},${
            y0 + 5 * r0
          } ${x0},${y0 + 5 * r0}`
        );
      } else if (c.at == "L") {
        a.setAttribute(
          "points",
          `${x0},${y0 + 5 * r0} ${x0 + 5 * r0},${y0 + 5 * r0} ${x0 + 5 * r0},${
            y0 - 5 * r0 * input
          } ${x0 - 5 * r0},${y0 + 5 * r0 * input} ${x0 - 5 * r0},${
            y0 - 5 * r0
          } ${x0},${y0 - 5 * r0} `
        );
      }
      if (createGuides) {
        dynamicGuidelines.push({
          id: id,
          value: Math.atan(input),
          litRad: `atan(${literal})`,
          litDeg: (Math.atan(input) / pi) * 180,
          sin: `${input < 0 ? "-" : ""}1/√(1 + 1/(${literal})^2)`,
          sin_tex: `${
            input < 0 ? "-" : ""
          }\\dfrac{1}{\\sqrt{1 + \\dfrac{1}{(${literal})^2}}}`,
          cos: `1/√(1 + (${literal})^2)`,
          cos_tex: `\\dfrac{1}{\\sqrt{1 + (${literal})^2}}`,
          tan: literal,
          cot: `1/(${literal})`,
          cot_tex: `\\dfrac{1}{${literal}}`,
        });
        dynamicGuidelines.push({
          id: id,
          value: Math.atan(input) + pi,
          litRad: `atan(${literal})+π`,
          litDeg: (Math.atan(input) / pi) * 180 + 180,
          sin: `${input > 0 ? "-" : ""}1/√(1 + 1/(${literal})^2)`,
          sin_tex: `${
            input > 0 ? "-" : ""
          }\\dfrac{1}{\\sqrt{1 + \\dfrac{1}{(${literal})^2}}}`,
          cos: `-1/√(1 + (${literal})^2)`,
          cos_tex: `-\\dfrac{1}{\\sqrt{1 + (${literal})^2}}`,
          tan: literal,
          cot: `1/(${literal})`,
          cot_tex: `\\dfrac{1}{${literal}}`,
        });
      }
      break;
    case c.fn == "cot":
      if (c.at == "E") {
        a.style.transform = `rotate(${-Math.atan(1.0 / input)}rad)`;
      } else if (c.at == "M") {
        a.setAttribute(
          "points",
          `${x0 + 5 * r0},${y0} ${x0 + 5 * r0},${y0 - 5 * r0} ${
            x0 + 5 * r0 * input
          },${y0 - 5 * r0} ${x0 - 5 * r0 * input},${y0 + 5 * r0}  ${
            x0 - 5 * r0
          },${y0 + 5 * r0} ${x0 - 5 * r0},${y0}`
        );
      } else if (c.at == "L") {
        a.setAttribute(
          "points",
          `${x0 - 5 * r0},${y0} ${x0 - 5 * r0},${y0 - 5 * r0} ${
            x0 + 5 * r0 * input
          },${y0 - 5 * r0} ${x0 - 5 * r0 * input},${y0 + 5 * r0} ${
            x0 + 5 * r0
          },${y0 + 5 * r0} ${x0 + 5 * r0},${y0} `
        );
      }
      if (createGuides) {
        dynamicGuidelines.push({
          id: id,
          value: Math.atan(1.0 / input),
          litRad: `acot(${literal})`,
          litDeg: (Math.atan(1.0 / input) / pi) * 180,
          sin: `1/√(1 + (${literal})^2)`,
          sin_tex: `\\dfrac{1}{\\sqrt{1 + (${literal})^2}}`,
          cos: `${input < 0 ? "-" : ""}1/√(1 + 1/(${literal})^2)`,
          cos_tex: `${
            input < 0 ? "-" : ""
          }\\dfrac{1}{\\sqrt{1 + \\dfrac{1}{(${literal})^2}}}`,
          tan: `1/(${literal})`,
          tan_tex: `\\dfrac{1}{${literal}}`,
          cot: literal,
        });
        dynamicGuidelines.push({
          id: id,
          value: Math.atan(1.0 / input) - pi,
          litRad: `acot(${literal})-π`,
          litDeg: (Math.atan(1.0 / input) / pi) * 180 - 180,
          sin: `-1/√(1 + (${literal})^2)`,
          sin_tex: `-\\dfrac{1}{\\sqrt{1 + (${literal})^2}}`,
          cos: `${input > 0 ? "-" : ""}1/√(1 + 1/(${literal})^2)`,
          cos_tex: `${
            input > 0 ? "-" : ""
          }\\dfrac{1}{\\sqrt{1 + \\dfrac{1}{(${literal})^2}}}`,
          tan: `1/(${literal})`,
          tan_tex: `\\dfrac{1}{${literal}}`,
          cot: literal,
        });
      }
      break;
    case c.at == "P":
    case c.at == "N":
    default:
  }
}


// TODO FREE THIS!!
function actionFunctionEquals() {
  updateFunctionAreasLiterals();
  functionsAreaAdd(`E-${functionsCurrentName}`, functionsAreasEqualsLiteral);
}

function actionFunctionMore() {
  updateFunctionAreasLiterals();
  functionsAreaAdd(`M-${functionsCurrentName}`, functionsAreasMoreLiteral);
}

function actionFunctionLess() {
  updateFunctionAreasLiterals();
  functionsAreaAdd(`L-${functionsCurrentName}`, functionsAreasLessLiteral);
}

function actionFunctionPositive() {
  updateFunctionAreasLiterals();
  functionsAreaAdd(`P-${functionsCurrentName}`, null);
}

function actionFunctionNegative() {
  updateFunctionAreasLiterals();
  functionsAreaAdd(`N-${functionsCurrentName}`, null);
}

function desypherId(id) {
  let parts = id.split("-");
  let areaType = parts[0];
  let areaTypeIndex =
    areaType == "E"
      ? 0
      : areaType == "P"
      ? 1
      : areaType == "N"
      ? 2
      : areaType == "M"
      ? 3
      : areaType == "L"
      ? 4
      : -1;
  let functionName = parts[1];
  let functionIndex =
    functionName == "sin"
      ? 0
      : functionName == "cos"
      ? 1
      : functionName == "tan"
      ? 2
      : functionName == "cot"
      ? 3
      : -1;
  return {
    at: areaType,
    ai: areaTypeIndex,
    fn: functionName,
    fi: functionIndex,
  };
}

function actionFunctionsRemoveArea(id) {
  let c = desypherId(id);
  if (c.ai == -1 || c.fi == -1 || !functionsAreasData[c.ai][c.fi]) {
    // area does not exist already
    return;
  }

  colorsList[functionsAreasData[c.ai][c.fi].color].used = false;
  functionsAreasData[c.ai][c.fi] = null;
  functionAreas[c.ai][c.fi].setAttribute("visibility", "hidden");
  functionsAreasTableCells[c.ai][c.fi].style.backgroundColor = "white";
  functionsAreasTableCells[c.ai][c.fi].innerHTML = "";
  dynamicGuidelines = dynamicGuidelines.filter((g) => g.id !== id);
}

function actionFunctionsHighlightArea(id) {
  let c = desypherId(id);
  functionAreas[c.ai][c.fi].setAttribute(
    "opacity",
    c.at == "E" ? functionsAreasLinesHighlight : functionsAreasHighlight
  );
}

function actionFunctionsDehighlightArea(id) {
  let c = desypherId(id);
  functionAreas[c.ai][c.fi].setAttribute(
    "opacity",
    c.at == "E" ? functionsAreasLinesNormal : functionsAreasNormal
  );
}

function actionFormulaeAskWolfram() {
  if (formulaeQuery.length > 0) {
    window.open(wolframQuery + `${formulaeQuery}`);
  }
}

function actionFormulaeGet() {
  let input = formulaeQuery.replace(" ", "");
  let result = formulaeBase.filter((formula) => formula.result === input);
  formulaeResultName.innerHTML = "Get " + katexNormalRender(input);
  formulaeDisplayList(result);

  formulaeCurrentShown = result.map((f) => f.id);
  formulaeCurrentType = {
    prefix: "Get",
  };
}

function actionFormulaeUse() {
  let result;
  if (formulaeCurrentId || formulaeCurrentId == 0) {
    // get uses for formula
    let selected = formulaeGetSelected();
    result = formulaeBase.filter((formula) =>
      formula.parents.includes(Number(formulaeCurrentId))
    );
    formulaeResultName.innerHTML = "Use " + katexNormalRender(selected.tex);
    formulaeDisplayList(result);

    formulaeCurrentType = {
      prefix: "Use",
      id: selected.id,
    };
  } else {
    // get uses for expression
    let input = formulaeQuery.replace(" ", "");
    result = formulaeBase.filter((formula) => formula.uses.includes(input));
    formulaeResultName.innerHTML = "Use " + katexNormalRender(input);
    formulaeDisplayList(result);

    formulaeCurrentType = {
      prefix: "Use",
    };
  }

  formulaeCurrentShown = result.map((f) => f.id);
}

function actionFormulaeParents() {
  if (!formulaeCurrentId && formulaeCurrentId != 0) {
    console.log(
      "Must select formula to find parents, id = " + formulaeCurrentId
    );
    return;
  }
  // Arrays.find would not copy/reference parents:[] field. So, I'm forced to do it this way:
  let selected = formulaeGetSelected();
  if (selected.parents.length == 0) {
    console.log("Selected node has no parents");
    console.log(selected);
    return;
  }
  formulaeResultName.innerHTML =
    "Parents of " + katexNormalRender(selected.tex);

  let result = formulaeBase.filter((formula) =>
    selected.parents.includes(formula.id)
  );
  formulaeDisplayList(result);

  formulaeCurrentShown = result.map((f) => f.id);
  formulaeCurrentType = {
    prefix: "Parents of",
    id: selected.id,
  };
}

function formulaeGetSelected() {
  // Arrays.find would not copy/reference parents:[] field. So, I'm forced to do it this way:
  for (let i in formulaeBase) {
    if (formulaeBase[i].id == formulaeCurrentId) {
      return formulaeBase[i];
    }
  }
}

function formulaeDisplayList(list) {
  formulaeResult.innerHTML = "";
  for (let i in list) {
    formulaeResult.innerHTML += `<label><input type="radio" name="formulae_selected" onclick="formulaeCurrentId=event.target.value" value="${
      list[i].id
    }">${katexNormalRender(list[i].tex)}</label>${
      list[i].wikiref
        ? `<a target="_blank" class="wikiref" href="${list[i].wikiref}">wiki</a>`
        : ""
    }<br>`;
  }
  if (formulaeResult.innerHTML.length == 0) {
    formulaeResult.innerHTML = "No matching formulae was found";
  }
}

function katexNormalRender(str) {
  return katex.renderToString(`\\mathrm{${str}}`);
}

function formulaeDeselectList() {
  let fls = document.getElementsByName("formulae_selected");
  for (let i in fls) fls[i].checked = false;
}

// #endregion

// #region Fraction input preamble
const spaceKey = 32;
const allowedKeys = [
  // Neigher of these work on mobile, I persume:
  45, // hyphen
  190,
  46, // period (.) (DIFFERENT ON PC AND PHONE WTF)
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
  8, // backspace
];
// #endregion
function fractionInput() {
  var e = window.event;
  var key = e.which;
  if (key == spaceKey) {
    e.preventDefault();
    e.target.value += "/";
  }
  /*
  else if (!allowedKeys.includes(key)) {
    e.preventDefault();
  }
  */
}

// #region Query params

const urlForState =
  "https://dzuchun.github.io/interactive-trigonometry/interactive-trigonometry.html?state=";
var queryParams;
(window.onpopstate = function () {
  var match,
    pl = /\+/g, // Regex for replacing addition symbol with a space
    search = /([^&=]+)=?([^&]*)/g,
    decode = function (s) {
      return decodeURIComponent(s.replace(pl, " "));
    },
    query = window.location.search.substring(1);

  queryParams = {};
  while ((match = search.exec(query)))
    queryParams[decode(match[1])] = decode(match[2]);
})();

// #endregion

function moveSVG() {
  svg.insertBefore(pointerLine, null);
  svg.insertBefore(pointerPoint, null);
  svg.insertBefore(pointerArc, null);
  svg.insertBefore(pointerLabelBg, null);
  svg.insertBefore(pointerLabel, null);
}

Promise.all([loadGuidelines, fomulaePromise, colorsListPromise]).then(() => {
  initGuidelines();
  initGuidelineLabels();
  moveSVG();
  defaultAngleState();
  defaultFunctionsState();
  defaultFormulaeState();
  updateState();

  if (queryParams["state"]) {
    loadState(queryParams["state"]);
  }
});
