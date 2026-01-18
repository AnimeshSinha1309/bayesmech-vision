# ✅ Depth Map Streaming Enabled!

## Changes Made

### 1. **Enabled Depth in Config** (`HelloArActivity.kt`)
```kotlin
sendDepthFrames = true,  // ✅ ENABLED
```

### 2. **Added Depth Extraction** (`CameraDataExtractor.kt`)
Added `extractDepthFrame()` function that:
- Acquires 16-bit depth image from ARCore
- Optionally downsamples the depth map (configurable scale)
- Converts to byte array for protobuf transmission
- Returns null if depth is not available (graceful degradation)

**Key features:**
- Uses `frame.acquireDepthImage16Bits()` 
- Depth values are 16-bit unsigned integers in **millimeters**
- Supports downsampling to reduce bandwidth
- Properly closes image to avoid memory leaks
- Sets min/max depth range (0.1m - 5.0m typical for ARCore)

### 3. **Enabled Depth in ARDataCapture** (`ARDataCapture.kt`)
```kotlin
// Add depth frame if enabled
if (currentQuality.sendDepth && config.sendDepthFrames) {
    val depthFrame = CameraDataExtractor.extractDepthFrame(frame, currentQuality.depthScale)
    if (depthFrame != null) {
        builder.depthFrame = depthFrame
    }
}
```

## How Depth Data Works

### **Android Side:**
1. ARCore generates depth map using camera + motion tracking
2. `frame.acquireDepthImage16Bits()` gets the depth image
3. Depth values are **16-bit unsigned integers** in **millimeters**
4. Data is optionally downsampled (default scale=1, no downsampling)
5. Converted to byte array and sent via protobuf

### **Server Side:**
Server already has code to:
1. Decode depth protobuf data
2. Convert 16-bit depth to numpy array  
3. Encode to PNG for dashboard display
4. Broadcast via WebSocket

### **Dashboard:**
- Displays depth as grayscale/colorized image
- Shows depth statistics (min/max/mean)
- Toggleable visualization

## Depth Format Details

**Data Format:**
- **Type:** 16-bit unsigned integers (uint16)
- **Units:** Millimeters (mm)
- **Range:** Typically 100mm (0.1m) to 5000mm (5.0m)
- **Layout:** Row-major, width × height array

**Example depth values:**
- `500` = 0.5 meters
- `1000` = 1.0 meter
- `2500` = 2.5 meters

**Downsampling:**
- `depthScale = 1`: Full resolution (e.g., 160×120)
- `depthScale = 2`: Half resolution (e.g., 80×60)
- Reduces bandwidth but loses detail

## Testing

**Rebuild the app:**
```bash
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

**Check Android logs:**
```bash
adb logcat | grep ARDataCapture
```

**You should see:**
```
D/ARDataCapture: Sent frame 30, quality: HIGH, bandwidth: 2.45 Mbps
```

**Server logs should show:**
```
INFO: Depth frame received: 160x120, size=38400 bytes
INFO: Depth range: min=0.35m, max=4.82m, mean=1.56m
```

**Dashboard should display:**
- RGB camera feed (left)
- Depth map visualization (right) ← **NEW!**
- Depth statistics

## Notes

1. **Depth availability:** Not all frames have depth data
   - ARCore needs to initialize depth tracking
   - Some devices don't support depth
   - Code gracefully handles missing depth (returns null)

2. **Bandwidth:** Depth adds ~38KB per frame (160×120×2 bytes)
   - At 20 FPS: ~6 Mbps additional bandwidth
   - Adaptive quality will reduce FPS if needed

3. **Quality levels:** Different quality levels send depth at different scales
   - HIGH: Full depth resolution
   - MEDIUM: 2x downsampled  
   - LOW: May skip depth entirely

## Summary

✅ **Android:** Depth extraction implemented  
✅ **Server:** Already has depth handling  
✅ **Dashboard:** Already has depth display  
🎯 **Result:** Full RGB + Depth streaming pipeline!

**Rebuild the app and test!** You should now see both camera and depth streams on the dashboard! 📷🗺️
