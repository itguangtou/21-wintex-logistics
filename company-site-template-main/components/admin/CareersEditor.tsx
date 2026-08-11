'use client';

import React, { useEffect, useState } from 'react';
import { useAdminAuth } from './AdminAuthContext';
import { useAdminChrome } from './AdminChromeContext';

type Job = {
  id: string;
  title: { cn: string; en: string };
  salary: { cn: string; en: string };
  responsibilities?: { cn?: string; en?: string };
  requirements?: { cn?: string; en?: string };
  preferredConditions?: { cn?: string; en?: string };
};

interface CareersData {
  jobs: Job[];
  contact: {
    phone: string;
    email: string;
    address: { cn: string; en: string };
  };
}

export default function CareersEditor() {
  const { logout } = useAdminAuth();
  const { setSubtitle, setFooter } = useAdminChrome();
  const [data, setData] = useState<CareersData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSubtitle('编辑岗位与联系方式，发布后前台立即更新');
    return () => setSubtitle(null);
  }, [setSubtitle]);

  // 将HTML转换为纯文本（用于编辑显示）
  const htmlToPlainText = (html: string): string => {
    if (!html || !html.trim()) return '';
    
    // 如果已经是纯文本（不以<开头），直接返回
    if (!html.trim().startsWith('<')) {
      return html;
    }
    
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<ul>${html}</ul>`, 'text/html');
      const lines: string[] = [];
      
      // 提取所有列表项，包括子列表中的项，全部平级显示
      const allListItems = doc.querySelectorAll('li');
      allListItems.forEach((li) => {
        // 移除strong标签，只提取文本内容
        const clone = li.cloneNode(true) as HTMLElement;
        const strongEl = clone.querySelector('strong');
        if (strongEl) {
          // 如果有strong标签，提取其文本
          const title = strongEl.textContent || '';
          if (title) {
            lines.push(title);
          }
        }
        
        // 提取子列表中的项
        const subList = clone.querySelector('ul.sub-list');
        if (subList) {
          const subItems = Array.from(subList.querySelectorAll('li')).map(li => li.textContent || '').filter(Boolean);
          subItems.forEach(item => lines.push(item));
        } else if (!strongEl) {
          // 没有strong标签也没有子列表，直接提取文本
          const text = clone.textContent?.trim() || '';
          if (text) lines.push(text);
        }
      });
      
      return lines.join('\n');
    } catch {
      // 解析失败，尝试简单处理
      return html.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n').trim();
    }
  };

  // 将纯文本转换为HTML（用于保存）
  const plainTextToHtml = (text: string): string => {
    if (!text || !text.trim()) return '';
    
    // 如果已经是HTML格式（以<开头），先转换为纯文本再处理
    if (text.trim().startsWith('<')) {
      text = htmlToPlainText(text);
    }
    
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return '';
    
    // 每行转换为一个列表项，全部平级，无标题和子列表
    return lines.map(line => `<li>${line.trim()}</li>`).join('\n');
  };

  // 加载 API（失败则回退到 localStorage 草稿）
  useEffect(() => {
    let mounted = true;
    (async () => {
      setError(null);
      try {
        const res = await fetch('/api/careers', { cache: 'no-store', credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as CareersData;

        const draft = typeof window !== 'undefined' ? localStorage.getItem('careersDraft') : null;
        if (!mounted) return;
        setData(draft ? JSON.parse(draft) : json);
      } catch (e: any) {
        const draft = typeof window !== 'undefined' ? localStorage.getItem('careersDraft') : null;
        if (draft) {
          if (!mounted) return;
          setData(JSON.parse(draft));
          setError('API 加载失败，已使用本地草稿');
        } else {
          if (!mounted) return;
          setError('无法加载数据（API 不可用且本地草稿为空）');
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // 修改 Job 某个字段（指定语言）
  const patchJob = (id: string, path: 'title' | 'salary' | 'responsibilities' | 'requirements' | 'preferredConditions', v: string, targetLang: 'cn' | 'en', convertToHtml: boolean = false) => {
    setData((prev) => {
      if (!prev) return prev;
      const next: CareersData = structuredClone(prev);
      const job = next.jobs.find((j) => j.id === id);
      if (job) {
        if (path === 'title' || path === 'salary') {
          (job as any)[path][targetLang] = v;
        } else {
          // 对于 responsibilities, requirements, preferredConditions
          // 如果 convertToHtml 为 true，才转换为 HTML，否则直接保存原始文本
          if (!(job as any)[path]) {
            (job as any)[path] = { cn: '', en: '' };
          }
          // 直接保存原始文本，保留换行符
          (job as any)[path][targetLang] = convertToHtml ? plainTextToHtml(v) : v;
        }
      }
      return next;
    });
  };

  // 删除岗位
  const deleteJob = (id: string) => {
    if (!confirm('确定要删除这个岗位吗？此操作不可撤销。')) return;
    setData((prev) => {
      if (!prev) return prev;
      const next: CareersData = structuredClone(prev);
      next.jobs = next.jobs.filter((j) => j.id !== id);
      return next;
    });
  };

  // 新增岗位
  const addNewJob = () => {
    setData((prev) => {
      if (!prev) return prev;
      const next: CareersData = structuredClone(prev);
      const newId = `job-${Date.now()}`;
      const newJob: Job = {
        id: newId,
        title: { cn: '新岗位', en: 'New Position' },
        salary: { cn: '薪资待遇：面议', en: 'Salary: Negotiable' },
        responsibilities: { cn: '', en: '' },
        requirements: { cn: '', en: '' },
        preferredConditions: { cn: '', en: '' },
      };
      next.jobs.push(newJob);
      
      setTimeout(() => {
        const element = document.getElementById(`job-article-${newId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          element.style.transition = 'box-shadow 0.3s ease';
          element.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.5)';
          setTimeout(() => {
            element.style.boxShadow = '';
          }, 2000);
        }
      }, 100);
      
      return next;
    });
  };

  const saveDraft = () => {
    if (!data) return;
    localStorage.setItem('careersDraft', JSON.stringify(data));
    alert('已保存到浏览器本地草稿（localStorage）');
  };

  const publish = async () => {
    if (!data) return;
    setSaving(true);
    try {
      // 在发布前，将所有的纯文本字段转换为 HTML 格式
      const dataToPublish = structuredClone(data);
      dataToPublish.jobs.forEach((job) => {
        // 转换 responsibilities
        if (job.responsibilities) {
          ['cn', 'en'].forEach((langKey) => {
            const value = job.responsibilities?.[langKey as 'cn' | 'en'];
            if (value && !value.trim().startsWith('<')) {
              // 如果是纯文本，转换为 HTML
              (job.responsibilities as any)[langKey] = plainTextToHtml(value);
            }
          });
        }
        // 转换 requirements
        if (job.requirements) {
          ['cn', 'en'].forEach((langKey) => {
            const value = job.requirements?.[langKey as 'cn' | 'en'];
            if (value && !value.trim().startsWith('<')) {
              // 如果是纯文本，转换为 HTML
              (job.requirements as any)[langKey] = plainTextToHtml(value);
            }
          });
        }
        // 转换 preferredConditions
        if (job.preferredConditions) {
          ['cn', 'en'].forEach((langKey) => {
            const value = job.preferredConditions?.[langKey as 'cn' | 'en'];
            if (value && !value.trim().startsWith('<')) {
              // 如果是纯文本，转换为 HTML
              (job.preferredConditions as any)[langKey] = plainTextToHtml(value);
            }
          });
        }
      });

      let res: Response;
      
      // 先尝试 PUT 方法
      try {
        res = await fetch('/api/careers', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(dataToPublish),
        });
        
        // 如果 PUT 返回 405（方法不允许），尝试使用 POST
        if (res.status === 405) {
          res = await fetch('/api/careers', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(dataToPublish),
          });
        }
      } catch (fetchError) {
        // 如果 PUT 请求本身失败（网络错误等），尝试 POST
        res = await fetch('/api/careers', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(dataToPublish),
        });
      }
      
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        if (res.status === 401) {
          await logout();
          throw new Error(j?.error || '登录已过期，请重新登录');
        }
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
  
      // 通知前台刷新（双通道：BroadcastChannel + localStorage 事件）
      try {
        const ch = new BroadcastChannel('careers');
        ch.postMessage({ type: 'updated', at: Date.now() });
        ch.close();
      } catch {}
  
      localStorage.setItem('careers-updated', String(Date.now()));
      
      // 显示成功提示，然后跳转到招聘页面
      alert('已发布成功');
      window.location.href = `/careers.html?lang=zh`;
    } catch (e: any) {
      alert('发布失败：' + e.message);
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!data) {
      setFooter(null);
      return;
    }
    setFooter(
      <>
        <button
          type="button"
          onClick={saveDraft}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50"
        >
          保存草稿（本地）
        </button>
        <button
          type="button"
          onClick={() => void publish()}
          disabled={saving}
          className="px-5 py-2 rounded-lg bg-[#0E2745] text-white text-sm font-semibold hover:bg-[#163a5f] disabled:opacity-50"
        >
          {saving ? '发布中…' : '发布到网站'}
        </button>
      </>
    );
    return () => setFooter(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- footer buttons bind latest save/publish via closure refresh on data/saving
  }, [data, saving, setFooter]);

  if (!data) {
    return (
      <div className="p-8">
        {error ? <p className="text-red-600">{error}</p> : <p className="text-gray-500">加载招聘数据中…</p>}
      </div>
    );
  }

  return (
      <div className="p-6 lg:p-8 max-w-5xl">
        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}

        <section className="grid gap-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-[#0E2745]">招聘岗位</h2>
            <button
              onClick={addNewJob}
              className="w-8 h-8 flex items-center justify-center rounded-lg border bg-green-600 text-white hover:bg-green-700 transition-colors text-lg font-bold"
              title="新增岗位"
            >
              +
            </button>
          </div>
          {data.jobs.map((job) => (
            <article
              key={job.id}
              id={`job-article-${job.id}`}
              className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold">{job.id}</h2>
                  <span className="text-xs text-gray-500">中英文编辑</span>
                </div>
                <button
                  onClick={() => deleteJob(job.id)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg border bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-bold"
                  title="删除岗位"
                >
                  −
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="grid gap-1">
                  <span className="text-sm text-gray-600">职位标题（中文）</span>
                  <input
                    className="border rounded-lg px-3 py-2"
                    value={job.title.cn}
                    onChange={(e) => patchJob(job.id, 'title', e.target.value, 'cn')}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm text-gray-600">职位标题（English）</span>
                  <input
                    className="border rounded-lg px-3 py-2"
                    value={job.title.en}
                    onChange={(e) => patchJob(job.id, 'title', e.target.value, 'en')}
                  />
                </label>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <label className="grid gap-1">
                  <span className="text-sm text-gray-600">薪资文案（中文）</span>
                  <input
                    className="border rounded-lg px-3 py-2"
                    value={job.salary.cn}
                    onChange={(e) => patchJob(job.id, 'salary', e.target.value, 'cn')}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm text-gray-600">薪资文案（English）</span>
                  <input
                    className="border rounded-lg px-3 py-2"
                    value={job.salary.en}
                    onChange={(e) => patchJob(job.id, 'salary', e.target.value, 'en')}
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="grid gap-1">
                    <span className="text-sm text-gray-600 font-medium">核心职责（中文）</span>
                    <textarea
                      className="border rounded-lg px-3 py-2 min-h-[120px] text-sm resize-y"
                      value={(() => {
                        const raw = job.responsibilities?.cn || '';
                        return raw.trim().startsWith('<') ? htmlToPlainText(raw) : raw;
                      })()}
                      onChange={(e) => patchJob(job.id, 'responsibilities', e.target.value, 'cn', false)}
                      placeholder="核心职责..."
                      style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-sm text-gray-600 font-medium">核心职责（English）</span>
                    <textarea
                      className="border rounded-lg px-3 py-2 min-h-[120px] text-sm resize-y"
                      value={(() => {
                        const raw = job.responsibilities?.en || '';
                        return raw.trim().startsWith('<') ? htmlToPlainText(raw) : raw;
                      })()}
                      onChange={(e) => patchJob(job.id, 'responsibilities', e.target.value, 'en', false)}
                      placeholder="Core Responsibilities..."
                      style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                    />
                  </label>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <label className="grid gap-1">
                    <span className="text-sm text-gray-600 font-medium">职位要求（中文）</span>
                    <textarea
                      className="border rounded-lg px-3 py-2 min-h-[200px] text-sm resize-y"
                      value={(() => {
                        const raw = job.requirements?.cn || '';
                        return raw.trim().startsWith('<') ? htmlToPlainText(raw) : raw;
                      })()}
                      onChange={(e) => patchJob(job.id, 'requirements', e.target.value, 'cn', false)}
                      placeholder="职位要求..."
                      style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-sm text-gray-600 font-medium">职位要求（English）</span>
                    <textarea
                      className="border rounded-lg px-3 py-2 min-h-[200px] text-sm resize-y"
                      value={(() => {
                        const raw = job.requirements?.en || '';
                        return raw.trim().startsWith('<') ? htmlToPlainText(raw) : raw;
                      })()}
                      onChange={(e) => patchJob(job.id, 'requirements', e.target.value, 'en', false)}
                      placeholder="Requirements..."
                      style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                    />
                  </label>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <label className="grid gap-1">
                    <span className="text-sm text-gray-600 font-medium">优先条件（中文）</span>
                    <textarea
                      className="border rounded-lg px-3 py-2 min-h-[100px] text-sm resize-y"
                      value={(() => {
                        const raw = job.preferredConditions?.cn || '';
                        return raw.trim().startsWith('<') ? htmlToPlainText(raw) : raw;
                      })()}
                      onChange={(e) => patchJob(job.id, 'preferredConditions', e.target.value, 'cn', false)}
                      placeholder="优先条件..."
                      style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-sm text-gray-600 font-medium">优先条件（English）</span>
                    <textarea
                      className="border rounded-lg px-3 py-2 min-h-[100px] text-sm resize-y"
                      value={(() => {
                        const raw = job.preferredConditions?.en || '';
                        return raw.trim().startsWith('<') ? htmlToPlainText(raw) : raw;
                      })()}
                      onChange={(e) => patchJob(job.id, 'preferredConditions', e.target.value, 'en', false)}
                      placeholder="Preference..."
                      style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                    />
                  </label>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
          <h3 className="font-semibold mb-3 text-[#0E2745]">联系方式</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-sm text-gray-600">电话</span>
              <input
                className="border rounded-lg px-3 py-2"
                value={data.contact.phone}
                onChange={(e) => setData({ ...data, contact: { ...data.contact, phone: e.target.value } })}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-gray-600">邮箱</span>
              <input
                className="border rounded-lg px-3 py-2"
                value={data.contact.email}
                onChange={(e) => setData({ ...data, contact: { ...data.contact, email: e.target.value } })}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-gray-600">地址（中文）</span>
              <input
                className="border rounded-lg px-3 py-2"
                value={data.contact.address.cn}
                onChange={(e) =>
                  setData({
                    ...data,
                    contact: { ...data.contact, address: { ...data.contact.address, cn: e.target.value } },
                  })
                }
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-gray-600">地址（English）</span>
              <input
                className="border rounded-lg px-3 py-2"
                value={data.contact.address.en}
                onChange={(e) =>
                  setData({
                    ...data,
                    contact: { ...data.contact, address: { ...data.contact.address, en: e.target.value } },
                  })
                }
              />
            </label>
          </div>
        </section>
      </div>
  );
}

