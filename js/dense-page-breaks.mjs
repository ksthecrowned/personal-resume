/**
 * Dense multi-page helpers:
 * - split the skills card across A4 pages (close on page N, reopen on N+1)
 * - push keep-together blocks that would straddle a cut down to the next page
 *   (with top page padding)
 */

export function measureCssLengthPx(cssLength) {
  const probe = document.createElement("div");
  probe.style.cssText = `position:absolute;visibility:hidden;height:${cssLength};pointer-events:none;`;
  document.body.appendChild(probe);
  const height = probe.offsetHeight;
  probe.remove();
  return height;
}

export function measurePageHeightPx() {
  return measureCssLengthPx("var(--page-height)") || Math.round((297 / 25.4) * 96);
}

export function measurePagePaddingPx() {
  return measureCssLengthPx("var(--page-padding)") || Math.round((3 / 25.4) * 96);
}

function resetSkillsSplit(page) {
  const continued = page.querySelector("#skills-section-continued");
  if (!continued) return;
  const primary = page.querySelector("#skills-container");
  const continuedCard = continued.querySelector(".cv-card--skills");
  if (primary && continuedCard) {
    while (continuedCard.firstChild) {
      primary.appendChild(continuedCard.firstChild);
    }
  }
  continued.remove();
}

function resetSpacers(page) {
  resetSkillsSplit(page);
  page.querySelectorAll("[data-page-break-spacer]").forEach((el) => {
    el.style.marginTop = "";
    el.removeAttribute("data-page-break-spacer");
  });
  const education = page.querySelector("#education-section");
  if (education) {
    education.style.paddingTop = "";
    education.style.transform = "";
    education.removeAttribute("data-align-with-formations");
  }
  page.style.minHeight = "";
  page.style.removeProperty("--dense-page-count");
}

/**
 * Align the top of Éducation with Formations (left column) when requested.
 * Uses transform so it does not fight dense page-break marginTop.
 * Skips alignment if it would overlap an experience card (e.g. Projets).
 */
export function alignEducationWithFormations(pageEl) {
  const page = pageEl || document.getElementById("cv-page");
  if (!page) return;

  const enabled =
    page.dataset.alignEducationFormations === "1" ||
    page.classList.contains("cv--align-education-formations");
  if (!enabled) return;

  const education = page.querySelector("#education-section");
  const formations = page.querySelector("#formations-section");
  if (!education || !formations) return;
  if (!formations.closest(".col-left")) return;

  education.style.transform = "";
  education.removeAttribute("data-align-with-formations");

  const pageTop = page.getBoundingClientRect().top;
  const formTop = formations.getBoundingClientRect().top - pageTop;
  const eduTop = education.getBoundingClientRect().top - pageTop;
  const delta = formTop - eduTop;

  if (Math.abs(delta) < 0.5) return;

  const projectedTop = eduTop + delta;
  const projectedBottom =
    projectedTop + education.getBoundingClientRect().height;
  const overlapsExperience = [
    ...page.querySelectorAll(".experience-card"),
    page.querySelector("#projects-section:not([hidden])"),
  ]
    .filter(Boolean)
    .some((card) => {
      const top = card.getBoundingClientRect().top - pageTop;
      const bottom = card.getBoundingClientRect().bottom - pageTop;
      return projectedTop < bottom - 0.5 && projectedBottom > top + 0.5;
    });
  if (overlapsExperience) return;

  education.style.transform = `translateY(${delta}px)`;
  education.setAttribute("data-align-with-formations", "1");
}

/**
 * Close the skills card before the A4 cut and reopen a "(suite)" card on the
 * next page, instead of leaving one discontinuous card across pages.
 */
