package com.bayesmech.camalytics

import android.content.Context
import android.graphics.Color
import android.util.AttributeSet
import android.view.Gravity
import android.view.View
import android.widget.LinearLayout
import android.widget.TextView
import androidx.cardview.widget.CardView
import com.bayesmech.camalytics.network.ConnectionStatus
import java.text.SimpleDateFormat
import java.util.*

/**
 * Custom view displaying WebSocket connection status at the bottom of the screen.
 * Shows persistent debugging information when connection fails.
 */
class ConnectionStatusView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : CardView(context, attrs, defStyleAttr) {

    private val containerLayout: LinearLayout
    private val statusIndicator: View
    private val statusText: TextView
    private val detailsText: TextView
    private val dateFormat = SimpleDateFormat("HH:mm:ss", Locale.getDefault())

    init {
        // CardView styling
        radius = 12f
        cardElevation = 8f
        setCardBackgroundColor(Color.parseColor("#CC000000")) // Semi-transparent black
        
        // Container layout
        containerLayout = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(24, 16, 24, 16)
            gravity = Gravity.CENTER_VERTICAL
        }
        
        // Status indicator (colored circle)
        statusIndicator = View(context).apply {
            layoutParams = LinearLayout.LayoutParams(24, 24).apply {
                marginEnd = 16
            }
            background = context.getDrawable(android.R.drawable.presence_busy) // Red by default
        }
        
        // Text container
        val textContainer = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }
        
        // Status text (main line)
        statusText = TextView(context).apply {
            textSize = 14f
            setTextColor(Color.WHITE)
            text = context.getString(R.string.connection_status_connecting)
        }
        
        // Details text (secondary line)
        detailsText = TextView(context).apply {
            textSize = 11f
            setTextColor(Color.parseColor("#CCCCCC"))
            text = context.getString(R.string.connection_status_initializing)
        }
        
        textContainer.addView(statusText)
        textContainer.addView(detailsText)
        
        containerLayout.addView(statusIndicator)
        containerLayout.addView(textContainer)
        
        addView(containerLayout)
    }
    
    fun updateStatus(status: ConnectionStatus) {
        post {
            if (status.isConnected) {
                // Connected - show green indicator
                statusIndicator.background = context.getDrawable(android.R.drawable.presence_online)
                statusText.text = context.getString(R.string.connection_status_connected)
                detailsText.text = context.getString(R.string.connection_status_streaming, status.serverUrl)
                
                // Hide the view after 3 seconds when connected
                visibility = View.VISIBLE
                postDelayed({ 
                    visibility = View.GONE 
                }, 3000)
            } else if (status.isRetrying) {
                // Retrying connection - show orange/yellow indicator
                statusIndicator.background = context.getDrawable(android.R.drawable.presence_away)
                statusText.text = context.getString(R.string.connection_status_reconnecting, status.retryCount)
                
                val retryInfo = if (status.nextRetryInMs != null && status.nextRetryInMs < 1000) {
                    context.getString(R.string.connection_retry_milliseconds, status.nextRetryInMs)
                } else if (status.nextRetryInMs != null) {
                    context.getString(R.string.connection_retry_seconds, status.nextRetryInMs / 1000)
                } else {
                    context.getString(R.string.connection_retry_now)
                }
                
                var details = status.lastError ?: context.getString(R.string.connection_lost)
                details += " • $retryInfo"
                
                detailsText.text = details
                visibility = View.VISIBLE
            } else if (status.lastError != null) {
                // Connection failed - show persistent error
                statusIndicator.background = context.getDrawable(android.R.drawable.presence_busy)
                
                if (status.retryCount > 0) {
                    statusText.text = context.getString(R.string.connection_status_failed_with_retries, status.retryCount)
                } else {
                    statusText.text = context.getString(R.string.connection_status_failed)
                }
                
                val timeStr = status.lastErrorTime?.let { 
                    dateFormat.format(Date(it)) 
                } ?: ""
                
                var details = status.lastError
                if (status.connectionAttempts > 1) {
                    details += " • Attempt #${status.connectionAttempts}"
                }
                if (timeStr.isNotEmpty()) {
                    details += " • $timeStr"
                }
                
                detailsText.text = details
                visibility = View.VISIBLE
            } else {
                // Connecting
                statusIndicator.background = context.getDrawable(android.R.drawable.presence_away)
                statusText.text = context.getString(R.string.connection_status_connecting_to_server)
                detailsText.text = status.serverUrl
                visibility = View.VISIBLE
            }
        }
    }
    
    fun showDebugInfo(info: String) {
        post {
            detailsText.text = info
        }
    }
}
