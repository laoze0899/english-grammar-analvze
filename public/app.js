// DOM Elements
const sentenceInput = document.getElementById('sentenceInput');
const charCount = document.getElementById('charCount');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const loadingSection = document.getElementById('loadingSection');
const resultSection = document.getElementById('resultSection');
const errorSection = document.getElementById('errorSection');
const resultContent = document.getElementById('resultContent');
const analyzedSentence = document.getElementById('analyzedSentence');
const modelName = document.getElementById('modelName');
const errorMessage = document.getElementById('errorMessage');
const errorHelpList = document.getElementById('errorHelpList');
const copyBtn = document.getElementById('copyBtn');
const subtitleText = document.getElementById('subtitleText');

// Settings elements
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const modelTypeRadios = document.querySelectorAll('input[name="modelType"]');
const localSettings = document.getElementById('localSettings');
const apiSettings = document.getElementById('apiSettings');
const localApiUrl = document.getElementById('localApiUrl');
const localModelName = document.getElementById('localModelName');
const apiProvider = document.getElementById('apiProvider');
const apiKey = document.getElementById('apiKey');
const toggleApiKey = document.getElementById('toggleApiKey');
const customApiUrlGroup = document.getElementById('customApiUrlGroup');
const customApiUrl = document.getElementById('customApiUrl');
const apiModelName = document.getElementById('apiModelName');
const customModelNameGroup = document.getElementById('customModelNameGroup');
const customModelName = document.getElementById('customModelName');
const configList = document.getElementById('configList');
const currentConfigName = document.getElementById('currentConfigName');
const addConfigBtn = document.getElementById('addConfigBtn');

// Add config modal elements
const addConfigModal = document.getElementById('addConfigModal');
const closeAddConfigBtn = document.getElementById('closeAddConfigBtn');
const cancelAddConfigBtn = document.getElementById('cancelAddConfigBtn');
const confirmAddConfigBtn = document.getElementById('confirmAddConfigBtn');
const newConfigNameInput = document.getElementById('newConfigName');

// API endpoint
const API_URL = '/api/analyze';
const CONFIG_URL = '/api/config';
const CONFIGS_URL = '/api/configs';

// Current configuration
let currentConfig = null;
let allConfigs = {};
let activeConfigName = 'default';
let providers = null;
let editingConfigName = 'default';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    updateCharCount();
    await loadConfig();
});

// Load configuration from server
async function loadConfig() {
    try {
        const response = await fetch(CONFIG_URL);
        const data = await response.json();
        
        if (data.success) {
            currentConfig = data.config;
            allConfigs = data.configs || { default: currentConfig };
            activeConfigName = data.activeConfig || 'default';
            providers = data.providers;
            updateUIFromConfig();
        }
    } catch (error) {
        console.error('Failed to load config:', error);
    }
}

// Update UI from configuration
function updateUIFromConfig() {
    if (!currentConfig) return;
    
    // Update subtitle
    if (currentConfig.type === 'local') {
        subtitleText.textContent = `Powered by Local AI Model (${currentConfig.local.modelName}) [${activeConfigName}]`;
    } else {
        const providerName = providers[currentConfig.api.provider]?.name || currentConfig.api.provider;
        subtitleText.textContent = `Powered by ${providerName} (${currentConfig.api.modelName}) [${activeConfigName}]`;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Input events
    sentenceInput.addEventListener('input', updateCharCount);
    sentenceInput.addEventListener('keydown', handleKeyDown);
    
    // Button events
    analyzeBtn.addEventListener('click', handleAnalyze);
    clearBtn.addEventListener('click', handleClear);
    copyBtn.addEventListener('click', handleCopy);
    
    // Settings events
    settingsBtn.addEventListener('click', openSettings);
    closeSettingsBtn.addEventListener('click', closeSettings);
    cancelSettingsBtn.addEventListener('click', closeSettings);
    saveSettingsBtn.addEventListener('click', saveSettings);
    
    // Close modal when clicking outside
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            closeSettings();
        }
    });
    
    // Model type change
    modelTypeRadios.forEach(radio => {
        radio.addEventListener('change', handleModelTypeChange);
    });
    
    // API provider change
    apiProvider.addEventListener('change', handleProviderChange);
    
    // Toggle API key visibility
    toggleApiKey.addEventListener('click', () => {
        const type = apiKey.type === 'password' ? 'text' : 'password';
        apiKey.type = type;
        toggleApiKey.textContent = type === 'password' ? '👁️' : '🙈';
    });
    
    // Add config modal events
    addConfigBtn.addEventListener('click', openAddConfigModal);
    closeAddConfigBtn.addEventListener('click', closeAddConfigModal);
    cancelAddConfigBtn.addEventListener('click', closeAddConfigModal);
    confirmAddConfigBtn.addEventListener('click', handleAddConfig);
    
    // Close add config modal when clicking outside
    addConfigModal.addEventListener('click', (e) => {
        if (e.target === addConfigModal) {
            closeAddConfigModal();
        }
    });
    
    // Enter key in new config name input
    newConfigNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleAddConfig();
        }
    });
}

