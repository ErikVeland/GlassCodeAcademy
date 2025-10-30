import { ref, Ref, onUnmounted } from 'vue'

interface UseCountdownReturn {
  formattedTime: Ref<string>
  isStartingSoon: Ref<boolean>
  isInProgress: Ref<boolean>
  stop: () => void
}

/**
 * Composable for managing a countdown timer
 * Calculates time remaining and formats it as MM:SS
 */
export function useCountdown(startTimeMs: number): UseCountdownReturn {
  const formattedTime = ref('00:00')
  const isStartingSoon = ref(false)
  const isInProgress = ref(false)
  
  // Validate input
  if (typeof startTimeMs !== 'number' || isNaN(startTimeMs) || startTimeMs <= 0) {
    startTimeMs = Date.now() + 60000 // Default to 1 minute in the future if invalid
  }
  
  // Calculate initial values
  const now = Date.now()
  const timeDiff = startTimeMs - now
  
  // If race has already started or is about to start
  if (timeDiff <= 0) {
    // Race has started, show LIVE
    isInProgress.value = true
    formattedTime.value = 'LIVE'
  } else {
    // Format the time as MM:SS
    const minutes = Math.floor(timeDiff / 60000)
    const seconds = Math.floor((timeDiff % 60000) / 1000)
    formattedTime.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // Set up interval to update the countdown
  const intervalId = setInterval(() => {
    const now = Date.now()
    const timeDiff = startTimeMs - now
    
    // Validate timeDiff
    if (typeof timeDiff !== 'number' || isNaN(timeDiff)) {
      formattedTime.value = '00:00'
      return
    }
    
    // If race has already started
    if (timeDiff <= 0) {
      // Race has started, show LIVE and mark as in progress
      isInProgress.value = true
      formattedTime.value = 'LIVE'
      // Continue updating even after race starts to maintain proper status
      // Don't stop the interval
    } else {
      // Format the time as MM:SS (never show negative values)
      const minutes = Math.max(0, Math.floor(timeDiff / 60000))
      const seconds = Math.max(0, Math.floor((timeDiff % 60000) / 1000))
      
      // Prevent negative values
      if (minutes >= 0 && seconds >= 0) {
        formattedTime.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      } else {
        formattedTime.value = '00:00'
      }
      
      // If time is less than 10 seconds, show "Starting soon"
      if (minutes === 0 && seconds <= 10) {
        isStartingSoon.value = true
      } else {
        // Reset flags when counting down normally
        isStartingSoon.value = false
      }
      
      // Ensure not in progress when counting down
      isInProgress.value = false
    }
  }, 1000)

  // Function to stop the interval
  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId)
    }
  }

  // Clean up interval when component is unmounted
  onUnmounted(() => {
    stop()
  })

  return {
    formattedTime,
    isStartingSoon,
    isInProgress,
    stop
  }
}