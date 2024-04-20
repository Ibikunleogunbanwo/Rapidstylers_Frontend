import { showErrorToastMessage } from "../../utils/constant";

export class APIService {
    static extractError(error){
        let extracted;
        if(error.isAxiosError){
            if(error.request){
                extracted = ["Network Error Occurred"];
            }
            else if(error.response){
                extracted = [error.response.message];
            }
            else{
                extracted = ["An Unexpected Error occurred"];
            }
        }
        else{
            extracted = [error.response.message || "An Unexpected Error occurred"];
        }
        extracted.forEach((error)=>showErrorToastMessage(error));
    }
}