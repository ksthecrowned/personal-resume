import assert from "node:assert/strict";
import { normalizeLayout, layoutCssClasses } from "../js/layout-flags.mjs";

assert.deepEqual(normalizeLayout(undefined), {
  dense: false,
  hidePhoto: false,
  formationsUnderSkills: false,
  alignEducationWithFormations: false,
  standardType: false,
});

assert.deepEqual(
  normalizeLayout({
    dense: true,
    hidePhoto: true,
    formationsUnderSkills: true,
    alignEducationWithFormations: true,
    standardType: true,
  }),
  {
    dense: true,
    hidePhoto: true,
    formationsUnderSkills: true,
    alignEducationWithFormations: true,
    standardType: true,
  },
);

assert.deepEqual(layoutCssClasses(undefined), []);
assert.deepEqual(layoutCssClasses({ dense: true, hidePhoto: true }), [
  "cv--dense",
  "cv--hide-photo",
]);
assert.deepEqual(
  layoutCssClasses({ alignEducationWithFormations: true, standardType: true }),
  ["cv--align-education-formations", "cv--standard-type"],
);

assert.deepEqual(layoutCssClasses({ dense: "yes", hidePhoto: 1 }), []);

console.log("layout-flags: all tests passed");
