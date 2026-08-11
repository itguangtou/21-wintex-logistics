'use client';

import { useState, useEffect } from 'react';

interface Job {
  id: string;
  title: {
    cn: string;
    en: string;
  };
  description: {
    cn: string;
    en: string;
  };
  requirements: {
    cn: string[];
    en: string[];
  };
  salary: {
    cn: string;
    en: string;
  };
}

interface Contact {
  phone: string;
  email: string;
  address: {
    cn: string;
    en: string;
  };
}

interface CareersData {
  jobs: Job[];
  contact: Contact;
}

export default function CareersAdmin() {
  const [data, setData] = useState<CareersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // 加载数据
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/careers');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存数据
  const saveData = async () => {
    if (!data) return;
    
    setSaving(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/careers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        setMessage('保存成功！');
      } else {
        setMessage('保存失败，请重试');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      setMessage('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 更新职位信息
  const updateJob = (jobId: string, field: string, lang: 'cn' | 'en', value: string | string[]) => {
    if (!data) return;
    
    const updatedJobs = data.jobs.map(job => {
      if (job.id === jobId) {
        if (field === 'requirements') {
          return {
            ...job,
            requirements: {
              ...job.requirements,
              [lang]: value as string[]
            }
          };
        } else {
          return {
            ...job,
            [field]: {
              ...job[field as keyof Job] as any,
              [lang]: value
            }
          };
        }
      }
      return job;
    });
    
    setData({ ...data, jobs: updatedJobs });
  };

  // 更新联系信息
  const updateContact = (field: string, lang: 'cn' | 'en' | 'both', value: string) => {
    if (!data) return;
    
    if (field === 'phone' || field === 'email') {
      setData({
        ...data,
        contact: {
          ...data.contact,
          [field]: value
        }
      });
    } else if (field === 'address') {
      setData({
        ...data,
        contact: {
          ...data.contact,
          address: {
            ...data.contact.address,
            [lang]: value
          }
        }
      });
    }
  };

  // 添加新职位
  const addJob = () => {
    if (!data) return;
    
    const newJob: Job = {
      id: `job_${Date.now()}`,
      title: { cn: '新职位', en: 'New Position' },
      description: { cn: '职位描述', en: 'Job Description' },
      requirements: { cn: ['要求1', '要求2'], en: ['Requirement 1', 'Requirement 2'] },
      salary: { cn: '薪资面议', en: 'Salary Negotiable' }
    };
    
    setData({ ...data, jobs: [...data.jobs, newJob] });
  };

  // 删除职位
  const deleteJob = (jobId: string) => {
    if (!data) return;
    
    if (confirm('确定要删除这个职位吗？')) {
      setData({
        ...data,
        jobs: data.jobs.filter(job => job.id !== jobId)
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">加载数据失败</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">招聘内容管理</h1>
              <p className="text-gray-600 mt-1">编辑和管理招聘页面内容</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={addJob}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                添加职位
              </button>
              <button
                onClick={saveData}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? '保存中...' : '保存更改'}
              </button>
            </div>
          </div>
          
          {message && (
            <div className={`mt-4 p-3 rounded-lg ${
              message.includes('成功') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* 职位列表 */}
        <div className="space-y-6">
          {data.jobs.map((job, index) => (
            <div key={job.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  职位 {index + 1}: {job.title.cn}
                </h2>
                <button
                  onClick={() => deleteJob(job.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                >
                  删除
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 中文内容 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800 border-b pb-2">中文内容</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">职位标题</label>
                    <input
                      type="text"
                      value={job.title.cn}
                      onChange={(e) => updateJob(job.id, 'title', 'cn', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">职位描述</label>
                    <textarea
                      value={job.description.cn}
                      onChange={(e) => updateJob(job.id, 'description', 'cn', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">职位要求</label>
                    <div className="space-y-2">
                      {job.requirements.cn.map((req, reqIndex) => (
                        <div key={reqIndex} className="flex gap-2">
                          <input
                            type="text"
                            value={req}
                            onChange={(e) => {
                              const newReqs = [...job.requirements.cn];
                              newReqs[reqIndex] = e.target.value;
                              updateJob(job.id, 'requirements', 'cn', newReqs);
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            onClick={() => {
                              const newReqs = job.requirements.cn.filter((_, i) => i !== reqIndex);
                              updateJob(job.id, 'requirements', 'cn', newReqs);
                            }}
                            className="px-2 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                          >
                            删除
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newReqs = [...job.requirements.cn, '新要求'];
                          updateJob(job.id, 'requirements', 'cn', newReqs);
                        }}
                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 text-sm"
                      >
                        添加要求
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">薪资信息</label>
                    <input
                      type="text"
                      value={job.salary.cn}
                      onChange={(e) => updateJob(job.id, 'salary', 'cn', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* 英文内容 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800 border-b pb-2">English Content</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                    <input
                      type="text"
                      value={job.title.en}
                      onChange={(e) => updateJob(job.id, 'title', 'en', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
                    <textarea
                      value={job.description.en}
                      onChange={(e) => updateJob(job.id, 'description', 'en', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Requirements</label>
                    <div className="space-y-2">
                      {job.requirements.en.map((req, reqIndex) => (
                        <div key={reqIndex} className="flex gap-2">
                          <input
                            type="text"
                            value={req}
                            onChange={(e) => {
                              const newReqs = [...job.requirements.en];
                              newReqs[reqIndex] = e.target.value;
                              updateJob(job.id, 'requirements', 'en', newReqs);
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            onClick={() => {
                              const newReqs = job.requirements.en.filter((_, i) => i !== reqIndex);
                              updateJob(job.id, 'requirements', 'en', newReqs);
                            }}
                            className="px-2 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newReqs = [...job.requirements.en, 'New Requirement'];
                          updateJob(job.id, 'requirements', 'en', newReqs);
                        }}
                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 text-sm"
                      >
                        Add Requirement
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salary Info</label>
                    <input
                      type="text"
                      value={job.salary.en}
                      onChange={(e) => updateJob(job.id, 'salary', 'en', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 联系信息 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">联系信息</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
                <input
                  type="text"
                  value={data.contact.phone}
                  onChange={(e) => updateContact('phone', 'both', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                <input
                  type="email"
                  value={data.contact.email}
                  onChange={(e) => updateContact('email', 'both', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">中文地址</label>
                <textarea
                  value={data.contact.address.cn}
                  onChange={(e) => updateContact('address', 'cn', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">English Address</label>
                <textarea
                  value={data.contact.address.en}
                  onChange={(e) => updateContact('address', 'en', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
