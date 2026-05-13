window.helpContent = {

    gettingstarted: {
        title: "开始使用",
        intro: [
            "欢迎使用 Paiperwork，这是一个专注于数据隐私和易用性的 Ollama 安全网页界面。这个面向专业人士的助手提供生产力功能，同时保持您的数据本地化和受保护。",
            "您可以在自己的电脑上下载并本地运行模型；如果设备无法承载本地模型，也可以使用云模型。使用云模型需要先在 ollama.com 登录并创建一个 API 密钥。首次使用云模型时，Paiperwork 会请求该密钥，并将其加密存储在您的本地数据库中。",
            "使用 Ollama 云模型的详细步骤：1）从 https://infinitai-cn.github.io/paiperwork/ 下载 Paiperwork。2）解压文件。2.1）如果你无法打开 Paiperwork，请检查安全设置并允许其执行。在 Windows 上点击 More info 按钮；在 macOS 上到系统设置的隐私与安全中允许。3）访问 https://ollama.com 并创建账号。4）下载并安装 Ollama。5）在 Ollama 账号中打开 Settings。6）打开 Usage 查看剩余免费额度（很重要）。7）打开 Keys，点击 Add API key，再点击 Generate API key，并复制生成的密钥。8）将该密钥保存在电脑上的文本文件中。9）运行 Paiperwork（Mac、Windows 或 Linux）。10）输入主密钥后，在 Chat 选项卡点击 Manage Cloud API key，添加你的 Ollama API 密钥。11）现在你就可以使用 Ollama 的免费云模型。",
            "在线模式（<a href=\"https://huggingface.co/spaces/Infinitai/Paiperwork\" target=\"_blank\" rel=\"noopener noreferrer\">Hugginface spaces</a>）提示：由于本地环境要求，Documents、Translate、Models 和 Connectors 这四个选项卡在在线模式下会被禁用。仅当您在电脑上本地运行 Paiperwork 时，这些选项卡才会启用。"
        ],
        articles: [
            {
                id: "gs-welcome",
                title: "欢迎界面",
                content: `
            <p>** 如果您使用的是笔记本电脑或没有强大显卡的计算机，请始终选择小尺寸模型以获得更好的性能（除非您有大内存机器且知道自己在做什么）**</p>
            <p>** 请注意，Paiperwork 使用指令来实现其功能，<b>需要指令模型</b>（不要使用基础模型或文本/聊天模型）**</p>
            <p>欢迎界面是您与 Paiperwork 所有交互的起点。</p>
            <p>从这里，您可以：</p>
            <ul>
            <li>通过输入主密钥开始新对话并使用所有应用选项与 AI 交互（不同的主密钥将在数据库中创建分离的聊天/设置/数据）</li>
            <li>通过使用之前输入的主密钥访问您的对话历史</li>
            <li>检查程序更新</li>
            <li>访问帮助文档</li>

                <h4>编辑 Thinking 模型列表</h4>
                <p>在 Models 选项卡中使用<strong>编辑 Thinking 模型列表</strong>按钮，可以控制哪些模型会在 Chat 选项卡中显示 thinking 按钮。</p>
                <ul>
                    <li>该按钮会打开 <code>thinkingmodels.js</code> 列表</li>
                    <li>在 <code>window.THINKING_MODELS</code> 中添加或删除模型名称</li>
                    <li>保存列表后会立即更新 thinking 支持，无需重启应用</li>
                </ul>

                <h4>编辑视觉模型列表</h4>
                <p>在 Models 选项卡中使用<strong>编辑视觉模型列表</strong>按钮，可以控制哪些模型会在 Chat 选项卡中启用图片上传和其他视觉功能。</p>
                <ul>
                    <li>该按钮会打开 <code>visualmodels.js</code> 列表</li>
                    <li>在 <code>window.VISUAL_MODELS</code> 中添加或删除模型标识符</li>
                    <li>保存列表后会立即刷新视觉模型检测，无需重启应用</li>
                </ul>
        </ul>
        
        <div class="note">
            <p><strong>重要：</strong>您输入的主密钥有两个关键用途：</p>
            <ul>
                <li>它可以创建分离的工作环境（使用不同的主密钥）</li>
                    <li>保存文件后即可立即生效，无需重新启动应用程序</li>
            </ul>
            <p>要访问之前的对话，您必须输入创建时使用的<em>完全相同的主密钥</em>（区分大小写）。</p>
        </div>
        
        <div class="note">
            <p><strong>语言兼容性：</strong>虽然 Paiperwork 的界面支持多种语言，但为了获得最佳体验，您应该使用在您首选语言中训练的 AI 模型。如果您使用非英语界面语言，请考虑使用支持您语言的模型以获得最佳结果。在研究或一般聊天等功能中请求信息时，如果您没有获得您语言的回复/结果，您可能需要在提示中指定您的首选响应语言，例如："为什么猫有白色的毛？（用西班牙语提供这项研究）"或"（用法语回答）"以确保 AI 用您期望的语言而不是默认英语回答。</p>
        </div>
        
         <div class="note">
          <p><strong>AI 响应语言：</strong>Paiperwork 现在根据您在主页面（index.html）语言下拉菜单中的选择自动强制 AI 响应您的首选语言。系统自动添加语言强制指令以确保所有 AI 响应与您选择的界面语言匹配。如果您需要在特定对话中使用不同语言的响应，可以通过在聊天标签的系统提示中添加"您总是用[特定语言]回答"来覆盖此设置。（响应语言一致性将取决于 AI 模型质量）</p>
         </div>
        
        <div class="note">
            <p><strong>低端系统兼容性：</strong>Paiperwork 已经过测试并优化，与较小的 AI 模型（如 Qwen3.1 1.7B 和 Gemma3 4B）兼容，以确保在低端系统上的有效性能。这些较小的模型提供良好的结果，同时需要显著更少的 VRAM 和系统资源，使 Paiperwork 对硬件能力有限的用户可访问。</p>
        </div>
        
        <div class="note">
            <p><strong>翻译支持：</strong>如果您在 Paiperwork 中发现任何缺失或不正确的翻译，请在我们的 <a href="https://github.com/discussions" target="_blank" rel="noopener noreferrer">GitHub 讨论</a>中告诉我们。您的反馈帮助我们为所有用户改善多语言体验。</p>
        </div>
    `,
                image: "welcome.png",
                imageAlt: "Paiperwork 欢迎界面",
                imageCaption: "显示主密钥输入字段的 Paiperwork 欢迎界面",
            },
            {
                id: "gs-topics",
                title: "有效使用主密钥",
                content: `
               <p>主密钥是 Paiperwork 工作方式的基础。它们主要为您的对话提供安全性。</p>
               
               <h4>主密钥作为安全密钥</h4>
               <p>您的主密钥充当保护您对话数据的加密密钥。这意味着：</p>
               <ul>
                 <li>主密钥<strong>区分大小写</strong> - "My Project"和"my project"被视为不同的主密钥</li>
                 <li>您必须输入完全相同的主密钥才能访问之前的对话</li>
                 <li>如果您忘记了主密钥，您无法恢复该对话</li>
                 <li>选择简短、易记的主密钥，以便稍后轻松回忆</li>
               </ul>
               
               <h4>创建有效的主密钥</h4>
               <p>为了获得主密钥的最佳效果：</p>
               <ul>
                 <li>保持简短易记（例如，"ItalyTrip2025"或"Garden Plans"）</li>
                 <li>使用您会记住的简单模式（例如，"Home-2023"或"Recipe-Book"）</li>
                 <li>避免带有特殊字符或异常间距的复杂短语</li>
                 <li>考虑使用只有您能识别的个人记忆辅助</li>
               </ul>
               
               <div class="note">
                 <p><strong>提示：</strong>考虑安全记录您经常使用的重要主密钥，特别是对于长期项目。将主密钥视为密码 - 它们需要既易记又安全。</p>
               </div>
             `,
                image: "memorabletopic.png",
                imageAlt: "主密钥输入示例",
                imageCaption: "输入简短、易记主密钥的示例",
            },
            {
                id: "gs-conversation",
                title: "开始对话",
                content: `
                <p>要与 AI 开始新对话：</p>
                <ol>
                    <li>在"在此输入主密钥..."字段中输入主密钥</li>
                    <li>确保您的主密钥既有描述性又易记</li>
                    <li>点击"开始"按钮</li>
                    <li>聊天界面将打开您的新对话</li>
                </ol>
                <p>如果您之前使用过此主密钥，Paiperwork 将加载您之前的对话历史。</p>
                <p>如果这是一个新的主密钥，将开始一个新的对话。</p>
            
                <h4>管理对话</h4>
                <p>在欢迎界面的右上角，您会找到"删除所有信息"按钮。请谨慎使用，因为它将永久删除您所有保存的对话和数据。</p>
            `,
                image: "clickstart.png",
                imageAlt: "开始新对话",
                imageCaption: "输入您的主密钥并点击开始以开始新的聊天会话",
            },
            ],
    },
    chat: {
        title: "聊天",
        intro:
            "聊天界面提供强大的AI对话功能，具有多个高级功能来增强您的交互体验。",
        articles: [
            {
                id: "chat-basics",
                title: "聊天基础",
                content: `
                <p>聊天界面是您与AI对话的地方。它设计直观而强大，具有几个关键功能，帮助您从互动中获得最大收益。</p>
                <div class="note">
                    <p><strong>重要提示：</strong>我们会使用当前日期更新AI系统提示，以提供日期上下文。AI模型可能会对当前事件感到困惑，因为它们的知识截止日期很可能早于当前日期。建议在询问当前事件时使用网络搜索。</p>
                </div>
                <h4>核心聊天元素</h4>
                <ul>
                    <li><strong>消息区域</strong> - 您的对话历史显示在这里，用户消息在右侧，AI回复在左侧</li>
                    <li><strong>输入框</strong> - 在此输入您的消息，按回车键或点击发送提交</li>
                    <li><strong>发送按钮</strong> - 提交您的消息，在AI生成回复期间转换为取消按钮</li>
                    <li><strong>模型选择器</strong> - 根据您的任务需求选择不同的AI模型</li>
                    <li><strong>主密钥显示</strong> - 显示您当前的主密钥（出于安全考虑已屏蔽）。点击可临时显示实际密钥，这有助于确认您当前使用的加密密钥</li>
                </ul>
                
                <h4>主密钥显示功能</h4>
                <p>聊天界面中的主密钥显示帮助您跟踪当前的加密密钥：</p>
                <ul>
                    <li><strong>安全显示</strong> - 默认情况下，主密钥显示为点号（••••••••••••）以保护您的隐私</li>
                    <li><strong>点击显示</strong> - 点击主密钥显示可临时显示实际密钥文本</li>
                    <li><strong>自动隐藏</strong> - 密钥在3秒后自动隐藏以确保安全</li>
                    <li><strong>记忆辅助</strong> - 用于确认您当前使用的主密钥，特别是在处理多个项目时</li>
                </ul>
                
                <h4>消息控制</h4>
                <p>每个AI回复底部都包含操作按钮，允许您：</p>
                <ul>
                    <li><strong>重新生成</strong> - 为您的最后一条消息创建新回复，如果您想要不同的答案时很有用</li>
                    <li><strong>删除</strong> - 从对话中删除消息对（您的消息和AI的回复）</li>
                    <li><strong>复制</strong> - 将AI回复的完整内容复制到您的剪贴板</li>
                </ul>
                
                <h4>取消生成</h4>
                <p>如果您想在AI生成回复时停止它，只需点击红色取消按钮（它替换了发送按钮）。这会立即停止生成过程并标记不完整的回复。</p>
                
                <div class="note">
                    <p><strong>提示：</strong>为了保持对话有序，尝试为不同主题或项目使用不同的主密钥。使用主密钥显示功能确认您在开始重要对话之前处于正确的上下文中。</p>
                </div>
            `,
                images: [
                    {
                        src: "chat_interface.png",
                        alt: "聊天界面",
                        caption:
                            "显示对话控制和消息选项的聊天界面",
                    },
                    {
                        src: "Encrypted-database.png",
                        alt: "聊天和数据的加密数据库",
                        caption: "聊天和数据的加密数据库"
                    }
                ]

            },
            {
                id: "chat-system-prompt",
                title: "使用系统提示",
                content: `
                <p>系统提示是控制AI在对话中行为的强大方式。可以将其视为为AI的个性、知识重点和回复风格设置指令。</p>
                
                <h4>访问系统提示</h4>
                <p>要查看和编辑系统提示：</p>
                <ol>
                    <li>点击聊天界面中的"系统提示"选项卡</li>
                    <li>在大文本框中编辑文本</li>
                    <li>点击"保存"应用您的更改</li>
                </ol>
                
                <h4>有效的系统提示</h4>
                <p>要获得自定义系统提示的最佳效果：</p>
                <ul>
                    <li>明确AI的角色（例如，"您是一个专门从事JavaScript的有用编程助手"）</li>
                    <li>定义回复的首选风格和格式</li>
                    <li>指定任何限制或边界</li>
                    <li>包含AI应关注的任何专业知识领域</li>
                </ul>
                
                <div class="note">
                    <p><strong>注意：</strong>更改系统提示将重置对话上下文，但会出现"继续对话"按钮以帮助维持对话流程。</p>
                </div>
            `,
                image: "system_prompt.png",
                imageAlt: "系统提示编辑器",
                imageCaption:
                    "系统提示编辑器允许您自定义AI的行为",
            },

            {
                id: "chat-insights",
                title: "对话洞察",
                content: `
                <p>洞察功能通过自动学习您的消息来帮助AI随时间更好地了解您。</p>
                
                <h4>洞察工作原理</h4>
                <p>启用后，Paiperwork会分析您的消息以提取有关您的偏好、兴趣和沟通风格的相关信息。这有助于AI在您与其交互的过程中提供更个性化的回复。</p>
                
                <ul>
                    <li><strong>注重隐私</strong> - 洞察使用您的主密钥安全加密并存储在您的设备上</li>
                    <li><strong>选择性分析</strong> - 仅分析包含个人偏好的消息</li>
                    <li><strong>非识别性</strong> - 系统专注于一般特征而不是具体的个人详细信息</li>
                    <li><strong>处理时间</strong> - 如果您使用推理模型，洞察的生成将需要更多时间，因为模型在创建洞察之前会推理一段时间</li>
                </ul>
                
                <h4>管理洞察</h4>
                <p>您对洞察功能拥有完全控制权：</p>
                
                <h5>启用或禁用洞察收集</h5>
                <ol>
                    <li>点击聊天界面中的"聊天"选项卡</li>
                    <li>找到"洞察"切换开关（在顶部）</li>
                    <li>开启或关闭以禁用</li>
                </ol>
                <p>禁用时，不会从您未来的消息中收集新的洞察。之前存储的洞察保留在数据库中，仍将被加载和使用以增强AI对您的理解。</p>
                
                <h5>查看和管理存储的洞察</h5>
                <p>您可以查看、编辑和删除存储的洞察：</p>
                <ol>
                    <li>找到洞察切换开关左侧的小"e"按钮</li>
                    <li>点击此按钮打开洞察编辑器</li>
                    <li>在编辑器窗口中，您可以：</li>
                    <ul>
                        <li><strong>查看</strong> - 查看系统收集的关于您的所有洞察</li>
                        <li><strong>编辑</strong> - 修改任何不准确或需要更新的现有洞察</li>
                        <li><strong>删除</strong> - 删除您不希望AI使用的特定洞察</li>
                        <li><strong>添加</strong> - 手动创建新洞察以指导AI的理解</li>
                    </ul>
                    <li>点击"保存更改"应用您的修改</li>
                </ol>
                <p>保存更改后，系统提示将自动重建以整合您更新的偏好。</p>
                
                <h4>洞察如何始终可用</h4>
                <p>洞察的工作方式与收集切换不同：</p>
                <ul>
                    <li><strong>始终加载</strong> - 当您开始对话时，所有存储的洞察都会自动从数据库加载</li>
                    <li><strong>持续增强</strong> - 您的洞察增强每次对话，帮助AI理解您的偏好</li>
                    <li><strong>切换仅控制收集</strong> - 切换仅控制是否从未来消息创建新洞察</li>
                    <li><strong>手动管理</strong> - 无论切换状态如何，使用"e"按钮管理现有洞察</li>
                </ul>
                
                <h4>分析内容</h4>
                <p>系统选择性地分析包含以下内容的消息：</p>
                <ul>
                    <li>自我引用（以"我"开头的短语，如"我更喜欢..."或"我喜欢..."）</li>
                    <li>更长、更详细的消息（通常5个字以上）</li>
                    <li>包含个人偏好或意见的消息</li>
                </ul>
                
                <div class="note">
                    <p><strong>隐私说明：</strong>所有洞察都使用您的主密钥加密并存储在您的设备上。只有在您输入用于加密的确切主密钥时才能访问它们。洞察在可用时始终加载以增强您的对话，但如果您不再希望使用它们，可以使用洞察编辑器单独删除它们。</p>
                </div>
                `,
                images: [
                    {
                        src: "insights_feature.png",
                        alt: "洞察功能切换",
                        caption: "聊天界面设置选项卡中的洞察切换"
                    },
                    {
                        src: "insights_editor.png",
                        alt: "洞察编辑器",
                        caption: "用于管理存储洞察的洞察编辑器界面"
                    },
                    {
                        src: "Insightslog.png",
                        alt: "洞察功能日志",
                        caption: "浏览器控制台中的洞察日志"
                    }
                ]
            },
            {
                id: "chat-advanced-features",
                title: "高级聊天功能",
                content: `
                         <h4>上下文大小控制</h4>
                         <p>上下文大小决定了AI在生成回复时能够"记住"和使用多少之前的对话内容：</p>
                         <ul>
                             <li><strong>自动上下文大小</strong> - 选择模型时，系统会根据模型的能力自动设置最佳上下文大小</li>
                             <li><strong>模型特定优化</strong> - 检测并应用每个模型的原生上下文窗口</li>
                             <li><strong>资源节约</strong> - 初始限制为8K以防止过度资源使用，但可以手动增加</li>
                             <li><strong>手动调整</strong> - 从下拉菜单中选择所需的上下文大小（从1K到10M个token）以覆盖自动设置</li>
                             <li><strong>持久设置</strong> - 您的上下文大小偏好会在每个模型的会话中被记住</li>
                         </ul>
                         
                         <h5>上下文大小如何影响内存使用</h5>
                         <p>上下文大小对RAM和VRAM（显卡内存）需求有直接影响：</p>
                         <ul>
                             <li><strong>内存计算</strong> - 对于上下文窗口中的每个token，模型需要为注意力计算分配内存</li>
                             <li><strong>比例关系</strong> - 内存使用量与上下文大小呈二次方关系，而非线性关系（上下文大小翻倍可能导致内存需求增加四倍）</li>
                             <li><strong>综合因素</strong> - 总内存使用量取决于模型大小（参数）和上下文长度</li>
                         </ul>
                         
                         <h5>手动上下文大小指南</h5>
                         <p>作为内存需求的一般指南：</p>
                         <ul>
                             <li><strong>4K上下文</strong> - 需要约1GB的VRAM/RAM</li>
                             <li><strong>8K上下文</strong> - 需要约2GB的VRAM/RAM</li>
                             <li><strong>16K上下文</strong> - 需要约4GB的VRAM/RAM</li>
                             <li><strong>32K上下文</strong> - 需要约8GB的VRAM/RAM</li>
                             <li><strong>64K上下文</strong> - 需要约16GB的VRAM/RAM</li>
                             <li><strong>128K+上下文</strong> - 高端系统需要32GB+的VRAM/RAM</li>
                         </ul>
                         
                         <p>当您增加上下文大小时，请注意这些内存压力的迹象：</p>
                         <ul>
                             <li>模型回复无意义或模型在回复中转储系统提示（首先将上下文降低到小设置以验证回复正确，然后谨慎增加）</li>
                             <li>响应生成速度变慢</li>
                             <li>系统响应变慢</li>
                             <li>Ollama内存不足相关错误</li>
                             <li>上下文百分比指示器变为橙色或红色</li>
                         </ul>
                         
                         <div class="note">
                             <p><strong>提示：</strong>如果遇到内存问题，请始终先尝试保守的设置。</p>
                         </div>
                         
                         <h4>原生思维模型（Ollama 0.9.0+）</h4>
                         <p>Paiperwork支持Ollama的原生思维功能，适用于兼容的推理模型，允许AI模型显示其逐步推理过程：</p>
                         
                         <h5>系统要求</h5>
                         <ul>
                             <li><strong>Ollama版本</strong> - 需要Ollama 0.9.0或更高版本以支持原生思维</li>
                             <li><strong>兼容模型</strong> - 适用于启用思维功能的模型，如DeepSeek-R1和qwen3推理模型（未来版本将有更多模型）</li>
                             <li><strong>自动检测</strong> - Paiperwork自动检测您的Ollama版本和模型兼容性</li>
                         </ul>
                         
                         <h5>思维切换按钮</h5>
                         <p>当您选择兼容的思维模型和Ollama 0.9.0+时，思维切换按钮会自动出现：</p>
                         <ul>
                             <li><strong>自动出现</strong> - 按钮仅在Ollama版本和模型都支持思维时显示</li>
                             <li><strong>切换控制</strong> - 点击启用或禁用模型的思维过程显示</li>
                             <li><strong>视觉指示器</strong> - 启用思维时按钮显示活动状态</li>
                             <li><strong>持久设置</strong> - 您的思维偏好会在会话中被记住</li>
                         </ul>
                         
                         <h5>原生思维工作原理</h5>
                         <ul>
                             <li><strong>思维显示</strong> - 启用时，您将在单独的思维部分看到模型的内部推理过程</li>
                             <li><strong>实时处理</strong> - 观察AI在生成回复时逐步解决问题</li>
                             <li><strong>可折叠部分</strong> - 思维内容可以折叠以专注于最终答案</li>
                             <li><strong>性能影响</strong> - 思维模式通常需要更长时间，因为模型处理得更彻底</li>
                         </ul>
                         
                         <h5>非Ollama思维模型</h5>
                         <p>Paiperwork还支持具有内置思维能力但不使用Ollama原生思维API的推理模型：</p>
                         <ul>
                             <li><strong>无切换按钮</strong> - 这些模型不会显示思维切换，因为它们内部处理推理，但会显示思维容器</li>
                             <li><strong>内置推理</strong> - 像Reflection这样的模型可能在正常回复中显示推理</li>
                             <li><strong>系统提示修改</strong> - 像Cogito这样的模型需要在系统提示中添加特殊命令：启用深度思维子程序，其他模型可能需要在系统提示或用户提示中添加此命令（/think，/no_think）</li>
                         </ul>
                         
                         <h5>有效使用思维模型</h5>
                         <ul>
                             <li><strong>复杂问题</strong> - 最适合多步推理、数学问题或复杂分析</li>
                             <li><strong>调试代码</strong> - 非常适合理解AI如何处理代码问题</li>
                             <li><strong>学习工具</strong> - 观察AI如何分解复杂主题以用于教育目的</li>
                             <li><strong>质量对速度</strong> - 启用思维获得更高质量的回复；禁用获得更快、直接的答案</li>
                         </ul>
                         
                         <div class="note">
                             <p><strong>重要：</strong>如果您没有看到思维切换按钮，请检查您是否正在使用Ollama 0.9.0或更高版本并选择了兼容的思维模型。一些较旧的推理模型可能不支持原生思维API，但仍可以在正常回复生成过程中提供推理。</p>
                         </div>
                         
                         <h4>图像上传（视觉模型）</h4>
                         <p>使用视觉AI模型如Mistral small 3.1或Gemma3时，您可以上传图像进行讨论：</p>
                         <ul>
                             <li>点击输入字段旁边的图像按钮</li>
                             <li>从设备中选择图像或拖放到上传区域</li>
                             <li>对于Gemma3模型，您可以一次上传多个图像（最多3张）</li>
                             <li>基于上传的图像进行转录（OCR）、提问或获取描述</li>
                         </ul>
                         
                         <h4>网络搜索集成</h4>
                         <p>启用实时网络搜索以帮助AI提供最新信息：</p>
                         <ul>
                             <li>点击Web按钮切换网络搜索功能</li>
                             <li>启用时，AI可以搜索互联网获取当前信息</li>
                             <li>这对于询问最近事件或特定事实特别有用</li>
                             <li>网络搜索仅将搜索提示发送到网络（Bing.com）进行查询，不会发送个人数据、统计信息或指标</li>
                         </ul>
                         
                         <h4>图像+网络搜索（高级功能）</h4>
                         <p>结合图像分析和网络搜索，实现强大的视觉研究功能：</p>
                         <h5>工作原理</h5>
                         <ol>
                             <li><strong>上传图像</strong> - 使用图像上传按钮添加图像</li>
                             <li><strong>启用网络搜索</strong> - 确保Web按钮已激活（橙色）</li>
                             <li><strong>提出问题</strong> - 描述您想要找到的与图像相关或相似的内容</li>
                             <li><strong>AI分析</strong> - AI首先分析您的图像以生成搜索词</li>
                             <li><strong>网络搜索</strong> - 系统使用AI生成的关键词搜索网络</li>
                             <li><strong>综合回复</strong> - 您会收到视觉分析和网络搜索结果的综合回复</li>
                         </ol>
                         
                         <h5>适用于：</h5>
                         <ul>
                             <li>在线查找相似图像或产品</li>
                             <li>研究建筑风格、艺术品或设计</li>
                             <li>识别植物、动物或物体并提供额外背景</li>
                             <li>获取您拍摄产品的市场信息</li>
                             <li>查找图像的历史或文化背景</li>
                             <li>AI增强的反向图像搜索</li>
                         </ul>
                         
                         <h5>要求：</h5>
                         <ul>
                             <li>选择视觉AI模型（Qwen2.5vl、Mistral-small3.1、Gemma3、LLaVA等）</li>
                             <li>启用网络搜索（Web按钮激活）</li>
                             <li>上传清晰、高质量的图像（大小：最大5mb）</li>
                             <li>网络搜索功能需要互联网连接</li>
                         </ul>
                         
                         <h5>使用示例：</h5>
                         <p class="example-prompt"><strong>示例提示：</strong>"查找与这把椅子相似的图像和信息。我正在寻找具有相似设计元素的中世纪现代作品，想了解定价和购买地点。"</p>
                         <p>这将导致：</p>
                         <ol>
                             <li>AI分析椅子的风格、材料和设计特征</li>
                             <li>网络搜索"中世纪现代椅子木腿软垫座椅设计家具"</li>
                             <li>综合回复包含视觉分析+相似产品+定价+零售商</li>
                         </ol>
                         
                         <div class="note">
                             <p><strong>专业提示：</strong>要具体说明您想要找到什么。而不是简单地说"查找相似图像"，尝试"查找1950年代的相似复古海报及定价信息"或"识别这种植物并找到护理说明"。</p>
                         </div>
                         
                        <h4>导出对话</h4>
                         <p>您可以以不同格式导出整个对话历史：</p>
                         <ul>
                             <li>导航到聊天选项卡并滚动到界面底部</li>
                             <li>点击位于"清除当前会话"按钮上方的"导出对话"按钮</li>
                             <li>从纯文本（.txt）、markdown（.md）或HTML（.html）格式中选择</li>
                             <li>下载的文件包含所有消息并保留代码格式</li>
                         </ul>
                     `,
                images: [
                    {
                        src: "chat_advanced_features.png",
                        alt: "上下文大小计算器",
                        caption: "上下文计算器界面"
                    },
                    {
                        src: "chat_export.png",
                        alt: "聊天导出",
                        caption: "聊天导出功能"
                    },
                    {
                        src: "thinking_toggle_button.png",
                        alt: "原生思维切换",
                        caption: "与兼容模型和Ollama 0.9.0+一起出现的思维切换按钮"
                    }
                ]
            },
            {
                id: "chat-code-blocks",
                title: "使用代码块",
                content: `
                <p>Paiperwork为对话中的代码块提供增强支持：</p>
                
                <h4>代码块功能</h4>
                <ul>
                    <li><strong>语法高亮</strong> - 根据编程语言进行颜色编码</li>
                    <li><strong>语言检测</strong> - AI自动识别并标记代码语言</li>
                    <li><strong>复制按钮</strong> - 一键复制代码块到剪贴板</li>
                    <li><strong>行号</strong> - 便于在较长片段中引用</li>
                </ul>
                
                <h4>运行代码</h4>
                <p>对于支持的语言，您可以直接从聊天界面运行代码：</p>
                <ul>
                    <li><strong>HTML预览</strong> - 渲染HTML代码以立即查看结果。提示：要求AI在HTML中包含任何CSS或JavaScript代码以避免错误，因为HTML代码将在浮动窗口中沙盒化，无法访问其他配置或代码文件</li>
                </ul>
                
                <div class="note">
                    <p><strong>安全说明：</strong>代码执行在隔离的沙盒中进行以确保安全。</p>
                </div>
            `,

                images: [
                    {
                        src: "code_blocks.png",
                        alt: "代码块功能",
                        caption:
                            "具有语法高亮和执行选项的HTML代码块",
                    },
                    {
                        src: "HTML-sandboxed.png",
                        alt: "在沙盒中运行的HTML代码",
                        caption: "在沙盒化浮动窗口中运行的HTML代码。"
                    }
                ]
            },
            {
                id: "chat-scroll-behavior",
                title: "滚动和导航",
                content: `
                <p>聊天界面包含智能滚动行为以增强对话期间的可用性：</p>
                
                <h4>自动滚动</h4>
                <ul>
                    <li>新消息自动滚动到视图中</li>
                    <li>在AI回复生成期间，视图跟随消息增长</li>
                    <li>当您手动向上滚动阅读先前消息时，自动滚动暂时禁用</li>
                    <li>不活动期间（大约5秒）后自动滚动重新启用</li>
                    <li>如果您滚动到底部，自动滚动立即重新启用</li>
                </ul>
                
                <h4>长对话</h4>
                <p>对于导航长对话：</p>
                <ul>
                    <li>自由滚动查看较早的消息</li>
                    <li>粘性导航栏在顶部保持可访问</li>
                    <li>对系统提示或上下文大小的更改将添加"继续对话"按钮以帮助维持上下文，还要注意如果您的上下文用完，继续按钮将出现（继续按钮将始终根据您当前的上下文大小计算要回顾多少过去消息，并使用其25%以避免过去消息溢出您的上下文）</li>
                </ul>
            `,
            },
            {
                id: "chat-conversation-sessions",
                title: "管理对话会话",
                content: `
                <p>Paiperwork将您的对话组织成会话组，帮助您跟踪同一主题内的不同讨论线程。</p>
                
                <h4>对话会话列表</h4>
                <p>聊天视图中的左侧边栏显示您的对话会话：</p>
                <ul>
                    <li>每个会话显示第一条消息的预览</li>
                    <li>会话显示创建的日期和时间</li>
                    <li>会话由细微的分隔线分隔，便于区分</li>
                    <li>最近的会话显示在顶部</li>
                </ul>
                
                <h4>使用会话</h4>
                <ul>
                    <li><strong>加载会话</strong> - 点击任何会话加载对话</li>
                    <li><strong>删除会话</strong> - 悬停在会话上并点击出现的"×"按钮</li>
                    <li><strong>活动会话</strong> - 当前加载的会话被高亮显示</li>
                </ul>
                
                <h4>开始新对话</h4>
                <p>在不更改主题的情况下开始新对话：</p>
                <ol>
                    <li>点击会话列表顶部的"新建聊天"按钮</li>
                    <li>这清除当前对话并重置上下文</li>
                    <li>出现欢迎消息表示您已开始新对话</li>
                    <li>所有先前的会话在侧边栏中保持可访问</li>
                </ol>
                
                <h4>继续对话</h4>
                <p>当您选择先前的会话时：</p>
                <ul>
                    <li>加载完整的对话历史</li>
                    <li>底部出现"继续对话"按钮</li>
                    <li>点击此按钮以完整上下文恢复对话</li>
                    <li>输入框保持禁用状态，直到您点击继续，防止意外消息</li>
                </ul>
                
                <div class="note">
                    <p><strong>注意：</strong>删除会话是永久性的，无法撤销。当您删除对话组时，只删除该特定线程 - 同一主密钥内的所有其他会话保持完整。</p>
                </div>
            `,
                image: "conversations-list.png",
                imageAlt: "对话会话界面",
                imageCaption: "显示多个对话线程的会话列表，包含预览文本和时间戳",
            },
        ],
    },
    documents: {
        title: "文档",
        intro: "文档选项卡允许您上传、管理文档，并使用AI助手与文档进行交互。",
        articles: [
            {
                id: "docs-intro",
                title: "文档介绍",
                content: `
                <p>文档选项卡使您能够处理文本和PDF文档，利用AI帮助您理解和提取文档信息。</p>
                
                <p>使用文档功能，您可以：</p>
                <ul>
                    <li>上传PDF和文本文件</li>
                    <li>对特定文档提问</li>
                    <li>生成全面的摘要</li>
                    <li>在您的文档集合中搜索</li>
                    <li>管理您的文档库</li>
                </ul>
                
                <div class="note">
                    <p><strong>注意：</strong>文档使用您的主密钥进行安全加密，并本地存储在您的设备上，确保您的敏感信息保持私密。</p>
                </div>
            `,
                image: "documents_intro.png",
                imageAlt: "文档选项卡概览",
                imageCaption: "显示上传区域和文档列表的文档选项卡界面",
            },
            {
                id: "docs-model-compatibility",
                title: "文档模型兼容性",
                content: `
                <p>文档功能需要支持嵌入的AI模型才能正常运行。了解模型兼容性将帮助您避免问题并优化您的文档工作流程。</p>
                
                <h4>模型和嵌入支持</h4>
                <p>为了使文档处理和搜索功能正常工作，您需要支持生成嵌入的模型：</p>
                <ul>
                  <li><strong>兼容模型</strong>包括：nomic-embed-text、llama3（各种大小）、mistral、mixtral，以及其他专门设计支持嵌入的模型（Deepseek、Qwen等）</li>
                  <li><strong>不兼容模型</strong>：某些模型不支持嵌入，如果您尝试在文档功能中使用它们，将触发警告通知</li>
                  <li><strong>视觉模型</strong>：视觉模型有时会从其代码中删除嵌入处理</li>
                </ul>
                
                <h4>嵌入警告系统</h4>
                <p>当您尝试使用不支持嵌入的模型进行文档操作时，系统将：</p>
                <ul>
                  <li>显示显著的警告通知</li>
                  <li>解释所选模型与文档搜索功能不兼容</li>
                  <li>建议支持嵌入的替代模型</li>
                  <li>提供查找支持嵌入模型的链接</li>
                </ul>
                <p>警告通知将在30秒后自动消失，或者您可以点击"我明白"按钮手动关闭。</p>
                
                <h4>工作流程优化</h4>
                <p>您可以通过了解何时创建和使用嵌入来优化您的文档工作流程：</p>
                <ul>
                  <li><strong>初始文档处理</strong>：首次上传和处理文档时创建嵌入</li>
                  <li><strong>后续文档查询</strong>：文档处理后，您可以切换到不同的模型（支持嵌入）进行查询，而无需重新生成嵌入</li>
                </ul>
                
                <h4>为不同任务使用不同模型</h4>
                <p>有用的工作流策略：</p>
                <ol>
                  <li>上传和处理文档时选择较小的支持嵌入的模型（如nomic-embed-text）</li>
                  <li>文档处理后，您可以切换到更强大的模型（支持嵌入）以获得更好的问答效果</li>
                  <li>无论您当前选择哪个模型，系统都将使用原始处理时存储的嵌入</li>
                </ol>
                
                <div class="note">
                  <p><strong>专业提示：</strong>为获得最佳效果，使用专用嵌入模型如nomic-embed-text进行初始文档处理，然后切换到更大的语言模型如llama3:70b、Gemma3、Qwen3等，进行更复杂的文档查询和分析。</p>
                </div>
              `,
                image: "model-embedding-warning.png",
                imageAlt: "模型嵌入警告",
                imageCaption: "尝试使用不支持嵌入的模型时的警告通知"
            },
            {
                id: "docs-uploading",
                title: "上传文档",
                content: `
                <p>您可以通过上传界面轻松将文档添加到您的库中。</p>
                
                <h4>如何上传文档</h4>
                <ol>
                    <li>导航到文档选项卡</li>
                    <li>将PDF或文本文件拖放到上传区域，或点击上传区域浏览文件</li>
                    <li>从您的设备选择一个或多个文件</li>
                    <li>等待处理完成</li>
                </ol>
                
                <h4>处理您的文档</h4>
                <p>当您上传文档时，系统将：</p>
                <ul>
                    <li>检查PDF文件是否包含可提取的文本内容</li>
                    <li>将内容分割成可管理的块</li>
                    <li>创建内容的AI友好表示（嵌入）</li>
                    <li>安全加密并在本地存储所有内容</li>
                    <li>使文档可用于提问和搜索</li>
                </ul>
                
                <h4>PDF文本检测</h4>
                <p>Paiperwork自动检查PDF文件以确保它们包含可提取的文本：</p>
                <ul>
                    <li>在处理开始前分析每个PDF以检测文本内容</li>
                    <li>如果PDF不包含可提取的文本（如未经OCR的扫描图像），您将收到警告通知</li>
                    <li>没有文本的PDF无法进行RAG处理，因为它们需要文本内容进行嵌入和搜索</li>
                    <li>对于仅图像的PDF，考虑使用视觉AI模型进行文本提取或OCR工具在上传前将图像转换为文本</li>
                </ul>
                
                <div class="note">
                    <p><strong>重要：</strong>上传和处理文件时，请使用文档选项卡中的<strong>Embedding模型</strong>选择器。该选择器会显示支持embedding的模型，并自动选择第一个可用模型。</p>
                    <p>如果没有可用的Embedding模型，会弹出信息窗口，显示示例模型名称，并提供<strong>前往下载模型</strong>按钮以打开模型选项卡。</p>
                    <p><strong>说明：</strong>全局文档搜索使用聊天选项卡模型选择器中当前选定的模型。</p>
                </div>
            `,
                image: "documents-upload.png",
                imageAlt: "文档上传过程",
                imageCaption: "带有文档处理进度指示器的上传区域",
            },
            {
                id: "docs-management",
                title: "管理您的文档",
                content: `
                <p>上传后，您的文档会出现在文档列表中，您可以在那里管理它们。</p>
                
                <h4>文档信息</h4>
                <p>每个文档条目显示：</p>
                <ul>
                    <li>文档标题/文件名</li>
                    <li>作者信息（如果可用）</li>
                    <li>添加到库的日期</li>
                    <li>页数（PDF文件）</li>
                    <li>创建的文本块数量</li>
                    <li>处理状态（处理中或已索引）</li>
                </ul>
                
                <h4>文档操作</h4>
                <p>您可以对文档执行几个操作：</p>
                <ul>
                    <li><strong>选择/取消选择</strong> - 点击文档以选择它并访问其他选项</li>
                    <li><strong>删除</strong> - 从您的库中移除文档</li>
                    <li><strong>生成摘要</strong> - 创建文档内容的全面摘要</li>
                    <li><strong>提问</strong> - 进入文档模式以询问有关文档的具体问题</li>
                </ul>
            `,
                image: "documents_management.png",
                imageAlt: "文档管理界面",
                imageCaption: "显示文档条目和操作按钮的文档管理界面",
            },
            {
                id: "docs-summaries",
                title: "文档摘要",
                content: `
                <p>摘要功能创建文档内容的全面概述，帮助您快速了解其关键点。</p>
                
                <h4>生成摘要</h4>
                <ol>
                    <li>从您的库中选择一个文档（点击它）</li>
                    <li>点击出现的"生成摘要"按钮</li>
                    <li>等待AI阅读和分析您的文档</li>
                    <li>在模态窗口中查看生成的摘要</li>
                </ol>
                
                <h4>摘要功能</h4>
                <ul>
                    <li><strong>进度跟踪</strong> - 观察进度条，了解AI处理文档的进度</li>
                    <li><strong>增量显示</strong> - 对于较长的文档，实时查看摘要的构建过程</li>
                    <li><strong>复制按钮</strong> - 一键复制整个摘要到剪贴板</li>
                    <li><strong>取消选项</strong> - 如需要可停止摘要生成</li>
                </ul>
                
                <h4>上下文大小要求</h4>
                <p>文档摘要越大，您的AI模型需要的上下文就越多。一般准则：</p>
                <ul>
                    <li><strong>小文档</strong>（少于5,000字）- 4K上下文大小通常足够</li>
                    <li><strong>中等文档</strong>（5,000-15,000字）- 建议8K上下文大小</li>
                    <li><strong>大文档</strong>（15,000-50,000字）- 16K或更大的上下文大小</li>
                    <li><strong>超大文档</strong>（50,000+字）- 32K或更大的上下文大小</li>
                </ul>
                <p>作为参考，典型的单倍行距页面包含大约500字，因此20页PDF需要至少8K上下文才能有效摘要。</p>
                
                <div class="note">
                    <p><strong>提示：</strong>对于大文档，系统会分批处理它们，然后创建总体摘要，确保即使是冗长的内容也能获得全面覆盖。</p>
                </div>
            `,
                image: "document_summary.png",
                imageAlt: "文档摘要模态框",
                imageCaption: "显示生成的文档概述和复制选项的摘要模态框",
            },
            {
                id: "docs-questioning",
                title: "询问文档相关问题",
                content: `
                <p>文档模式允许您与AI专门就单个文档进行对话。</p>
                
                <h4>进入文档模式</h4>
                <ol>
                    <li>从您的库中选择一个文档</li>
                    <li>点击"提问"按钮</li>
                    <li>系统将重定向您到启用文档模式的聊天选项卡</li>
                    <li>将出现特殊指示器显示您处于文档模式</li>
                </ol>
                
                <h4>使用文档模式</h4>
                <ul>
                    <li>询问有关文档内容的具体问题</li>
                    <li>请求解释文档中提到的概念</li>
                    <li>要求比较不同部分</li>
                    <li>请求文档中包含的事实信息</li>
                </ul>
                
                <h4>退出文档模式</h4>
                <p>当您完成处理特定文档时：</p>
                <ul>
                    <li>点击指示器栏上的"退出文档模式"按钮</li>
                    <li>您将返回到正常聊天模式，可以讨论一般话题</li>
                </ul>
                
                <div class="note">
                    <p><strong>重要：</strong>在文档模式下，AI专门专注于所选文档的内容，使用其知识来帮助解释，但不添加外部信息。</p>
                </div>

                <div class="note">
                    <p><strong>云模型说明：</strong>使用免费层级的云模型时，由于RAG提示内容较大，在"提问"模式下回复可能会受限或被截断。如果需要稳定且完整的长回复，建议使用付费云服务层级。</p>
                </div>
            `,
                image: "document_mode.png",
                imageAlt: "文档模式界面",
                imageCaption: "询问特定文档问题时显示文档模式指示器的聊天界面",
            },
            {
                id: "docs-searching",
                title: "跨文档搜索",
                content: `
                <p>Paiperwork使您能够直接从聊天界面轻松搜索所有已上传文档中的信息。</p>
                
                <h4>全局文档搜索</h4>
                <p>当您在文档选项卡中时，您通过聊天界面提出的任何问题都将自动搜索您的所有文档：</p>
                <ol>
                    <li>首先切换到文档选项卡以激活文档搜索功能</li>
                    <li>在聊天输入字段中输入您的搜索查询或问题</li>
                    <li>AI将自动搜索您的所有文档以获取相关信息</li>
                    <li>来自多个文档的结果将合并成一个全面的答案</li>
                </ol>
                
                <h4>搜索结果</h4>
                <p>使用文档搜索时，AI将：</p>
                <ul>
                    <li>在收集信息时显示"搜索文档..."指示器</li>
                    <li>在您的所有文档中找到最相关的段落</li>
                    <li>优先考虑来自不同文档的结果以提供全面覆盖</li>
                    <li>使用语义搜索来理解您查询的含义，而不仅仅是匹配关键词</li>
                    <li>生成综合所有相关文档信息的回应</li>
                    <li>适当时包含对源文档的引用</li>
                </ul>
                
                <h4>语义vs关键词搜索</h4>
                <p>Paiperwork使用理解您问题背后含义的语义搜索技术：</p>
                <ul>
                    <li>您可以用自然语言提问，而不使用特定关键词</li>
                    <li>系统将找到概念相关的信息，即使确切术语不同</li>
                    <li>搜索具有上下文感知能力，理解同义词和相关概念</li>
                    <li>结果按与您特定问题的相关性排序</li>
                </ul>
                
                <div class="note">
                    <p><strong>提示：</strong>为获得最佳结果，询问您要查找信息的具体问题，而不是使用通用搜索词。例如，询问"2024年季度销售数据是什么？"而不是仅仅"销售数据"。</p>
                </div>
            `,
            },
            {
                id: "docs-memory-limits",
                title: "内存限制和最佳实践",
                content: `
                <p>在Paiperwork中处理文档时，了解内存使用如何影响性能很重要，特别是在使用全局文档搜索时。</p>
                
                <h4>全局搜索的内存考虑</h4>
                <p>全局文档搜索（同时搜索所有文档）可能会占用大量内存，因为：</p>
                <ul>
                    <li>所有相关文档块必须一次性加载到内存中</li>
                    <li>AI模型需要处理这些块和您的查询</li>
                    <li>与桌面应用程序相比，Web浏览器的内存分配有限</li>
                    <li>随着文档数量和大小的增加，内存需求呈指数增长</li>
                </ul>
                
                <h4>内存压力的迹象</h4>
                <p>注意这些指示您接近内存限制的迹象：</p>
                <ul>
                    <li>浏览器变得缓慢或无响应</li>
                    <li>在选项卡之间切换时出现长时间延迟</li>
                    <li>关于"内存不足"或类似警告的错误消息</li>
                    <li>浏览器选项卡崩溃或冻结</li>
                    <li>AI回应意外终止</li>
                </ul>
                
                <h4>文档管理最佳实践</h4>
                <p>为避免在处理文档时出现内存问题：</p>
                <ul>
                    <li><strong>使用文档特定模式</strong> - 处理大文档时，选择特定文档并使用"提问"进入文档模式，而不是全局搜索</li>
                    <li><strong>限制全局搜索使用</strong> - 将全局搜索保留给较小文档集合的场景，或当您特别需要在多个文档中查找信息时</li>
                    <li><strong>策略性组织文档</strong> - 将相关文档分组，以便您可以处理有针对性的子集而不是您的整个库</li>
                    <li><strong>关闭其他应用程序</strong> - 处理大文档时，关闭其他内存密集型应用程序和浏览器选项卡</li>
                    <li><strong>偶尔重启</strong> - 对于扩展的文档工作会话，定期重启浏览器以清除内存</li>
                </ul>
                
                <h4>文档大小建议</h4>
                <p>全局搜索的一般准则：</p>
                <ul>
                    <li><strong>安全使用</strong>：5-10个小到中等文档（每个少于20页）</li>
                    <li><strong>需要谨慎</strong>：10-20个文档或几个较大的文档（20-50页）</li>
                    <li><strong>不建议</strong>：20+个文档或多个大文档（50+页）</li>
                </ul>
                
                <div class="note">
                    <p><strong>重要：</strong>全局文档搜索设计用于方便访问适度的文档集合。对于涉及大文档或大量集合的密集研究，请改用文档特定询问模式。这将内存资源集中在一次一个文档上，提供更好的性能和稳定性。</p>
                </div>
            `,
            }
        ],
    },
    dataviz: {
        title: "数据可视化",
        intro:
            "数据可视化选项卡允许您通过向AI描述数据来创建交互式数据可视化图表。",
        articles: [
            {
                id: "dataviz-intro",
                title: "数据可视化简介",
                content: `
                <p>数据可视化选项卡让您能够通过自然语言描述数据来生成各种图表和图形。只需选择可视化类型并向AI描述您的数据即可。</p>
                
                <p>使用数据可视化，您可以：</p>
                <ul>
                    <li>从文本描述创建可视化图表</li>
                    <li>无需手动格式化数据即可生成图表</li>
                    <li>从多种可视化类型中选择</li>
                    <li>在交互式窗口中立即查看结果</li>
                    <li>复制生成的可视化图表以在其他应用程序中使用</li>
                </ul>
                
                <p>数据可视化非常适合快速可视化概念、比较数据点或探索趋势，无需使用电子表格或专业工具。</p>
            `,
                image: "dataviz_intro.png",
                imageAlt: "数据可视化选项卡概览",
                imageCaption:
                    "显示可视化类型选项的数据可视化选项卡界面",
            },
            {
                id: "dataviz-types",
                title: "可用的可视化类型",
                content: `
                <p>数据可视化提供多种可视化选项，以适应不同类型的数据和分析需求：</p>
                
                <h4>饼图</h4>
                <p>最适合显示整体的比例或比较总数的各部分。理想用于：</p>
                <ul>
                    <li>市场份额分布</li>
                    <li>预算分配</li>
                    <li>调查回复分析</li>
                    <li>任何组成部分总和为100%的数据</li>
                </ul>
                
                <h4>柱状图</h4>
                <p>非常适合比较不同类别的数量。适用于：</p>
                <ul>
                    <li>按地区比较销售额</li>
                    <li>人口统计</li>
                    <li>多选题调查结果</li>
                    <li>不同时间段的绩效指标</li>
                </ul>
                
                <h4>折线图</h4>
                <p>理想用于显示时间趋势或连续数据。适用于：</p>
                <ul>
                    <li>股票价格随时间变化</li>
                    <li>温度变化</li>
                    <li>收入增长</li>
                    <li>任何具有明确进展的数据</li>
                </ul>
                
                <h4>散点图</h4>
                <p>最适合显示两个变量之间的关系。非常适合：</p>
                <ul>
                    <li>相关性分析</li>
                    <li>分布模式</li>
                    <li>识别异常值</li>
                    <li>聚类相似数据点</li>
                </ul>
                
                <h4>面积图</h4>
                <p>类似于折线图，但在线条下方填充区域。适用于：</p>
                <ul>
                    <li>显示随时间变化的体积</li>
                    <li>比较累计总数</li>
                    <li>可视化随时间变化的部分与整体关系</li>
                    <li>强调变化幅度</li>
                </ul>
                
                <h4>雷达图</h4>
                <p>将多变量数据显示为具有三个或更多定量变量的二维图表。理想用于：</p>
                <ul>
                    <li>多维度性能比较</li>
                    <li>技能评估</li>
                    <li>产品功能比较</li>
                    <li>任何需要比较多个属性的数据</li>
                </ul>
                
                <h4>热力图</h4>
                <p>使用颜色强度表示矩阵格式中的值。非常适合：</p>
                <ul>
                    <li>相关矩阵</li>
                    <li>地理数据强度</li>
                    <li>网站点击模式</li>
                    <li>显示复杂数据集中的模式</li>
                </ul>
                
                <h4>气泡图</h4>
                <p>类似于散点图，但通过气泡大小表示额外维度。适用于：</p>
                <ul>
                    <li>比较三维数据</li>
                    <li>投资组合分析</li>
                    <li>资源分配可视化</li>
                    <li>人口统计比较</li>
                </ul>
            `,
                image: "chart_types.png",
                imageAlt: "图表类型",
                imageCaption: "数据可视化中可用的各种可视化类型",
            },
            {
                id: "dataviz-usage",
                title: "创建可视化图表",
                content: `
                <p>使用数据可视化创建数据可视化图表很简单：</p>
                
                <h4>第1步：选择可视化类型</h4>
                <ol>
                    <li>导航到数据可视化选项卡</li>
                    <li>浏览可用的图表类型</li>
                    <li>点击您首选的可视化类型（饼图、柱状图、折线图等）</li>
                </ol>
                
                <h4>第2步：描述您的数据</h4>
                <ol>
                    <li>选择图表类型后，您将返回到聊天界面</li>
                    <li>注意输入字段现在显示了为您选择的图表量身定制的专门提示</li>
                    <li>用自然语言描述您想要可视化的数据</li>
                    <li>尽可能具体地描述类别、数值和关系</li>
                </ol>
                
                <h4>第3步：生成并查看可视化图表</h4>
                <ol>
                    <li>AI将处理您的描述并生成合适的图表</li>
                    <li>浮动窗口将显示可视化图表</li>
                    <li>如果图表不符合您的期望，您可以通过提供更清晰的说明来修改它</li>
                </ol>
                
                <div class="note">
                    <p><strong>提示：</strong>为了获得最佳结果，请在描述中包含具体的数值。例如，不要说"第二季度销售额更高"，而要说"第一季度销售额为12,000美元，第二季度为15,500美元"。</p>
                </div>
            `,
                image: "dataviz_create.png",
                imageAlt: "创建可视化图表",
                imageCaption:
                    "从文本描述创建数据可视化图表的过程",
            },
            {
                id: "dataviz-examples",
                title: "示例提示",
                content: `
                <p>以下是一些示例提示，帮助您开始使用不同的可视化类型：</p>
                
                <h4>饼图示例</h4>
                <p class="example-prompt">"创建一个显示浏览器市场份额的饼图，Chrome占65%，Safari占18%，Firefox占8%，Edge占5%，其他占4%。"</p>
                
                <h4>柱状图示例</h4>
                <p class="example-prompt">"生成一个比较2024年第一季度月销售额的柱状图：1月45,000美元，2月52,000美元，3月61,000美元。"</p>
                
                <h4>折线图示例</h4>
                <p class="example-prompt">"显示2023年纽约平均气温的折线图：1月32°F，2月34°F，3月42°F，4月52°F，5月63°F，6月72°F，7月78°F，8月77°F，9月70°F，10月58°F，11月47°F，12月38°F。"</p>
                
                <h4>多系列示例</h4>
                <p class="example-prompt">"创建一个比较不同年龄组智能手机使用时长的柱状图：青少年（14小时/周），年轻成年人（12小时/周），中年人（8小时/周），老年人（4小时/周）。还包括社交媒体使用时长：青少年（10小时/周），年轻成年人（8小时/周），中年人（5小时/周），老年人（2小时/周）。"</p>
                
                <h4>散点图示例</h4>
                <p class="example-prompt">"生成一个显示10名学生学习时间（x轴）和考试成绩（y轴）关系的散点图：(2小时, 65%), (3小时, 70%), (5小时, 85%), (8小时, 95%), (4小时, 75%), (6小时, 90%), (2小时, 60%), (7小时, 92%), (3.5小时, 72%), (5.5小时, 88%)。"</p>
                
                <h4>雷达图示例</h4>
                <p class="example-prompt">"创建一个雷达图，比较三款智能手机在五个类别的表现：手机A（电池：90，相机：85，性能：95，设计：80，价格：70），手机B（电池：75，相机：95，性能：90，设计：85，价格：65），手机C（电池：95，相机：75，性能：80，设计：90，价格：85）。"</p>
                
                <h4>热力图示例</h4>
                <p class="example-prompt">"创建一个热力图，显示2025年不同编程语言与其在各行业领域受欢迎程度之间的相关性。包括以下语言的数据：Python（AI/ML：98，金融：85，医疗：70，游戏：60，电商：92），JavaScript（金融：95，医疗：55，游戏：75，电商：98，媒体：90），Rust（金融：45，医疗：35，游戏：90，物联网：80，网络安全：85），Go（金融：55，医疗：45，游戏：35，物联网：95，云计算：85），PHP（电商：60，媒体：50，教育：40，政府：30，医疗：35）。使用从浅蓝到深蓝的颜色标度，较深的颜色表示较高的采用率。"</p>

                <h4>气泡图示例</h4>
                <p class="example-prompt">"生成一个比较不同国家可再生能源采用情况的气泡图。x轴显示人均GDP（美国：65000，德国：48000，中国：12000，印度：2500，巴西：7000，日本：40000）。y轴显示可再生能源在总能源结构中的百分比（美国：20%，德国：45%，中国：25%，印度：35%，巴西：85%，日本：30%）。使用气泡大小表示人口（单位：百万）（美国：330，德国：83，中国：1400，印度：1380，巴西：212，日本：126）。用国家名称标记每个气泡，并将图表标题设为'可再生能源采用与经济发展对比（2025年）'。"</p>
                
                <div class="note">
                    <p><strong>注意：</strong>如果您的第一次尝试没有产生您想要的确切可视化图表，请尝试用更具体的类别、数值和关系细节来完善您的描述。</p>
                </div>
            `,
                image: "dataviz_examples.png",
                imageAlt: "可视化示例",
                imageCaption:
                    "从文本描述创建的可视化图表示例",
            },
            {
                id: "dataviz-advanced",
                title: "高级技巧",
                content: `
                <p>使用这些高级技巧充分利用数据可视化：</p>
                
                <h4>自定义可视化图表</h4>
                <p>您可以在提示中请求特定的自定义设置：</p>
                <ul>
                    <li>"为图表使用蓝色和绿色"</li>
                    <li>"制作堆叠柱状图"</li>
                    <li>"在饼图切片上显示百分比"</li>
                    <li>"对y轴使用对数刻度"</li>
                </ul>
                
                <h4>处理复杂数据</h4>
                <p>对于较大的数据集：</p>
                <ul>
                    <li>将复杂数据分解为逻辑组</li>
                    <li>考虑使用多个图表来讲述完整的故事</li>
                    <li>使用趋势和模式而不是每个数据点</li>
                    <li>明确说明要显示哪些维度，要省略哪些维度</li>
                </ul>
                
                <h4>处理生成失败</h4>
                <p>如果您的图表生成失败：</p>
                <ul>
                    <li>确保您已指定精确的数值</li>
                    <li>检查您的数据是否适合所选的图表类型</li>
                    <li>将复杂描述简化为更清晰、结构化的信息</li>
                    <li>减少类别或数据点的数量</li>
                </ul>
                
                <h4>取消图表生成</h4>
                <p>如果您需要停止图表生成：</p>
                <ul>
                    <li>点击加载窗口中的"取消"按钮</li>
                    <li>进程将立即终止</li>
                    <li>然后您可以用修改后的提示重新尝试</li>
                </ul>
                
                <div class="note">
                    <p><strong>重要提示：</strong>当您切换到不同的选项卡时，数据可视化模式将自动停用，您将返回到正常对话模式。</p>
                </div>
            `,
                image: "dataviz_advanced.png",
                imageAlt: "高级数据可视化技巧",
                imageCaption:
                    "创建自定义可视化图表的高级技巧",
            },
        ],
    },
    paperworks: {
        title: "文书",
        intro:
            "文书选项卡帮助您在AI协助下创建和管理专业文书模板和表单，同时保持所有数据的私密性和本地存储。",
        articles: [
            {
                id: "paperworks-intro",
                title: "文档处理简介",
                content: `
                <p>文档处理选项卡提供了一个强大的文档创建系统，帮助您使用AI协助生成专业文档、模板和表单。</p>
                
                <p>文档处理选项卡的主要功能包括：</p>
                <ul>
                    <li>为常见商业需求预设计的文档模板</li>
                    <li>在AI指导下创建自定义模板</li>
                    <li>用于数据收集的表单生成</li>
                    <li>文档预览和编辑</li>
                    <li>多种格式的导出选项</li>
                </ul>
                
                <p>所有文档处理都在本地和您的设备上进行，确保您的敏感商业信息保持私密和安全。与Paiperwork的所有功能一样，文档处理使用您的主加密密钥来保护任何保存的模板或表单。</p>
            `,
                image: "paperworks_intro.png",
                imageAlt: "文档处理选项卡概览",
                imageCaption:
                    "文档处理仪表板显示文档创建选项",
            },
            {
                id: "paperworks-templates",
                title: "文档模板",
                content: `
                <p>文档处理选项卡显示了一个文档模板网格，您可以从中选择创建各种专业文档。</p>
                
                <h4>可用模板类型</h4>
                <ul>
                    <li><strong>会议纪要</strong> - 创建结构化的专业会议纪要</li>
                    <li><strong>商业信函</strong> - 生成专业的商业信函</li>
                    <li><strong>技术报告</strong> - 创建包含章节和图像的详细技术报告</li>
                    <li><strong>合同</strong> - 创建法律合同文档</li>
                    <li><strong>提案</strong> - 生成引人注目的商业提案</li>
                    <li><strong>备忘录</strong> - 创建专业的公司备忘录</li>
                </ul>
                
                <h4>使用模板</h4>
                <p>从模板创建文档：</p>
                <ol>
                    <li>从网格中点击一个模板卡片</li>
                    <li>在表单字段中填入所需信息</li>
                    <li>点击"生成文档"来创建您的文档</li>
                    <li>预览、编辑或导出您完成的文档</li>
                </ol>
                
                <div class="note">
                    <p><strong>注意：</strong>模板是可自定义的起点。您可以修改任何生成的文档以更好地满足您的具体需求。</p>
                </div>
            `,
                image: "document_templates.png",
                imageAlt: "文档模板网格",
                imageCaption: "文档模板选择网格",
            },
            {
                id: "paperworks-technical-reports",
                title: "创建技术报告",
                content: `
                <p>技术报告创建器提供了强大的文档设计功能，具备直观的可视化编辑器和AI协助。</p>
                
                <h4>可视化模板设计器</h4>
                <p>当您选择技术报告模板时，您将访问可视化模板设计器，允许您：</p>
                <ul>
                    <li>使用可视化编辑器设计专业的多页文档</li>
                    <li>通过从侧边栏添加不同的章节类型来构建您的报告</li>
                    <li>简单地自定义布局和结构</li>
                    <li>通过简单上传添加图像和视觉元素</li>
                    <li>准确预览文档在打印时的外观</li>
                    <li>最大化设计器窗口以获得全屏编辑体验</li>
                </ul>
                
                <h4>可用章节类型</h4>
                <ul>
                    <li><strong>文档标题</strong> - 报告的标题和副标题</li>
                    <li><strong>章节标题</strong> - 将您的报告分为逻辑章节</li>
                    <li><strong>文本区域</strong> - 用于段落和较长的文本内容</li>
                    <li><strong>文本+图像（右侧）</strong> - 右侧带图像的文本</li>
                    <li><strong>图像+文本（右侧）</strong> - 右侧带文本的图像</li>
                    <li><strong>图片库</strong> - 多个图像的网格布局</li>
                    <li><strong>图片行</strong> - 图像的水平排列，可选标题</li>
                    <li><strong>分割线</strong> - 章节间的视觉分隔符</li>
                    <li><strong>空白空间</strong> - 可调整的空白区域，具有调整大小功能</li>
                </ul>
                
                <h4>智能布局功能</h4>
                <ul>
                    <li><strong>多页支持</strong> - 内容自动跨多页流动</li>
                    <li><strong>分页符</strong> - 可视化指示器显示内容在页面间的分割位置</li>
                    <li><strong>自动分页</strong> - 自动添加页码</li>
                    <li><strong>A4格式</strong> - 标准文档尺寸，具有适当的边距</li>
                    <li><strong>章节控制</strong> - 使用易于访问的按钮移动、编辑或删除章节</li>
                    <li><strong>灵活间距</strong> - 选择扩展空章节以填满页面</li>
                </ul>
                
                <h4>内容增强</h4>
                <ul>
                    <li><strong>AI增强</strong> - 使用AI协助一键改进文本内容</li>
                    <li><strong>直接编辑</strong> - 直接在预览中编辑文本，实现所见即所得体验</li>
                    <li><strong>图像上传</strong> - 拖放或点击上传图像</li>
                    <li><strong>内容占位符</strong> - 有用的占位符显示在哪里添加内容</li>
                    <li><strong>撤销功能</strong> - 如需要可撤销AI增强</li>
                    <li><strong>直接翻译</strong> - 在文本开头添加"翻译成（语言）："并点击AI增强</li>
                </ul>
                <h4>字体选择和PDF预览</h4>
                <ul>
                    <li><strong>字体选择</strong> - 使用编辑器上方的下拉菜单从各种字体中选择</li>
                    <li><strong>字体预览</strong> - 实时查看您的文档使用不同字体的外观</li>
                    <li><strong>字体持久性</strong> - 您选择的字体在会话间保持一致性</li>
                    <li><strong>预览PDF</strong> - 查看您的文档作为PDF显示的准确预览</li>
                    <li><strong>页面布局</strong> - 准确查看内容如何在适当的A4尺寸页面上分布</li>
                    <li><strong>分页符</strong> - 预览显示文档页面间的清晰分页符指示器</li>
                </ul>               

                <h4>使用PDF预览</h4>
                <ol>
                    <li>点击字体选择器旁边的"预览"按钮</li>
                    <li>将打开一个模态窗口，显示您的文档作为PDF格式的外观</li>
                    <li>每页以适当的A4尺寸显示，具有精确的布局定位</li>
                    <li>检查分页并确保内容适当分布</li>
                    <li>完成后关闭预览返回编辑</li>
                </ol>
                <h4>创建技术报告</h4>
                <ol>
                    <li>在设计器顶部输入您报告的名称</li>
                    <li>点击右侧面板的设计预设将其添加到您的文档中</li>
                    <li>通过直接在章节中点击和输入来填充每个章节的内容</li>
                    <li>通过点击图像占位符上传图像</li>
                    <li>使用可编辑文本区域下方的AI按钮增强文本</li>
                    <li>使用上下箭头控制重新排列章节</li>
                    <li>完成后，保存您的报告并导出或打印</li>
                </ol>
                
                <div class="note">
                    <p><strong>提示：</strong>使用右上角的最大化按钮最大化编辑器窗口，以获得更舒适的大型文档编辑体验。界面自动调整以在常规和最大化视图中提供最佳布局。</p>
                </div>
                `,
                images: [
                    {
                        src: "technical_report_designer.png",
                        alt: "技术报告",
                        caption:
                            "显示文档布局和章节类型的可视化技术报告设计器",
                    },
                    {
                        src: "preview-window-technical-report.png",
                        alt: "技术报告的预览窗口",
                        caption: "技术报告的预览窗口"
                    }
                ]
            },
            {
                id: "paperworks-document-generation",
                title: "文档生成",
                content: `
                <p>文档处理使用AI协助帮助您根据输入生成专业的文档内容。</p>
                
                <h4>文档生成流程</h4>
                <ol>
                    <li>选择一个文档模板</li>
                    <li>在所需的表单字段中填入您的信息</li>
                    <li>点击"生成文档"来创建您的文档</li>
                    <li>审查生成的内容</li>
                    <li>根据需要编辑或完善内容</li>
                    <li>导出或保存您的最终文档</li>
                </ol>
                
                <h4>AI增强</h4>
                <p>AI协助可以帮助您：</p>
                <ul>
                    <li>专业地格式化您的内容</li>
                    <li>建议适当的措辞和术语</li>
                    <li>确保整个文档的一致性</li>
                    <li>基于您的输入生成完整的章节</li>
                </ul>
                
                <div class="note">
                    <p><strong>注意：</strong>要使用AI增强功能，请确保您首先在聊天选项卡中选择了AI模型。</p>
                </div>
            `,
                image: "document_generation.png",
                imageAlt: "文档生成流程",
                imageCaption: "文档生成表单界面",
            },
            {
                id: "paperworks-export",
                title: "导出文档",
                content: `
                <p>创建和完善文档后，您可以将其导出为各种格式。</p>
                
                <h4>可用导出选项</h4>
                <ul>
                    <li><strong>文本导出</strong> - 复制带有格式的文本，准备粘贴到任何文本处理器中</li>
                    <li><strong>电子邮件</strong> - 打开您的默认电子邮件程序，填写主题和邮件正文</li>
                </ul>
                
                <h4>导出您的文档</h4>
                <ol>
                    <li>生成文档后，审查预览</li>
                    <li>根据需要进行最终调整</li>
                    <li>点击适当的导出按钮（复制、电子邮件）</li>
                    <li>按照提示保存或发送您的文档</li>
                </ol>
                
                <p>所有导出的文档都保持预览中的格式和样式，确保无论格式如何都能专业呈现。</p>
            `,
                image: "document_export.png",
                imageAlt: "文档导出选项",
                imageCaption: "显示格式选项的文档导出界面",
            },
        ],
    },
    research: {
        title: "研究",
        intro: "研究选项卡提供强大的AI辅助研究功能和个人知识库，用于存储和检索信息。",
        articles: [
            {
                id: "research-intro",
                title: "研究工具介绍",
                content: `
                <p>研究选项卡提供两个强大的工具来帮助您收集、分析和存储信息：</p>
                
                <ul>
                    <li><strong>研究助手</strong> - AI驱动的网络研究，帮助您查找、分析和综合任何主题的信息</li>
                    <li><strong>知识库</strong> - 个人数据库，您可以在其中存储、组织和检索重要信息以供将来参考</li>
                </ul>
                
                <h4>隐私和数据安全</h4>
                <p>研究选项卡保持Paiperwork对隐私和数据安全的承诺：</p>
                <ul>
                    <li><strong>需要互联网连接</strong> - 研究助手需要互联网连接来执行网络搜索</li>
                    <li><strong>有限的数据传输</strong> - 只有搜索查询会发送到互联网（通过必应搜索）。绝不会传输个人或商业数据</li>
                    <li><strong>本地处理</strong> - 所有搜索结果都由您选择的AI模型在您的设备上本地处理</li>
                    <li><strong>加密存储</strong> - 研究结果和知识库条目使用您的主密钥在本地数据库中加密</li>
                    <li><strong>完全离线知识库</strong> - 知识库完全在本地运行，一旦创建条目就不需要互联网连接</li>
                </ul>
                
                <h4>在工具之间切换</h4>
                <p>使用研究选项卡顶部的子选项卡导航在研究助手和知识库之间切换：</p>
                <ul>
                    <li>点击<strong>研究</strong>使用AI驱动的网络搜索和分析工具</li>
                    <li>点击<strong>知识库</strong>访问您存储的信息集合</li>
                </ul>
                
                <div class="note">
                    <p><strong>重要提示：</strong>研究选项卡使用聊天选项卡中当前选择的模型。在使用研究功能之前，请确保在聊天选项卡中选择合适的模型。对于研究任务，非推理模型（如Mistral3、Qwen2.5或LLaMA）表现最佳。</p>
                    <p><strong>性能提示：</strong>使用推理AI模型（如Cogito、Qwen3或Deepseek R1）会显著增加研究时间，因为这些模型在流程的每个步骤都会进行详细思考。为了获得更快的研究结果，建议使用更直接处理信息的标准指令模型。</p>
                </div>
                `,
                image: "research_tab_overview.png",
                imageAlt: "研究选项卡概览",
                imageCaption: "研究选项卡显示研究助手和知识库之间的子选项卡导航"
            },
            {
                id: "research-assistant",
                title: "使用研究助手",
                content: `
                <p>研究助手结合网络搜索、AI分析和报告生成，帮助您彻底研究任何主题。</p>
                
                <h4>开始您的研究</h4>
                <ol>
                    <li>确保您已在聊天选项卡中选择了合适的模型（研究选项卡使用您的聊天选项卡模型）</li>
                    <li>在输入字段中输入您的研究问题</li>
                    <li>选择报告大小（详细说明如下）</li>
                    <li>如果需要，配置深度搜索选项（详细说明如下）</li>
                    <li>点击"研究"按钮开始研究过程</li>
                </ol>
                
                <h4>报告大小选项</h4>
                <p>根据您的需求和可用系统资源选择适当的报告大小：</p>
                <ul>
                    <li><strong>简洁</strong> - 包含核心事实的500-800字简要摘要
                        <br><em>推荐上下文：8K-16K（2-4GB显存/内存）</em></li>
                    <li><strong>标准</strong> - 包含关键细节的1000-1500字平衡报告
                        <br><em>推荐上下文：16K-32K（4-8GB显存/内存）</em></li>
                    <li><strong>详细</strong> - 2000-3000字综合分析
                        <br><em>推荐上下文：32K-64K（8-16GB显存/内存）</em></li>
                    <li><strong>全面</strong> - 4000-5000字深入研究
                        <br><em>推荐上下文：64K-128K（16-32GB显存/内存）</em></li>
                    <li><strong>广泛</strong> - 6000+字彻底探索，包含最大细节
                        <br><em>推荐上下文：128K+（高端系统需32GB+显存/内存）</em></li>
                </ul>
                
                <div class="note">
                    <p><strong>上下文需求解释：</strong>研究助手分多个阶段处理信息 - 首先总结各个来源，然后批量生成部分报告，最后将所有内容合并为最终报告。较大的报告需要更多上下文来保持所有来源的连贯性并确保全面分析。如果您遇到内存问题或报告不完整，请尝试减少报告大小或在聊天选项卡中增加上下文大小。</p>
                </div>
                
                <h4>优化研究性能</h4>
                <p>为获得最佳研究结果：</p>
                <ul>
                    <li><strong>将报告大小与您的系统匹配</strong> - 使用聊天选项卡中的上下文计算器确定最佳设置</li>
                    <li><strong>监控内存使用</strong> - 注意内存压力的迹象，如报告不完整或系统变慢</li>
                    <li><strong>考虑深度搜索的影响</strong> - 多级深度搜索会显著增加需要处理的内容量</li>
                    <li><strong>使用适当的模型</strong> - 非推理模型（Mistral、Qwen2.5、LLaMA）处理研究比推理模型更快</li>
                </ul>
                
                <h4>深度搜索配置</h4>
                <p>深度搜索功能提供增强的研究能力和精细控制：</p>
                <ul>
                    <li><strong>启用/禁用切换</strong> - 为您的研究会话打开或关闭深度搜索</li>
                    <li><strong>搜索深度</strong> - 选择1-3级链接跟踪：
                        <ul>
                            <li>级别1：跟踪搜索结果的直接链接</li>
                            <li>级别2：跟踪第一级发现页面的链接</li>
                            <li>级别3：最大深度探索以获得全面覆盖</li>
                        </ul>
                    </li>
                    <li><strong>每页链接数</strong> - 选择从每个发现页面跟踪1-5个链接</li>
                    <li><strong>增强PDF处理</strong> - 启用后，深度搜索自动检测并处理PDF文档，具有增强的提取功能</li>
                </ul>
                <p>将鼠标悬停在深度搜索选项上可查看详细工具提示，解释每个设置对研究彻底性和处理时间的影响。</p>
                
                <h4>带浮动窗口的研究过程</h4>
                <p>当您启动研究时，系统会显示一个浮动进度窗口，显示：</p>
                <ol>
                    <li><strong>查询生成</strong> - 基于您的研究问题创建优化的搜索查询</li>
                    <li><strong>网络搜索</strong> - 使用多个目标查询搜索网络</li>
                    <li><strong>内容分析</strong> - 分析并从搜索结果中提取关键信息</li>
                    <li><strong>PDF检测和处理</strong> - 自动识别PDF文档并使用增强提取功能处理它们</li>
                    <li><strong>深度搜索执行</strong> - 如果启用，按照您指定的深度和数量跟踪链接</li>
                    <li><strong>报告生成</strong> - 将所有收集的信息合成为您选择的报告大小</li>
                </ol>
                
                <p>浮动进度窗口提供实时更新，允许您：</p>
                <ul>
                    <li>监控当前研究阶段和进度</li>
                    <li>随时取消研究过程</li>
                    <li>查看预计完成时间</li>
                    <li>跟踪正在处理的源数量</li>
                </ul>
                
                <h4>增强PDF处理</h4>
                <p>研究助手包含高级PDF处理功能：</p>
                <ul>
                    <li><strong>自动检测</strong> - 使用多种模式识别搜索结果中的PDF文档（文件扩展名、URL模式、学术来源）</li>
                    <li><strong>增强提取</strong> - 对学术论文和技术文档使用专门的提取方法</li>
                    <li><strong>内容集成</strong> - 将PDF内容无缝集成到研究综合中</li>
                    <li><strong>来源归属</strong> - 保持对原始PDF来源的清晰引用</li>
                </ul>
                
                <div class="note">
                    <p><strong>性能提示：</strong>具有更高深度级别和每页更多链接的深度搜索提供更全面的结果，但会增加研究时间。PDF处理会增加额外时间，但显著提高学术和技术主题的研究质量。</p>
                </div>
                `,
            },

            {
                id: "research-results",
                title: "处理研究结果",
                content: `
                <p>研究完成后，系统会在可编辑的浮动窗口中生成综合研究报告。</p>
                
                <h4>研究结果窗口功能</h4>
                <p>研究结果出现在浮动窗口中，提供：</p>
                <ul>
                    <li><strong>完全可编辑</strong> - 点击内容区域的任何位置直接编辑研究报告</li>
                    <li><strong>实时编辑</strong> - 更改内容、添加您自己的笔记或重新组织部分</li>
                    <li><strong>来源链接管理</strong> - 根据需要编辑、更新或删除来源引用</li>
                    <li><strong>可最大化界面</strong> - 展开窗口以进行全屏编辑和查看</li>
                    <li><strong>拖拽和重新定位</strong> - 将窗口移动到您首选的屏幕位置</li>
                </ul>
                
                <h4>研究报告结构</h4>
                <p>研究报告结构清晰、全面：</p>
                <ul>
                    <li><strong>执行摘要</strong> - 关键发现和主要结论</li>
                    <li><strong>详细分析</strong> - 按子主题组织的综合检查</li>
                    <li><strong>支持证据</strong> - 来自来源的相关数据、引用和示例</li>
                    <li><strong>结论</strong> - 综合见解和影响</li>
                    <li><strong>来源参考</strong> - 完整引用和指向原始内容的可点击链接</li>
                </ul>
                
                <h4>编辑研究内容</h4>
                <p>研究结果完全可编辑，允许您：</p>
                <ul>
                    <li>添加您自己的分析和评论</li>
                    <li>重新组织部分以获得更好的流程</li>
                    <li>突出显示对您特定需求重要的关键发现</li>
                    <li>删除不相关的信息</li>
                    <li>更新或更正来源信息</li>
                    <li>添加额外的上下文或解释</li>
                </ul>
                
                <h4>导出选项</h4>
                <p>通过集成的导出工具，研究结果可以导出为多种格式：</p>
                <ul>
                    <li><strong>纯文本（.txt）</strong> - 删除markdown格式的干净文本格式，实现通用兼容性</li>
                    <li><strong>Markdown（.md）</strong> - 保留markdown语法中的格式、结构、标题和链接</li>
                    <li><strong>HTML（.html）</strong> - 具有适当样式、转换的markdown元素和可点击链接的完整格式</li>
                </ul>
                
                <h4>保存到知识库</h4>
                <p>将研究保存到知识库时，您有增强的选项：</p>
                <ul>
                    <li><strong>集合选择</strong> - 选择现有集合或在保存过程中创建新集合</li>
                    <li><strong>单独保存来源</strong> - 选择将来源参考作为单独条目保存在知识库中</li>
                    <li><strong>内容自定义</strong> - 保存您编辑的版本，包括您所做的任何修改</li>
                    <li><strong>元数据保存</strong> - 保持研究日期、查询和参数以供将来参考</li>
                </ul>
                
                <h4>窗口管理</h4>
                <p>浮动结果窗口提供：</p>
                <ul>
                    <li><strong>可调整大小的界面</strong> - 拖拽角落以调整大小以获得最佳查看</li>
                    <li><strong>最小化/最大化</strong> - 暂时隐藏或展开到全屏</li>
                    <li><strong>保持在顶部</strong> - 选择在其他区域工作时保持结果可见</li>
                    <li><strong>多窗口支持</strong> - 在开始新研究时保持以前的研究结果打开</li>
                </ul>
                
                <div class="note">
                    <p><strong>专业提示：</strong>利用编辑功能为您的特定需求自定义研究报告。您可以添加个人见解、重新组织内容，并在保存到知识库之前创建个性化的知识资源。</p>
                </div>
                `,
                image: "research_results_editable.png",
                imageAlt: "可编辑的研究结果窗口",
                imageCaption: "显示编辑功能和导出选项的浮动研究结果窗口"
            },

            {
                id: "knowledge-base-intro",
                title: "知识库概览",
                content: `
                <p>知识库允许您存储、组织和手动浏览您想要保留以供将来参考的信息集合。</p>
                
                <h4>知识库结构</h4>
                <p>您的知识组织为集合和条目：</p>
                <ul>
                    <li><strong>集合</strong> - 包含相关条目的文件夹或类别（例如"项目研究"或"烹饪食谱"）</li>
                    <li><strong>条目</strong> - 存储在集合中的个别信息片段</li>
                </ul>
                
                <h4>创建集合</h4>
                <ol>
                    <li>在"新集合名称..."字段中输入新集合的名称</li>
                    <li>点击"创建集合"按钮</li>
                    <li>您的新集合将出现在下面的集合列表中</li>
                </ol>
                
                <h4>管理集合</h4>
                <p>列表中的每个集合都有几个操作按钮：</p>
                <ul>
                    <li><strong>查看</strong> - 打开集合以查看其内容</li>
                    <li><strong>编辑</strong> - 重命名集合</li>
                    <li><strong>导出</strong> - 将集合及其条目保存到文件</li>
                    <li><strong>删除</strong> - 删除集合及其所有条目</li>
                </ul>
                
                <h4>存储和组织</h4>
                <p>知识库作为一个简单但有效的存储系统：</p>
                <ul>
                    <li><strong>手动组织</strong> - 浏览您的集合以查找存储的信息</li>
                    <li><strong>研究存储</strong> - 非常适合存储来自研究助手的完整研究报告</li>
                    <li><strong>个人笔记</strong> - 存储您自己的笔记、想法和信息</li>
                    <li><strong>无需搜索</strong> - 通过有组织的集合进行简单浏览</li>
                </ul>
                
                <div class="note">
                    <p><strong>重要提示：</strong>知识库数据使用您的主密钥加密并本地存储在您的设备上。这确保了隐私，但也意味着您必须使用相同的主密钥在未来的会话中访问您的知识。</p>
                </div>
                `,
                image: "knowledge_base_collections.png",
                imageAlt: "知识库集合",
                imageCaption: "显示带有管理选项的集合列表的知识库"
            },
            {
                id: "knowledge-entries",
                title: "处理知识条目",
                content: `
                <p>知识条目是存储在集合中的个别信息片段。</p>
                
                <h4>知识条目类型</h4>
                <p>您可以在知识库中创建两种类型的条目：</p>
                <ul>
                    <li><strong>手动条目</strong> - 您直接写入或粘贴的信息</li>
                    <li><strong>研究条目</strong> - 从研究报告中保存的信息</li>
                </ul>
                
                <h4>创建新条目</h4>
                <ol>
                    <li>通过点击"查看"按钮打开集合</li>
                    <li>点击集合视图顶部的"+ 新条目"按钮</li>
                    <li>为您的条目输入标题</li>
                    <li>在文本区域中添加您的内容（支持Markdown格式）</li>
                    <li>点击"保存条目"将其添加到您的集合中</li>
                </ol>
                
                <h4>查看和管理条目</h4>
                <p>从集合视图中，您可以：</p>
                <ul>
                    <li>点击任何条目以查看其完整内容</li>
                    <li>使用"编辑条目"按钮修改条目的内容</li>
                    <li>使用"删除条目"按钮删除条目</li>
                    <li>点击"← 返回条目"按钮返回集合视图</li>
                </ul>
                
                <h4>Markdown支持</h4>
                <p>创建或编辑条目时，您可以使用Markdown格式：</p>
                <ul>
                    <li><strong>标题</strong> - 使用#表示标题级别1，##表示级别2，等等</li>
                    <li><strong>格式</strong> - 使用*斜体*表示斜体，**粗体**表示粗体文本</li>
                    <li><strong>列表</strong> - 使用*创建项目符号列表或使用1.、2.等创建编号列表</li>
                    <li><strong>链接</strong> - 使用[文本](URL)语法创建链接</li>
                </ul>
                
                <div class="note">
                    <p><strong>提示：</strong>Markdown格式使您的条目更有组织和可读性，特别是对于技术或结构化内容。</p>
                </div>
            `,
                image: "knowledge_entries.png",
                imageAlt: "知识条目",
                imageCaption: "显示多个知识条目的集合视图"
            },
            {
                id: "knowledge-browse",
                title: "浏览您的知识库",
                content: `
                <p>知识库提供了一种简单的方式来浏览和组织您通过集合和条目存储的信息。</p>
                
                <h4>导航集合</h4>
                <ol>
                    <li>从知识库主视图中，您将看到列出的所有集合</li>
                    <li>点击任何集合的"查看"以查看其内容</li>
                    <li>浏览每个集合中的条目</li>
                    <li>点击单个条目以阅读其完整内容</li>
                </ol>
                
                <h4>查找信息</h4>
                <p>要在知识库中找到特定信息：</p>
                <ul>
                    <li><strong>按集合浏览</strong> - 检查与您的主题相关的集合</li>
                    <li><strong>描述性命名</strong> - 为集合和条目使用清晰、描述性的名称</li>
                    <li><strong>逻辑组织</strong> - 将相关信息分组到同一集合中</li>
                    <li><strong>手动查看</strong> - 浏览条目以找到您需要的内容</li>
                </ul>
                
                <h4>组织技巧</h4>
                <p>为了有效的知识管理：</p>
                <ul>
                    <li>为不同的项目、主题或时间段创建集合</li>
                    <li>为集合和条目使用清晰、描述性的标题</li>
                    <li>考虑基于日期的研究报告组织</li>
                    <li>将相关信息保存在同一集合中</li>
                </ul>
                
                <div class="note">
                    <p><strong>提示：</strong>前期良好的组织使以后查找信息变得更加容易。在添加许多条目之前，考虑您的命名约定和集合结构。</p>
                </div>
                `,
            },
            {
                id: "research-to-knowledge",
                title: "从研究到知识",
                content: `
                <p>研究选项卡最强大的功能之一是研究助手和知识库之间的集成。</p>
                
                <h4>将研究保存到知识库</h4>
                <p>完成研究会话后：</p>
                <ol>
                    <li>点击研究结果窗口中的"保存到知识库"按钮</li>
                    <li>选择现有集合或创建新集合</li>
                    <li>确认您的选择以保存研究</li>
                </ol>
                
                <p>研究报告将作为新条目保存在您选择的集合中，包括：</p>
                <ul>
                    <li>完整的研究报告内容</li>
                    <li>原始研究问题作为条目标题</li>
                    <li>关于何时进行研究的元数据</li>
                    <li>研究中的所有来源</li>
                </ul>
                
                <h4>来源管理</h4>
                <p>将研究保存到知识库时，您可以选择处理来源的方式：</p>
                <ul>
                    <li><strong>保存时包含来源</strong> - 包括所有参考链接和引用</li>
                    <li><strong>仅保存内容</strong> - 仅保存研究内容而不包含来源</li>
                </ul>
                
                <h4>构建您的知识库</h4>
                <p>通过定期将研究保存到知识库，您可以：</p>
                <ul>
                    <li>建立个人验证信息库</li>
                    <li>避免重复研究您已经探索过的主题</li>
                    <li>在新项目中快速参考以前的发现</li>
                    <li>在相关主题之间创建连接</li>
                </ul>
                
                <div class="note">
                    <p><strong>专业提示：</strong>为不同的兴趣领域或项目创建主题集合，然后使用搜索功能在整个知识库中查找连接。</p>
                </div>
            `,
                image: "research_to_knowledge.png",
                imageAlt: "将研究保存到知识库",
                imageCaption: "将研究结果保存到知识库集合的对话框"
            }
        ],
    },
    artworks: {
        title: "设计工作室",
        intro:
            "设计工作室选项卡允许您使用AI视觉模型来分析设计选择，基于视觉设计生成网站原型，并为图像创建文本叠加。",
        articles: [
            {
                id: "artworks-getting-started",
                title: "视觉设计工作室入门",
                content: `
                    <div class="note">
                        <p><strong>初始发布：</strong> 艺术作品选项卡是一个新功能，目前处于初始发布阶段。我们很高兴与您分享这个创新的AI驱动设计工具，并希望听到您的反馈和对未来添加和改进的想法。您的建议有助于我们让Paiperwork变得更好！</p>
                    </div>
                    
                    <p>艺术作品选项卡提供AI驱动的工具，将图像转换为功能性网页设计并分析视觉构图。</p>
                    
                    <h4>要求和设置</h4>
                    <ul>
                        <li><strong>需要视觉AI模型</strong> - 您需要在Ollama中安装具有视觉功能的模型（Gemma4、Qwen3.5、Qwen3.6、Kimi或其他具有视觉功能的Ollama模型）</li>
                        <li><strong>模型选择</strong> - 从选项卡顶部的下拉菜单中选择您的视觉模型</li>
                        <li><strong>图像要求</strong> - 上传清晰、高质量的图像（最大5MB），支持PNG、JPEG、GIF或WebP格式</li>
                        <li><strong>文本叠加编辑</strong> - 文本叠加模式会生成基于 JSON 的 canvas 叠加层，其中的文本、形状、线条和装饰元素都可以编辑。</li>
                        <li><strong>网站样式克隆</strong> - 在文本叠加模式下，您可以选择提供一个网站 URL，让 AI 复用该网站的外链 Web 字体和 CSS 颜色。</li>
                        <li><strong>风格迁移编辑</strong> - 风格迁移模式允许您在预览中编辑文本并替换结果中的图片。</li>
                    </ul>
                    <h4>兼容的视觉模型</h4>
                    <ul>
                        <li><strong>Gemma4</strong> - Google 最新的视觉模型，具有强大的图像理解和代码感知推理能力</li>
                        <li><strong>Qwen3.5</strong> - 高性能视觉模型，具有出色的多模态能力</li>
                        <li><strong>Qwen3.6</strong> - 先进的视觉模型，具有改进的设计、布局和文本处理能力</li>
                        <li><strong>Kimi</strong> - 高效的视觉模型，用于快速设计预览和图像感知工作流</li>
                        <li>任何其他具有视觉功能的Ollama模型</li>
                    </ul>
                    
                    <h4>安装视觉模型</h4>
                    <p>如果没有兼容的模型可用：</p>
                    <ol>
                        <li>从警告屏幕点击"转到模型选项卡"</li>
                        <li>使用Ollama安装具有视觉功能的模型</li>
                        <li>安装完成后返回视觉设计工作室</li>
                    </ol>
                    
                    <div class="note">
                        <p><strong>重要提示：</strong> 当切换离开艺术作品选项卡时，图像数据会从内存中清除以防止资源使用问题，聊天上下文会重置为常规对话。</p>
                    </div>
                `,
                image: "artworks_intro.png",
                imageAlt: "视觉设计工作室概览",
                imageCaption: "艺术作品选项卡界面，显示模型选择和上传区域",
            },
            {
                id: "artworks-workflow",
                title: "设计工作流程和模式",
                content: `
                <h4>完整工作流程</h4>
                <ol>
                    <li><strong>选择视觉模型</strong> - 从下拉菜单中选择（选择会保存供未来会话使用）</li>
                    <li><strong>选择设计模式</strong> - 选择HTML样式转换或文本叠加</li>
                    <li><strong>上传图像</strong> - 拖放或点击上传（系统分析尺寸和方向）</li>
                    <li><strong>可选网站样式参考</strong> - 在文本叠加模式下添加网站 URL，以提取该网站的候选字体和颜色</li>
                    <li><strong>编写说明</strong> - 提供具体指导（占位符文本根据模式变化）</li>
                    <li><strong>生成和预览</strong> - 点击"生成设计"或按Enter键；结果在交互式预览窗口中打开</li>
                </ol>
                
                <h4>设计模式说明</h4>
                
                <h5>HTML样式转换</h5>
                <ul>
                    <li>将视觉设计元素转换为功能性HTML/CSS代码</li>
                    <li>提取配色方案、布局和样式模式</li>
                    <li>"用作背景图像"选项会将上传的实际图像融入其中</li>
                    <li>非常适合将设计灵感转换为Web界面</li>
                </ul>
                
                <h5>文本叠加</h5>
                <ul>
                    <li>分析图像以找到最佳文本放置区域</li>
                    <li>生成结构化的叠加层 JSON，并作为 canvas 预览渲染在上传图像之上</li>
                    <li>可以包含文本、装饰形状、线条、装饰元素、外链 Web 字体以及从网站提取的颜色</li>
                    <li>生成后，您可以直接在预览中编辑文本，并移动选中的叠加元素</li>
                    <li>考虑图像尺寸和方向以进行适当定位</li>
                    <li>非常适合营销材料、横幅和产品展示</li>
                </ul>
                
                <h4>图像管理</h4>
                <ul>
                    <li><strong>上传过程</strong> - 系统显示尺寸、方向（横向/纵向/正方形）和宽高比</li>
                    <li><strong>背景选项</strong> - 在样式转换模式中，选择是否在生成的代码中包含实际图像</li>
                    <li><strong>替换图像</strong> - 点击预览上的"×"以上传新图像</li>
                </ul>
                
                <div class="note">
                    <p><strong>提示：</strong> 在说明字段中按Enter键（不按Shift）可在满足所有要求时立即开始生成。</p>
                </div>
            `,
            },
            {
                id: "artworks-examples",
                title: "示例说明和最佳实践",
                content: `
                <h4>HTML样式转换示例</h4>
                
                <h5>野兽派网站（综合示例）</h5>
                <p class="example-prompt">"创建一个野兽派风格的网站，包含所有常见的标题按钮和页脚链接，在视口中间创建一个写着'登录'的按钮，使用图像中的颜色作为网站所有组件的调色板，包括页面和页脚/标题的背景色（使其半透明），确保背景图像填充网页主体，页脚粘贴在视口底部"</p>
                
                <h5>现代电商网站</h5>
                <p class="example-prompt">"将此转换为现代电商产品页面，包含简洁的导航栏、产品画廊部分、客户评论区域和突出的'加入购物车'按钮。使用图像中的配色方案，创建带有大量留白的极简布局。"</p>
                
                <h5>创意作品集</h5>
                <p class="example-prompt">"创建一个创意作品集网站，包含全屏英雄区域、动画导航菜单、项目展示网格和联系表单。从图像中提取艺术配色方案，并在整个设计中应用，带有微妙的渐变和悬停效果。"</p>
                
                <h5>企业着陆页</h5>
                <p class="example-prompt">"设计一个专业的企业着陆页，包含标题导航、带有号召性用语的英雄区域、三列功能区、推荐轮播和带有公司链接的页脚。使用图像中的精致配色方案来传达信任和权威感。"</p>
                
                <h5>餐厅/美食网站</h5>
                <p class="example-prompt">"将此转换为诱人的餐厅网站，包含菜单部分、预订表单、菜品照片画廊、厨师故事和位置信息。使用美食图像中的温暖诱人颜色，营造舒适、欢迎的氛围。"</p>
                
                <h4>文本叠加示例</h4>
                
                <h5>产品展示</h5>
                <p class="example-prompt">"将以下text添加到此产品图像：主标题：'优质无线耳机'，副标题：'沉浸式音响体验'，主要功能：'降噪 • 30小时续航 • 蓝牙5.0'，价格：'$149.99'，号召性用语按钮：'立即购买'"</p>
                
                <h5>活动宣传</h5>
                <p class="example-prompt">"创建宣传文本叠加：活动标题：'2024夏季音乐节'，日期：'2024年7月15-17日'，地点：'纽约中央公园'，头条艺人：'特色艺人待定'，票务信息：'早鸟票$89'，按钮：'购买门票'"</p>

                <h5>匹配网站风格的海报</h5>
                <p class="example-prompt">"使用上传的图片创建一张简洁的活动海报。使用参考网站中的外链字体和 CSS 颜色，在可读性允许的情况下，让主标题、辅助文案和行动按钮分别使用不同的网站字体，并且只有在能改善构图时才添加简单的分隔线或徽章。"</p>
                
                <h4>编写有效说明</h4>
                <ul>
                    <li><strong>具体明确</strong> - 包含设计风格、目标受众和所需的关键组件</li>
                    <li><strong>提及图像元素</strong> - 引用上传图像中的特定颜色、布局或功能</li>
                    <li><strong>说明网站参考目标</strong> - 如果您提供了网站 URL，请说明是否希望在叠加层中保留该网站的字体、配色或两者都保留</li>
                    <li><strong>定义目的</strong> - 解释目标（营销、作品集、电商等）</li>
                    <li><strong>请求叠加层功能</strong> - 指定首选文本位置、装饰线条或形状，以及多个文本块是否应使用不同的网站字体</li>
                </ul>
                
                <h4>选择合适的图像</h4>
                <ul>
                    <li><strong>样式转换</strong> - 使用具有独特设计元素和清晰配色方案的图像</li>
                    <li><strong>文本叠加</strong> - 选择具有清晰文本放置区域的图像</li>
                    <li><strong>质量很重要</strong> - 高分辨率、光线良好的图像产生更好的结果</li>
                </ul>
                
                <div class="note">
                    <p><strong>专业提示：</strong> 在HTML样式转换模式中使用"用作背景图像"时，系统会自动处理图像集成，并在占位符注释中准确显示图像的使用位置。</p>
                </div>
            `,

                images: [
                    {
                        src: "artworks_examples.png",
                        alt: "示例说明",
                        caption:
                            "耳机宣传原型设计说明示例",
                    },
                    {
                        src: "artworks_examples2.png",
                        alt: "最终原型结果",
                        caption: "耳机宣传设计原型示例",
                    },
                ]

            },
            {
                id: "artworks-results-management",
                title: "结果处理和故障排除",
                content: `
                <h4>生成过程</h4>
                <ul>
                    <li><strong>进度窗口</strong> - 显示AI分析您的图像（通常需要30-60秒）</li>
                    <li><strong>随时取消</strong> - 点击进度窗口中的关闭按钮停止生成</li>
                    <li><strong>结果显示</strong> - 输出直接在预览模式中显示</li>
                </ul>
                
                <h4>交互式预览窗口</h4>
                <p>结果在浮动窗口中打开，您可以：</p>
                <ul>
                    <li><strong>编辑文本</strong> - 双击文本块即可修改其内容</li>
                    <li><strong>移动元素</strong> - 单击并拖动海报上选中的文本、形状、线条或装饰元素</li>
                    <li><strong>调整文本尺寸</strong> - 选中文本块后拖动其控制点，以加宽或收紧文本区域</li>
                    <li><strong>删除元素</strong> - 按 Delete 或 Backspace 删除当前选中的文本或装饰元素</li>
                    <li><strong>撤销删除</strong> - 按 Cmd/Ctrl+Z 可恢复最近删除的最多 6 个叠加元素</li>
                    <li><strong>滚动查看大型海报</strong> - 大型或纵向叠加层会保持图像原始尺寸，预览区域会出现滚动，而不是强行压缩海报</li>
                    <li><strong>切换视图</strong> - 在代码视图和实时预览之间切换</li>
                    <li><strong>直接编辑</strong> - 实时修改生成的 HTML 或叠加层 JSON</li>
                    <li><strong>复制代码</strong> - 用于您自己的项目</li>
                    <li><strong>导出PNG</strong> - 保存设计的截图</li>
                </ul>
                
                <h4>处理生成的代码</h4>
                <ul>
                    <li><strong>起点</strong> - 将生成的 HTML 或叠加层 JSON 视为可进一步完善的基础</li>
                    <li><strong>浏览器测试</strong> - 在不同浏览器和屏幕尺寸下测试</li>
                    <li><strong>直接编辑</strong> - 在结果窗口中直接修改和预览代码</li>
                    <li><strong>网站字体引用</strong> - 在叠加模式下，外链网站字体会保存在 <code>overlay.webFonts</code> 中，文本元素可以引用它们</li>
                    <li><strong>重新生成</strong> - 如果需要，用更具体的说明重试</li>
                </ul>
                
                <h4>重要提示：为背景使用而在生成期间创建的临时图像URL</h4>
                <div class="warning">
                    <p><strong>部署前替换Blob URL：</strong></p>
                    <ul>
                        <li>生成的代码包含临时blob URL，如 <code>blob:http://localhost:8182/...</code></li>
                        <li>这些仅存储在内存中用于预览，在会话外不会工作</li>
                        <li>查找CSS属性，如 <code>background-image: url('blob:http://...')</code></li>
                        <li>在使用代码前，将blob URL替换为实际图像文件的路径</li>
                    </ul>
                </div>
                
                <h4>常见问题排除</h4>
                
                <h5>生成失败</h5>
                <ul>
                    <li><strong>解决方案：</strong> 尝试不同的视觉模型或更小的图像</li>
                    <li><strong>预防：</strong> 使用具有独特设计元素的清晰图像</li>
                    <li><strong>重试：</strong> 由于AI模型的概率性质，您应该多次重试后再放弃</li>
                </ul>
                
                <h5>性能缓慢</h5>
                <ul>
                    <li><strong>解决方案：</strong> 使用更小的图像、简化说明、使用更小的AI模型</li>
                    <li><strong>注意：</strong> 复杂设计和较大图像需要更多处理时间</li>
                </ul>
                
                <h5>代码输出不完整</h5>
                <ul>
                    <li><strong>解决方案：</strong> 在生成后在常规聊天中要求AI继续或完成代码</li>
                    <li><strong>替代方案：</strong> 将复杂请求分解为更小、更具体的生成</li>
                </ul>
                
                <h5>文本放置不佳（叠加模式）</h5>
                <ul>
                    <li><strong>解决方案：</strong> 在说明中指定首选位置</li>
                    <li><strong>示例：</strong> "将标题放在左上角，价格放在右下角"</li>
                </ul>

                <h5>网站字体或颜色没有按预期使用</h5>
                <ul>
                    <li><strong>解决方案：</strong> 在文本叠加模式的网站样式字段中提供有效的网站 URL，并明确要求模型保留该网站的字体和 CSS 颜色</li>
                    <li><strong>说明：</strong> 如果网站没有暴露可用的字体文件，叠加层可能会退回到兼容的替代字体</li>
                </ul>
                
                <div class="note">
                    <p><strong>性能提示：</strong> 视觉处理是资源密集型的。为了获得最佳结果，请关闭不必要的应用程序并使用高质量、构图清晰的图像。</p>
                    <p>在 Mac Osx 上，您可能需要导出 png 两次，因为第一次可能无法导出背景图像（Safari）。</p>
                    <p>如果导出的 png 中文本换行，请单击受影响的文本，然后将其宽度扩展，直到问题解决。</p>
                </div>
            `,
                image: "artworks_examples3.png",
                imageAlt: "结果管理",
                imageCaption: "具有编辑和导出功能的交互式预览窗口",
            },
        ],
    },
    presentation: {
        title: "演示",
        intro: "使用 AI 辅助的提取和预览编辑器，从文档创建幻灯片演示文稿。",
        articles: [
            {
                id: "presentation-overview",
                title: "概述",
                content: `
            <p>“演示”选项卡可将支持的文档（.pdf、.docx、.txt、.md）转换为一系列幻灯片。该选项卡会从文件中提取文本，使用 AI 生成幻灯片内容，可选择为幻灯片检索图片，并打开交互式预览以供审阅和导出结果。</p>
            <p>快速流程：</p>
            <ol>
                <li>通过拖放或“浏览”按钮上传文档。</li>
                <li>选择幻灯片数量以及每张幻灯片的要点数。</li>
                <li>可选：添加额外的提示以控制语气或风格。</li>
                <li>点击“生成”以运行提取和 AI 生成功能。</li>
                <li>在预览窗口中审阅并编辑幻灯片，然后导出。</li>
            </ol>
        `,
                image: "tab_overview.png",
                imageAlt: "演示选项卡概述",
                imageCaption: "演示选项卡概述",
            },
            {
                id: "presentation-direct-copy",
                title: "直接复制模式",
                content: `
            <p>当你的文档已经包含想要保持原样的幻灯片文本时，请使用“直接复制”。AI 只负责结构化和拆分，不会改写。</p>

            <h4>如何准备文档</h4>
            <ul>
                <li><strong>显式标记幻灯片：</strong> 在首张幻灯片添加 "cover:"，随后按顺序写 "Slide 1:"、"Slide 2:" 等。</li>
                <li><strong>封面文本：</strong> 在 "cover:" 之后写标题，如需可用逗号补充副标题。</li>
                <li><strong>一张一段：</strong> 将每张幻灯片的文本紧跟在其标签后；保持顺序和语言一致。</li>
                <li><strong>匹配要点数：</strong> 设置每页要点数选择器以决定拆分方式。AI 会按顺序切分，不改写，缺少内容时用空字符串填充。</li>
                <li><strong>保持上下文：</strong> 控制总文本量（上下文选择器决定最大长度），确保所有已标记的幻灯片都被捕获。</li>
            </ul>

            <h4>如何运行直接复制</h4>
            <ol>
                <li>在模式选择器中选择“直接复制”。</li>
                <li>设置幻灯片数量和每张的要点数（第 1 张始终是封面）。</li>
                <li>拖入已标记的文档或粘贴文本，可选添加额外提示用于细节指令（如大小写或间距偏好）。</li>
                <li>点击“生成”；输出会原样呈现。缺失的幻灯片或要点会保留为空字符串，而不会被改写。</li>
            </ol>

            <p>提示：若出现意外改写，请确认模式为“直接复制”，并检查标签是否严格写成 "Slide 1:"、"Slide 2:" 等。</p>
        `,
                image: "tab_overview.png",
                imageAlt: "直接复制模式",
                imageCaption: "标记幻灯片并运行直接复制",
            },
            {
                id: "presentation-promptable",
                title: "可提示配置演示文稿",
                content: `
            <p><strong>可提示配置演示文稿</strong> 会打开一个专用的全屏工作区，用于按提示创建演示文稿。</p>
            <ul>
                <li><strong>幻灯片数量</strong> — 选择精确的页数（1 到 20）。</li>
                <li><strong>添加文本</strong> — 打开浮动文本窗口，可粘贴较长的源文本内容。</li>
                <li><strong>文本持久化</strong> — 关闭并重新打开文本窗口后，会再次显示你之前保存的文本。</li>
                <li><strong>发送流程</strong> — 点击发送时，系统会自动使用“幻灯片数量 + 已保存文本”构建用户提示词。</li>
                <li><strong>额外请求（可选）</strong> — 使用“额外请求”按钮添加样式/布局指令（例如“使用红色配色”或“图片使用圆角边框”）；填写后会在提示词中先于主要源文本加入。</li>
                <li><strong>模式选择</strong> — 使用 <strong>交互模式</strong> 通过 <strong>上一页/下一页</strong> 按钮导航演示，或使用 <strong>滚动模式</strong> 从上到下滚动浏览演示。</li>
                <li><strong>网页搜索开关</strong> — 在 <strong>发送</strong> 按钮后，可使用 <strong>Web</strong> 开关基于 Add text 内容作为搜索提示词，从网页搜索结果构建演示内容；开启后，Add text 按钮会变为 <strong>网页搜索提示词</strong>。</li>
                <li><strong>网页提示词建议</strong> — 在此模式下，只输入演示文稿要使用的主题。不要输入“创建一个关于……的演示文稿”之类的句子，因为这会影响网页搜索；仅填写主题即可。</li>
                <li><strong>图片替换提示</strong> — 如果图片加载失败，或你只是想更换图片，直接在预览中点击该图片并发起图片搜索即可替换。</li>
                <li><strong>文本编辑提示</strong> — 预览中的文本框可直接编辑，因此你可以在保存 HTML 演示文稿前进行最后润色。</li>
                <li><strong>推荐模型</strong> — 在此功能中，<strong>GLM 4.7 Flash</strong> 是一个非常好的演示文稿生成模型。</li>
                <li><strong>已保存演示</strong> — 生成的 HTML 演示可加密保存到数据库，并在右侧边栏列出。</li>
                <li><strong>侧边栏打开</strong> — 点击已保存演示即可在横向预览区域中加载显示。</li>
                <li><strong>删除安全</strong> — 删除已保存演示前会先进行确认。</li>
            </ul>
            <p>提示：将源文本按逻辑分段，并设置合理的幻灯片数量，可获得更清晰的结构效果。</p>
        `,
                image: "tab_overview.png",
                imageAlt: "可提示配置演示文稿流程",
                imageCaption: "可提示配置演示文稿的工作区与控件",
            },
            {
                id: "presentation-generating",
                title: "生成演示文稿",
                content: `
            <p>点击“生成”后，系统会执行多个步骤并显示进度模态：</p>
            <ul>
                <li><strong>文本提取</strong> — 从文档中提取文本供 AI 使用。</li>
                <li><strong>AI 生成</strong> — AI 将提取的文本转换为幻灯片内容（如提供了额外提示，则一并使用）。</li>
                <li><strong>解析与图片</strong> — 解析 AI 输出为结构化幻灯片，如有图片则下载。</li>
                <li><strong>错误处理</strong> — 若 AI 返回格式不正确的结果，选项卡会自动重试一次；错误会在加载模态中显示。</li>
            </ul>
            <p>你可以随时使用加载模态中的关闭/中止按钮取消生成。中止会停止后台任务并关闭模态。</p>
        `,
                image: "generating_presentation.png",
                imageAlt: "生成演示文稿",
                imageCaption: "生成过程和进度指示",
            },
            {
                id: "presentation-preview-export",
                title: "预览、编辑与导出",
                content: `
            <p>生成成功后会打开全屏预览窗口。预览的主要功能包括：</p>
            <ul>
                <li><strong>大视图幻灯片</strong> — 以 HTML 渲染当前选中的幻灯片供审阅。</li>
                <li><strong>缩略图</strong> — 使用缩略图栏在幻灯片间导航并跳转到任意幻灯片。</li>
                <li><strong>内联编辑</strong> — 直接在预览中编辑幻灯片文本（预览通过 PreviewWindow API 应用幻灯片数据）。</li>
                <li><strong>导出选项</strong> — 使用预览控件复制幻灯片文本、导出图片或下载 HTML（具体导出菜单由预览 UI 提供）。</li>
            </ul>
            <p>提示：为获得最佳提取效果，请保持文档文本清晰；根据内容长度选择合理的幻灯片数量；如需特定语气或风格，可添加额外提示。</p>
        `,
                image: "preview_editing_export.png",
                imageAlt: "预览与导出",
                imageCaption: "预览窗口、编辑与导出选项",
            },
            {
                id: "presentation-sidebar",
                title: "演示侧边栏",
                content: `
            <p>演示侧边栏提供每张幻灯片及全局的控制项，用于样式化幻灯片、编辑文本、管理图片并应用 AI 驱动的文本变更。</p>
            <h4>选项卡</h4>
            <ul>
                <li><strong>样式</strong> — 选择并应用演示样式（预置卡片如经典、深色模式、产品、企业等主题预设）。<em>DIY</em> 样式会打开样式管理器，可创建或重用本地保存的自定义样式。</li>
                <li><strong>文本</strong> — 包含全局文本控制（字体、颜色、要点符号）以及针对所选文本节点的节点级控制。</li>
                <li><strong>图片</strong> — 图片工具，包括导入/替换、修改封面图片、按描述搜索图片，以及用于快速替换的缩略图库。</li>
            </ul>

            <h4>全局控制与所选项</h4>
            <p>“文本”选项卡显示应用于要点和默认文本样式的全局控制。当你在幻灯片上选择文本节点时，会出现节点专属控制（字体大小、颜色选择器、AI 文本修改），以便进行逐节点调整。</p>

            <h4>AI 文本修改</h4>
            <ul>
                <li>在 AI 文本框中输入指令（示例："翻译成中文" 或 "把这些要点精简一下"）。</li>
                <li>使用 <em>修改</em> 按钮将更改应用到当前选中的节点。</li>
                <li>启用 <em>应用到所有文本</em> 开关可对所有匹配的文本节点执行该修改；在可用时，侧边栏会尝试以批处理并提供进度报告的方式执行。</li>
                <li>在执行过程中，修改按钮会切换为 <em>取消</em> — 使用共享的 SlideForge AbortController 可中止该操作。</li>
            </ul>

            <h4>图片工具</h4>
            <ul>
                <li><strong>导入图片</strong> — 替换所选幻灯片的图片，或在开启时替换第一页的封面图片。</li>
                <li><strong>更换封面</strong> — 支持 helper 的流程用于替换整页封面图片；如果没有 helper，则回退到标准导入流程。</li>
                <li><strong>搜索图片</strong> — 输入描述并点击搜索；结果会填充到缩略图网格，你可以选择一张图片替换当前选中图片。</li>
                <li>缩略图网格尺寸适用于显示多行缩略图，并在导入或替换图片时显示进度/状态消息。</li>
            </ul>

            <h4>样式卡与 DIY</h4>
            <p>样式卡可让你快速应用视觉主题。DIY 卡会在存在自定义样式（内存或数据库中）时打开样式管理器，或启动创建模态。卡片会以视觉方式显示可用性和选中状态。</p>

            <h4>与 helpers 的集成</h4>
            <p>侧边栏依赖附加在演示阶段（stage）上的选择 helper 来执行图片替换、批量 AI 编辑和节点操作。如果找不到 helper，侧边栏会显示提示并退回到可用的全局流程。</p>
        `,
                image: "sidebar_controls.png",
                imageAlt: "演示侧边栏",
                imageCaption: "侧边栏用于样式、文本和图片的控制",
            },
            {
                id: "presentation-export-note",
                title: "导出 PDF：导出内容说明",
                content: `
            <p><strong>注意：</strong> <em>导出 PDF</em> 按钮会将演示按屏幕所见完整导出 — 包括幻灯片文本、图片、形状和背景视觉元素。</p>
        `,
                image: "export_slides.png",
                imageAlt: "导出 PDF 说明",
                imageCaption: "将幻灯片以预览中所见方式导出",
            },
        ],
    },
    // 翻译选项卡部分
    artifacts: {
        title: "工件",
        intro: "工件标签页是一个专用工作区，用于生成交互式 HTML 成品、结合 AI 持续优化，并保存可复用结果。",
        articles: [
            {
                id: "artifacts-overview",
                title: "功能概览",
                content: `
            <p>工件标签页聚焦全屏 HTML 成品生成流程，适合快速制作原型、落地页、交互片段和视觉实验。</p>
            <ul>
                <li><strong>主要输出</strong> - AI 返回可运行的 HTML/CSS/JS，并直接在预览区域打开。</li>
                <li><strong>迭代流程</strong> - 可持续提出修改、重新生成，并在同一工作区即时验证效果。</li>
                <li><strong>模型支持</strong> - 支持你在模型选择器中可用的本地或云端模型。</li>
            </ul>
        `,
            },
            {
                id: "artifacts-controls",
                title: "按钮与控制项",
                content: `
            <p>顶部控制项专为快速提示词迭代设计：</p>
            <ul>
                <li><strong>Web / Web 已激活</strong> - 切换联网辅助生成模式；激活后标签会变化。</li>
                <li><strong>发送</strong> - 提交提示词并开始生成。</li>
                <li><strong>进度条</strong> - 请求进行中时会显示在顶部栏。</li>
                <li><strong>取消</strong> - 按需停止当前生成。</li>
            </ul>
            <p>提示：建议按“目标、布局、交互、约束”组织提示词，可提升首轮结果质量。</p>
        `,
            },
            {
                id: "artifacts-saved",
                title: "已保存工件与提示词记录",
                content: `
            <p>生成结果可保存到本地加密数据库，并可在侧边栏随时重新打开。</p>
            <ul>
                <li><strong>保存</strong> - 保存当前成品，便于后续复用。</li>
                <li><strong>从侧边栏打开</strong> - 点击已保存项可重新加载到预览区。</li>
                <li><strong>Prompt 按钮</strong> - 查看创建该工件时使用的提示词。</li>
                <li><strong>复制提示词</strong> - 在提示词弹窗中复制已保存提示词，用于复用或继续优化。</li>
                <li><strong>删除</strong> - 删除不再需要的已保存工件。</li>
            </ul>
            <p>该流程可帮助你建立“结果 + 原始指令”的可复用资产库。</p>
        `,
            },
        ],
    },

    translate: {
        title: "翻译",
        intro: "翻译选项卡使用 AI 转换文档文本，并提供浮动预览窗口用于审阅、实时更新与导出。",
        articles: [
            {
                id: "translate-overview",
                title: "概览",
                content: `
            <p>翻译选项卡是一个面向文档的流程，用于翻译文件并在导出前检查结果。</p>

            <h4>支持格式</h4>
            <ul>
                <li><strong>PDF</strong> - 带可编辑叠加层的分页预览</li>
                <li><strong>TXT</strong> - 纯文本翻译，并保留行与段落结构</li>
                <li><strong>MD</strong> - 面向 Markdown 的翻译，并尽量保留结构</li>
            </ul>

            <h4>主要控件</h4>
            <ul>
                <li><strong>拖放区域</strong> - 拖入文件或点击浏览</li>
                <li><strong>范围选择器</strong> - 翻译前选择 Selection、Page 或 Document</li>
                <li><strong>指令输入框</strong> - 例如 <em>“将此文档翻译成法语”</em></li>
                <li><strong>翻译按钮</strong> - 启动当前文档的翻译</li>
                <li><strong>导出已翻译文档</strong> - 按当前预览状态导出翻译结果</li>
            </ul>

            <h4>范围选择器</h4>
            <ul>
                <li><strong>Selection</strong> - 作用于预览中选中的一个或多个页面。</li>
                <li><strong>Page</strong> - 仅作用于当前选中的页面。</li>
                <li><strong>Document</strong> - 作用于整个文档（所有页面/文本块）。</li>
            </ul>

            <div class="note">
                <p><strong>提示：</strong>为获得更好质量，建议在模型库中使用以翻译为主的模型（如 TranslateGemma）。</p>
            </div>
        `,
                image: "Translate-1.png",
                imageAlt: "翻译选项卡概览",
                imageCaption: "翻译选项卡界面（含拖放区域）",
            },
            {
                id: "translate-preview",
                title: "浮动预览窗口",
                content: `
            <p>加载文档后，翻译功能会打开一个浮动预览窗口，便于你检查并微调结果。</p>

            <h4>窗口控件</h4>
            <ul>
                <li><strong>最大化/还原</strong> - 在紧凑与扩展工作区之间切换</li>
                <li><strong>关闭/重新打开</strong> - 关闭后可通过 <em>打开预览窗口</em> 重新显示</li>
            </ul>

            <h4>PDF 行为</h4>
            <ul>
                <li>文本块会映射到 PDF 页面上，并可直接编辑。</li>
                <li>流式翻译更新会逐步应用到对应文本块。</li>
                <li>你可以在导出前审阅并调整翻译文本。</li>
            </ul>

            <h4>TXT / MD 行为</h4>
            <ul>
                <li>预览采用文档式文本布局，便于阅读。</li>
                <li>流式替换会逐步更新内容（而非只在最后一次性替换）。</li>
                <li>会尽可能保留换行和文档结构。</li>
            </ul>
        `,
                image: "Translate-2.png",
                imageAlt: "翻译窗口概览",
                imageCaption: "翻译窗口界面（显示控件与已加载 PDF）",
            },
            {
                id: "translate-export-troubleshooting",
                title: "导出与故障排查",
                content: `
            <p>完成审阅后，使用导出控件保存翻译结果。</p>

            <h4>导出输出</h4>
            <ul>
                <li><strong>PDF 输入</strong> - 导出为已翻译 PDF</li>
                <li><strong>TXT 输入</strong> - 导出为 <code>-translated.txt</code></li>
                <li><strong>MD 输入</strong> - 导出为 <code>-translated.md</code></li>
            </ul>

            <h4>常见问题</h4>
            <ul>
                <li><strong>PDF 无可提取文本</strong> - 扫描件/纯图片 PDF 可能无法提供可编辑文本块。</li>
                <li><strong>质量不理想</strong> - 可细化指令，或切换到更好的翻译模型。</li>
                <li><strong>上下文流程</strong> - 翻译变更后，关闭预览可能会触发 Chat 中的继续会话流程。</li>
            </ul>

            <div class="note">
                <p><strong>说明：</strong>此选项卡中的翻译是面向文档的。如需特定语气/风格，请在指令输入框中明确说明。</p>
            </div>
        `,
            },
        ],
    },
    models: {
        title: "模型",
        intro:
            "模型选项卡允许您浏览、下载和管理Paiperwork使用的Ollama AI模型，并具有完全的本地控制权。",
        articles: [
            {
                id: "models-intro",
                title: "模型介绍",
                content: `
                <p>模型选项卡为管理为您的Paiperwork体验提供动力的AI模型提供了一个中央界面。</p>
                
                <p>模型选项卡的主要功能包括：</p>
                <ul>
                    <li>浏览Ollama库中的可用模型</li>
                    <li>将新模型下载到您的本地系统</li>
                    <li>管理您已安装的模型</li>
                    <li>配置模型参数以获得最佳性能</li>
                    <li>删除您不再需要的模型</li>
                </ul>
                
                <p>所有模型都通过Ollama在您的设备上本地运行，确保您的数据保持私密和安全，同时仍能从强大的AI功能中受益。</p>
                
                <h4>推理模型</h4>
                <p>一些专门的模型具有增强的推理能力，可以通过特定的系统提示激活：</p>
                <ul>
                    <li><strong>Cogito</strong>和其他专注于推理的模型可能需要特殊的系统提示来激活其全部功能</li>
                    <li>对于Cogito模型，在系统提示中添加<code>"Enable deep thinking subroutine."</code>（不带引号）</li>
                    <li>这会激活高级推理功能，允许更结构化、逐步的思考</li>
                    <li>不同的推理模型可能有不同的激活短语 - 请查看模型文档了解详细信息</li>
                </ul>
                
                <div class="note">
                    <p><strong>注意：</strong>Paiperwork中的模型由Ollama提供支持，必须在您的系统上安装并运行。模型可用性取决于您的本地Ollama安装。</p>
                </div>
            `,
                image: "models_intro.png",
                imageAlt: "模型选项卡概览",
                imageCaption:
                    "显示可用模型和本地模型部分的模型选项卡界面",
            },
            {
                id: "models-browsing",
                title: "浏览可用模型",
                content: `
                <p>Paiperwork允许您直接从应用程序界面浏览整个Ollama模型库。</p>
                
                <h4>获取可用模型</h4>
                <ol>
                    <li>导航到模型选项卡</li>
                    <li>点击屏幕顶部的"获取Ollama模型"按钮</li>
                    <li>等待Paiperwork连接到Ollama库</li>
                    <li>完成后，状态消息将确认找到了多少个模型</li>
                </ol>
                
                <h4>探索模型选项</h4>
                <p>获取模型后，您可以：</p>
                <ul>
                    <li>使用下拉选择器浏览模型</li>
                    <li>查看解释其功能的模型描述</li>
                    <li>查看模型受欢迎程度信息（下载次数）</li>
                </ul>
                
                <h4>模型类型</h4>
                <p>Ollama库包含具有不同专业化的模型：</p>
                <ul>
                    <li><strong>通用</strong> - 像Gemma3、Llama、Qwen2.5和Mistral这样的模型，适用于日常任务</li>
                    <li><strong>代码专用</strong> - 像Qwen2.5 coder、CodeLlama和WizardCoder这样的模型，针对编程优化</li>
                    <li><strong>视觉能力</strong> - 像Mistral3.1和Gemma3这样可以分析图像的模型</li>
                    <li><strong>微调</strong> - 针对特定用例或具有特定特征训练的模型</li>
                </ul>
                
                <div class="note">
                    <p><strong>提示：</strong>在下载之前，请仔细阅读模型描述以了解每个模型的优势和功能。</p>
                </div>
            `,
                image: "models_browsing.png",
                imageAlt: "浏览可用模型",
                imageCaption:
                    "显示Ollama库中可用模型的模型选择下拉菜单",
            },
            {
                id: "models-downloading",
                title: "下载模型",
                content: `
                    <p>一旦您确定了要使用的模型，您可以直接将其下载到本地系统。</p>
                    
                    <h4>选择模型大小</h4>
                    <ol>
                        <li>从下拉列表中选择一个模型</li>
                        <li>查看模型描述</li>
                        <li>当您选择模型时，大小选项将自动出现</li>
                        <li>选择符合您需求和系统能力的适当大小版本</li>
                    </ol>
                    
                    <h4>理解模型大小</h4>
                    <p>大多数模型都有多种大小变体：</p>
                    <ul>
                        <li><strong>较大尺寸</strong>（7B、13B、34B参数）- 这些较大的模型提供更好的质量，但需要更多的VRAM（显卡内存，由于包含上下文会超过模型大小，请注意屏幕分辨率会影响内存使用）、RAM（与VRAM相同，请注意您的操作系统也使用RAM，因此并非所有内存都可用于AI模型+上下文使用）和处理能力（CPU越快越好）。</li>
                        <li><strong>较小尺寸</strong>（3B、1.5B参数）- 更高效但功能可能有所降低</li>
                        <li><strong>量化版本</strong>（Q4_K_M、Q5_K_S）- 压缩模型，使用更少内存同时保持质量</li>
                    </ul>
                    
                    <h4>VRAM需求示例</h4>
                    <p>为了让您了解在8K上下文窗口下运行模型的硬件需求：</p>
                    <ul>
                        <li><strong>小型模型（3B）</strong>：使用量化（Q4/Q5）约4-6GB VRAM</li>
                        <li><strong>中型模型（7B）</strong>：使用量化（Q4/Q5）约8-10GB VRAM</li>
                        <li><strong>大型模型（13B）</strong>：使用量化（Q4/Q5）约14-16GB VRAM</li>
                        <li><strong>超大型模型（34B+）</strong>：使用量化（Q4/Q5）需要24GB+ VRAM</li>
                    </ul>
                    <p>这些需求可能因特定模型和系统配置而异。如果您的VRAM有限，请考虑从较小或更高度量化的模型开始。</p>
                    
                    <h4>开始下载</h4>
                    <ol>
                        <li>点击"下载模型"按钮</li>
                        <li>按钮将显示下载进度信息</li>
                        <li>下方的状态消息将显示当前操作（下载中、处理中）</li>
                        <li>将出现取消按钮，允许您在需要时停止下载</li>
                    </ol>
                    
                    <h4>下载过程</h4>
                    <p>在下载期间，您将看到：</p>
                    <ul>
                        <li>显示已下载大小和总大小的进度信息</li>
                        <li>不同阶段的状态更新（拉取清单、下载文件、验证）</li>
                        <li>在下载期间，模型选择器、大小选择器和"获取Ollama模型"按钮将被禁用</li>
                        <li>下载完成时的确认信息</li>
                    </ul>
                    
                    <h4>取消下载</h4>
                    <p>如果您需要取消正在进行的下载：</p>
                    <ul>
                        <li>点击下载按钮下方出现的"取消下载"按钮（如果要恢复，请再次点击下载按钮）</li>
                        <li>在提示时确认取消</li>
                        <li>取消后，将出现一条消息建议您重启Ollama以清理部分下载的文件</li>
                        <li>此消息将在30秒后自动消失</li>
                        <li>模型选择器、大小选择器和"获取Ollama模型"按钮将重新启用</li>
                    </ul>
                    
                    <h4>在选项卡之间切换</h4>
                    <p>如果您在下载期间切换到另一个选项卡：</p>
                    <ul>
                        <li>下载将在后台继续</li>
                        <li>当您返回模型选项卡时，将显示当前下载状态</li>
                        <li>界面将显示当前正在下载的文件和整体进度</li>
                    </ul>
                    
                    <div class="note">
                        <p><strong>重要：</strong>模型下载可能很大（从数百MB到数百GB）。在开始下载之前，请确保您有足够的磁盘空间和稳定的互联网连接。如果您需要在下载进行中获取新模型，必须首先取消当前下载。</p>
                    </div>
                `,
                image: "models_downloading.png",
                imageAlt: "下载模型",
                imageCaption: "显示下载进度和大小选择的模型下载界面",
            },
            {
                id: "models-managing",
                title: "管理本地模型",
                content: `
                <p>下载模型后，您可以通过模型选项卡的本地模型部分管理它们。</p>
                
                <h4>查看已安装的模型</h4>
                <p>本地模型部分显示系统上当前安装的所有模型：</p>
                <ul>
                    <li>模型在下拉选择器中列出</li>
                    <li>选择模型以访问管理选项</li>
                    <li>最近下载的模型将自动选中</li>
                </ul>
                
                <h4>删除模型</h4>
                <p>要删除不再需要的模型：</p>
                <ol>
                    <li>从本地模型下拉菜单中选择模型</li>
                    <li>点击"删除"按钮</li>
                    <li>在提示时确认删除</li>
                    <li>等待过程完成</li>
                </ol>
                <p>删除未使用的模型有助于释放系统上的磁盘空间。</p>
                
                <div class="note">
                    <p><strong>注意：</strong>如果您删除了当前在对话中使用的模型，您需要选择一个新模型来继续聊天。</p>
                </div>
            `,
                image: "models_managing.png",
                imageAlt: "管理本地模型",
                imageCaption:
                    "显示模型管理选项的本地模型部分",
            },
            {
                id: "models-configuration",
                title: "配置模型参数",
                content: `
                <p>通过在modelparameters.js文件中调整模型参数来微调模型的响应方式。</p>
                
                <h4>参数配置</h4>
                <p>模型参数现在直接在<code>modelparameters.js</code>文件中配置：</p>
                <ul>
                    <li>在代码编辑器中打开<code>modelparameters.js</code>文件</li>
                    <li>将您的模型添加到<code>MODEL_PARAMETERS</code>对象中或修改现有条目</li>
                    <li>保存文件并重启应用程序以应用更改</li>
                </ul>
                
                <h4>添加新模型的示例</h4>
                <pre><code>// 添加到modelparameters.js中的MODEL_PARAMETERS对象
                'your-model-name': {
                    temperature: 0.7,
                    top_k: 50,
                    top_p: 0.9,
                    min_p: 0.05,
                    repeat_penalty: 1.1
                }</code></pre>
                
                <h4>可用参数</h4>
                <p>以下参数可以为大多数模型进行调整：</p>
                <ul>
                    <li><strong>Temperature</strong>（0.0-2.0）- 控制响应中的随机性。较高的值产生更多样化、更有创意的输出，而较低的值使响应更集中和确定性。</li>
                    <li><strong>Top P</strong>（0.0-1.0）- 通过将标记选择限制在累积概率阈值内来控制多样性。较低的值创建更集中的响应。</li>
                    <li><strong>Top K</strong>（1-100+）- 将标记选择限制为最可能的前K个标记。较低的值创建更可预测的响应。</li>
                    <li><strong>Min P</strong>（0.0-1.0）- 为标记选择设置最小概率阈值。较高的值迫使模型更加果断。</li>
                    <li><strong>Repeat Penalty</strong>（1.0-2.0）- 通过惩罚先前使用的标记来阻止重复。较高的值更积极地减少重复。</li>
                </ul>
                
                <h4>参数建议</h4>
                <p>不同的任务受益于不同的参数设置：</p>
                <ul>
                    <li><strong>创意写作</strong> - 较高temperature（0.7-1.0），较高top_p（0.9）</li>
                    <li><strong>事实性响应</strong> - 较低temperature（0.1-0.3），低top_k（40）</li>
                    <li><strong>代码生成</strong> - 较低temperature（0.1-0.4），较高repeat_penalty（1.1）</li>
                </ul>
                
                <div class="note">
                    <p><strong>重要：</strong>在模型编辑器中保存后，已加载的配置会自动刷新。</p>
                </div>
                `,
                image: "models_configuration.png",
                imageAlt: "模型配置界面",
                imageCaption: "带有自定义配置的modelparameters.js文件示例",
            },
            {
                id: "models-troubleshooting",
                title: "排查模型问题",
                content: `
                    <p>如果您在Paiperwork中遇到模型问题，以下是一些常见问题和解决方案：</p>
                    
                    <h4>模型获取失败</h4>
                    <p>如果您无法从Ollama库获取模型：</p>
                    <ul>
                        <li>验证Ollama在您的系统上运行</li>
                        <li>检查您的互联网连接</li>
                        <li>重启Ollama并重试</li>
                        <li>确保您使用的是兼容的Ollama版本（当前：0.6.6）</li>
                    </ul>
                    
                    <h4>下载问题</h4>
                    <p>如果模型下载失败或停滞：</p>
                    <ul>
                        <li>检查您的互联网连接稳定性</li>
                        <li>确保您有足够的磁盘空间</li>
                        <li>尝试取消并重启下载</li>
                        <li>取消后重启Ollama以清理不完整的文件</li>
                        <li>尝试首先下载较小的模型尺寸</li>
                    </ul>
                    
                    <h4>不完整下载清理</h4>
                    <p>如果您取消了下载并需要清理文件：</p>
                    <ul>
                        <li>重启系统上的Ollama服务</li>
                        <li>这允许Ollama清理任何部分下载的模型文件</li>
                        <li>重启后，您可以尝试新的下载</li>
                    </ul>
                    
                    <h4>UI元素问题</h4>
                    <p>如果模型选项卡中的UI元素看起来卡住或禁用：</p>
                    <ul>
                        <li>如果选择器在下载完成或取消后仍然禁用，请刷新页面</li>
                        <li>如果"获取Ollama模型"按钮在没有活动下载的情况下被禁用，请刷新页面</li>
                        <li>在多次下载错误后，系统最终会自动重新启用所有控件</li>
                    </ul>
                    
                    <h4>模型性能问题</h4>
                    <p>如果模型运行缓慢或崩溃：</p>
                    <ul>
                        <li>检查您的系统资源（VRAM、RAM和CPU使用率）</li>
                        <li>尝试较小的模型或量化版本</li>
                        <li>关闭其他资源密集型应用程序</li>
                        <li>在聊天选项卡中将上下文大小调整为较小的值</li>
                    </ul>
                    
                    <h4>模型未出现在聊天中</h4>
                    <p>如果下载的模型未在聊天的模型选择下拉菜单中显示：</p>
                    <ul>
                        <li>验证模型下载成功完成</li>
                        <li>刷新聊天选项卡或重启应用程序</li>
                        <li>检查模型是否需要特定功能或配置</li>
                    </ul>
                    
                    <div class="note">
                        <p><strong>注意：</strong>如果问题持续存在，请查看Ollama文档或在您的系统上查找Ollama日志以获取更详细的错误信息。</p>
                    </div>
                `,
            }
        ],
    },
    database: {
        title: "数据库",
        intro: "数据库选项卡提供监控和维护本地数据库的工具，确保最佳性能和数据完整性，同时保持完全的隐私性。",
        articles: [
            {
                id: "database-intro",
                title: "数据库管理介绍",
                content: `
                <p>数据库选项卡让您可以查看和控制 Paiperwork 的本地数据库系统，该系统存储您的所有对话、文档和应用程序数据。</p>
                
                <p>数据库选项卡的主要功能包括：</p>
                <ul>
                    <li>关于数据库大小和内容的实时统计</li>
                    <li>识别和清理孤立数据的工具</li>
                    <li>数据库优化功能</li>
                    <li>关于存储方法和安全性的信息</li>
                </ul>
                
                <p>Paiperwork 中的所有数据都存储在浏览器存储内的本地 SQLite 数据库中。该数据库使用您的主密钥完全加密，确保完全的隐私和安全。</p>
                
                <div class="note">
                    <p><strong>重要提示：</strong>与基于云的应用程序不同，Paiperwork 的数据库需要偶尔维护以确保最佳性能。数据库选项卡提供您进行此维护所需的工具。</p>
                </div>
            `,
                image: "database_overview.png",
                imageAlt: "数据库选项卡概览",
                imageCaption: "显示统计和管理工具的数据库选项卡"
            },
            {
                id: "database-stats",
                title: "理解数据库统计",
                content: `
                <p>数据库统计面板提供关于本地数据库的重要见解：</p>
                
                <h4>关键统计</h4>
                <ul>
                    <li><strong>数据库大小</strong> - 数据库使用的总磁盘空间</li>
                    <li><strong>文档</strong> - 数据库中存储的文档数量</li>
                    <li><strong>总块数</strong> - 用于文档搜索和检索的文本段</li>
                    <li><strong>数据库健康状况</strong> - 数据库完整性的状态指示器</li>
                </ul>
                
                <h4>健康指示器</h4>
                <p>数据库健康指示器可以显示：</p>
                <ul>
                    <li><strong>健康</strong> - 绿色勾选表示您的数据库已优化且没有孤立数据</li>
                    <li><strong>孤立块</strong> - 检测到孤立块时出现黄色警告，显示有多少块是孤立的</li>
                </ul>
                
                <h4>存储方法</h4>
                <p>"关于您的数据库"部分显示您当前的存储方法：</p>
                <ul>
                    <li><strong>OPFS（源私有文件系统）</strong> - 在较新浏览器中可用的现代高性能存储</li>
                    <li><strong>IndexedDB</strong> - 用于不支持 OPFS 的浏览器的后备存储方法</li>
                </ul>
                
                <h4>刷新统计</h4>
                <p>要获取最新信息：</p>
                <ol>
                    <li>点击"刷新统计"按钮</li>
                    <li>等待系统分析您的数据库</li>
                    <li>查看更新的统计信息</li>
                </ol>
                
                <div class="note">
                    <p><strong>注意：</strong>当您首次打开数据库选项卡以及在使用其他选项卡后返回时，数据库统计会自动加载。</p>
                </div>
            `,
            },
            {
                id: "database-orphaned",
                title: "管理孤立数据",
                content: `
                <p>当您删除文档或对话时，有时小片段的数据可能会变成"孤立的" - 与其父内容断开连接但仍占用数据库空间。</p>
                
                <h4>什么是孤立块？</h4>
                <p>孤立块是曾经是文档或对话一部分但不再与任何现有内容关联的文本段。它们出现在以下情况：</p>
                <ul>
                    <li>删除文档时未正确清理所有关联块</li>
                    <li>文档删除过程中发生操作中断</li>
                    <li>正常操作期间系统错误阻止完整清理</li>
                </ul>
                
                <h4>识别孤立数据</h4>
                <p>数据库选项卡自动检测孤立块并通过以下方式提醒您：</p>
                <ul>
                    <li>数据库健康部分的黄色警告指示器</li>
                </ul>
                
                <h4>清理孤立数据</h4>
                <ol>
                    <li>检测到孤立块时，点击"清理数据库"按钮</li>
                    <li>系统将识别并删除所有孤立块</li>
                    <li>成功消息将显示删除了多少块以及恢复了多少空间</li>
                    <li>数据库统计将自动刷新以显示改善的状态</li>
                </ol>
                
                <div class="note">
                    <p><strong>重要提示：</strong>清理孤立数据只会删除不需要的片段 - 它不会影响您的任何实际文档、对话或存储信息。</p>
                </div>
            `,
                image: "database_orphaned.png",
                imageAlt: "孤立数据清理",
                imageCaption: "数据库清理完成消息"
            },
            {
                id: "database-optimize",
                title: "优化数据库性能",
                content: `
                <p>随着时间的推移，当您添加和删除内容时，您的数据库可能会变得碎片化并使用比必要更多的空间。数据库选项卡提供优化性能和回收未使用空间的工具。</p>
                
                <h4>何时优化数据库</h4>
                <p>在以下情况下考虑运行数据库优化：</p>
                <ul>
                    <li>您已删除大型文档或许多对话</li>
                    <li>应用程序似乎比平时慢</li>
                    <li>您注意到数据库大小比预期的大</li>
                    <li>您想要回收磁盘空间</li>
                </ul>
                
                <h4>数据库大小如何变化</h4>
                <p>了解 SQLite 中数据库大小的工作原理：</p>
                <ul>
                    <li>当您添加内容时，数据库会增长以容纳它</li>
                    <li>当您删除内容时，数据库文件不会自动缩小</li>
                    <li>删除的空间被标记为可重用，但仍计入总文件大小</li>
                    <li>只有优化（VACUUM）通过重建数据库实际减少文件大小</li>
                </ul>
                
                <h4>运行数据库优化</h4>
                <ol>
                    <li>在数据库选项卡中点击"清理数据库"按钮</li>
                    <li>等待优化过程完成（对于较大的数据库可能需要一些时间）</li>
                    <li>将出现通知显示恢复了多少空间</li>
                    <li>数据库统计将自动刷新</li>
                </ol>
                
                <h4>优化的作用</h4>
                <ul>
                    <li>重建数据库文件以删除未使用的空间</li>
                    <li>对数据进行碎片整理以提高存储效率</li>
                    <li>重新组织索引以加快查询速度</li>
                    <li>将数据库文件缩小到最佳大小</li>
                </ul>
                
                <div class="note">
                    <p><strong>提示：</strong>养成在删除大型文档或多个对话后运行数据库优化的习惯，以保持最佳性能。与许多云应用程序不同，像 Paiperwork 这样的本地数据库应用程序需要偶尔维护才能保持顺畅运行。</p>
                </div>
            `,
            },
            {
                id: "database-backup",
                title: "导出与导入完整数据库备份",
                content: `
                <p>数据库选项卡提供两个备份按钮，可在不同浏览器或设备之间安全迁移数据：</p>
                <ul>
                    <li><strong>导出数据库</strong> - 生成完整备份文件 <code>Paiperwork-Backup.pwdb</code></li>
                    <li><strong>导入数据库</strong> - 将该备份恢复到当前本地存储</li>
                <h4>使用数据库按钮</h4>
                <p>按如下方式使用数据库选项卡顶部的按钮：</p>
                <ol>
                    <li>点击“导出数据库”以下载完整备份文件。</li>
                    <li>点击“导入数据库”以选择备份文件并恢复。此操作将替换您当前的本地数据库。</li>
                    <li>点击“删除所有信息”以永久删除所有存储的对话、文档和设置，然后返回欢迎屏幕。</li>
                </ol>

                </ul>

                <h4>备份包含内容</h4>
                <p>导出的备份包含 Paiperwork 的全部数据库角色：</p>
                <ul>
                    <li><strong>Main</strong> - 核心对话与设置</li>
                    <li><strong>RAG</strong> - 文档分块与检索数据</li>
                    <li><strong>HTML</strong> - 已保存的演示和 artifacts 的 HTML 内容</li>
                    <li><strong>Knowledge Base</strong> - 知识库集合与条目</li>
                </ul>

                <h4>导入的重要行为</h4>
                <ul>
                    <li>导入会<strong>替换</strong>当前本地数据库</li>
                    <li>导入<strong>不会合并</strong>现有本地数据</li>
                    <li>导入完成后，Paiperwork 会返回欢迎页，您需要重新输入主密钥</li>
                </ul>

                <h4>推荐流程</h4>
                <ol>
                    <li>在源浏览器中打开数据库选项卡并点击"导出数据库"</li>
                    <li>将生成的 <code>Paiperwork-Backup.pwdb</code> 复制到目标浏览器或设备</li>
                    <li>在目标浏览器中打开数据库选项卡并点击"导入数据库"</li>
                    <li>确认替换后，使用主密钥重新登录</li>
                </ol>

                <div class="note">
                    <p><strong>注意：</strong>仍兼容旧版单个 <code>.db</code> 文件导入，但它只会恢复主数据库。要完整迁移，请使用 <code>Paiperwork-Backup.pwdb</code>。</p>
                </div>
            `,
            },
            {
                id: "database-maintenance",
                title: "数据库维护最佳实践",
                content: `
                <p>适当的数据库维护确保 Paiperwork 继续顺畅高效地运行。遵循这些最佳实践来保持数据库健康。</p>
                
                <h4>定期维护计划</h4>
                <p>建立例行维护计划：</p>
                <ul>
                    <li><strong>每周</strong> - 检查数据库统计并在发现时清理孤立数据</li>
                    <li><strong>每月</strong> - 运行数据库优化以回收空间并提高性能</li>
                    <li><strong>批量操作后</strong> - 删除多个文档或对话后进行优化</li>
                </ul>
                
                <h4>性能指标</h4>
                <p>注意数据库需要维护的迹象：</p>
                <ul>
                    <li>应用程序响应时间变慢</li>
                    <li>在选项卡之间切换时延迟</li>
                    <li>文档或对话加载时间变长</li>
                    <li>数据库大小意外增长</li>
                </ul>
                
                <h4>预防性维护</h4>
                <ul>
                    <li>定期清理不必要的文档和对话</li>
                    <li>删除大量数据后运行优化</li>
                    <li>即使没有警告出现也要定期检查孤立块</li>
                    <li>偶尔重启应用程序以允许浏览器存储优化</li>
                </ul>
                
                <h4>理解数据库增长</h4>
                <p>随着时间的推移，您的数据库正常增长：</p>
                <ul>
                    <li>为 RAG 处理添加更多文档</li>
                    <li>与 AI 进行更多对话</li>
                    <li>创建知识库条目和集合</li>
                    <li>生成并保存更多研究报告</li>
                </ul>
                <p>不正常的是在您删除这些内容后数据库仍然很大 - 这时就需要优化。</p>
                
                <div class="note">
                    <p><strong>重要提示：</strong>与云应用程序不同，本地数据库应用程序没有在服务器上运行的自动维护过程。数据库选项卡为您提供自己执行此维护的工具，保持应用程序顺畅运行。</p>
                </div>
            `,
            },
            {
                id: "database-troubleshooting",
                title: "数据库问题故障排除",
                content: `
                <p>如果您遇到数据库问题或注意到性能问题，以下是一些故障排除步骤：</p>
                
                <h4>常见问题和解决方案</h4>
                
                <h5>应用程序性能缓慢</h5>
                <ul>
                    <li><strong>问题：</strong> Paiperwork 感觉迟缓或响应时间更长</li>
                    <li><strong>解决方案：</strong>点击"清理数据库"按钮运行数据库优化</li>
                    <li><strong>预防：</strong>安排定期优化，特别是在大量删除后</li>
                </ul>
                
                <h5>数据库大小过大</h5>
                <ul>
                    <li><strong>问题：</strong>数据库大小相对于您的内容似乎过大</li>
                    <li><strong>解决方案1：</strong>检查并清理孤立块</li>
                    <li><strong>解决方案2：</strong>运行数据库优化以回收未使用的空间</li>
                    <li><strong>解决方案3：</strong>审查并删除不必要的文档和对话</li>
                </ul>
                
                <h5>会话更改后内容丢失</h5>
                <ul>
                    <li><strong>问题：</strong>更改主密钥时内容似乎丢失</li>
                    <li><strong>解决方案：</strong>验证您正在使用该内容的正确主密钥</li>
                    <li><strong>说明：</strong>不同的主密钥创建单独的安全存储区域</li>
                </ul>
                
                <h5>统计不更新</h5>
                <ul>
                    <li><strong>问题：</strong>数据库统计似乎不反映最近的更改</li>
                    <li><strong>解决方案：</strong>点击"刷新统计"按钮手动更新</li>
                    <li><strong>说明：</strong>某些统计信息被缓存，需要手动刷新</li>
                </ul>
                
                <h5>持续的孤立块</h5>
                <ul>
                    <li><strong>问题：</strong>清理后孤立块重新出现</li>
                    <li><strong>解决方案1：</strong>尝试再次运行清理过程</li>
                    <li><strong>解决方案2：</strong>刷新浏览器并再次尝试清理</li>
                    <li><strong>解决方案3：</strong>清理后运行数据库优化</li>
                </ul>

                <h4>最后手段：数据库重置</h4>
                <p>如果持续出现问题且正常维护无效：</p>
                                <ol>
                    <li>首先导出任何重要的对话或文档</li>
                    <li>点击"删除所有信息"以删除数据库</li>
                    <li>这将删除所有数据并创建新的数据库，现在您可以尝试导入已保存的数据库</li>
                </ol>
                <p>如果需要，您可以使用此功能安全地删除浏览器中的所有信息</p>
                
                <div class="note">
                    <p><strong>警告：</strong>数据库重置是不可逆的，将删除您的所有数据。始终先导出重要信息。</p>
                </div>
            `,
            }
        ],
    },

    connectors: {
        title: "连接器",
        intro: [
            "注意：出于用户安全和隐私原因，托管在 Huggingface 上的 Paiperwork 在线版本不包含 WhatsApp 或 WeChat 功能。",
            "WhatsApp/WeChat 编排器支持的语言：英语、西班牙语、葡萄牙语、德语、中文、法语、日语、韩语和俄语。",
            "连接器用于把 Paiperwork 与 WhatsApp/WeChat 配对。连接器请求只会使用 Paiperwork 内部已有的资源，不会访问您的操作系统、内存、硬盘或任意外部文件。",
            "如果要接收传入的 WhatsApp/WeChat 消息，请保持运行 Paiperwork 的浏览器标签页处于激活状态，并确保电脑不会进入睡眠。锁屏会停止传入消息，您可以考虑暂时禁用它以启用 WhatsApp/WeChat 功能。",
            "文档、研究、演示文稿和工件工作流可能会进入专用的后续模式。请使用对应的退出短语来结束该模式。",
            "您可以根据文档摘要及其后续修改、研究报告及其后续修改，以及知识库条目及其后续修改来创建演示文稿和迷你应用。"
        ],
        articles: [
            {
                id: "connectors-pairing",
                title: "配对与模式",
                content: `
                <p>WhatsApp: 在启动服务器之前，先打开连接器选项卡并选择模式。</p>
                <ol>
                    <li><strong>个人模式：</strong>连接您自己的 WhatsApp 账号，与自己进行私密对话。</li>
                    <li><strong>机器人模式：</strong>在您的 WhatsApp 联系人列表中的人可以与已配对的 Paiperwork 实例对话。除非您明确想这样做，否则建议使用单独的号码。<br><strong>2.1.</strong> 您可以在 Chat 选项卡中修改 System Prompt，从而提升用户与机器人的交互体验。<br><strong>2.2.</strong> 您联系人列表中的任何 WhatsApp 用户都可以访问已启用的连接器功能，以及可通过连接器访问的已存储文档。<br><strong>2.3.</strong> 为了避免滥用和垃圾信息，您不能从 Paiperwork 主动向 WhatsApp 用户发起消息。<br><strong>2.4.</strong> 如果您在机器人模式下关闭服务器，所有待处理的用户消息都会排队等待下次服务器启动，然后逐条处理。如果您想跳过这些消息，请以个人模式启动服务器；除您发给自己的消息外，所有传入消息都会被忽略。</li>
                </ol>
                <p>点击 <strong>Start server</strong>，首次配对时扫描二维码。您可以随时停止服务器，这会停止双向消息路由。</p>
                <p>WeChat：要配对 WeChat 机器人，请点击 Start server 按钮，扫描二维码，并按照手机 WeChat 应用中的指示操作。后续启动服务器时会保留相同的配对信息，除非您删除已配对设备。</p>
                <h4>清除 WhatsApp/WeChat 上下文</h4>
                <p>如果长时间使用后 WhatsApp/WeChat 回复开始变得臃肿，您可以只清除数据库中按手机保存的 WhatsApp/WeChat 对话，而无需删除数据库中的其他内容；与 Paiperwork 相关的对话不会被删除。</p>
                <ol>
                    <li>在连接器选项卡中点击“清除 WhatsApp/WeChat 上下文”</li>
                    <li>这会删除按手机保存的 WhatsApp/WeChat 上下文（消息）记忆，并重置当前运行中的 WhatsApp/WeChat 上下文</li>
                    <li>已配对设备的信息会被保留，仍可通过“Delete paired device(s)”进行管理</li>
                </ol>
                <p>如果您想彻底解除 Paiperwork 配对，请在手机 WhatsApp/WeChat 的 <strong>Linked devices</strong> 中操作。</p>
            `,
            },
            {
                id: "connectors-models-chat",
                title: "模型选择与聊天",
                content: `
                <p>连接成功后，WhatsApp 会使用聊天选项卡中当前选定的模型。</p>
                <p>您可以直接在 WhatsApp 聊天中查看当前启用的 AI 模型，并在那里切换模型。</p>
                <p>如果您想先进入模型控制模式，请发送 <code>模型模式</code>。</p>
                <h4>常用模型命令</h4>
                <ul>
                    <li><code>现在选择的模型</code></li>
                    <li><code>显示我的模型</code></li>
                    <li><code>把当前模型改为 &lt;模型名称&gt;</code></li>
                    <li><code>使用 &lt;模型名称&gt;</code></li>
                </ul>
                <p>如果您不希望通过 WhatsApp 切换模型，请在连接器选项卡中点击 <strong>Lock AI model</strong>。</p>
                <p>聊天部分可让您像平时一样通过 WhatsApp 与 AI 模型交流。需要实时网页结果时，请切换到 <strong>互联网模式</strong>。如果响应包含 HTML，Paiperwork 会把它作为可点击的 HTML 文件返回，便于预览或下载。</p>
                <h4>聊天使用示例</h4>
                <ul>
                    <li><code>你好</code></li>
                    <li><code>解释 OLED 和 Mini LED 的差异</code></li>
                </ul>
            `,
            },
            {
                id: "connectors-workflows",
                title: "文档、图表、研究、演示文稿与工件",
                content: `
                <p>连接器工作流默认保持在普通聊天中，只有在您明确进入某个模式后才会切换。请在下面各部分使用对应的模式关键词。</p>
                <h4>互联网</h4>
                <p>当您希望普通聊天直接使用实时网页搜索，而不是仅依赖模型本地知识作答时，请使用互联网模式。</p>
                <p>进入此模式可发送 <code>互联网模式</code>、<code>网络模式</code>、<code>网页搜索模式</code> 或 <code>在线模式</code>。</p>
                <ul>
                    <li><code>伊朗和美国战争的最新消息是什么？</code></li>
                    <li><code>我所在位置今天的天气怎么样？</code></li>
                    <li><code>在互联网上搜索今天广州的天气</code></li>
                </ul>

                <h4>文档</h4>
                <p>您可以针对已导入的文档提问，或请求生成摘要。文档名称不需要完全精确。</p>
                <p>进入此模式可发送 <code>文档模式</code> 或 <code>文件模式</code>。</p>
                <p>此功能要求您已在文档选项卡中安装并选择本地嵌入模型。</p>
                <ul>
                    <li><code>查看 文档</code></li>
                    <li><code>我想查看一个文档，但我不记得名称</code></li>
                    <li><code>我想问文档问题</code></li>
                    <li><code>总结 &lt;文档名称&gt;</code></li>
                    <li><code>&lt;文档名称&gt; 解释</code></li>
                    <li><code>&lt;文档名称&gt; 总结并创建演示文稿</code></li>
                    <li><code>&lt;文档名称&gt; 总结并创建迷你应用</code></li>
                </ul>
                <p>要退出文档后续模式，请使用 <code>退出文档模式</code> 或 <code>完成了</code>。</p>
                <h5>交互示例</h5>
                <p><strong>用户：</strong><code>&lt;文档名称&gt; 总结</code></p>
                <p><strong>Paiperwork：</strong>已提供文档总结。</p>
                <p><strong>Paiperwork：</strong>您想继续处理这个文档吗？</p>
                <p><strong>用户：</strong><code>是，创建演示文稿</code></p>
                <p><strong>Paiperwork：</strong>正在创建可提示的 SlideForge 演示文稿...</p>
                <p><strong>Paiperwork：</strong>演示文稿已创建，并作为 HTML 文件发送。</p>
                <p><strong>Paiperwork：</strong>您想继续修改这个演示文稿吗？</p>
                <p><strong>用户：</strong><code>不用了</code></p>
                <p><strong>Paiperwork：</strong>好的，演示文稿后续模式已关闭。</p>

                <h5>摘要与回答的后续转换</h5>
                <p>当 Paiperwork 已经发送文档摘要，或在文档提问模式中回答了问题后，您可以要求它直接转换已缓存的结果，而不是重新运行整个文档流程。</p>
                <ul>
                    <li><code>把摘要翻译成中文</code></li>
                    <li><code>把它缩短一点</code></li>
                    <li><code>把它改成要点列表</code></li>
                    <li><code>把那个回答改写得更清楚</code></li>
                </ul>

                <h4>图表</h4>
                <p>您可以请求 Paiperwork 支持的图表。图表创建完成后，会发送到您的 WhatsApp 对话中。</p>
                <p>进入此模式可发送 <code>图表模式</code>、<code>图形模式</code>、<code>数据可视化模式</code> 或 <code>可视化模式</code>。</p>
                <ul>
                    <li><code>创建一个示例饼图</code></li>
                    <li><code>创建一个示例雷达图</code></li>
                    <li><code>创建一个柱状图</code></li>
                </ul>
                <p>如果您想要真实图表而不是演示图表，请提供自己的数据。</p>

                <h4>研究</h4>
                <p>您可以让 Paiperwork 为您研究某个主题。标准报告通常约为 1000 到 1500 字，因此可能需要一些时间。</p>
                <p>进入此模式可发送 <code>研究模式</code> 或 <code>调研模式</code>。</p>
                <ul>
                    <li><code>研究 电动车电池的最新趋势 并总结初创公司的机会</code></li>
                    <li><code>创建一份关于澳大利亚房价的报告</code></li>
                    <li><code>创建一份关于英格兰天气的报告</code></li>
                    <li><code>再添加天气对海滩客流的影响</code></li>
                </ul>
                <p>要关闭研究后续模式，请回复 <code>不用了</code>、<code>不用</code> 或 <code>完成了</code>。</p>
                <h5>交互示例</h5>
                <p><strong>Paiperwork：</strong>已开始针对 <code>&lt;研究主题&gt;</code> 的研究。正在收集信息...</p>
                <p><strong>Paiperwork：</strong>完成后，请回复 <code>不用了</code>、<code>不用</code> 或 <code>完成了</code> 来关闭研究模式。</p>
                <p><strong>Paiperwork：</strong>您想继续完善这项研究吗？</p>
                <p><strong>用户：</strong><code>添加 &lt;额外研究补充&gt;</code></p>
                <p><strong>Paiperwork：</strong>带有额外补充的研究已开始。</p>
                <p><strong>Paiperwork：</strong>已发送完善后的研究结果。</p>
                <p><strong>Paiperwork：</strong>您想继续完善这项研究吗？</p>
                <p><strong>用户：</strong><code>完成了</code>、<code>不用了</code>、<code>不用</code></p>
                <p><strong>Paiperwork：</strong>好的，研究后续模式已关闭。</p>

                <h5>研究报告的后续转换</h5>
                <p>研究报告发送完成后，您可以继续基于已缓存的报告文本进行改写，而不需要重新发起新的研究。</p>
                <ul>
                    <li><code>把报告翻译成西班牙语</code></li>
                    <li><code>把它缩短一点</code></li>
                    <li><code>把它改成要点列表</code></li>
                    <li><code>把它改写成执行摘要</code></li>
                </ul>

                <h4>知识库</h4>
                <p>您可以通过 WhatsApp 浏览已保存的知识库，先列出知识集合，再打开一个集合，列出其中的知识条目，然后阅读所选条目。集合名称和条目名称不需要完全精确。</p>
                <p>进入此模式可发送 <code>知识模式</code>、<code>知识库模式</code> 或 <code>kb模式</code>。</p>
                <ul>
                    <li><code>显示 我的知识库</code></li>
                    <li><code>列出 我的知识集合</code></li>
                    <li><code>打开 &lt;集合名称&gt; 集合</code></li>
                    <li><code>显示 &lt;集合名称&gt; 知识集合</code></li>
                    <li><code>阅读 &lt;条目名称&gt; 条目</code></li>
                    <li><code>打开 &lt;条目名称&gt; 文章 从 &lt;集合名称&gt; 集合</code></li>
                </ul>
                <p>当 Paiperwork 发送某个知识条目后，该条目会保留在缓存中，您可以继续翻译、缩短、改写或改变格式，而不需要重新打开该集合。</p>
                <h5>Paiperwork:用户交互</h5>
                <p><strong>用户：</strong><code>显示 我的知识库</code></p>
                <p><strong>Paiperwork：</strong>以下是您的知识集合。</p>
                <p><strong>Paiperwork：</strong>请按编号或名称选择一个集合。</p>
                <p><strong>用户：</strong><code>打开 Project Research 集合</code></p>
                <p><strong>Paiperwork：</strong>以下是 <code>Project Research</code> 中的知识条目。</p>
                <p><strong>Paiperwork：</strong>请按编号或名称选择一个条目。</p>
                <p><strong>用户：</strong><code>阅读 Battery supply chain 条目</code></p>
                <p><strong>Paiperwork：</strong>正在发送来自 <code>Project Research</code> 的知识条目。</p>
                <p><strong>Paiperwork：</strong>条目内容已在 WhatsApp 中发送。</p>
                <p><strong>Paiperwork：</strong>您想继续处理这个知识条目吗？</p>

                <h5>知识条目的后续转换</h5>
                <p>知识条目发送完成后，您可以继续基于已缓存的条目文本进行转换，而不需要再次浏览知识库。</p>
                <ul>
                    <li><code>把条目翻译成西班牙语</code></li>
                    <li><code>把它缩短一点</code></li>
                    <li><code>把它改成要点列表</code></li>
                    <li><code>把这条笔记改写得更清楚</code></li>
                </ul>

                <h4>演示文稿</h4>
                <p>您可以通过提供源文本来创建演示文稿。除非您明确指定页数，否则 Paiperwork 会根据内容量估算幻灯片数量。</p>
                <p>进入此模式可发送 <code>演示模式</code>、<code>演示文稿模式</code> 或 <code>幻灯片模式</code>。</p>
                <div class="note"><p><strong>注意：</strong>WhatsApp 的手机、平板和电脑应用出于安全原因会限制代码执行，因此演示文稿可能无法在这些应用中正常显示。请使用 WhatsApp Web，将其下载到您的电脑后再正确查看。</p></div>
                <div class="note"><p><strong>注意：</strong>Wechat 的手机和平板版本出于安全原因会限制代码执行，因此演示文稿可能无法在这些版本中正常显示。请在电脑上使用 Wechat 应用，这样您可以将它们下载到电脑并正确查看（确保将文件保存到 Wechat 自身文件夹之外）。</p></div>
                <ul>
                    <li><code>用这段文字 创建演示文稿: &lt;演示文稿文本&gt;</code></li>
                    <li><code>使用以下文本 创建演示文稿: &lt;演示文稿文本&gt;</code></li>
                    <li><code>制作关于欧洲电动车政策的幻灯片，使用互联网搜索，7 幻灯片</code></li>
                    <li><code>列出 我的演示文稿</code></li>
                    <li><code>发送 &lt;演示文稿名称&gt;</code></li>
                </ul>
                <h5>交互示例</h5>
                <p><strong>用户：</strong><code>创建一个关于太阳系及其行星的演示文稿，在线搜索。</code></p>
                <p><strong>Paiperwork：</strong>正在使用网页搜索创建可提示的 SlideForge 演示文稿...</p>
                <p><strong>Paiperwork：</strong>演示文稿已创建，并作为 HTML 文件发送。</p>
                <p><strong>Paiperwork：</strong>您想继续修改这个演示文稿吗？</p>
                <p><strong>用户：</strong><code>是，把第 3 张幻灯片的背景改成蓝色主题</code></p>

                <h4>工件</h4>
                <p>您可以直接通过 WhatsApp 请求创建各种类型的工件或 HTML 迷你应用。</p>
                <p>进入此模式可发送 <code>迷你应用模式</code>、<code>小应用模式</code> 或 <code>工件模式</code>。</p>
                <div class="note"><p><strong>注意：</strong>WhatsApp 的手机、平板和电脑应用出于安全原因会限制代码执行，因此迷你应用可能无法在这些应用中正常显示或运行。请使用 WhatsApp Web，将其下载到您的电脑后再正确查看和使用。</p></div>
                <div class="note"><p><strong>注意：</strong>Wechat 的手机和平板版本出于安全原因会限制代码执行，因此迷你应用可能无法在这些版本中正常显示或运行。请在电脑上使用 Wechat 应用，这样您可以将它们下载到电脑并正确查看和使用（确保将文件保存到 Wechat 自身文件夹之外）。</p></div>
                <ul>
                    <li><code>创建一个放松的动态壁纸迷你应用，带不同噪声和低频振荡器，使用网页搜索</code></li>
                    <li><code>创建 Galaga 游戏工件</code></li>
                    <li><code>创建一个迷你应用来查找在线电视台</code></li>
                    <li><code>创建一个 mp3 player 工件</code></li>
                    <li><code>显示 我的迷你应用</code></li>
                    <li><code>显示 我的工件</code></li>
                    <li><code>发送 &lt;工件名称&gt; 迷你应用</code></li>
                    <li><code>发送 &lt;工件名称&gt; 工件</code></li>
                </ul>
                <h5>交互示例</h5>
                <p><strong>Paiperwork：</strong>您想继续修改这个迷你应用吗？</p>
                <p><strong>用户：</strong><code>是，修改背景</code></p>
                <p><strong>Paiperwork：</strong>您想继续修改这个迷你应用吗？</p>
                <p><strong>用户：</strong><code>不用了</code></p>
                <p><strong>Paiperwork：</strong>好的，工件修改模式已关闭。</p>

                <h4>后续模式与退出短语</h4>
                <p>Paiperwork 会按电话号码保留工作流上下文。当出现后续问题时，可继续的短语包括 <code>是</code>、<code>好的</code> 和 <code>继续</code>。可关闭的短语包括 <code>不用了</code>、<code>不用</code> 和 <code>完成了</code>。对于文档流程，您也可以用 <code>退出文档模式</code> 离开提问模式。</p>
                <p>如果要退出显式模式并返回普通聊天，请发送 <code>退出模式</code>、<code>关闭模式</code> 或 <code>离开模式</code>。</p>
                <p>同样的后续转换流程也适用于文档摘要、研究报告，以及文档提问模式下已经返回的回答。</p>
                <h5>交互示例</h5>
                <p><strong>用户：</strong><code>&lt;文档名称&gt; 总结</code></p>
                <p><strong>Paiperwork：</strong>已提供文档总结。</p>
                <p><strong>Paiperwork：</strong>您想继续处理这个文档吗？</p>
                <p><strong>用户：</strong><code>把摘要翻译成中文</code></p>
                <p><strong>Paiperwork：</strong>已提供缓存摘要的中文译文。</p>
                <p><strong>Paiperwork：</strong>您想继续处理这个文档吗？</p>
                <p><strong>用户：</strong><code>不用了</code></p>
                <p><strong>Paiperwork：</strong>好的，文档后续模式已关闭。</p>
            `,
            },
            {
                id: "connectors-notes",
                title: "运行说明与限制",
                content: `
                <ul>
                    <li>目前还不支持把文件和图片直接发送给 AI 模型。</li>
                    <li>文档工作流需要在文档选项卡中选择一个本地嵌入模型。</li>
                    <li>Paiperwork 默认保持在普通聊天中。文档、图表、模型、研究、演示文稿和迷你应用工作流只有在您发送对应的显式模式关键词后才会启动。</li>
                    <li>如果您从生成页面返回欢迎页面，或刷新浏览器，WhatsApp/WeChat 服务器都会关闭。您必须手动重新启动它，才能恢复 WhatsApp/WeChat 通信。</li>
                    <li>通过 WhatsApp/WeChat 生成的演示文稿和工件会作为 HTML 文件发回。之后您可以在 Paiperwork 中打开它们进行更深入的手动编辑。</li>
                    <li>在文档摘要、研究、演示文稿创建或迷你应用生成等长时间操作期间，您可以随时通过 WhatsApp/WeChat 发送 <code>Cancel</code>、<code>Stop</code> 或 <code>Exit</code> 来取消。</li>
                    <li>默认情况下，Paiperwork 会按 Master Key 用户隔离 WhatsApp/WeChat 连接器状态，因此已保存的会话、设备状态和排队中的运行时数据不会在同一台电脑上的不同 Master Key 用户之间泄露。</li>
                </ul>
            `,
            }
        ],
    },







};
