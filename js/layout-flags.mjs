function asBool(value) {
  return value === true;
}

export function normalizeLayout(layout) {
  const src = layout && typeof layout === "object" ? layout : {};
  return {
    dense: asBool(src.dense),
    hidePhoto: asBool(src.hidePhoto),
    hideHobbies: asBool(src.hideHobbies),
    hideStats: asBool(src.hideStats),
  };
}

export function layoutCssClasses(layout) {
  const flags = normalizeLayout(layout);
  const classes = [];
  if (flags.dense) classes.push("cv--dense");
  if (flags.hidePhoto) classes.push("cv--hide-photo");
  if (flags.hideHobbies) classes.push("cv--hide-hobbies");
  if (flags.hideStats) classes.push("cv--hide-stats");
  return classes;
}
