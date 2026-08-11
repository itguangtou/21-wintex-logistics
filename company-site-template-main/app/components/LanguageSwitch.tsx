'use client';
import { useEffect, useState } from 'react';
export type Lang = 'zh' | 'en';
export default function LanguageSwitch({ onChange }:{ onChange?:(l:Lang)=>void }){
  const [lang, setLang] = useState<Lang>('zh');
  useEffect(()=>{
    const stored = (typeof window!=='undefined' && localStorage.getItem('lang')) as Lang | null;
    if(stored){ setLang(stored); onChange?.(stored); }
  },[]);
  const toggle = (l:Lang)=>{ setLang(l); localStorage.setItem('lang', l); onChange?.(l); if(typeof window!=='undefined'){ window.dispatchEvent(new CustomEvent('langchange',{ detail:l })); } };
  return (
    <div className="flex items-center gap-2">
      <button onClick={()=>toggle('zh')} className={"btn "+(lang==='zh'?'btn-primary':'')}>CN</button>
      <button onClick={()=>toggle('en')} className={"btn "+(lang==='en'?'btn-primary':'')}>EN</button>
    </div>
  );
}