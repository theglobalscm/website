// populateFirestore.js

// 引入 Firebase Admin SDK
const admin = require('firebase-admin');

// -----------------------------------------------------------
// !! 重要：替换以下值 !!
// 1. serviceAccountKey.json 的路径 (确保它在你脚本的同级目录)
// 2. default-app-id
// 3. 8853e44d-6cd7-4453-8efe-b764801b8496 (需要先在应用中登录过，才能获取到这个 ID)
// -----------------------------------------------------------
const serviceAccount = require('./serviceAccountKey.json'); // 确保这个路径正确

// 初始化 Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// -----------------------------------------------------------
// 配置你的应用程序 ID 和测试用户 ID
// -----------------------------------------------------------
const APP_ID = 'YOUR_ACTUAL_APP_ID'; // <-- 请替换为你的实际 appId
const USER_ID = 'YOUR_ACTUAL_USER_ID'; // <-- 请替换为你的实际 userId

// -----------------------------------------------------------
// 辅助函数：简化数据添加
// -----------------------------------------------------------

/**
 * 添加公共数据到 Firestore
 * @param {string[]} pathSegments 集合和文档路径的片段数组
 * @param {object} data 要写入的数据
 */
async function addPublicData(pathSegments, data) {
  let ref = db.collection('artifacts').doc(APP_ID).collection('public').doc('data');
  for (let i = 0; i < pathSegments.length; i++) {
    if (i % 2 === 0) { // 集合
      ref = ref.collection(pathSegments[i]);
    } else { // 文档
      ref = ref.doc(pathSegments[i]);
    }
  }
  await ref.set(data);
  console.log(`✅ Added public data to: artifacts/${APP_ID}/public/data/${pathSegments.join('/')}`);
}

/**
 * 添加公共数据到自动ID的集合
 * @param {string[]} pathSegments 集合路径的片段数组
 * @param {object} data 要写入的数据
 */
async function addPublicCollectionItem(pathSegments, data) {
    let ref = db.collection('artifacts').doc(APP_ID).collection('public').doc('data');
    for (const segment of pathSegments) {
        ref = ref.collection(segment);
    }
    await ref.add(data); // 使用 add() 来自动生成文档ID
    console.log(`✅ Added public collection item to: artifacts/${APP_ID}/public/data/${pathSegments.join('/')}`);
}

/**
 * 添加私人数据到 Firestore
 * @param {string[]} pathSegments 集合和文档路径的片段数组
 * @param {object} data 要写入的数据
 */
async function addPrivateData(pathSegments, data) {
  let ref = db.collection('artifacts').doc(APP_ID).collection('users').doc(USER_ID);
  for (let i = 0; i < pathSegments.length; i++) {
    if (i % 2 === 0) { // 集合
      ref = ref.collection(pathSegments[i]);
    } else { // 文档
      ref = ref.doc(pathSegments[i]);
    }
  }
  await ref.set(data);
  console.log(`✅ Added private data to: artifacts/${APP_ID}/users/${USER_ID}/${pathSegments.join('/')}`);
}

/**
 * 添加私人数据到自动ID的集合
 * @param {string[]} pathSegments 集合路径的片段数组
 * @param {object} data 要写入的数据
 */
async function addPrivateCollectionItem(pathSegments, data) {
    let ref = db.collection('artifacts').doc(APP_ID).collection('users').doc(USER_ID);
    for (const segment of pathSegments) {
        ref = ref.collection(segment);
    }
    await ref.add(data); // 使用 add() 来自动生成文档ID
    console.log(`✅ Added private collection item to: artifacts/${APP_ID}/users/${USER_ID}/${pathSegments.join('/')}`);
}

// -----------------------------------------------------------
// 具体的数据库填充函数
// -----------------------------------------------------------

async function populateHomepageSettings() {
  await addPublicData(['homepage_settings', 'main_settings'], {
    heroTitle: '广东合正国际供应链管理有限公司',
    heroDescription: '有色金属及自然资源领域的领先综合供应链平台',
    heroButtonText: '了解更多',
    heroBackgroundImageUrl: 'https://placehold.co/1920x1080/000000/ffffff?text=Supply+Chain+Background',
    logoUrl: 'https://placehold.co/40x40/1a73e8/ffffff?text=Logo'
  });
}

