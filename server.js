const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration file path
const CONFIG_FILE = path.join(__dirname, 'configs.json');

// API provider configurations
const API_PROVIDERS = {
    openai: {
        name: 'OpenAI',
        apiUrl: 'https://api.openai.com/v1/chat/completions',
        models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini']
    },
    deepseek: {
        name: 'DeepSeek',
        apiUrl: 'https://api.deepseek.com/v1/chat/completions',
        models: ['deepseek-chat', 'deepseek-coder']
    },
    anthropic: {
        name: 'Anthropic (Claude)',
        apiUrl: 'https://api.anthropic.com/v1/messages',
        models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
    },
    jdjoybuilder: {
        name: '京东 JoyBuilder',
        apiUrl: 'https://modelservice.jdcloud.com/coding/openai/v1/chat/completions',
        models: ['joy-coding-1.5', 'joy-coding', 'joy-chat']
    },
    custom: {
        name: '自定义 API',
        apiUrl: '',
        models: []
    }
};

// Default configuration template
const DEFAULT_CONFIG = {
    type: 'local',
    local: {
        apiUrl: process.env.LMSTUDIO_API_URL || 'http://localhost:1234/v1/chat/completions',
        modelName: 'local-model'
    },
    api: {
        provider: 'openai',
        apiKey: '',
        apiUrl: 'https://api.openai.com/v1/chat/completions',
        modelName: 'gpt-3.5-turbo'
    }
};

// Load configurations from file
function loadConfigs() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            const parsed = JSON.parse(data);
            return {
                configs: parsed.configs || { default: { ...DEFAULT_CONFIG } },
                activeConfig: parsed.activeConfig || 'default'
            };
        }
    } catch (error) {
        console.error('Error loading configs:', error);
    }
    // Return default if file doesn't exist or error
    return {
        configs: { default: { ...DEFAULT_CONFIG } },
        activeConfig: 'default'
    };
}

// Save configurations to file
function saveConfigs(configData) {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(configData, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving configs:', error);
        return false;
    }
}

// Initialize configuration storage
let configData = loadConfigs();

