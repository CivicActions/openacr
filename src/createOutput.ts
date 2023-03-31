import Handlebars from "handlebars";
import spdxLicenseList from "spdx-license-list";
import { marked } from "marked";

export function createOutput(
  data: any,
  catalogData: any,
  templateType: any,
  templateString: string
): string {
  const template = Handlebars.compile(templateString);

  if (catalogData) {
    data.catalog = catalogData;
  }
  const date = new Date();
  data.now = date.toLocaleDateString();

  const getCatalogChapter = (chapterId: string): any => {
    for (const chapter of catalogData.chapters) {
      if (chapter.id === chapterId) {
        return chapter;
      }
    }
  };

  Handlebars.registerHelper("catalogChapter", getCatalogChapter);

  Handlebars.registerHelper(
    "catalogCriteriaLabel",
    function (chapterId, criteriaNum) {
      for (const chapter of catalogData.chapters) {
        if (chapter.id === chapterId) {
          for (const catalogChapterCriteria of chapter.criteria) {
            if (catalogChapterCriteria.id === criteriaNum) {
              return catalogChapterCriteria.handle;
            }
          }
        }
      }
    }
  );

  Handlebars.registerHelper(
    "catalogCriteriaURL",
    function (chapterId, criteriaNum, url) {
      for (const chapter of catalogData.chapters) {
        if (chapter.id === chapterId) {
          for (const catalogChapterCriteria of chapter.criteria) {
            if (catalogChapterCriteria.id === criteriaNum) {
              return `${url}#${catalogChapterCriteria.alt_id}`;
            }
          }
        }
      }
    }
  );

  Handlebars.registerHelper("catalogComponentLabel", function (componentId) {
    if (catalogData.components) {
      for (const component of catalogData.components) {
        if (component.id === componentId) {
          if (component.label != "") {
            if (templateType === "html") {
              return new Handlebars.SafeString(
                `<strong>${component.label}</strong>: `
              );
            } else {
              return `**${component.label}**: `;
            }
          }
        }
      }
    }
  });

  Handlebars.registerHelper("levelLabel", function (level) {
    if (catalogData.terms) {
      for (const terms of catalogData.terms) {
        if (terms.id === level) {
          return terms.label;
        }
      }
    }
    // If a level is provided but has no matching terms, provide a default.
    return "Not Applicable";
  });

  Handlebars.registerHelper("standardsIncluded", function (standardChapters) {
    const result = [];
    for (const standardChapter of standardChapters) {
      const catalogChapters = getCatalogChapter(standardChapter);
      result.push(`<li>${catalogChapters.label}</li>`);
    }
    return new Handlebars.SafeString(`<ul>${result.join("")}</ul>`);
  });

  Handlebars.registerHelper("license", function () {
    if (data.license) {
      if (templateType === "html") {
        return new Handlebars.SafeString(
          `<a href="${spdxLicenseList[data.license].url}" target="_blank">${
            spdxLicenseList[data.license].name
          } <span class="usa-sr-only">(opens in a new window or tab)</span></a>`
        );
      } else {
        return `[${spdxLicenseList[data.license].name}](${
          spdxLicenseList[data.license].url
        })`;
      }
    } else {
      if (templateType === "html") {
        return new Handlebars.SafeString(
          `<a href="${spdxLicenseList["CC-BY-4.0"].url}" target="_blank">${spdxLicenseList["CC-BY-4.0"].name} <span class="usa-sr-only">(opens in a new window or tab)</span></a>`
        );
      } else {
        return `[${spdxLicenseList["CC-BY-4.0"].name}](${spdxLicenseList["CC-BY-4.0"].url})`;
      }
    }
  });

  Handlebars.registerHelper("concat", function (a, b) {
    if (b) {
      return a + b;
    }
    return a;
  });

  Handlebars.registerHelper(
    "headerWithAnchor",
    function (headerText, idText, headerLevel) {
      return new Handlebars.SafeString(`<h${headerLevel} id="${idText}">
        ${headerText}
        <a href="#${idText}" class="header-anchor" aria-labelledby="{idText}">
          <span class="anchor-icon" aria-hidden="true">
            <svg
              focusable="false"
              aria-hidden="true"
              class="icon-link">
                <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
            </svg>
          </span>
          <span class="visuallyhidden">Anchor link</span>
        </a>
      </h${headerLevel}>`);
    }
  );

  Handlebars.registerHelper("reportFilename", function (reportVersion) {
    let reportFilename = data.product.name.toLowerCase();
    if (data.product.version) {
      reportFilename += "-" + data.product.version;
    }

    if (reportVersion && data.version) {
      reportFilename += "-" + data.version;
    }

    return reportFilename;
  });

  Handlebars.registerHelper("levelCount", function (components) {
    let levelCount = 0;
    for (const component of components) {
      if (component.adherence && component.adherence.level) {
        levelCount = levelCount + 1;
      }
    }
    return levelCount;
  });

  Handlebars.registerHelper("progressPerChapter", function (criterias) {
    let supportCount = 0;
    let partiallySupportCount = 0;
    let doesNotSupportCount = 0;
    let notApplicableCount = 0;
    for (const criteria of criterias) {
      if (criteria.components) {
        for (const component of criteria.components) {
          if (component.adherence && component.adherence.level === "supports") {
            supportCount = supportCount + 1;
          } else if (
            component.adherence &&
            component.adherence.level === "partially-supports"
          ) {
            partiallySupportCount = partiallySupportCount + 1;
          } else if (
            component.adherence &&
            component.adherence.level === "does-not-support"
          ) {
            doesNotSupportCount = doesNotSupportCount + 1;
          } else if (
            component.adherence &&
            component.adherence.level === "not-applicable"
          ) {
            notApplicableCount = notApplicableCount + 1;
          }
        }
      }
    }

    if (templateType === "html") {
      return new Handlebars.SafeString(
        `<li>${supportCount} supported</li>
        <li>${partiallySupportCount} partially supported</li>
        <li>${doesNotSupportCount} not supported</li>
        <li>${notApplicableCount} not applicable</li>`
      );
    } else {
      return `- ${supportCount} supported
- ${partiallySupportCount} partially supported
- ${doesNotSupportCount} not supported
- ${notApplicableCount} not applicable`;
    }
  });

  Handlebars.registerHelper("sanitizeMarkdown", function (text) {
    const markdown = marked.parse(text);
    return new Handlebars.SafeString(markdown);
  });

  return template(data);
}