// Render config list
function renderConfigList() {
    configList.innerHTML = '';
    
    Object.keys(allConfigs).forEach(name => {
        const config = allConfigs[name];
        const isActive = name === activeConfigName;
        const isEditing = name === editingConfigName;
        
        const configItem = document.createElement('div');
        configItem.className = `config-item ${isActive ? 'active' : ''} ${isEditing ? 'editing' : ''}`;
        
        const typeLabel = config.type === 'local' ? '本地' : 'API';
        const modelLabel = config.type === 'local' ? config.local.modelName : config.api.modelName;
        
        configItem.innerHTML = `
            <div class="config-item-info">
                <span class="config-item-name">${name}</span>
                <span class="config-item-details">${typeLabel} - ${modelLabel}</span>
            </div>
            <div class="config-item-actions">
                ${!isActive ? `<button class="btn-icon-only" onclick="switchConfig('${name}')" title="切换到此配置">🔄</button>` : '<span class="active-badge">当前</span>'}
                <button class="btn-icon-only" onclick="editConfig('${name}')" title="编辑配置">✏️</button>
                ${name !== 'default' ? `<button class="btn-icon-only btn-danger" onclick="deleteConfig('${name}')" title="删除配置">🗑️</button>` : ''}
            </div>
        `;
        
        configList.appendChild(configItem);
    });
}

