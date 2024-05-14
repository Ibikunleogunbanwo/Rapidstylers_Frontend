import { useEffect } from "react";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export const API_KEY = "14022024";
export const JSON_CONTENT_TYPE = "application/json";
export const API_BASE_URL = "http://localhost:9090/rapid_stylers";

export const API_HEADER = {
    'Content-Type' : JSON_CONTENT_TYPE,
    'x-api-key' : API_KEY
}

export const FORM_DATA_HEADER = {
    'x-api-key' : API_KEY,
    'Content-Type': 'multipart/form-data',
}

export const showSuccessToastMessage  = (successMessage)=>{
    toast.success(successMessage);
    return null;
}

export const showErrorToastMessage  = (errorMessage)=>{
    toast.error(errorMessage);
    return null;
}

export const showSuccessMessageReload = (successMessage)=>{
    toast.success(successMessage, 
    {
        onClose: () => {
            setTimeout(() => {
                window.location.reload();
            }, 6000)
        }
    }
    );
    return null;
}

export const retrieveFromLocalStorage = (keys) =>{
    const data = {};
    keys.forEach((key)=>{
        const persistedState = sessionStorage.getItem(key);
        data[key] = persistedState ? JSON.parse(persistedState) : null;
    });
    return data;
}
export function useDigitInput() {
    useEffect(() => {
      const handleDigitInput = (event) => {
        const removeString = event.target.value.replace(/[^0-9.]/g, '');
        const convertToDigit = parseFloat(removeString);
        if (!isNaN(convertToDigit)) {
          event.target.value = convertToDigit;
        } else {
          event.target.value = '';
        }
      };
  
      document.querySelectorAll('.digitFormat').forEach((input) => {
        input.addEventListener('keyup', handleDigitInput);
  
        return () => {
          input.removeEventListener('keyup', handleDigitInput);
        };
      });
    }, []);
  }