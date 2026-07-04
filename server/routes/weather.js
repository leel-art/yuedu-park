// server/routes/weather.js —— 天气 API（Open-Meteo 免费接口）
const express = require('express')
const router = express.Router()
const { queryAll, queryOne, run } = require('../db')
const https = require('https')

const LAT = 34.54, LNG = 110.25
const WEATHER_CODES = {
  0:{desc:'晴天',icon:'☀️'},1:{desc:'大部晴',icon:'🌤️'},2:{desc:'多云',icon:'⛅'},3:{desc:'阴天',icon:'☁️'},
  45:{desc:'雾',icon:'🌫️'},48:{desc:'雾凇',icon:'🌫️'},
  51:{desc:'小雨',icon:'🌦️'},53:{desc:'中雨',icon:'🌧️'},55:{desc:'大雨',icon:'🌧️'},
  61:{desc:'小雨',icon:'🌦️'},63:{desc:'中雨',icon:'🌧️'},65:{desc:'暴雨',icon:'⛈️'},
  71:{desc:'小雪',icon:'🌨️'},73:{desc:'中雪',icon:'🌨️'},75:{desc:'大雪',icon:'❄️'},77:{desc:'雪粒',icon:'🌨️'},
  80:{desc:'阵雨',icon:'🌦️'},81:{desc:'中阵雨',icon:'🌧️'},82:{desc:'大阵雨',icon:'⛈️'},
  85:{desc:'小阵雪',icon:'🌨️'},86:{desc:'大阵雪',icon:'❄️'},
  95:{desc:'雷暴',icon:'⛈️'},96:{desc:'冰雹雷暴',icon:'⛈️'},99:{desc:'强冰雹雷暴',icon:'⛈️'}
}

function windDir(deg){ return ['北','东北','东','东南','南','西南','西','西北'][Math.round(deg/45)%8] }

function fetchWeatherAPI() {
  return new Promise((resolve, reject) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LNG}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=Asia/Shanghai&forecast_days=3`
    https.get(url, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch(e) { reject(e) }
      })
    }).on('error', reject)
  })
}

router.get('/', async (req, res) => {
  try {
    // 查缓存（1小时内）
    const cached = queryOne("SELECT * FROM weather_cache WHERE updatedAt > datetime('now','-1 hour','localtime') ORDER BY updatedAt DESC LIMIT 1")
    if (cached) return res.json({ success: true, data: JSON.parse(cached.data), cached: true })

    const raw = await fetchWeatherAPI()
    const cur = raw.current, day = raw.daily
    const weather = {
      location: { lat: LAT, lng: LNG, name: '岳渎公园·潼关' },
      current: {
        temperature: cur.temperature_2m, humidity: cur.relative_humidity_2m,
        windSpeed: cur.wind_speed_10m, windDirection: windDir(cur.wind_direction_10m),
        weatherCode: cur.weather_code,
        weatherDesc: WEATHER_CODES[cur.weather_code]?.desc||'未知',
        weatherIcon: WEATHER_CODES[cur.weather_code]?.icon||'🌤️'
      },
      forecast: day.time.map((date, i) => ({
        date, weatherCode: day.weather_code[i],
        weatherDesc: WEATHER_CODES[day.weather_code[i]]?.desc||'未知',
        weatherIcon: WEATHER_CODES[day.weather_code[i]]?.icon||'🌤️',
        tempMax: day.temperature_2m_max[i], tempMin: day.temperature_2m_min[i],
        sunrise: day.sunrise?.[i]?.slice(11,16), sunset: day.sunset?.[i]?.slice(11,16)
      })),
      updatedAt: new Date().toLocaleString('zh-CN')
    }

    run("DELETE FROM weather_cache")
    run("INSERT INTO weather_cache (data) VALUES (?)", [JSON.stringify(weather)])
    res.json({ success: true, data: weather, cached: false })
  } catch (err) {
    const old = queryOne("SELECT * FROM weather_cache ORDER BY updatedAt DESC LIMIT 1")
    if (old) return res.json({ success: true, data: JSON.parse(old.data), cached: true, stale: true })
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
