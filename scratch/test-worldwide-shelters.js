import http from 'http';

function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('Testing Global Shelter Discovery...');

  // 1. Japan (Earthquake)
  console.log('\n--- 1. Testing Japan Earthquake (35.6762, 139.6503) ---');
  const resJapan = await testEndpoint('/api/shelters?lat=35.6762&lng=139.6503&radius=30000&type=earthquake');
  console.log(`Status: ${resJapan.status}, Shelters found: ${resJapan.data?.count}`);
  if (resJapan.data?.data?.[0]) {
    console.log('Sample Shelter:', {
      name: resJapan.data.data[0].name,
      lat: resJapan.data.data[0].latitude,
      lng: resJapan.data.data[0].longitude,
      dist: resJapan.data.data[0].distanceKm,
    });
  }

  // 2. California (Wildfire)
  console.log('\n--- 2. Testing California Wildfire (34.0522, -118.2437) ---');
  const resCal = await testEndpoint('/api/shelters?lat=34.0522&lng=-118.2437&radius=30000&type=wildfire');
  console.log(`Status: ${resCal.status}, Shelters found: ${resCal.data?.count}`);
  if (resCal.data?.data?.[0]) {
    console.log('Sample Shelter:', {
      name: resCal.data.data[0].name,
      lat: resCal.data.data[0].latitude,
      lng: resCal.data.data[0].longitude,
      dist: resCal.data.data[0].distanceKm,
    });
  }

  // 3. Recommended Shelter for Brazil Flood (-14.235, -51.9253)
  console.log('\n--- 3. Testing Brazil Flood Recommendation (-14.235, -51.9253) ---');
  const resBrazilRec = await testEndpoint('/api/shelters/recommended?lat=-14.235&lng=-51.9253&disasterLat=-14.235&disasterLng=-51.9253&type=flood');
  console.log(`Status: ${resBrazilRec.status}`);
  console.log('Recommended:', resBrazilRec.data?.data?.recommendedShelter?.name);
  console.log('Confidence:', resBrazilRec.data?.data?.confidence);
  console.log('Reason:', resBrazilRec.data?.data?.reason);
}

runTests().catch(console.error);
