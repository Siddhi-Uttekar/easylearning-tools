// Converts simple LaTeX markup (as used in scraped PYQ datasets) into
// plain/unicode text suitable for rendering in PPT/DOCX text boxes that
// don't support real math typesetting.
export function cleanLatex(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }
  return text
    .replace(/\$\$([^$]+)\$\$/g, "$1")
    .replace(/\$([^$]+)\$/g, "$1")
    // LaTeX environments (aligned/itemize/array/...) — drop the delimiters
    // entirely so the environment name doesn't leak into the text.
    .replace(/\\begin\{[^}]*\}/g, "")
    .replace(/\\end\{[^}]*\}/g, "")
    // Line breaks: must run before the single-backslash spacing rules below.
    .replace(/\\\\/g, "\n")
    .replace(/\\hat\{([^}]+)\}/g, "$1̂")
    .replace(/\\overset\{\\to\s*\}\{\\mathop\{([^}]+)\}\\,\}/g, "$1⃗")
    .replace(/\\mathop\{([^}]+)\}/g, "$1")
    .replace(/\\,/g, " ")
    .replace(/\\;/g, " ")
    .replace(/\\:/g, " ")
    .replace(/\\!/g, "")
    .replace(/\\ /g, " ")
    .replace(/\\%/g, "%")
    .replace(/\\&/g, "&")
    .replace(/\\_/g, "_")
    .replace(/\\#/g, "#")
    .replace(/\\\|/g, "‖")
    .replace(/\\\{/g, "{")
    .replace(/\\\}/g, "}")
    .replace(/&there4;/g, "∴")
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
    .replace(/\{\{([^}]+)\}\}/g, "$1")
    .replace(/\\hat\{([^}]+)\}/g, "$1̂")
    .replace(/\^2/g, "²")
    .replace(/\^3/g, "³")
    .replace(
      /\^([0-9])/g,
      (_, p1) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number.parseInt(p1)] || "^" + p1,
    )
    .replace(/_{([^}]+)}/g, "₍$1₎")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
    .replace(/\\times/g, "×")
    .replace(/\\cdot/g, "·")
    .replace(/\\pm/g, "±")
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\gamma/g, "γ")
    .replace(/\\delta/g, "δ")
    .replace(/\\theta/g, "θ")
    .replace(/\\pi/g, "π")
    .replace(/\\omega/g, "ω")
    .replace(/\\Omega/g, "Ω")
    .replace(/\\mu/g, "μ")
    .replace(/\\sigma/g, "σ")
    .replace(/\\lambda/g, "λ")
    .replace(/\\phi/g, "φ")
    .replace(/\\psi/g, "ψ")
    .replace(/\\chi/g, "χ")
    .replace(/\\rho/g, "ρ")
    .replace(/\\tau/g, "τ")
    .replace(/\\epsilon/g, "ε")
    .replace(/\\zeta/g, "ζ")
    .replace(/\\eta/g, "η")
    .replace(/\\kappa/g, "κ")
    .replace(/\\nu/g, "ν")
    .replace(/\\xi/g, "ξ")
    .replace(/\\upsilon/g, "υ")
    .replace(/\\leq/g, "≤")
    .replace(/\\geq/g, "≥")
    .replace(/\\neq/g, "≠")
    .replace(/\\approx/g, "≈")
    .replace(/\\equiv/g, "≡")
    .replace(/\\propto/g, "∝")
    .replace(/\\infty/g, "∞")
    .replace(/\\partial/g, "∂")
    .replace(/\\nabla/g, "∇")
    .replace(/\\int/g, "∫")
    .replace(/\\sum/g, "∑")
    .replace(/\\prod/g, "∏")
    .replace(/\\boxed\{([^}]*)\}/g, "$1")
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/\{([^}]*)\}/g, "$1")
    // Final safety net: any backslash that survived the rules above is
    // noise (an escaped symbol we didn't special-case) — never show it.
    .replace(/\\/g, "")
    .trim();
}
