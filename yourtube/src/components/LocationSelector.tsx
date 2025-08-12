import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface LocationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (state: string) => void;
}

const indianStates = [
  'Tamil Nadu',
  'Kerala', 
  'Karnataka',
  'Andhra Pradesh',
  'Telangana',
  'Maharashtra',
  'Gujarat',
  'Rajasthan',
  'Uttar Pradesh',
  'Madhya Pradesh',
  'West Bengal',
  'Bihar',
  'Odisha',
  'Punjab',
  'Haryana',
  'Himachal Pradesh',
  'Uttarakhand',
  'Jharkhand',
  'Chhattisgarh',
  'Assam',
  'Tripura',
  'Meghalaya',
  'Manipur',
  'Mizoram',
  'Nagaland',
  'Arunachal Pradesh',
  'Sikkim',
  'Goa'
];

const southernStates = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'];

const LocationSelector: React.FC<LocationSelectorProps> = ({ isOpen, onClose, onLocationSelect }) => {
  const [selectedState, setSelectedState] = useState<string>('');

  const handleSubmit = () => {
    if (selectedState) {
      onLocationSelect(selectedState);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Your Location</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We couldn't automatically detect your location. Please select your state to enable location-based theming and OTP preferences.
          </p>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Select State:</label>
            <select 
              value={selectedState} 
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
            >
              <option value="">Choose a state...</option>
              {indianStates.map(state => (
                <option key={state} value={state}>
                  {state} {southernStates.includes(state) ? '(Southern)' : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <strong>Theme Rules:</strong><br/>
            • Southern states (TN, KL, KA, AP, TS): White theme from 10 AM - 12 PM<br/>
            • Other times/states: Dark theme<br/>
            <strong>OTP Rules:</strong><br/>
            • Southern states: Email OTP<br/>
            • Other states: SMS OTP
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!selectedState}>
              Set Location
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationSelector;
