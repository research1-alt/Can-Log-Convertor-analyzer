import { processTextFile, processImageFile } from './fileParser';
import { Drawing } from '../types';

interface PreloadedData {
    text: string;
    drawings: Drawing[];
}

// These are the file extensions the app knows how to parse for text content.
const textAndDocExtensions = ['.xlsx', '.xls', '.pptx', '.docx', '.pdf', '.txt', '.csv', '.md'];
// These are the file extensions the app treats as images.
const imageExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'];

export async function loadPreloadedKnowledgeBase(): Promise<PreloadedData | null> {
    try {
        const manifestResponse = await fetch('/preloaded-data/manifest.json');
        if (!manifestResponse.ok) {
            // If manifest is not found, we assume there's no preloaded data.
            if (manifestResponse.status === 404) {
                console.log("No preloaded data manifest found. Skipping.");
                return null;
            }
            throw new Error(`Failed to fetch manifest: ${manifestResponse.statusText}`);
        }
        
        const manifest = await manifestResponse.json();
        const fileList: string[] = manifest.files || [];

        if (fileList.length === 0) {
            return null;
        }

        const fileProcessingPromises = fileList.map(async (fileName) => {
            const response = await fetch(`/preloaded-data/${fileName}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch preloaded file: ${fileName}`);
            }
            const blob = await response.blob();
            // The parser functions expect a File object, so we create one from the fetched blob.
            const file = new File([blob], fileName, { type: blob.type });
            return file;
        });

        const files = await Promise.all(fileProcessingPromises);

        const textFiles = files.filter(file => textAndDocExtensions.some(ext => file.name.toLowerCase().endsWith(ext)));
        const imageFiles = files.filter(file => imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext)));

        const textProcessingPromises = textFiles.map(processTextFile);
        const imageProcessingPromises = imageFiles.map(processImageFile);
        
        const textResults = await Promise.allSettled(textProcessingPromises);
        const imageResults = await Promise.allSettled(imageProcessingPromises);

        let combinedData = '';
        const loadedDrawings: Drawing[] = [];

        textResults.forEach((result, index) => {
            const file = textFiles[index];
            if (result.status === 'fulfilled' && file) {
                combinedData += result.value + `\n\n--- End of File: ${file.name} ---\n\n`;
            } else if (result.status === 'rejected' && file) {
                console.error(`Error preloading text file '${file.name}':`, result.reason);
            }
        });

        imageResults.forEach((result, index) => {
            const file = imageFiles[index];
            if (result.status === 'fulfilled' && file) {
                loadedDrawings.push(result.value);
            } else if (result.status === 'rejected' && file) {
                 console.error(`Error preloading image file '${file.name}':`, result.reason);
            }
        });

        if (!combinedData && loadedDrawings.length === 0) {
            return null; // Nothing was loaded successfully
        }

        return { text: combinedData, drawings: loadedDrawings };

    } catch (error) {
        console.error("Error loading preloaded knowledge base:", error);
        return null;
    }
}
