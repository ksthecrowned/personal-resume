import assert from "node:assert/strict";
import { normalizeLayout, layoutCssClasses } from "../js/layout-flags.mjs";

assert.deepEqual(normalizeLayout(undefined), {
  dense: false,
  hidePhoto: false,
  hideHobbies: false,
  hideStats: false,
});

assert.deepEqual(
  normalizeLayout({
    dense: true,
    hidePhoto: true,
    hideHobbies: true,
    hideStats: true,
  }),
  { dense: true, hidePhoto: true, hideHobbies: true, hideStats: true },
);

assert.deepEqual(layoutCssClasses(undefined), []);
assert.deepEqual(layoutCssClasses({ dense: true, hidePhoto: true }), [
  "cv--dense",
  "cv--hide-photo",
]);

assert.deepEqual(layoutCssClasses({ dense: "yes", hidePhoto: 1 }), []);

console.log("layout-flags: all tests passed");