async function populateAboutUsContent() {
  await addPublicData(['about_us_content', 'main_content'], {
    aboutText1: '广东合正国际供应链管理有限公司（以下简称“合正”）致力于到2028年成为有色金属及自然资源领域的领先综合供应链平台。凭借卓越的运营能力、强大的资源整合优势及与上游中国铝业集团（中铝集团）和下游铸造厂的紧密合作，合正通过与资本的深度结合，显著增强市场竞争力，扩展业务至国际贸易、供应链金融及数字化转型。',
    aboutText2: '本计划针对投资人，重点分析中国及国际铝业和有色金属行业的现状与前景，包括中铝集团在中国市场的领先地位及合正作为中铝国贸销售主渠道的优势，展示公司在行业中的战略定位、坚定信心及人才优势。此愿景与中国“一带一路”倡议、双碳目标及循环经济政策高度契合，旨在抓住市场机遇，为可持续工业发展和投资回报创造更大价值。',
    aboutImageUrl: 'https://placehold.co/600x400/e0e7ff/3f51b5?text=Company+Vision',
    teamIntro: '管理团队成员从事财务管理、战略运营、项目投融资、商业贸易、经营管理等版块工作有超20年的经验，在商业、咨询、贸易、制造等行业TOP10企业里担任过核心管理层，均具备丰富的实战能力。',
    teamMembers: [
      {
        name: '秦大明',
        title: '董事长',
        bio: '曾在四川省委省级机关工作30多年，并在多个知名企业和金融机构出任顾问和高管，拥有丰富的管理经验和人脉。',
        imageUrl: 'https://placehold.co/150x150/a7d9ff/007bff?text=秦大明'
      },
      {
        name: 'Jonson',
        title: '副董事长',
        bio: '在行业内拥有广泛的资源网络，具备卓越的资源整合能力。曾成功助力多家知名企业于西南地区完成新业务的落地与布局。',
        imageUrl: 'https://placehold.co/150x150/a7d9ff/007bff?text=Jonson'
      },
      {
        name: '许驰',
        title: '总经理',
        bio: '现任香港九鸿供应链管理公司（中国区）合伙人，此前曾担任多家国央企高管职务，全面负责公司战略规划与整体运营管理。',
        imageUrl: 'https://placehold.co/150x150/a7d9ff/007bff?text=许驰'
      }
    ],
    coreAdvantages: [
      {
        title: '卓越的运营能力',
        points: [
          '高效供应链管理：集中采购、精准物流、严格质量控制，降低交易成本10-15%。',
          '采用ERP及区块链技术，实现交易、库存及资金的实时跟踪。',
          '在珠海、深圳设立贸易办公室，快速响应市场需求，缩短交货周期至5-7天。',
          '质量与风险控制：与CCIC合作第三方质量检测，通过期货套期保值对冲价格波动风险。'
        ]
      },
      {
        title: '强大的资源整合优势',
        points: [
          '上游战略合作：与中铝集团旗下上市公司建立长期战略合作，锁定优质铝材供应，获得低于市场平均水平的采购价格。',
          '下游紧密合作：以铸造厂订单为驱动，通过代采平台从中铝国贸集中采购，直接配送至下游工厂，提供45-60天信用账期。',
          '跨境资源网络：通过香港、新加坡、土耳其等地转口贸易，构建全球化的外贸业务体系，与东南亚再生铝供应商建立合作。'
        ]
      },
      {
        title: '与资本结合的竞争优势',
        points: [
          '资本赋能运营：通过6.3亿元融资，弥补47天现金转换周期缺口，开发低成本贸易融资工具。',
          '放大市场竞争力：资本助力扩大国际贸易规模，加速布局海外贸易办公室，推动再生铝进口。',
          '风险管理与回报保障：专户管理、期货套期保值及运输保险，保障2-3%综合毛利率。'
        ]
      }
    ]
  });
}

