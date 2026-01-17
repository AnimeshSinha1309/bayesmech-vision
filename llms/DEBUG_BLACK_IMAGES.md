# Image Statistics Logging Added

## What Was Added

Enhanced logging to show **mean, min, max** values of images before encoding. This will help diagnose if:
1. Android is sending all-black images (mean ≈ 0)
2. Images are getting corrupted in transit
3. Encoding is working correctly

## New Server Logs

### For RGB Images:
```
INFO - Encoding image: shape=(720, 1280, 3), dtype=uint8, mean=127.42, min=0, max=255
INFO - Encoded to base64: 61024 chars, first 50: /9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBw...
```

### For Depth Maps:
```
INFO - Encoding depth: shape=(480, 640), dtype=uint16, mean=1542.33, min=100, max=5000
INFO - Depth encoded to base64: 42048 chars
```

## What to Look For

### ✅ Normal RGB Image
```
mean=127.42, min=0, max=255
```
- Mean around 127.5 is typical (middle of 0-255 range)
- Min=0, Max=255 is expected for uint8
- Base64 size: 20KB-150KB depending on resolution and quality

### ❌ All-Black Image
```
mean=0.00, min=0, max=0
```
- Everything is zero = completely black
- This means Android is either:
  - Not capturing camera data
  - Sending empty/zeroed buffers
  - Camera permissions issue

###⚠️ Very Small Image
```
Base64 size = 2436 chars
```
- Normal 1280x720 JPEG: ~50KB-100KB base64 (~66-133K chars)
- Normal 640x480 JPEG: ~20KB-40KB base64 (~26-53K chars)
- **2436 chars = ~1.8KB** - This is TINY!
- Either:
  - Very small resolution (like 64x48)
  - Very low JPEG quality
  - Almost empty image

## Diagnosis Steps

### Test 1: Restart Server and Check Logs

```bash
cd /home/animesh/Code/Hackathon/cam-sportalytics/server
source .venv/bin/activate
./restart_server.sh
```

Watch for lines like:
```
Encoding image: shape=(...), mean=X.XX, min=Y, max=Z
```

### Test 2: Interpret the Output

| Mean Value | Min | Max | Diagnosis |
|------------|-----|-----|-----------|
| 0.00 | 0 | 0 | ❌ All black - Android issue |
| 127.5 | 0 | 255 | ✅ Normal image |
| 255.00 | 255 | 255 | ❌ All white - likely error |
| ~64 | 0 | 128 | ⚠️ Dark/underexposed image |

### Test 3: Check Image Size

| Base64 Size | Expected Resolution | Status |
|-------------|---------------------|--------|
| 2,000-5,000 | Very small (~100x100) | ⚠️ Too small |
| 20,000-40,000 | ~640x480 | ✅ Reasonable |
| 50,000-100,000 | ~1280x720 | ✅ Good |
| >150,000 | >1920x1080 or high quality | ✅ High quality |

## Possible Issues & Solutions

### Issue 1: mean=0, all black
**Problem:** Android not capturing camera frames  
**Fix in Android:**
- Check camera permissions
- Verify ARCore is tracking (`TrackingState.TRACKING`)
- Check if `sendRgbFrames = true` in StreamConfig
- Verify frame extraction is working

### Issue 2: Base64 size tiny (~2KB)
**Problem:** Wrong resolution or quality setting  
**Server shows:**
```
Encoding image: shape=(64, 48, 3), ... 
```
**Fix in Android:**
- Check ARCore camera resolution
- Increase JPEG quality in StreamConfig
- Verify image dimensions before encoding

### Issue 3: Image renders but all black
**Problem:** Browser display issue  
**Server shows:** Normal stats (mean ~127)
**Browser shows:** Black screen  
**Try:**
1. Open browser console and check for image load errors
2. Right-click black area > Inspect Element
3. Check if `<img>` src is set
4. Try downloading the image: Right-click > Save Image
5. Open saved image in image viewer

### Issue 4: Normal stats but still black
**Problem:** Image encoding/format issue  
**Check:**
```
first 50: /9j/4AAQSkZJRgABAQAAA...
```
- Should start with `/9j/` for JPEG
- If it starts differently, encoding might be wrong

## Quick Test

Once server restarts, look for these lines in order:

1. **Frame received:**
   ```
   RGB frame present: format=1, size=45678 bytes, 1280x720
   ```

2. **Frame decoded:**
   ```
   ✓ RGB JPEG decoded: shape=(720, 1280, 3), dtype=uint8
   ```

3. **Image stats:**
   ```
   Encoding image: shape=(720, 1280, 3), dtype=uint8, mean=127.42, min=0, max=255
   ```

4. **Encoded:**
   ```
   Encoded to base64: 61024 chars, first 50: /9j/4AAQSkZJRgABAQAA...
   ```

5. **Broadcast:**
   ```
   ✓ RGB encoded: 1280x720, base64 size=61024 chars
   ```

If ALL of these show up with normal values, the server is working correctly!

## Expected Output for Working System

```
2026-01-18 00:50:15 - INFO - RGB frame present: format=1, size=87234 bytes, 1280x720
2026-01-18 00:50:15 - INFO - ✓ RGB JPEG decoded: shape=(720, 1280, 3), dtype=uint8
2026-01-18 00:50:15 - INFO - Encoding image: shape=(720, 1280, 3), dtype=uint8, mean=128.35, min=2, max=254
2026-01-18 00:50:15 - INFO - Encoded to base64: 116312 chars, first 50: /9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgH...
2026-01-18 00:50:15 - INFO - ✓ RGB encoded: 1280x720, base64 size=116312 chars
```

**This would mean:** Server is working perfectly, issue is in browser display.

## Your Current Issue

You reported:
- `has_rgb: true` ✅  
- `rgb_size: 2436` ❌ (Too small!)
- Black screen ❌

**This suggests:** Tiny image or encoding issue. The new logs will show us:
1. What's the actual image resolution?
2. Is the mean value 0 (all black) or normal?
3. Is the encoding producing valid JPEG?

**Restart the server and share the new log output!** It will tell us exactly what's happening.
