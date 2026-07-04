// 云函数：一键导入景点初始数据到云数据库
// 使用方法：在微信开发者工具中右键此云函数 → 上传并部署 → 云端测试运行
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// =====================================================
// 6 个景点的完整数据
// =====================================================
const spotsData = [
  {
    id: 'spot_001',
    name: '望岳台',
    subtitle: '远眺西岳华山的绝佳位置',
    category: '观景台',
    coverImage: '/images/spot_001_cover.jpg',
    gallery: ['/images/spot_001_01.jpg', '/images/spot_001_02.jpg', '/images/spot_001_03.jpg'],
    videoUrl: 'https://example.com/videos/spot_001.mp4',
    videoPoster: '/images/spot_001_poster.jpg',
    qrSceneId: 'spot_001',
    location: {
      lat: 34.5432,
      lng: 110.2456,
      address: '岳渎公园·望岳台'
    },
    description: '望岳台位于岳渎公园制高点，海拔约680米。此处视野开阔，天气晴好时可清晰远眺西岳华山（海拔2154米）的巍峨轮廓，是摄影爱好者和登山游客必到的打卡点。',
    detail: [
      { title: '📖 名称由来', content: '"望岳"取自杜甫《望岳》诗意——"岱宗夫如何，齐鲁青未了"。站于此台，华山群峰尽收眼底，故得名"望岳台"。' },
      { title: '🏔️ 地理特色', content: '望岳台地处秦岭北麓与渭河平原的交界地带，是秦岭造山带与华北地台的接触带。远望华山，可见其花岗岩峰林地貌的壮丽景观，五座主峰如莲花般绽放。' },
      { title: '📸 最佳观赏时间', content: '春秋两季为最佳。清晨日出时分，华山东峰沐浴在金色晨光中；傍晚夕阳西下，群峰染上暖橙色余晖。雨后初晴时可见云海翻涌于山间。' },
      { title: '🎧 语音导览', content: '站在望岳台上，您可以看到正南方向约30公里处的华山主峰群。从左至右依次为：北峰（云台峰）、中峰（玉女峰）、东峰（朝阳峰）、南峰（落雁峰）、西峰（莲花峰）。其中南峰是华山最高峰，也是五岳中的最高点。' }
    ],
    tips: '建议携带望远镜或长焦镜头，早晚温差较大请注意添衣。',
    audioUrl: 'https://example.com/audio/spot_001.mp3',
    duration: 15,
    sortOrder: 1
  },
  {
    id: 'spot_002',
    name: '三河交汇观景台',
    subtitle: '黄河、渭河、洛河三水交汇之地',
    category: '观景台',
    coverImage: '/images/spot_002_cover.jpg',
    gallery: ['/images/spot_002_01.jpg', '/images/spot_002_02.jpg'],
    videoUrl: 'https://example.com/videos/spot_002.mp4',
    videoPoster: '/images/spot_002_poster.jpg',
    qrSceneId: 'spot_002',
    location: {
      lat: 34.5512,
      lng: 110.2534,
      address: '岳渎公园·三河交汇观景台'
    },
    description: '这里是黄河、渭河、洛河三条大河的汇聚之处。站在观景台上，可见黄河自北而来，渭河自西而来，洛河自南而来，三水在此相交，形成"三河汇流"的壮观景象。',
    detail: [
      { title: '🌊 水文奇观', content: '三河交汇是黄河中游最壮观的水文景观之一。黄河水浑浊如金，渭河水清澈如碧，洛河水则介于两者之间。三色水流交汇时，形成了独特的"泾渭分明"升级版——"三色分明"的奇景。' },
      { title: '📜 历史意义', content: '三河交汇处自古以来就是兵家必争之地。潼关因地处三河交汇的咽喉要道，被誉为"天下第一关"。历代王朝在此设关驻守，见证了无数历史风云。' },
      { title: '🦅 生态环境', content: '三河交汇形成的湿地生态系统是重要的候鸟迁徙中转站。每年春秋两季，大量候鸟在此栖息觅食，是观鸟爱好者的天堂。常见鸟类包括白鹭、灰鹤、大雁等。' },
      { title: '🎧 语音导览', content: '您现在看到的是中国第二大河流黄河与其两大支流的交汇处。黄河每年携带约16亿吨泥沙经过此处，渭河和洛河的汇入对黄河水量有显著的调节作用。前方可见的是一座明代修建的古渡口遗址。' }
    ],
    tips: '雨后或汛期时水流更壮观，但请注意安全，勿翻越护栏。',
    audioUrl: 'https://example.com/audio/spot_002.mp3',
    duration: 12,
    sortOrder: 2
  },
  {
    id: 'spot_003',
    name: '黄河古栈道',
    subtitle: '千年古栈道，感受黄河文明',
    category: '人文遗迹',
    coverImage: '/images/spot_003_cover.jpg',
    gallery: ['/images/spot_003_01.jpg', '/images/spot_003_02.jpg'],
    videoUrl: 'https://example.com/videos/spot_003.mp4',
    videoPoster: '/images/spot_003_poster.jpg',
    qrSceneId: 'spot_003',
    location: {
      lat: 34.5487,
      lng: 110.2610,
      address: '岳渎公园·黄河古栈道'
    },
    description: '黄河古栈道沿黄河西岸悬崖绝壁开凿，全长约3公里，始建于汉代，距今已有两千余年历史。走在古栈道上，脚下是奔腾的黄河水，两侧是陡峭的峡谷绝壁。',
    detail: [
      { title: '🏗️ 工程奇迹', content: '古栈道是在黄河岸边陡峭的石灰岩崖壁上开凿出来的。古人使用简单的铁锤和凿子，在近百米高的悬崖上凿出宽约1.5米的通道。栈道上有凿孔遗迹，原用于插入横木铺设木板。' },
      { title: '📜 历史沿革', content: '栈道始建于西汉时期，最初用于军事运输和商贸往来。隋唐时期达到鼎盛，是连接关中与中原的重要通道。明清时期逐渐废弃，但崖壁上的凿痕和石刻依然清晰可见。' },
      { title: '🗿 摩崖石刻', content: '栈道沿途有多处摩崖石刻，最早可追溯到唐代。其中最著名的是"黄河天险"四个大字，据传为明代所刻。沿途还有多处佛像石刻和诗词题记。' },
      { title: '🎧 语音导览', content: '您现在行走的这段栈道是保存最完好的部分，长约800米。请注意观察崖壁上的方形凿孔——这些是汉代栈道的原始遗迹。前方约200米处有一处唐代摩崖石刻，刻有"天河"二字。' }
    ],
    tips: '栈道部分路段较窄，请注意脚下安全，建议穿防滑鞋。',
    audioUrl: 'https://example.com/audio/spot_003.mp3',
    duration: 18,
    sortOrder: 3
  },
  {
    id: 'spot_004',
    name: '岳渎阁',
    subtitle: '登阁览胜，品读山水诗意',
    category: '建筑',
    coverImage: '/images/spot_004_cover.jpg',
    gallery: ['/images/spot_004_01.jpg', '/images/spot_004_02.jpg'],
    videoUrl: 'https://example.com/videos/spot_004.mp4',
    videoPoster: '/images/spot_004_poster.jpg',
    qrSceneId: 'spot_004',
    location: {
      lat: 34.5465,
      lng: 110.2489,
      address: '岳渎公园·岳渎阁'
    },
    description: '岳渎阁是公园的标志性建筑，高约36米，共五层。阁名取"岳"（山）与"渎"（大河）之意，寓意山河交汇、天地交融。登上阁顶，可将整个三河交汇景观尽收眼底。',
    detail: [
      { title: '🏯 建筑风格', content: '岳渎阁采用仿唐建筑风格，重檐歇山顶，朱红柱子配以青灰瓦片。阁内设有环形楼梯，每层都有环绕阳台，游客可从不同高度欣赏周边风光。' },
      { title: '🎨 文化内涵', content: '阁内每层陈列不同的文化主题：一层为"山河地理"展示区，二层为"历史名人"展示区（展示与潼关相关的历史人物如曹操、郭子仪等），三层为"诗词文化"展示区，四层为观景茶室，五层为360度观景平台。' },
      { title: '🔭 景观视野', content: '从岳渎阁五层远眺，北可望黄河蜿蜒东去，西可观秦岭群峰连绵，南可览华山雄姿，东可见中原大地辽阔无垠。天气晴好时，视野可达50公里以上。' },
      { title: '🎧 语音导览', content: '您现在位于岳渎阁第五层观景平台。向北看，黄河如金色飘带蜿蜒东流；向西看，秦岭山脉层峦叠嶂；向南看，华山五峰清晰可见；向东看，广阔的平原延伸到天际。这里是整个公园最佳的360度全景拍摄点。' }
    ],
    tips: '阁内有电梯可直达五层，每层均有休息区。日落时分登阁景色最美。',
    audioUrl: 'https://example.com/audio/spot_004.mp3',
    duration: 20,
    sortOrder: 4
  },
  {
    id: 'spot_005',
    name: '潼关古城遗址',
    subtitle: '天下第一关的历史回响',
    category: '历史遗迹',
    coverImage: '/images/spot_005_cover.jpg',
    gallery: ['/images/spot_005_01.jpg', '/images/spot_005_02.jpg', '/images/spot_005_03.jpg'],
    videoUrl: 'https://example.com/videos/spot_005.mp4',
    videoPoster: '/images/spot_005_poster.jpg',
    qrSceneId: 'spot_005',
    location: {
      lat: 34.5530,
      lng: 110.2580,
      address: '岳渎公园·潼关古城遗址'
    },
    description: '潼关古城始建于东汉，距今已有1800多年历史。作为"天下第一关"，潼关扼守关中与中原的咽喉要道，自古为兵家必争之地。现存遗址包括城墙残段、城门基址和烽火台遗迹。',
    detail: [
      { title: '⚔️ 军事要塞', content: '潼关地处黄河与秦岭之间的狭窄通道，宽仅数公里，是关中平原的东大门。历代在此发生的著名战役超过百次。唐代安史之乱中，哥舒翰率二十万大军在此与安禄山决战。' },
      { title: '🏛️ 考古发现', content: '近年来考古发掘在遗址区发现了汉代至明清的多层文化堆积，出土了大量兵器、钱币、陶瓷器等文物。其中最珍贵的是东汉时期的"潼关令印"铜印和唐代的守关将士生活遗迹。' },
      { title: '🧱 城墙遗迹', content: '现存的城墙残段长约500米，最高处约8米。城墙采用夯土外包砖石的结构，夯层清晰可见。在城墙断面可以观察到历代维修加固的痕迹，是一部凝固的建筑史。' },
      { title: '🎧 语音导览', content: '您面前这段高约8米的夯土墙就是东汉潼关古城墙的一部分。请观察墙面上不同颜色的夯土层——每一层代表一个朝代。最下层颜色最深的是汉代原始夯土，中间浅黄色的是唐代加固层，最上层带有砖石痕迹的是明代维修层。正前方是近年复原的古城门模型。' }
    ],
    tips: '遗址区域地面不平，请穿着舒适的平底鞋。有免费WiFi可下载AR复原App查看古城原貌。',
    audioUrl: 'https://example.com/audio/spot_005.mp3',
    duration: 25,
    sortOrder: 5
  },
  {
    id: 'spot_006',
    name: '落日崖',
    subtitle: '黄河落日的最佳观赏地',
    category: '自然景观',
    coverImage: '/images/spot_006_cover.jpg',
    gallery: ['/images/spot_006_01.jpg', '/images/spot_006_02.jpg'],
    videoUrl: 'https://example.com/videos/spot_006.mp4',
    videoPoster: '/images/spot_006_poster.jpg',
    qrSceneId: 'spot_006',
    location: {
      lat: 34.5448,
      lng: 110.2501,
      address: '岳渎公园·落日崖'
    },
    description: '落日崖是一处天然的观景岩台，伸出崖壁约15米，下方是深渊峡谷，前方是开阔的黄河河谷。每天傍晚，这里聚集着大量游客等待日落——当红日沉入黄河西岸的群山中时，整个河谷被染成金色。',
    detail: [
      { title: '🌅 日落奇观', content: '落日崖的海拔和朝向使其成为观赏黄河日落的完美位置。日落时分，阳光穿过河谷中的水汽，形成绚丽的丁达尔效应。整个过程持续约30分钟，天空色彩从金黄渐变到绯红再到深紫。' },
      { title: '🌿 崖壁生态', content: '落日崖的崖壁上生长着多种耐旱植物，包括国家二级保护植物太行花和多种蕨类植物。崖壁缝隙中栖息着岩鸽和红隼等鸟类。' },
      { title: '📷 摄影指南', content: '最佳拍摄机位在崖台左侧第三块岩石上。建议使用广角镜头（16-35mm）拍摄全景，或使用长焦镜头（70-200mm）拍摄黄河上的夕阳倒影。使用三脚架和ND滤镜可拍出丝绸般的黄河水面效果。' },
      { title: '🎧 语音导览', content: '您现在站在落日崖的最前端。脚下是深约80米的峡谷，前方是黄河河谷。请站稳扶好栏杆，享受这壮美的黄河落日。如果运气好，您还能看到成群的候鸟在夕阳中飞过河面。' }
    ],
    tips: '日落时间请参考公园当日公告。崖台风大，注意保暖和手机安全。建议提前30分钟到达占位。',
    audioUrl: 'https://example.com/audio/spot_006.mp3',
    duration: 10,
    sortOrder: 6
  }
]

