package com.bayesmech.camalytics.sensors

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.util.Log
import com.bayesmech.vision.ImuData
import com.bayesmech.vision.Vector3
import java.util.concurrent.atomic.AtomicReference

/**
 * Collects real-time sensor data from Android motion sensors.
 *
 * Manages listeners for:
 * - Gyroscope (angular velocity)
 * - Gravity (gravity vector, OS-fused)
 * - Linear Acceleration (acceleration without gravity, OS-fused)
 * - Magnetometer (raw magnetic field, for server-side orientation fusion)
 *
 * Thread-safe - sensor values are stored atomically and can be read from any thread.
 */
class SensorDataCollector(context: Context) : SensorEventListener {
    private val TAG = "SensorDataCollector"

    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager

    // Sensors
    private val gyroscope = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE)
    private val magnetometer = sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)
    private val gravitySensor = sensorManager.getDefaultSensor(Sensor.TYPE_GRAVITY)
    private val linearAccelSensor = sensorManager.getDefaultSensor(Sensor.TYPE_LINEAR_ACCELERATION)

    // Atomic references for thread-safe access
    private val angularVelocity = AtomicReference(FloatArray(3) { 0f })
    private val magneticField = AtomicReference(FloatArray(3) { 0f })
    private val gravity = AtomicReference(FloatArray(3) { 0f })
    private val linearAcceleration = AtomicReference(FloatArray(3) { 0f })

    private var isCollecting = false

    /**
     * Start collecting sensor data.
     * Registers listeners at SENSOR_DELAY_GAME rate (~50Hz).
     */
    fun startCollecting() {
        if (isCollecting) {
            Log.w(TAG, "Already collecting sensor data")
            return
        }

        var sensorsRegistered = 0

        if (gyroscope != null) {
            sensorManager.registerListener(this, gyroscope, SensorManager.SENSOR_DELAY_GAME)
            sensorsRegistered++
            Log.i(TAG, "✓ Gyroscope registered")
        } else {
            Log.w(TAG, "✗ Gyroscope not available")
        }

        if (magnetometer != null) {
            sensorManager.registerListener(this, magnetometer, SensorManager.SENSOR_DELAY_GAME)
            sensorsRegistered++
            Log.i(TAG, "✓ Magnetometer registered")
        } else {
            Log.w(TAG, "✗ Magnetometer not available")
        }

        if (gravitySensor != null) {
            sensorManager.registerListener(this, gravitySensor, SensorManager.SENSOR_DELAY_GAME)
            sensorsRegistered++
            Log.i(TAG, "✓ Gravity sensor registered")
        } else {
            Log.w(TAG, "✗ Gravity sensor not available")
        }

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
     */
    fun stopCollecting() {
        if (!isCollecting) return
        sensorManager.unregisterListener(this)
        isCollecting = false
        Log.i(TAG, "Stopped collecting sensor data")
    }

    override fun onSensorChanged(event: SensorEvent) {
        when (event.sensor.type) {
            Sensor.TYPE_GYROSCOPE -> angularVelocity.set(event.values.clone())
            Sensor.TYPE_MAGNETIC_FIELD -> magneticField.set(event.values.clone())
            Sensor.TYPE_GRAVITY -> gravity.set(event.values.clone())
            Sensor.TYPE_LINEAR_ACCELERATION -> linearAcceleration.set(event.values.clone())
        }
    }

    override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {
        if (accuracy == SensorManager.SENSOR_STATUS_UNRELIABLE) {
            Log.w(TAG, "Sensor ${sensor.name} accuracy is unreliable")
        }
    }

    /**
     * Get current sensor data as ImuData protobuf message.
     * Thread-safe - can be called from any thread.
     */
    fun getCurrentImuData(): ImuData {
        val builder = ImuData.newBuilder()

        val angVel = angularVelocity.get()
        if (angVel.any { it != 0f }) {
            builder.angularVelocity = Vector3.newBuilder()
                .setX(angVel[0]).setY(angVel[1]).setZ(angVel[2]).build()
        }

        val linAccel = linearAcceleration.get()
        if (linAccel.any { it != 0f }) {
            builder.linearAcceleration = Vector3.newBuilder()
                .setX(linAccel[0]).setY(linAccel[1]).setZ(linAccel[2]).build()
        }

        val grav = gravity.get()
        if (grav.any { it != 0f }) {
            builder.gravity = Vector3.newBuilder()
                .setX(grav[0]).setY(grav[1]).setZ(grav[2]).build()
        }

        val mag = magneticField.get()
        if (mag.any { it != 0f }) {
            builder.magneticField = Vector3.newBuilder()
                .setX(mag[0]).setY(mag[1]).setZ(mag[2]).build()
        }

        return builder.build()
    }

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
