
export interface IdentificationResult {
    scientificName: string;
    confidence: number;
}


export interface BirdInfo {
  scientificName: string;
  commonName: string;
  photos: {
    male?: string;
    female?: string;
  };
  features: {
    sizeAndShape: string;
    colorPattern: string;
    billShape: string;
    markings: string;
  };
  ecology: {
    habitat: string;
    behavior: string;
    diet: string;
  };
  geography: {
    rangeMap?: string;
    yearRound?: string;
    breeding?: string;
    wintering?: string;
    migration?: string;
    seasonality: string;
  };
  education: {
    conservation: string;
    nesting: string;
    eggs: string;
    coolFacts: string[];
  };
}


export interface BirdAiRespone {

}