import { Drawing } from '../types';

/**
 * DEVELOPER NOTE:
 * To update the pre-loaded knowledge base, you can modify the constants below.
 * - `PRELOADED_TEXT`: Paste the content of your text files (CSV, TXT, etc.) here.
 *   Use backticks (`) for multi-line strings.
 * - `PRELOADED_DRAWINGS_DATA`: Add or update drawing objects. To add a new image:
 *   1. Convert your image file (e.g., my-image.svg) to a Base64 string. You can
 *      use an online tool for this (search for "image to base64 converter").
 *   2. Create a data URL: 'data:image/svg+xml;base64,YOUR_BASE64_STRING_HERE'
 *      (replace 'image/svg+xml' with the correct MIME type for your image, e.g., 'image/png').
 *   3. Add a new object to the array: { name: 'my-image.svg', dataUrl: '...' }
 */

const PRELOADED_TEXT = `"Error Code","Symptom","Solution Steps","Safety Note"
"E-01","Fan not spinning","1. Check power supply to fan. 2. Inspect fan for blockages. 3. Replace fan motor.","Disconnect all power before servicing the unit."
"F-12","Unit overheating","1. Clean air filters. 2. Ensure proper ventilation around the unit. 3. Check coolant levels.","Surfaces may be hot. Allow the unit to cool before touching internal components."
"A-05","Noisy operation","1. Check for loose panels or screws. 2. Inspect fan blades for damage. 3. Lubricate motor bearings if applicable.","N/A"`;

// Base64 encoded version of the example-schematic.svg content
const PRELOADED_SVG_BASE64 = 'PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmOGZmIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMzgwIiBoZWlnaHQ9IjE4MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDA1MjlCIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1kYXNoYXJyYXk9IjEwIDUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjRweCIgZmlsbD0iIzAwNTI5QiI+UGxhY2Vob2xkZXIgU2NoZW1hdGljPC90ZXh0Pjx0ZXh0IHg9IjUwJSIgeT0iNjUlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNnB4IiBmaWxsPSIjNjY2Ij4oUmVwbGFjZSB3aXRoIHlvdXIgb3duIGRyYXdpbmcpPC90ZXh0Pjwvc3ZnPg==';

const PRELOADED_DRAWINGS_DATA: Drawing[] = [
    {
        name: 'example-schematic.svg',
        dataUrl: `data:image/svg+xml;base64,${PRELOADED_SVG_BASE64}`
    }
];

export const preloadedKnowledgeBase = {
    text: PRELOADED_TEXT,
    drawings: PRELOADED_DRAWINGS_DATA,
};
