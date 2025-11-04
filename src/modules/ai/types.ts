import { BirdDistribution } from '../bird/bird-distribution/entities/bird-distribution.entity';
import { BirdFood } from '../bird/bird-foods/entities/bird-food.entity';
import { CommonName } from '../bird/common-names/entities/common-name.entity';
import { ConservationStatus } from '../bird/conservation-status/entities/conservation-status.entity';
import { Habitat } from '../bird/habitats/entities/habitat.entity';
import { Taxonomy } from '../bird/taxonomy/entities/taxonomy.entity';
import { Media } from '../media/entities/media.entity';

export interface IdentificationResult {
    scientificName: string;
    confidence: number;
}

export interface BirdInfo {
    scientificName: string;
    description?: string;
    behavior?: string;
    nestingHabits?: string;
    feedingHabits?: string;
    eggsDescription?: string;
    coolFacts?: string[];
    size?: {
        lengthCm: { min: number; max: number };
        wingspanCm: { min: number; max: number };
        weightGrams: { min: number; max: number };
    };
    lifeExpectancyYears?: number;

    // Relations
    conservationStatus?: ConservationStatus;
    commonNames?: CommonName[];
    media?: Media[];
    habitats?: Habitat[];
    taxonomy?: Taxonomy;
    distributions?: BirdDistribution[];
    birdFoods?: BirdFood[];
    primaryImage?: string;
}

export type BirdAiResponse =
    | {
          status: 'identified';
          confidence: number;
          result: BirdInfo;
      }
    | {
          status: 'uncertain';
          confidence: number;
          result?: Partial<BirdInfo>;
      }
    | {
          status: 'failed';
          confidence: number | null;
          error?: string;
      };

export function isIdentified(
    response: BirdAiResponse,
): response is Extract<
    BirdAiResponse,
    { status: 'identified' }
> {
    return response.status === 'identified';
}

export function isUncertain(
    response: BirdAiResponse,
): response is Extract<
    BirdAiResponse,
    { status: 'uncertain' }
> {
    return response.status === 'uncertain';
}

export function isFailed(
    response: BirdAiResponse,
): response is Extract<
    BirdAiResponse,
    { status: 'failed' }
> {
    return response.status === 'failed';
}