async function populateNews() {
  await addPublicCollectionItem(['news'], {
    title: '公司新闻标题示例 - 首次发布',
    content: '这是第一条公司新闻的详细内容。我们将在这里发布最新的公司动态和重要公告。',
    timestamp: admin.firestore.Timestamp.now(), // 使用 Firebase Server Timestamp
    imageUrl: 'https://placehold.co/400x200/cccccc/333333?text=News+Image'
  });
  await addPublicCollectionItem(['news'], {
    title: '第二条重要新闻公告',
    content: '公司近期业务取得重大突破，感谢所有团队成员的辛勤付出。',
    timestamp: admin.firestore.Timestamp.now(),
    imageUrl: 'https://placehold.co/400x200/999999/ffffff?text=Another+News'
  });
}

async function populateBusinessOutlookContent() {
  await addPublicData(['business_outlook_content', 'main_content'], {
    businessScopeItems: [
      {
        title: '主要交易商品',
        points: [
          '有色金属工业产品：电解铝、铝棒、铝合金、航天铝材、再生铝、电解铜、铜精粉',
          '自然资源：煤、液化天然气 (LNG)',
          '业务涵盖从采购到销售的全过程'
        ]
      },
      {
        title: '国内交易链条',
        text: '与中国铝业集团、魏桥集团、五矿集团、延长石油、保利、中信戴卡、厦门海峡供应链、喀什能投、昆明城投等公司建立了合作关系。通过互贸互惠，逐步提高公司在国内市场的竞争力。',
        imageUrl: 'https://placehold.co/400x200/d1e7dd/28a745?text=Domestic+Chain'
      },
      {
        title: '境外交易链条',
        text: '现有境外贸易主要以香港、新加坡、英国、土耳其等地转口贸易为主，通过境外合作伙伴关系建立外贸业务体系，逐步拓展全球市场。',
        imageUrl: 'https://placehold.co/400x200/ffe0b2/ff9800?text=Overseas+Chain'
      }
    ],
    businessExpansionItems: [
      {
        title: '国际贸易扩展',
        points: [
          '扩展交易组合：新增铜、锌、铅及稀土交易。',
          '加强再生铝进口，推动高附加值铝合金出口。',
          '利用现有合作伙伴关系，拓展中东及欧洲市场。',
          '支持中国“一带一路”倡议。'
        ]
      },
      {
        title: '供应链金融平台',
        points: [
          '为下游铸造厂提供贸易融资及信用解决方案。',
          '在SHFE及LME实施期货套期保值策略。',
          '通过贸易差价、金融服务费及套期保值利润创收。',
          '与金融机构合作提供低成本资金。'
        ]
      },
      {
        title: '数字化供应链平台',
        points: [
          '部署基于ERP及区块链的平台，跟踪交易、库存及资金。',
          '利用人工智能分析预测市场趋势，优化库存及定价策略。',
          '通过自动化流程及实时物流跟踪，降低交易成本。',
          '提供数字化客户门户。'
        ]
      },
      {
        title: '可持续及循环经济',
        points: [
          '扩大再生铝及其他金属进口，支持中国循环经济目标。',
          '推广低碳铝生产及再生材料，助力中国双碳目标。',
          '投资节能物流及绿色供应链实践，年均减排10%。',
          '响应中国环保政策。'
        ]
      }
    ],
    financialForecast: {
      revenueTable: [
        { year: '2025年', revenue: 0.9, sales: 0.47, grossProfit: 0.064 },
        { year: '2026年', revenue: 12.2, sales: 6.0, grossProfit: 2.4 },
        { year: '2027年', revenue: 21.0, sales: 21.0, grossProfit: 5.4 }
      ],
      costAssumptions: [
        { type: '铝平均价格 (含税)', details: ['2025年: 20,250元/吨', '2026年: 20,400元/吨', '2027年: 20,700元/吨'] },
        { type: '融资成本', details: ['年化6%，折算每吨113-200元 (视使用时长而定)。'] },
        { type: '总融资额', details: ['6.3亿元人民币 (2025年2.1亿, 2026年2.4亿, 2027年3.6亿)。'] }
      ],
      investmentOpportunity: '合正提供独特的价值主张，结合稳定的铝贸易、与中铝国贸主渠道的合作优势，以及创新的供应链金融及数字化解决方案。通过资本赋能，放大运营及资源优势，构建全球化的竞争优势，并契合中国战略政策，确保长期增长及可持续性。投资者将通过贸易差价及金融服务获得稳定回报（综合毛利率2-3%），并通过期货套期保值、质量控制及透明资金管理降低风险，获得“一带一路”地区及再生材料市场的高增长机会。'
    }
  });
}

