import { useEffect, useState } from "react";

export function CurrentDateTime(){
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentDateTime(new Date());
      }, 1000);
      return () => clearInterval(interval);
    }, []); 
  
    const formattedDateTime = currentDateTime.toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
    return formattedDateTime;
}
export function focusNext(currentInput) {
  if (currentInput.value.length === 1) {
      const nextInput = currentInput.nextElementSibling;
      if (nextInput) {
          nextInput.focus();
      }
  }
}
export function handleInput(currentInput) {
  var userInput = "";
  var digitInputs = document.querySelectorAll('.input');
  digitInputs.forEach(function (digitInput) {
      userInput += digitInput.value;
  });
  document.getElementById('userInput').value = userInput;

  focusNext(currentInput);
  return userInput
}

export function clearOTP() {
  const inputs = document.querySelectorAll('.input');
  inputs.forEach((input) => (input.value = ''));
  if (inputs.length > 0) {
      inputs[0].focus();
  }
}