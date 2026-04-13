import React, { useEffect, useState } from 'react';
import { regions, provinces, cities, barangays } from 'select-philippines-address';

interface PHAddressPickerProps {
  id?: string;
  name?: string;
  className?: string;
  required?: boolean;
  onChange?: (value: string) => void;
  defaultValue?: string;
}

export function PHAddressPicker({ id, name, className, required, onChange, defaultValue }: PHAddressPickerProps) {
  const [regionData, setRegionData] = useState<any[]>([]);
  const [provinceData, setProvinceData] = useState<any[]>([]);
  const [cityData, setCityData] = useState<any[]>([]);
  const [barangayData, setBarangayData] = useState<any[]>([]);

  // Selected object maps
  const [regionCode, setRegionCode] = useState('');
  const [regionName, setRegionName] = useState('');

  const [provinceCode, setProvinceCode] = useState('');
  const [provinceName, setProvinceName] = useState('');

  const [cityCode, setCityCode] = useState('');
  const [cityName, setCityName] = useState('');

  const [barangayCode, setBarangayCode] = useState('');
  const [barangayName, setBarangayName] = useState('');

  const [streetAddress, setStreetAddress] = useState(defaultValue || '');

  // Initial load
  useEffect(() => {
    regions().then((response: any) => {
      setRegionData(response);
      // Auto-select NCR (Code '13')
      const ncr = response.find((r: any) => r.region_name === 'National Capital Region (NCR)' || r.region_code === '13');
      if (ncr) {
        setRegionCode(ncr.region_code);
        setRegionName(ncr.region_name);
      }
    });
  }, []);

  // When Region changes
  useEffect(() => {
    if (regionCode) {
      provinces(regionCode).then((response: any) => {
        setProvinceData(response);
        setProvinceCode('');
        setProvinceName('');
        setCityCode('');
        setCityName('');
        setCityData([]);
        setBarangayCode('');
        setBarangayName('');
        setBarangayData([]);

        // Select Philippines Address logic: IF NCR, it might return 4 districts as "provinces"
        if (regionCode === '13' && response.length > 0) {
          // Keep it simple and auto-enable them, or disable
        }
      });
    }
  }, [regionCode]);

  // When Province changes
  useEffect(() => {
    if (provinceCode || (regionCode === '13' && provinceData.length === 0)) {
      // If it's NCR and no provinces physically returned, some APIs jump straight to cities(regionCode)
      // `select-philippines-address` uses province code for NCR districts (e.g. 1339 -> Manila)
      cities(provinceCode || regionCode).then((response: any) => {
        setCityData(response);
        setCityCode('');
        setCityName('');
        setBarangayCode('');
        setBarangayName('');
        setBarangayData([]);
      });
    }
  }, [provinceCode, regionCode, provinceData.length]);

  // When City changes
  useEffect(() => {
    if (cityCode) {
      barangays(cityCode).then((response: any) => {
        setBarangayData(response);
        setBarangayCode('');
        setBarangayName('');
      });
    }
  }, [cityCode]);

  const selectRegion = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setRegionCode(val);
    setRegionName(e.target.options[e.target.selectedIndex].text);
  };

  const selectProvince = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setProvinceCode(val);
    setProvinceName(e.target.options[e.target.selectedIndex].text);
  };

  const selectCity = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCityCode(val);
    setCityName(e.target.options[e.target.selectedIndex].text);
  };

  const selectBarangay = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBarangayName(val); // Datalist uses name matching rather than exact select
    const match = barangayData.find(b => b.brgy_name === val);
    if(match) setBarangayCode(match.brgy_code);
  };

  const isNCR = regionCode === '13';
  
  // Format the comprehensive address line for backend submission
  const compileAddress = () => {
    const parts = [
      streetAddress.trim(),
      barangayName ? `Brgy. ${barangayName}` : '',
      cityName,
      (isNCR ? '' : provinceName),
      regionName
    ];
    return parts.filter(Boolean).join(', ');
  };

  useEffect(() => {
    if (onChange) {
      onChange(compileAddress());
    }
  }, [streetAddress, barangayName, cityName, provinceName, regionName, isNCR, onChange]);

  // We only require fields based on progression
  const needsProvince = !isNCR;

  return (
    <div className="space-y-4">
      {/* Hidden input to hold the actual concatenated payload meant for the form submission */}
      <input type="hidden" name={name} id={id} value={compileAddress()} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-900 dark:text-gray-100">Region</label>
          <select value={regionCode} onChange={selectRegion} className={className} required={required}>
            <option value="" disabled>Select Region</option>
            {regionData.map(r => (
              <option key={r.region_code} value={r.region_code}>{r.region_name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm flex justify-between font-bold text-gray-900 dark:text-gray-100">
            Province / District {isNCR && <span className="text-gray-400 font-normal text-xs">(Auto-mapped for NCR)</span>}
          </label>
          <select 
            value={provinceCode} 
            onChange={selectProvince} 
            className={`${className} ${isNCR ? 'bg-gray-50 dark:bg-black-900 opacity-90' : ''}`}
            required={needsProvince && required}
          >
            <option value="" disabled>Select Province / District</option>
            {provinceData.map(p => (
              <option key={p.province_code} value={p.province_code}>{p.province_name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-900 dark:text-gray-100">City / Municipality</label>
          <select value={cityCode} onChange={selectCity} className={className} required={required} disabled={!provinceCode && provinceData.length > 0}>
            <option value="" disabled>Select City</option>
            {cityData.map(c => (
              <option key={c.city_code} value={c.city_code}>{c.city_name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2 relative">
          <label className="text-sm font-bold text-gray-900 dark:text-gray-100">Barangay (Searchable)</label>
          {/* using datalist for native searchable fuzzy dropdown! */}
          <input 
            type="text" 
            list="barangays-list"
            value={barangayName}
            onChange={selectBarangay}
            disabled={!cityCode}
            placeholder={!cityCode ? "Select a city first" : "Type to search Barangay..."}
            className={className}
            required={required}
            autoComplete="off"
          />
          <datalist id="barangays-list">
            {barangayData.map(b => (
              <option key={b.brgy_code} value={b.brgy_name} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-900 dark:text-gray-100">Street / House Number / Building</label>
        <input 
          type="text" 
          value={streetAddress}
          onChange={(e) => setStreetAddress(e.target.value)}
          placeholder="e.g. Unit 4B, 123 Main St."
          className={className}
          required={required}
        />
      </div>
    </div>
  );
}
