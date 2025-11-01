import { GoogleGenAI, Type } from "@google/genai";
import { BotResponse } from "../types";

const SYSTEM_INSTRUCTION_TEMPLATE = `You are a world-class Service Engineer AI Assistant. Your primary goal is to provide clear, accurate, and safe troubleshooting steps to field engineers. You MUST generate all responses exclusively in the user-specified language: {languageName}. Do not use any other language.`;

const PROMPT_TEMPLATE = `
You are a world-class Service Engineer AI Assistant. Your knowledge base is the provided content below.
Your task is to analyze the user's query against this data and provide a clear, step-by-step solution to help a field engineer resolve the issue.

**RULES:**
1.  **Analyze the Query:** Carefully read the user's query and find the most relevant information in the provided knowledge base content. The content could be from a spreadsheet, a presentation, or other documents.
2.  **Provide Solutions:** If a clear match is found, extract the troubleshooting steps, solution, and any safety notes. Present them as a sequence of clear, actionable steps. Synthesize information if necessary to create a coherent guide.
3.  **Prioritize Safety:** Always identify and flag any steps related to safety, electrical hazards, or required precautions. These are critical.
4.  **Ask for Clarification:** If the user's query is ambiguous, lacks detail, or could match multiple entries in the knowledge base, you MUST ask a clarifying question.
5.  **Provide Suggested Queries:** When asking a clarifying question, you MUST also provide a 'suggestedQueries' array containing 2-4 short, relevant example responses the user could click on (e.g., ["Error Code E-45", "The fan is not spinning"]). This array should be empty if you are not asking a question.
6.  **Handle No Match:** If no relevant information is found in the data after a thorough search, clearly state that you cannot find a solution in the current knowledge base. Do not invent solutions.
7.  **JSON Output:** You MUST respond ONLY with a valid JSON object that adheres to the provided schema. Do not add any text, markdown formatting, or explanations outside of the JSON object.
8.  **Language:** You MUST respond in the following language: {languageName}. All parts of your JSON response (solutionTitle, step descriptions, clarifyingQuestion, suggestedQueries) must be in {languageName}.
9.  **Include Drawings:** If a relevant drawing from the 'Available Drawings' list can visually aid the engineer, include its exact filename in the \`drawingFileName\` field. Match based on the file's name and the user's query context. Otherwise, set it to null.

**Knowledge Base Content:**
\`\`\`
{sheetData}
\`\`\`

**Available Drawings:**
{drawingFileNames}

**User Query:** "{userQuery}"
`;

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        solutionTitle: {
            type: Type.STRING,
            description: "A concise title for the identified issue or solution. Null if asking a question or no solution found.",
        },
        steps: {
            type: Type.ARRAY,
            description: "An array of action items for the engineer.",
            items: {
                type: Type.OBJECT,
                properties: {
                    description: {
                        type: Type.STRING,
                        description: "A single, clear step for the solution or troubleshooting.",
                    },
                    isSafetyWarning: {
                        type: Type.BOOLEAN,
                        description: "Set to true if this step is a safety warning or critical check."
                    }
                },
                required: ["description", "isSafetyWarning"]
            },
        },
        clarifyingQuestion: {
            type: Type.STRING,
            description: "If the user's query is ambiguous, ask a relevant question here. Null otherwise.",
            nullable: true,
        },
        suggestedQueries: {
            type: Type.ARRAY,
            description: "If asking a clarifying question, provide 2-4 short, relevant suggested queries for the user to click. Empty array otherwise.",
            items: {
                type: Type.STRING,
            }
        },
        noSolutionFound: {
            type: Type.BOOLEAN,
            description: "Set to true if no solution can be found in the provided data."
        },
        drawingFileName: {
            type: Type.STRING,
            description: "The exact filename of a relevant drawing from the provided list that illustrates the solution. Null if no drawing is relevant.",
            nullable: true,
        },
    },
    required: ["solutionTitle", "steps", "clarifyingQuestion", "suggestedQueries", "noSolutionFound", "drawingFileName"]
};

const languageMap: { [key: string]: string } = {
    'en': 'English',
    'hi': 'Hindi',
    'pa': 'Punjabi',
    'ta': 'Tamil',
    'kn': 'Kannada',
    'gu': 'Gujarati',
};

export async function getSolution(apiKey: string, sheetData: string, userQuery: string, language: string, drawingFileNames: string[]): Promise<BotResponse> {
    if (!apiKey) {
        throw new Error("Gemini API key is not configured. Please provide it in the application setup.");
    }
    const ai = new GoogleGenAI({ apiKey });

    const languageName = languageMap[language] || 'English';
    
    const systemInstruction = SYSTEM_INSTRUCTION_TEMPLATE.replace('{languageName}', languageName);

    const prompt = PROMPT_TEMPLATE
        .replace('{sheetData}', sheetData || "No text-based knowledge provided.")
        .replace('{drawingFileNames}', drawingFileNames.length > 0 ? drawingFileNames.join(', ') : "No drawings provided.")
        .replace('{userQuery}', userQuery)
        .replace(/{languageName}/g, languageName);

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonText = response.text.trim();
        const parsedResponse = JSON.parse(jsonText);
        
        // Basic validation
        if (typeof parsedResponse.noSolutionFound !== 'boolean' || !Array.isArray(parsedResponse.steps)) {
            throw new Error("Invalid JSON structure received from API.");
        }

        return parsedResponse as BotResponse;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
             throw new Error("The provided Gemini API key is not valid. Please check the key and try again.");
        }
        throw new Error("Failed to get a response from the AI model.");
    }
}
