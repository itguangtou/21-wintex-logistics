// 动态更新职位内容
function updatePageContent() {
    if (!careersData) {
        // 如果没有数据，使用默认翻译
        const langData = translations[currentLang];
        Object.keys(langData).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.value = langData[key];
                } else {
                    element.textContent = langData[key];
                }
            }
        });
        return;
    }
    
    const langData = translations[currentLang];
    
    // 动态创建职位标签页和内容
    createDynamicJobTabs();
    
    // 更新职位内容
    careersData.jobs.forEach((job, index) => {
        const tabBtn = document.querySelector(`[data-tab="${job.id}"]`);
        if (tabBtn) {
            tabBtn.textContent = job.title[currentLang];
        }
        
        // 更新职位详情
        const contentDiv = document.getElementById(`${job.id}-content`);
        if (contentDiv) {
            updateJobContent(contentDiv, job, currentLang);
        }
    });
    
    // 更新联系信息
    updateContactInfo();
    
    // 更新其他翻译内容
    Object.keys(langData).forEach(key => {
        const element = document.getElementById(key);
        if (element && !careersData.jobs.some(job => 
            job.id === key.replace('-content', '').replace('-tab', '')
        )) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.value = langData[key];
            } else {
                element.textContent = langData[key];
            }
        }
    });
    
    // 更新编辑按钮文本
    const editTextElement = document.getElementById('edit-text');
    if (editTextElement) {
        editTextElement.textContent = currentLang === 'cn' ? '编辑' : 'Edit';
    }
}

// 动态创建职位标签页和内容
function createDynamicJobTabs() {
    const jobTabsContainer = document.querySelector('.job-tabs');
    const jobContentsContainer = document.querySelector('.container');
    
    if (!jobTabsContainer || !jobContentsContainer) return;
    
    // 清除现有的动态标签页（保留原有的3个）
    const existingTabs = jobTabsContainer.querySelectorAll('[data-tab]:not([data-tab="business"]):not([data-tab="translator"]):not([data-tab="freight"])');
    existingTabs.forEach(tab => tab.remove());
    
    const existingContents = jobContentsContainer.querySelectorAll('[id$="-content"]:not([id="business-content"]):not([id="translator-content"]):not([id="freight-content"])');
    existingContents.forEach(content => content.remove());
    
    // 为每个职位创建标签页和内容
    careersData.jobs.forEach((job, index) => {
        // 检查是否已存在
        if (document.querySelector(`[data-tab="${job.id}"]`)) return;
        
        // 创建标签页按钮
        const tabBtn = document.createElement('button');
        tabBtn.className = 'tab-btn';
        tabBtn.setAttribute('data-tab', job.id);
        tabBtn.id = `${job.id}-tab`;
        tabBtn.textContent = job.title[currentLang];
        jobTabsContainer.appendChild(tabBtn);
        
        // 创建职位内容
        const jobContent = document.createElement('div');
        jobContent.className = 'job-content';
        jobContent.id = `${job.id}-content`;
        
        const jobDetails = document.createElement('div');
        jobDetails.className = 'job-details';
        
        const card = document.createElement('div');
        card.className = 'card';
        
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';
        
        const title = document.createElement('h2');
        title.innerHTML = `<i class="fas fa-tasks"></i> <span id="${job.id}-title">${currentLang === 'cn' ? '核心职责' : 'Key Responsibilities'}</span>`;
        
        const description = document.createElement('p');
        description.textContent = job.description[currentLang];
        
        // 创建职位要求部分
        const requirementsTitle = document.createElement('h2');
        requirementsTitle.innerHTML = `<i class="fas fa-user-graduate"></i> <span id="${job.id}-requirements-title">${currentLang === 'cn' ? '职位要求' : 'Requirements'}</span>`;
        
        const requirementsList = document.createElement('ul');
        if (job.requirements && job.requirements[currentLang]) {
            job.requirements[currentLang].forEach(req => {
                const li = document.createElement('li');
                li.textContent = req;
                requirementsList.appendChild(li);
            });
        }
        
        const salaryDiv = document.createElement('div');
        salaryDiv.className = 'salary-highlight';
        salaryDiv.innerHTML = `<i class="fas fa-money-bill-wave"></i> <span>${job.salary[currentLang]}</span>`;
        
        cardBody.appendChild(title);
        cardBody.appendChild(description);
        cardBody.appendChild(requirementsTitle);
        cardBody.appendChild(requirementsList);
        cardBody.appendChild(salaryDiv);
        card.appendChild(cardBody);
        jobDetails.appendChild(card);
        jobContent.appendChild(jobDetails);
        
        // 插入到现有内容之前
        const workEnvironment = document.querySelector('.work-environment');
        if (workEnvironment) {
            jobContentsContainer.insertBefore(jobContent, workEnvironment);
        } else {
            jobContentsContainer.appendChild(jobContent);
        }
    });
    
    // 重新绑定标签页切换事件
    bindTabEvents();
}

// 绑定标签页事件
function bindTabEvents() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const jobContents = document.querySelectorAll('.job-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有active类
            tabBtns.forEach(b => b.classList.remove('active'));
            jobContents.forEach(content => content.classList.remove('active'));
            
            // 添加active类到当前元素
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            const contentElement = document.getElementById(`${tabId}-content`);
            if (contentElement) {
                contentElement.classList.add('active');
            }
        });
    });
}

// 更新职位内容
function updateJobContent(contentDiv, job, lang) {
    // 更新职责标题
    const responsibilityTitle = contentDiv.querySelector('[id$="-title"]');
    if (responsibilityTitle) {
        responsibilityTitle.textContent = lang === 'cn' ? '核心职责' : 'Key Responsibilities';
    }
    
    // 更新职位描述
    const description = contentDiv.querySelector('.card-body p');
    if (description) {
        description.textContent = job.description[lang];
    }
    
    // 更新职位要求
    const requirementsTitle = contentDiv.querySelector('[id$="-requirements-title"]');
    if (requirementsTitle) {
        requirementsTitle.textContent = lang === 'cn' ? '职位要求' : 'Requirements';
    }
    
    const requirementsList = contentDiv.querySelector('ul');
    if (requirementsList && job.requirements && job.requirements[lang]) {
        requirementsList.innerHTML = '';
        job.requirements[lang].forEach(req => {
            const li = document.createElement('li');
            li.textContent = req;
            requirementsList.appendChild(li);
        });
    }
    
    // 更新薪资信息
    const salaryElement = contentDiv.querySelector('.salary-highlight span');
    if (salaryElement) {
        salaryElement.textContent = job.salary[lang];
    }
}

// 更新联系信息
function updateContactInfo() {
    if (!careersData) return;
    
    const contactItems = document.querySelectorAll('.contact-item span');
    contactItems.forEach(item => {
        if (item.textContent.includes('+63')) {
            item.textContent = `招聘热线: ${careersData.contact.phone}`;
        } else if (item.textContent.includes('@')) {
            item.textContent = `邮箱: ${careersData.contact.email}`;
        } else if (item.textContent.includes('菲律宾') || item.textContent.includes('Philippines')) {
            item.textContent = currentLang === 'cn' ? 
                careersData.contact.address.cn : 
                careersData.contact.address.en;
        }
    });
}
