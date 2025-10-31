import type { CANMessage, CanMatrix, SignalDefinition } from '../types';

// 'log' or 'trc'. This determines which parser is tried first for files with
// extensions other than .log or .trc. This provides a configurable default.
// FIX: Changed from `const` to `let`. When declared as a `const`, the type of `DEFAULT_PARSER_FOR_UNKNOWN_TYPES` was narrowed to the literal 'log', causing a type error during comparison with 'trc'. Using `let` preserves the union type `'log' | 'trc'` and fixes the error.
let DEFAULT_PARSER_FOR_UNKNOWN_TYPES: 'log' | 'trc' = 'log';

// Parses candump (.log) format, e.g., (1616522338.123456) can0 123#1122334455667788
// Now handles integer timestamps like (1616522338)
const LOG_REGEX = /^\s*\((\d+(?:\.\d+)?)\)\s+\w+\s+([0-9A-Fa-f]+)#([0-9A-Fa-f]*)\s*$/;

// Parses a common PCAN-View (.trc) format, e.g., 1) 12.3456 Rx 0x123 8 11 22 33 44 55 66 77 88
// Now handles integer timestamps like 1) 12 Rx ...
// FIX: Changed data regex from `+` to `*` to correctly handle messages with 0 data bytes.
const TRC_REGEX = /^\s*\d+\)\s+(\d+(?:\.\d+)?)\s+(Rx|Tx)\s+([0-9A-Fa-fxX]+)\s+\d+\s*([0-9A-Fa-f\s]*)$/;

// New parser for PCAN-View format based on user-provided header.
// This format has no ')' after the message number and includes a 'Type' column.
// e.g., 1 12.3456 MSG_TYPE 123 Rx 8 11 22 33 44
const PCAN_VIEW_REGEX = /^\s*\d+\s+([\d.]+)\s+\w+\s+([0-9A-Fa-fxX]+)\s+(Rx|Tx)\s+\d+\s*([0-9A-Fa-f\s]*)$/;

// New parser for the PCAN-View v5 format provided by the user.
// Format: 1) 39.9 Rx 14234050 8 00 00 05...
// It has a ')' after message number, and the ID is hex without '0x'.
const PCAN_V5_REGEX = /^\s*\d+\)\s+([\d.]+)\s+(Rx|Tx)\s+([0-9A-Fa-f]+)\s+\d+\s*([0-9A-Fa-f\s]*)$/;


const parseLogLine = (line: string): CANMessage | null => {
    const match = line.match(LOG_REGEX);
    if (!match) return null;

    const [, timestamp, id, rawData] = match;
    const data = rawData.match(/.{1,2}/g) || [];

    return {
        timestamp: parseFloat(timestamp),
        id: `0x${id.toUpperCase()}`,
        dlc: data.length,
        data: data.map(byte => byte.toUpperCase()),
        isTx: false, // .log format doesn't specify direction, default to Rx
    };
};

const parseTrcLine = (line: string): CANMessage | null => {
    const match = line.trim().match(TRC_REGEX);
    if (!match) return null;

    const [, timestamp, direction, id, rawData] = match;
    const data = rawData.trim().split(/\s+/).filter(Boolean); // Use filter to handle empty data strings

    return {
        timestamp: parseFloat(timestamp),
        id: id.startsWith('0x') ? id.toUpperCase() : `0x${id.toUpperCase()}`,
        dlc: data.length,
        data: data.map(byte => byte.toUpperCase()),
        isTx: direction === 'Tx',
    };
};

const parsePcanViewLine = (line: string): CANMessage | null => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith(';')) {
        return null;
    }
    const match = trimmedLine.match(PCAN_VIEW_REGEX);
    if (!match) return null;

    const [, timestamp, id, direction, rawData] = match;
    const data = rawData.trim().split(/\s+/).filter(Boolean); // Filter out empty strings from multiple spaces

    return {
        timestamp: parseFloat(timestamp),
        id: id.startsWith('0x') ? id.toUpperCase() : `0x${id.toUpperCase()}`,
        dlc: data.length,
        data: data.map(byte => byte.toUpperCase()),
        isTx: direction === 'Tx',
    };
};

