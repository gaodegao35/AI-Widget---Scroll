const keyEl = document.getElementById('key');
const status = document.getElementById('status');
chrome.storage.local.get('claudeKey').then(r => { if (r.claudeKey) keyEl.value = r.claudeKey; });
document.getElementById('save').addEventListener('click', async () => {
  await chrome.storage.local.set({ claudeKey: keyEl.value.trim() });
  status.textContent = 'Saved';
  status.className = 'ok';
});
