function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const SKILL_ICONS = {
  grid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>`,
  code: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>`,
  server: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-4V4a2 2 0 00-2-2H4a2 2 0 00-2 2v16a2 2 0 002 2h16a2 2 0 002-2v-8a2 2 0 00-2-2z" /></svg>`,
  monitor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>`,
  cloud: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 17.5a4.5 4.5 0 00-1.3-8.8A6 6 0 006.1 9.8 4 4 0 006 17.5h14z" /></svg>`,
  languages: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h9" /><path d="M8.5 6c0 5-2 8-4.5 10" /><path d="M8.5 6c0 2.5 1 4.8 3 7" /><path d="M14 18h6" /><path d="M17 6l4 12" /><path d="M19 12h-4" /></svg>`,
};

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function getVariantSlug() {
  return getQueryParam("variant") || "default";
}

function getLocale(variantData) {
  const requested = getQueryParam("lang") || getQueryParam("locale");
  const available = variantData.meta?.availableLocales || ["fr"];
  const fallback = variantData.meta?.defaultLocale || available[0] || "fr";
  if (requested && available.includes(requested)) return requested;
  if (requested && variantData.locales?.[requested]) return requested;
  return fallback;
}

function resolveLocaleContent(variantData, locale) {
  if (variantData.locales?.[locale]) {
    return { ...variantData.locales[locale], _locale: locale };
  }

  if (variantData.profile || variantData.skills || variantData.experiences) {
    return {
      meta: {
        pageTitle: variantData.meta?.pageTitle,
        targetRole: variantData.meta?.targetRole,
      },
      identity: variantData.identity || { name: "Styve Maba" },
      profile: variantData.profile || {},
      stats: variantData.stats || [],
      contacts: variantData.contacts || [],
      skills: variantData.skills || [],
      hobbies: variantData.hobbies || [],
      education: variantData.education || [],
      certifications: variantData.certifications || [],
      experiences: variantData.experiences || [],
      _locale: locale,
    };
  }

  const firstLocale = Object.keys(variantData.locales || {})[0];
  if (firstLocale) {
    return { ...variantData.locales[firstLocale], _locale: firstLocale };
  }

  throw new Error("No locale content found");
}

async function loadI18n(locale) {
  const res = await fetch(`data/i18n/${locale}.json`);
  if (!res.ok) throw new Error(`Missing i18n file for locale: ${locale}`);
  return res.json();
}

async function loadVariantData(slug) {
  const variantRes = await fetch(`data/variants/${slug}.json`);
  if (variantRes.ok) return variantRes.json();

  if (slug !== "default") {
    const defaultRes = await fetch("data/variants/default.json");
    if (defaultRes.ok) return defaultRes.json();
  }

  const legacyRes = await fetch("data/experiences.json");
  if (!legacyRes.ok) throw new Error(`HTTP ${legacyRes.status}`);
  const legacy = await legacyRes.json();
  return {
    meta: { id: "legacy", defaultLocale: "fr", availableLocales: ["fr"] },
    locales: {
      fr: {
        meta: { pageTitle: document.title },
        profile: {},
        experiences: legacy.experiences || [],
      },
    },
  };
}

function applySectionLabels(i18n) {
  document.querySelectorAll("[data-section]").forEach((el) => {
    const key = el.dataset.section;
    const label = i18n.sections?.[key];
    if (label) el.textContent = label;
  });
}

function applyIdentity(identity, profile) {
  const nameEl = document.getElementById("profile-name");
  const titleEl = document.getElementById("profile-title");
  const summaryEl = document.getElementById("profile-summary");
  const photoEl = document.getElementById("profile-photo");

  if (nameEl && identity?.name) nameEl.textContent = identity.name;
  if (titleEl && profile?.title) titleEl.textContent = profile.title;
  if (summaryEl && profile?.summary) summaryEl.textContent = profile.summary;
  if (photoEl && identity?.photoAlt) photoEl.alt = identity.photoAlt;
}

function applyMeta(meta) {
  if (meta?.pageTitle) document.title = meta.pageTitle;
}

function renderStats(stats) {
  if (!stats?.length) return "";
  return stats
    .map((stat) => {
      if (stat.type === "accent") {
        return '<div class="stat-badge stat-badge--orange" aria-hidden="true"></div>';
      }
      const colorClass =
        stat.color === "gray"
          ? "stat-badge--gray"
          : stat.color === "orange"
            ? "stat-badge--orange"
            : "stat-badge--purple";
      return `
        <div class="stat-badge ${colorClass}">
          <div class="stat-badge__value">${escapeHtml(stat.value)}</div>
          <div class="stat-badge__label">${escapeHtml(stat.label)}</div>
        </div>
      `;
    })
    .join("");
}

function renderContact(contact) {
  const icon = `<img src="assets/icons/${escapeHtml(contact.icon)}" alt="" width="80" height="80" />`;
  const inner = `
    <span class="contact-item__icon" aria-hidden="true">${icon}</span>
    ${escapeHtml(contact.text)}
  `;

  if (contact.href) {
    const external =
      contact.type === "link" ? ' target="_blank" rel="noopener"' : "";
    return `<a class="contact-item" href="${escapeHtml(contact.href)}"${external}>${inner}</a>`;
  }
  return `<div class="contact-item">${inner}</div>`;
}

function renderContacts(contacts) {
  return (contacts || []).map(renderContact).join("");
}

function renderHobbies(hobbies) {
  return (hobbies || [])
    .map(
      (hobby) => `
    <li>
      <img class="hobby-icon" src="assets/icons/${escapeHtml(hobby.icon)}" alt="" width="157" height="137" />
      <span class="hobby-label">${escapeHtml(hobby.label)}</span>
    </li>
  `,
    )
    .join("");
}