// Switch active config
async function switchConfig(name) {
    try {
        const response = await fetch(`${CONFIGS_URL}/switch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentConfig = data.config;
            activeConfigName = name;
            updateUIFromConfig();
            renderConfigList();
            showToast(`已切换到配置: ${name}`, 'success');
        } else {
            showToast('切换失败: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Switch config error:', error);
        showToast('切换配置失败', 'error');
    }
}

// Edit config
function editConfig(name) {
    editingConfigName = name;
    const config = allConfigs[name];
    
    currentConfigName.textContent = name;
    
    // Set form values
    document.querySelector(`input[name="modelType"][value="${config.type}"]`).checked = true;
    localApiUrl.value = config.local.apiUrl;
    localModelName.value = config.local.modelName;
    apiProvider.value = config.api.provider;
    apiKey.value = config.api.apiKey;
    customApiUrl.value = config.api.apiUrl;
    
    // Handle provider change to update model options
    handleProviderChange();
    
    // Set model name
    if (config.api.provider === 'custom') {
        customModelName.value = config.api.modelName;
    } else {
        apiModelName.value = config.api.modelName;
    }
    
    // Show/hide settings panels
    handleModelTypeChange();
    
    renderConfigList();
}

// Delete config
async function deleteConfig(name) {
    if (!confirm(`确定要删除配置 "${name}" 吗？`)) {
        return;
    }
    
    try {
        const response = await fetch(`${CONFIGS_URL}/${encodeURIComponent(name)}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            allConfigs = data.configs;
            activeConfigName = data.activeConfig;
            
            // If deleted config was being edited, switch to active config
            if (editingConfigName === name) {
                editingConfigName = activeConfigName;
                editConfig(activeConfigName);
            }
            
            // Update current config if active changed
            if (data.activeConfig !== activeConfigName) {
                currentConfig = allConfigs[activeConfigName];
                updateUIFromConfig();
            }
            
            renderConfigList();
            showToast(`配置 "${name}" 已删除`, 'success');
        } else {
            showToast('删除失败: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Delete config error:', error);
        showToast('删除配置失败', 'error');
    }
}

// Open add config modal
function openAddConfigModal() {
    newConfigNameInput.value = '';
    addConfigModal.style.display = 'flex';
    newConfigNameInput.focus();
}

// Close add config modal
function closeAddConfigModal() {
    addConfigModal.style.display = 'none';
}

// Handle add config
async function handleAddConfig() {
    const name = newConfigNameInput.value.trim();
    
    if (!name) {
        showToast('请输入配置名称', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/configs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                name,
                config: {
                    type: 'local',
                    local: {
                        apiUrl: 'http://localhost:1234/v1/chat/completions',
                        modelName: 'local-model'
                    },
                    api: {
                        provider: 'openai',
                        apiKey: '',
                        apiUrl: 'https://api.openai.com/v1/chat/completions',
                        modelName: 'gpt-3.5-turbo'
                    }
                }
            })
        });
        
        // Check if response is ok before parsing JSON
        if (!response.ok) {
            const text = await response.text();
            console.error('Server response:', text);
            throw new Error(`服务器错误 (${response.status}): ${text.substring(0, 100)}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            allConfigs = data.configs;
            closeAddConfigModal();
            
            // Switch to editing the new config
            editingConfigName = name;
            renderConfigList();
            editConfig(name);
            
            showToast(`配置 "${name}" 已创建`, 'success');
        } else {
            showToast('创建失败: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Add config error:', error);
        showToast('创建配置失败: ' + error.message, 'error');
    }
}

// Open settings modal
function openSettings() {
    // Render config list
    renderConfigList();
    
    // Edit active config
    editConfig(activeConfigName);
    
    settingsModal.style.display = 'flex';
}

// Close settings modal
function closeSettings() {
    settingsModal.style.display = 'none';
}

// Handle model type change
function handleModelTypeChange() {
    const selectedType = document.querySelector('input[name="modelType"]:checked').value;
    
    if (selectedType === 'local') {
        localSettings.style.display = 'block';
        apiSettings.style.display = 'none';
    } else {
        localSettings.style.display = 'none';
        apiSettings.style.display = 'block';
    }
}

// Handle API provider change
function handleProviderChange() {
    const provider = apiProvider.value;
    
    // Show/hide custom URL
    if (provider === 'custom') {
        customApiUrlGroup.style.display = 'block';
        customModelNameGroup.style.display = 'block';
        document.getElementById('apiModelSelectGroup').style.display = 'none';
    } else {
        customApiUrlGroup.style.display = 'none';
        customModelNameGroup.style.display = 'none';
        document.getElementById('apiModelSelectGroup').style.display = 'block';
        
        // Update model options based on provider
        updateModelOptions(provider);
        
        // Update API URL
        if (providers && providers[provider]) {
            customApiUrl.value = providers[provider].apiUrl;
        }
    }
}

// Update model options based on provider
function updateModelOptions(provider) {
    if (!providers || !providers[provider]) return;
    
    const models = providers[provider].models;
    apiModelName.innerHTML = '';
    
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        apiModelName.appendChild(option);
    });
}

// Save settings
async function saveSettings() {
    const type = document.querySelector('input[name="modelType"]:checked').value;
    const provider = apiProvider.value;
    
    // Determine the correct API URL
    let finalApiUrl;
    if (provider === 'custom') {
        finalApiUrl = customApiUrl.value;
    } else if (providers && providers[provider]) {
        finalApiUrl = providers[provider].apiUrl;
    } else {
        finalApiUrl = customApiUrl.value || '';
    }
    
    const config = {
        type: type,
        local: {
            apiUrl: localApiUrl.value,
            modelName: localModelName.value
        },
        api: {
            provider: provider,
            apiKey: apiKey.value,
            apiUrl: finalApiUrl,
            modelName: provider === 'custom' ? customModelName.value : apiModelName.value
        }
    };
    
    try {
        // Update the config
        const response = await fetch(`/api/configs/${encodeURIComponent(editingConfigName)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ config })
        });
        
        // Check if response is ok before parsing JSON
        if (!response.ok) {
            const text = await response.text();
            console.error('Server response:', text);
            throw new Error(`服务器错误 (${response.status}): ${text.substring(0, 100)}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Reload all configs
            await loadConfig();
            
            closeSettings();
            showToast('设置已保存', 'success');
        } else {
            showToast('保存失败: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Save settings error:', error);
        showToast('保存设置失败: ' + error.message, 'error');
    }
}

// Update character count
function updateCharCount() {
    const count = sentenceInput.value.length;
    charCount.textContent = `${count} 字符`;
}

// Handle keyboard shortcuts
function handleKeyDown(e) {
    // Ctrl/Cmd + Enter to analyze
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleAnalyze();
    }
}

// Handle analyze button click
async function handleAnalyze() {
    const sentence = sentenceInput.value.trim();
    
    if (!sentence) {
        showToast('请输入要分析的英语句子', 'error');
        sentenceInput.focus();
        return;
    }
    
    // Show loading state
    showLoading();
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sentence }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || data.message || '分析请求失败');
        }
        
        // Show result
        showResult(data);
        
    } catch (error) {
        console.error('Analysis error:', error);
        showError(error.message);
    }
}

// Handle clear button click
function handleClear() {
    sentenceInput.value = '';
    updateCharCount();
    hideAllSections();
    sentenceInput.focus();
}

// Handle copy button click
async function handleCopy() {
    const resultText = resultContent.innerText;
    
    try {
        await navigator.clipboard.writeText(resultText);
        showToast('结果已复制到剪贴板', 'success');
    } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = resultText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('结果已复制到剪贴板', 'success');
    }
}

// Show loading state
function showLoading() {
    hideAllSections();
    loadingSection.style.display = 'block';
    analyzeBtn.disabled = true;
}

// Show result
function showResult(data) {
    hideAllSections();
    
    // Update meta info
    analyzedSentence.textContent = `"${data.sentence}"`;
    
    const modelTypeLabel = data.modelType === 'local' ? '本地模型' : 'API';
    const configLabel = data.configName ? ` [${data.configName}]` : '';
    modelName.textContent = `${modelTypeLabel}: ${data.model}${configLabel}`;
    
    // Render markdown-like content
    resultContent.innerHTML = renderMarkdown(data.analysis);
    
    resultSection.style.display = 'block';
    analyzeBtn.disabled = false;
    
    // Scroll to result
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Show error
function showError(message) {
    hideAllSections();
    errorMessage.textContent = message;
    
    // Update error help list based on model type
    if (currentConfig && currentConfig.type === 'api') {
        errorHelpList.innerHTML = `
            <li>确保 API Key 正确且有效</li>
            <li>检查网络连接是否正常</li>
            <li>确认 API 服务是否可用</li>
            <li>检查账户余额是否充足</li>
        `;
    } else {
        errorHelpList.innerHTML = `
            <li>确保 LMStudio 已经启动并运行</li>
            <li>确保已加载 AI 模型</li>
            <li>确保 LMStudio 的 API 端口正确</li>
            <li>检查 LMStudio 的本地服务器是否已启用</li>
        `;
    }
    
    errorSection.style.display = 'block';
    analyzeBtn.disabled = false;
}

// Hide all sections
function hideAllSections() {
    loadingSection.style.display = 'none';
    resultSection.style.display = 'none';
    errorSection.style.display = 'none';
}

// Simple markdown renderer
function renderMarkdown(text) {
    if (!text) return '';
    
    // Escape HTML entities
    let html = text
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>');
    
    // Tables - must be processed before other transformations
    // Match table format: | col1 | col2 | ... | followed by |---|---|...| and data rows
    html = html.replace(/^\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n((?:\|.+\|\s*\n?)+)/gm, function(match, headerRow, bodyRows) {
        // Parse header
        const headers = headerRow.split('|').map(h => h.trim()).filter(h => h);
        let tableHtml = '<div class="table-wrapper"><table><thead><tr>';
        headers.forEach(h => {
            tableHtml += `<th>${h}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';
        
        // Parse body rows
        const rows = bodyRows.trim().split('\n');
        rows.forEach(row => {
            const cells = row.split('|').map(c => c.trim()).filter(c => c);
            if (cells.length > 0) {
                tableHtml += '<tr>';
                cells.forEach(c => {
                    tableHtml += `<td>${c}</td>`;
                });
                tableHtml += '</tr>';
            }
        });
        
        tableHtml += '</tbody></table></div>';
        return tableHtml;
    });
    
    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2>$1</h2>');
    
    // Bold (including **text** format)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
    
    // Horizontal rule
    html = html.replace(/^---$/gim, '<hr>');
    
    // Lists (unordered)
    html = html.replace(/^\s*[-*]\s+(.*)$/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Lists (ordered)
    html = html.replace(/^\s*\d+\.\s+(.*)$/gim, '<li>$1</li>');
    
    // Line breaks - convert double newlines to paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    
    // Single line breaks
    html = html.replace(/\n/g, '<br>');
    
    // Wrap in paragraph if not already wrapped
    if (!html.startsWith('<')) {
        html = '<p>' + html + '</p>';
    }
    
    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p><br><\/p>/g, '');
    
    // Fix nested lists
    html = html.replace(/<\/li><br><li>/g, '</li><li>');
    html = html.replace(/<li>(.*?)<\/li>/g, function(match) {
        return match.replace(/<br>/g, ' ');
    });
    
    return html;
}

// Show toast notification
function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Focus input on page load
sentenceInput.focus();