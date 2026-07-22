import { useState, useEffect, createContext, useContext } from 'react';
import { countries } from './countries';

interface CurrencyContextType {
  currencySymbol: string;
  isIndian: boolean;
  formatCurrency: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ 
  children, 
  countryCode 
}: { 
  children: React.ReactNode; 
  countryCode?: string;
}) {
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [isIndian, setIsIndian] = useState(true);

  // useEffect(() => {
  //   // First try with countryCode prop if available
  //   if (countryCode) {
  //     const country = countries.find(c => c.code === countryCode);
  //     if (country) {
  //       setCurrencySymbol(country.currencySymbol);
  //       setIsIndian(country.code === 'IN');
  //       return;
  //     }
  //   }

  //   // Fallback to geolocation
  //   const detectCurrency = async () => {
  //     if (navigator.geolocation) {
  //       try {
  //         const position = await new Promise<GeolocationPosition>((resolve, reject) => {
  //           navigator.geolocation.getCurrentPosition(resolve, reject);
  //         });
          
  //         const response = await fetch(
  //           `https://geocode.maps.co/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}`
  //         );
  //         const data = await response.json();
          
  //         const countryName = data.address?.country || '';
  //         const country = countries.find(c => c.name.toLowerCase() === countryName.toLowerCase());
          
  //         if (country) {
  //           setCurrencySymbol(country.currencySymbol);
  //           setIsIndian(country.code === 'IN');
  //         }
  //         // If country not found, keep default India
  //       } catch (error) {
  //         // Keep default India if geolocation fails
  //       }
  //     }
  //     // Keep default India if geolocation not available
  //   };
    
  //   detectCurrency();
  // }, [countryCode]);
useEffect(() => {

  // FIRST TRY COUNTRY CODE
  if (countryCode) {

    const country =
      countries.find(
        c => c.code === countryCode
      );

    if (country) {

      setCurrencySymbol(
        country.currencySymbol
      );

      setIsIndian(
        country.code === 'IN'
      );

      return;
    }
  }

  // GEOLOCATION FALLBACK
  const detectCurrency = async () => {

    if (!navigator.geolocation) {
      return;
    }

    try {

      const position =
        await new Promise<GeolocationPosition>(
          (resolve, reject) => {

            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
              }
            );
          }
        );

      const latitude =
        position.coords.latitude;

      const longitude =
        position.coords.longitude;

      // FREE OPENSTREETMAP API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      const data =
        await response.json();

      // console.log(
      //   'Currency Location:',
      //   data
      // );

      const countryName =
        data?.address?.country || '';

      const country =
        countries.find(
          c =>
            c.name.toLowerCase() ===
            countryName.toLowerCase()
        );

      if (country) {

        setCurrencySymbol(
          country.currencySymbol
        );

        setIsIndian(
          country.code === 'IN'
        );
      }

    } catch (error) {

      console.log(
        'Currency Detect Error:',
        error
      );

      // DEFAULT INDIA
      setCurrencySymbol('₹');
      setIsIndian(true);
    }
  };

  detectCurrency();

}, [countryCode]);

  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${Math.floor(amount).toLocaleString(isIndian ? 'en-IN' : 'en-US')}`;
  };

  return (
    <CurrencyContext.Provider value={{ currencySymbol, isIndian, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
