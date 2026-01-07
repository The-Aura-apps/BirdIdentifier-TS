# XenoCanto API Error - Complete Fix Guide

## 🚨 CRITICAL ISSUE DISCOVERED

**XenoCanto API v2 is SHUT DOWN as of 2025!**

API v3 now **REQUIRES an API key** for all requests.

## Root Cause
```
"Xeno-canto API v2 is no longer available. 
Visit https://xeno-canto.org/explore/api for API v3 documentation."
```

## ✅ SOLUTION (2 Options)

### Option 1: Get FREE XenoCanto API Key (Recommended)

#### Step 1: Create Account & Get API Key
1. Visit: **https://xeno-canto.org/account**
2. Create free account (if you don't have one)
3. Login and navigate to "API Access" section
4. Copy your API key

#### Step 2: Add to Your .env File
```env
# XenoCanto API Key (FREE - get from https://xeno-canto.org/account)
XENOCANTO_API_KEY=your_api_key_here
```

#### Step 3: Restart Server
```bash
npm run start:dev
```

#### Step 4: Test
You should now see:
```
[XenoCantoAudioWrapper] XenoCanto API initialized with API key
[XenoCantoAudioWrapper] Successfully fetched 2 audio recordings for Haliaeetus leucocephalus
```

---

### Option 2: Disable XenoCanto (If you don't need audio)

If you don't want to use XenoCanto audio, you can disable it:

#### Step 1: Add to .env
```env
# Disable XenoCanto audio fetching
ENABLE_XENOCANTO=false
```

#### Step 2: Update birds.service.ts
Find the XenoCanto section (around line 920-940):

```typescript
// Fetch audio recordings from xeno-canto
if (process.env.ENABLE_XENOCANTO !== 'false') {
    try {
        this.logger.log(`Fetching audio recordings...`);
        const audioFiles = await this.xenoCantoAudioWrapper.fetchAudio(
            bird.scientificName,
            2,
        );
        // ... rest of code
    } catch (err) {
        this.logger.warn('XenoCanto unavailable, skipping audio');
    }
}
```

---

## 📋 What Was Fixed

1. **Changed endpoint**: `www.xeno-canto.org` (works better)
2. **Added API key support**: ConfigService integration
3. **Better error messages**: Shows you exactly what to do
4. **Fallback strategies**: Tries genus-only search if full name fails
5. **Quality filtering**: Only when enough recordings available

---

## 🧪 Testing

### Test 1: With API Key
```bash
# Should work with famous birds
curl "https://www.xeno-canto.org/api/2/recordings?query=Haliaeetus+leucocephalus&key=YOUR_KEY"
```

### Test 2: Application Test
```bash
# Start server
npm run start:dev

# In another terminal, test endpoint
curl http://localhost:3000/api/birds/scientific/Haliaeetus%20leucocephalus
```

**Expected logs:**
```
[XenoCantoAudioWrapper] XenoCanto (exact name): 156 recordings found
[XenoCantoAudioWrapper] Successfully fetched 2 audio recordings for Haliaeetus leucocephalus
```

---

## ❌ Common Errors & Solutions

### Error: "Missing or invalid 'key' parameter"
**Solution:** Add `XENOCANTO_API_KEY` to your `.env` file

### Error: "No audio recordings found"
**Possible causes:**
- Rare/obscure bird species (try searching on xeno-canto.org website first)
- Typo in scientific name
- API rate limiting (wait a minute)

### Error: "XenoCanto API authentication failed (401)"
**Solution:** 
1. Check your API key is correct
2. Visit https://xeno-canto.org/account to verify it's active
3. Make sure no extra spaces in .env file

---

## 🔍 Debugging

Enable detailed logging by setting LOG_LEVEL:

```env
# .env
LOG_LEVEL=debug
```

You'll see:
```
[XenoCantoAudioWrapper] XenoCanto attempt: exact name - https://www.xeno-canto.org/api/2/recordings?query=...
[XenoCantoAudioWrapper] XenoCanto status: 200
[XenoCantoAudioWrapper] XenoCanto (exact name): 156 recordings found
```

---

## 📚 Alternative Audio Sources

If XenoCanto doesn't work for you:

1. **Macaulay Library** (Cornell Lab)
   - URL: https://www.macaulaylibrary.org/
   - API: https://api.ebird.org/
   - Requires: eBird API key (free)

2. **Wikipedia Commons**
   - Many bird audio files
   - No API key needed
   - API: https://commons.wikimedia.org/w/api.php

3. **iNaturalist**
   - Has some audio observations
   - API: https://api.inaturalist.org/
   - No key needed

---

## 📝 Summary

**What happened:** XenoCanto shut down API v2 in 2025, v3 requires free API key

**Quick fix:**
1. Get API key from https://xeno-canto.org/account
2. Add to .env: `XENOCANTO_API_KEY=your_key`
3. Restart server

**Already fixed in code:**
- ✅ Added API key support
- ✅ Better error messages
- ✅ Multiple search strategies
- ✅ Quality filtering
- ✅ Detailed logging