// Get active configuration
function getActiveConfig() {
    return configData.configs[configData.activeConfig] || DEFAULT_CONFIG;
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// System prompt for grammar analysis
const GRAMMAR_ANALYSIS_PROMPT = `你是一位给中国学生授课的专业英语语法分析教师。你的任务是对给定的英语句子用中文进行详细的语法分析，语法分析是给中国人看的。

【词性必须使用以下中文术语】
名词、动词、形容词、副词、代词、介词、连词、冠词、感叹词、数词、助动词、情态动词

【语法功能必须使用以下中文术语】
主语、谓语、宾语、定语、状语、补语、表语、同位语

请按照以下顺序分析句子：

**输入英语句子**
显示输入的原始英语句子。

**句子风格与使用场合**
用中文分析句子的风格和使用场合。

**中文翻译**
提供一个恰当的中文翻译。

**1. 句子结构分析**
用中文详细分析：
   - 主语：说明主语是什么
   - 谓语：说明谓语是什么
   - 宾语：说明宾语是什么
   - 其他成分：说明其他成分

**2. 时态和语态**
用中文解释时态和语态。

**3. 词性分析**
使用以下表格格式（表头必须是中文）：
| 单词 | 词性 | 语法功能 |
词性填：名词、动词、形容词、副词、代词、介词、连词、冠词、感叹词等
语法功能填：主语、谓语、宾语、定语、状语、补语等

**4. 从句分析**
用中文分析从句。

**5. 语法要点**
用中文解释语法规则。

**6. 易错点提示**
用中文指出常见错误。

再次强调：所有内容必须完全使用中文！`;

// Get all configurations
app.get('/api/config', (req, res) => {
    res.json({
        success: true,
        config: getActiveConfig(),
        configs: configData.configs,
        activeConfig: configData.activeConfig,
        providers: API_PROVIDERS
    });
});

// Create new configuration
app.post('/api/configs', (req, res) => {
    try {
        console.log('Received create config request:', req.body);
        const { name, config } = req.body;
        
        if (!name || !name.trim()) {
            console.log('Error: Config name is empty');
            return res.status(400).json({
                success: false,
                error: '配置名称不能为空'
            });
        }
        
        const configName = name.trim();
        console.log('Creating config with name:', configName);
        
        if (configData.configs[configName]) {
            console.log('Error: Config name already exists');
            return res.status(400).json({
                success: false,
                error: '配置名称已存在'
            });
        }
        
        configData.configs[configName] = config || { ...DEFAULT_CONFIG };
        console.log('New config added:', configName);
        
        if (saveConfigs(configData)) {
            console.log('Config saved successfully');
            res.json({
                success: true,
                message: '配置已创建',
                configs: configData.configs,
                activeConfig: configData.activeConfig
            });
        } else {
            console.log('Error: Failed to save config');
            res.status(500).json({
                success: false,
                error: '配置保存失败'
            });
        }
    } catch (error) {
        console.error('Create config error:', error);
        res.status(500).json({
            success: false,
            error: '配置创建失败',
            message: error.message
        });
    }
});

// Update configuration
app.put('/api/configs/:name', (req, res) => {
    try {
        const { name } = req.params;
        const { config } = req.body;
        
        if (!configData.configs[name]) {
            return res.status(404).json({
                success: false,
                error: '配置不存在'
            });
        }
        
        configData.configs[name] = {
            ...configData.configs[name],
            ...config
        };
        
        if (saveConfigs(configData)) {
            res.json({
                success: true,
                message: '配置已更新',
                config: configData.configs[name]
            });
        } else {
            res.status(500).json({
                success: false,
                error: '配置保存失败'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '配置更新失败',
            message: error.message
        });
    }
});

// Delete configuration
app.delete('/api/configs/:name', (req, res) => {
    try {
        const { name } = req.params;
        
        if (name === 'default') {
            return res.status(400).json({
                success: false,
                error: '不能删除默认配置'
            });
        }
        
        if (!configData.configs[name]) {
            return res.status(404).json({
                success: false,
                error: '配置不存在'
            });
        }
        
        delete configData.configs[name];
        
        // If deleted config was active, switch to default
        if (configData.activeConfig === name) {
            configData.activeConfig = 'default';
        }
        
        if (saveConfigs(configData)) {
            res.json({
                success: true,
                message: '配置已删除',
                configs: configData.configs,
                activeConfig: configData.activeConfig
            });
        } else {
            res.status(500).json({
                success: false,
                error: '配置保存失败'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '配置删除失败',
            message: error.message
        });
    }
});

// Switch active configuration
app.post('/api/configs/switch', (req, res) => {
    try {
        const { name } = req.body;
        
        if (!configData.configs[name]) {
            return res.status(404).json({
                success: false,
                error: '配置不存在'
            });
        }
        
        configData.activeConfig = name;
        
        if (saveConfigs(configData)) {
            console.log('Switched to config:', name);
            res.json({
                success: true,
                message: '已切换配置',
                config: getActiveConfig(),
                activeConfig: name
            });
        } else {
            res.status(500).json({
                success: false,
                error: '配置保存失败'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '配置切换失败',
            message: error.message
        });
    }
});

// Legacy endpoint for backward compatibility
app.post('/api/config', (req, res) => {
    try {
        const { type, local, api } = req.body;
        const activeConfigName = configData.activeConfig;
        
        if (type) {
            configData.configs[activeConfigName].type = type;
        }
        
        if (local) {
            configData.configs[activeConfigName].local = { 
                ...configData.configs[activeConfigName].local, 
                ...local 
            };
        }
        
        if (api) {
            configData.configs[activeConfigName].api = { 
                ...configData.configs[activeConfigName].api, 
                ...api 
            };
        }
        
        if (saveConfigs(configData)) {
            console.log('Model configuration updated:', JSON.stringify(configData.configs[activeConfigName], null, 2));
            
            res.json({
                success: true,
                message: '配置已更新',
                config: configData.configs[activeConfigName]
            });
        } else {
            res.status(500).json({
                success: false,
                error: '配置保存失败'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '配置更新失败',
            message: error.message
        });
    }
});

// API endpoint for grammar analysis
app.post('/api/analyze', async (req, res) => {
    try {
        const { sentence } = req.body;
        
        if (!sentence || sentence.trim() === '') {
            return res.status(400).json({ error: 'Please provide a sentence to analyze' });
        }

        // Reload config from file to get latest
        configData = loadConfigs();
        const currentConfig = getActiveConfig();
        let apiUrl, headers, body, modelName;

        if (currentConfig.type === 'local') {
            // Local model configuration
            apiUrl = currentConfig.local.apiUrl;
            modelName = currentConfig.local.modelName;
            headers = {
                'Content-Type': 'application/json',
            };
            body = {
                model: modelName,
                messages: [
                    {
                        role: 'system',
                        content: GRAMMAR_ANALYSIS_PROMPT
                    },
                    {
                        role: 'user',
                        content: `Please analyze the following English sentence:\n\n"${sentence}"`
                    }
                ],
                temperature: 0.7,
                max_tokens: 4096,
                stream: false
            };
        } else {
            // API model configuration
            if (!currentConfig.api.apiKey) {
                return res.status(400).json({ 
                    error: 'API Key 未设置，请先在设置中配置 API Key' 
                });
            }
            
            // Ensure API URL ends with /chat/completions for OpenAI-compatible APIs
            apiUrl = currentConfig.api.apiUrl;
            if (!apiUrl.includes('/chat/completions')) {
                apiUrl = apiUrl.replace(/\/$/, '') + '/chat/completions';
            }
            modelName = currentConfig.api.modelName;
            
            // Handle different API providers
            if (currentConfig.api.provider === 'anthropic') {
                headers = {
                    'Content-Type': 'application/json',
                    'x-api-key': currentConfig.api.apiKey,
                    'anthropic-version': '2023-06-01'
                };
                body = {
                    model: modelName,
                    max_tokens: 4096,
                    messages: [
                        {
                            role: 'user',
                            content: `${GRAMMAR_ANALYSIS_PROMPT}\n\nPlease analyze the following English sentence:\n\n"${sentence}"`
                        }
                    ]
                };
            } else {
                // OpenAI-compatible API (OpenAI, DeepSeek, etc.)
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentConfig.api.apiKey}`
                };
                body = {
                    model: modelName,
                    messages: [
                        {
                            role: 'system',
                            content: GRAMMAR_ANALYSIS_PROMPT
                        },
                        {
                            role: 'user',
                            content: `Please analyze the following English sentence:\n\n"${sentence}"`
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 4096,
                    stream: false
                };
            }
        }

        console.log('Analyzing sentence:', sentence.substring(0, 100) + '...');
        console.log('Using config:', configData.activeConfig);
        console.log('Model type:', currentConfig.type);
        console.log('Connecting to API at:', apiUrl);

        // Call API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API error:', errorText);
                
                let errorMessage = 'API 请求失败';
                if (response.status === 401) {
                    errorMessage = 'API Key 无效或已过期';
                } else if (response.status === 429) {
                    errorMessage = 'API 请求频率超限，请稍后重试';
                } else if (response.status === 500) {
                    errorMessage = 'API 服务器错误';
                } else if (response.status === 400) {
                    errorMessage = '请求参数错误，请检查模型配置';
                }
                
                return res.status(response.status).json({ 
                    error: errorMessage,
                    details: errorText
                });
            }

            const data = await response.json();
            console.log('API response received');

            // Extract the analysis result
            let analysis;
            if (currentConfig.api.provider === 'anthropic') {
                analysis = data.content?.[0]?.text;
            } else {
                analysis = data.choices?.[0]?.message?.content;
            }

            // Check if analysis is empty or undefined
            if (!analysis || analysis.trim() === '') {
                console.error('Empty analysis result. Full response:', JSON.stringify(data, null, 2));
                return res.status(500).json({ 
                    error: 'AI 返回了空结果，请重试或检查模型配置',
                    details: 'The AI model returned an empty response'
                });
            }

            res.json({
                success: true,
                sentence: sentence,
                analysis: analysis,
                model: modelName,
                modelType: currentConfig.type,
                configName: configData.activeConfig
            });

        } catch (fetchError) {
            clearTimeout(timeoutId);
            
            if (fetchError.name === 'AbortError') {
                return res.status(504).json({ 
                    error: '请求超时，AI 模型响应时间过长',
                    hint: '请尝试使用较短的句子或更换模型'
                });
            }
            throw fetchError;
        }

    } catch (error) {
        console.error('Error during analysis:', error);
        
        let hint = '';
        const currentConfig = getActiveConfig();
        if (currentConfig.type === 'local') {
            hint = '请确保本地模型服务已启动并正确配置 API 地址';
        } else {
            hint = '请检查 API Key 和网络连接是否正常';
        }
        
        res.status(500).json({ 
            error: '语法分析过程中发生错误',
            message: error.message,
            hint: hint
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    const currentConfig = getActiveConfig();
    res.json({ 
        status: 'ok', 
        message: 'Grammar Analyzer API is running',
        modelType: currentConfig.type,
        modelName: currentConfig.type === 'local' ? currentConfig.local.modelName : currentConfig.api.modelName,
        activeConfig: configData.activeConfig
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║     English Grammar Analyzer - AI Powered                  ║
╠════════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}                  ║
║  Active config: ${configData.activeConfig.padEnd(42)}║
║  Model type: ${getActiveConfig().type.padEnd(46)}║
║                                                            ║
║  Configs stored in: configs.json                          ║
║  Use the settings panel to manage your configurations!    ║
╚════════════════════════════════════════════════════════════╝
    `);
});