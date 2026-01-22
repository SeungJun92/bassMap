const axios = require('axios');
const db = require('./db');
require('dotenv').config();

const KAKAO_API_KEY = process.env.KAKAO_REST_API_KEY;

// Delay function to respect rate limits
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function geocodeAddress(address) {
    try {
        const response = await axios.get('https://dapi.kakao.com/v2/local/search/address.json', {
            params: { query: address },
            headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` }
        });

        if (response.data.documents && response.data.documents.length > 0) {
            const { x, y } = response.data.documents[0];
            return { lng: parseFloat(x), lat: parseFloat(y) };
        }
        return null;
    } catch (error) {
        console.error(`Geocoding failed for "${address}":`, error.message);
        return null;
    }
}

async function updateReservoirsWithCoordinates() {
    console.log('🗺️  Starting Kakao Geocoding for 927 reservoirs...\n');

    try {
        // Get all reservoirs with 0,0 coordinates
        const result = await db.query(
            "SELECT id, name, water_level FROM reservoirs WHERE lat = 0 AND lng = 0"
        );

        const reservoirs = result.rows;
        console.log(`Found ${reservoirs.length} reservoirs without coordinates.\n`);

        if (reservoirs.length === 0) {
            console.log('✅ All reservoirs already have coordinates!');
            return;
        }

        // Fetch addresses from the original API data
        const SERVICE_KEY = process.env.PUBLIC_DATA_KEY;
        const apiUrl = `http://api.data.go.kr/openapi/tn_pubr_public_reservoirs_dams_api?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=1000&type=json`;

        console.log('📡 Fetching addresses from public data API...');
        const apiResponse = await axios.get(apiUrl);

        let items = apiResponse.data?.response?.body?.items;
        if (!Array.isArray(items)) items = [items];

        // Create a map of name -> address
        const addressMap = new Map();
        items.forEach(item => {
            const name = item.fcltNm;
            const address = item.lctnLotnoAddr || item.lctnRoadNmAddr;
            if (name && address) {
                addressMap.set(name.trim(), address.trim());
            }
        });

        console.log(`📍 Found ${addressMap.size} addresses from API.\n`);

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < reservoirs.length; i++) {
            const reservoir = reservoirs[i];
            const address = addressMap.get(reservoir.name);

            if (!address) {
                console.log(`⚠️  [${i + 1}/${reservoirs.length}] No address found for: ${reservoir.name}`);
                failCount++;
                continue;
            }

            console.log(`🔍 [${i + 1}/${reservoirs.length}] Geocoding: ${reservoir.name}`);
            console.log(`   Address: ${address}`);

            const coords = await geocodeAddress(address);

            if (coords) {
                await db.query(
                    'UPDATE reservoirs SET lat = $1, lng = $2 WHERE id = $3',
                    [coords.lat, coords.lng, reservoir.id]
                );
                console.log(`   ✅ Updated: ${coords.lat}, ${coords.lng}\n`);
                successCount++;
            } else {
                console.log(`   ❌ Failed to geocode\n`);
                failCount++;
            }

            // Rate limiting: Wait 100ms between requests (10 requests/sec)
            await delay(100);
        }

        console.log('\n' + '='.repeat(50));
        console.log('🎉 Geocoding Complete!');
        console.log(`✅ Success: ${successCount}`);
        console.log(`❌ Failed: ${failCount}`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit();
    }
}

updateReservoirsWithCoordinates();
