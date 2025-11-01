import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { Drawing } from '../types';

// Helper function to parse PPTX files
const parsePptx = async (file: File): Promise<string> => {
  try {
    const content = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(content);
    const slidePromises: Promise<string>[] = [];
    
    zip.folder('ppt/slides')?.forEach((relativePath, fileEntry) => {
       if (fileEntry.name.endsWith('.xml') && !fileEntry.name.includes('rels')) {
           slidePromises.push(fileEntry.async('string'));
       }
    });

    if (slidePromises.length === 0) {
        throw new Error("No text content could be extracted. The presentation might be empty or in an unsupported format.");
    }

    const slideContents = await Promise.all(slidePromises);
    
    const parser = new DOMParser();
    const textExtractor = (xmlString: string): string => {
        try {
            const xmlDoc = parser.parseFromString(xmlString, "application/xml");
            if (xmlDoc.getElementsByTagName("parsererror").length) {
                console.warn("A slide's XML could not be parsed.");
                return ''; // Be resilient to single bad slides
            }
            const textNodes = xmlDoc.getElementsByTagName("a:t");
            let slideText = [];
            for (let i = 0; i < textNodes.length; i++) {
                slideText.push(textNodes[i].textContent || '');
            }
            return slideText.join(' ');
        } catch (e) {
            console.error("Error parsing slide XML:", e);
            return '';
        }
    };

    return slideContents.map(textExtractor).join('\n\n');
  } catch (err) {
      console.error(`Error parsing PPTX file structure for ${file.name}:`, err);
      throw new Error(`The file '${file.name}' could not be read. It might be corrupted or not a valid .pptx file.`);
  }
};

// Helper function to parse DOCX files
const parseDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
};

// Helper function to parse PDF files
const parsePdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    let fullText = '';
    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
        fullText += '\n\n'; // Add space between pages
    }
    return fullText;
};

// Helper function for plain text files (.txt, .csv, .md)
const parseTxt = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
              resolve(e.target.result as string);
            } else {
              reject(`Could not read file: ${file.name}`);
            }
        };
        reader.onerror = () => {
            reject(`Error reading text file ${file.name}`);
        };
        reader.readAsText(file);
    });
};

export const processImageFile = (file: File): Promise<Drawing> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                resolve({ name: file.name, dataUrl: e.target.result as string });
            } else {
                reject(`Could not read image file: ${file.name}`);
            }
        };
        reader.onerror = () => {
            reject(`Error reading image file ${file.name}`);
        };
        reader.readAsDataURL(file);
    });
};


export const processTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const fileName = file.name.toLowerCase();

        const processPromise = (parser: (file: File) => Promise<string>, fileType: string) => {
            parser(file)
                .then(textData => {
                    if (!textData.trim()) {
                        reject(`The file '${file.name}' appears to be empty or contains no readable text.`);
                    } else {
                        resolve(textData);
                    }
                })
                .catch(err => {
                    const errorMessage = err instanceof Error ? err.message : `An unknown error occurred during ${fileType} parsing.`;
                    console.error(`Error processing ${fileType} file ${file.name}:`, err);
                    reject(errorMessage.includes(file.name) ? errorMessage : `Failed to parse '${file.name}'. It may be corrupted or an unsupported format.`);
                });
        };

        if (fileName.endsWith('.pptx')) {
            processPromise(parsePptx, 'PowerPoint');
        } else if (fileName.endsWith('.docx')) {
            processPromise(parseDocx, 'Word');
        } else if (fileName.endsWith('.pdf')) {
            processPromise(parsePdf, 'PDF');
        } else if (fileName.endsWith('.txt') || fileName.endsWith('.csv') || fileName.endsWith('.md')) {
            processPromise(parseTxt, 'Text');
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    if (!data) {
                        throw new Error(`File '${file.name}' could not be read.`);
                    }
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    if (!sheetName) {
                        throw new Error(`The Excel file '${file.name}' is empty or does not contain any sheets.`);
                    }
                    const worksheet = workbook.Sheets[sheetName];
                    const csvData = XLSX.utils.sheet_to_csv(worksheet);
                    if (!csvData.trim()) {
                        throw new Error(`The first sheet in '${file.name}' is empty.`);
                    }
                    resolve(csvData);
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : `An unknown parsing error occurred.`;
                    console.error(`Error parsing Excel file ${file.name}:`, err);
                    if (errorMessage.includes(file.name)) {
                        reject(errorMessage);
                    } else {
                        reject(`Failed to parse '${file.name}'. The file may be corrupted.`);
                    }
                }
            };
            reader.onerror = (error) => {
                console.error(`Error reading file ${file.name}:`, error);
                reject(`An error occurred while reading '${file.name}'.`);
            };
            reader.readAsArrayBuffer(file);
        } else if (fileName.endsWith('.ppt')) {
            reject(`Legacy .ppt file '${file.name}' is not supported. Please save as .pptx.`);
        } else {
            reject(`Unsupported file type for '${file.name}'.`);
        }
    });
};