async function populateIndustryDynamicsContent() {
  await addPublicData(['industry_dynamics_content', 'main_content'], {
    chinaAluminum: {
      title: '中国铝业产业现状与发展态势',
      points: [
        '产业规模与地位: 中国是全球最大的铝生产国和消费国，2024年电解铝产量预计达4300万吨，占全球总量的60%。',
        '市场驱动因素: 新能源汽车、光伏及电力装备等“新三样”行业保持两位数增长，带动铝材需求快速增长。',
        '发展态式: 2025年国内电解铝产量预计增至4355万吨，价格将保持震荡偏强。',
        '《铝产业高质量发展实施方案(2025-2027年)》强调绿色低碳及新质生产力发展，鼓励再生铝及高附加值铝材生产，预计到2025年再生铝占比达35%。'
      ]
    },
    internationalAluminum: {
      title: '国际铝业及有色金属发展前景',
      points: [
        '全球铝市场: 2024年全球电解铝产量预计7225万吨，消费需求受新能源汽车、光伏及电力行业驱动持续增长。',
        'LME库存持续减少，价格预计在2550-2800美元/吨区间波动，反映供应短缺及市场乐观预期。',
        '有色金属前景: 铜、锌、铅及稀土等有色金属需求受新能源、电子及高端制造推动，预计2025-2027年全球消费量年均增长3-5%。',
        '趋势与机遇: 全球向绿色低碳转型，再生金属及低碳生产技术需求激增，国际市场从2024年微弱过剩转向2025年供应短缺。'
      ]
    },
    chinalcoRole: {
      title: '中铝集团市场份额与主渠道作用',
      points: [
        '市场份额: 中铝集团是中国铝业龙头，2024年氧化铝、电解铝及高纯铝产能全球领先，占国内电解铝市场约70%份额，稳居行业主导地位。',
        '主渠道优势: 中铝国贸作为中铝集团的核心销售平台，整合铝锭、铝棒、铝合金及航空材料供应，提供稳定价格及高质量产品。',
        '发展前景: 中铝集团定位为“全球有色金属产业排头兵、国家战略性矿产资源和军工材料保障主力军、行业创新和绿色发展引领者”。'
      ]
    }
  });
}

async function populateMarketTrends() {
  await addPublicCollectionItem(['marketTrends'], {
    commodity: '电解铝',
    price: 20500, // 数字类型
    unit: '元/吨',
    date: admin.firestore.Timestamp.now()
  });
  await addPublicCollectionItem(['marketTrends'], {
    commodity: '铜精粉',
    price: 65000, // 数字类型
    unit: '元/吨',
    date: admin.firestore.Timestamp.now()
  });
}

async function populateTransactions() {
  // 注意：这个会添加到 `artifacts/APP_ID/users/USER_ID/transactions` 路径下
  await addPrivateCollectionItem(['transactions'], {
    transactionId: 'TXN12345',
    item: '铝棒',
    quantity: 100, // 数字类型
    price: 20000, // 数字类型
    date: admin.firestore.Timestamp.now()
  });
  await addPrivateCollectionItem(['transactions'], {
    transactionId: 'TXN12346',
    item: '电解铜',
    quantity: 50, // 数字类型
    price: 60000, // 数字类型
    date: admin.firestore.Timestamp.now()
  });
}

// -----------------------------------------------------------
// 主执行函数
// -----------------------------------------------------------

async function main() {
  try {
    console.log('🚀 开始填充 Firebase Firestore 数据库...');

    await populateHomepageSettings();
    await populateAboutUsContent();
    await populateNews();
    await populateBusinessOutlookContent();
    await populateIndustryDynamicsContent();
    await populateMarketTrends();
    await populateTransactions(); // 私人数据

    console.log('🎉 所有数据已成功添加到 Firebase Firestore！');
  } catch (error) {
    console.error('❌ 填充数据时发生错误:', error);
    process.exit(1); // 退出并指示错误
  } finally {
    // 尽管 Node.js 脚本通常会在执行完毕后自动关闭
    // 但在某些复杂场景下，或为了明确，可以考虑在此处添加清理或关闭连接的代码
    console.log('✨ 脚本执行完毕。');
  }
}

// 运行主函数
main();
