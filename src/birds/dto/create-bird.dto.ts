export class CreateBirdDto {

  commonName: string;

  scientificName: string;

  photos?: {
    male?: string;
    female?: string;
  };

}