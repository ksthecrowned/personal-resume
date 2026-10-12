function asBool(value) {
  return value === true;
}

export function normalizeLayout(layout) {
  const src = layout && typeof layout === "object" ? layout : {};
  return {
    dense: asBool(src.dense),
    hidePhoto: asBool(src.hidePhoto),
    formationsUnderSkills: asBool(src.formationsUnderSkills),
    alignEducationWithFormations: asBool(src.alignEducationWithFormations),
    standardType: asBool(src.standardType),
  };
}

export function layoutCssClasses(layout) {
  const flags = normalizeLayout(layout);
  const classes = [];
  if (flags.dense) classes.push("cv--dense");
  if (flags.hidePhoto) classes.push("cv--hide-photo");
  if (flags.alignEducationWithFormations) {
    classes.push("cv--align-education-formations");
  }
  if (flags.standardType) classes.push("cv--standard-type");
  return classes;
}
