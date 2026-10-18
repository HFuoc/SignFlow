import devices from "../assets/one-ui/figma/devices.svg";
import monitor from "../assets/one-ui/figma/equalizer-2.svg";
import folder from "../assets/one-ui/figma/folder-outline.svg";
import labs from "../assets/one-ui/figma/labs-outline.svg";
import report from "../assets/one-ui/figma/report.svg";
import translate from "../assets/one-ui/figma/translate.svg";
import account from "../assets/one-ui/figma/contact-outline.svg";

// Reuse the same exact One UI glyph for a destination wherever it is presented.
export const workspaceIcons = {
  devices, live: monitor, studio: labs, users: account,
  dataset: folder, train: labs, evaluate: report, translate,
};
