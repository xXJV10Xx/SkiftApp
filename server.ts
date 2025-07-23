import cors from 'cors'
import express from 'express'
import fs from 'fs'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())

// Load the scraped data
let data: any[] = []
try {
  data = JSON.parse(fs.readFileSync('./skiftscheman_alla_företag_2020_2030.json', 'utf-8'))
  console.log(`📁 Loaded ${data.length} shift schedules`)
} catch (error) {
  console.log('⚠️ No scraped data found, starting with empty data')
}

app.get('/api/scheman', (req, res) => {
  res.json(data)
})

app.get('/api/scheman/:företag', (req, res) => {
  const företag = req.params.företag.toUpperCase()
  const filtered = data.filter((item: any) => item.företag === företag)
  res.json(filtered)
})

app.get('/api/scheman/:företag/:skiftlag', (req, res) => {
  const företag = req.params.företag.toUpperCase()
  const skiftlag = req.params.skiftlag.toLowerCase()
  const filtered = data.filter(
    (item: any) =>
      item.företag === företag &&
      item.skiftlag.toLowerCase().includes(skiftlag)
  )
  res.json(filtered)
})

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Skiftschema API is running',
    timestamp: new Date().toISOString(),
    totalSchedules: data.length
  })
})

app.get('/', (req, res) => {
  res.json({
    message: 'Skiftschema API',
    version: '1.0.0',
    endpoints: {
      'GET /api/scheman': 'Get all schedules',
      'GET /api/scheman/:företag': 'Get schedules by company',
      'GET /api/scheman/:företag/:skiftlag': 'Get schedules by company and team',
      'GET /api/health': 'Health check'
    }
  })
})

app.listen(PORT, () => {
  console.log(`🚀 API igång på http://localhost:${PORT}`)
  console.log(`📊 Loaded ${data.length} shift schedules`)
}) 