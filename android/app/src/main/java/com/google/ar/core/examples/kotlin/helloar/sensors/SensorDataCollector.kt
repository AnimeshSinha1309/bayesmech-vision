package com.google.ar.core.examples.kotlin.helloar.sensors

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.util.Log
import ar_stream.ArStream
import java.util.concurrent.atomic.AtomicReference

/**
 * Collects real-time sensor data from Android motion sensors.
 * 
 * Manages listeners for:
 * - Accelerometer (linear acceleration including gravity)
 * - Gyroscope (angular velocity)
 * - Magnetometer (magnetic field)
 * - Gravity (gravity vector)
 * - Linear Acceleration (acceleration without gravity)
 * 
 * Thread-safe - sensor values are stored atomically and can be read from any thread.
 */
class SensorDataCollector(context: Context) : SensorEventListener {
    private val TAG = "SensorDataCollector"
    
    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    
    // Sensors
    private val accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    private val gyroscope = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE)
    private val magnetometer = sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)
    private val gravitySensor = sensorManager.getDefaultSensor(Sensor.TYPE_GRAVITY)
    private val linearAccelSensor = sensorManager.getDefaultSensor(Sensor.TYPE_LINEAR_ACCELERATION)
    
    // Atomic references for thread-safe access to sensor values
    private val acceleration = AtomicReference(FloatArray(3) { 0f })
    private val angularVelocity = AtomicReference(FloatArray(3) { 0f })
    private val magneticField = AtomicReference(FloatArray(3) { 0f })
    private val gravity = AtomicReference(FloatArray(3) { 0f })
    private val linearAcceleration = AtomicReference(FloatArray(3) { 0f })
    
    // Orientation (computed from accelerometer + magnetometer)
    private val rotationMatrix = FloatArray(9)
    private val orientationAngles = FloatArray(3)
    private val orientation = AtomicReference(FloatArray(4) { 0f }) // Quaternion
    
    private var isCollecting = false
    
    /**
     * Start collecting sensor data.
     * Registers listeners for all available sensors at SENSOR_DELAY_GAME rate (~50Hz).
     */
    fun startCollecting() {
        if (isCollecting) {
            Log.w(TAG, "Already collecting sensor data")
            return
        }
        
        var sensorsRegistered = 0
        
        // Register accelerometer
        if (accelerometer != null) {
            sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_GAME)
            sensorsRegistered++
            Log.i(TAG, "✓ Accelerometer registered")
        } else {
            Log.w(TAG, "✗ Accelerometer not available")
        }
        
        // Register gyroscope
        if (gyroscope != null) {
            sensorManager.registerListener(this, gyroscope, SensorManager.SENSOR_DELAY_GAME)
            sensorsRegistered++
            Log.i(TAG, "✓ Gyroscope registered")
        } else {
            Log.w(TAG, "✗ Gyroscope not available")
        }
        
        // Register magnetometer
        if (magnetometer != null) {
            sensorManager.registerListener(this, magnetometer, SensorManager.SENSOR_DELAY_GAME)
            sensorsRegistered++
            Log.i(TAG, "✓ Magnetometer registered")
        } else {
            Log.w(TAG, "✗ Magnetometer not available")
        }
        
        // Register gravity sensor
        if (gravitySensor != null) {
            sensorManager.registerListener(this, gravitySensor, SensorManager.SENSOR_DELAY_GAME)
            sensorsRegistered++
            Log.i(TAG, "✓ Gravity sensor registered")
        } else {
            Log.w(TAG, "✗ Gravity sensor not available")
        }
        
        // Register linear acceleration sensor
        if (linearAccelSensor != null) {
            sensorManager.registerListener(this, linearAccelSensor, SensorManager.SENSOR_DELAY_GAME)
            sensorsRegistered++
            Log.i(TAG, "✓ Linear acceleration sensor registered")
        } else {
            Log.w(TAG, "✗ Linear acceleration sensor not available")
        }
        
        isCollecting = true
        Log.i(TAG, "Started collecting from $sensorsRegistered sensors")
    }
    
    /**
     * Stop collecting sensor data.
     * Unregisters all sensor listeners.
     */
    fun stopCollecting() {
        if (!isCollecting) {
            return
        }
        
        sensorManager.unregisterListener(this)
        isCollecting = false
        Log.i(TAG, "Stopped collecting sensor data")
    }
    
    override fun onSensorChanged(event: SensorEvent) {
        when (event.sensor.type) {
            Sensor.TYPE_ACCELEROMETER -> {
                acceleration.set(event.values.clone())
                updateOrientation()
            }
            Sensor.TYPE_GYROSCOPE -> {
                angularVelocity.set(event.values.clone())
            }
            Sensor.TYPE_MAGNETIC_FIELD -> {
                magneticField.set(event.values.clone())
                updateOrientation()
            }
            Sensor.TYPE_GRAVITY -> {
                gravity.set(event.values.clone())
            }
            Sensor.TYPE_LINEAR_ACCELERATION -> {
                linearAcceleration.set(event.values.clone())
            }
        }
    }
    
    override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {
        // Log accuracy changes if needed
        if (accuracy == SensorManager.SENSOR_STATUS_UNRELIABLE) {
            Log.w(TAG, "Sensor ${sensor.name} accuracy is unreliable")
        }
    }
    
    /**
     * Compute orientation quaternion from accelerometer and magnetometer.
     * Uses rotation matrix computed from gravity and magnetic field vectors.
     */
    private fun updateOrientation() {
        val accel = acceleration.get()
        val mag = magneticField.get()
        
        if (accel.all { it == 0f } || mag.all { it == 0f }) {
            return  // Not enough data yet
        }
        
        // Get rotation matrix from accelerometer and magnetometer
        val success = SensorManager.getRotationMatrix(
            rotationMatrix, 
            null, 
            accel, 
            mag
        )
        
        if (success) {
            // Convert rotation matrix to quaternion
            val quat = rotationMatrixToQuaternion(rotationMatrix)
            orientation.set(quat)
        }
    }
    
    /**
     * Convert 3x3 rotation matrix to quaternion [x, y, z, w]
     */
    private fun rotationMatrixToQuaternion(matrix: FloatArray): FloatArray {
        val w = Math.sqrt((1.0 + matrix[0] + matrix[4] + matrix[8]) / 4.0).toFloat()
        val x = (matrix[7] - matrix[5]) / (4 * w)
        val y = (matrix[2] - matrix[6]) / (4 * w)
        val z = (matrix[3] - matrix[1]) / (4 * w)
        return floatArrayOf(x, y, z, w)
    }
    
    /**
     * Get current sensor data as protobuf MotionData message.
     * Thread-safe - can be called from any thread.
     */
    fun getCurrentMotionData(): ArStream.MotionData {
        val builder = ArStream.MotionData.newBuilder()
        
        // Linear acceleration (use linear accel sensor if available, otherwise raw accel)
        val linAccel = linearAcceleration.get()
        if (linAccel.any { it != 0f }) {
            builder.linearAcceleration = ArStream.Vector3.newBuilder()
                .setX(linAccel[0])
                .setY(linAccel[1])
                .setZ(linAccel[2])
                .build()
        }
        
        // Angular velocity (from gyroscope)
        val angVel = angularVelocity.get()
        if (angVel.any { it != 0f }) {
            builder.angularVelocity = ArStream.Vector3.newBuilder()
                .setX(angVel[0])
                .setY(angVel[1])
                .setZ(angVel[2])
                .build()
        }
        
        // Gravity vector
        val grav = gravity.get()
        if (grav.any { it != 0f }) {
            builder.gravity = ArStream.Vector3.newBuilder()
                .setX(grav[0])
                .setY(grav[1])
                .setZ(grav[2])
                .build()
        }
        
        // Orientation (quaternion)
        val orient = orientation.get()
        if (orient.any { it != 0f }) {
            builder.orientation = ArStream.Quaternion.newBuilder()
                .setX(orient[0])
                .setY(orient[1])
                .setZ(orient[2])
                .setW(orient[3])
                .build()
        }
        
        return builder.build()
    }
    
    /**
     * Get a human-readable summary of current sensor values for logging.
     */
    fun getSensorSummary(): String {
        val linAccel = linearAcceleration.get()
        val angVel = angularVelocity.get()
        val grav = gravity.get()
        
        return "Accel: [%.2f, %.2f, %.2f] m/s², Gyro: [%.2f, %.2f, %.2f] rad/s, Gravity: [%.2f, %.2f, %.2f] m/s²".format(
            linAccel[0], linAccel[1], linAccel[2],
            angVel[0], angVel[1], angVel[2],
            grav[0], grav[1], grav[2]
        )
    }
}
