// eBird Types
interface EBirdTaxon {
    sciName: string;
    comName: string;
    order: string;
    familySciName: string;
    genus: string;
    speciesCode: string;
}

interface EBirdObservation {
    countryCode: string;
    countryName: string;
    subnational1Code: string;
    subnational1Name: string;
    locId: string;
    locName: string;
    obsDt: string;
    howMany: number;
}

interface EBirdDistribution {
    region: string;
    country: string;
    countryCode: string;
    seasonality: string;
}

interface EBirdData {
    taxonomy: EBirdTaxon[];
    observations: EBirdObservation[];
    distribution: EBirdDistribution[];
}

// iNaturalist Types
interface INaturalistTaxon {
    id: number;
    name: string;
    rank: string;
    wikipedia_summary?: string;
    conservation_status?: {
        status: string;
        authority: string;
    };
    common_names?: Array<{
        name: string;
        lexicon: string;
        place_guess?: string;
        is_default: boolean;
    }>;
    observations_count: number;
}

interface INaturalistPhoto {
    url: string;
    large_url?: string;
    small_url?: string;
    medium_url?: string;
    attribution: string;
    license_code: string;
}

interface INaturalistObservation {
    id: number;
    photos: INaturalistPhoto[];
    taxon: INaturalistTaxon;
}

interface INaturalistData {
    taxon: INaturalistTaxon;
    observations: INaturalistObservation[];
    photos: INaturalistPhoto[];
    conservationStatus?: {
        status: string;
        authority: string;
    };
    commonNames?: Array<{
        name: string;
        lexicon: string;
        place_guess?: string;
        is_default: boolean;
    }>;
}

// GBIF Types
interface GBIFSpecies {
    usageKey: number;
    scientificName: string;
    description?: string;
    kingdom: string;
    phylum: string;
    class: string;
    order: string;
    family: string;
    genus: string;
    species: string;
}

interface GBIFVernacularName {
    vernacularName: string;
    language: string;
    country?: string;
    preferred: boolean;
}

interface GBIFDistribution {
    locality: string;
    country: string;
    establishmentMeans: string;
    status: string;
}

interface GBIFData {
    species: GBIFSpecies;
    vernacularNames: GBIFVernacularName[];
    distributions: GBIFDistribution[];
}

// Xeno-canto Types
interface XenoCantoRecording {
    id: string;
    file: string;
    q: string;
    length: string;
    type: string;
    rec: string;
    loc: string;
    cnt: string;
    date: string;
    lic: string;
    sono?: {
        small?: string;
        large?: string;
    };
}

interface XenoCantoData {
    recordings: XenoCantoRecording[];
    totalRecordings: number;
}

// OpenAI Types
interface OpenAIBirdData {
    scientificName: string;
    description?: string;
    behavior?: string;
    nestingHabits?: string;
    feedingHabits?: string;
    eggsDescription?: string;
    coolFacts?: string[];
    size?: {
        lengthCm: {
            min: number;
            max: number;
        };
        wingspanCm: {
            min: number;
            max: number;
        };
        weightGrams: {
            min: number;
            max: number;
        };
    };
    lifeExpectancyYears?: number;
    taxonomy?: {
        phylum: string;
        class: string;
        order: string;
        family: string;
        genus: string;
    };
    commonNames?: Array<{
        name: string;
        language: string;
        region?: string;
    }>;
    habitats?: Array<
        | {
              name: string;
          }
        | string
    >;
    birdFoods?: string[];
    conservationStatus?: {
        code: string;
        authority?: string;
    };
    distributions?: Array<{
        region: string;
        country: string;
        seasonality?: string;
    }>;
}

// OpenAi API Response Type
