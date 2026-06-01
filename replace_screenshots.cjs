const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "import { ScreenshotUpload } from './components/ScreenshotUpload';",
  "import { ScreenshotUpload } from './components/ScreenshotUpload';\\nimport { MultiAttachmentUpload } from './components/MultiAttachmentUpload';"
);

// Add state variables
const stateVars = "const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);\\n" +
"  const [activePhotos, setActivePhotos] = useState<string[]>([]);\\n" +
"  const [activeLinks, setActiveLinks] = useState<string[]>([]);";
content = content.replace("const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);", stateVars);

const swapVars = "const [swapScreenshot, setSwapScreenshot] = useState<string | null>(null);\\n" +
"  const [swapPhotos, setSwapPhotos] = useState<string[]>([]);\\n" +
"  const [swapLinks, setSwapLinks] = useState<string[]>([]);";
content = content.replace("const [swapScreenshot, setSwapScreenshot] = useState<string | null>(null);", swapVars);

const p2pVars = "const [p2pScreenshot, setP2pScreenshot] = useState<string | null>(null);\\n" +
"  const [p2pPhotos, setP2pPhotos] = useState<string[]>([]);\\n" +
"  const [p2pLinks, setP2pLinks] = useState<string[]>([]);";
content = content.replace("const [p2pScreenshot, setP2pScreenshot] = useState<string | null>(null);", p2pVars);

const annualVars = "const [annualScreenshot, setAnnualScreenshot] = useState<string | null>(null);\\n" +
"  const [annualPhotos, setAnnualPhotos] = useState<string[]>([]);\\n" +
"  const [annualLinks, setAnnualLinks] = useState<string[]>([]);";
content = content.replace("const [annualScreenshot, setAnnualScreenshot] = useState<string | null>(null);", annualVars);

// Replace requests creation
content = content.replace(
  "screenshot: swapScreenshot ? swapScreenshot : undefined",
  "screenshot: swapScreenshot ? swapScreenshot : undefined, photos: swapPhotos, links: swapLinks"
);
content = content.replace(
  "screenshot: annualScreenshot ? annualScreenshot : undefined",
  "screenshot: annualScreenshot ? annualScreenshot : undefined, photos: annualPhotos, links: annualLinks"
);
content = content.replace(
  "screenshot: p2pScreenshot ? p2pScreenshot : undefined",
  "screenshot: p2pScreenshot ? p2pScreenshot : undefined, photos: p2pPhotos, links: p2pLinks"
);

// We should replace all occurrences using a global replace if there are multiple, but replace only hits the first, which is what we need usually, except Client Comms and Cases both have the identical line:
content = content.split("paymentScreenshot: activeScreenshot || undefined").join("paymentScreenshot: activeScreenshot || undefined, photos: activePhotos, links: activeLinks");
content = content.split("imageUrl: activeScreenshot || tcImageUrl,").join("imageUrl: activeScreenshot || tcImageUrl, photos: activePhotos, links: activeLinks,");
content = content.split("screenshot: activeScreenshot || undefined").join("screenshot: activeScreenshot || undefined, photos: activePhotos, links: activeLinks");


// Clear functions
content = content.split("setSwapScreenshot(null);").join("setSwapScreenshot(null); setSwapPhotos([]); setSwapLinks([]);");
content = content.split("setAnnualScreenshot(null);").join("setAnnualScreenshot(null); setAnnualPhotos([]); setAnnualLinks([]);");
content = content.split("setP2pScreenshot(null);").join("setP2pScreenshot(null); setP2pPhotos([]); setP2pLinks([]);");
content = content.split("setActiveScreenshot(null);").join("setActiveScreenshot(null); setActivePhotos([]); setActiveLinks([]);");

// We replace the ScreenshotComponent tags
content = content.replace(
  /<ScreenshotUpload[\s\S]*?screenshot={swapScreenshot}[\s\S]*?\/>/,
  '<MultiAttachmentUpload photos={swapPhotos} links={swapLinks} onPhotosChange={setSwapPhotos} onLinksChange={setSwapLinks} photosLabel="Optional Attachment" />'
);

content = content.replace(
  /<ScreenshotUpload[\s\S]*?screenshot={annualScreenshot}[\s\S]*?\/>/,
  '<MultiAttachmentUpload photos={annualPhotos} links={annualLinks} onPhotosChange={setAnnualPhotos} onLinksChange={setAnnualLinks} photosLabel="Optional Attachment" />'
);

content = content.replace(
  /<ScreenshotUpload[\s\S]*?screenshot={p2pScreenshot}[\s\S]*?\/>/,
  '<MultiAttachmentUpload photos={p2pPhotos} links={p2pLinks} onPhotosChange={setP2pPhotos} onLinksChange={setP2pLinks} photosLabel="Optional Attachment" />'
);

content = content.replace(
  /<ScreenshotUpload[\s\S]*?screenshot={activeScreenshot}[\s\S]*?label="Payment \/ Identity Screenshot"[\s\S]*?\/>/,
  '<MultiAttachmentUpload photos={activePhotos} links={activeLinks} onPhotosChange={setActivePhotos} onLinksChange={setActiveLinks} photosLabel="Payment / Identity Photos" />'
);

content = content.replace(
  /<ScreenshotUpload[\s\S]*?screenshot={activeScreenshot}[\s\S]*?label="Complaint Evidence \/ Screenshot"[\s\S]*?\/>/,
  '<MultiAttachmentUpload photos={activePhotos} links={activeLinks} onPhotosChange={setActivePhotos} onLinksChange={setActiveLinks} photosLabel="Complaint Evidence" />'
);

content = content.replace(
  /<ScreenshotUpload[\s\S]*?screenshot={activeScreenshot}[\s\S]*?label="Customer Inquiry Screenshot"[\s\S]*?\/>/,
  '<MultiAttachmentUpload photos={activePhotos} links={activeLinks} onPhotosChange={setActivePhotos} onLinksChange={setActiveLinks} photosLabel="Customer Inquiry Screenshot" />'
);

content = content.replace(
  /<ScreenshotUpload[\s\S]*?screenshot={activeScreenshot}[\s\S]*?label="Evidence \/ Screenshot"[\s\S]*?\/>/,
  '<MultiAttachmentUpload photos={activePhotos} links={activeLinks} onPhotosChange={setActivePhotos} onLinksChange={setActiveLinks} photosLabel="Evidence Photos" />'
);


fs.writeFileSync('src/App.tsx', content);

console.log('Done replacement');
