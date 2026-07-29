import type { AIAnalysisResult, IssueCategory, Priority, Severity } from '../types';
import { CATEGORY_DEPARTMENT_MAP, ISSUE_CATEGORIES } from './constants';
import { supabase } from './supabase';

/**
 * Departments available in the system, fetched from the database.
 * The AI uses this to ensure it only assigns departments that actually exist.
 */
let availableDepartments: string[] | null = null;

async function getAvailableDepartments(): Promise<string[]> {
  if (availableDepartments) return availableDepartments;
  const { data } = await supabase
    .from('departments')
    .select('name')
    .eq('is_active', true)
    .order('name');
  availableDepartments = (data?.map((d) => d.name) ?? []) || Object.values(CATEGORY_DEPARTMENT_MAP);
  return availableDepartments;
}

/**
 * Validates that a department name exists in the database.
 * If not, finds the closest match or falls back to General Administration.
 */
function validateDepartment(department: string, departments: string[]): string {
  if (departments.includes(department)) return department;
  // Try case-insensitive match
  const match = departments.find((d) => d.toLowerCase() === department.toLowerCase());
  if (match) return match;
  // Try partial match
  const partial = departments.find((d) => d.toLowerCase().includes(department.toLowerCase()) || department.toLowerCase().includes(d.toLowerCase()));
  if (partial) return partial;
  // Fallback
  return departments.includes('General Administration') ? 'General Administration' : departments[0] ?? 'General Administration';
}

/**
 * Analyzes an uploaded image using client-side heuristics on pixel data.
 * Examines color distribution, brightness, and texture to predict the
 * issue category, severity, priority, and recommended department.
 *
 * The department is validated against the actual departments in the database
 * to ensure the AI only assigns departments that exist in the system.
 *
 * In production this would call the Gemini Vision API via an edge function.
 */
export async function analyzeImage(file: File): Promise<AIAnalysisResult> {
  const [imageData, departments] = await Promise.all([
    extractImageData(file),
    getAvailableDepartments(),
  ]);
  const features = computeImageFeatures(imageData);

  const category = predictCategory(features);
  const severity = predictSeverity(features, category);
  const priority = mapPriority(severity);
  const confidence = predictConfidence(features, category);
  const summary = generateSummary(category, severity, features);

  // Get the mapped department and validate it exists in the database
  const mappedDepartment = CATEGORY_DEPARTMENT_MAP[category];
  const department = validateDepartment(mappedDepartment, departments);

  return {
    category,
    severity,
    priority,
    department,
    confidence,
    summary,
  };
}

interface ImageFeatures {
  avgBrightness: number;
  avgRed: number;
  avgGreen: number;
  avgBlue: number;
  greenDominance: number;
  brownDominance: number;
  grayDominance: number;
  darkRatio: number;
  brightRatio: number;
  colorVariance: number;
  edgeDensity: number;
}

