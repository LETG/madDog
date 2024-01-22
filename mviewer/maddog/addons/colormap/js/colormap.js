
import colormap from "./createColormap.js";

const arrayRange = (start, stop, step) =>
    Array.from(
        { length: (stop - start) / step + 1 },
        (value, index) => start + index * step
    );

const colorsBySteps = (
  name = "jet",
  min,
  max,
  steps = 0.25,
  transparentFunc = () => {},
  reverse = false,
) => {
  if (typeof colormap == "undefined") return;
  const mapColorStep = [];
  let rangeValues = arrayRange(min, max, steps);
  let colors = colormap({
    colormap: name,
    nshades: rangeValues.length,
    format: "rgba",
  });
  if (reverse) {
    colors.reverse();
  }
  rangeValues.forEach((v, i) => {
    let color = colors[i];
    // value
    mapColorStep.push(v);
    // color
    if (transparentFunc && transparentFunc(v)) {
      color = [0, 0, 0, 0];
    }
    mapColorStep.push(color);
    // let rgbaText = `rgba(${color.join(",")})`;
  });
  return mapColorStep;
};

const colorsFromManyRange = (ranges, isTransparent, steps) => {
  let colors = [];
  ranges.forEach((c) => {
      const getCols = colorsBySteps(c.name, c.min, c.max, steps, isTransparent, c.reverse);
      colors = [
        ...colors,
        ...getCols,
      ];
  });
  return colors;
};
  

const init = () => {
  mviewer.customComponents.colormap = { getColors: colorsBySteps, colorRanges: colorsFromManyRange };
  document.addEventListener("colormap-componentLoaded", () => {
    console.log("ready to use !");
  })

}


new CustomComponent("colormap", init);