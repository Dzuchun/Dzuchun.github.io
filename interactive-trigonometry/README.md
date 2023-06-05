# Interactive trigonometry

This is a tool for showing properties of trigonometric functions and solving simple equations.<br>
I designed it myself, for personal use. But I'd be happy to know this tool helps someone else.<br>
[Video Guide](https://youtu.be/pLrIVEt54HE)<br>

To anyone willing to audit the code: PREPARE TO DIE OF CRINGE AND PERMANENT BRAIN DAMAGE.

## Released features:

Visualy select an angle<br>
Set angle as value, both in rad and degree<br>
Ability to increment/decrement angle by arbitrary amount<br>
Guiding nodes to set angle precisely<br>
Show angle value, both in degree and radians<br>
Ability to sweep arc to specified angle<br>
Propose pi as an additional multiplier<br>
Display pointer's mirrors<br>
Show angle sin/cos/tan/ctan functions<br>
Query WolframAlpha for trigfunction values<br>
Show function's negative and positive zones<br>
Show function's "greater than" and "less than" zones for arbitrary expressions<br>
Ask WolframAlpha for formula<br>
Query little formula database<br>
Each formula has a set of parent formulas<br>
Display dashed lines for zone dividers<br>
Toggle if values are displayed instead of expressions for guidelines<br>
Share application state as a (more or less) compact string<br>

## Discontinued:

Resetting buttons - no much need in them, really<br>
REPO IS DISCONTINUED - I REFACTORED IT FOR 2 MONTH DAILY BY NOW, I'M SOOO DONE<br>

### TODO:

Styles!!<br>
Check all TODOs<br>
Shufle SVG elements around<br>
Text non-complete controller and graph<br>
Create at least one separate test page<br>

## Known issues:

Iterations over two-dimention array are kinda basic. Quite sure there is a more concise way to do that<br>

## Indev:

## Planned changes:

Migrate code to proper TS<br>
Add custom color support<br>
Make use of \<use\> svg element (no pun intended)<br>
Migrate styles to bootstrap<br>
Expression processing system (so that angle labels and angle representations could be displayed simplier)<br>
Show tex-based values everywhere. Including user input and angle labels (must be possible, since TeX can be rendered to SVG)<br>
Make configure tab part of a controller<br>
Use some sort of zipping algorythm on a state string (it's still quite long)<br>
Separate states for controller and graph (should I?)<br>
CHROMIUM BROWSER ENGINE SUPPORT<br>
