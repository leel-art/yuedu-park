// 云函数：获取景区天气
// 对接 Open-Meteo 免费天气 API（无需 API Key）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 天气代码映射
const WEATHER_MAP = {
  0:'☀️ 晴天', 1:'🌤️ 大部晴', 2:'⛅ 多云', 3:'☁️ 阴天',
  45:'🌫️ 雾', 48:'🌫️ 雾凇',
  51:'🌦️ 小雨', 53:'🌧️ 中雨', 55:'🌧️ 大雨',
  61:'🌦️ 小雨', 63:'🌧️ 中雨', 65:'⛈️ 暴雨',
  71:'🌨️ 小雪', 73:'🌨️ 中雪', 75:'❄️ 大雪', 77:'🌨️ 雪粒',
  80:'🌦️ 阵雨', 81:'🌧️ 中阵雨', 82:'⛈️ 大阵雨',
  85:'🌨️ 小阵雪', 86:'❄️ 大阵雪',
  95:'⛈️ 雷暴', 96:'⛈️ 冰雹雷暴', 99:'⛈️ 强冰雹雷暴'
}

// 岳渎公园坐标
const LAT = 34.54
const LNG = 110.25

exports.main = async (event) => {
  try {
    // 先查缓存（1小时有效）
    const now = Date.now()
    const cached = await db.collection('weather_cache')
      .where({ expireAt: db.command.gt(now) })
      .orderBy('updatedAt', 'desc')
      .limit(1)
      .get()

    if (cached.data.length > 0) {
      console.log('[天气] 返回缓存')
      return { success: true, data: cached.data[0].weatherData, cached: true }
    }

    // 调 Open-Meteo API
    const result = await cloud.callFunction({
      name: 'getWeather',
      data: { _raw: true }  // 避免递归
    }).catch(() => null)

    // 直接在云函数中用 HTTP 调用
    const https = require('https')
    const weatherData = await new Promise((resolve, reject) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LNG}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=Asia/Shanghai&forecast_days=3`
      https.get(url, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          try { resolve(JSON.parse(data)) }
          catch (e) { reject(e) }
        })
      }).on('error', reject)
    })

    // 格式化
    const current = weatherData.current
    const daily = weatherData.daily
    const weather = {
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      weatherIcon: WEATHER_MAP[current.weather_code]?.split(' ')[0] || '🌤️',
      weatherDesc: WEATHER_MAP[current.weather_code]?.split(' ').slice(1).join(' ') || '未知',
      forecast: daily.time.map((date, i) => ({
        date,
        icon: WEATHER_MAP[daily.weather_code[i]]?.split(' ')[0] || '🌤️',
        desc: WEATHER_MAP[daily.weather_code[i]]?.split(' ').slice(1).join(' ') || '未知',
        tempMax: daily.temperature_2m_max[i],
        tempMin: daily.temperature_2m_min[i],
        sunrise: daily.sunrise ? daily.sunrise[i]?.slice(11, 16) : null,
        sunset: daily.sunset ? daily.sunset[i]?.slice(11, 16) : null
      })),
      updatedAt: new Date().toLocaleString('zh-CN')
    }

    // 写缓存
    await db.collection('weather_cache').add({
      data: {
        weatherData: weather,
        updatedAt: now,
        expireAt: now + 3600000 // 1小时后过期
      }
    })

    return { success: true, data: weather, cached: false }
  } catch (err) {
    console.error('[天气] 获取失败:', err)
    return { success: false, error: err.message, data: null }
  }
}
