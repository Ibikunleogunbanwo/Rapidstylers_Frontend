import { useEffect } from "react";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import CryptoJS from 'crypto-js';

export const API_KEY = "14022024";
export const JSON_CONTENT_TYPE = "application/json";
export const API_BASE_URL = "http://localhost:9090/rapid_stylers";
export const DECRYPT_KEY = "D0n!T'T&mp3r@w1Th^&()";

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
        const persistedState = localStorage.getItem(key);
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
      };      const inputs = document.querySelectorAll('.digitFormat');
      inputs.forEach((input) => {
        input.addEventListener('keyup', handleDigitInput);
      });

      return () => {
        inputs.forEach((input) => {
          input.removeEventListener('keyup', handleDigitInput);
        });
      };
    }, []);
  }

  export const generateSecretKey = (keyString) => {
    let key = CryptoJS.enc.Utf8.parse(keyString);
    key = CryptoJS.SHA256(key);
    key = key.toString(CryptoJS.enc.Hex).substr(0, 32); 
    return CryptoJS.enc.Hex.parse(key);
  };

  export const decryptData = (encryptedString) => {
    const key = generateSecretKey(DECRYPT_KEY);
    const bytes = CryptoJS.AES.decrypt(encryptedString, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });
    return bytes.toString(CryptoJS.enc.Utf8);
  };