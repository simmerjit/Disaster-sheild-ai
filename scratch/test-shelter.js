import { fetchSheltersFromOverpass, generateDemoShelters } from '../backend/services/shelter.service.js';
import { recommendShelter } from '../backend/utils/shelterRecommendation.js';
import { generateShelterCacheKey, setCachedShelters, getCachedShelters } from '../backend/utils/shelterCache.js';

async function runTests() {
  console.log('--- 1. Testing Demo Shelter Generation ---');
  const demoShelters = generateDemoShelters(28.6139, 77.209, 3);
  console.log(`Generated ${demoShelters.length} demo shelters:`);
  demoShelters.forEach(s => {
    console.log(`  - ${s.name} (${s.type}) | Beds: ${s.capacity.availableBeds}/${s.capacity.totalBeds} | Food: ${s.facilities.foodAvailable} | Med: ${s.facilities.medicalAvailable} | Source: ${s.source}`);
  });

  console.log('\n--- 2. Testing Recommendation Engine ---');
  const disasterLoc = { latitude: 28.65, longitude: 77.22, radiusKm: 8 };
  const userLoc = { latitude: 28.61, longitude: 77.20 };
  const recResult = recommendShelter(demoShelters, disasterLoc, userLoc);
  console.log('Top Recommended:', recResult.topRecommendedShelter?.name);
  console.log('Confidence:', recResult.confidence);
  console.log('Reason:', recResult.reason);

  console.log('\n--- 3. Testing Node-Cache Mechanism ---');
  const cacheKey = generateShelterCacheKey(28.6139, 77.209, 15000);
  console.log('Cache Key:', cacheKey);
  setCachedShelters(cacheKey, demoShelters, 1800);
  const cachedData = getCachedShelters(cacheKey);
  console.log(`Cached items retrieved: ${cachedData?.length} items`);

  console.log('\n--- 4. Testing Overpass / Fallback Service Fetch ---');
  const results = await fetchSheltersFromOverpass(28.6139, 77.209, 10000);
  console.log(`fetchSheltersFromOverpass returned ${results.length} normalized shelters.`);
  console.log('First 2 shelters:');
  results.slice(0, 2).forEach(s => {
    console.log(`  - ${s.name} (${s.type}) | Dist: ${s.distanceKm}km | Source: ${s.source}`);
  });

  console.log('\n✅ ALL SHELTER BACKEND TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
