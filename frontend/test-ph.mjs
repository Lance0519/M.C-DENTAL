import { regions, provinces, cities, barangays } from 'select-philippines-address';

async function test() {
  const rs = await regions();
  console.log("Regions:", rs.slice(0, 2));
  
  // Find NCR
  const ncr = rs.find(r => r.region_name === "National Capital Region (NCR)");
  console.log("NCR Code:", ncr ? ncr.region_code : 'Not found');
  
  if (ncr) {
    const provs = await provinces(ncr.region_code);
    console.log("NCR Provinces:", provs);
    
    // Some libraries put NCR cities directly under region, some don't.
    // Let's check cities passing Region Code
    try {
      const c1 = await cities(ncr.region_code);
      console.log("Cities via Region Code (NCR):", c1.slice(0, 2));
    } catch(e) { console.log(e); }
  }
}

test();
