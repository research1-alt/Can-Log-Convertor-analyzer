import { GoogleGenAI, Chat } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = "gemini-2.5-flash";

export const createChat = (): Chat => {
    return ai.chats.create({
        model: model,
        // The config is the same as the models.generateContent config.
        config: {
          systemInstruction: 'You are an expert in automotive Controller Area Network (CAN) bus diagnostics. Keep your responses concise, helpful, and formatted in plain text for easy reading. Do not use markdown.',
        },
    });
};

export const getInitialAnalysisPrompt = (
    rawLogContent: string, 
    convertedData: string | null, 
    isDecoded: boolean
): string => {
    
    let contentToAnalyze = rawLogContent;
    if (isDecoded && convertedData) {
        const decodedSample = convertedData.split('\n').slice(0, 20).join('\n');
        contentToAnalyze = `Here is a sample of the raw CAN log:\n${rawLogContent.substring(0, 2000)}\n\nAnd here is the decoded CSV data for context:\n${decodedSample}`;
    }

    return `
        Analyze the following snippet from a CAN log file. Based on the data, provide a brief, easy-to-understand summary.

        ${isDecoded 
            ? "The data includes a raw log snippet and a CSV sample with decoded signal values (e.g., Engine_RPM, Vehicle_Speed). Use these decoded values to provide a much more specific and insightful analysis."
            : "The data is raw, without decoded signals. Do your best to infer meaning from the raw message IDs and data bytes."
        }

        Your analysis should include:
        1.  A guess at what kind of system this might be from (e.g., car, industrial machine).
        2.  Identification of any high-frequency message IDs and what they might represent. If decoded, explain what the key signals indicate.
        3.  Observations about any interesting data patterns or potential anomalies.
        
        This will be the start of a conversation. After this initial summary, I will ask follow-up questions.

        CAN Log Data:
        ---
        ${contentToAnalyze.substring(0, 8000)}
        ---
    `;
};