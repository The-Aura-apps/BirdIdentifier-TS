/**
 * Result from AI identification (image or audio)
 */
export interface IdentificationResult {
    scientificName: string;
    confidence: number; // 0 to 1
}

/**
 * Complete bird information structure
 */
export interface BirdInfo {
    scientificName: string;
    commonName: string;
    photos?: {
        male?: string;
        female?: string;
    };
    features?: {
        sizeAndShape?: string;
        colorPattern?: string;
        billShape?: string;
        markings?: string;
    };
    ecology?: {
        habitat?: string;
        behavior?: string;
        diet?: string;
    };
    geography?: {
        rangeMap?: string;
        yearRound?: string;
        breeding?: string;
        wintering?: string;
        migration?: string;
        seasonality?: string;
    };
    education?: {
        conservation?: string;
        nesting?: string;
        eggs?: string;
        coolFacts?: string[];
    };
}

/**
 * Discriminated union for AI processing responses
 */
export type BirdAiResponse =
    | { status: "identified"; confidence: number; result: BirdInfo }
    | { status: "uncertain"; confidence?: number; result?: Partial<BirdInfo> }
    | { status: "failed"; error?: string; result?: Partial<BirdInfo> };

/**
 * Type guards for BirdAiResponse
 */
export function isIdentified(
    response: BirdAiResponse,
): response is Extract<BirdAiResponse, { status: "identified" }> {
    return response.status === "identified";
}

export function isUncertain(
    response: BirdAiResponse,
): response is Extract<BirdAiResponse, { status: "uncertain" }> {
    return response.status === "uncertain";
}

export function isFailed(
    response: BirdAiResponse,
): response is Extract<BirdAiResponse, { status: "failed" }> {
    return response.status === "failed";
}
