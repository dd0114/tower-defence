export class Utils {
  static changeAlpha(rgbString, newAlpha) {
    const rgbaRegex = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/;

    const match = rgbString.match(rgbaRegex);
    if (!match) {
      throw new Error("Invalid RGB(A) string format");
    }

    const [_, r, g, b, a] = match;

    return `rgba(${r}, ${g}, ${b}, ${newAlpha})`;
  }
}