const parsePcanV5Line = (line: string): CANMessage | null => {
    const match = line.match(PCAN_V5_REGEX);
    if (!match) return null;

    const [, timestamp, direction, id, rawData] = match;
    const data = rawData.trim().split(/\s+/).filter(Boolean);

    return {
        timestamp: parseFloat(timestamp),
        id: `0x${id.toUpperCase()}`, // This format's ID has no '0x' prefix, so we add it.
        dlc: data.length,
        data: data.map(byte => byte.toUpperCase()),
        isTx: direction === 'Tx',
    };
};

/**
 * Parses the content of a CAN log file line by line.
 * It intelligently tries different known formats for each line, making it robust
 * against mixed-format files or files with headers/comments.
 */
export const parseCanLogFile = (content: string, fileName: string): CANMessage[] => {
    const lines = content.split(/\r?\n/); // Use a regex to handle both \n and \r\n line endings
    const lowerFileName = fileName.toLowerCase();
    const messages: CANMessage[] = [];

    const logParsers = [parseLogLine, parsePcanV5Line, parseTrcLine, parsePcanViewLine];
    const trcParsers = [parsePcanV5Line, parseTrcLine, parsePcanViewLine, parseLogLine];

    // Determine the primary order of parsers based on file extension
    let orderedParsers = DEFAULT_PARSER_FOR_UNKNOWN_TYPES === 'log' ? logParsers : trcParsers;
    if (lowerFileName.endsWith('.log')) {
        orderedParsers = logParsers;
    } else if (lowerFileName.endsWith('.trc')) {
        orderedParsers = trcParsers;
    }

    for (const line of lines) {
        const trimmedLine = line.trim();
        // Skip empty lines or comments
        if (!trimmedLine || trimmedLine.startsWith(';')) {
            continue;
        }

        // Try each parser in the ordered list until one succeeds
        for (const parser of orderedParsers) {
            const message = parser(trimmedLine);
            if (message) {
                messages.push(message);
                break; // Success, move to the next line
            }
        }
        // If no parser matched, the line is simply ignored.
    }

    return messages;
};

const extractSignalValue = (data: Uint8Array, signal: SignalDefinition): number => {
    let rawValue = 0;
    
    if (signal.isLittleEndian) {
        // Little-endian (Intel)
        for (let i = 0; i < signal.length; i++) {
            const bitIndex = signal.startBit + i;
            const byteIndex = Math.floor(bitIndex / 8);
            
            // Bounds check: ensure we don't read past the message's actual data length
            if (byteIndex >= data.length) continue;

            const bitInByte = bitIndex % 8;
            if ((data[byteIndex] >> bitInByte) & 1) {
                rawValue |= 1 << i;
            }
        }
    } else {
        // Big-endian (Motorola)
        let bitCount = 0;
        for (let i = 0; i < 8 * 8; i++) {
            const byteIndex = Math.floor(i / 8);

            // Bounds check: Stop if we're reading past the actual data payload of the message
            if (byteIndex >= data.length) {
                break;
            }
            
            const bitInByte = 7 - (i % 8);

            if (i >= signal.startBit && i < signal.startBit + signal.length) {
                if ((data[byteIndex] >> bitInByte) & 1) {
                    rawValue |= 1 << (signal.length - 1 - bitCount);
                }
                bitCount++;
            }
        }
    }

    if (signal.isSigned && (rawValue & (1 << (signal.length - 1)))) {
        // Two's complement for signed values
        rawValue -= 1 << signal.length;
    }

    return rawValue * signal.scale + signal.offset;
}

export const decodeMessages = (messages: CANMessage[], matrix: CanMatrix): CANMessage[] => {
    return messages.map(message => {
        const messageId = parseInt(message.id, 16).toString();
        const definition = matrix[messageId];

        if (!definition) {
            return message;
        }

        const dataBytes = new Uint8Array(message.data.map(hex => parseInt(hex, 16)));
        const decodedSignals: { [key: string]: number } = {};

        for (const signalName in definition.signals) {
            const signal = definition.signals[signalName];
            const value = extractSignalValue(dataBytes, signal);
            decodedSignals[signal.name] = parseFloat(value.toPrecision(10));
        }

        return { ...message, decoded: decodedSignals };
    });
};