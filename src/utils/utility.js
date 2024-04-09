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