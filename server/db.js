// server/db.js —— SQLite 数据库（sql.js 纯 JS 实现，无需编译）
const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, 'yuedu.db')

let db = null
let SQL = null

async function getDB() {
  if (db) return db
  SQL = await initSqlJs()
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }
  db.run('PRAGMA foreign_keys = ON')
  return db
}

function saveDB() {
  if (!db) return
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()))
}

// 辅助：执行 SELECT 返回对象数组
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql)
  if (params.length > 0) stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

// 辅助：执行 SELECT 返回单行
function queryOne(sql, params = []) {
  const rows = queryAll(sql, params)
  return rows.length > 0 ? rows[0] : null
}

// 辅助：执行 INSERT/UPDATE/DELETE
function run(sql, params = []) {
  db.run(sql, params)
  saveDB()
}

async function initDB() {
  await getDB()

  // 建表
  db.run(`
    CREATE TABLE IF NOT EXISTS spots (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, subtitle TEXT, category TEXT,
      coverImage TEXT, gallery TEXT, videoUrl TEXT, videoPoster TEXT,
      qrSceneId TEXT, location TEXT, description TEXT, detail TEXT,
      tips TEXT, audioUrl TEXT, duration INTEGER DEFAULT 10,
      sortOrder INTEGER DEFAULT 0, createdAt TEXT DEFAULT (datetime('now','localtime'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT, spotId TEXT, spotName TEXT,
      nickname TEXT DEFAULT '游客', content TEXT NOT NULL,
      rating INTEGER DEFAULT 5, createdAt TEXT DEFAULT (datetime('now','localtime'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS weather_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL,
      updatedAt TEXT DEFAULT (datetime('now','localtime'))
    )
  `)
  saveDB()

  // 种子数据
  const count = queryOne('SELECT COUNT(*) AS c FROM spots')
  if (count.c === 0) {
    console.log('📥 导入 6 个景点数据...')
    seedSpots()
    console.log('✅ 导入完成')
  }
}

