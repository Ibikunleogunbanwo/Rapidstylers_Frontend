import { useEffect } from "react";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import CryptoJS from 'crypto-js';

// Secrets come from the local .env file (gitignored) via CRA's REACT_APP_ vars.
// Copy .env.example to .env and fill in real values.
export const API_KEY = process.env.REACT_APP_API_KEY || "";
export const JSON_CONTENT_TYPE = "application/json";
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9090/rapid_stylers";
export const DECRYPT_KEY = process.env.REACT_APP_DECRYPT_KEY || "";

export const API_HEADER = {
    'Content-Type' : JSON_CONTENT_TYPE,
    'x-api-key' : API_KEY
}

// JWT issued by user_sign_in / styler_sign_in / admin_sign_in — attached as
// Authorization: Bearer <token> by the ApiClient interceptor.
export const AUTH_TOKEN_STORAGE_KEY = "rapidstylers_auth_token";
export const getAuthToken = () => sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "";
export const setAuthToken = (token) => sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
export const clearAuthToken = () => sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);

export const FORM_DATA_HEADER = {
    'x-api-key' : API_KEY,
    'Content-Type': 'multipart/form-data',
}

const TOAST_OPTIONS = {
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "colored",
};

export const showSuccessToastMessage  = (successMessage)=>{
    toast.success(successMessage, TOAST_OPTIONS);
    return null;
}

export const showErrorToastMessage  = (errorMessage)=>{
    toast.error(errorMessage, { ...TOAST_OPTIONS, autoClose: 5000 });
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