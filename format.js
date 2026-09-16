/**
 * Number formatting for the Arabic UI.
 *
 * The book itself is typeset with Arabic-Indic digits throughout (page
 * ornaments, hadith references, section numbers), so every number the app
 * shows is rendered the same way.
 */

const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/** 234 -> "٢٣٤" */
export function toArabicDigits(value) {
  return String(value).replace(/[0-9]/g, (digit) => ARABIC_INDIC_DIGITS[Number(digit)]);
}

/**
 * The PDF starts with the cover, so its page N carries the printed number
 * N - 1. Navigation keeps using the raw PDF index; only the display shifts,
 * so the number in the app matches the number on the page.
 *
 * Returns null for pages with no printed number (the cover).
 */
export function printedPage(pdfPage) {
  const printed = Number(pdfPage) - 1;
  return printed >= 1 ? printed : null;
}

/** Printed page number in Arabic-Indic digits, or "—" for the cover. */
export function pageLabel(pdfPage) {
  const printed = printedPage(pdfPage);
  return printed === null ? '—' : toArabicDigits(printed);
}

/** Zero-padded clock time in Arabic-Indic digits, e.g. "١٠:٠٥". */
export function timeLabel(hours, minutes) {
  return (
    toArabicDigits(('0' + hours).slice(-2)) +
    ':' +
    toArabicDigits(('0' + minutes).slice(-2))
  );
}
