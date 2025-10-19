// src/collectors/types.ts
export interface NormalizedBirdPayload {
    scientificName: string;
    //  commonName?: string;
    description?: string;
    behavior?: string;
    nestingHabits?: string;
    feedingHabits?: string;
    eggsDescription?: string;
    coolFacts?: string[];
    size?: {
        lengthCm?: { min?: number; max?: number };
        wingspanCm?: { min?: number; max?: number };
        weightGrams?: { min?: number; max?: number };
    };
    lifeExpectancyYears?: number;
    taxonomy?: {
        phylum?: string;
        class?: string;
        order?: string;
        family?: string;
        genus?: string;
    };
    conservation?: { code?: string; fullName?: string; lastUpdated?: string };
    habitats?: { name: string }[];
    distributions?: {
        season?: string;
        rangeGeojson?: string;
        description?: string;
    }[];
    media?: {
        type: 'photo' | 'sound' | 'video';
        url: string;
        caption?: string;
        attribution?: string;
    }[];
    commonNames?: { name: string; region?: string }[];
    foods?: {
        name: string;
        //category?: string;
        description?: string;
        photoUrl?: string;
        //feedingMethod?: string;
        //seasonality?: string;
    }[];
    rawSource?: { sourceName: string; raw: any }[]; // for debugging/trace
}
