import { Injectable } from "@nestjs/common";


@Injectable()
export class BirdInfoWrapper {
  async fetchInfo(name: string): Promise<BirdInfo> {
    //ToDo connect with api for collecting data
    
    return{

    }
  }

}