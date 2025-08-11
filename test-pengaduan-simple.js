const http = require('http');

function testPengaduanEndpoint() {
  console.log('🧪 Testing GET /api/pengaduan endpoint...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/pengaduan',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log('📊 Response status:', res.statusCode);
    console.log('📊 Response headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('📊 Response data type:', typeof jsonData);
        console.log('📊 Response data length:', Array.isArray(jsonData) ? jsonData.length : 'Not an array');
        
        if (Array.isArray(jsonData) && jsonData.length > 0) {
          console.log('🔍 First item structure:');
          console.log('🔍 Keys:', Object.keys(jsonData[0]));
          console.log('🔍 ID:', jsonData[0].id);
          console.log('🔍 ID type:', typeof jsonData[0].id);
          console.log('🔍 Nama:', jsonData[0].nama);
          console.log('🔍 Judul:', jsonData[0].judul);
          console.log('🔍 Isi:', jsonData[0].isi);
          console.log('🔍 Full first item:', JSON.stringify(jsonData[0], null, 2));
        } else {
          console.log('❌ No data returned or data is not an array');
        }
      } catch (error) {
        console.error('❌ Error parsing JSON:', error);
        console.log('📄 Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error testing endpoint:', error);
  });

  req.end();
}

testPengaduanEndpoint();