function seedSpots() {
  const spots = [
    {id:'spot_001',name:'望岳台',subtitle:'远眺西岳华山的绝佳位置',category:'观景台',gallery:'["/images/spot_001_01.jpg","/images/spot_001_02.jpg","/images/spot_001_03.jpg"]',location:'{"lat":34.5432,"lng":110.2456,"address":"岳渎公园·望岳台"}',description:'望岳台位于岳渎公园制高点，海拔约680米。此处视野开阔，天气晴好时可清晰远眺西岳华山。',detail:'[{"title":"📖 名称由来","content":"望岳取自杜甫《望岳》诗意。站于此台，华山群峰尽收眼底。"},{"title":"🏔️ 地理特色","content":"望岳台地处秦岭北麓与渭河平原的交界地带。"},{"title":"📸 最佳观赏时间","content":"春秋两季为最佳。清晨日出，傍晚夕阳。"},{"title":"🎧 语音导览","content":"您可以看到正南方向约30公里处的华山主峰群。"}]',tips:'建议携带望远镜，早晚温差大请注意添衣。',duration:15,sortOrder:1,coverImage:'/images/spot_001_cover.jpg',videoUrl:'https://example.com/videos/spot_001.mp4',videoPoster:'/images/spot_001_poster.jpg',audioUrl:'https://example.com/audio/spot_001.mp3',qrSceneId:'spot_001'},
    {id:'spot_002',name:'三河交汇观景台',subtitle:'黄河、渭河、洛河三水交汇之地',category:'观景台',gallery:'["/images/spot_002_01.jpg","/images/spot_002_02.jpg"]',location:'{"lat":34.5512,"lng":110.2534,"address":"岳渎公园·三河交汇观景台"}',description:'这里是黄河、渭河、洛河三条大河的汇聚之处，形成三河汇流的壮观景象。',detail:'[{"title":"🌊 水文奇观","content":"三河交汇是黄河中游最壮观的水文景观之一，三色分明。"},{"title":"📜 历史意义","content":"三河交汇处自古以来就是兵家必争之地，潼关被誉为天下第一关。"},{"title":"🦅 生态环境","content":"湿地生态系统是重要的候鸟迁徙中转站。"},{"title":"🎧 语音导览","content":"黄河每年携带约16亿吨泥沙经过此处。"}]',tips:'雨后或汛期时水流更壮观，请注意安全。',duration:12,sortOrder:2,coverImage:'/images/spot_002_cover.jpg',videoUrl:'https://example.com/videos/spot_002.mp4',videoPoster:'/images/spot_002_poster.jpg',audioUrl:'https://example.com/audio/spot_002.mp3',qrSceneId:'spot_002'},
    {id:'spot_003',name:'黄河古栈道',subtitle:'千年古栈道，感受黄河文明',category:'人文遗迹',gallery:'["/images/spot_003_01.jpg","/images/spot_003_02.jpg"]',location:'{"lat":34.5487,"lng":110.261,"address":"岳渎公园·黄河古栈道"}',description:'黄河古栈道沿黄河西岸悬崖绝壁开凿，全长约3公里，始建于汉代。',detail:'[{"title":"🏗️ 工程奇迹","content":"古栈道是在黄河岸边陡峭的石灰岩崖壁上开凿出来的。"},{"title":"📜 历史沿革","content":"栈道始建于西汉时期，隋唐时期达到鼎盛。"},{"title":"🗿 摩崖石刻","content":"沿途有多处摩崖石刻，最著名的是黄河天险四个大字。"},{"title":"🎧 语音导览","content":"注意观察崖壁上的方形凿孔——这些是汉代栈道的原始遗迹。"}]',tips:'栈道部分路段较窄，请注意脚下安全。',duration:18,sortOrder:3,coverImage:'/images/spot_003_cover.jpg',videoUrl:'https://example.com/videos/spot_003.mp4',videoPoster:'/images/spot_003_poster.jpg',audioUrl:'https://example.com/audio/spot_003.mp3',qrSceneId:'spot_003'},
    {id:'spot_004',name:'岳渎阁',subtitle:'登阁览胜，品读山水诗意',category:'建筑',gallery:'["/images/spot_004_01.jpg","/images/spot_004_02.jpg"]',location:'{"lat":34.5465,"lng":110.2489,"address":"岳渎公园·岳渎阁"}',description:'岳渎阁是公园的标志性建筑，高约36米，共五层。寓意山河交汇、天地交融。',detail:'[{"title":"🏯 建筑风格","content":"岳渎阁采用仿唐建筑风格，重檐歇山顶。"},{"title":"🎨 文化内涵","content":"每层陈列不同的文化主题，五层为360度观景平台。"},{"title":"🔭 景观视野","content":"北望黄河，西观秦岭，南览华山，东见中原。"},{"title":"🎧 语音导览","content":"这是整个公园最佳的360度全景拍摄点。"}]',tips:'阁内有电梯直达五层，日落时分登阁景色最美。',duration:20,sortOrder:4,coverImage:'/images/spot_004_cover.jpg',videoUrl:'https://example.com/videos/spot_004.mp4',videoPoster:'/images/spot_004_poster.jpg',audioUrl:'https://example.com/audio/spot_004.mp3',qrSceneId:'spot_004'},
    {id:'spot_005',name:'潼关古城遗址',subtitle:'天下第一关的历史回响',category:'历史遗迹',gallery:'["/images/spot_005_01.jpg","/images/spot_005_02.jpg","/images/spot_005_03.jpg"]',location:'{"lat":34.553,"lng":110.258,"address":"岳渎公园·潼关古城遗址"}',description:'潼关古城始建于东汉，距今已有1800多年历史。现存遗址包括城墙残段、城门基址和烽火台。',detail:'[{"title":"⚔️ 军事要塞","content":"潼关扼守关中与中原的咽喉要道，历代著名战役超过百次。"},{"title":"🏛️ 考古发现","content":"出土了大量兵器、钱币、陶瓷器等文物。"},{"title":"🧱 城墙遗迹","content":"现存城墙残段长约500米，最高处约8米。"},{"title":"🎧 语音导览","content":"不同颜色的夯土层代表不同朝代。"}]',tips:'遗址区域地面不平，请穿舒适的平底鞋。',duration:25,sortOrder:5,coverImage:'/images/spot_005_cover.jpg',videoUrl:'https://example.com/videos/spot_005.mp4',videoPoster:'/images/spot_005_poster.jpg',audioUrl:'https://example.com/audio/spot_005.mp3',qrSceneId:'spot_005'},
    {id:'spot_006',name:'落日崖',subtitle:'黄河落日的最佳观赏地',category:'自然景观',gallery:'["/images/spot_006_01.jpg","/images/spot_006_02.jpg"]',location:'{"lat":34.5448,"lng":110.2501,"address":"岳渎公园·落日崖"}',description:'落日崖是一处天然的观景岩台，伸出崖壁约15米。当红日沉入黄河西岸时，整个河谷被染成金色。',detail:'[{"title":"🌅 日落奇观","content":"日落时分阳光穿过河谷水汽，形成绚丽的丁达尔效应。"},{"title":"🌿 崖壁生态","content":"崖壁上生长着多种耐旱植物，栖息着岩鸽和红隼。"},{"title":"📷 摄影指南","content":"最佳拍摄机位在崖台左侧第三块岩石上。"},{"title":"🎧 语音导览","content":"脚下是深约80米的峡谷，前方是黄河河谷。"}]',tips:'崖台风大，注意保暖和手机安全。提前30分钟到达占位。',duration:10,sortOrder:6,coverImage:'/images/spot_006_cover.jpg',videoUrl:'https://example.com/videos/spot_006.mp4',videoPoster:'/images/spot_006_poster.jpg',audioUrl:'https://example.com/audio/spot_006.mp3',qrSceneId:'spot_006'}
  ]
  const stmt = db.prepare('INSERT INTO spots (id,name,subtitle,category,coverImage,gallery,videoUrl,videoPoster,qrSceneId,location,description,detail,tips,audioUrl,duration,sortOrder) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
  for (const s of spots) {
    stmt.run([s.id,s.name,s.subtitle,s.category,s.coverImage,s.gallery,s.videoUrl,s.videoPoster,s.qrSceneId,s.location,s.description,s.detail,s.tips,s.audioUrl,s.duration,s.sortOrder])
    stmt.reset()
  }
  stmt.free()
  saveDB()
}

module.exports = { getDB, initDB, queryAll, queryOne, run }
