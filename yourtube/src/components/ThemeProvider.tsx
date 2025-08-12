import React, { createContext, useContext, useEffect, useState } from 'react';
import LocationSelector from './LocationSelector';

interface ThemeContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  userLocation: {
    state: string | null;
    country: string | null;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const southernStates = ['tamil nadu', 'kerala', 'karnataka', 'andhra pradesh', 'telangana'];

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark';
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'light' 
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(defaultTheme);
  const [userLocation, setUserLocation] = useState<{
    state: string | null;
    country: string | null;
  }>({
    state: null,
    country: null
  });
  const [showLocationSelector, setShowLocationSelector] = useState(false);

  const getAutoTheme = (state: string | null): 'light' | 'dark' => {
    const currentHour = new Date().getHours();
    const isSouthern = state ? southernStates.includes(state.toLowerCase()) : false;
    
    // White theme: 10 AM to 12 PM AND Southern states
    // Dark theme: Other times OR Other states
    if (currentHour >= 10 && currentHour < 12 && isSouthern) {
      return 'light';
    } else {
      return 'dark';
    }
  };

  const handleManualLocationSelect = (state: string) => {
    const locationData = {
      state,
      country: 'India'
    };
    
    setUserLocation(locationData);
    
    // Set theme based on selected location and current time
    const autoTheme = getAutoTheme(state);
    setTheme(autoTheme);
    
    // Store in localStorage
    localStorage.setItem('userLocation', JSON.stringify(locationData));
    localStorage.setItem('theme', autoTheme);
  };

  // Get user's location - simplified version without external API
  const getUserLocation = async () => {
    try {
      // Check if we have cached location first
      const storedLocation = localStorage.getItem('userLocation');
      if (storedLocation) {
        try {
          const parsedLocation = JSON.parse(storedLocation);
          setUserLocation(parsedLocation);
          const autoTheme = getAutoTheme(parsedLocation.state);
          setTheme(autoTheme);
          return;
        } catch (parseError) {
          console.error('Failed to parse stored location:', parseError);
        }
      }

      // Show manual location selector for first-time users
      setShowLocationSelector(true);
      setTheme('dark'); // Default theme
      
    } catch (error) {
      console.error('Failed to get user location:', error);
      setShowLocationSelector(true);
      setTheme('dark');
    }
  };

  useEffect(() => {
    getUserLocation();
    
    // Set up interval to check theme every minute
    const interval = setInterval(() => {
      const storedLocation = localStorage.getItem('userLocation');
      if (storedLocation) {
        try {
          const parsedLocation = JSON.parse(storedLocation);
          const autoTheme = getAutoTheme(parsedLocation.state);
          setTheme(autoTheme);
          localStorage.setItem('theme', autoTheme);
        } catch (error) {
          console.error('Failed to parse location for theme update:', error);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Apply theme to document
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, userLocation }}>
      {children}
      
      <LocationSelector
        isOpen={showLocationSelector}
        onClose={() => setShowLocationSelector(false)}
        onLocationSelect={handleManualLocationSelect}
      />
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};