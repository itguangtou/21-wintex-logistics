
import { NextResponse } from 'next/server';

// Simple in-memory mock (GET only). In real use, back with DB.
const MOCK = {
jobs: [
{ id: 'business', title: { cn: '商务助理', en: 'Business Assistant' }, salary: { cn: '薪资待遇：面议', en: 'Salary: Negotiable' } },
{ id: 'translator', title: { cn: '现场翻译', en: 'On-site Translator' }, salary: { cn: '薪资待遇：面议', en: 'Salary: Negotiable' } },
{ id: 'freight', title: { cn: '货代操作', en: 'Freight Forwarding Operator' }, salary: { cn: '薪资待遇：面议', en: 'Salary: Negotiable' } }
],
contact: {
phone: '+63 9510941210',
email: 'wintexlogistics@wintex.com.ph',
address: { cn: '菲律宾马尼拉总部', en: 'Headquarters in Manila, Philippines' }
}
};


export async function GET() {
return new NextResponse(JSON.stringify(MOCK), {
status: 200,
headers: {
'content-type': 'application/json; charset=utf-8',
'cache-control': 'no-store'
}
});
}