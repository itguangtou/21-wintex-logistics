import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'careers.json');

// 确保数据目录存在
function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// 读取招聘数据
function readCareersData() {
  try {
    ensureDataDir();
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading careers data:', error);
  }
  
  // 返回默认数据
  return {
    jobs: [
      {
        id: 'business',
        title: {
          cn: '商务助理',
          en: 'Business Assistant'
        },
        description: {
          cn: '负责工程分包商管理、总包商商务对接、重型运输成本控制等工作',
          en: 'Responsible for subcontractor management, EPC contractor engagement, and heavy transport cost control'
        },
        requirements: {
          cn: [
            '5年以上工程物流/建筑施工企业经验',
            '3年以上多类型分包商管理经验',
            '≥5次成功向总包商索赔经验',
            '菲律宾籍，能适应项目现场工作环境',
            '流利的英语沟通能力'
          ],
          en: [
            '5+ years in engineering logistics/construction',
            '3+ years managing multiple subcontractor types',
            '≥5 successful claims against EPC contractors',
            'Filipino national, able to work at project sites',
            'Fluent English communication skills'
          ]
        },
        salary: {
          cn: '薪资待遇：面议',
          en: 'Salary: Negotiable'
        }
      },
      {
        id: 'translator',
        title: {
          cn: '现场翻译',
          en: 'On-site Translator'
        },
        description: {
          cn: '为中方特种设备操作手提供现场英语口语翻译服务',
          en: 'Provide on-site English interpretation for Chinese heavy equipment operators'
        },
        requirements: {
          cn: [
            '中国籍应届本科毕业生',
            '英语相关专业优先',
            '大学英语六级600分以上',
            '优秀的中英双语口语表达能力',
            '吃苦耐劳，能适应项目现场环境'
          ],
          en: [
            'Chinese fresh graduate with bachelor\'s degree',
            'English-related majors preferred',
            'CET-6 score ≥600',
            'Excellent Chinese-English oral interpretation skills',
            'Hardworking, adaptable to project site conditions'
          ]
        },
        salary: {
          cn: '薪资待遇：面议',
          en: 'Salary: Negotiable'
        }
      },
      {
        id: 'freight',
        title: {
          cn: '货代操作',
          en: 'Freight Forwarding Operator'
        },
        description: {
          cn: '负责国际货运的全流程操作，包括订舱、报关、单证制作及跟踪',
          en: 'Manage end-to-end international freight operations including booking, customs clearance, documentation and tracking'
        },
        requirements: {
          cn: [
            '至少3年以上国际货代公司工作经验',
            '熟悉海运、空运及多式联运操作流程',
            '精通国际贸易术语（Incoterms 2020）',
            '熟练使用物流管理系统',
            '优秀的英语读写能力'
          ],
          en: [
            'Minimum 3 years experience in international freight forwarding',
            'Familiar with sea, air and multimodal transportation processes',
            'Proficient in Incoterms 2020',
            'Proficient in logistics management systems',
            'Strong English reading/writing skills'
          ]
        },
        salary: {
          cn: '薪资待遇：面议',
          en: 'Salary: Negotiable'
        }
      }
    ],
    contact: {
      phone: '+63 917 620 0359',
      email: 'wintexlogistics@wintex.com.ph',
      address: {
        cn: '菲律宾马卡蒂市博尼法西奥堡BGC塔吉格市第7大道和第32街贸易金融大厦12楼1309单元',
        en: 'Unit 1309 12 Floor Trade and Financial Tower 7th ave and 32nd st, Fort Bonifacio, BGC Taguig City'
      }
    }
  };
}

// 写入招聘数据
function writeCareersData(data: any) {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing careers data:', error);
    return false;
  }
}

// GET - 获取招聘数据
export async function GET(request: NextRequest) {
  try {
    const data = readCareersData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read careers data' }, { status: 500 });
  }
}

// POST - 更新招聘数据
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 简单的验证
    if (!body.jobs || !Array.isArray(body.jobs)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }
    
    const success = writeCareersData(body);
    if (success) {
      return NextResponse.json({ message: 'Careers data updated successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to update careers data' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