exports.main = async (event, context) => {
  const { action = 'import' } = event

  try {
    if (action === 'import') {
      // 批量导入景点数据
      const results = []
      for (const spot of spotsData) {
        // 先检查是否已存在
        const existResult = await db.collection('spots')
          .where({ id: spot.id })
          .count()

        if (existResult.total > 0) {
          // 更新已有数据
          await db.collection('spots').where({ id: spot.id }).update({ data: spot })
          results.push({ id: spot.id, name: spot.name, action: '更新' })
        } else {
          // 新增数据
          await db.collection('spots').add({ data: spot })
          results.push({ id: spot.id, name: spot.name, action: '新增' })
        }
      }

      return {
        success: true,
        message: `导入完成！共处理 ${results.length} 条数据`,
        results
      }
    }

    if (action === 'clear') {
      // 清空景点数据（谨慎使用）
      const spots = await db.collection('spots').get()
      for (const spot of spots.data) {
        await db.collection('spots').doc(spot._id).remove()
      }
      return {
        success: true,
        message: `已清空 ${spots.data.length} 条景点数据`,
        cleared: spots.data.length
      }
    }

    return { success: false, error: '未知操作，支持: import / clear' }
  } catch (err) {
    console.error('[importData] 操作失败:', err)
    return { success: false, error: err.message }
  }
}
