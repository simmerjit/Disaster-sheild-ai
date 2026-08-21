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

async function runSurvivalBackendTests() {
  console.log('Testing Survival Academy Backend...');

  // 1. GET /api/survival
  const resAll = await testEndpoint('/api/survival');
  console.log(`GET /api/survival => Status: ${resAll.status}, Total: ${resAll.data?.pagination?.total}`);

  // 2. GET /api/survival/trending
  const resTrending = await testEndpoint('/api/survival/trending');
  console.log(`GET /api/survival/trending => Status: ${resTrending.status}, Count: ${resTrending.data?.count}`);

  // 3. GET /api/survival/featured
  const resFeatured = await testEndpoint('/api/survival/featured');
  console.log(`GET /api/survival/featured => Status: ${resFeatured.status}, Count: ${resFeatured.data?.count}`);

  // 4. GET /api/survival/recommendations?disasterType=earthquake
  const resRec = await testEndpoint('/api/survival/recommendations?disasterType=earthquake');
  console.log(`GET /api/survival/recommendations?disasterType=earthquake => Status: ${resRec.status}`);
  console.log('  Rec Disaster Type:', resRec.data?.data?.disasterType);
  console.log('  Primary Videos Count:', resRec.data?.data?.primaryVideos?.length);
  console.log('  Quick Guide Title:', resRec.data?.data?.emergencyQuickGuide?.title);

  // 5. GET /api/survival/categories
  const resCat = await testEndpoint('/api/survival/categories');
  console.log(`GET /api/survival/categories => Status: ${resCat.status}, Categories found: ${resCat.data?.data?.length}`);
}

runSurvivalBackendTests().catch(console.error);
