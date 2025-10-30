<template>
  <div class="bg-surface-raised rounded-xl2 p-4 shadow-card">
    <h3 class="text-lg font-semibold text-text-base mb-4">Odds Trends</h3>
    <div class="h-64">
      <Bar 
        v-if="loaded && chartData.datasets.length > 0 && showChart"
        :data="chartData" 
        :options="chartOptions"
      />
      <div v-else class="flex items-center justify-center h-full text-text-muted">
        <p>Loading chart data...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  Scale
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import { useBetsStore } from '../stores/bets'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps<{
  raceId: string
}>()

const betsStore = useBetsStore()

// Only show chart in simulation mode
const showChart = computed(() => {
  return betsStore.showGame && betsStore.useSimulatedData
})

// Mock data for demonstration
const mockOddsData = ref<Record<string, { time: number; odds: number }[]>>({})
const loaded = ref(false)

// Initialize mock data
onMounted(() => {
  // Only initialize mock data if in simulation mode
  if (showChart.value) {
    // Simulate fetching odds history data
    setTimeout(() => {
      // Generate mock odds data for 4 runners
      const runners = ['Thunder Bay', 'Midnight Express', 'Desert Storm', 'Got Immunity']
      const startTime = Date.now() - 300000 // 5 minutes ago
      
      runners.forEach((runner, index) => {
        mockOddsData.value[runner] = []
        const baseOdds = [2.4, 3.4, 11.0, 6.0][index]
        
        // Generate 10 data points over 5 minutes
        for (let i = 0; i < 10; i++) {
          const time = startTime + (i * 30000) // 30 second intervals
          // Simulate odds fluctuations
          const fluctuation = (Math.random() - 0.5) * 0.5
          const odds = Math.max(1.1, baseOdds + fluctuation)
          
          mockOddsData.value[runner].push({
            time,
            odds: parseFloat(odds.toFixed(2))
          })
        }
      })
      
      loaded.value = true
    }, 1000)
  }
})

const chartData = computed(() => {
  if (!loaded.value) {
    return {
      labels: [],
      datasets: []
    }
  }
  
  // Get the latest odds for each runner
  const latestOdds: Record<string, number> = {}
  Object.keys(mockOddsData.value).forEach(runner => {
    const data = mockOddsData.value[runner]
    if (data.length > 0) {
      latestOdds[runner] = data[data.length - 1].odds
    }
  })
  
  // Sort runners by odds (lowest first)
  const sortedRunners = Object.keys(latestOdds).sort((a, b) => latestOdds[a] - latestOdds[b])
  
  return {
    labels: sortedRunners,
    datasets: [
      {
        label: 'Current Odds',
        backgroundColor: [
          'rgba(249, 115, 22, 0.7)', // brand-primary with opacity
          'rgba(15, 23, 42, 0.7)',   // brand-secondary with opacity
          'rgba(250, 204, 21, 0.7)', // brand-accent with opacity
          'rgba(22, 163, 74, 0.7)'   // success color with opacity
        ],
        borderColor: [
          'rgb(249, 115, 22)',
          'rgb(15, 23, 42)',
          'rgb(250, 204, 21)',
          'rgb(22, 163, 74)'
        ],
        borderWidth: 1,
        data: sortedRunners.map(runner => latestOdds[runner])
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#F8FAFC' // text-text-base
      }
    },
    tooltip: {
      backgroundColor: '#111827', // surface-raised
      titleColor: '#F8FAFC', // text-text-base
      bodyColor: '#F8FAFC', // text-text-base
      borderColor: '#F97316', // brand-primary
      borderWidth: 1
    }
  },
  scales: {
    x: {
      ticks: {
        color: '#94A3B8' // text-text-muted
      },
      grid: {
        color: 'rgba(148, 163, 184, 0.1)' // text-text-muted with opacity
      }
    },
    y: {
      ticks: {
        color: '#94A3B8', // text-text-muted
        callback: function(this: Scale, tickValue: string | number, index: number, ticks: any[]) {
          const numValue = typeof tickValue === 'string' ? parseFloat(tickValue) : tickValue
          return numValue.toFixed(2)
        }
      },
      grid: {
        color: 'rgba(148, 163, 184, 0.1)' // text-text-muted with opacity
      },
      title: {
        display: true,
        text: 'Decimal Odds',
        color: '#F8FAFC' // text-text-base
      }
    }
  }
}
</script>