async function extractImageData(file: File): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxSize = 200;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = Math.max(1, Math.floor(img.width * scale));
      canvas.height = Math.max(1, Math.floor(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve({ data: imageData.data, width: canvas.width, height: canvas.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

function computeImageFeatures({ data, width, height }: { data: Uint8ClampedArray; width: number; height: number }): ImageFeatures {
  let totalR = 0, totalG = 0, totalB = 0, totalBrightness = 0;
  let greenCount = 0, brownCount = 0, grayCount = 0, darkCount = 0, brightCount = 0;
  let pixelCount = 0;
  const brightnessValues: number[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;

    totalR += r;
    totalG += g;
    totalB += b;
    totalBrightness += brightness;
    brightnessValues.push(brightness);
    pixelCount++;

    if (g > r + 20 && g > b + 20) greenCount++;
    if (r > 80 && r < 180 && g > 50 && g < 150 && b < 100) brownCount++;
    if (Math.abs(r - g) < 25 && Math.abs(g - b) < 25 && Math.abs(r - b) < 25) grayCount++;
    if (brightness < 60) darkCount++;
    if (brightness > 200) brightCount++;
  }

  const avgBrightness = totalBrightness / pixelCount;
  const avgRed = totalR / pixelCount;
  const avgGreen = totalG / pixelCount;
  const avgBlue = totalB / pixelCount;

  // Edge density via simple gradient
  let edgeCount = 0;
  for (let y = 1; y < height; y++) {
    for (let x = 1; x < width; x++) {
      const idx = (y * width + x) * 4;
      const prevIdx = (y * width + (x - 1)) * 4;
      const aboveIdx = ((y - 1) * width + x) * 4;
      const cur = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      const left = (data[prevIdx] + data[prevIdx + 1] + data[prevIdx + 2]) / 3;
      const above = (data[aboveIdx] + data[aboveIdx + 1] + data[aboveIdx + 2]) / 3;
      if (Math.abs(cur - left) > 30 || Math.abs(cur - above) > 30) edgeCount++;
    }
  }

  // Color variance
  const mean = avgBrightness;
  const variance = brightnessValues.reduce((sum, b) => sum + (b - mean) ** 2, 0) / brightnessValues.length;

  return {
    avgBrightness,
    avgRed,
    avgGreen,
    avgBlue,
    greenDominance: greenCount / pixelCount,
    brownDominance: brownCount / pixelCount,
    grayDominance: grayCount / pixelCount,
    darkRatio: darkCount / pixelCount,
    brightRatio: brightCount / pixelCount,
    colorVariance: Math.sqrt(variance),
    edgeDensity: edgeCount / (width * height),
  };
}

function predictCategory(f: ImageFeatures): IssueCategory {
  const scores: Partial<Record<IssueCategory, number>> = {};

  // Green-dominant images: trees, parks, vegetation
  scores['Tree Fallen'] = f.greenDominance * 100 + f.brownDominance * 30;
  // Brown + dark: garbage, waste, dumping
  scores['Garbage'] = f.brownDominance * 60 + f.darkRatio * 40 + f.colorVariance * 0.3;
  scores['Overflowing Garbage'] = f.brownDominance * 50 + f.darkRatio * 50 + f.colorVariance * 0.4;
  scores['Illegal Dumping'] = f.brownDominance * 40 + f.darkRatio * 30 + f.edgeDensity * 50;
  // Gray + high edge density: road damage, potholes
  scores['Road Damage'] = f.grayDominance * 70 + f.edgeDensity * 60 + f.colorVariance * 0.2;
  scores['Potholes'] = f.grayDominance * 60 + f.darkRatio * 40 + f.edgeDensity * 70;
  // Dark + low brightness: broken streetlight (night photo)
  scores['Broken Streetlight'] = f.darkRatio * 80 + (1 - f.brightRatio) * 30;
  // Blue-dominant: water, drainage, sewage
  const blueDominant = f.avgBlue > f.avgRed + 10 && f.avgBlue > f.avgGreen + 10;
  scores['Water Leakage'] = (blueDominant ? 70 : 0) + f.colorVariance * 0.3;
  scores['Drainage Blockage'] = (f.avgBlue > f.avgGreen ? 40 : 0) + f.brownDominance * 30 + f.darkRatio * 30;
  scores['Sewage Overflow'] = f.brownDominance * 40 + (blueDominant ? 30 : 0) + f.darkRatio * 40;
  // Traffic signal: colorful, high variance, red/yellow/green presence
  scores['Traffic Signal Damage'] = f.colorVariance * 0.5 + f.edgeDensity * 40;
  // Public property: mixed, moderate
  scores['Public Property Damage'] = f.grayDominance * 40 + f.edgeDensity * 40 + f.colorVariance * 0.2;

  // Find best score
  let bestCategory: IssueCategory = 'Others';
  let bestScore = -1;
  let secondScore = -1;
  for (const cat of ISSUE_CATEGORIES) {
    const score = scores[cat] ?? 0;
    if (score > bestScore) {
      secondScore = bestScore;
      bestScore = score;
      bestCategory = cat;
    } else if (score > secondScore) {
      secondScore = score;
    }
  }

  // If no strong signal, default to Others
  if (bestScore < 15) return 'Others';
  // If the top score isn't clearly dominant, the prediction is uncertain
  if (bestScore - secondScore < 5 && bestScore < 30) return 'Others';
  return bestCategory;
}

function predictSeverity(f: ImageFeatures, category: IssueCategory): Severity {
  let score = 0;
  // Darker images tend to be more severe
  score += f.darkRatio * 50;
  // High color variance = more damage visible
  score += f.colorVariance * 0.3;
  // High edge density = more structural damage
  score += f.edgeDensity * 40;

  // Category-based severity adjustments
  const highSeverityCategories: IssueCategory[] = ['Sewage Overflow', 'Road Damage', 'Potholes', 'Traffic Signal Damage'];
  const moderateCategories: IssueCategory[] = ['Garbage', 'Overflowing Garbage', 'Water Leakage', 'Drainage Blockage', 'Illegal Dumping'];
  if (highSeverityCategories.includes(category)) score += 25;
  else if (moderateCategories.includes(category)) score += 10;

  if (score >= 70) return 'Severe';
  if (score >= 45) return 'High';
  if (score >= 20) return 'Moderate';
  return 'Low';
}

function mapPriority(severity: Severity): Priority {
  switch (severity) {
    case 'Severe': return 'Critical';
    case 'High': return 'High';
    case 'Moderate': return 'Medium';
    case 'Low': return 'Low';
  }
}

function predictConfidence(f: ImageFeatures, category: IssueCategory): number {
  // Higher confidence when image has strong distinguishing features
  let confidence = 70;
  if (f.greenDominance > 0.2) confidence += 10;
  if (f.brownDominance > 0.15) confidence += 8;
  if (f.grayDominance > 0.3) confidence += 8;
  if (f.darkRatio > 0.3) confidence += 5;
  if (f.edgeDensity > 0.2) confidence += 5;
  if (category === 'Others') confidence -= 15;
  return Math.min(99, Math.max(60, Math.round(confidence)));
}

function generateSummary(category: IssueCategory, severity: Severity, f: ImageFeatures): string {
  const severityText = severity === 'Severe' ? 'severe' : severity === 'High' ? 'significant' : severity === 'Moderate' ? 'moderate' : 'minor';
  const extent = f.edgeDensity > 0.3 ? 'extensive' : f.edgeDensity > 0.15 ? 'visible' : 'localized';

  const templates: Partial<Record<IssueCategory, string>> = {
    Garbage: `${severityText.charAt(0).toUpperCase() + severityText.slice(1)} accumulation of waste detected. ${extent.charAt(0).toUpperCase() + extent.slice(1)} garbage requiring sanitation response.`,
    'Overflowing Garbage': `Overflowing waste container detected with ${extent} spillage. ${severityText.charAt(0).toUpperCase() + severityText.slice(1)} sanitation issue requiring immediate attention.`,
    'Road Damage': `${severityText.charAt(0).toUpperCase() + severityText.slice(1)} road surface damage detected. ${extent.charAt(0).toUpperCase() + extent.slice(1)} deterioration of infrastructure requiring road maintenance.`,
    Potholes: `${severityText.charAt(0).toUpperCase() + severityText.slice(1)} pothole(s) detected on road surface. ${extent.charAt(0).toUpperCase() + extent.slice(1)} damage posing risk to vehicles.`,
    'Broken Streetlight': `Non-functional street lighting detected. ${severityText.charAt(0).toUpperCase() + severityText.slice(1)} visibility issue affecting public safety.`,
    'Water Leakage': `${severityText.charAt(0).toUpperCase() + severityText.slice(1)} water leakage detected. ${extent.charAt(0).toUpperCase() + extent.slice(1)} water infrastructure issue requiring repair.`,
    'Drainage Blockage': `Blocked drainage system detected. ${severityText.charAt(0).toUpperCase() + severityText.slice(1)} blockage causing ${extent} drainage problems.`,
    'Sewage Overflow': `${severityText.charAt(0).toUpperCase() + severityText.slice(1)} sewage overflow detected. ${extent.charAt(0).toUpperCase() + extent.slice(1)} health hazard requiring urgent response.`,
    'Illegal Dumping': `Unauthorized waste dumping detected. ${severityText.charAt(0).toUpperCase() + severityText.slice(1)} ${extent} illegal disposal requiring enforcement.`,
    'Tree Fallen': `Fallen tree detected with ${extent} impact. ${severityText.charAt(0).toUpperCase() + severityText.slice(1)} obstruction requiring tree removal.`,
    'Traffic Signal Damage': `Damaged traffic signal detected. ${severityText.charAt(0).toUpperCase() + severityText.slice(1)} malfunction creating traffic safety risk.`,
    'Public Property Damage': `${severityText.charAt(0).toUpperCase() + severityText.slice(1)} damage to public property detected. ${extent.charAt(0).toUpperCase() + extent.slice(1)} deterioration requiring maintenance.`,
    Others: `Civic issue detected with ${severityText} severity. ${extent.charAt(0).toUpperCase() + extent.slice(1)} issue requiring municipal review.`,
  };

  return templates[category] ?? `Civic issue detected with ${severityText} severity requiring municipal attention.`;
}

/**
 * Detects potential duplicate complaints based on GPS proximity and category.
 * Returns the ID of a likely duplicate complaint, or null if no duplicate found.
 */
export function isDuplicateLocation(
  lat: number,
  lng: number,
  category: string,
  existingComplaints: Array<{ id: string; latitude: number | null; longitude: number | null; category: string; created_at: string }>,
  radiusMeters = 100,
): string | null {
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  for (const c of existingComplaints) {
    if (c.latitude == null || c.longitude == null) continue;
    if (c.category !== category) continue;
    const age = now - new Date(c.created_at).getTime();
    if (age > sevenDays) continue;
    const distance = haversine(lat, lng, c.latitude, c.longitude);
    if (distance <= radiusMeters) return c.id;
  }
  return null;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
