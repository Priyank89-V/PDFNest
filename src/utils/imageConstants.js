export const IMAGE_CATEGORIES = [
  { id: 'all', label: 'All 20 Image Tools', ico: '⚡' },
  { id: 'convert', label: 'Convert Format', ico: '🔄' },
  { id: 'resize', label: 'Compress & Resize', ico: '🗜️' },
  { id: 'edit', label: 'Crop & Transform', ico: '✂️' },
  { id: 'filters', label: 'Filters & Effects', ico: '🎨' },
  { id: 'utils', label: 'Utilities & AI', ico: '✨' },
];

export const IMAGE_TOOLS = [
  { id: 'jpg2png', name: 'JPG to PNG', ico: '🖼️', cat: 'convert', desc: 'Convert JPG photos to PNG format with transparency support.', accept: '.jpg,.jpeg,image/jpeg', badge: 'Popular' },
  { id: 'png2jpg', name: 'PNG to JPG', ico: '📷', cat: 'convert', desc: 'Convert PNG images to lightweight JPG format with crisp rendering.', accept: '.png,image/png', badge: 'Fast' },
  { id: 'img2webp', name: 'Convert to WEBP', ico: '🌐', cat: 'convert', desc: 'Convert any image (JPG/PNG) to modern next-gen WEBP format.', accept: 'image/*', badge: 'Web Ready' },
  { id: 'webp2jpg', name: 'WEBP to JPG / PNG', ico: '🔄', cat: 'convert', desc: 'Convert WEBP web images back to standard JPG or PNG format.', accept: '.webp,image/webp' },
  { id: 'svg2png', name: 'SVG to PNG / JPG', ico: '🎯', cat: 'convert', desc: 'Render vector SVG files to high-resolution PNG or JPG raster images.', accept: '.svg,image/svg+xml' },
  { id: 'img2pdf', name: 'Image to PDF', ico: '📄', cat: 'convert', desc: 'Combine single or multiple images into a clean PDF document.', accept: 'image/*', multiple: true },
  { id: 'img2base64', name: 'Image to Base64', ico: '🔤', cat: 'convert', desc: 'Convert image files into Base64 Data URL strings for HTML/CSS.', accept: 'image/*' },
  { id: 'compress', name: 'Compress Image', ico: '🗜️', cat: 'resize', desc: 'Reduce file size of JPG, PNG, and WEBP images without quality loss.', accept: 'image/*', badge: 'Essential' },
  { id: 'resize', name: 'Resize Image', ico: '📐', cat: 'resize', desc: 'Resize image dimensions by exact pixels or percentage while maintaining aspect ratio.', accept: 'image/*' },
  { id: 'crop', name: 'Crop Image', ico: '✂️', cat: 'edit', desc: 'Crop images using 1:1, 16:9, 9:16 social presets or custom bounding boxes.', accept: 'image/*' },
  { id: 'rotate', name: 'Rotate & Flip Image', ico: '🔄', cat: 'edit', desc: 'Rotate images 90°, 180°, 270° or flip horizontally and vertically.', accept: 'image/*' },
  { id: 'watermark', name: 'Add Watermark', ico: '💧', cat: 'edit', desc: 'Overlay text or logo watermark with custom opacity, color, angle, and position.', accept: 'image/*' },
  { id: 'filters', name: 'Photo Filters & Color', ico: '🎨', cat: 'filters', desc: 'Adjust Brightness, Contrast, Saturation, Blur, Hue, Sepia, and Grayscale live.', accept: 'image/*', badge: 'Creative' },
  { id: 'grayscale', name: 'Black & White / Sepia', ico: '🏁', cat: 'filters', desc: 'Convert color images into classic grayscale or warm vintage sepia tone.', accept: 'image/*' },
  { id: 'palette', name: 'Color Palette Extractor', ico: '🎨', cat: 'utils', desc: 'Automatically extract dominant HEX color palettes from any photo or image.', accept: 'image/*', badge: 'Design' },
  { id: 'grid', name: 'Image Grid Splitter', ico: '🧩', cat: 'utils', desc: 'Slice an image into 2x2, 3x3, or 3x1 Instagram grid tiles packed in ZIP.', accept: 'image/*' },
  { id: 'join', name: 'Join Images / Collage', ico: '🧩', cat: 'utils', desc: 'Stitch multiple images together side-by-side (horizontal) or stacked (vertical).', accept: 'image/*', multiple: true },
  { id: 'meme', name: 'Meme Generator', ico: '😂', cat: 'utils', desc: 'Create viral memes by adding bold impact text with black strokes to images.', accept: 'image/*' },
  { id: 'exif', name: 'Image Info & EXIF Viewer', ico: '📋', cat: 'utils', desc: 'Inspect technical image metadata including resolution, dimensions, and color space.', accept: 'image/*' },
];

export function getImageToolById(id) {
  return IMAGE_TOOLS.find(t => t.id === id) || null;
}
