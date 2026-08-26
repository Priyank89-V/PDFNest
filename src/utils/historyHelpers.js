// Recent activity history helper
export function getHistory() {
  try {
    const data = localStorage.getItem('pdfnest_history');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function addHistoryItem(item) {
  try {
    // item: { toolId, toolName, fileName, timestamp, suite }
    const current = getHistory();
    const newItem = {
      id: Date.now().toString(),
      toolId: item.toolId,
      toolName: item.toolName,
      fileName: item.fileName,
      suite: item.suite || 'pdf',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [newItem, ...current.filter(i => i.fileName !== item.fileName || i.toolId !== item.toolId)].slice(0, 15);
    localStorage.setItem('pdfnest_history', JSON.stringify(updated));
    window.dispatchEvent(new Event('history-updated'));
    return updated;
  } catch (e) {
    return [];
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem('pdfnest_history');
    window.dispatchEvent(new Event('history-updated'));
  } catch (e) {}
}