function renderEducation(education) {
  return (education || [])
    .map(
      (item) => `
    <div class="edu-item">
      <p class="edu-item__title">${escapeHtml(item.title)}</p>
      <p class="edu-item__place">${escapeHtml(item.place)}</p>
    </div>
  `,
    )
    .join("");
}

function renderCertifications(certs) {
  return (certs || [])
    .map((cert) => `<li class="cert-list__item">${escapeHtml(cert)}</li>`)
    .join("");
}

function renderList(items, className) {
  if (!items?.length) return "";
  const lis = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  return `<ul class="${className}">${lis}</ul>`;
}

function renderClients(clients) {
  if (!clients?.length) return "";
  const lis = clients
    .map((c) => {
      const name = escapeHtml(c.name);
      return c.url
        ? `<li><a href="${escapeHtml(c.url)}" target="_blank" rel="noopener">${name}</a></li>`
        : `<li>${name}</li>`;
    })
    .join("");
  return `<ul class="experience-card__clients">${lis}</ul>`;
}

function renderStack(stack, labels) {
  if (!stack?.length) return "";
  const tech = stack.map(escapeHtml).join(", ");
  const stackLabel = labels.experience?.stack || "Stack :";
  return `<p class="experience-card__stack"><span class="experience-card__stack-label">${escapeHtml(stackLabel)} </span><span class="experience-card__stack-tech">${tech}</span></p>`;
}

function renderExperience(exp, labels) {
  const roleLine = [exp.role, exp.company].filter(Boolean).join(" - ");
  const badgeType =
    exp.badgeType ||
    (exp.badge === labels.badges?.active ? "active" : "duration");
  const badgeClass =
    badgeType === "active"
      ? "experience-card__badge experience-card__badge--active"
      : "experience-card__badge experience-card__badge--duration";
  const badge = exp.badge
    ? `<span class="${badgeClass}">${escapeHtml(exp.badge)}</span>`
    : "";

  let blocks = "";
  if (exp.summary) {
    blocks += `<p class="experience-card__summary">${escapeHtml(exp.summary)}</p>`;
  }
  if (exp.missions?.length) {
    blocks += `<p class="experience-card__label">${escapeHtml(labels.experience.missions)}</p>${renderList(exp.missions, "experience-card__list")}`;
  }
  if (exp.clients?.length) {
    blocks += `<p class="experience-card__label">${escapeHtml(labels.experience.clients)}</p>${renderClients(exp.clients)}`;
  }
  if (exp.projects?.length) {
    blocks += `<p class="experience-card__label">${escapeHtml(labels.experience.projects)}</p>${renderList(exp.projects, "experience-card__list")}`;
  }
  if (exp.evolutions?.length) {
    blocks += `<p class="experience-card__label">${escapeHtml(labels.experience.evolutions)}</p>${renderList(exp.evolutions, "experience-card__list")}`;
  }
  blocks += renderStack(exp.stack, labels);

  return `
    <article class="experience-card">
      ${badge}
      <h3 class="experience-card__role">${escapeHtml(roleLine)}</h3>
      <p class="experience-card__period">${escapeHtml(exp.period)}</p>
      ${blocks}
    </article>
  `;
}

function renderSkillBlock(skill) {
  const icon = SKILL_ICONS[skill.icon] || SKILL_ICONS.grid;
  const items = (skill.items || [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  return `
    <div class="skill-block">
      <div class="skill-block__header">
        <span class="skill-block__icon" aria-hidden="true">${icon}</span>
        <h3 class="skill-block__title">${escapeHtml(skill.title)}</h3>
      </div>
      <ul class="skill-block__list">${items}</ul>
    </div>
  `;
}

function showError(container, message) {
  if (container)
    container.innerHTML = `<div class="load-error">${message}</div>`;
}

async function loadCv() {
  const slug = getVariantSlug();
  const containers = {
    stats: document.getElementById("stats-container"),
    contacts: document.getElementById("contacts-container"),
    skills: document.getElementById("skills-container"),
    hobbies: document.getElementById("hobbies-container"),
    experiences: document.getElementById("experiences-container"),
    education: document.getElementById("education-container"),
    certifications: document.getElementById("certifications-container"),
  };

  try {
    const variantData = await loadVariantData(slug);
    const locale = getLocale(variantData);
    const content = resolveLocaleContent(variantData, locale);
    const i18n = await loadI18n(locale);

    document.documentElement.lang = locale;
    applyMeta(content.meta);
    applySectionLabels(i18n);
    applyIdentity(content.identity, content.profile);

    if (containers.stats)
      containers.stats.innerHTML = renderStats(content.stats);
    if (containers.contacts)
      containers.contacts.innerHTML = renderContacts(content.contacts);
    if (containers.skills) {
      containers.skills.innerHTML = (content.skills || [])
        .map(renderSkillBlock)
        .join("");
    }
    if (containers.hobbies)
      containers.hobbies.innerHTML = renderHobbies(content.hobbies);
    if (containers.education)
      containers.education.innerHTML = renderEducation(content.education);
    if (containers.certifications) {
      containers.certifications.innerHTML = renderCertifications(
        content.certifications,
      );
    }
    if (containers.experiences) {
      containers.experiences.innerHTML = (content.experiences || [])
        .map((exp) => renderExperience(exp, i18n))
        .join("");
    }
  } catch {
    showError(
      containers.experiences,
      "Impossible de charger le CV. Lancez <code>bun run preview</code> puis ouvrez <code>/?variant=" +
        escapeHtml(slug) +
        "&amp;lang=fr</code>",
    );
  }
}

document.addEventListener("DOMContentLoaded", loadCv);
