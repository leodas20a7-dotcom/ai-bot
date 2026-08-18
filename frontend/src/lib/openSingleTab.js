// Centralized tab manager to force single-tab reuse for WhatsApp Web & Email
const openTabs = {};

/**
 * Opens or reuses an existing tab using direct WindowProxy location assignment.
 * This bypasses browser COOP target name detachment issues on WhatsApp Web & Gmail.
 * 
 * @param {string} key - Tab category ('WHATSAPP' or 'EMAIL')
 * @param {string} url - Target URL to open
 */
export function openOrFocusTab(key, url) {
  try {
    const existingWin = openTabs[key];
    if (existingWin && !existingWin.closed) {
      existingWin.location.href = url;
      existingWin.focus();
      return existingWin;
    }
  } catch (e) {
    console.warn(`[openOrFocusTab] Error reusing tab for ${key}:`, e);
  }

  const targetName = key === 'WHATSAPP' ? 'convino_whatsapp_tab' : 'convino_email_tab';
  const newWin = window.open(url, targetName);
  if (newWin) {
    openTabs[key] = newWin;
    try {
      newWin.focus();
    } catch (e) {}
  }
  return newWin;
}
