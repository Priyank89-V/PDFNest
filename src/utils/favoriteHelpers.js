// Favorite tools persistence helper
export function getFavorites() {
  try {
    const data = localStorage.getItem('pdfnest_favorites');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function toggleFavorite(toolId) {
  try {
    const current = getFavorites();
    let updated;
    if (current.includes(toolId)) {
      updated = current.filter(id => id !== toolId);
    } else {
      updated = [...current, toolId];
    }
    localStorage.setItem('pdfnest_favorites', JSON.stringify(updated));
    window.dispatchEvent(new Event('favorites-updated'));
    return updated;
  } catch (e) {
    return [];
  }
}

export function isFavorite(toolId) {
  const current = getFavorites();
  return current.includes(toolId);
}