function splitSkillsAcrossPages(page, pageHeightPx, pagePaddingPx) {
  resetSkillsSplit(page);

  const skillsSection = page.querySelector("#skills-section");
  const container = page.querySelector("#skills-container");
  if (!skillsSection || !container) return 0;

  const blocks = [...container.querySelectorAll(".skill-block")];
  if (blocks.length < 2) return 0;

  const pageTop = page.getBoundingClientRect().top;
  // Only split at the first page boundary for now (page 1 → page 2).
  const boundary = pageHeightPx;

  const firstOverflowIndex = blocks.findIndex((block) => {
    const bottom = block.getBoundingClientRect().bottom - pageTop;
    return bottom > boundary + 0.5;
  });

  // Nothing overflows, or even the first block overflows (push whole section later).
  if (firstOverflowIndex <= 0) return 0;

  const continuedBlocks = blocks.slice(firstOverflowIndex);
  const baseLabel =
    skillsSection.querySelector(".section-label")?.textContent?.trim() ||
    "Compétences techniques";

  const continuedSection = document.createElement("section");
  continuedSection.className = "cv-section cv-section--skills-continued";
  continuedSection.id = "skills-section-continued";

  const label = document.createElement("h2");
  label.className = "section-label";
  label.textContent = `${baseLabel}`;

  const card = document.createElement("div");
  card.className = "cv-card cv-card--skills";
  continuedBlocks.forEach((block) => card.appendChild(block));

  continuedSection.appendChild(label);
  continuedSection.appendChild(card);
  skillsSection.after(continuedSection);

  const top =
    continuedSection.getBoundingClientRect().top -
    page.getBoundingClientRect().top;
  const targetTop = boundary + pagePaddingPx;
  if (top < targetTop) {
    continuedSection.style.marginTop = `${targetTop - top}px`;
    continuedSection.setAttribute("data-page-break-spacer", "1");
  }

  return continuedBlocks.length;
}

function collectKeepTogetherBlocks(page) {
  return [
    // Skill blocks remaining in the primary card (continued section is handled as a unit)
    ...page.querySelectorAll("#skills-container .skill-block"),
    ...page.querySelectorAll("#skills-section-continued .skill-block"),
    page.querySelector("#skills-section-continued"),
    ...page.querySelectorAll(".experience-card"),
    page.querySelector("#projects-section"),
    page.querySelector("#education-section"),
    page.querySelector("#formations-section"),
  ].filter(Boolean);
}

/**
 * @param {HTMLElement | null} [pageEl]
 * @returns {{ pageCount: number, adjusted: number }}
 */
export function alignDensePageBreaks(pageEl) {
  const page = pageEl || document.getElementById("cv-page");
  if (!page?.classList.contains("cv--dense")) {
    if (page) resetSpacers(page);
    return { pageCount: 1, adjusted: 0 };
  }

  resetSpacers(page);

  const pageHeightPx = measurePageHeightPx();
  const pagePaddingPx = measurePagePaddingPx();
  let adjusted = 0;

  adjusted += splitSkillsAcrossPages(page, pageHeightPx, pagePaddingPx);

  // Multiple passes: pushing one block can move later siblings onto a boundary.
  for (let pass = 0; pass < 8; pass += 1) {
    let moved = false;
    const pageTop = page.getBoundingClientRect().top;
    const blocks = collectKeepTogetherBlocks(page);

    for (const el of blocks) {
      // Continued skills section is positioned as a unit; skip its inner blocks.
      if (
        el.classList?.contains("skill-block") &&
        el.closest("#skills-section-continued")
      ) {
        continue;
      }

      const rect = el.getBoundingClientRect();
      const top = rect.top - pageTop;
      const bottom = rect.bottom - pageTop;
      if (bottom <= top) continue;

      const pageIndex = Math.floor(top / pageHeightPx);
      const nextBoundary = (pageIndex + 1) * pageHeightPx;
      const targetTop = nextBoundary + pagePaddingPx;

      if (top < nextBoundary && bottom > nextBoundary + 0.5) {
        const currentMargin = parseFloat(getComputedStyle(el).marginTop) || 0;
        const needed = targetTop - top;
        el.style.marginTop = `${currentMargin + needed}px`;
        el.setAttribute("data-page-break-spacer", "1");
        adjusted += 1;
        moved = true;
        break;
      }
    }

    if (!moved) break;
  }

  const contentHeight = Math.max(page.scrollHeight, page.offsetHeight);
  const pageCount = Math.max(1, Math.ceil(contentHeight / pageHeightPx - 0.01));

  page.style.minHeight = `${pageCount * pageHeightPx}px`;
  page.style.setProperty("--dense-page-count", String(pageCount));

  alignEducationWithFormations(page);

  const contentHeightAfter = Math.max(page.scrollHeight, page.offsetHeight);
  const pageCountAfter = Math.max(
    1,
    Math.ceil(contentHeightAfter / pageHeightPx - 0.01),
  );
  page.style.minHeight = `${pageCountAfter * pageHeightPx}px`;
  page.style.setProperty("--dense-page-count", String(pageCountAfter));

  return { pageCount: pageCountAfter, adjusted };
}
