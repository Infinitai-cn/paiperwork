window.helpContent = {

    gettingstarted: {
        title: "Começando",
        intro: [
            "Bem-vindo ao Paiperwork, uma interface web segura para Ollama que prioriza a privacidade dos dados e facilidade de uso. Este assistente focado em profissionais oferece recursos de produtividade mantendo seus dados locais e protegidos.",
            "Voce pode baixar e executar modelos localmente no seu computador, ou usar modelos em nuvem se o seu hardware nao conseguir lidar com modelos locais. Modelos em nuvem exigem login no ollama.com e a criacao de uma chave de API. No primeiro uso de um modelo em nuvem, o Paiperwork solicitara essa chave e a armazenara criptografada no seu banco de dados local.",
            "Instrucoes detalhadas para usar modelos cloud da Ollama: 1) Baixe o Paiperwork em https://infinitai-cn.github.io/paiperwork/. 2) Descompacte o arquivo. 2.1) Se nao conseguir abrir o Paiperwork, verifique as configuracoes de seguranca para permitir a execucao. No Windows, clique no botao More info. No macOS, abra Privacidade e Seguranca nos Ajustes. 3) Acesse https://ollama.com e crie sua conta. 4) Baixe e instale o Ollama. 5) Na sua conta Ollama, abra Settings. 6) Abra Usage para ver quanto uso gratis ainda resta (importante). 7) Abra Keys, clique em Add API key, depois em Generate API key, e copie a chave gerada. 8) Salve a chave em um arquivo de texto no seu computador. 9) Execute o Paiperwork (Mac, Windows ou Linux). 10) Informe uma chave mestra e, na aba Chat, clique em Manage Cloud API key e adicione sua chave API da Ollama. 11) Agora voce pode usar os modelos cloud gratis da Ollama.",
            "Aviso do modo online (<a href=\"https://huggingface.co/spaces/Infinitai/Paiperwork\" target=\"_blank\" rel=\"noopener noreferrer\">Hugginface spaces</a>): Devido a requisitos locais, as abas Documents, Translate, Models e Connectors ficam desativadas no modo online. Essas abas sao ativadas quando voce executa o Paiperwork no seu computador."
        ],
        articles: [
            {
                id: "gs-welcome",
                title: "Tela de Boas-vindas",
                content: `
            <p>** Se você tem um laptop ou computador sem uma placa gráfica poderosa, sempre escolha modelos de tamanho pequeno para melhor desempenho (a menos que você tenha uma máquina com muita RAM e saiba o que está fazendo)**</p>
            <p>** Note que o Paiperwork usa instruções para seus recursos, <b>Modelos de Instrução são necessários</b> (não use modelos base ou modelos de texto/chat)**</p>
            <p>A tela de boas-vindas é seu ponto de partida para todas as interações com o Paiperwork.</p>
            <p>A partir daqui, você pode:</p>
            <ul>
            <li>Iniciar novas conversas e usar todas as opções do app com a IA inserindo uma Chave Mestra (Diferentes Chaves Mestras criarão Chats/configurações/dados separados dentro do banco de dados)</li>
            <li>Acessar seu histórico de conversas usando uma Chave Mestra previamente inserida</li>
            <li>Verificar atualizações do programa</li>
            <li>Acessar a documentação de ajuda</li>

                <h4>Editar lista de modelos Thinking</h4>
                <p>Use o botão <strong>Editar lista de modelos Thinking</strong> na aba Models para controlar quais modelos exibem o botão thinking na aba Chat.</p>
                <ul>
                    <li>O botão abre a lista <code>thinkingmodels.js</code></li>
                    <li>Adicione ou remova nomes de modelos dentro de <code>window.THINKING_MODELS</code></li>
                    <li>Salve a lista para atualizar o suporte a thinking imediatamente sem reiniciar o aplicativo</li>
                </ul>

                <h4>Editar lista de modelos Visuais</h4>
                <p>Use o botão <strong>Editar lista de modelos Visuais</strong> na aba Models para controlar quais modelos habilitam upload de imagens e outros recursos visuais na aba Chat.</p>
                <ul>
                    <li>O botão abre a lista <code>visualmodels.js</code></li>
                    <li>Adicione ou remova identificadores de modelos dentro de <code>window.VISUAL_MODELS</code></li>
                    <li>Salve a lista para atualizar a detecção de modelos visuais imediatamente sem reiniciar o aplicativo</li>
                </ul>
        </ul>
        
        <div class="note">
            <p><strong>Importante:</strong> A Chave Mestra que você insere serve a dois propósitos críticos:</p>
            <ul>
                <li>Pode criar ambientes de trabalho separados (Usando diferentes Chaves Mestras)</li>
                    <li>Salve o arquivo para aplicar as mudanças imediatamente sem reiniciar a aplicação</li>
            </ul>
            <p>Para acessar uma conversa anterior, você deve inserir a <em>exata mesma Chave Mestra</em> (diferencia maiúsculas e minúsculas) que você usou ao criá-la.</p>
        </div>
        
        <div class="note">
            <p><strong>Compatibilidade de Idiomas:</strong> Embora a interface do Paiperwork suporte múltiplos idiomas, para uma experiência ideal você deve usar modelos de IA treinados no seu idioma preferido. Se você estiver usando um idioma de interface não-inglês, considere usar modelos que suportem seu idioma para melhores resultados. Ao solicitar informações em recursos como Pesquisa ou chat geral, se você não receber a resposta/resultado no seu idioma, pode precisar especificar seu idioma de resposta preferido no seu prompt, por exemplo: "Por que os gatos têm pelos brancos? (Forneça esta pesquisa em espanhol)" ou "(Responda em francês)" para garantir que a IA responda no seu idioma desejado em vez de padrão em inglês.</p>
        </div>
        
         <div class="note">
          <p><strong>Idioma de Resposta da IA:</strong> O Paiperwork agora automaticamente força respostas da IA no seu idioma preferido baseado na sua seleção do menu suspenso de idiomas na página principal (index.html). O sistema adiciona automaticamente instruções de aplicação de idioma para garantir que todas as respostas da IA correspondam ao seu idioma de interface escolhido. Se você precisar de respostas em um idioma diferente para conversas específicas, pode sobrescrever isso adicionando "Você sempre responde em [idioma específico]" ao seu Prompt do Sistema na aba Chat. (A consistência do idioma de resposta dependerá da qualidade do modelo de IA)</p>
         </div>
        
        <div class="note">
            <p><strong>Compatibilidade com Sistemas de Baixa Performance:</strong> O Paiperwork foi testado e otimizado para compatibilidade com modelos de IA menores (como Qwen3.1 1.7B e Gemma3 4B) para garantir desempenho eficaz em sistemas de baixa performance. Esses modelos menores fornecem bons resultados enquanto requerem significativamente menos VRAM e recursos do sistema, tornando o Paiperwork acessível para usuários com capacidades de hardware limitadas.</p>
        </div>
        
        <div class="note">
            <p><strong>Suporte a Traduções:</strong> Se você encontrar traduções ausentes ou incorretas no Paiperwork, por favor nos informe em nossas <a href="https://github.com/discussions" target="_blank" rel="noopener noreferrer">Discussões do GitHub</a>. Seu feedback nos ajuda a melhorar a experiência multilíngue para todos os usuários.</p>
        </div>
    `,
                image: "welcome.png",
                imageAlt: "Tela de Boas-vindas do Paiperwork",
                imageCaption: "A tela de boas-vindas do Paiperwork mostrando o campo de entrada da Chave Mestra",
            },
            {
                id: "gs-topics",
                title: "Usando a Chave Mestra Efetivamente",
                content: `
               <p>As Chaves Mestras são fundamentais para como o Paiperwork funciona. Elas primariamente fornecem segurança para suas conversas.</p>
               
               <h4>Chave Mestra como Chaves de Segurança</h4>
               <p>Sua Chave Mestra atua como uma chave de criptografia que protege seus dados de conversa. Isso significa:</p>
               <ul>
                 <li>Chaves Mestras são <strong>sensíveis a maiúsculas e minúsculas</strong> - "Meu Projeto" e "meu projeto" são tratadas como Chaves Mestras diferentes</li>
                 <li>Você deve inserir exatamente a mesma Chave Mestra para acessar uma conversa anterior</li>
                 <li>Se você esquecer uma Chave Mestra, não poderá recuperar essa conversa</li>
                 <li>Escolha Chaves Mestras curtas e memoráveis que você possa facilmente lembrar depois</li>
               </ul>
               
               <h4>Criando Chaves Mestras Efetivas</h4>
               <p>Para melhores resultados com suas Chaves Mestras:</p>
               <ul>
                 <li>Mantenha-as curtas e fáceis de lembrar (ex: "ViagemItalia2025" ou "Planos Jardim")</li>
                 <li>Use padrões simples que você lembrará (ex: "Casa-2023" ou "Livro-Receitas")</li>
                 <li>Evite frases complexas com caracteres especiais ou espaçamento incomum</li>
                 <li>Considere usar auxiliares de memória pessoais que apenas você reconheceria</li>
               </ul>
               
               <div class="note">
                 <p><strong>Dica:</strong> Considere manter um registro seguro de Chaves Mestras importantes que você usa frequentemente, especialmente para projetos de longo prazo. Pense nas Chaves Mestras como senhas - elas precisam ser memoráveis e seguras.</p>
               </div>
             `,
                image: "memorabletopic.png",
                imageAlt: "Exemplo de Entrada de Chave Mestra",
                imageCaption: "Exemplo de inserir uma Chave Mestra curta e memorável",
            },
            {
                id: "gs-conversation",
                title: "Iniciando uma Conversa",
                content: `
                <p>Para iniciar uma nova conversa com a IA:</p>
                <ol>
                    <li>Insira uma Chave Mestra no campo "Digite a chave mestra aqui..."</li>
                    <li>Certifique-se de que sua Chave Mestra seja tanto descritiva quanto memorável</li>
                    <li>Clique no botão "Iniciar"</li>
                    <li>A interface de chat abrirá com sua nova conversa</li>
                </ol>
                <p>Se você usou esta Chave Mestra antes, o Paiperwork carregará seu histórico de conversas anterior.</p>
                <p>Se for uma nova Chave Mestra, uma conversa nova começará.</p>
            
                <h4>Gerenciando Conversas</h4>
                <p>No canto superior direito da tela de boas-vindas, você encontrará o botão "Deletar Todas as Informações". Use com cuidado, pois removerá permanentemente TODAS suas conversas e dados salvos.</p>
            `,
                image: "clickstart.png",
                imageAlt: "Iniciando uma nova conversa",
                imageCaption: "Digite sua Chave Mestra e clique em Iniciar para começar uma nova sessão de chat",
            },
            ],
    },
    chat: {
        title: "Chat",
        intro:
            "A interface de chat oferece recursos poderosos de conversação com IA e várias funcionalidades avançadas para aprimorar suas interações.",
        articles: [
            {
                id: "chat-basics",
                title: "Básico do Chat",
                content: `
            <p>A interface de chat é onde suas conversas com a IA acontecem. Foi projetada para ser intuitiva, mas poderosa, com várias funcionalidades-chave que ajudam você a obter o máximo de suas interações.</p>
            <div class="note">
                <p><strong>Importante:</strong> Atualizamos o prompt do sistema da IA com a data atual para propósitos de contexto temporal. Modelos de IA podem se confundir sobre eventos atuais, pois seu limite de conhecimento provavelmente é anterior à data atual. É sugerido usar busca na web ao perguntar sobre eventos atuais.</p>
            </div>
            <h4>Elementos Centrais do Chat</h4>
            <ul>
                <li><strong>Área de Mensagens</strong> - Onde o histórico de suas conversas aparece, com mensagens do usuário à direita e respostas da IA à esquerda</li>
                <li><strong>Campo de Entrada</strong> - Digite suas mensagens aqui e pressione Enter ou clique em Enviar para submeter</li>
                <li><strong>Botão Enviar</strong> - Envia sua mensagem e se transforma em um botão Cancelar durante a geração de resposta da IA</li>
                <li><strong>Seletor de Modelo</strong> - Escolha diferentes modelos de IA dependendo dos requisitos de sua tarefa</li>
                <li><strong>Exibição da Chave Mestra</strong> - Mostra sua Chave Mestra atual (mascarada por segurança). Clique para revelar temporariamente a chave real, o que ajuda a refrescar sua memória sobre qual chave de criptografia você está usando atualmente</li>
            </ul>
            
            <h4>Funcionalidade de Exibição da Chave Mestra</h4>
            <p>A exibição da Chave Mestra na interface de chat ajuda você a acompanhar sua chave de criptografia atual:</p>
            <ul>
                <li><strong>Exibição Segura</strong> - Por padrão, a Chave Mestra é mostrada como pontos (••••••••••••) para proteger sua privacidade</li>
                <li><strong>Clique para Revelar</strong> - Clique na exibição da Chave Mestra para mostrar temporariamente o texto real da chave</li>
                <li><strong>Auto-Ocultar</strong> - A chave se oculta automaticamente novamente após 3 segundos por segurança</li>
                <li><strong>Auxílio de Memória</strong> - Útil para confirmar qual Chave Mestra você está usando atualmente, especialmente ao trabalhar com múltiplos projetos</li>
            </ul>
            
            <h4>Controles de Mensagem</h4>
            <p>Cada resposta da IA inclui botões de ação na parte inferior que permitem:</p>
            <ul>
                <li><strong>Regenerar</strong> - Cria uma nova resposta para sua última mensagem, útil se você quiser uma resposta diferente</li>
                <li><strong>Excluir</strong> - Remove o par de mensagens (sua mensagem e a resposta da IA) da conversa</li>
                <li><strong>Copiar</strong> - Copia o conteúdo completo da resposta da IA para sua área de transferência</li>
            </ul>
            
            <h4>Cancelando a Geração</h4>
            <p>Se você quiser parar a IA enquanto ela está gerando uma resposta, simplesmente clique no botão vermelho Cancelar (que substituiu o botão Enviar). Isso para imediatamente o processo de geração e marca a resposta incompleta.</p>
            
            <div class="note">
                <p><strong>Dica:</strong> Para manter suas conversas organizadas, tente usar diferentes Chaves Mestras para diferentes assuntos ou projetos. Use a funcionalidade de exibição da Chave Mestra para confirmar que você está no contexto correto antes de iniciar conversas importantes.</p>
            </div>
        `,
                images: [
                    {
                        src: "chat_interface.png",
                        alt: "Interface de Chat",
                        caption:
                            "A interface de chat mostrando controles de conversa e opções de mensagem",
                    },
                    {
                        src: "Encrypted-database.png",
                        alt: "Banco de dados criptografado para chats e dados",
                        caption: "Banco de dados criptografado para chats e dados"
                    }
                ]

            },
            {
                id: "chat-system-prompt",
                title: "Usando Prompts do Sistema",
                content: `
            <p>O prompt do sistema é uma maneira poderosa de controlar como a IA se comporta em sua conversa. Pense nisso como definir instruções para a personalidade da IA, foco de conhecimento e estilo de resposta.</p>
            
            <h4>Acessando o Prompt do Sistema</h4>
            <p>Para visualizar e editar o prompt do sistema:</p>
            <ol>
                <li>Clique na aba "Prompt do Sistema" na interface de chat</li>
                <li>Edite o texto no campo de texto grande</li>
                <li>Clique em "Salvar" para aplicar suas alterações</li>
            </ol>
            
            <h4>Prompts de Sistema Eficazes</h4>
            <p>Para melhores resultados ao personalizar seu prompt do sistema:</p>
            <ul>
                <li>Seja específico sobre o papel da IA (ex: "Você é um assistente útil de programação especializado em JavaScript")</li>
                <li>Defina o estilo e formato preferido das respostas</li>
                <li>Especifique quaisquer limitações ou fronteiras</li>
                <li>Inclua quaisquer domínios de conhecimento especializados nos quais a IA deve se focar</li>
            </ul>
            
            <div class="note">
                <p><strong>Nota:</strong> Alterar o prompt do sistema irá redefinir o contexto da conversa, mas um botão "Continuar Conversa" aparecerá para ajudar a manter o fluxo da conversa.</p>
            </div>
        `,
                image: "system_prompt.png",
                imageAlt: "Editor de Prompt do Sistema",
                imageCaption:
                    "O editor de prompt do sistema permite personalizar o comportamento da IA",
            },

            {
                id: "chat-insights",
                title: "Insights da Conversa",
                content: `
            <p>A funcionalidade de Insights ajuda a IA a entender você melhor ao longo do tempo, aprendendo automaticamente a partir de suas mensagens.</p>
            
            <h4>Como os Insights Funcionam</h4>
            <p>Quando habilitado, o Paiperwork analisa suas mensagens para extrair informações relevantes sobre suas preferências, interesses e estilo de comunicação. Isso ajuda a IA a fornecer respostas mais personalizadas quanto mais você interage com ela.</p>
            
            <ul>
                <li><strong>Focado na Privacidade</strong> - Os insights são criptografados de forma segura usando sua Chave Mestra e armazenados localmente em seu dispositivo</li>
                <li><strong>Análise Seletiva</strong> - Apenas mensagens que contêm preferências pessoais são analisadas</li>
                <li><strong>Não-Identificável</strong> - O sistema foca em características gerais em vez de detalhes pessoais específicos</li>
                <li><strong>Tempo de Processamento</strong> - Se você usar um modelo de raciocínio, os insights levarão significativamente mais tempo para serem gerados, já que o modelo raciocinará por algum tempo antes de criar o insight</li>
            </ul>
            
            <h4>Gerenciando Insights</h4>
            <p>Você tem controle completo sobre a funcionalidade de Insights:</p>
            
            <h5>Habilitando ou Desabilitando a Coleta de Insights</h5>
            <ol>
                <li>Clique na aba "Chat" na interface de chat</li>
                <li>Encontre o interruptor "Insights" (no topo)</li>
                <li>Ligue ou desligue para desabilitar</li>
            </ol>
            <p>Quando desabilitado, nenhum novo insight será coletado de suas mensagens futuras. Insights previamente armazenados permanecem no banco de dados e ainda serão carregados e usados para aprimorar o entendimento da IA sobre você.</p>
            
            <h5>Visualizando e Gerenciando Insights Armazenados</h5>
            <p>Você pode visualizar, editar e excluir insights armazenados:</p>
            <ol>
                <li>Encontre o pequeno botão "e" à esquerda do interruptor de Insights</li>
                <li>Clique neste botão para abrir o Editor de Insights</li>
                <li>Na janela do editor, você pode:</li>
                <ul>
                    <li><strong>Visualizar</strong> - Ver todos os insights que o sistema coletou sobre você</li>
                    <li><strong>Editar</strong> - Modificar qualquer insight existente que seja impreciso ou precise de atualização</li>
                    <li><strong>Excluir</strong> - Remover insights específicos que você não quer que a IA use</li>
                    <li><strong>Adicionar</strong> - Criar novos insights manualmente para guiar o entendimento da IA</li>
                </ul>
                <li>Clique em "Salvar Alterações" para aplicar suas modificações</li>
            </ol>
            <p>Após salvar as alterações, o prompt do sistema será automaticamente reconstruído para incorporar suas preferências atualizadas.</p>
            
            <h4>Como os Insights Estão Sempre Disponíveis</h4>
            <p>Os insights funcionam de forma diferente do interruptor de coleta:</p>
            <ul>
                <li><strong>Sempre Carregados</strong> - When you start a conversation, all stored insights are automatically loaded from the database</li>
                <li><strong>Aprimoramento Contínuo</strong> - Seus insights aprimoram toda conversa, ajudando a IA a entender suas preferências</li>
                <li><strong>Interruptor Controla Apenas a Coleta</strong> - O interruptor apenas controla se novos insights são criados a partir de mensagens futuras</li>
                <li><strong>Gerenciamento Manual</strong> - Use o botão "e" para gerenciar insights existentes independentemente do estado do interruptor</li>
            </ul>
            
            <h4>O Que É Analisado</h4>
            <p>O sistema analisa seletivamente mensagens que contêm:</p>
            <ul>
                <li>Auto-referências (frases começando com "Eu" como "Eu prefiro..." ou "Eu gosto...")</li>
                <li>Mensagens mais longas e detalhadas (tipicamente 5+ palavras)</li>
                <li>Mensagens contendo preferências pessoais ou opiniões</li>
            </ul>
            
            <div class="note">
                <p><strong>Nota de Privacidade:</strong> Todos os insights são criptografados com sua Chave Mestra e armazenados localmente em seu dispositivo. Eles só são acessíveis quando você insere exatamente a mesma Chave Mestra que foi usada para criptografá-los. Os insights são sempre carregados quando disponíveis para aprimorar suas conversas, mas você pode excluí-los individualmente usando o editor de insights se não quiser mais que sejam usados.</p>
            </div>
            `,
                images: [
                    {
                        src: "insights_feature.png",
                        alt: "Interruptor da Funcionalidade de Insights",
                        caption: "O interruptor de Insights na aba Configurações da interface de chat"
                    },
                    {
                        src: "insights_editor.png",
                        alt: "Editor de Insights",
                        caption: "A interface do Editor de Insights para gerenciar insights armazenados"
                    },
                    {
                        src: "Insightslog.png",
                        alt: "Logs da Funcionalidade de Insights",
                        caption: "Os logs de Insights no console do navegador"
                    }
                ]
            },
            {
                id: "chat-advanced-features",
                title: "Recursos Avançados do Chat",
                content: `
                 <h4>Controle do Tamanho do Contexto</h4>
                 <p>O tamanho do contexto determina quanto da sua conversa anterior a IA pode "lembrar" e usar ao gerar respostas:</p>
                 <ul>
                     <li><strong>Tamanho de Contexto Automático</strong> - Ao selecionar um modelo, o sistema automaticamente define o tamanho de contexto ideal com base nas capacidades do modelo</li>
                     <li><strong>Otimização Específica do Modelo</strong> - A janela de contexto nativa de cada modelo é detectada e aplicada</li>
                     <li><strong>Conservação de Recursos</strong> - Inicialmente limitado a 8K para evitar uso excessivo de recursos, mas pode ser aumentado manualmente</li>
                     <li><strong>Ajuste Manual</strong> - Selecione o tamanho de contexto desejado no menu suspenso (de 1K a 10M tokens) para substituir a configuração automática</li>
                     <li><strong>Configurações Persistentes</strong> - Sua preferência de tamanho de contexto é lembrada entre sessões para cada modelo</li>
                 </ul>
                 
                 <h5>Como o Tamanho do Contexto Afeta o Uso de Memória</h5>
                 <p>O tamanho do contexto tem um impacto direto nos requisitos de RAM e VRAM (memória da placa gráfica):</p>
                 <ul>
                     <li><strong>Cálculo de memória</strong> - Para cada token na sua janela de contexto, o modelo precisa alocar memória para cálculos de atenção</li>
                     <li><strong>Relação de escalonamento</strong> - O uso de memória escala quadraticamente com o tamanho do contexto, não linearmente (dobrar o tamanho do contexto pode quadruplicar os requisitos de memória)</li>
                     <li><strong>Fatores combinados</strong> - O uso total de memória depende tanto do tamanho do modelo (parâmetros) quanto do comprimento do contexto</li>
                 </ul>
                 
                 <h5>Diretrizes de Tamanho de Contexto Manual</h5>
                 <p>Como diretriz geral para requisitos de memória:</p>
                 <ul>
                     <li><strong>contexto 4K</strong> - Requer aproximadamente 1GB de VRAM/RAM</li>
                     <li><strong>contexto 8K</strong> - Requer aproximadamente 2GB de VRAM/RAM</li>
                     <li><strong>contexto 16K</strong> - Requer aproximadamente 4GB de VRAM/RAM</li>
                     <li><strong>contexto 32K</strong> - Requer aproximadamente 8GB de VRAM/RAM</li>
                     <li><strong>contexto 64K</strong> - Requer aproximadamente 16GB de VRAM/RAM</li>
                     <li><strong>contexto 128K+</strong> - Requer 32GB+ VRAM/RAM para sistemas de alta performance</li>
                 </ul>
                 
                 <p>Ao aumentar o tamanho do contexto, observe estes sinais de pressão de memória:</p>
                 <ul>
                     <li>A resposta do modelo é sem sentido ou o modelo despeja o prompt do sistema na resposta (diminua primeiro o contexto para uma configuração pequena para verificar se a resposta está correta, depois aumente com cuidado)</li>
                     <li>Geração de resposta mais lenta</li>
                     <li>Sistema tornando-se menos responsivo</li>
                     <li>Erros do Ollama relacionados a condições de falta de memória</li>
                     <li>Indicador de porcentagem de contexto ficando laranja ou vermelho</li>
                 </ul>
                 
                 <div class="note">
                     <p><strong>Dica:</strong>Se você tiver problemas de memória, sempre tente uma configuração conservadora primeiro.</p>
                 </div>
                 
                 <h4>Modelos de Pensamento Nativos (Ollama 0.9.0+)</h4>
                 <p>O Paiperwork suporta a funcionalidade de pensamento nativo do Ollama para modelos de raciocínio compatíveis, que permite que modelos de IA mostrem seu processo de pensamento passo a passo:</p>
                 
                 <h5>Requisitos do Sistema</h5>
                 <ul>
                     <li><strong>Versão do Ollama</strong> - Requer Ollama 0.9.0 ou superior para suporte a pensamento nativo</li>
                     <li><strong>Modelos Compatíveis</strong> - Funciona com modelos habilitados para pensamento como DeepSeek-R1 e modelos de raciocínio qwen3 (mais virão em versões futuras)</li>
                     <li><strong>Detecção Automática</strong> - O Paiperwork detecta automaticamente sua versão do Ollama e compatibilidade do modelo</li>
                 </ul>
                 
                 <h5>Botão de Alternância de Pensamento</h5>
                 <p>Quando você seleciona um modelo de pensamento compatível com Ollama 0.9.0+, um botão de alternância de pensamento aparece automaticamente:</p>
                 <ul>
                     <li><strong>Aparição Automática</strong> - O botão só aparece quando tanto a versão do Ollama quanto o modelo suportam pensamento</li>
                     <li><strong>Controle de Alternância</strong> - Clique para habilitar ou desabilitar a exibição do processo de pensamento do modelo</li>
                     <li><strong>Indicador Visual</strong> - O botão mostra um estado ativo quando o pensamento está habilitado</li>
                     <li><strong>Configuração Persistente</strong> - Sua preferência de pensamento é lembrada entre sessões</li>
                 </ul>
                 
                 <h5>Como o Pensamento Nativo Funciona</h5>
                 <ul>
                     <li><strong>Exibição de Pensamento</strong> - Quando habilitado, você verá o processo de raciocínio interno do modelo em uma seção de pensamento separada</li>
                     <li><strong>Processamento em Tempo Real</strong> - Observe a IA trabalhar através de problemas passo a passo enquanto gera respostas</li>
                     <li><strong>Seções Recolhíveis</strong> - O conteúdo do pensamento pode ser recolhido para focar na resposta final</li>
                     <li><strong>Impacto na Performance</strong> - O modo de pensamento normalmente demora mais pois o modelo processa mais minuciosamente</li>
                 </ul>
                 
                 <h5>Modelos de Pensamento Não-Ollama</h5>
                 <p>O Paiperwork também suporta modelos de raciocínio que têm capacidades de pensamento incorporadas mas não usam a API de pensamento nativo do Ollama:</p>
                 <ul>
                     <li><strong>Sem Botão de Alternância</strong> - Esses modelos não mostrarão o botão de alternância de pensamento pois lidam com raciocínio internamente, mas exibirão o contêiner de pensamento</li>
                     <li><strong>Raciocínio Incorporado</strong> - Modelos como Reflection podem mostrar raciocínio como parte de sua resposta normal</li>
                     <li><strong>Modificação do Prompt do Sistema</strong> - Modelos como Cogito requerem um comando especial no prompt do sistema: Habilitar sub-rotina de pensamento profundo, outros podem precisar deste comando (/think, /no_think) no prompt do sistema ou no prompt do usuário</li>
                 </ul>
                 
                 <h5>Usando Modelos de Pensamento Efetivamente</h5>
                 <ul>
                     <li><strong>Problemas Complexos</strong> - Mais adequados para raciocínio multi-etapas, problemas matemáticos ou análise complexa</li>
                     <li><strong>Depuração de Código</strong> - Excelente para entender como a IA aborda problemas de código</li>
                     <li><strong>Ferramenta de Aprendizado</strong> - Observe como a IA quebra tópicos complexos para propósitos educacionais</li>
                     <li><strong>Qualidade vs Velocidade</strong> - Habilite pensamento para respostas de maior qualidade; desabilite para respostas mais rápidas e diretas</li>
                 </ul>
                 
                 <div class="note">
                     <p><strong>Importante:</strong> Se você não vê o botão de alternância de pensamento, verifique se está usando Ollama 0.9.0 ou superior e selecionou um modelo de pensamento compatível. Alguns modelos de raciocínio mais antigos podem não suportar a API de pensamento nativo mas ainda podem fornecer raciocínio como parte de sua geração de resposta normal.</p>
                 </div>
                 
                 <h4>Upload de Imagem (Modelos Visuais)</h4>
                 <p>Ao usar modelos de IA visuais como Mistral small 3.1 ou Gemma3, você pode fazer upload de imagens para discutir:</p>
                 <ul>
                     <li>Clique no botão de imagem próximo ao campo de entrada</li>
                     <li>Selecione uma imagem do seu dispositivo ou arraste e solte na área de upload</li>
                     <li>Para modelos Gemma3, você pode fazer upload de múltiplas imagens de uma vez (máximo 3)</li>
                     <li>Faça transcrições (OCR), faça perguntas ou obtenha descrições baseadas nas imagens carregadas</li>
                 </ul>
                 
                 <h4>Integração de Busca na Web</h4>
                 <p>Habilite busca na web em tempo real para ajudar a IA a fornecer informações atualizadas:</p>
                 <ul>
                     <li>Clique no botão Web para alternar a capacidade de busca na web</li>
                     <li>Quando habilitado, a IA pode buscar na internet por informações atuais</li>
                     <li>Isso é especialmente útil para perguntas sobre eventos recentes ou fatos específicos</li>
                     <li>A busca na web envia apenas o prompt de busca para a web (Bing.com) para consultas, nenhum dado pessoal, estatísticas ou métricas são enviados</li>
                 </ul>
                 
                 <h4>Imagem + Busca na Web (Recurso Avançado)</h4>
                 <p>Combine análise de imagem com busca na web para capacidades poderosas de pesquisa visual:</p>
                 <h5>Como Funciona</h5>
                 <ol>
                     <li><strong>Faça Upload de uma Imagem</strong> - Adicione uma imagem usando o botão de upload de imagem</li>
                     <li><strong>Habilite Busca na Web</strong> - Certifique-se de que o botão Web está ativado (Laranja)</li>
                     <li><strong>Faça Sua Pergunta</strong> - Descreva o que você quer encontrar sobre ou similar à sua imagem</li>
                     <li><strong>Análise da IA</strong> - A IA primeiro analisa sua imagem para gerar termos de busca</li>
                     <li><strong>Busca na Web</strong> - O sistema busca na web usando palavras-chave geradas pela IA</li>
                     <li><strong>Resposta Combinada</strong> - Você recebe tanto análise visual quanto resultados de busca na web</li>
                 </ol>
                 
                 <h5>Perfeito para:</h5>
                 <ul>
                     <li>Encontrar imagens ou produtos similares online</li>
                     <li>Pesquisar estilos arquitetônicos, obras de arte ou designs</li>
                     <li>Identificar plantas, animais ou objetos com contexto adicional</li>
                     <li>Obter informações de mercado sobre produtos fotografados</li>
                     <li>Encontrar contexto histórico ou cultural para imagens</li>
                     <li>Busca reversa de imagem com aprimoramento de IA</li>
                 </ul>
                 
                 <h5>Requisitos:</h5>
                 <ul>
                     <li>Modelo de IA visual selecionado (Qwen2.5vl, Mistral-small3.1, Gemma3, LLaVA, etc.)</li>
                     <li>Busca na web habilitada (botão Web ativo)</li>
                     <li>Imagem clara e de alta qualidade carregada (tamanho: máx. 5MB)</li>
                     <li>Conexão de internet para funcionalidade de busca na web</li>
                 </ul>
                 
                 <h5>Exemplo de Uso:</h5>
                 <p class="example-prompt"><strong>Prompt de Exemplo:</strong> "Encontre imagens e informações sobre móveis similares a esta cadeira. Estou procurando peças modernas de meados do século com elementos de design similares e quero saber sobre preços e onde comprá-las."</p>
                 <p>Isso resultaria em:</p>
                 <ol>
                     <li>IA analisando o estilo da cadeira, materiais e características de design</li>
                     <li>Busca na web por "cadeira moderna meados século pernas madeira assento estofado design móveis"</li>
                     <li>Resposta combinada com análise visual + produtos similares + preços + varejistas</li>
                 </ol>
                 
                 <div class="note">
                     <p><strong>Dica Profissional:</strong> Seja específico sobre o que você quer encontrar. Em vez de apenas "encontrar imagens similares", tente "encontrar pôsteres vintage similares dos anos 1950 com informações de preços" ou "identificar esta espécie de planta e encontrar instruções de cuidado."</p>
                 </div>
                 
                <h4>Exportar Conversas</h4>
                 <p>Você pode exportar todo o histórico de suas conversas em diferentes formatos:</p>
                 <ul>
                     <li>Navegue até a aba Chat e role até o final da interface</li>
                     <li>Clique no botão "Exportar Conversa" localizado logo acima do botão "Limpar Sessão Atual"</li>
                     <li>Escolha entre formatos texto simples (.txt), markdown (.md) ou HTML (.html)</li>
                     <li>Arquivos baixados incluem todas as mensagens e preservam formatação de código</li>
                 </ul>
             `,
                images: [
                    {
                        src: "chat_export.png",
                        alt: "Exportação de chat",
                        caption: "Funcionalidades de exportação de chat"
                    },
                    {
                        src: "thinking_toggle_button.png",
                        alt: "Alternância de Pensamento Nativo",
                        caption: "O botão de alternância de pensamento que aparece com modelos compatíveis e Ollama 0.9.0+"
                    }
                ]
            },
            {
                id: "chat-code-blocks",
                title: "Trabalhando com Blocos de Código",
                content: `
            <p>O Paiperwork fornece suporte aprimorado para blocos de código dentro das conversas:</p>
            
            <h4>Funcionalidades de Blocos de Código</h4>
            <ul>
                <li><strong>Destaque de Sintaxe</strong> - O código é colorido baseado na linguagem de programação</li>
                <li><strong>Detecção de Linguagem</strong> - A IA identifica automaticamente e rotula a linguagem do código</li>
                <li><strong>Botão Copiar</strong> - Cópia com um clique de blocos de código para a área de transferência</li>
                <li><strong>Números de Linha</strong> - Para referência mais fácil em trechos mais longos</li>
            </ul>
            
            <h4>Executando Código</h4>
            <p>Para linguagens suportadas, você pode executar código diretamente da interface de chat:</p>
            <ul>
                <li><strong>Visualização HTML</strong> - Renderiza código HTML para ver o resultado imediatamente. Dica: Peça à IA para incluir qualquer código CSS ou JavaScript dentro do HTML para evitar erros, já que o código HTML será isolado em uma janela flutuante sem acesso a outros arquivos de configuração ou código</li>
            </ul>
            
            <div class="note">
                <p><strong>Nota de Segurança:</strong> A execução de código acontece em sandboxes isolados para garantir segurança.</p>
            </div>
        `,

                images: [
                    {
                        src: "code_blocks.png",
                        alt: "Funcionalidades de Blocos de Código",
                        caption:
                            "Bloco de código HTML com destaque de sintaxe e opções de execução",
                    },
                    {
                        src: "HTML-sandboxed.png",
                        alt: "Código HTML executando em sandbox",
                        caption: "Código HTML executando em uma janela flutuante isolada."
                    }
                ]
            },
            {
                id: "chat-scroll-behavior",
                title: "Rolagem e Navegação",
                content: `
            <p>A interface de chat inclui comportamento inteligente de rolagem para aprimorar a usabilidade durante conversas:</p>
            
            <h4>Rolagem Automática</h4>
            <ul>
                <li>Novas mensagens automaticamente rolam para a visualização</li>
                <li>Durante a geração de resposta da IA, a visualização segue a mensagem conforme ela cresce</li>
                <li>A rolagem automática desabilita temporariamente quando você rola manualmente para cima para ler mensagens anteriores</li>
                <li>A rolagem automática reabilita após um período de inatividade (aproximadamente 5 segundos)</li>
                <li>A rolagem automática reabilita imediatamente se você rolar até o final</li>
            </ul>
            
            <h4>Conversas Longas</h4>
            <p>Para navegar conversas longas:</p>
            <ul>
                <li>Role livremente para revisar mensagens anteriores</li>
                <li>A barra de navegação fixa permanece acessível no topo</li>
                <li>Mudanças no prompt do sistema ou tamanho do contexto adicionarão um botão "Continuar Conversa" para ajudar a manter o contexto, também note que se você ficar sem contexto, o botão continuar aparecerá (O botão continuar sempre calculará quantas mensagens passadas resumir baseado no seu tamanho de contexto atual e usar 25% dele para evitar que mensagens passadas transbordem seu contexto)</li>
            </ul>
        `,
            },
            {
                id: "chat-conversation-sessions",
                title: "Gerenciando Sessões de Conversa",
                content: `
            <p>O Paiperwork organiza suas conversas em grupos de sessão que ajudam você a acompanhar diferentes tópicos de discussão dentro do mesmo assunto.</p>
            
            <h4>Lista de Sessões de Conversa</h4>
            <p>A barra lateral esquerda na visualização de chat exibe suas sessões de conversa:</p>
            <ul>
                <li>Cada sessão mostra uma prévia da primeira mensagem</li>
                <li>Sessões exibem a data e hora em que foram criadas</li>
                <li>Sessões são separadas por linhas divisórias sutis para distinção fácil</li>
                <li>As sessões mais recentes aparecem no topo</li>
            </ul>
            
            <h4>Trabalhando com Sessões</h4>
            <ul>
                <li><strong>Carregar uma sessão</strong> - Clique em qualquer sessão para carregar a conversa</li>
                <li><strong>Excluir uma sessão</strong> - Passe o mouse sobre uma sessão e clique no botão "×" que aparece</li>
                <li><strong>Sessão ativa</strong> - A sessão carregada atualmente está destacada</li>
            </ul>
            
            <h4>Iniciando uma Nova Conversa</h4>
            <p>Para começar uma conversa fresca sem mudar seu tópico:</p>
            <ol>
                <li>Clique no botão "Novo Chat" no topo da lista de sessões</li>
                <li>Isso limpa a conversa atual e redefine o contexto</li>
                <li>Uma mensagem de boas-vindas aparece indicando que você iniciou uma nova conversa</li>
                <li>Todas as sessões anteriores permanecem acessíveis na barra lateral</li>
            </ol>
            
            <h4>Continuando Conversas</h4>
            <p>Quando você seleciona uma sessão anterior:</p>
            <ul>
                <li>O histórico completo da conversa é carregado</li>
                <li>Um botão "Continuar Conversa" aparece na parte inferior</li>
                <li>Clique neste botão para retomar a conversa com contexto completo</li>
                <li>O campo de entrada permanece desabilitado até você clicar em continuar, prevenindo mensagens acidentais</li>
            </ul>
            
            <div class="note">
                <p><strong>Nota:</strong> Excluir uma sessão é permanente e não pode ser desfeito. Quando você exclui um grupo de conversa, apenas essa thread específica é removida - todas as outras sessões dentro da mesma Chave Mestra permanecem intactas.</p>
            </div>
        `,
                image: "conversations-list.png",
                imageAlt: "Interface de Sessões de Conversa",
                imageCaption: "A lista de sessões mostrando múltiplas threads de conversa com texto de prévia e timestamps",
            },
        ],
    },
    documents: {
        title: "Documentos",
        intro: "A aba Documentos permite carregar, gerenciar e interagir com seus documentos usando assistência de IA.",
        articles: [
            {
                id: "docs-intro",
                title: "Introdução aos Documentos",
                content: `
                <p>A aba Documentos permite trabalhar com seus documentos de texto e PDF, utilizando IA para ajudar a entender e extrair informações deles.</p>
                
                <p>Com o recurso Documentos, você pode:</p>
                <ul>
                    <li>Carregar arquivos PDF e de texto</li>
                    <li>Fazer perguntas sobre documentos específicos</li>
                    <li>Gerar resumos abrangentes</li>
                    <li>Pesquisar em sua coleção de documentos</li>
                    <li>Gerenciar sua biblioteca de documentos</li>
                </ul>
                
                <div class="note">
                    <p><strong>Nota:</strong> Os documentos são criptografados com segurança usando sua Chave Mestra e armazenados localmente em seu dispositivo, garantindo que suas informações sensíveis permaneçam privadas.</p>
                </div>
            `,
                image: "documents_intro.png",
                imageAlt: "Visão Geral da Aba Documentos",
                imageCaption: "Interface da aba Documentos mostrando a área de upload e lista de documentos",
            },
            {
                id: "docs-model-compatibility",
                title: "Compatibilidade de Modelos para Documentos",
                content: `
                <p>O recurso Documentos requer modelos de IA que suportem embeddings para funcionar adequadamente. Entender a compatibilidade de modelos ajudará você a evitar problemas e otimizar seu fluxo de trabalho com documentos.</p>
                
                <h4>Modelos e Suporte a Embeddings</h4>
                <p>Para que as funcionalidades de processamento e busca de documentos funcionem, você precisa de modelos que suportem a geração de embeddings:</p>
                <ul>
                  <li><strong>Modelos compatíveis</strong> incluem: nomic-embed-text, llama3 (vários tamanhos), mistral, mixtral e outros modelos especificamente projetados para suportar embeddings (Deepseek, Qwen, etc)</li>
                  <li><strong>Modelos incompatíveis</strong>: Alguns modelos não suportam embeddings e acionarão uma notificação de aviso se você tentar usá-los com o recurso Documentos</li>
                  <li><strong>Modelos visuais</strong>: Modelos visuais às vezes têm o processamento de embeddings removido de seu código</li>
                </ul>
                
                <h4>Sistema de Aviso de Embeddings</h4>
                <p>Quando você tenta usar um modelo que não suporta embeddings para operações de documentos, o sistema irá:</p>
                <ul>
                  <li>Exibir uma notificação de aviso proeminente</li>
                  <li>Explicar que o modelo selecionado é incompatível com a funcionalidade de busca de documentos</li>
                  <li>Sugerir modelos alternativos que suportam embeddings</li>
                  <li>Fornecer um link para encontrar modelos capazes de embeddings</li>
                </ul>
                <p>A notificação de aviso será automaticamente dispensada após 30 segundos ou você pode fechá-la manualmente clicando no botão "Entendi".</p>
                
                <h4>Otimização de Fluxo de Trabalho</h4>
                <p>Você pode otimizar seu fluxo de trabalho com documentos entendendo quando os embeddings são criados e usados:</p>
                <ul>
                  <li><strong>Processamento inicial de documentos</strong>: Embeddings são criados quando você primeiro carrega e processa documentos</li>
                  <li><strong>Consultas subsequentes de documentos</strong>: Após os documentos serem processados, você pode alternar para um modelo diferente (com suporte a embeddings) para consultas sem precisar regenerar embeddings</li>
                </ul>
                
                <h4>Usando Diferentes Modelos para Diferentes Tarefas</h4>
                <p>Uma estratégia útil de fluxo de trabalho:</p>
                <ol>
                  <li>Selecione um modelo menor capaz de embeddings (como nomic-embed-text) ao carregar e processar documentos</li>
                  <li>Após os documentos serem processados, você pode alternar para um modelo mais poderoso (com suporte a embeddings) para melhores respostas a perguntas</li>
                  <li>O sistema usará os embeddings armazenados do processamento original, independentemente de qual modelo você tenha selecionado atualmente</li>
                </ol>
                
                <div class="note">
                  <p><strong>Dica Profissional:</strong> Para resultados ótimos, use modelos de embedding dedicados como nomic-embed-text para processamento inicial de documentos, depois mude para modelos de linguagem maiores como llama3:70b, Gemma3, Qwen3, etc, para consultas e análises de documentos mais sofisticadas.</p>
                </div>
              `,
                image: "model-embedding-warning.png",
                imageAlt: "Aviso de Embedding de Modelo",
                imageCaption: "Notificação de aviso ao tentar usar um modelo que não suporta embeddings"
            },
            {
                id: "docs-uploading",
                title: "Carregando Documentos",
                content: `
                <p>Você pode facilmente adicionar documentos à sua biblioteca através da interface de upload.</p>
                
                <h4>Como Carregar Documentos</h4>
                <ol>
                    <li>Navegue até a aba Documentos</li>
                    <li>Arraste e solte arquivos PDF ou de texto na zona de upload, ou clique na área de upload para procurar arquivos</li>
                    <li>Selecione um ou mais arquivos do seu dispositivo</li>
                    <li>Aguarde a conclusão do processamento</li>
                </ol>
                
                <h4>Processando Seus Documentos</h4>
                <p>Quando você carrega documentos, o sistema:</p>
                <ul>
                    <li>Verifica arquivos PDF para conteúdo de texto extraível</li>
                    <li>Divide o conteúdo em pedaços gerenciáveis</li>
                    <li>Cria representações amigáveis à IA (embeddings) do conteúdo</li>
                    <li>Criptografa e armazena tudo com segurança localmente</li>
                    <li>Torna o documento disponível para perguntas e pesquisas</li>
                </ul>
                
                <h4>Detecção de Texto em PDF</h4>
                <p>O Paiperwork verifica automaticamente arquivos PDF para garantir que contenham texto extraível:</p>
                <ul>
                    <li>Cada PDF é analisado para detectar conteúdo de texto antes do processamento começar</li>
                    <li>Se um PDF não contém texto extraível (como imagens escaneadas sem OCR), você receberá uma notificação de aviso</li>
                    <li>PDFs sem texto não podem ser processados para RAG, pois requerem conteúdo de texto para embedding e pesquisa</li>
                    <li>Para PDFs apenas com imagens, considere usar um modelo de IA visual para extração de texto ou ferramenta OCR para converter imagens em texto antes do upload</li>
                </ul>
                
                <div class="note">
                    <p><strong>Importante:</strong> Use o seletor de <strong>modelo de embedding</strong> na aba Documentos ao carregar e processar arquivos. Esse seletor mostra modelos compatíveis com embeddings e seleciona automaticamente o primeiro disponível.</p>
                    <p>Se nenhum modelo de embedding estiver disponível, uma janela de informação será exibida com exemplos de modelos e um botão <strong>Ir para baixar modelo</strong> que abre a aba Modelos.</p>
                    <p><strong>Nota:</strong> A busca global de documentos usa o modelo selecionado no seletor de modelo da aba Chat.</p>
                </div>
            `,
                image: "documents-upload.png",
                imageAlt: "Processo de Upload de Documentos",
                imageCaption: "Zona de upload com indicador de progresso para processamento de documentos",
            },
            {
                id: "docs-management",
                title: "Gerenciando Seus Documentos",
                content: `
                <p>Após o upload, seus documentos aparecem na lista de documentos onde você pode gerenciá-los.</p>
                
                <h4>Informações do Documento</h4>
                <p>Cada entrada de documento mostra:</p>
                <ul>
                    <li>Título/nome do arquivo do documento</li>
                    <li>Informações do autor (quando disponível)</li>
                    <li>Data de adição à sua biblioteca</li>
                    <li>Contagem de páginas (para arquivos PDF)</li>
                    <li>Número de pedaços de texto criados</li>
                    <li>Status de processamento (Processando ou Indexado)</li>
                </ul>
                
                <h4>Ações do Documento</h4>
                <p>Você pode realizar várias ações com seus documentos:</p>
                <ul>
                    <li><strong>Selecionar/Desselecionar</strong> - Clique em um documento para selecioná-lo e acessar opções adicionais</li>
                    <li><strong>Excluir</strong> - Remover um documento de sua biblioteca</li>
                    <li><strong>Gerar Resumo</strong> - Criar um resumo abrangente do conteúdo do documento</li>
                    <li><strong>Fazer Perguntas</strong> - Entrar no Modo Documento para fazer perguntas específicas sobre o documento</li>
                </ul>
            `,
                image: "documents_management.png",
                imageAlt: "Interface de Gerenciamento de Documentos",
                imageCaption: "Interface de gerenciamento de documentos mostrando entradas de documentos e botões de ação",
            },
            {
                id: "docs-summaries",
                title: "Resumos de Documentos",
                content: `
                <p>O recurso de resumo cria uma visão geral abrangente do conteúdo do seu documento, ajudando você a entender rapidamente seus pontos-chave.</p>
                
                <h4>Gerando um Resumo</h4>
                <ol>
                    <li>Selecione um documento de sua biblioteca (clique nele)</li>
                    <li>Clique no botão "Gerar Resumo" que aparece</li>
                    <li>Aguarde enquanto a IA lê e analisa seu documento</li>
                    <li>Revise o resumo gerado na janela modal</li>
                </ol>
                
                <h4>Recursos do Resumo</h4>
                <ul>
                    <li><strong>Rastreamento de Progresso</strong> - Observe a barra de progresso enquanto a IA trabalha em seu documento</li>
                    <li><strong>Exibição Incremental</strong> - Veja o resumo se construindo em tempo real para documentos mais longos</li>
                    <li><strong>Botão Copiar</strong> - Copie todo o resumo para sua área de transferência com um clique</li>
                    <li><strong>Opção Cancelar</strong> - Pare a geração do resumo se necessário</li>
                </ul>
                
                <h4>Requisitos de Tamanho de Contexto</h4>
                <p>Quanto maior o resumo do documento, mais contexto você precisa em seu modelo de IA. Como diretriz geral:</p>
                <ul>
                    <li><strong>Documentos pequenos</strong> (menos de 5.000 palavras) - tamanho de contexto 4K geralmente é suficiente</li>
                    <li><strong>Documentos médios</strong> (5.000-15.000 palavras) - tamanho de contexto 8K recomendado</li>
                    <li><strong>Documentos grandes</strong> (15.000-50.000 palavras) - tamanho de contexto 16K ou maior</li>
                    <li><strong>Documentos muito grandes</strong> (50.000+ palavras) - tamanho de contexto 32K ou maior</li>
                </ul>
                <p>Para contexto, uma página típica com espaçamento simples contém aproximadamente 500 palavras, então um PDF de 20 páginas precisaria de pelo menos 8K de contexto para resumo eficaz.</p>
                
                <div class="note">
                    <p><strong>Dica:</strong> Para documentos grandes, o sistema os processa em lotes menores e então cria um resumo geral, garantindo cobertura abrangente mesmo para conteúdo extenso.</p>
                </div>
            `,
                image: "document_summary.png",
                imageAlt: "Modal de Resumo de Documento",
                imageCaption: "Modal de resumo mostrando visão geral gerada do documento com opção de cópia",
            },
            {
                id: "docs-questioning",
                title: "Fazendo Perguntas Sobre Documentos",
                content: `
                <p>O Modo Documento permite ter uma conversa com a IA especificamente sobre um único documento.</p>
                
                <h4>Entrando no Modo Documento</h4>
                <ol>
                    <li>Selecione um documento de sua biblioteca</li>
                    <li>Clique no botão "Fazer Perguntas"</li>
                    <li>O sistema redirecionará você para a aba Chat com o Modo Documento ativado</li>
                    <li>Um indicador especial aparecerá mostrando que você está no Modo Documento</li>
                </ol>
                
                <h4>Usando o Modo Documento</h4>
                <ul>
                    <li>Faça perguntas específicas sobre o conteúdo do documento</li>
                    <li>Solicite explicações de conceitos mencionados no documento</li>
                    <li>Peça comparações entre diferentes seções</li>
                    <li>Solicite informações factuais contidas no documento</li>
                </ul>
                
                <h4>Saindo do Modo Documento</h4>
                <p>Quando terminar de trabalhar com um documento específico:</p>
                <ul>
                    <li>Clique no botão "Sair do Modo Documento" na barra indicadora</li>
                    <li>Você retornará ao modo de chat normal onde pode discutir tópicos gerais</li>
                </ul>
                
                <div class="note">
                    <p><strong>Importante:</strong> No Modo Documento, a IA foca exclusivamente no conteúdo do documento selecionado, usando seu conhecimento para ajudar a interpretar, mas não adicionando informações externas.</p>
                </div>

                <div class="note">
                    <p><strong>Nota sobre modelos em nuvem:</strong> Ao usar modelos em nuvem no plano gratuito, as respostas no modo "Fazer perguntas" podem ser limitadas ou truncadas porque os prompts de RAG são grandes. Se precisar de respostas longas e completas de forma consistente, use um plano pago.</p>
                </div>
            `,
                image: "document_mode.png",
                imageAlt: "Interface do Modo Documento",
                imageCaption: "Interface de chat mostrando indicador do Modo Documento ao fazer perguntas sobre um documento específico",
            },
            {
                id: "docs-searching",
                title: "Pesquisando em Documentos",
                content: `
                <p>O Paiperwork facilita a busca por informações em todos os seus documentos carregados diretamente da interface de chat.</p>
                
                <h4>Busca Global de Documentos</h4>
                <p>Quando você está na aba Documentos, qualquer pergunta que você fizer através da interface de Chat automaticamente pesquisará em todos os seus documentos:</p>
                <ol>
                    <li>Mude primeiro para a aba Documentos para ativar a funcionalidade de busca de documentos</li>
                    <li>Digite sua consulta de busca ou pergunta no campo de entrada do chat</li>
                    <li>A IA automaticamente pesquisará em todos os seus documentos por informações relevantes</li>
                    <li>Resultados de múltiplos documentos serão combinados em uma resposta abrangente</li>
                </ol>
                
                <h4>Resultados da Busca</h4>
                <p>Ao usar a busca de documentos, a IA irá:</p>
                <ul>
                    <li>Mostrar um indicador "Pesquisando documentos..." enquanto coleta informações</li>
                    <li>Encontrar as passagens mais relevantes em todos os seus documentos</li>
                    <li>Priorizar resultados de documentos diversos para fornecer cobertura abrangente</li>
                    <li>Usar busca semântica para entender o significado de sua consulta, não apenas corresponder palavras-chave</li>
                    <li>Gerar uma resposta que sintetiza informações de todos os documentos relevantes</li>
                    <li>Incluir citações aos documentos fonte quando apropriado</li>
                </ul>
                
                <h4>Busca Semântica vs. Busca por Palavras-chave</h4>
                <p>O Paiperwork usa tecnologia de busca semântica que entende o significado por trás de suas perguntas:</p>
                <ul>
                    <li>Você pode perguntar em linguagem natural em vez de usar palavras-chave específicas</li>
                    <li>O sistema encontrará informações conceitualmente relacionadas mesmo quando os termos exatos diferem</li>
                    <li>A busca é consciente do contexto e entende sinônimos e conceitos relacionados</li>
                    <li>Os resultados são classificados por relevância à sua pergunta específica</li>
                </ul>
                
                <div class="note">
                    <p><strong>Dica:</strong> Para melhores resultados, faça perguntas específicas sobre as informações que você está procurando em vez de usar termos de busca genéricos. Por exemplo, pergunte "Quais são os números de vendas trimestrais para 2024?" em vez de apenas "dados de vendas".</p>
                </div>
            `,
            },
            {
                id: "docs-memory-limits",
                title: "Limitações de Memória e Melhores Práticas",
                content: `
                <p>Ao trabalhar com documentos no Paiperwork, é importante entender como o uso de memória afeta o desempenho, especialmente ao usar a busca global de documentos.</p>
                
                <h4>Considerações de Memória com Busca Global</h4>
                <p>A busca global de documentos (pesquisar em todos os documentos simultaneamente) pode ser intensiva em memória porque:</p>
                <ul>
                    <li>Todos os pedaços de documentos relevantes devem ser carregados na memória de uma vez</li>
                    <li>O modelo de IA precisa processar esses pedaços junto com sua consulta</li>
                    <li>Navegadores web têm alocação de memória limitada comparada a aplicações desktop</li>
                    <li>Conforme a contagem e tamanho dos documentos aumentam, os requisitos de memória crescem exponencialmente</li>
                </ul>
                
                <h4>Sinais de Pressão de Memória</h4>
                <p>Fique atento a estes indicadores de que você está se aproximando dos limites de memória:</p>
                <ul>
                    <li>Navegador ficando lento ou não responsivo</li>
                    <li>Longos atrasos ao alternar entre abas</li>
                    <li>Mensagens de erro sobre "falta de memória" ou avisos similares</li>
                    <li>Travamentos ou congelamentos de abas do navegador</li>
                    <li>Respostas da IA terminadas inesperadamente</li>
                </ul>
                
                <h4>Melhores Práticas para Gerenciamento de Documentos</h4>
                <p>Para evitar problemas de memória ao trabalhar com documentos:</p>
                <ul>
                    <li><strong>Use o Modo Específico de Documento</strong> - Ao trabalhar com documentos grandes, selecione um documento específico e use "Fazer Perguntas" para entrar no modo documento em vez da busca global</li>
                    <li><strong>Limite o Uso da Busca Global</strong> - Reserve a busca global para cenários com coleções menores de documentos ou quando você especificamente precisa encontrar informações em múltiplos documentos</li>
                    <li><strong>Organize Documentos Estrategicamente</strong> - Agrupe documentos relacionados para poder trabalhar com subconjuntos direcionados em vez de toda sua biblioteca</li>
                    <li><strong>Feche Outras Aplicações</strong> - Ao trabalhar com documentos grandes, feche outras aplicações intensivas em memória e abas do navegador</li>
                    <li><strong>Reinicie Ocasionalmente</strong> - Para sessões estendidas de trabalho com documentos, reinicie seu navegador periodicamente para limpar a memória</li>
                </ul>
                
                <h4>Recomendações de Tamanho de Documento</h4>
                <p>Como diretriz geral para busca global:</p>
                <ul>
                    <li><strong>Uso seguro</strong>: 5-10 documentos pequenos a médios (menos de 20 páginas cada)</li>
                    <li><strong>Cuidado necessário</strong>: 10-20 documentos ou vários documentos maiores (20-50 páginas)</li>
                    <li><strong>Não recomendado</strong>: 20+ documentos ou múltiplos documentos grandes (50+ páginas)</li>
                </ul>
                
                <div class="note">
                    <p><strong>Importante:</strong> A busca global de documentos é projetada para acesso conveniente em uma coleção moderada de documentos. Para pesquisa intensiva envolvendo documentos grandes ou coleções extensas, use o modo de questionamento específico de documento em vez disso. Isso foca recursos de memória em um único documento por vez, fornecendo melhor desempenho e estabilidade.</p>
                </div>
            `,
            }
        ],
    },
    dataviz: {
        title: "DataViz",
        intro:
            "A aba DataViz permite criar visualizações de dados interativas descrevendo seus dados para a IA.",
        articles: [
            {
                id: "dataviz-intro",
                title: "Introdução à Visualização de Dados",
                content: `
                <p>A aba DataViz permite gerar vários gráficos e diagramas a partir de descrições em linguagem natural dos seus dados. Simplesmente selecione um tipo de visualização e descreva seus dados para a IA.</p>
                
                <p>Com o DataViz, você pode:</p>
                <ul>
                    <li>Criar visualizações a partir de descrições de texto</li>
                    <li>Gerar gráficos sem formatação manual de dados</li>
                    <li>Escolher entre múltiplos tipos de visualização</li>
                    <li>Ver resultados imediatamente em uma janela interativa</li>
                    <li>Copiar visualizações geradas para uso em outras aplicações</li>
                </ul>
                
                <p>O DataViz é perfeito para visualizar rapidamente conceitos, comparar pontos de dados ou explorar tendências sem a necessidade de planilhas ou ferramentas especializadas.</p>
            `,
                image: "dataviz_intro.png",
                imageAlt: "Visão Geral da Aba DataViz",
                imageCaption:
                    "Interface da aba DataViz mostrando as opções de tipos de visualização",
            },
            {
                id: "dataviz-types",
                title: "Tipos de Visualização Disponíveis",
                content: `
                <p>O DataViz oferece várias opções de visualização para atender diferentes tipos de dados e necessidades analíticas:</p>
                
                <h4>Gráficos de Pizza</h4>
                <p>Ideais para mostrar proporções de um todo ou comparar partes de um total. Perfeitos para:</p>
                <ul>
                    <li>Distribuição de participação de mercado</li>
                    <li>Alocação de orçamento</li>
                    <li>Análise de respostas de pesquisas</li>
                    <li>Qualquer dado onde os componentes somem 100%</li>
                </ul>
                
                <h4>Gráficos de Barras</h4>
                <p>Perfeitos para comparar quantidades entre diferentes categorias. Bons para:</p>
                <ul>
                    <li>Comparações de vendas por região</li>
                    <li>Estatísticas populacionais</li>
                    <li>Resultados de pesquisas com questões de múltipla escolha</li>
                    <li>Métricas de desempenho ao longo de períodos de tempo</li>
                </ul>
                
                <h4>Gráficos de Linha</h4>
                <p>Ideais para mostrar tendências ao longo do tempo ou dados contínuos. Use para:</p>
                <ul>
                    <li>Preços de ações ao longo do tempo</li>
                    <li>Mudanças de temperatura</li>
                    <li>Crescimento de receita</li>
                    <li>Qualquer dado com progressão clara</li>
                </ul>
                
                <h4>Gráficos de Dispersão</h4>
                <p>Ideais para mostrar relacionamentos entre duas variáveis. Perfeitos para:</p>
                <ul>
                    <li>Análise de correlação</li>
                    <li>Padrões de distribuição</li>
                    <li>Identificação de valores extremos</li>
                    <li>Agrupamento de pontos de dados similares</li>
                </ul>
                
                <h4>Gráficos de Área</h4>
                <p>Similares aos gráficos de linha, mas com áreas preenchidas abaixo das linhas. Bons para:</p>
                <ul>
                    <li>Mostrar mudanças de volume ao longo do tempo</li>
                    <li>Comparar totais cumulativos</li>
                    <li>Visualizar relacionamentos parte-todo ao longo do tempo</li>
                    <li>Enfatizar a magnitude das mudanças</li>
                </ul>
                
                <h4>Gráficos de Radar</h4>
                <p>Exibem dados multivariados como um gráfico bidimensional com três ou mais variáveis quantitativas. Ideais para:</p>
                <ul>
                    <li>Comparações de desempenho em múltiplas dimensões</li>
                    <li>Avaliações de habilidades</li>
                    <li>Comparações de características de produtos</li>
                    <li>Qualquer dado com múltiplos atributos para comparar</li>
                </ul>
                
                <h4>Mapas de Calor</h4>
                <p>Usam intensidade de cor para representar valores em formato de matriz. Perfeitos para:</p>
                <ul>
                    <li>Matrizes de correlação</li>
                    <li>Intensidade de dados geográficos</li>
                    <li>Padrões de cliques em websites</li>
                    <li>Mostrar padrões em conjuntos de dados complexos</li>
                </ul>
                
                <h4>Gráficos de Bolhas</h4>
                <p>Como gráficos de dispersão, mas com uma dimensão adicional representada pelo tamanho da bolha. Bons para:</p>
                <ul>
                    <li>Comparar três dimensões de dados</li>
                    <li>Análise de portfólio</li>
                    <li>Visualização de alocação de recursos</li>
                    <li>Comparações demográficas</li>
                </ul>
            `,
                image: "chart_types.png",
                imageAlt: "Tipos de Gráficos",
                imageCaption: "Os vários tipos de visualização disponíveis no DataViz",
            },
            {
                id: "dataviz-usage",
                title: "Criando Visualizações",
                content: `
                <p>Criar visualizações de dados com o DataViz é simples:</p>
                
                <h4>Passo 1: Selecione um Tipo de Visualização</h4>
                <ol>
                    <li>Navegue até a aba DataViz</li>
                    <li>Explore os tipos de gráficos disponíveis</li>
                    <li>Clique na sua visualização preferida (pizza, barras, linha, etc.)</li>
                </ol>
                
                <h4>Passo 2: Descreva Seus Dados</h4>
                <ol>
                    <li>Após selecionar um tipo de gráfico, você retornará à interface de chat</li>
                    <li>Note que o campo de entrada agora mostra um prompt especializado para o gráfico selecionado</li>
                    <li>Descreva os dados que deseja visualizar em linguagem natural</li>
                    <li>Seja o mais específico possível sobre categorias, valores e relacionamentos</li>
                </ol>
                
                <h4>Passo 3: Gere e Visualize a Representação</h4>
                <ol>
                    <li>A IA processará sua descrição e gerará um gráfico adequado</li>
                    <li>Uma janela flutuante exibirá a visualização</li>
                    <li>Se o gráfico não atender suas expectativas, você pode modificá-lo fornecendo instruções mais claras</li>
                </ol>
                
                <div class="note">
                    <p><strong>Dica:</strong> Para melhores resultados, inclua valores numéricos específicos em sua descrição. Por exemplo, em vez de dizer "as vendas foram maiores no Q2", diga "as vendas foram R$ 12.000 no Q1 e R$ 15.500 no Q2".</p>
                </div>
            `,
                image: "dataviz_create.png",
                imageAlt: "Criando uma Visualização",
                imageCaption:
                    "O processo de criar uma visualização de dados a partir de uma descrição de texto",
            },
            {
                id: "dataviz-examples",
                title: "Exemplos de Prompts",
                content: `
                <p>Aqui estão alguns exemplos de prompts para ajudá-lo a começar com diferentes tipos de visualização:</p>
                
                <h4>Exemplo de Gráfico de Pizza</h4>
                <p class="example-prompt">"Crie um gráfico de pizza mostrando a participação de mercado dos navegadores com Chrome em 65%, Safari em 18%, Firefox em 8%, Edge em 5% e Outros em 4%."</p>
                
                <h4>Exemplo de Gráfico de Barras</h4>
                <p class="example-prompt">"Gere um gráfico de barras comparando vendas mensais do Q1 2024: Janeiro R$ 45.000, Fevereiro R$ 52.000 e Março R$ 61.000."</p>
                
                <h4>Exemplo de Gráfico de Linha</h4>
                <p class="example-prompt">"Mostre um gráfico de linha das temperaturas médias em São Paulo ao longo de 2023: Jan 25°C, Fev 26°C, Mar 24°C, Abr 22°C, Mai 19°C, Jun 17°C, Jul 16°C, Ago 18°C, Set 20°C, Out 22°C, Nov 23°C, Dez 25°C."</p>
                
                <h4>Exemplo de Múltiplas Séries</h4>
                <p class="example-prompt">"Crie um gráfico de barras comparando horas de uso de smartphone por faixa etária: Adolescentes (14 h/semana), Jovens Adultos (12 h/semana), Meia-idade (8 h/semana) e Idosos (4 h/semana). Inclua também horas de uso de redes sociais: Adolescentes (10 h/semana), Jovens Adultos (8 h/semana), Meia-idade (5 h/semana) e Idosos (2 h/semana)."</p>
                
                <h4>Exemplo de Gráfico de Dispersão</h4>
                <p class="example-prompt">"Gere um gráfico de dispersão mostrando a relação entre horas de estudo (eixo x) e notas de prova (eixo y) para 10 estudantes: (2 h, 65%), (3 h, 70%), (5 h, 85%), (8 h, 95%), (4 h, 75%), (6 h, 90%), (2 h, 60%), (7 h, 92%), (3,5 h, 72%), (5,5 h, 88%)."</p>
                
                <h4>Exemplo de Gráfico de Radar</h4>
                <p class="example-prompt">"Crie um gráfico de radar comparando três smartphones em cinco categorias: Telefone A (Bateria: 90, Câmera: 85, Desempenho: 95, Design: 80, Preço: 70), Telefone B (Bateria: 75, Câmera: 95, Desempenho: 90, Design: 85, Preço: 65), Telefone C (Bateria: 95, Câmera: 75, Desempenho: 80, Design: 90, Preço: 85)."</p>
                
                <h4>Exemplo de Mapa de Calor</h4>
                <p class="example-prompt">"Crie um mapa de calor mostrando a correlação entre diferentes linguagens de programação e sua popularidade em vários setores industriais em 2025. Inclua dados para linguagens como Python (IA/ML: 98, Finanças: 85, Saúde: 70, Jogos: 60, E-commerce: 92), JavaScript (Finanças: 95, Saúde: 55, Jogos: 75, E-commerce: 98, Mídia: 90), Rust (Finanças: 45, Saúde: 35, Jogos: 90, IoT: 80, Cibersegurança: 85), Go (Finanças: 55, Saúde: 45, Jogos: 35, IoT: 95, Nuvem: 85) e PHP (E-commerce: 60, Mídia: 50, Educação: 40, Governo: 30, Saúde: 35). Use uma escala de cores de azul claro a azul escuro, onde cores mais escuras representam maiores taxas de adoção."</p>

                <h4>Exemplo de Gráfico de Bolhas</h4>
                <p class="example-prompt">"Gere um gráfico de bolhas comparando a adoção de energia renovável de diferentes países. No eixo x, mostre PIB per capita (EUA: 65000, Alemanha: 48000, China: 12000, Índia: 2500, Brasil: 7000, Japão: 40000). No eixo y, mostre porcentagem de energia renovável na matriz energética total (EUA: 20%, Alemanha: 45%, China: 25%, Índia: 35%, Brasil: 85%, Japão: 30%). Use o tamanho da bolha para representar população em milhões (EUA: 330, Alemanha: 83, China: 1400, Índia: 1380, Brasil: 212, Japão: 126). Rotule cada bolha com o nome do país e intitule o gráfico 'Adoção de Energia Renovável vs. Desenvolvimento Econômico (2025)'."</p>
                
                <div class="note">
                    <p><strong>Nota:</strong> Se sua primeira tentativa não produzir exatamente a visualização que você deseja, tente refinar sua descrição com detalhes mais específicos sobre categorias, valores e relacionamentos.</p>
                </div>
            `,
                image: "dataviz_examples.png",
                imageAlt: "Exemplos de Visualizações",
                imageCaption:
                    "Exemplos de visualizações criadas a partir de descrições de texto",
            },
            {
                id: "dataviz-advanced",
                title: "Dicas Avançadas",
                content: `
                <p>Obtenha o máximo do DataViz com estas técnicas avançadas:</p>
                
                <h4>Personalizando Visualizações</h4>
                <p>Você pode solicitar personalizações específicas em seu prompt:</p>
                <ul>
                    <li>"Use cores azul e verde para o gráfico"</li>
                    <li>"Faça um gráfico de barras empilhadas"</li>
                    <li>"Mostre porcentagens nas fatias da pizza"</li>
                    <li>"Use uma escala logarítmica para o eixo y"</li>
                </ul>
                
                <h4>Trabalhando com Dados Complexos</h4>
                <p>Para conjuntos de dados maiores:</p>
                <ul>
                    <li>Divida dados complexos em grupos lógicos</li>
                    <li>Considere usar múltiplos gráficos para contar uma história completa</li>
                    <li>Use tendências e padrões em vez de todos os pontos de dados</li>
                    <li>Seja explícito sobre quais dimensões mostrar e quais omitir</li>
                </ul>
                
                <h4>Lidando com Falhas de Geração</h4>
                <p>Se seu gráfico falhar ao gerar adequadamente:</p>
                <ul>
                    <li>Certifique-se de ter especificado valores numéricos precisos</li>
                    <li>Verifique se seus dados são apropriados para o tipo de gráfico selecionado</li>
                    <li>Simplifique descrições complexas em informações mais claras e estruturadas</li>
                    <li>Reduza o número de categorias ou pontos de dados</li>
                </ul>
                
                <h4>Cancelando a Geração de Gráfico</h4>
                <p>Se precisar parar a geração de um gráfico:</p>
                <ul>
                    <li>Clique no botão "Cancelar" na janela de carregamento</li>
                    <li>O processo será interrompido imediatamente</li>
                    <li>Você pode então tentar novamente com um prompt modificado</li>
                </ul>
                
                <div class="note">
                    <p><strong>Importante:</strong> Quando você mudar para uma aba diferente, o modo DataViz será automaticamente desativado e você retornará ao modo de conversa normal.</p>
                </div>
            `,
                image: "dataviz_advanced.png",
                imageAlt: "Técnicas Avançadas do DataViz",
                imageCaption:
                    "Técnicas avançadas para criar visualizações personalizadas",
            },
        ],
    },
    paperworks: {
        title: "Papelada",
        intro:
            "A aba Papelada ajuda você a criar e gerenciar modelos de documentos profissionais e formulários com assistência de IA, mantendo todos os seus dados privados e locais.",
        articles: [
            {
                id: "paperworks-intro",
                title: "Introdução aos Documentos",
                content: `
                <p>A aba Documentos fornece um sistema poderoso de criação de documentos que ajuda você a gerar documentos profissionais, modelos e formulários usando assistência de IA.</p>
                
                <p>As principais funcionalidades da aba Documentos incluem:</p>
                <ul>
                    <li>Modelos de documentos pré-projetados para necessidades comerciais comuns</li>
                    <li>Criação de modelos personalizados com orientação de IA</li>
                    <li>Geração de formulários para coleta de dados</li>
                    <li>Pré-visualização e edição de documentos</li>
                    <li>Opções de exportação para vários formatos</li>
                </ul>
                
                <p>Todo o processamento de documentos acontece localmente e no seu dispositivo, garantindo que suas informações comerciais sensíveis permaneçam privadas e seguras. Como todas as funcionalidades no Paiperwork, Documentos usa sua chave de criptografia Mestre para proteger quaisquer modelos ou formulários salvos.</p>
            `,
                image: "paperworks_intro.png",
                imageAlt: "Visão Geral da Aba Documentos",
                imageCaption:
                    "O painel de Documentos mostrando opções de criação de documentos",
            },
            {
                id: "paperworks-templates",
                title: "Modelos de Documentos",
                content: `
                <p>A aba Documentos exibe uma grade de modelos de documentos que você pode selecionar para criar vários documentos profissionais.</p>
                
                <h4>Tipos de Modelos Disponíveis</h4>
                <ul>
                    <li><strong>Ata de Reunião</strong> - Criar atas de reunião estruturadas e profissionais</li>
                    <li><strong>Carta Comercial</strong> - Gerar uma carta comercial profissional</li>
                    <li><strong>Relatório Técnico</strong> - Criar um relatório técnico detalhado com seções e imagens</li>
                    <li><strong>Contrato</strong> - Criar um documento de contrato legal</li>
                    <li><strong>Proposta</strong> - Gerar uma proposta comercial convincente</li>
                    <li><strong>Memorando</strong> - Criar um memorando corporativo profissional</li>
                </ul>
                
                <h4>Usando Modelos</h4>
                <p>Para criar um documento a partir de um modelo:</p>
                <ol>
                    <li>Clique em um cartão de modelo da grade</li>
                    <li>Preencha as informações necessárias nos campos do formulário</li>
                    <li>Clique em "Gerar Documento" para criar seu documento</li>
                    <li>Visualize, edite ou exporte seu documento concluído</li>
                </ol>
                
                <div class="note">
                    <p><strong>Nota:</strong> Os modelos são pontos de partida personalizáveis. Você pode modificar qualquer documento gerado para melhor atender às suas necessidades específicas.</p>
                </div>
            `,
                image: "document_templates.png",
                imageAlt: "Grade de Modelos de Documentos",
                imageCaption: "A grade de seleção de modelos de documentos",
            },
            {
                id: "paperworks-technical-reports",
                title: "Criando Relatórios Técnicos",
                content: `
                <p>O criador de Relatórios Técnicos oferece recursos poderosos de design de documentos com um editor visual intuitivo e assistência de IA.</p>
                
                <h4>Designer de Modelos Visuais</h4>
                <p>Quando você seleciona o modelo de Relatório Técnico, você acessará o designer de modelos visuais que permite:</p>
                <ul>
                    <li>Projetar documentos profissionais de múltiplas páginas com um editor visual</li>
                    <li>Construir seu relatório adicionando diferentes tipos de seções da barra lateral</li>
                    <li>Personalizar layout e estrutura com simplicidade</li>
                    <li>Adicionar imagens e elementos visuais com upload fácil</li>
                    <li>Visualizar o documento exatamente como aparecerá quando impresso</li>
                    <li>Maximizar a janela do designer para uma experiência de edição em tela cheia</li>
                </ul>
                
                <h4>Tipos de Seções Disponíveis</h4>
                <ul>
                    <li><strong>Cabeçalho do Documento</strong> - Título e subtítulo para seu relatório</li>
                    <li><strong>Cabeçalho da Seção</strong> - Divide seu relatório em seções lógicas</li>
                    <li><strong>Área de Texto</strong> - Para parágrafos e conteúdo de texto mais longo</li>
                    <li><strong>Texto + Imagem (Direita)</strong> - Texto com uma imagem no lado direito</li>
                    <li><strong>Imagem + Texto (Direita)</strong> - Imagem com texto no lado direito</li>
                    <li><strong>Galeria de Imagens</strong> - Layout em grade para múltiplas imagens</li>
                    <li><strong>Linha de Imagens</strong> - Arranjo horizontal de imagens com legenda opcional</li>
                    <li><strong>Divisor</strong> - Separador visual entre seções</li>
                    <li><strong>Espaço Vazio</strong> - Espaço em branco ajustável com capacidade de redimensionamento</li>
                </ul>
                
                <h4>Recursos Inteligentes de Layout</h4>
                <ul>
                    <li><strong>Suporte multi-página</strong> - O conteúdo flui automaticamente através de múltiplas páginas</li>
                    <li><strong>Quebras de página</strong> - Indicadores visuais mostram onde o conteúdo será dividido entre páginas</li>
                    <li><strong>Paginação automática</strong> - Números de página são adicionados automaticamente</li>
                    <li><strong>Formato A4</strong> - Tamanho padrão de documento com margens adequadas</li>
                    <li><strong>Controles de seção</strong> - Mover, editar ou excluir seções com botões de fácil acesso</li>
                    <li><strong>Espaçamento flexível</strong> - Opção para expandir seções vazias para preencher uma página</li>
                </ul>
                
                <h4>Aprimoramento de Conteúdo</h4>
                <ul>
                    <li><strong>Aprimoramento com IA</strong> - Melhoria com um clique do conteúdo de texto usando assistência de IA</li>
                    <li><strong>Edição direta</strong> - Editar texto diretamente na visualização para experiência WYSIWYG</li>
                    <li><strong>Upload de imagens</strong> - Arrastar e soltar ou clicar para fazer upload de imagens</li>
                    <li><strong>Marcadores de conteúdo</strong> - Marcadores úteis mostram onde adicionar conteúdo</li>
                    <li><strong>Capacidade de desfazer</strong> - Reverter aprimoramentos de IA se necessário</li>
                    <li><strong>Traduções diretas</strong> - Adicione "Traduzir para (idioma):" no início do texto e clique em Aprimorar com IA</li>
                </ul>
                <h4>Seleção de Fonte e Visualização de PDF</h4>
                <ul>
                    <li><strong>Seleção de Fonte</strong> - Escolha entre uma variedade de fontes usando o menu suspenso acima do editor</li>
                    <li><strong>Visualização de Fonte</strong> - Veja como seu documento fica com diferentes fontes em tempo real</li>
                    <li><strong>Persistência de Fonte</strong> - Sua fonte selecionada é lembrada entre sessões para consistência</li>
                    <li><strong>Visualização de PDF</strong> - Veja uma visualização precisa de como seu documento aparecerá como PDF</li>
                    <li><strong>Layout da Página</strong> - Veja exatamente como o conteúdo é distribuído nas páginas com dimensionamento A4 adequado</li>
                    <li><strong>Quebras de Página</strong> - A visualização mostra indicadores claros de quebra de página entre as páginas do documento</li>
                </ul>               

                <h4>Usando a Visualização de PDF</h4>
                <ol>
                    <li>Clique no botão "Visualizar" ao lado do seletor de fonte</li>
                    <li>Uma janela modal se abrirá mostrando seu documento como apareceria em formato PDF</li>
                    <li>Cada página é mostrada no tamanho A4 adequado com posicionamento exato do layout</li>
                    <li>Revise a paginação e certifique-se de que o conteúdo está distribuído adequadamente</li>
                    <li>Feche a visualização quando terminar para retornar à edição</li>
                </ol>
                <h4>Criando um Relatório Técnico</h4>
                <ol>
                    <li>Digite um nome para seu relatório no topo do designer</li>
                    <li>Clique nas predefinições de design do painel direito para adicioná-las ao seu documento</li>
                    <li>Preencha o conteúdo para cada seção clicando e digitando diretamente na seção</li>
                    <li>Faça upload de imagens clicando nos marcadores de imagem</li>
                    <li>Aprimore o texto com os botões de IA abaixo das áreas de texto editáveis</li>
                    <li>Reorganize seções usando os controles de seta para cima/baixo</li>
                    <li>Uma vez completo, salve seu relatório e exporte ou imprima-o</li>
                </ol>
                
                <div class="note">
                    <p><strong>Dica:</strong> Maximize a janela do editor usando o botão maximizar no canto superior direito para uma experiência de edição mais confortável com documentos maiores. A interface se ajusta automaticamente para fornecer layout otimizado tanto na visualização regular quanto maximizada.</p>
                </div>
                `,
                images: [
                    {
                        src: "technical_report_designer.png",
                        alt: "Relatório técnico",
                        caption:
                            "O designer visual de relatório técnico mostrando o layout do documento e tipos de seção",
                    },
                    {
                        src: "preview-window-technical-report.png",
                        alt: "A janela de visualização para relatórios técnicos",
                        caption: "A janela de visualização para relatórios técnicos"
                    }
                ]
            },
            {
                id: "paperworks-document-generation",
                title: "Geração de Documentos",
                content: `
                <p>Documentos usa assistência de IA para ajudar você a gerar conteúdo de documento profissional baseado em suas entradas.</p>
                
                <h4>Processo de Geração de Documentos</h4>
                <ol>
                    <li>Selecione um modelo de documento</li>
                    <li>Preencha os campos de formulário necessários com suas informações</li>
                    <li>Clique em "Gerar Documento" para criar seu documento</li>
                    <li>Revise o conteúdo gerado</li>
                    <li>Edite ou refine o conteúdo conforme necessário</li>
                    <li>Exporte ou salve seu documento finalizado</li>
                </ol>
                
                <h4>Aprimoramento com IA</h4>
                <p>A assistência de IA pode ajudar você a:</p>
                <ul>
                    <li>Formatar seu conteúdo profissionalmente</li>
                    <li>Sugerir fraseado e terminologia apropriados</li>
                    <li>Garantir consistência em todo o seu documento</li>
                    <li>Gerar seções completas baseadas em suas entradas</li>
                </ul>
                
                <div class="note">
                    <p><strong>Nota:</strong> Para usar os recursos de aprimoramento com IA, certifique-se de ter selecionado um modelo de IA na aba Chat primeiro.</p>
                </div>
            `,
                image: "document_generation.png",
                imageAlt: "Processo de Geração de Documentos",
                imageCaption: "A interface do formulário de geração de documentos",
            },
            {
                id: "paperworks-export",
                title: "Exportando Documentos",
                content: `
                <p>Uma vez que você tenha criado e refinado seu documento, você pode exportá-lo em vários formatos.</p>
                
                <h4>Opções de Exportação Disponíveis</h4>
                <ul>
                    <li><strong>Exportação de Texto</strong> - Copiar o texto com sua formatação pronto para ser colado em qualquer processador de texto</li>
                    <li><strong>Enviar por Email</strong> - Abrir seu programa de email padrão, preenche o assunto e corpo do email</li>
                </ul>
                
                <h4>Exportando Seu Documento</h4>
                <ol>
                    <li>Após gerar seu documento, revise a visualização</li>
                    <li>Faça quaisquer ajustes finais conforme necessário</li>
                    <li>Clique no botão de exportação apropriado (Copiar, Email)</li>
                    <li>Siga as instruções para salvar ou enviar seu documento</li>
                </ol>
                
                <p>Todos os documentos exportados mantêm a formatação e estilização da sua visualização, garantindo apresentação profissional independentemente do formato.</p>
            `,
                image: "document_export.png",
                imageAlt: "Opções de Exportação de Documentos",
                imageCaption: "A interface de exportação de documentos mostrando opções de formato",
            },
        ],
    },
    research: {
        title: "Pesquisa",
        intro: "A aba Pesquisa fornece poderosos recursos de pesquisa assistida por IA e uma base de conhecimento pessoal para armazenar e recuperar informações.",
        articles: [
            {
                id: "research-intro",
                title: "Introdução às Ferramentas de Pesquisa",
                content: `
                <p>A aba Pesquisa oferece duas ferramentas poderosas para ajudá-lo a coletar, analisar e armazenar informações:</p>
                
                <ul>
                    <li><strong>Assistente de Pesquisa</strong> - Pesquisa web alimentada por IA que ajuda você a encontrar, analisar e sintetizar informações sobre qualquer tópico</li>
                    <li><strong>Base de Conhecimento</strong> - Um banco de dados pessoal onde você pode armazenar, organizar e recuperar informações importantes para referência futura</li>
                </ul>
                
                <h4>Privacidade e Segurança de Dados</h4>
                <p>A aba Pesquisa mantém o compromisso do Paiperwork com privacidade e segurança de dados:</p>
                <ul>
                    <li><strong>Conexão com Internet Necessária</strong> - O Assistente de Pesquisa requer uma conexão com internet para realizar buscas na web</li>
                    <li><strong>Transmissão de Dados Limitada</strong> - Apenas consultas de pesquisa são enviadas para a internet (via Bing Search). Nenhum dado pessoal ou empresarial é transmitido</li>
                    <li><strong>Processamento Local</strong> - Todos os resultados de busca são processados localmente em seu dispositivo pelo modelo de IA escolhido</li>
                    <li><strong>Armazenamento Criptografado</strong> - Resultados de pesquisa e entradas da base de conhecimento são criptografados usando sua Chave Mestre em seu banco de dados local</li>
                    <li><strong>Base de Conhecimento Completamente Offline</strong> - A Base de Conhecimento opera inteiramente local, não requerendo conexão com internet após as entradas serem criadas</li>
                </ul>
                
                <h4>Alternando Entre Ferramentas</h4>
                <p>Use a navegação de sub-abas no topo da aba Pesquisa para alternar entre o Assistente de Pesquisa e a Base de Conhecimento:</p>
                <ul>
                    <li>Clique em <strong>Pesquisa</strong> para usar a ferramenta de busca e análise web alimentada por IA</li>
                    <li>Clique em <strong>Base de Conhecimento</strong> para acessar suas coleções de informações armazenadas</li>
                </ul>
                
                <div class="note">
                    <p><strong>Importante:</strong> A aba Pesquisa usa o modelo atualmente selecionado na aba Chat. Certifique-se de selecionar um modelo apropriado na aba Chat antes de usar os recursos de Pesquisa. Para tarefas de pesquisa, modelos sem raciocínio (como Mistral3, Qwen2.5 ou LLaMA) funcionam melhor.</p>
                    <p><strong>Nota de Performance:</strong> Usar modelos de IA com raciocínio (como Cogito, Qwen3 ou Deepseek R1) aumentará significativamente o tempo de pesquisa, pois esses modelos executam pensamento detalhado a cada passo do processo. Para resultados de pesquisa mais rápidos, prefira modelos de instrução padrão que processam informações mais diretamente.</p>
                </div>
                `,
                image: "research_tab_overview.png",
                imageAlt: "Visão Geral da Aba Pesquisa",
                imageCaption: "A aba Pesquisa mostrando a navegação de sub-abas entre Assistente de Pesquisa e Base de Conhecimento"
            },
            {
                id: "research-assistant",
                title: "Usando o Assistente de Pesquisa",
                content: `
                <p>O Assistente de Pesquisa combina busca web, análise de IA e geração de relatórios para ajudá-lo a pesquisar qualquer tópico completamente.</p>
                
                <h4>Iniciando Sua Pesquisa</h4>
                <ol>
                    <li>Certifique-se de ter selecionado um modelo apropriado na aba Chat (a aba Pesquisa usa seu modelo da aba Chat)</li>
                    <li>Digite sua pergunta de pesquisa no campo de entrada</li>
                    <li>Escolha um tamanho de relatório (detalhado abaixo)</li>
                    <li>Configure opções de Busca Profunda se necessário (detalhado abaixo)</li>
                    <li>Clique no botão "Pesquisar" para iniciar o processo de pesquisa</li>
                </ol>
                
                <h4>Opções de Tamanho de Relatório</h4>
                <p>Selecione o tamanho de relatório apropriado baseado nas suas necessidades e recursos de sistema disponíveis:</p>
                <ul>
                    <li><strong>Conciso</strong> - Resumo breve de 500-800 palavras com fatos centrais
                        <br><em>Contexto recomendado: 8K-16K (2-4GB VRAM/RAM)</em></li>
                    <li><strong>Padrão</strong> - Relatório equilibrado de 1000-1500 palavras com detalhes principais
                        <br><em>Contexto recomendado: 16K-32K (4-8GB VRAM/RAM)</em></li>
                    <li><strong>Detalhado</strong> - Análise abrangente de 2000-3000 palavras
                        <br><em>Contexto recomendado: 32K-64K (8-16GB VRAM/RAM)</em></li>
                    <li><strong>Abrangente</strong> - Exame aprofundado de 4000-5000 palavras
                        <br><em>Contexto recomendado: 64K-128K (16-32GB VRAM/RAM)</em></li>
                    <li><strong>Extenso</strong> - Exploração completa de 6000+ palavras com máximo detalhe
                        <br><em>Contexto recomendado: 128K+ (32GB+ VRAM/RAM para sistemas high-end)</em></li>
                </ul>
                
                <div class="note">
                    <p><strong>Requisitos de Contexto Explicados:</strong> O Assistente de Pesquisa processa informações em múltiplas etapas - primeiro resumindo fontes individuais, depois gerando relatórios parciais em lotes, e finalmente combinando tudo no relatório final. Relatórios maiores requerem mais contexto para manter coerência entre todas as fontes e garantir análise abrangente. Se você experimentar problemas de memória ou relatórios incompletos, tente reduzir o tamanho do relatório ou aumentar o tamanho do contexto na aba Chat.</p>
                </div>
                
                <h4>Otimizando Performance de Pesquisa</h4>
                <p>Para melhores resultados de pesquisa:</p>
                <ul>
                    <li><strong>Combine o tamanho do relatório ao seu sistema</strong> - Use a calculadora de contexto na aba Chat para determinar configurações ótimas</li>
                    <li><strong>Monitore o uso de memória</strong> - Observe sinais de pressão de memória como relatórios incompletos ou lentidão do sistema</li>
                    <li><strong>Considere o impacto da Busca Profunda</strong> - Busca Profunda com múltiplos níveis aumenta significativamente a quantidade de conteúdo a processar</li>
                    <li><strong>Use modelos apropriados</strong> - Modelos não-raciocinantes (Mistral, Qwen2.5, LLaMA) processam pesquisa mais rapidamente que modelos de raciocínio</li>
                </ul>
                
                <h4>Configuração de Busca Profunda</h4>
                <p>O recurso de Busca Profunda fornece capacidades de pesquisa aprimoradas com controle granular:</p>
                <ul>
                    <li><strong>Alternar Ativar/Desativar</strong> - Ative ou desative a Busca Profunda para sua sessão de pesquisa</li>
                    <li><strong>Profundidade de Busca</strong> - Escolha entre 1-3 níveis de seguimento de links:
                        <ul>
                            <li>Nível 1: Seguir links imediatos dos resultados de busca</li>
                            <li>Nível 2: Seguir links do primeiro nível de páginas descobertas</li>
                            <li>Nível 3: Exploração de profundidade máxima para cobertura abrangente</li>
                        </ul>
                    </li>
                    <li><strong>Links por Página</strong> - Selecione 1-5 links para seguir de cada página descoberta</li>
                    <li><strong>Processamento PDF Aprimorado</strong> - Quando ativado, a Busca Profunda detecta automaticamente e processa documentos PDF com capacidades de extração aprimoradas</li>
                </ul>
                <p>Passe o mouse sobre as opções de Busca Profunda para ver dicas detalhadas explicando o impacto de cada configuração na minuciosidade da pesquisa e tempo de processamento.</p>
                
                <h4>Processo de Pesquisa com Janela Flutuante</h4>
                <p>Quando você inicia uma pesquisa, o sistema exibe uma janela de progresso flutuante que mostra:</p>
                <ol>
                    <li><strong>Geração de Consulta</strong> - Cria consultas de busca otimizadas baseadas em sua pergunta de pesquisa</li>
                    <li><strong>Busca Web</strong> - Busca na web usando múltiplas consultas direcionadas</li>
                    <li><strong>Análise de Conteúdo</strong> - Analisa e extrai informações importantes dos resultados de busca</li>
                    <li><strong>Detecção e Processamento de PDF</strong> - Identifica automaticamente documentos PDF e os processa com extração aprimorada</li>
                    <li><strong>Execução de Busca Profunda</strong> - Se ativado, segue links na profundidade e quantidade especificadas</li>
                    <li><strong>Geração de Relatório</strong> - Sintetiza todas as informações coletadas no tamanho de relatório selecionado</li>
                </ol>
                
                <p>A janela de progresso flutuante fornece atualizações em tempo real e permite que você:</p>
                <ul>
                    <li>Monitore a fase atual de pesquisa e progresso</li>
                    <li>Cancele o processo de pesquisa a qualquer momento</li>
                    <li>Veja o tempo estimado de conclusão</li>
                    <li>Acompanhe o número de fontes sendo processadas</li>
                </ul>
                
                <h4>Manuseio PDF Aprimorado</h4>
                <p>O Assistente de Pesquisa inclui capacidades avançadas de processamento de PDF:</p>
                <ul>
                    <li><strong>Detecção Automática</strong> - Identifica documentos PDF nos resultados de busca usando múltiplos padrões (extensões de arquivo, padrões de URL, fontes acadêmicas)</li>
                    <li><strong>Extração Aprimorada</strong> - Usa métodos de extração especializados para artigos acadêmicos e documentos técnicos</li>
                    <li><strong>Integração de Conteúdo</strong> - Incorpora perfeitamente conteúdo PDF na síntese de pesquisa</li>
                    <li><strong>Atribuição de Fonte</strong> - Mantém citações claras para fontes PDF originais</li>
                </ul>
                
                <div class="note">
                    <p><strong>Nota de Performance:</strong> Busca Profunda com níveis de profundidade mais altos e mais links por página fornece resultados mais abrangentes, mas aumenta o tempo de pesquisa. Processamento PDF adiciona tempo extra, mas melhora significativamente a qualidade da pesquisa para tópicos acadêmicos e técnicos.</p>
                </div>
                `,
            },

            {
                id: "research-results",
                title: "Trabalhando com Resultados de Pesquisa",
                content: `
                <p>Após sua pesquisa estar completa, o sistema gera um relatório de pesquisa abrangente em uma janela flutuante editável.</p>
                
                <h4>Recursos da Janela de Resultados de Pesquisa</h4>
                <p>Os resultados de pesquisa aparecem em uma janela flutuante que fornece:</p>
                <ul>
                    <li><strong>Editabilidade Completa</strong> - Clique em qualquer lugar na área de conteúdo para editar o relatório de pesquisa diretamente</li>
                    <li><strong>Edição em Tempo Real</strong> - Faça alterações no conteúdo, adicione suas próprias anotações ou reorganize seções</li>
                    <li><strong>Gerenciamento de Links de Fonte</strong> - Edite, atualize ou remova citações de fonte conforme necessário</li>
                    <li><strong>Interface Maximizável</strong> - Expanda a janela para edição e revisão em tela cheia</li>
                    <li><strong>Arrastar e Reposicionar</strong> - Mova a janela para sua posição preferida na tela</li>
                </ul>
                
                <h4>Estrutura do Relatório de Pesquisa</h4>
                <p>O relatório de pesquisa é estruturado para clareza e abrangência:</p>
                <ul>
                    <li><strong>Resumo Executivo</strong> - Principais descobertas e conclusões principais</li>
                    <li><strong>Análise Detalhada</strong> - Exame abrangente organizado por subtópicos</li>
                    <li><strong>Evidências de Apoio</strong> - Dados relevantes, citações e exemplos das fontes</li>
                    <li><strong>Conclusão</strong> - Insights sintetizados e implicações</li>
                    <li><strong>Referências de Fonte</strong> - Citações completas com links clicáveis para conteúdo original</li>
                </ul>
                
                <h4>Editando Conteúdo de Pesquisa</h4>
                <p>Os resultados de pesquisa são totalmente editáveis, permitindo que você:</p>
                <ul>
                    <li>Adicione sua própria análise e comentários</li>
                    <li>Reorganize seções para melhor fluxo</li>
                    <li>Destaque descobertas importantes que importam para suas necessidades específicas</li>
                    <li>Remova informações irrelevantes</li>
                    <li>Atualize ou corrija informações de fonte</li>
                    <li>Adicione contexto ou explicações adicionais</li>
                </ul>
                
                <h4>Opções de Exportação</h4>
                <p>Os resultados de pesquisa podem ser exportados em múltiplos formatos através do utilitário de exportação integrado:</p>
                <ul>
                    <li><strong>Texto Simples (.txt)</strong> - Formato de texto limpo com formatação markdown removida para compatibilidade universal</li>
                    <li><strong>Markdown (.md)</strong> - Preserva formatação, estrutura, cabeçalhos e links na sintaxe markdown</li>
                    <li><strong>HTML (.html)</strong> - Formatação completa com estilo apropriado, elementos markdown convertidos e links clicáveis</li>
                </ul>
                
                <h4>Salvando na Base de Conhecimento</h4>
                <p>Ao salvar pesquisa em sua Base de Conhecimento, você tem opções aprimoradas:</p>
                <ul>
                    <li><strong>Seleção de Coleção</strong> - Escolha uma coleção existente ou crie uma nova durante o processo de salvamento</li>
                    <li><strong>Salvar Fontes Separadamente</strong> - Opção para salvar referências de fonte como entradas separadas em sua base de conhecimento</li>
                    <li><strong>Personalização de Conteúdo</strong> - Salve sua versão editada incluindo quaisquer modificações que você fez</li>
                    <li><strong>Preservação de Metadados</strong> - Mantém data de pesquisa, consulta e parâmetros para referência futura</li>
                </ul>
                
                <h4>Gerenciamento de Janela</h4>
                <p>A janela de resultados flutuante fornece:</p>
                <ul>
                    <li><strong>Interface Redimensionável</strong> - Arraste cantos para redimensionar para visualização otimizada</li>
                    <li><strong>Minimizar/Maximizar</strong> - Oculte temporariamente ou expanda para tela cheia</li>
                    <li><strong>Permanecer no Topo</strong> - Opção para manter resultados visíveis enquanto trabalha em outras áreas</li>
                    <li><strong>Suporte a Múltiplas Janelas</strong> - Mantenha resultados de pesquisa anteriores abertos enquanto inicia nova pesquisa</li>
                </ul>
                
                <div class="note">
                    <p><strong>Dica Profissional:</strong> Aproveite as capacidades de edição para personalizar relatórios de pesquisa para suas necessidades específicas. Você pode adicionar insights pessoais, reorganizar conteúdo e criar um recurso de conhecimento personalizado antes de salvar em sua Base de Conhecimento.</p>
                </div>
                `,
                image: "research_results_editable.png",
                imageAlt: "Janela de Resultados de Pesquisa Editável",
                imageCaption: "A janela de resultados de pesquisa flutuante mostrando capacidades de edição e opções de exportação"
            },

            {
                id: "knowledge-base-intro",
                title: "Visão Geral da Base de Conhecimento",
                content: `
                <p>A Base de Conhecimento permite que você armazene, organize e navegue manualmente através de coleções de informações que deseja manter para referência futura.</p>
                
                <h4>Estrutura da Base de Conhecimento</h4>
                <p>Seu conhecimento é organizado em coleções e entradas:</p>
                <ul>
                    <li><strong>Coleções</strong> - Pastas ou categorias que contêm entradas relacionadas (ex: "Pesquisa de Projeto" ou "Receitas Culinárias")</li>
                    <li><strong>Entradas</strong> - Peças individuais de informação armazenadas dentro de coleções</li>
                </ul>
                
                <h4>Criando uma Coleção</h4>
                <ol>
                    <li>Digite um nome para sua nova coleção no campo "Novo nome de coleção..."</li>
                    <li>Clique no botão "Criar Coleção"</li>
                    <li>Sua nova coleção aparecerá na lista de coleções abaixo</li>
                </ol>
                
                <h4>Gerenciando Coleções</h4>
                <p>Cada coleção em sua lista tem vários botões de ação:</p>
                <ul>
                    <li><strong>Visualizar</strong> - Abrir a coleção para ver seu conteúdo</li>
                    <li><strong>Editar</strong> - Renomear a coleção</li>
                    <li><strong>Exportar</strong> - Salvar a coleção e suas entradas em um arquivo</li>
                    <li><strong>Deletar</strong> - Remover a coleção e todas suas entradas</li>
                </ul>
                
                <h4>Armazenamento e Organização</h4>
                <p>A Base de Conhecimento serve como um sistema de armazenamento simples mas eficaz:</p>
                <ul>
                    <li><strong>Organização Manual</strong> - Navegue através de suas coleções para encontrar informações armazenadas</li>
                    <li><strong>Armazenamento de Pesquisa</strong> - Perfeito para armazenar relatórios de pesquisa completos do Assistente de Pesquisa</li>
                    <li><strong>Anotações Pessoais</strong> - Armazene suas próprias anotações, ideias e informações</li>
                    <li><strong>Nenhuma Busca Necessária</strong> - Navegação simples através de coleções organizadas</li>
                </ul>
                
                <div class="note">
                    <p><strong>Importante:</strong> Dados da Base de Conhecimento são criptografados usando sua Chave Mestre e armazenados localmente em seu dispositivo. Isso garante privacidade, mas também significa que você deve usar a mesma Chave Mestra para acessar seu conhecimento em sessões futuras.</p>
                </div>
                `,
                image: "knowledge_base_collections.png",
                imageAlt: "Coleções da Base de Conhecimento",
                imageCaption: "A Base de Conhecimento mostrando uma lista de coleções com opções de gerenciamento"
            },
            {
                id: "knowledge-entries",
                title: "Trabalhando com Entradas de Conhecimento",
                content: `
                <p>Entradas de conhecimento são peças individuais de informação armazenadas dentro de suas coleções.</p>
                
                <h4>Tipos de Entradas de Conhecimento</h4>
                <p>Você pode criar dois tipos de entradas em sua Base de Conhecimento:</p>
                <ul>
                    <li><strong>Entradas Manuais</strong> - Informação que você escreve ou cola diretamente</li>
                    <li><strong>Entradas de Pesquisa</strong> - Informação salva de seus relatórios de pesquisa</li>
                </ul>
                
                <h4>Criando uma Nova Entrada</h4>
                <ol>
                    <li>Abra uma coleção clicando no botão "Visualizar"</li>
                    <li>Clique no botão "+ Nova Entrada" no topo da visualização da coleção</li>
                    <li>Digite um título para sua entrada</li>
                    <li>Adicione seu conteúdo na área de texto (formatação Markdown é suportada)</li>
                    <li>Clique em "Salvar Entrada" para adicioná-la à sua coleção</li>
                </ol>
                
                <h4>Visualizando e Gerenciando Entradas</h4>
                <p>Da visualização da coleção, você pode:</p>
                <ul>
                    <li>Clicar em qualquer entrada para ver seu conteúdo completo</li>
                    <li>Usar o botão "Editar Entrada" para modificar o conteúdo de uma entrada</li>
                    <li>Usar o botão "Deletar Entrada" para remover uma entrada</li>
                    <li>Clicar no botão "← Voltar para Entradas" para retornar à visualização da coleção</li>
                </ul>
                
                <h4>Suporte Markdown</h4>
                <p>Ao criar ou editar entradas, você pode usar formatação Markdown:</p>
                <ul>
                    <li><strong>Cabeçalhos</strong> - Use # para cabeçalho nível 1, ## para nível 2, etc.</li>
                    <li><strong>Formatação</strong> - Use *itálico* para itálicos e **negrito** para texto em negrito</li>
                    <li><strong>Listas</strong> - Crie listas com marcadores usando * ou listas numeradas com 1., 2., etc.</li>
                    <li><strong>Links</strong> - Crie links com sintaxe [texto](URL)</li>
                </ul>
                
                <div class="note">
                    <p><strong>Dica:</strong> Formatação Markdown torna suas entradas mais organizadas e legíveis, especialmente para conteúdo técnico ou estruturado.</p>
                </div>
            `,
                image: "knowledge_entries.png",
                imageAlt: "Entradas de Conhecimento",
                imageCaption: "Uma visualização de coleção mostrando múltiplas entradas de conhecimento"
            },
            {
                id: "knowledge-browse",
                title: "Navegando Sua Base de Conhecimento",
                content: `
                <p>A Base de Conhecimento fornece uma maneira simples de navegar e organizar suas informações armazenadas através de coleções e entradas.</p>
                
                <h4>Navegando Coleções</h4>
                <ol>
                    <li>Da visualização principal da Base de Conhecimento, você verá todas suas coleções listadas</li>
                    <li>Clique em "Visualizar" em qualquer coleção para ver seu conteúdo</li>
                    <li>Navegue através das entradas dentro de cada coleção</li>
                    <li>Clique em entradas individuais para ler seu conteúdo completo</li>
                </ol>
                
                <h4>Encontrando Informação</h4>
                <p>Para localizar informação específica em sua Base de Conhecimento:</p>
                <ul>
                    <li><strong>Navegar por Coleção</strong> - Verifique coleções relacionadas ao seu tópico</li>
                    <li><strong>Nomeação Descritiva</strong> - Use nomes claros e descritivos para coleções e entradas</li>
                    <li><strong>Organização Lógica</strong> - Agrupe informações relacionadas na mesma coleção</li>
                    <li><strong>Revisão Manual</strong> - Navegue através de entradas para encontrar o que você precisa</li>
                </ul>
                
                <h4>Dicas de Organização</h4>
                <p>Para gerenciamento eficaz de conhecimento:</p>
                <ul>
                    <li>Crie coleções para diferentes projetos, assuntos ou períodos de tempo</li>
                    <li>Use títulos claros e descritivos tanto para coleções quanto para entradas</li>
                    <li>Considere organização baseada em data para relatórios de pesquisa</li>
                    <li>Mantenha informações relacionadas juntas na mesma coleção</li>
                </ul>
                
                <div class="note">
                    <p><strong>Dica:</strong> Boa organização desde o início torna muito mais fácil encontrar informação mais tarde. Considere suas convenções de nomenclatura e estrutura de coleção antes de adicionar muitas entradas.</p>
                </div>
                `,
            },
            {
                id: "research-to-knowledge",
                title: "Da Pesquisa ao Conhecimento",
                content: `
                <p>Uma das características mais poderosas da aba Pesquisa é a integração entre o Assistente de Pesquisa e a Base de Conhecimento.</p>
                
                <h4>Salvando Pesquisa na Base de Conhecimento</h4>
                <p>Após completar uma sessão de pesquisa:</p>
                <ol>
                    <li>Clique no botão "Salvar na Base de Conhecimento" na janela de resultados de pesquisa</li>
                    <li>Selecione uma coleção existente ou crie uma nova</li>
                    <li>Confirme sua seleção para salvar a pesquisa</li>
                </ol>
                
                <p>O relatório de pesquisa será salvo como uma nova entrada em sua coleção selecionada, incluindo:</p>
                <ul>
                    <li>O conteúdo completo do relatório de pesquisa</li>
                    <li>A pergunta de pesquisa original como título da entrada</li>
                    <li>Metadados sobre quando a pesquisa foi conduzida</li>
                    <li>Todas as fontes da pesquisa</li>
                </ul>
                
                <h4>Gerenciamento de Fonte</h4>
                <p>Ao salvar pesquisa em sua Base de Conhecimento, você tem opções para lidar com fontes:</p>
                <ul>
                    <li><strong>Salvar com Fontes</strong> - Inclui todos os links de referência e citações</li>
                    <li><strong>Salvar Apenas Conteúdo</strong> - Salva apenas o conteúdo da pesquisa sem fontes</li>
                </ul>
                
                <h4>Construindo Sua Biblioteca de Conhecimento</h4>
                <p>Ao salvar regularmente sua pesquisa na Base de Conhecimento, você pode:</p>
                <ul>
                    <li>Construir uma biblioteca pessoal de informação verificada</li>
                    <li>Evitar repetir pesquisa em tópicos que você já explorou</li>
                    <li>Referenciar rapidamente descobertas anteriores em novos projetos</li>
                    <li>Criar conexões entre tópicos relacionados</li>
                </ul>
                
                <div class="note">
                    <p><strong>Dica Profissional:</strong> Crie coleções temáticas para diferentes áreas de interesse ou projetos, então use a função de busca para encontrar conexões através de toda sua biblioteca de conhecimento.</p>
                </div>
            `,
                image: "research_to_knowledge.png",
                imageAlt: "Salvando Pesquisa na Base de Conhecimento",
                imageCaption: "O diálogo para salvar resultados de pesquisa em uma coleção da Base de Conhecimento"
            }
        ],
    },
    artworks: {
        title: "Design",
        intro:
            "A aba ODesign Visual permite usar modelos de visão de IA para analisar escolhas de design, gerar protótipos de sites baseados em designs visuais e criar sobreposições de texto para imagens.",
        articles: [
            {
                id: "artworks-getting-started",
                title: "Começando com o Visual Design Studio",
                content: `
                    <div class="note">
                        <p><strong>Lançamento Inicial:</strong> A aba Obras de Arte é uma nova funcionalidade em seu lançamento inicial. Estamos animados para compartilhar esta ferramenta inovadora de design alimentada por IA com você e adoraríamos ouvir seus comentários e ideias para futuras adições e melhorias. Suas sugestões nos ajudam a tornar o Paiperwork melhor para todos!</p>
                    </div>
                    
                    <p>A aba Obras de Arte fornece ferramentas alimentadas por IA para transformar imagens em designs web funcionais e analisar composições visuais.</p>
                    
                    <h4>Requisitos e Configuração</h4>
                    <ul>
                        <li><strong>Modelo de IA Visual Necessário</strong> - Você precisa de um modelo com capacidades de visão instalado no Ollama (Gemma4, Qwen3.5, Qwen3.6, Kimi ou outro modelo com capacidades de visão no Ollama)</li>
                        <li><strong>Seleção de Modelo</strong> - Escolha seu modelo visual no menu suspenso no topo da aba</li>
                        <li><strong>Requisitos de Imagem</strong> - Carregue imagens claras e de alta qualidade (máx. 5MB) nos formatos PNG, JPEG, GIF ou WebP</li>
                        <li><strong>Edição de Sobreposição de Texto</strong> - O modo Sobreposição de Texto gera uma sobreposição em canvas baseada em JSON com texto, formas, linhas e ornamentos editáveis.</li>
                        <li><strong>Clonagem de estilo de website</strong> - No modo Sobreposição de Texto, você pode informar opcionalmente uma URL de website para que a IA reutilize webfonts vinculadas e cores CSS desse site.</li>
                        <li><strong>Edição de Transferência de Estilo</strong> - O modo Transferência de Estilo permite editar o texto na visualização e substituir imagens no resultado.</li>
                    </ul>
                    <h4>Modelos Visuais Compatíveis</h4>
                    <ul>
                        <li><strong>Gemma4</strong> - O mais recente modelo visual do Google com forte compreensão de imagens e raciocínio sensível ao código</li>
                        <li><strong>Qwen3.5</strong> - Modelo de visão de alto desempenho com excelentes capacidades multimodais</li>
                        <li><strong>Qwen3.6</strong> - Modelo de visão avançado com melhor manipulação de design, layout e texto</li>
                        <li><strong>Kimi</strong> - Modelo eficiente com capacidades de visão para visualizações rápidas de design e fluxos de trabalho orientados a imagens</li>
                        <li>Qualquer outro modelo Ollama com capacidades de visão</li>
                    </ul>
                    
                    <h4>Instalando Modelos Visuais</h4>
                    <p>Se nenhum modelo compatível estiver disponível:</p>
                    <ol>
                        <li>Clique em "Ir para Aba de Modelos" na tela de aviso</li>
                        <li>Instale um modelo com capacidades de visão usando Ollama</li>
                        <li>Retorne ao Visual Design Studio após a instalação</li>
                    </ol>
                    
                    <div class="note">
                        <p><strong>Importante:</strong> Ao sair da aba de obras de arte, os dados da imagem são limpos da memória para evitar problemas de uso de recursos, e o contexto do chat é reiniciado para conversas regulares.</p>
                    </div>
                `,
                image: "artworks_intro.png",
                imageAlt: "Visão Geral do Visual Design Studio",
                imageCaption: "Interface da aba Obras de Arte mostrando seleção de modelo e área de upload",
            },
            {
                id: "artworks-workflow",
                title: "Fluxo de Trabalho de Design e Modos",
                content: `
                <h4>Fluxo de Trabalho Completo</h4>
                <ol>
                    <li><strong>Selecionar Modelo Visual</strong> - Escolha no menu suspenso (seleção salva para sessões futuras)</li>
                    <li><strong>Escolher Modo de Design</strong> - Selecione Transferência de Estilo HTML ou Sobreposição de Texto</li>
                    <li><strong>Carregar Imagem</strong> - Arraste/solte ou clique para carregar (sistema analisa dimensões e orientação)</li>
                    <li><strong>Referência opcional de estilo web</strong> - No modo Sobreposição de Texto, adicione uma URL de website para capturar fontes e cores candidatas desse site</li>
                    <li><strong>Escrever Instruções</strong> - Forneça orientação específica (texto de espaço reservado muda baseado no modo)</li>
                    <li><strong>Gerar e Visualizar</strong> - Clique em "Gerar Design" ou pressione Enter; resultados abrem em janela de visualização interativa</li>
                </ol>
                
                <h4>Modos de Design Explicados</h4>
                
                <h5>Transferência de Estilo HTML</h5>
                <ul>
                    <li>Converte elementos de design visual em código HTML/CSS funcional</li>
                    <li>Extrai esquemas de cores, layouts e padrões de estilo</li>
                    <li>Opção para "Usar como imagem de fundo" incorpora a imagem carregada real</li>
                    <li>Perfeito para transformar inspiração de design em interfaces web</li>
                </ul>
                
                <h5>Sobreposição de Texto</h5>
                <ul>
                    <li>Analisa imagens para encontrar áreas ideais de posicionamento de texto</li>
                    <li>Gera um JSON de sobreposição estruturado, renderizado como uma visualização em canvas sobre a imagem enviada</li>
                    <li>Pode incluir texto, formas decorativas, linhas, ornamentos, webfonts vinculadas e cores extraídas do website</li>
                    <li>Após a geração, você pode editar o texto diretamente na visualização e reposicionar os elementos selecionados da sobreposição</li>
                    <li>Considera dimensões e orientação da imagem para posicionamento adequado</li>
                    <li>Ideal para materiais de marketing, banners e apresentações de produtos</li>
                </ul>
                
                <h4>Gerenciamento de Imagens</h4>
                <ul>
                    <li><strong>Processo de Upload</strong> - Sistema mostra dimensões, orientação (Paisagem/Retrato/Quadrado) e proporção</li>
                    <li><strong>Opção de Fundo</strong> - No modo Transferência de Estilo, escolha se deve incluir a imagem real no código gerado</li>
                    <li><strong>Substituir Imagens</strong> - Clique no "×" na visualização para carregar uma nova imagem</li>
                </ul>
                
                <div class="note">
                    <p><strong>Dica:</strong> Pressione Enter (sem Shift) no campo de instruções para iniciar imediatamente a geração quando todos os requisitos forem atendidos.</p>
                </div>
            `,
            },
            {
                id: "artworks-examples",
                title: "Instruções de Exemplo e Melhores Práticas",
                content: `
                <h4>Exemplos de Transferência de Estilo HTML</h4>
                
                <h5>Site Brutalista (Exemplo Abrangente)</h5>
                <p class="example-prompt">"Crie um site estilo brutalista com todos os botões usuais do cabeçalho e links do rodapé, crie um botão no meio da viewport que diz 'entrar', use as cores da imagem para a paleta de cores do site em todos os componentes incluindo a cor de fundo para a página e rodapé/cabeçalho (torne-os semi-transparentes), certifique-se de que a imagem de fundo preencha o corpo da página web e o rodapé fique fixo na parte inferior da viewport"</p>
                
                <h5>Site de E-commerce Moderno</h5>
                <p class="example-prompt">"Transforme isso em uma página de produto de e-commerce moderno com uma barra de navegação limpa, seção de galeria de produtos, área de avaliações de clientes e botão proeminente 'Adicionar ao Carrinho'. Use o esquema de cores da imagem e crie um layout minimalista com muito espaço em branco."</p>
                
                <h5>Portfólio Criativo</h5>
                <p class="example-prompt">"Crie um site de portfólio criativo com uma seção hero de tela cheia, menu de navegação animado, grade de exibição de projetos e formulário de contato. Extraia a paleta de cores artística da imagem e aplique-a por todo o design com gradientes sutis e efeitos de hover."</p>
                
                <h5>Landing Page Corporativa</h5>
                <p class="example-prompt">"Projete uma landing page corporativa profissional com navegação de cabeçalho, seção hero com call-to-action, seção de recursos de três colunas, carrossel de depoimentos e rodapé com links da empresa. Use a paleta de cores sofisticada da imagem para transmitir confiança e autoridade."</p>
                
                <h5>Site de Restaurante/Comida</h5>
                <p class="example-prompt">"Transforme isso em um site de restaurante apetitoso com seções de menu, formulário de reserva, galeria de fotos de pratos, história do chef e informações de localização. Use cores quentes e convidativas da imagem de comida para criar uma atmosfera aconchegante e acolhedora."</p>
                
                <h4>Exemplos de Sobreposição de Texto</h4>
                
                <h5>Vitrine de Produto</h5>
                <p class="example-prompt">"Adicione o seguinte texto a esta imagem de produto: Título principal: 'Fones de Ouvido Sem Fio Premium', Subtítulo: 'Experiência Sonora Imersiva', Características principais: 'Cancelamento de Ruído • Bateria 30h • Bluetooth 5.0', Preço: 'R$ 299,99', Botão de call-to-action: 'Comprar Agora'"</p>
                
                <h5>Promoção de Evento</h5>
                <p class="example-prompt">"Crie sobreposição de texto promocional: Título do evento: 'Festival de Música de Verão 2024', Data: '15-17 de julho, 2024', Local: 'Parque Ibirapuera, SP', Headliners: 'Artistas em Destaque a Confirmar', Info do ingresso: 'Lote Promocional R$ 179', Botão: 'Comprar Ingressos'"</p>

                <h5>Pôster alinhado ao website</h5>
                <p class="example-prompt">"Crie um pôster de evento limpo usando a imagem enviada. Use as fontes vinculadas e as cores CSS do website de referência, atribua fontes diferentes do site ao título principal, ao texto de apoio e ao call to action quando a legibilidade permitir, e adicione linhas divisórias ou selos simples apenas se melhorarem a composição."</p>
                
                <h4>Exemplos de Sobreposição de Texto</h4>

                <h5>Análise de Layout</h5>
                <p class="example-prompt">"Analise o layout e composição deste design. Explique como a hierarquia visual guia a atenção do usuário e como as escolhas de espaçamento e alinhamento impactam a legibilidade e o fluxo do usuário."</p>
                
                <h5>Psicologia das Cores</h5>
                <p class="example-prompt">"Examine as escolhas de cores neste design e explique seu impacto psicológico. Como essas cores afetam as emoções dos usuários e a tomada de decisões? O que esta paleta de cores comunica sobre a marca?"</p>
                
                <h4>Escrevendo Instruções Eficazes</h4>
                <ul>
                    <li><strong>Seja Específico</strong> - Inclua estilo de design, público-alvo e componentes-chave necessários</li>
                    <li><strong>Mencione Elementos da Imagem</strong> - Referencie cores, layouts ou recursos específicos da sua imagem carregada</li>
                    <li><strong>Mencione os objetivos da referência web</strong> - Se você forneceu uma URL, diga se quer preservar as fontes, a paleta de cores ou ambos na sobreposição</li>
                    <li><strong>Defina o Propósito</strong> - Explique o objetivo (marketing, portfólio, e-commerce, etc.)</li>
                    <li><strong>Peça recursos da sobreposição</strong> - Especifique posições preferidas para o texto, linhas ou formas decorativas e se vários blocos de texto devem usar fontes diferentes do website</li>
                </ul>
                
                <h4>Escolhendo as Imagens Certas</h4>
                <ul>
                    <li><strong>Transferência de Estilo</strong> - Use imagens com elementos de design distintos e esquemas de cores claros</li>
                    <li><strong>Sobreposição de Texto</strong> - Selecione imagens com áreas claras para posicionamento de texto</li>
                    <li><strong>Qualidade Importa</strong> - Imagens de alta resolução com boa iluminação produzem melhores resultados</li>
                </ul>
                
                <div class="note">
                    <p><strong>Dica Profissional:</strong> Ao usar "Usar como imagem de fundo" no modo Transferência de Estilo HTML, o sistema automaticamente gerencia a integração da imagem com comentários de espaço reservado mostrando exatamente onde a imagem é usada.</p>
                </div>
            `,

                images: [
                    {
                        src: "artworks_examples.png",
                        alt: "Instruções de Exemplo",
                        caption:
                            "Exemplo de instruções de design para um protótipo promocional de fone de ouvido",
                    },
                    {
                        src: "artworks_examples2.png",
                        alt: "Resultado final do protótipo",
                        caption: "Exemplo de protótipo de design para uma promoção de fone de ouvido",
                    }
                ]

            },
            {
                id: "artworks-results-management",
                title: "Trabalhando com Resultados e Solução de Problemas",
                content: `
                <h4>Processo de Geração</h4>
                <ul>
                    <li><strong>Janela de Progresso</strong> - Mostra a IA analisando sua imagem (tipicamente 30-60 segundos)</li>
                    <li><strong>Cancelar a Qualquer Momento</strong> - Clique no botão fechar na janela de progresso para parar a geração</li>
                    <li><strong>Exibição de Resultados</strong> - Saída aparece diretamente no modo de visualização</li>
                </ul>
                
                <h4>Janela de Visualização Interativa</h4>
                <p>Os resultados abrem em uma janela flutuante onde você pode:</p>
                <ul>
                    <li><strong>Editar texto</strong> - Dê duplo clique em um bloco de texto para alterar seu conteúdo</li>
                    <li><strong>Mover elementos</strong> - Clique e arraste texto, formas, linhas ou ornamentos selecionados no pôster</li>
                    <li><strong>Redimensionar texto</strong> - Selecione um bloco de texto e arraste sua alça para ampliar ou ajustar a área de texto</li>
                    <li><strong>Excluir elementos</strong> - Pressione Delete ou Backspace para remover o elemento de texto ou decoração atualmente selecionado</li>
                    <li><strong>Desfazer exclusões</strong> - Pressione Cmd/Ctrl+Z para restaurar até os últimos 6 elementos de sobreposição excluídos</li>
                    <li><strong>Rolar pôsteres grandes</strong> - Sobreposições grandes ou em retrato permanecem no tamanho nativo da imagem, e a área de visualização passa a rolar em vez de comprimir o pôster</li>
                    <li><strong>Alternar Visualizações</strong> - Alternar entre visualização de código e visualização ao vivo</li>
                    <li><strong>Editar Diretamente</strong> - Modificar o HTML gerado ou o JSON da sobreposição em tempo real</li>
                    <li><strong>Copiar Código</strong> - Usar para seus próprios projetos</li>
                    <li><strong>Exportar PNG</strong> - Salvar captura de tela do design</li>
                </ul>
                
                <h4>Trabalhando com Código Gerado</h4>
                <ul>
                    <li><strong>Ponto de Partida</strong> - Considere o HTML gerado ou o JSON da sobreposição como uma base que você pode refinar ainda mais</li>
                    <li><strong>Teste de Navegador</strong> - Teste em diferentes navegadores e tamanhos de tela</li>
                    <li><strong>Edição Direta</strong> - Modifique e visualize código diretamente na janela de resultado</li>
                    <li><strong>Referências de fontes do website</strong> - No modo de sobreposição, as fontes web vinculadas ficam em <code>overlay.webFonts</code> e podem ser referenciadas pelos elementos de texto</li>
                    <li><strong>Regeneração</strong> - Tente novamente com instruções mais específicas se necessário</li>
                </ul>
                
                <h4>Importante: URLs de Imagem Temporárias criadas para uso de fundo durante a geração</h4>
                <div class="warning">
                    <p><strong>Substitua URLs Blob Antes da Implementação:</strong></p>
                    <ul>
                        <li>O código gerado contém URLs blob temporárias como <code>blob:http://localhost:8182/...</code></li>
                        <li>Estas são armazenadas na memória apenas para visualização e não funcionarão fora da sua sessão</li>
                        <li>Procure por propriedades CSS como <code>background-image: url('blob:http://...')</code></li>
                        <li>Substitua URLs blob por caminhos para seus arquivos de imagem reais antes de usar o código</li>
                    </ul>
                </div>
                
                <h4>Solucionando Problemas Comuns</h4>
                
                <h5>Falhas de Geração</h5>
                <ul>
                    <li><strong>Solução:</strong> Tente um modelo visual diferente ou imagem menor</li>
                    <li><strong>Prevenção:</strong> Use imagens claras com elementos de design distintos</li>
                    <li><strong>Tentar Novamente:</strong> Devido à natureza probabilística dos modelos de IA, você deve tentar várias vezes antes de desistir</li>
                </ul>
                
                <h5>Performance Lenta</h5>
                <ul>
                    <li><strong>Solução:</strong> Use imagens menores, simplifique instruções, use modelos de IA menores</li>
                    <li><strong>Nota:</strong> Designs complexos e imagens maiores requerem mais tempo de processamento</li>
                </ul>
                
                <h5>Saída de Código Incompleta</h5>
                <ul>
                    <li><strong>Solução:</strong> Peça à IA para continuar ou completar o código no chat regular após a geração</li>
                    <li><strong>Alternativa:</strong> Divida solicitações complexas em gerações menores e específicas</li>
                </ul>
                
                <h5>Posicionamento de Texto Ruim (Modo Sobreposição)</h5>
                <ul>
                    <li><strong>Solução:</strong> Especifique posições preferidas em suas instruções</li>
                    <li><strong>Exemplo:</strong> "Coloque o título no canto superior esquerdo, preço no canto inferior direito"</li>
                </ul>

                <h5>As fontes ou cores do website não foram usadas como esperado</h5>
                <ul>
                    <li><strong>Solução:</strong> Forneça uma URL válida no campo de estilo web do modo Sobreposição de Texto e peça explicitamente ao modelo para preservar as fontes e cores CSS do site</li>
                    <li><strong>Observação:</strong> Se o website não expuser arquivos de fonte utilizáveis, a sobreposição pode recorrer a alternativas compatíveis</li>
                </ul>
                
                <div class="note">
                    <p><strong>Dica de Performance:</strong> O processamento visual é intensivo em recursos. Para melhores resultados, feche aplicações desnecessárias e use imagens de alta qualidade e claramente compostas.</p>
                    <p>No Mac Osx você pode precisar exportar o png 2 vezes, pois na primeira vez pode falhar ao exportar a imagem de fundo (Safari).</p>
                    <p>Se o texto ficar quebrado no png exportado, clique uma vez no texto afetado e expanda sua largura até que o problema seja resolvido.</p>
                </div>
            `,
                image: "artworks_examples3.png",
                imageAlt: "Gerenciamento de Resultados",
                imageCaption: "A janela de visualização interativa com capacidades de edição e exportação",
            },
        ],
    },
    campaign: {
        title: "Campaign",
        intro:
            "O Campaign Studio ajuda você a estruturar um briefing completo de campanha com sparring de IA e depois gerar e refinar um poster, uma apresentação e um mini app a partir de uma única fonte compartilhada.",
        articles: [
            {
                id: "campaign-overview",
                title: "Para que serve o Campaign Studio",
                content: `
                <p>O Campaign Studio foi projetado para usuários que querem sair de uma ideia inicial e chegar a um pacote de campanha coordenado sem precisar gerenciar ferramentas separadas para estratégia, texto e geração de artefatos.</p>

                <h4>Objetivo principal</h4>
                <p>O recurso combina brainstorming estratégico com produção estruturada de campanha. Em vez de pedir separadamente um poster, um conjunto de slides e um mini app, você monta um único briefing de campanha e o sistema o reutiliza nas três saídas.</p>

                <h4>O que ele pode gerar</h4>
                <ul>
                    <li><strong>Poster</strong> - Um poster visual gerado a partir do briefing de campanha, da seção específica do briefing para o poster e da imagem de campanha enviada</li>
                    <li><strong>Apresentação</strong> - Uma apresentação HTML editável por prompt, alinhada à mesma direção da campanha</li>
                    <li><strong>Mini App</strong> - Um mini app HTML editável por prompt, guiado pelo briefing de campanha e por restrições funcionais específicas do mini app</li>
                </ul>

                <h4>Principais capacidades</h4>
                <ul>
                    <li><strong>Fonte única de verdade</strong> - O briefing de campanha editável orienta todas as saídas</li>
                    <li><strong>Sparring com IA</strong> - O orquestrador ajuda a refinar posicionamento, público, tom e texto antes da geração</li>
                    <li><strong>Campanhas salvas</strong> - Salve campanhas no banco de dados local criptografado e reabra depois</li>
                    <li><strong>Regeneração direcionada</strong> - Regere apenas a apresentação, o mini app ou o poster sem refazer todo o fluxo do estúdio</li>
                    <li><strong>Edição segura por variantes</strong> - Edições manuais das saídas são preservadas em memória e podem ser salvas como novas variantes em vez de sobrescrever silenciosamente uma campanha principal</li>
                </ul>

                <h4>Fluxo de trabalho típico</h4>
                <ol>
                    <li>Abra a aba Campaign e clique em <strong>Open Studio</strong></li>
                    <li>Envie a imagem principal da campanha</li>
                    <li>Use o chat do orquestrador para moldar a estratégia da campanha</li>
                    <li>Revise e edite o Campaign Brief</li>
                    <li>Clique em <strong>Generate Campaign</strong> para criar a apresentação, o mini app e o poster</li>
                    <li>Abra cada visualização e refine os resultados</li>
                    <li>Salve a campanha quando o briefing e as saídas estiverem no estado que você deseja manter</li>
                </ol>

                <div class="note">
                    <p><strong>Importante:</strong> A geração da campanha exige uma imagem enviada porque o fluxo do poster depende dela. As outras saídas compartilham a mesma estratégia de campanha, mas o poster usa especificamente a referência visual enviada.</p>
                    <p><strong>Requisito do poster:</strong> A geração e a regeneração do poster também exigem que um modelo visual esteja selecionado no card da aba Artworks antes de executar o fluxo da campanha.</p>
                </div>
            `,
            },
            {
                id: "campaign-orchestrator",
                title: "Como usar o orquestrador",
                content: `
                <p>O orquestrador do Campaign foi pensado para atuar como um parceiro estratégico de sparring, e não como um gerador de um clique. O trabalho dele é melhorar o briefing antes de você gerar as saídas.</p>

                <h4>Melhor uso esperado</h4>
                <ul>
                    <li><strong>Refinar o posicionamento</strong> - Peça para ele deixar mais claro o ângulo, a promessa ou a proposta de valor da campanha</li>
                    <li><strong>Melhorar a adequação ao público</strong> - Peça que ele questione se a campanha está falando com as pessoas certas</li>
                    <li><strong>Fortalecer a mensagem</strong> - Use-o para melhorar títulos, subtítulos, pontos-chave, a seção do briefing do poster ou o tom</li>
                    <li><strong>Ajustar o mini app</strong> - Diga que tipos de funcionalidades adicionar, remover, evitar ou destacar no mini app</li>
                    <li><strong>Testar ideias</strong> - Pergunte o que parece genérico demais, fraco, carregado ou pouco claro antes de gerar</li>
                </ul>

                <h4>O que o orquestrador não faz</h4>
                <ul>
                    <li>Ele não gera automaticamente as saídas de poster, apresentação ou mini app por conta própria</li>
                    <li>Ele não decide quando a execução começa</li>
                    <li>Ele não substitui o briefing editável; ele ajuda a melhorá-lo</li>
                </ul>

                <h4>Bons exemplos de prompt</h4>
                <ul>
                    <li><strong>Estratégia:</strong> "Isso parece genérico demais. Deixe a campanha mais específica para pequenas cafeterias locais."</li>
                    <li><strong>Tom:</strong> "Mantenha a campanha persuasiva, mas menos corporativa e mais direta."</li>
                    <li><strong>Seção do briefing do poster:</strong> "Encurte a linguagem do poster e faça parecer mais urgente."</li>
                    <li><strong>Ajuste do mini app:</strong> "Para o mini app, evite botões no cabeçalho e mantenha o layout compacto e com cara de app em vez de página de destino."</li>
                </ul>

                <div class="note">
                    <p><strong>Dica:</strong> Trate o orquestrador como um colega criativo. Use-o para iterar sobre o briefing até que a direção da campanha esteja forte e só então gere. Quanto melhor o briefing, mais coerentes serão as três saídas.</p>
                </div>
            `,
            },
            {
                id: "campaign-brief",
                title: "Trabalhando com o Campaign Brief",
                content: `
                <p>O Campaign Brief é a superfície central de edição dentro do Campaign Studio. Ele é intencionalmente editável para que você possa combinar sugestões do orquestrador com suas próprias decisões manuais.</p>

                <h4>Áreas editáveis do briefing</h4>
                <ul>
                    <li><strong>Título e subtítulo</strong> - Título principal da campanha e linha de apoio</li>
                    <li><strong>Mensagem central</strong> - Ideia principal que a campanha deve comunicar</li>
                    <li><strong>Público</strong> - O grupo-alvo da campanha</li>
                    <li><strong>Tom</strong> - A voz e a sensação que as saídas devem transmitir</li>
                    <li><strong>Pontos-chave</strong> - Ideias de apoio que a campanha deve enfatizar</li>
                    <li><strong>Paleta de cores da campanha</strong> - Direção visual para o estilo da apresentação e do mini app</li>
                    <li><strong>Seção do poster</strong> - Seção dedicada ao cabeçalho, subcabeçalho, corpo e rodapé do poster</li>
                    <li><strong>Seção do mini app</strong> - Campos dedicados para adicionar ou remover funcionalidades do mini app</li>
                </ul>

                <h4>Campos de adicionar / remover no mini app</h4>
                <p>A seção do Mini App contém dois campos específicos:</p>
                <ul>
                    <li><strong>Adicionar ao mini app</strong> - Use isto para funcionalidades ou padrões de interação que você quer incluir ou enfatizar</li>
                    <li><strong>Remover do mini app</strong> - Use isto para funcionalidades, controles ou elementos de layout que você quer que o mini app evite</li>
                </ul>
                <p>Esses campos não são feitos para se tornarem texto visível dentro do app. Eles são interpretados como orientação funcional para a geração e regeneração do mini app.</p>

                <h4>Boas práticas para o briefing</h4>
                <ul>
                    <li>Mantenha o título e o subtítulo concisos</li>
                    <li>Use os pontos-chave para ideias de apoio, não para parágrafos longos</li>
                    <li>Use a seção do poster apenas para texto curto do poster, não para notas estratégicas completas</li>
                    <li>Use a seção do mini app para restrições funcionais, como o que incluir, evitar, simplificar ou remover</li>
                    <li>Revise o briefing após cada troca com o orquestrador para saber exatamente o que vai orientar a geração</li>
                </ul>

                <div class="note">
                    <p><strong>Importante:</strong> O briefing não é apenas uma prévia. Ele é a fonte editável da campanha usada pelos fluxos de regeneração, portanto mudanças manuais afetam diretamente futuras saídas de apresentação, mini app e poster.</p>
                </div>
            `,
            },
            {
                id: "campaign-output-editing",
                title: "Edição de saídas de poster, apresentação e mini app",
                content: `
                <p>Depois da geração, cada saída do Campaign tem seu próprio fluxo de edição. Isso permite refinar os artefatos gerados sem reiniciar toda a campanha.</p>

                <h4>Edição do poster</h4>
                <ul>
                    <li>O poster abre dentro da visualização do Campaign com uma sobreposição editável baseada em canvas</li>
                    <li>Você pode selecionar elementos da sobreposição, movê-los, excluí-los e desfazer exclusões recentes</li>
                    <li>O estado atual do poster pode ser exportado como PNG</li>
                    <li><strong>Regenerate</strong> executa novamente apenas o fluxo do poster usando a seção mais recente do briefing do poster, o briefing de campanha, a orientação de paleta e a imagem enviada</li>
                    <li><strong>Modelo visual obrigatório</strong> - Selecione um modelo visual no card da aba Artworks antes de gerar ou regenerar o poster da campanha</li>
                </ul>

                <h4>Edição da apresentação</h4>
                <ul>
                    <li>A apresentação é carregada em um espaço de trabalho editável baseado em iframe</li>
                    <li>Você pode editar texto diretamente dentro da apresentação renderizada</li>
                    <li>Você pode clicar em imagens e substituí-las usando as ferramentas existentes de edição de apresentação por prompt</li>
                    <li><strong>Regenerate</strong> executa novamente apenas o fluxo da apresentação a partir do briefing de campanha mais recente e do contexto atual da campanha</li>
                    <li><strong>Save to disk</strong> exporta a apresentação HTML atual incluindo suas edições</li>
                </ul>

                <h4>Edição do mini app</h4>
                <ul>
                    <li>O mini app usa o mesmo modelo de edição por iframe editável que a apresentação</li>
                    <li>Você pode editar texto diretamente no resultado renderizado</li>
                    <li>Você pode substituir imagens mantendo a direção atual do app</li>
                    <li><strong>Regenerate</strong> executa novamente apenas o fluxo do mini app reutilizando o briefing mais recente e os campos de personalização do mini app</li>
                    <li><strong>Save to disk</strong> exporta o mini app HTML atual incluindo suas edições</li>
                </ul>

                <h4>Comportamento de regeneração e cancelamento</h4>
                <ul>
                    <li>Apresentação e Mini App têm ações direcionadas de <strong>Regenerate</strong> que mudam para <strong>Cancel</strong> enquanto estão em execução</li>
                    <li>Uma barra de progresso indeterminada em linha aparece ao lado do botão de regeneração ativo</li>
                    <li>Cancel interrompe a regeneração direcionada sem iniciar o modal bloqueante do fluxo completo do Campaign</li>
                </ul>

                <div class="note">
                    <p><strong>Dica:</strong> Use primeiro o briefing para melhorar a direção estratégica e depois a edição por saída para refinamentos locais, como layout, substituição de imagem ou limpeza final do texto. Isso mantém a regeneração focada e reduz retrabalho desnecessário.</p>
                </div>
            `,
            },
        ],
    },
    presentation: {
        title: "Apresentação",
        intro: "Crie slides a partir de documentos usando extração assistida por IA e um editor de visualização.",
        articles: [
            {
                id: "presentation-overview",
                title: "Visão geral",
                content: `
            <p>A aba Apresentação converte documentos compatíveis (.pdf, .docx, .txt, .md) em uma sequência de slides. A aba extrai o texto do seu arquivo, usa a IA para gerar o conteúdo dos slides, opcionalmente recupera imagens para os slides e abre uma visualização interativa onde você pode revisar e exportar o resultado.</p>
            <p>Fluxo rápido:</p>
            <ol>
                <li>Envie um documento usando arrastar e soltar ou o botão Procurar.</li>
                <li>Escolha o número de slides e pontos por slide.</li>
                <li>Adicione um prompt extra opcional para controlar tom ou estilo.</li>
                <li>Clique em Gerar para executar extração e geração por IA.</li>
                <li>Revise e edite os slides na janela de visualização e então exporte.</li>
            </ol>
        `,
                image: "tab_overview.png",
                imageAlt: "Visão geral da aba Apresentação",
                imageCaption: "Visão geral da aba Apresentação",
            },
            {
                id: "presentation-direct-copy",
                title: "Modo Cópia direta",
                content: `
            <p>Use Cópia direta quando seu documento já tiver texto pronto para slides que você quer manter exatamente como está. A IA apenas estrutura e divide o conteúdo; não parafraseia.</p>

            <h4>Como preparar seu documento</h4>
            <ul>
                <li><strong>Rotule as slides explicitamente:</strong> adicione "cover:" para a primeira, depois "Slide 1:", "Slide 2:", e assim por diante na ordem.</li>
                <li><strong>Texto da capa:</strong> após "cover:" inclua um título e opcionalmente um subtítulo separado por vírgula.</li>
                <li><strong>Uma seção por slide:</strong> coloque o texto de cada slide logo depois do rótulo; mantenha a ordem e o idioma consistentes.</li>
                <li><strong>Ajuste os marcadores:</strong> defina o seletor de marcadores por slide conforme deseja dividir o texto. A IA vai fatiar de forma sequencial sem reescrever e preenche itens vazios quando faltar conteúdo.</li>
                <li><strong>Respeite o contexto:</strong> mantenha o texto total razoável (o seletor de contexto controla o tamanho máximo) para capturar todos os slides rotulados.</li>
            </ul>

            <h4>Como executar Cópia direta</h4>
            <ol>
                <li>Escolha "Cópia direta" no seletor de modo.</li>
                <li>Defina a contagem de slides e marcadores por slide (o slide 1 é sempre a capa).</li>
                <li>Solte seu documento rotulado ou cole o texto e, opcionalmente, adicione um prompt extra para instruções menores (por exemplo: preferência de maiúsculas ou espaçamento).</li>
                <li>Clique em Gerar; a saída espelha sua redação. Slides ou marcadores ausentes ficam como strings vazias em vez de serem reescritos.</li>
            </ol>

            <p>Dica: se notar reescritas inesperadas, confirme que o modo é "Cópia direta" e que os rótulos estão escritos exatamente ("Slide 1:", "Slide 2:", etc.).</p>
        `,
                image: "tab_overview.png",
                imageAlt: "Modo Cópia direta",
                imageCaption: "Rotule os slides e execute Cópia direta",
            },
            {
                id: "presentation-promptable",
                title: "Apresentação configurável por prompt",
                content: `
            <p><strong>Apresentação configurável por prompt</strong> abre um espaço de trabalho dedicado em ecrã completo para criar decks por instruções.</p>
            <ul>
                <li><strong>Número de slides</strong> — escolha a quantidade exata (1 a 20).</li>
                <li><strong>Adicionar texto</strong> — abre uma janela flutuante para colar texto-fonte extenso.</li>
                <li><strong>Persistência do texto</strong> — ao fechar e reabrir a janela, o texto previamente guardado aparece novamente.</li>
                <li><strong>Fluxo Enviar</strong> — Enviar monta automaticamente o prompt do utilizador com o número de slides e o texto guardado.</li>
                <li><strong>Pedido extra (opcional)</strong> — use o botão Pedido extra para indicar estilo/layout (por exemplo: "usar cores vermelhas" ou "molduras arredondadas nas imagens"); quando preenchido, ele é adicionado antes do texto-fonte principal no prompt.</li>
                <li><strong>Seleção de modo</strong> — use o <strong>Modo interativo</strong> para apresentações navegadas com botões <strong>Anterior/Seguinte</strong>, ou o <strong>Modo com rolagem</strong> para apresentações percorridas de cima para baixo.</li>
                <li><strong>Alternador de pesquisa web</strong> — após <strong>Enviar</strong>, use o alternador <strong>Web</strong> para construir conteúdo da apresentação a partir de resultados web usando o conteúdo de Add text como prompt de pesquisa; quando ativo, o botão muda para <strong>Prompt de pesquisa web</strong>.</li>
                <li><strong>Dica para prompt web</strong> — neste modo, escreva apenas o tema da apresentação. Evite frases como «criar uma apresentação sobre...» porque podem influenciar a pesquisa web; informe somente o tema.</li>
                <li><strong>Dica para substituir imagem</strong> — se uma imagem não carregar, ou se quiser simplesmente trocá-la, clique na imagem na pré-visualização e inicie uma pesquisa de imagens para substituí-la.</li>
                <li><strong>Dica para editar texto</strong> — as caixas de texto podem ser editadas diretamente na pré-visualização, para que faça os ajustes finais antes de guardar a apresentação HTML.</li>
                <li><strong>Modelo recomendado</strong> — para esta funcionalidade, <strong>GLM 4.7 Flash</strong> é um muito bom modelo para apresentações.</li>
                <li><strong>Apresentações guardadas</strong> — os decks HTML podem ser guardados de forma encriptada na base de dados e listados na barra lateral direita.</li>
                <li><strong>Abrir pela barra lateral</strong> — clique numa apresentação guardada para carregá-la na área de pré-visualização em formato paisagem.</li>
                <li><strong>Segurança ao eliminar</strong> — a eliminação pede confirmação antes de remover.</li>
            </ul>
            <p>Dica: organize o texto-fonte por secções e escolha um número de slides realista para obter uma estrutura mais clara.</p>
        `,
                image: "tab_overview.png",
                imageAlt: "Fluxo de apresentação configurável por prompt",
                imageCaption: "Área de trabalho e controlos da apresentação configurável por prompt",
            },
            {
                id: "presentation-generating",
                title: "Gerando apresentações",
                content: `
            <p>Depois de clicar em Gerar, o sistema executa vários passos e exibe um modal de progresso:</p>
            <ul>
                <li><strong>Extração de texto</strong> — o texto do documento é extraído para consumo pela IA.</li>
                <li><strong>Geração por IA</strong> — a IA transforma o texto extraído em conteúdo de slides (o prompt extra é incluído quando fornecido).</li>
                <li><strong>Parsing e imagens</strong> — a saída da IA é analisada em slides estruturados e imagens são baixadas se disponíveis.</li>
                <li><strong>Tratamento de erros</strong> — a aba automaticamente tenta novamente uma vez em respostas malformadas da IA; erros são exibidos no modal de carregamento.</li>
            </ul>
            <p>Você pode cancelar a geração a qualquer momento usando o botão fechar/abort no modal de carregamento. Abortando, as tarefas em segundo plano serão interrompidas e o modal fechado.</p>
        `,
                image: "generating_presentation.png",
                imageAlt: "Gerando apresentações",
                imageCaption: "Processo de geração e indicadores de progresso",
            },
            {
                id: "presentation-preview-export",
                title: "Visualizar, Editar e Exportar",
                content: `
            <p>Quando a geração for bem-sucedida, uma Janela de Visualização em tela cheia é aberta. Recursos principais da visualização:</p>
            <ul>
                <li><strong>Visualização ampliada do slide</strong> — revise o slide atualmente selecionado renderizado como HTML.</li>
                <li><strong>Miniaturas</strong> — navegue pelos slides com a barra de miniaturas e vá para qualquer slide.</li>
                <li><strong>Edição inline</strong> — edite o texto do slide diretamente na visualização (a visualização aplica os dados do slide via a API PreviewWindow).</li>
                <li><strong>Opções de exportação</strong> — use os controles da visualização para copiar o texto do slide, exportar imagens ou baixar o HTML (o menu exato de exportação é fornecido pela UI da visualização).</li>
            </ul>
            
            <p>Dicas: mantenha o texto do documento claro para melhor extração, use uma quantidade razoável de slides em relação ao comprimento do conteúdo e adicione um prompt extra quando precisar de um tom ou estilo específico.</p>
        `,
                image: "preview_editing_export.png",
                imageAlt: "Visualizar e exportar",
                imageCaption: "Janela de visualização, edição e opções de exportação",
            },
            {
                id: "presentation-sidebar",
                title: "Barra lateral da Apresentação",
                content: `
            <p>A Barra lateral da Apresentação fornece controles por slide e globais para estilizar slides, editar texto, gerenciar imagens e aplicar alterações de texto com IA.</p>
            <h4>Abas</h4>
            <ul>
                <li><strong>Estilo</strong> — escolha e aplique estilos de apresentação (cartões pré-construídos como Clássico, Modo Escuro, Produto, Corporativo e muitos presets de tema). O estilo <em>DIY</em> abre um gerenciador de estilos onde você pode criar ou reutilizar estilos personalizados armazenados localmente.</li>
                <li><strong>Texto</strong> — contém controles de texto globais (fonte, cor, marcadores) e controles específicos por nó para elementos de texto selecionados.</li>
                <li><strong>Imagem</strong> — ferramentas de imagem incluindo importar/substituir, alterar imagem de capa, buscar imagens por descrição e uma galeria de miniaturas para substituição rápida.</li>
            </ul>

            <h4>Controles globais vs selecionados</h4>
            <p>A aba Texto expõe controles globais aplicados a marcadores e estilos de texto padrão. Quando você seleciona um nó de texto em um slide, controles específicos do nó aparecem (tamanho da fonte, seletor de cores, modificação de texto por IA) permitindo ajustes por nó.</p>

            <h4>Modificação de texto por IA</h4>
            <ul>
                <li>Digite uma instrução no campo de texto da IA (exemplo: "Traduzir para português" ou "Deixe estes marcadores mais concisos").</li>
                <li>Use o botão <em>Modificar</em> para aplicar as alterações aos nós atualmente selecionados.</li>
                <li>Ative o interruptor <em>Aplicar a todo o texto</em> para executar a modificação em todos os nós de texto correspondentes; a barra lateral tentará um caminho em lote com relatório de progresso quando disponível.</li>
                <li>O botão Modificar alterna para <em>Cancelar</em> enquanto estiver em execução — ele aborta a operação usando o SlideForge AbortController compartilhado.</li>
            </ul>

            <h4>Ferramentas de imagem</h4>
            <ul>
                <li><strong>Importar imagem</strong> — substitui a imagem selecionada do slide ou, quando alternado, substitui a imagem de capa no primeiro slide.</li>
                <li><strong>Alterar capa</strong> — fluxo com suporte a helper para substituir uma imagem de capa em etapa completa; reverte para o fluxo padrão de importação se nenhum helper estiver disponível.</li>
                <li><strong>Buscar imagens</strong> — insira uma descrição e clique em Buscar; os resultados preenchem a grade de miniaturas onde você pode escolher uma imagem para substituir a imagem selecionada.</li>
                <li>A grade de miniaturas é dimensionada para mostrar múltiplas linhas e fornece mensagens de progresso/estado durante a importação ou substituição de imagens.</li>
            </ul>

            <h4>Cartões de estilo e DIY</h4>
            <p>Os cartões de estilo permitem aplicar rapidamente temas visuais. O cartão DIY abre o gerenciador de estilos se existirem estilos personalizados (em memória ou no BD) ou lança um modal de criação. Os cartões refletem visualmente a disponibilidade e o estado de seleção.</p>

            <h4>Integração com helpers</h4>
            <p>A barra lateral depende de helpers de seleção anexados aos estágios da apresentação para realizar substituições de imagem, edições em lote por IA e operações de nó. Se um helper não for encontrado, a barra lateral exibe mensagens úteis e recorre aos fluxos globais disponíveis.</p>
        `,
                image: "sidebar_controls.png",
                imageAlt: "Barra lateral da apresentação",
                imageCaption: "Controles da barra lateral para estilo, texto e imagens",
            },
            {
                id: "presentation-export-note",
                title: "Exportar PDF: O que é exportado",
                content: `
            <p><strong>Nota:</strong> O botão <em>Export PDF</em> exporta a apresentação exatamente como aparece na tela — incluindo texto dos slides, imagens, formas e elementos de fundo.</p>
        `,
                image: "export_slides.png",
                imageAlt: "Nota Exportar PDF",
                imageCaption: "Exporta os slides como mostrado na visualização",
            },
        ],
    },
    // Seção da aba Traduzir
    artifacts: {
        title: "Artefatos",
        intro: "A aba Artefatos e um espaco dedicado para gerar artefatos HTML interativos, refiná-los com IA e salvar resultados reutilizaveis.",
        articles: [
            {
                id: "artifacts-overview",
                title: "Visao geral",
                content: `
            <p>A aba Artefatos e focada na geracao de artefatos HTML em um fluxo de trabalho de tela cheia. Ela e util para criar prototipos, landing pages, trechos interativos e experimentos visuais a partir de prompts.</p>
            <ul>
                <li><strong>Saida principal</strong> - a IA retorna HTML/CSS/JS executavel e abre o resultado na area de visualizacao.</li>
                <li><strong>Ciclo de iteracao</strong> - peca alteracoes, regenere e valide o comportamento no mesmo espaco.</li>
                <li><strong>Suporte a modelos</strong> - funciona com modelos locais ou em nuvem disponiveis no seletor.</li>
            </ul>
        `,
            },
            {
                id: "artifacts-controls",
                title: "Botoes e controles",
                content: `
            <p>Os controles do cabecalho foram pensados para iteracao rapida de prompts:</p>
            <ul>
                <li><strong>Web / Web ativo</strong> - ativa ou desativa o modo assistido pela web; o rotulo muda quando ativo.</li>
                <li><strong>Enviar</strong> - envia o prompt e inicia a geracao.</li>
                <li><strong>Barra de progresso</strong> - aparece no cabecalho enquanto a solicitacao estiver em andamento.</li>
                <li><strong>Cancelar</strong> - interrompe a geracao atual quando necessario.</li>
            </ul>
            <p>Dica: estruture o prompt (objetivo, layout, interacoes, restricoes) para melhorar a qualidade da primeira resposta.</p>
        `,
            },
            {
                id: "artifacts-saved",
                title: "Artefatos salvos e historico de prompts",
                content: `
            <p>Artefatos gerados podem ser salvos no banco de dados local criptografado e reabertos depois pela barra lateral.</p>
            <ul>
                <li><strong>Salvar</strong> - salva o resultado atual para reutilizacao futura.</li>
                <li><strong>Abrir pela barra lateral</strong> - clique em uma entrada salva para carregar novamente na visualizacao.</li>
                <li><strong>Botao Prompt</strong> - abre o prompt usado para criar aquele artefato.</li>
                <li><strong>Copiar prompt</strong> - copia o prompt salvo na janela para reutilizar ou ajustar.</li>
                <li><strong>Excluir</strong> - remove artefatos salvos que nao sao mais necessarios.</li>
            </ul>
            <p>Esse fluxo ajuda a manter uma biblioteca reutilizavel de resultados e instrucoes originais.</p>
        `,
            },
        ],
    },

    translate: {
        title: "Traduzir",
        intro: "A aba Traduzir converte texto de documentos com IA e oferece uma janela flutuante de visualização para revisão, atualizações em tempo real e exportação.",
        articles: [
            {
                id: "translate-overview",
                title: "Visão geral",
                content: `
            <p>A aba Traduzir é um fluxo focado em documentos para traduzir arquivos e revisar os resultados antes de exportar.</p>

            <h4>Formatos suportados</h4>
            <ul>
                <li><strong>PDF</strong> - visualização com sobreposição editável e renderização por página</li>
                <li><strong>TXT</strong> - tradução de texto simples com preservação de linhas e parágrafos</li>
                <li><strong>MD</strong> - tradução consciente de Markdown com preservação de estrutura</li>
            </ul>

            <h4>Controles principais</h4>
            <ul>
                <li><strong>Área de arrastar e soltar</strong> - solte um arquivo ou clique para procurar</li>
                <li><strong>Seletor de escopo</strong> - escolha Selection, Page ou Document antes de traduzir</li>
                <li><strong>Campo de instrução</strong> - por exemplo <em>"Traduzir este documento para francês"</em></li>
                <li><strong>Botão Traduzir</strong> - inicia a tradução do documento atual</li>
                <li><strong>Exportar documento traduzido</strong> - exporta o resultado com base no estado atual da visualização</li>
            </ul>

            <h4>Seletor de escopo</h4>
            <ul>
                <li><strong>Selection</strong> - aplica em uma ou mais páginas selecionadas na visualização.</li>
                <li><strong>Page</strong> - aplica apenas na página atualmente selecionada.</li>
                <li><strong>Document</strong> - aplica no documento inteiro (todas as páginas/blocos).</li>
            </ul>

            <div class="note">
                <p><strong>Dica:</strong> Para melhor qualidade, use um modelo focado em tradução, como TranslateGemma, na biblioteca de modelos.</p>
            </div>
        `,
                image: "Translate-1.png",
                imageAlt: "Visão geral da aba Traduzir",
                imageCaption: "A interface da aba Traduzir com a área de arrastar e soltar",
            },
            {
                id: "translate-preview",
                title: "Janela flutuante de visualização",
                content: `
            <p>Após carregar um documento, a aba Traduzir abre uma janela flutuante para você inspecionar e refinar os resultados.</p>

            <h4>Controles da janela</h4>
            <ul>
                <li><strong>Maximizar/restaurar</strong> - alterna entre espaço compacto e expandido</li>
                <li><strong>Fechar/reabrir</strong> - feche a visualização e use <em>Abrir janela de visualização</em> para reabrir</li>
            </ul>

            <h4>Comportamento em PDF</h4>
            <ul>
                <li>Blocos de texto são mapeados sobre as páginas do PDF e podem ser editados diretamente.</li>
                <li>Atualizações de tradução por streaming são aplicadas progressivamente aos blocos correspondentes.</li>
                <li>Você pode revisar e ajustar o texto traduzido antes de exportar.</li>
            </ul>

            <h4>Comportamento em TXT / MD</h4>
            <ul>
                <li>A visualização usa layout em estilo documento para facilitar a leitura.</li>
                <li>Substituições em streaming atualizam o conteúdo progressivamente (não apenas no final).</li>
                <li>Quebras de linha e estrutura do documento são preservadas sempre que possível.</li>
            </ul>
        `,
                image: "Translate-2.png",
                imageAlt: "Visão geral da janela Traduzir",
                imageCaption: "A janela Traduzir mostrando controles e um PDF carregado",
            },
            {
                id: "translate-export-troubleshooting",
                title: "Exportação e solução de problemas",
                content: `
            <p>Use o controle de exportação após revisar para salvar seu resultado traduzido.</p>

            <h4>Saída da exportação</h4>
            <ul>
                <li><strong>Entrada PDF</strong> - exportação em PDF traduzido</li>
                <li><strong>Entrada TXT</strong> - exportado como <code>-translated.txt</code></li>
                <li><strong>Entrada MD</strong> - exportado como <code>-translated.md</code></li>
            </ul>

            <h4>Problemas comuns</h4>
            <ul>
                <li><strong>Sem texto extraível no PDF</strong> - PDFs digitalizados/somente imagem podem não fornecer blocos editáveis.</li>
                <li><strong>Qualidade insatisfatória</strong> - refine a instrução ou troque para um modelo melhor de tradução.</li>
                <li><strong>Fluxo de contexto</strong> - após mudanças de tradução, fechar a visualização pode acionar o fluxo de continuar conversa no Chat.</li>
            </ul>

            <div class="note">
                <p><strong>Nota:</strong> A tradução nesta aba é orientada a documentos. Adicione requisitos explícitos de tom/estilo no campo de instrução quando necessário.</p>
            </div>
        `,
            },
        ],
    },
    models: {
        title: "Modelos",
        intro:
            "A aba Modelos permite navegar, baixar e gerenciar modelos de IA do Ollama usados pelo Paiperwork com controle local completo.",
        articles: [
            {
                id: "models-intro",
                title: "Introdução aos Modelos",
                content: `
                <p>A aba Modelos fornece uma interface central para gerenciar os modelos de IA que alimentam sua experiência no Paiperwork.</p>
                
                <p>As principais funcionalidades da aba Modelos incluem:</p>
                <ul>
                    <li>Navegar pelos modelos disponíveis na biblioteca Ollama</li>
                    <li>Baixar novos modelos para seu sistema local</li>
                    <li>Gerenciar seus modelos instalados</li>
                    <li>Configurar parâmetros dos modelos para desempenho otimizado</li>
                    <li>Excluir modelos que você não precisa mais</li>
                </ul>
                
                <p>Todos os modelos executam localmente em seu dispositivo através do Ollama, garantindo que seus dados permaneçam privados e seguros enquanto ainda se beneficia de capacidades poderosas de IA.</p>
                
                <h4>Modelos de Raciocínio</h4>
                <p>Alguns modelos especializados têm capacidades de raciocínio aprimoradas que podem ser ativadas com prompts de sistema específicos:</p>
                <ul>
                    <li><strong>Cogito</strong> e outros modelos focados em raciocínio podem exigir um prompt de sistema especial para ativar suas capacidades completas</li>
                    <li>Para modelos Cogito, adicione <code>"Enable deep thinking subroutine."</code> (sem aspas) ao seu prompt de sistema</li>
                    <li>Isso ativa funcionalidades avançadas de raciocínio, permitindo pensamento mais estruturado e passo a passo</li>
                    <li>Diferentes modelos de raciocínio podem ter diferentes frases de ativação - verifique a documentação do modelo para detalhes</li>
                </ul>
                
                <div class="note">
                    <p><strong>Nota:</strong> Os modelos no Paiperwork são alimentados pelo Ollama, que deve estar instalado e executando em seu sistema. A disponibilidade dos modelos depende de sua instalação local do Ollama.</p>
                </div>
            `,
                image: "models_intro.png",
                imageAlt: "Visão Geral da Aba Modelos",
                imageCaption:
                    "A interface da aba Modelos mostrando as seções de modelos disponíveis e locais",
            },
            {
                id: "models-browsing",
                title: "Navegando pelos Modelos Disponíveis",
                content: `
                <p>O Paiperwork permite navegar por toda a biblioteca de modelos Ollama diretamente da interface da aplicação.</p>
                
                <h4>Buscando Modelos Disponíveis</h4>
                <ol>
                    <li>Navegue para a aba Modelos</li>
                    <li>Clique no botão "Buscar Modelos Ollama" no topo da tela</li>
                    <li>Aguarde enquanto o Paiperwork conecta à biblioteca Ollama</li>
                    <li>Uma vez completo, uma mensagem de status confirmará quantos modelos foram encontrados</li>
                </ol>
                
                <h4>Explorando Opções de Modelos</h4>
                <p>Após buscar os modelos, você pode:</p>
                <ul>
                    <li>Navegar pelos modelos usando o seletor dropdown</li>
                    <li>Ver descrições dos modelos que explicam suas capacidades</li>
                    <li>Ver informações de popularidade dos modelos (número de downloads)</li>
                </ul>
                
                <h4>Tipos de Modelos</h4>
                <p>A biblioteca Ollama inclui modelos com diferentes especializações:</p>
                <ul>
                    <li><strong>Propósito geral</strong> - Modelos como Gemma3, Llama, Qwen2.5 e Mistral para tarefas cotidianas</li>
                    <li><strong>Especializados em código</strong> - Modelos como Qwen2.5 coder, CodeLlama e WizardCoder otimizados para programação</li>
                    <li><strong>Capazes de visão</strong> - Modelos como Mistral3.1 e Gemma3 que podem analisar imagens</li>
                    <li><strong>Ajustados</strong> - Modelos treinados para casos de uso específicos ou com características particulares</li>
                </ul>
                
                <div class="note">
                    <p><strong>Dica:</strong> Leia as descrições dos modelos cuidadosamente para entender as forças e capacidades de cada modelo antes de baixar.</p>
                </div>
            `,
                image: "models_browsing.png",
                imageAlt: "Navegando pelos Modelos Disponíveis",
                imageCaption:
                    "O dropdown de seleção de modelo exibindo modelos disponíveis da biblioteca Ollama",
            },
            {
                id: "models-downloading",
                title: "Baixando Modelos",
                content: `
                    <p>Uma vez identificado um modelo que você quer usar, você pode baixá-lo diretamente para seu sistema local.</p>
                    
                    <h4>Selecionando um Tamanho de Modelo</h4>
                    <ol>
                        <li>Selecione um modelo da lista dropdown</li>
                        <li>Revise a descrição do modelo</li>
                        <li>Quando você escolher um modelo, as opções de tamanho aparecerão automaticamente</li>
                        <li>Selecione a versão de tamanho apropriada que corresponda às suas necessidades e capacidades do sistema</li>
                    </ol>
                    
                    <h4>Entendendo Tamanhos de Modelos</h4>
                    <p>A maioria dos modelos estão disponíveis em múltiplas variantes de tamanho:</p>
                    <ul>
                        <li><strong>Tamanhos maiores</strong> (7B, 13B, 34B parâmetros) - Estes modelos maiores fornecem melhor qualidade mas requerem mais VRAM (memória da placa de vídeo, excedendo o tamanho do modelo devido à inclusão do contexto, note que a resolução da tela afetará o uso de memória), RAM (mesmo que com VRAM, note que seu sistema operacional também usa RAM, então nem toda estará disponível para uso do modelo IA+contexto), e poder de processamento (quanto mais rápida a CPU, melhor).</li>
                        <li><strong>Tamanhos menores</strong> (3B, 1.5B parâmetros) - Mais eficientes mas podem ter capacidades reduzidas</li>
                        <li><strong>Versões quantizadas</strong> (Q4_K_M, Q5_K_S) - Modelos comprimidos que usam menos memória mantendo a qualidade</li>
                    </ul>
                    
                    <h4>Exemplo de Requisitos de VRAM</h4>
                    <p>Para dar uma ideia dos requisitos de hardware para executar modelos com uma janela de contexto de 8K:</p>
                    <ul>
                        <li><strong>Modelos pequenos (3B)</strong>: ~4-6GB VRAM com quantização (Q4/Q5)</li>
                        <li><strong>Modelos médios (7B)</strong>: ~8-10GB VRAM com quantização (Q4/Q5)</li>
                        <li><strong>Modelos grandes (13B)</strong>: ~14-16GB VRAM com quantização (Q4/Q5)</li>
                        <li><strong>Modelos muito grandes (34B+)</strong>: 24GB+ VRAM com quantização (Q4/Q5)</li>
                    </ul>
                    <p>Estes requisitos podem variar baseados em modelos específicos e configurações do sistema. Considere começar com modelos menores ou mais fortemente quantizados se você tem VRAM limitada.</p>
                    
                    <h4>Iniciando o Download</h4>
                    <ol>
                        <li>Clique no botão "Baixar Modelo"</li>
                        <li>O botão mostrará informações do progresso do download</li>
                        <li>Uma mensagem de status abaixo mostrará a operação atual (baixando, processando)</li>
                        <li>Um botão de cancelar aparecerá permitindo parar o download se necessário</li>
                    </ol>
                    
                    <h4>Processo de Download</h4>
                    <p>Durante o download, você verá:</p>
                    <ul>
                        <li>Informações de progresso mostrando tamanho baixado e tamanho total</li>
                        <li>Atualizações de status para diferentes estágios (puxando manifesto, baixando arquivos, verificando)</li>
                        <li>O seletor de modelo, seletor de tamanho e botão "Buscar Modelos Ollama" serão desabilitados durante o download</li>
                        <li>Confirmação quando o download estiver completo</li>
                    </ul>
                    
                    <h4>Cancelando Downloads</h4>
                    <p>Se você precisar cancelar um download em progresso:</p>
                    <ul>
                        <li>Clique no botão "Cancelar Download" que aparece abaixo do botão de download (Se você quiser resumir, clique no botão de download novamente)</li>
                        <li>Confirme o cancelamento quando solicitado</li>
                        <li>Após o cancelamento, uma mensagem aparecerá recomendando reiniciar o Ollama para limpar arquivos parcialmente baixados</li>
                        <li>Esta mensagem desaparecerá automaticamente após 30 segundos</li>
                        <li>O seletor de modelo, seletor de tamanho e botão "Buscar Modelos Ollama" serão reabilitados</li>
                    </ul>
                    
                    <h4>Alternando Entre Abas</h4>
                    <p>Se você alternar para outra aba durante um download:</p>
                    <ul>
                        <li>O download continuará em segundo plano</li>
                        <li>Quando você retornar à aba Modelos, o status atual do download será mostrado</li>
                        <li>A interface mostrará qual arquivo está sendo baixado atualmente e o progresso geral</li>
                    </ul>
                    
                    <div class="note">
                        <p><strong>Importante:</strong> Downloads de modelos podem ser grandes (de centenas de MB a centenas de GB). Certifique-se de ter espaço em disco suficiente e uma conexão estável de internet antes de iniciar um download. Se você precisar buscar novos modelos enquanto um download está em progresso, você deve cancelar o download atual primeiro.</p>
                    </div>
                `,
                image: "models_downloading.png",
                imageAlt: "Baixando Modelos",
                imageCaption: "A interface de download de modelos mostrando progresso do download e seleção de tamanho",
            },
            {
                id: "models-managing",
                title: "Gerenciando Modelos Locais",
                content: `
                <p>Após baixar modelos, você pode gerenciá-los através da seção Modelos Locais da aba Modelos.</p>
                
                <h4>Visualizando Modelos Instalados</h4>
                <p>A seção Modelos Locais mostra todos os modelos atualmente instalados em seu sistema:</p>
                <ul>
                    <li>Modelos são listados em um seletor dropdown</li>
                    <li>Selecione um modelo para acessar opções de gerenciamento</li>
                    <li>O modelo mais recentemente baixado é automaticamente selecionado</li>
                </ul>
                
                <h4>Excluindo Modelos</h4>
                <p>Para remover modelos que você não precisa mais:</p>
                <ol>
                    <li>Selecione o modelo do dropdown Modelos Locais</li>
                    <li>Clique no botão "Excluir"</li>
                    <li>Confirme a exclusão quando solicitado</li>
                    <li>Aguarde o processo ser completado</li>
                </ol>
                <p>Excluir modelos não utilizados ajuda a liberar espaço em disco em seu sistema.</p>
                
                <div class="note">
                    <p><strong>Nota:</strong> Se você excluir um modelo que está sendo usado atualmente em uma conversa, você precisará selecionar um novo modelo para continuar conversando.</p>
                </div>
            `,
                image: "models_managing.png",
                imageAlt: "Gerenciando Modelos Locais",
                imageCaption:
                    "A seção modelos locais mostrando opções de gerenciamento de modelos",
            },
            {
                id: "models-configuration",
                title: "Configurando Parâmetros dos Modelos",
                content: `
                <p>Ajuste fino de como os modelos respondem ao ajustar seus parâmetros no arquivo modelparameters.js.</p>
                
                <h4>Configuração de Parâmetros</h4>
                <p>Parâmetros dos modelos são agora configurados diretamente no arquivo <code>modelparameters.js</code>:</p>
                <ul>
                    <li>Abra o arquivo <code>modelparameters.js</code> em seu editor de código</li>
                    <li>Adicione seu modelo ao objeto <code>MODEL_PARAMETERS</code> ou modifique entradas existentes</li>
                    <li>Salve o arquivo e reinicie a aplicação para aplicar mudanças</li>
                </ul>
                
                <h4>Exemplo para Adicionar um Novo Modelo</h4>
                <pre><code>// Adicionar ao objeto MODEL_PARAMETERS em modelparameters.js
                'nome-do-seu-modelo': {
                    temperature: 0.7,
                    top_k: 50,
                    top_p: 0.9,
                    min_p: 0.05,
                    repeat_penalty: 1.1
                }</code></pre>
                
                <h4>Parâmetros Disponíveis</h4>
                <p>Os seguintes parâmetros podem ser ajustados para a maioria dos modelos:</p>
                <ul>
                    <li><strong>Temperature</strong> (0.0-2.0) - Controla aleatoriedade nas respostas. Valores mais altos produzem saídas mais diversas e criativas, enquanto valores mais baixos tornam as respostas mais focadas e determinísticas.</li>
                    <li><strong>Top P</strong> (0.0-1.0) - Controla diversidade limitando a seleção de tokens a um limiar de probabilidade cumulativa. Valores mais baixos criam respostas mais focadas.</li>
                    <li><strong>Top K</strong> (1-100+) - Restringe a seleção de tokens aos K tokens mais prováveis. Valores mais baixos criam respostas mais previsíveis.</li>
                    <li><strong>Min P</strong> (0.0-1.0) - Define um limiar mínimo de probabilidade para seleção de tokens. Valores mais altos forçam o modelo a ser mais decisivo.</li>
                    <li><strong>Repeat Penalty</strong> (1.0-2.0) - Desencoraja repetição penalizando tokens usados anteriormente. Valores mais altos reduzem repetição mais agressivamente.</li>
                </ul>
                
                <h4>Recomendações de Parâmetros</h4>
                <p>Diferentes tarefas se beneficiam de diferentes configurações de parâmetros:</p>
                <ul>
                    <li><strong>Escrita criativa</strong> - Temperature mais alta (0.7-1.0), top_p mais alto (0.9)</li>
                    <li><strong>Respostas factuais</strong> - Temperature mais baixa (0.1-0.3), top_k baixo (40)</li>
                    <li><strong>Geração de código</strong> - Temperature mais baixa (0.1-0.4), repeat_penalty mais alto (1.1)</li>
                </ul>
                
                <div class="note">
                    <p><strong>Importante:</strong> Após salvar as alterações no editor de modelos, a configuração carregada é atualizada automaticamente.</p>
                </div>
                `,
                image: "models_configuration.png",
                imageAlt: "Interface de Configuração de Modelos",
                imageCaption: "Exemplo do arquivo modelparameters.js com configuração personalizada",
            },
            {
                id: "models-troubleshooting",
                title: "Solucionando Problemas com Modelos",
                content: `
                    <p>Se você encontrar problemas com modelos no Paiperwork, aqui estão alguns problemas comuns e soluções:</p>
                    
                    <h4>Falhas na Busca de Modelos</h4>
                    <p>Se você não consegue buscar modelos da biblioteca Ollama:</p>
                    <ul>
                        <li>Verifique se o Ollama está executando em seu sistema</li>
                        <li>Verifique sua conexão com a internet</li>
                        <li>Reinicie o Ollama e tente novamente</li>
                        <li>Certifique-se de estar usando uma versão compatível do Ollama (atualmente: 0.6.6)</li>
                    </ul>
                    
                    <h4>Problemas de Download</h4>
                    <p>Se downloads de modelos falharem ou travarem:</p>
                    <ul>
                        <li>Verifique a estabilidade de sua conexão com a internet</li>
                        <li>Certifique-se de ter espaço em disco suficiente</li>
                        <li>Tente cancelar e reiniciar o download</li>
                        <li>Reinicie o Ollama após cancelar para limpar arquivos incompletos</li>
                        <li>Tente baixar um tamanho de modelo menor primeiro</li>
                    </ul>
                    
                    <h4>Limpeza de Download Incompleto</h4>
                    <p>Se você cancelou um download e precisa limpar arquivos:</p>
                    <ul>
                        <li>Reinicie o serviço Ollama em seu sistema</li>
                        <li>Isso permite ao Ollama limpar quaisquer arquivos de modelo parcialmente baixados</li>
                        <li>Após reiniciar, você pode tentar um novo download</li>
                    </ul>
                    
                    <h4>Problemas de Elementos da Interface</h4>
                    <p>Se elementos da interface na aba Modelos parecem travados ou desabilitados:</p>
                    <ul>
                        <li>Se seletores permanecem desabilitados após um download completar ou ser cancelado, atualize a página</li>
                        <li>Se o botão "Buscar Modelos Ollama" está desabilitado sem um download ativo, atualize a página</li>
                        <li>Após múltiplos erros de download, o sistema eventualmente reabilitará todos os controles automaticamente</li>
                    </ul>
                    
                    <h4>Problemas de Performance de Modelos</h4>
                    <p>Se um modelo está executando lentamente ou travando:</p>
                    <ul>
                        <li>Verifique seus recursos do sistema (uso de VRAM, RAM e CPU)</li>
                        <li>Tente um modelo menor ou versão quantizada</li>
                        <li>Feche outras aplicações que consomem muitos recursos</li>
                        <li>Ajuste o tamanho do contexto na aba Chat para um valor menor</li>
                    </ul>
                    
                    <h4>Modelo Não Aparecendo no Chat</h4>
                    <p>Se um modelo baixado não está aparecendo no dropdown de seleção de modelos no Chat:</p>
                    <ul>
                        <li>Verifique se o download do modelo foi completado com sucesso</li>
                        <li>Atualize a aba Chat ou reinicie a aplicação</li>
                        <li>Verifique se o modelo requer funcionalidades ou configurações específicas</li>
                    </ul>
                    
                    <div class="note">
                        <p><strong>Nota:</strong> Se os problemas persistirem, verifique a documentação do Ollama ou procure por logs do Ollama em seu sistema para informações mais detalhadas sobre erros.</p>
                    </div>
                `,
            }
        ],
    },
    database: {
        title: "Base de Dados",
        intro: "A aba Base de Dados fornece ferramentas para monitorizar e manter a sua base de dados local, garantindo desempenho ótimo e integridade dos dados enquanto preserva completa privacidade.",
        articles: [
            {
                id: "database-intro",
                title: "Introdução à Gestão de Base de Dados",
                content: `
                <p>A aba Base de Dados dá-lhe visibilidade e controlo sobre o sistema de base de dados local do Paiperwork que armazena todas as suas conversas, documentos e dados da aplicação.</p>
                
                <p>As funcionalidades principais da aba Base de Dados incluem:</p>
                <ul>
                    <li>Estatísticas em tempo real sobre o tamanho e conteúdos da base de dados</li>
                    <li>Ferramentas para identificar e limpar dados órfãos</li>
                    <li>Capacidades de otimização da base de dados</li>
                    <li>Informações sobre o seu método de armazenamento e segurança</li>
                </ul>
                
                <p>Todos os dados no Paiperwork são armazenados localmente numa base de dados SQLite dentro do armazenamento do seu navegador. Esta base de dados está totalmente encriptada usando a sua Chave Mestra, garantindo privacidade e segurança completas.</p>
                
                <div class="note">
                    <p><strong>Importante:</strong> Ao contrário das aplicações baseadas na nuvem, a base de dados do Paiperwork requer manutenção ocasional para garantir desempenho ótimo. A aba Base de Dados fornece as ferramentas necessárias para esta manutenção.</p>
                </div>
            `,
                image: "database_overview.png",
                imageAlt: "Visão Geral da Aba Base de Dados",
                imageCaption: "A aba Base de Dados mostrando estatísticas e ferramentas de gestão"
            },
            {
                id: "database-stats",
                title: "Compreender as Estatísticas da Base de Dados",
                content: `
                <p>O painel de Estatísticas da Base de Dados fornece informações importantes sobre a sua base de dados local:</p>
                
                <h4>Estatísticas Principais</h4>
                <ul>
                    <li><strong>Tamanho da Base de Dados</strong> - Espaço total em disco usado pela sua base de dados</li>
                    <li><strong>Documentos</strong> - Número de documentos armazenados na sua base de dados</li>
                    <li><strong>Total de Fragmentos</strong> - Segmentos de texto usados para pesquisa e recuperação de documentos</li>
                    <li><strong>Saúde da Base de Dados</strong> - Indicador de estado para integridade da base de dados</li>
                </ul>
                
                <h4>Indicadores de Saúde</h4>
                <p>O indicador de Saúde da Base de Dados pode mostrar:</p>
                <ul>
                    <li><strong>Saudável</strong> - Marca verde indica que a sua base de dados está otimizada e não tem dados órfãos</li>
                    <li><strong>Fragmentos Órfãos</strong> - Aviso amarelo aparece quando fragmentos órfãos são detetados, mostrando quantos fragmentos estão órfãos</li>
                </ul>
                
                <h4>Método de Armazenamento</h4>
                <p>A secção "Sobre a Sua Base de Dados" mostra o seu método de armazenamento atual:</p>
                <ul>
                    <li><strong>OPFS (Origin Private File System)</strong> - Armazenamento moderno e de alto desempenho disponível em navegadores mais recentes</li>
                    <li><strong>IndexedDB</strong> - Método de armazenamento alternativo para navegadores sem suporte OPFS</li>
                </ul>
                
                <h4>Atualizar Estatísticas</h4>
                <p>Para obter a informação mais atualizada:</p>
                <ol>
                    <li>Clique no botão "Atualizar Estatísticas"</li>
                    <li>Aguarde que o sistema analise a sua base de dados</li>
                    <li>Reveja as estatísticas atualizadas</li>
                </ol>
                
                <div class="note">
                    <p><strong>Nota:</strong> As estatísticas da base de dados são automaticamente carregadas quando abre a aba Base de Dados pela primeira vez e quando regressa a ela após usar outras abas.</p>
                </div>
            `,
            },
            {
                id: "database-orphaned",
                title: "Gerir Dados Órfãos",
                content: `
                <p>Quando elimina documentos ou conversas, por vezes pequenos pedaços de dados podem tornar-se "órfãos" - desconectados do seu conteúdo pai mas ainda ocupando espaço na sua base de dados.</p>
                
                <h4>O que são Fragmentos Órfãos?</h4>
                <p>Fragmentos órfãos são segmentos de texto que outrora fizeram parte de um documento ou conversa mas já não estão associados a qualquer conteúdo existente. Ocorrem quando:</p>
                <ul>
                    <li>Os documentos são eliminados sem limpar adequadamente todos os fragmentos associados</li>
                    <li>Interrupções de operação ocorrem durante a eliminação de documentos</li>
                    <li>Erros do sistema impedem limpeza completa durante operações normais</li>
                </ul>
                
                <h4>Identificar Dados Órfãos</h4>
                <p>A aba Base de Dados deteta automaticamente fragmentos órfãos e alerta-o com:</p>
                <ul>
                    <li>Um indicador de aviso amarelo na secção Saúde da Base de Dados</li>
                </ul>
                
                <h4>Limpar Dados Órfãos</h4>
                <ol>
                    <li>Quando fragmentos órfãos são detetados, clique no botão "Limpar base de dados"</li>
                    <li>O sistema identificará e removerá todos os fragmentos órfãos</li>
                    <li>Uma mensagem de sucesso aparecerá mostrando quantos fragmentos foram removidos e quanto espaço foi recuperado</li>
                    <li>As estatísticas da base de dados atualizarão automaticamente para mostrar o estado melhorado</li>
                </ol>
                
                <div class="note">
                    <p><strong>Importante:</strong> Limpar dados órfãos apenas remove fragmentos desnecessários - não afeta nenhum dos seus documentos, conversas ou informações armazenadas reais.</p>
                </div>
            `,
                image: "database_orphaned.png",
                imageAlt: "Limpeza de Dados Órfãos",
                imageCaption: "A mensagem de base de dados limpa"
            },
            {
                id: "database-optimize",
                title: "Otimizar o Desempenho da Base de Dados",
                content: `
                <p>Com o tempo, à medida que adiciona e elimina conteúdo, a sua base de dados pode tornar-se fragmentada e usar mais espaço que o necessário. A aba Base de Dados fornece ferramentas para otimizar o desempenho e recuperar espaço não utilizado.</p>
                
                <h4>Quando Otimizar a Sua Base de Dados</h4>
                <p>Considere executar otimização da base de dados quando:</p>
                <ul>
                    <li>Eliminou documentos grandes ou muitas conversas</li>
                    <li>A aplicação parece mais lenta que o habitual</li>
                    <li>Nota que o tamanho da base de dados é maior que o esperado</li>
                    <li>Quer recuperar espaço em disco</li>
                </ul>
                
                <h4>Como o Tamanho da Base de Dados Muda</h4>
                <p>Compreender como funciona o tamanho da base de dados no SQLite:</p>
                <ul>
                    <li>Quando adiciona conteúdo, a base de dados cresce para o acomodar</li>
                    <li>Quando elimina conteúdo, o ficheiro da base de dados não encolhe automaticamente</li>
                    <li>O espaço eliminado é marcado como disponível para reutilização mas ainda conta no tamanho total do ficheiro</li>
                    <li>Apenas a otimização (VACUUM) realmente reduz o tamanho do ficheiro ao reconstruir a base de dados</li>
                </ul>
                
                <h4>Executar Otimização da Base de Dados</h4>
                <ol>
                    <li>Clique no botão "Limpar Base de Dados" na aba Base de Dados</li>
                    <li>Aguarde que o processo de otimização complete (isto pode demorar um momento para bases de dados maiores)</li>
                    <li>Aparecerá uma notificação mostrando quanto espaço foi recuperado</li>
                    <li>As estatísticas da base de dados atualizarão automaticamente</li>
                </ol>
                
                <h4>O que Faz a Otimização</h4>
                <ul>
                    <li>Reconstrói o ficheiro da base de dados para remover espaço não utilizado</li>
                    <li>Desfragmenta dados para armazenamento mais eficiente</li>
                    <li>Reorganiza índices para consultas mais rápidas</li>
                    <li>Encolhe o ficheiro da base de dados para o seu tamanho ótimo</li>
                </ul>
                
                <div class="note">
                    <p><strong>Dica:</strong> Torne hábito executar otimização da base de dados após eliminar documentos grandes ou múltiplas conversas para manter desempenho ótimo. Ao contrário de muitas aplicações na nuvem, aplicações de base de dados locais como o Paiperwork requerem manutenção ocasional para continuarem a funcionar suavemente.</p>
                </div>
            `,
            },
            {
                id: "database-backup",
                title: "Exportar e Importar Backups Completos da Base de Dados",
                content: `
                <p>A aba Base de Dados inclui dois botoes de backup para mover os seus dados entre navegadores ou dispositivos em seguranca:</p>
                <ul>
                    <li><strong>Exportar Base de Dados</strong> - Cria um ficheiro de backup completo chamado <code>Paiperwork-Backup.pwdb</code></li>
                    <li><strong>Importar Base de Dados</strong> - Restaura esse ficheiro no seu armazenamento local atual</li>
                <h4>Uso dos botões do banco de dados</h4>
                <p>Use os botões na parte superior da aba Base de Dados da seguinte forma:</p>
                <ol>
                    <li>Clique em "Exportar Base de Dados" para baixar um arquivo de backup completo.</li>
                    <li>Clique em "Importar Base de Dados" para selecionar um arquivo de backup e restaurá-lo. Isso substitui seu banco de dados local atual.</li>
                    <li>Clique em "Excluir todas as informações" para remover permanentemente todas as conversas, documentos e configurações armazenadas e retornar à tela de boas-vindas.</li>
                </ol>

                </ul>

                <h4>O que o backup inclui</h4>
                <p>O backup exportado inclui todos os papeis de base de dados do Paiperwork:</p>
                <ul>
                    <li><strong>Main</strong> - Conversas e configuracoes principais</li>
                    <li><strong>RAG</strong> - Fragmentos de documentos e dados de retrieval</li>
                    <li><strong>HTML</strong> - Conteudo HTML guardado de apresentacoes e artifacts</li>
                    <li><strong>Knowledge Base</strong> - Colecoes e entradas de conhecimento</li>
                </ul>

                <h4>Comportamento importante na importacao</h4>
                <ul>
                    <li>A importacao <strong>substitui</strong> as suas bases de dados locais atuais</li>
                    <li>A importacao <strong>nao faz merge</strong> com o conteudo local existente</li>
                    <li>Depois da importacao, o Paiperwork volta ao ecran de boas-vindas para voltar a inserir a Chave Mestra</li>
                </ul>

                <h4>Fluxo recomendado</h4>
                <ol>
                    <li>No navegador de origem, abra a aba Base de Dados e clique em "Exportar Base de Dados"</li>
                    <li>Copie o ficheiro <code>Paiperwork-Backup.pwdb</code> para o navegador ou dispositivo de destino</li>
                    <li>No navegador de destino, abra Base de Dados e clique em "Importar Base de Dados"</li>
                    <li>Confirme a substituicao e inicie sessao novamente com a sua Chave Mestra</li>
                </ol>

                <div class="note">
                    <p><strong>Nota:</strong> Importacoes legacy de um unico ficheiro <code>.db</code> continuam suportadas, mas restauram apenas a base principal. Use <code>Paiperwork-Backup.pwdb</code> para portabilidade completa.</p>
                </div>
            `,
            },
            {
                id: "database-maintenance",
                title: "Melhores Práticas de Manutenção da Base de Dados",
                content: `
                <p>A manutenção adequada da base de dados garante que o Paiperwork continue a funcionar suave e eficientemente. Siga estas melhores práticas para manter a sua base de dados saudável.</p>
                
                <h4>Cronograma de Manutenção Regular</h4>
                <p>Estabeleça um cronograma de manutenção de rotina:</p>
                <ul>
                    <li><strong>Semanal</strong> - Verifique estatísticas da base de dados e limpe dados órfãos se encontrados</li>
                    <li><strong>Mensal</strong> - Execute otimização da base de dados para recuperar espaço e melhorar o desempenho</li>
                    <li><strong>Após operações em massa</strong> - Otimize após eliminar múltiplos documentos ou conversas</li>
                </ul>
                
                <h4>Indicadores de Desempenho</h4>
                <p>Observe sinais de que a sua base de dados precisa de manutenção:</p>
                <ul>
                    <li>Tempos de resposta da aplicação mais lentos</li>
                    <li>Atrasos ao alternar entre abas</li>
                    <li>Tempos de carregamento mais longos para documentos ou conversas</li>
                    <li>Crescimento inesperado no tamanho da base de dados</li>
                </ul>
                
                <h4>Manutenção Preventiva</h4>
                <ul>
                    <li>Limpe regularmente documentos e conversas desnecessários</li>
                    <li>Execute otimização após eliminar quantidades significativas de dados</li>
                    <li>Verifique fragmentos órfãos periodicamente mesmo se nenhum aviso aparecer</li>
                    <li>Reinicie a aplicação ocasionalmente para permitir otimização do armazenamento do navegador</li>
                </ul>
                
                <h4>Compreender o Crescimento da Base de Dados</h4>
                <p>É normal que a sua base de dados cresça com o tempo à medida que:</p>
                <ul>
                    <li>Adiciona mais documentos para processamento RAG</li>
                    <li>Tem mais conversas com a IA</li>
                    <li>Cria entradas da base de conhecimento e coleções</li>
                    <li>Gera e guarda mais relatórios de pesquisa</li>
                </ul>
                <p>O que não é normal é quando a base de dados permanece grande após ter eliminado este conteúdo - é aí que a otimização é necessária.</p>
                
                <div class="note">
                    <p><strong>Importante:</strong> Ao contrário das aplicações na nuvem, aplicações de base de dados locais não têm processos de manutenção automática a correr em servidores. A aba Base de Dados dá-lhe as ferramentas para realizar esta manutenção você mesmo, mantendo a sua aplicação a funcionar suavemente.</p>
                </div>
            `,
            },
            {
                id: "database-troubleshooting",
                title: "Resolução de Problemas da Base de Dados",
                content: `
                <p>Se encontrar problemas com a base de dados ou notar questões de desempenho, aqui estão alguns passos de resolução de problemas:</p>
                
                <h4>Problemas Comuns e Soluções</h4>
                
                <h5>Desempenho Lento da Aplicação</h5>
                <ul>
                    <li><strong>Problema:</strong> O Paiperwork sente-se lento ou demora mais a responder</li>
                    <li><strong>Solução:</strong> Execute otimização da base de dados clicando no botão "Limpar Base de Dados"</li>
                    <li><strong>Prevenção:</strong> Agende otimização regular, especialmente após grandes eliminações</li>
                </ul>
                
                <h5>Tamanho Grande da Base de Dados</h5>
                <ul>
                    <li><strong>Problema:</strong> O tamanho da base de dados parece desproporcionalmente grande comparado ao seu conteúdo</li>
                    <li><strong>Solução 1:</strong> Verifique e limpe fragmentos órfãos</li>
                    <li><strong>Solução 2:</strong> Execute otimização da base de dados para recuperar espaço não utilizado</li>
                    <li><strong>Solução 3:</strong> Reveja e elimine documentos e conversas desnecessários</li>
                </ul>
                
                <h5>Conteúdo Em Falta Após Mudanças de Sessão</h5>
                <ul>
                    <li><strong>Problema:</strong> O conteúdo parece estar em falta ao mudar Chaves Mestras</li>
                    <li><strong>Solução:</strong> Verifique que está a usar a Chave Mestra correta para esse conteúdo</li>
                    <li><strong>Explicação:</strong> Diferentes Chaves Mestras criam áreas de armazenamento seguras separadas</li>
                </ul>
                
                <h5>Estatísticas Não Atualizam</h5>
                <ul>
                    <li><strong>Problema:</strong> As estatísticas da base de dados não parecem refletir mudanças recentes</li>
                    <li><strong>Solução:</strong> Clique no botão "Atualizar Estatísticas" para atualizar manualmente</li>
                    <li><strong>Explicação:</strong> Algumas estatísticas estão em cache e precisam de atualização manual</li>
                </ul>
                
                <h5>Fragmentos Órfãos Persistentes</h5>
                <ul>
                    <li><strong>Problema:</strong> Fragmentos órfãos reaparecem após limpeza</li>
                    <li><strong>Solução 1:</strong> Tente executar o processo de limpeza novamente</li>
                    <li><strong>Solução 2:</strong> Atualize o navegador e tente limpar novamente</li>
                    <li><strong>Solução 3:</strong> Execute otimização da base de dados após limpeza</li>
                </ul>

                <h4>Último Recurso: Reset da Base de Dados</h4>
                <p>Se problemas persistentes ocorrem e a manutenção normal não ajuda:</p>
                                <ol>
                    <li>Exporte primeiro quaisquer conversas ou documentos importantes</li>
                    <li>Clique em "Eliminar Toda a Informação" para eliminar a base de dados</li>
                    <li>Isto removerá todos os dados e criará uma base de dados nova, agora você pode tentar importar a sua base de dados salva</li>
                </ol>
                <p>você pode usar esta função para excluir com segurança todas as suas informações do navegador se precisar</p>
                
                <div class="note">
                    <p><strong>Aviso:</strong> O reset da base de dados é irreversível e eliminará todos os seus dados. Exporte sempre informação importante primeiro.</p>
                </div>
            `,
            }
        ],
    },

    connectors: {
        title: "Conectores",
        intro: [
            "Nota: a versão online do Paiperwork alojada no Huggingface não inclui a funcionalidade de WhatsApp ou WeChat por motivos de segurança e privacidade dos utilizadores.",
            "Idiomas suportados pelo orquestrador do WhatsApp/WeChat: inglês, espanhol, português, alemão, chinês, francês, japonês, coreano e russo.",
            "Os conectores ligam o Paiperwork ao WhatsApp/WeChat. Os pedidos usam apenas recursos já disponíveis dentro do Paiperwork e não acedem ao sistema operativo, memória, disco rígido nem a ficheiros externos arbitrários.",
            "Para receber mensagens de WhatsApp/WeChat, mantenha ativa a aba do navegador onde o Paiperwork está a correr e evite que o computador entre em suspensão. A tela de bloqueio interromperá as mensagens recebidas; você pode considerar desativá-la temporariamente para ativar os recursos do WhatsApp/WeChat.",
            "Documentos, pesquisas, apresentações e artefatos podem abrir um modo de seguimento dedicado. Permaneça nesse modo até o fechar com a frase de saída correspondente.",
            "Pode criar apresentações e mini apps a partir de resumos de documentos e das suas modificações de seguimento, relatórios de pesquisa e das suas modificações de seguimento, e entradas da base de conhecimento e das suas modificações de seguimento."
        ],
        articles: [
            {
                id: "connectors-pairing",
                title: "Emparelhamento e Modos",
                content: `
                <p>WhatsApp: Abra a aba Conectores e escolha primeiro um modo antes de iniciar o servidor.</p>
                <ol>
                    <li><strong>Modo pessoal:</strong> liga a sua própria conta de WhatsApp e fala consigo mesmo num fluxo privado.</li>
                    <li><strong>Modo bot:</strong> pessoas que o têm na lista de contactos do WhatsApp podem falar com a instância emparelhada do Paiperwork. Use um número separado, a menos que queira explicitamente este comportamento na sua conta principal.<br><strong>2.1.</strong> Pode melhorar a experiência de uso ao interagir com o bot modificando o System Prompt na aba Chat.<br><strong>2.2.</strong> Qualquer utilizador de WhatsApp na sua lista de contactos poderá aceder às funções do conector ativadas e aos documentos armazenados disponíveis através do conector.<br><strong>2.3.</strong> Não pode iniciar mensagens do Paiperwork para utilizadores de WhatsApp, para evitar abusos e spam.<br><strong>2.4.</strong> Se fechar o servidor em modo bot, as mensagens pendentes dos utilizadores ficam em fila até ao próximo arranque do servidor e depois são processadas uma a uma. Se quiser ignorar essas mensagens, inicie o servidor em modo pessoal; todas as mensagens recebidas serão ignoradas, exceto as que enviar para si mesmo.</li>
                </ol>
                <p>Clique em <strong>Start server</strong> e leia o código QR na primeira vez que emparelhar. Pode parar o servidor a qualquer momento, o que interrompe o encaminhamento de mensagens nos dois sentidos.</p>
                <p>WeChat: Para emparelhar o bot WeChat, clique no botão Start server, escaneie o código QR e siga as instruções na aplicação WeChat do seu telefone. Inícios subsequentes do servidor manterão as mesmas informações de emparelhamento, a menos que elimine o dispositivo emparelhado.</p>
                <h4>Limpar Contextos do WhatsApp/WeChat</h4>
                <p>Se as respostas do WhatsApp/WeChat começarem a ficar pesadas após muito uso, pode limpar apenas as conversas de WhatsApp/WeChat armazenadas por telefone na base de dados sem apagar o resto da sua base de dados; as conversas relacionadas com o Paiperwork não serão apagadas.</p>
                <ol>
                    <li>Clique em "Limpar Contextos do WhatsApp/WeChat" na aba Conectores</li>
                    <li>Isto remove a memória de contexto do WhatsApp/WeChat armazenada por telefone e reinicia o contexto ativo do WhatsApp/WeChat em execução</li>
                    <li>As informações dos dispositivos emparelhados são preservadas e continuam a poder ser geridas com "Delete paired device(s)"</li>
                </ol>
                <p>Se quiser remover totalmente a ligação do Paiperwork, faça isso no seu telefone em WhatsApp/WeChat, em <strong>Linked devices</strong>.</p>
            `,
            },
            {
                id: "connectors-models-chat",
                title: "Seleção de Modelo e Chat",
                content: `
                <p>Depois de ligado, o WhatsApp usa o modelo atualmente selecionado na aba Chat.</p>
                <p>Pode verificar qual modelo de IA está ativo e mudá-lo diretamente a partir da sua conversa no WhatsApp.</p>
                <p>Para entrar primeiro no modo de controlo de modelos, envie <code>modo modelos</code> ou <code>modo modelo</code>.</p>
                <h4>Comandos úteis de modelo</h4>
                <ul>
                    <li><code>qual modelo está selecionado</code></li>
                    <li><code>mostra meus modelos</code></li>
                    <li><code>mudar o modelo atual para &lt;nome do modelo&gt;</code></li>
                    <li><code>usa &lt;nome do modelo&gt;</code></li>
                </ul>
                <p>Se não quiser permitir mudanças de modelo pelo WhatsApp, ative <strong>Lock AI model</strong> na aba Conectores.</p>
                <p>No chat, pode falar com o seu modelo de IA como de costume pelo WhatsApp. Quando precisar de resultados web em tempo real, mude para o <strong>modo Internet</strong>. Se uma resposta contiver HTML, o Paiperwork devolve-a como ficheiro HTML clicável para pré-visualização ou download.</p>
                <h4>Exemplos de uso no chat</h4>
                <ul>
                    <li><code>olá</code></li>
                    <li><code>explica a diferença entre OLED e Mini LED</code></li>
                </ul>
            `,
            },
            {
                id: "connectors-workflows",
                title: "Documentos, Gráficos, Pesquisa, Apresentações e Artefatos",
                content: `
                <p>Os fluxos do conector ficam no chat normal até entrar explicitamente num modo. Use as palavras-chave abaixo em cada secção.</p>
                <h4>Internet</h4>
                <p>Use o modo Internet quando quiser que as respostas normais do chat sejam apoiadas por pesquisa web em tempo real, em vez de o modelo responder apenas com conhecimento local.</p>
                <p>Entre neste modo com <code>modo internet</code>, <code>modo web</code>, <code>modo pesquisa web</code> ou <code>modo online</code>.</p>
                <ul>
                    <li><code>Quais são as últimas notícias sobre a guerra entre o Irão e os Estados Unidos?</code></li>
                    <li><code>Como está o tempo hoje na minha localização?</code></li>
                    <li><code>Pesquisa na internet o tempo de hoje em Guangzhou</code></li>
                </ul>

                <h4>Documentos</h4>
                <p>Pode fazer perguntas sobre um documento importado ou pedir um resumo. Os nomes dos documentos não precisam de ser exatos.</p>
                <p>Entre neste modo com <code>modo documento</code> ou <code>modo documentos</code>.</p>
                <p>Esta funcionalidade exige que tenha um modelo de embeddings local instalado e selecionado na aba Documentos.</p>
                <ul>
                    <li><code>mostrar documentos</code></li>
                    <li><code>quero ver um documento mas não lembro o nome</code></li>
                    <li><code>quero fazer uma pergunta a um documento</code></li>
                    <li><code>resumir &lt;nome do documento&gt;</code></li>
                    <li><code>&lt;nome do documento&gt; explicar</code></li>
                    <li><code>&lt;nome do documento&gt; resumo e criar uma apresentação</code></li>
                    <li><code>&lt;nome do documento&gt; resumo e criar uma mini app</code></li>
                </ul>
                <p>Para sair do modo de seguimento de documentos, use <code>sair do modo documento</code> ou <code>já terminei</code>.</p>
                <h5>Interações</h5>
                <p><strong>Utilizador:</strong> <code>&lt;nome do documento&gt; resumo</code></p>
                <p><strong>Paiperwork:</strong> Resumo do documento fornecido.</p>
                <p><strong>Paiperwork:</strong> Quer continuar a trabalhar com este documento?</p>
                <p><strong>Utilizador:</strong> <code>Sim, criar uma apresentação</code></p>
                <p><strong>Paiperwork:</strong> A criar uma apresentação promptable do SlideForge...</p>
                <p><strong>Paiperwork:</strong> Apresentação criada e enviada como ficheiro HTML.</p>
                <p><strong>Paiperwork:</strong> Quer fazer mais alterações nesta apresentação?</p>
                <p><strong>Utilizador:</strong> <code>Não</code></p>
                <p><strong>Paiperwork:</strong> Certo, o modo de seguimento da apresentação foi fechado.</p>

                <h5>Transformações de seguimento para resumos e respostas</h5>
                <p>Depois de o Paiperwork enviar um resumo de documento ou responder a uma pergunta no modo documento, pode pedir-lhe para transformar o resultado em memória em vez de voltar a executar o fluxo do documento.</p>
                <ul>
                    <li><code>Traduz o resumo para chinês</code></li>
                    <li><code>Torna-o mais curto</code></li>
                    <li><code>Transforma-o em pontos</code></li>
                    <li><code>Reescreve essa resposta com mais clareza</code></li>
                </ul>

                <h4>Gráficos</h4>
                <p>Pode pedir gráficos suportados pelo Paiperwork. Assim que o gráfico for criado, ele é enviado para a sua conversa no WhatsApp.</p>
                <p>Entre neste modo com <code>modo gráficos</code>, <code>modo grafico</code>, <code>modo gráfico</code>, <code>modo dataviz</code>, <code>modo visualização</code> ou <code>modo visualizacao</code>.</p>
                <ul>
                    <li><code>criar um pie chart</code></li>
                    <li><code>criar um radar chart</code></li>
                    <li><code>criar um bar chart sobre vendas por trimestre</code></li>
                </ul>
                <p>Forneça os seus próprios dados se quiser um gráfico real em vez de uma demonstração.</p>

                <h4>Pesquisa</h4>
                <p>Pode pedir ao Paiperwork para pesquisar um tema por si. Os relatórios padrão costumam ter entre 1000 e 1500 palavras, por isso pode demorar algum tempo.</p>
                <p>Entre neste modo com <code>modo pesquisa</code>.</p>
                <ul>
                    <li><code>investigar as últimas tendências em baterias para veículos elétricos e resumir oportunidades para startups</code></li>
                    <li><code>investigar preços de casas na austrália</code></li>
                    <li><code>criar um relatório sobre o clima em inglaterra</code></li>
                    <li><code>adiciona também o impacto do clima na afluência às praias</code></li>
                </ul>
                <p>Para fechar o modo de seguimento de pesquisa, responda <code>não</code>, <code>não obrigado</code> ou <code>já terminei</code>.</p>
                <h5>Interações</h5>
                <p><strong>Paiperwork:</strong> A pesquisa começou para <code>&lt;tópico de pesquisa&gt;</code>. A recolher informações...</p>
                <p><strong>Paiperwork:</strong> Quando terminar, responda com <code>não</code>, <code>não obrigado</code> ou <code>já terminei</code> para fechar o modo de pesquisa.</p>
                <p><strong>Paiperwork:</strong> Quer continuar a refinar esta pesquisa?</p>
                <p><strong>Utilizador:</strong> <code>Adicionar &lt;refinamento extra da pesquisa&gt;</code></p>
                <p><strong>Paiperwork:</strong> A pesquisa com refinamento extra foi iniciada.</p>
                <p><strong>Paiperwork:</strong> Pesquisa refinada entregue.</p>
                <p><strong>Paiperwork:</strong> Quer continuar a refinar esta pesquisa?</p>
                <p><strong>Utilizador:</strong> <code>já terminei</code>, <code>não</code>, <code>não obrigado</code></p>
                <p><strong>Paiperwork:</strong> Certo, o modo de seguimento da pesquisa foi fechado.</p>

                <h5>Transformações de seguimento para relatórios de pesquisa</h5>
                <p>Depois de um relatório de pesquisa ser entregue, pode continuar a refinar o texto em memória sem iniciar uma nova pesquisa.</p>
                <ul>
                    <li><code>Traduz o relatório para espanhol</code></li>
                    <li><code>Torna-o mais curto</code></li>
                    <li><code>Transforma-o em pontos</code></li>
                    <li><code>Reescreve-o como resumo executivo</code></li>
                </ul>

                <h4>Base de conhecimento</h4>
                <p>Pode navegar pela sua base de conhecimento guardada no WhatsApp listando coleções, abrindo uma coleção, listando as respetivas entradas e lendo a entrada selecionada. Os nomes das coleções e das entradas não precisam de ser exatos.</p>
                <p>Entre neste modo com <code>modo conhecimento</code>, <code>modo base de conhecimento</code>, <code>modo base de conhecimentos</code> ou <code>modo kb</code>.</p>
                <ul>
                    <li><code>Mostrar minha base de conhecimento</code></li>
                    <li><code>Listar minhas coleções de conhecimento</code></li>
                    <li><code>Abrir a coleção &lt;nome da coleção&gt;</code></li>
                    <li><code>Mostrar a coleção de conhecimento &lt;nome da coleção&gt;</code></li>
                    <li><code>Ler a entrada &lt;nome da entrada&gt;</code></li>
                    <li><code>Abrir o artigo &lt;nome da entrada&gt; da coleção &lt;nome da coleção&gt;</code></li>
                </ul>
                <p>Depois de o Paiperwork enviar uma entrada de conhecimento, essa entrada fica em memória para que a possa traduzir, encurtar, reescrever ou mudar o formato sem voltar a abrir a coleção.</p>
                <h5>Paiperwork:Interação utilizador</h5>
                <p><strong>Utilizador:</strong> <code>Mostrar minha base de conhecimento</code></p>
                <p><strong>Paiperwork:</strong> Aqui estão as suas coleções de conhecimento.</p>
                <p><strong>Paiperwork:</strong> Escolha uma coleção por número ou por nome.</p>
                <p><strong>Utilizador:</strong> <code>Abrir a coleção Project Research</code></p>
                <p><strong>Paiperwork:</strong> Aqui estão as entradas de <code>Project Research</code>.</p>
                <p><strong>Paiperwork:</strong> Escolha uma entrada por número ou por nome.</p>
                <p><strong>Utilizador:</strong> <code>Ler a entrada Battery supply chain</code></p>
                <p><strong>Paiperwork:</strong> A enviar a entrada de conhecimento de <code>Project Research</code>.</p>
                <p><strong>Paiperwork:</strong> Conteúdo da entrada entregue no WhatsApp.</p>
                <p><strong>Paiperwork:</strong> Quer continuar a trabalhar com esta entrada de conhecimento?</p>

                <h5>Transformações de seguimento para entradas de conhecimento</h5>
                <p>Depois de uma entrada de conhecimento ser entregue, pode continuar a transformar o texto em memória sem voltar a navegar pela base de conhecimento.</p>
                <ul>
                    <li><code>Traduz a entrada para espanhol</code></li>
                    <li><code>Torna-a mais curta</code></li>
                    <li><code>Transforma-a em pontos</code></li>
                    <li><code>Reescreve esta nota de forma mais clara</code></li>
                </ul>

                <h4>Apresentações</h4>
                <p>Pode criar apresentações fornecendo o texto de base. O Paiperwork estima o número de slides pela quantidade de conteúdo, a menos que indique explicitamente uma quantidade.</p>
                <p>Entre neste modo com <code>modo apresentação</code>, <code>modo apresentacao</code>, <code>modo apresentações</code>, <code>modo apresentacoes</code> ou <code>modo slides</code>.</p>
                <div class="note"><p><strong>Nota:</strong> As apps do WhatsApp para telemóvel, tablet e computador restringem a execução de código por razões de segurança, por isso as apresentações podem não ser exibidas aí. Use o WhatsApp Web para poder descarregá-las para o seu computador e vê-las corretamente.</p></div>
                <div class="note"><p><strong>Nota:</strong> As versões do Wechat para telefone e tablet restringem a execução de código por razões de segurança, por isso as apresentações podem não ser exibidas lá. Use o app Wechat no computador para poder descarregá-las para o seu computador e visualizá-las corretamente (certifique-se de salvar o arquivo fora da própria pasta do Wechat).</p></div>
                <div class="note"><p><strong>Nota:</strong> Depois de descarregar o ficheiro HTML da apresentação para o seu computador, pode editá-lo offline com a pequena barra de ferramentas no canto superior direito. Telemóveis e tablets não são suportados neste fluxo de edição. Use <strong>Edit text</strong> para modificar texto diretamente, clique em qualquer imagem da apresentação para a substituir por uma imagem local, use <strong>Fullscreen</strong> para ver a apresentação em ecrã inteiro e use <strong>Save</strong> para guardar o resultado atualizado como um novo ficheiro HTML. A barra de ferramentas desaparece automaticamente quando a apresentação entra em ecrã inteiro.</p></div>
                <ul>
                    <li><code>com o seguinte texto criar uma apresentação: &lt;texto da apresentação&gt;</code></li>
                    <li><code>com este texto criar uma apresentação: &lt;texto da apresentação&gt;</code></li>
                    <li><code>faz-me slides sobre a política europeia de veículos elétricos, usa pesquisa web, 7 slides</code></li>
                    <li><code>listar minhas apresentações</code></li>
                    <li><code>envia-me &lt;nome da apresentação&gt;</code></li>
                </ul>
                <h5>Interações</h5>
                <p><strong>Utilizador:</strong> <code>Cria uma apresentação sobre o sistema solar e os seus planetas, pesquisa online.</code></p>
                <p><strong>Paiperwork:</strong> A criar uma apresentação promptable do SlideForge com pesquisa web...</p>
                <p><strong>Paiperwork:</strong> Apresentação criada e enviada como ficheiro HTML.</p>
                <p><strong>Paiperwork:</strong> Quer fazer mais alterações nesta apresentação?</p>
                <p><strong>Utilizador:</strong> <code>Sim, muda o fundo do slide 3 para tema azul</code></p>

                <h4>Artefatos</h4>
                <p>Pode pedir artefatos ou mini apps HTML de muitos tipos diretamente pelo WhatsApp.</p>
                <p>Entre neste modo com <code>modo mini app</code>, <code>modo miniapp</code>, <code>modo mini aplicação</code>, <code>modo mini aplicacao</code> ou <code>modo artefato</code>.</p>
                <div class="note"><p><strong>Nota:</strong> As apps do WhatsApp para telemóvel, tablet e computador restringem a execução de código por razões de segurança, por isso as mini apps podem não ser exibidas ou executadas aí. Use o WhatsApp Web para poder descarregá-las para o seu computador e utilizá-las corretamente.</p></div>
                <div class="note"><p><strong>Nota:</strong> As versões do Wechat para telefone e tablet restringem a execução de código por razões de segurança, por isso as mini apps podem não ser exibidas ou executadas lá. Use o app Wechat no computador para poder descarregá-las para o seu computador e usá-las corretamente (certifique-se de salvar o arquivo fora da própria pasta do Wechat).</p></div>
                <ul>
                    <li><code>criar uma mini app de papel de parede animado relaxante com diferentes ruídos e osciladores de baixa frequência, com pesquisa web</code></li>
                    <li><code>criar artefato galaga</code></li>
                    <li><code>criar uma mini app para encontrar canais de tv online</code></li>
                    <li><code>criar um artefato mp3 player</code></li>
                    <li><code>mostra-me minhas mini apps</code></li>
                    <li><code>mostra-me meus artefatos</code></li>
                    <li><code>envia-me &lt;nome do artefato&gt; mini app</code></li>
                    <li><code>envia-me &lt;nome do artefato&gt; artefato</code></li>
                </ul>
                <h5>Interações</h5>
                <p><strong>Paiperwork:</strong> Quer fazer mais modificações nesta mini app?</p>
                <p><strong>Utilizador:</strong> <code>Sim, muda o fundo</code></p>
                <p><strong>Paiperwork:</strong> Quer fazer mais modificações nesta mini app?</p>
                <p><strong>Utilizador:</strong> <code>Não</code></p>
                <p><strong>Paiperwork:</strong> Certo, o modo de modificação de artefatos foi fechado.</p>

                <h4>Modos de seguimento e frases de saída</h4>
                <p>O Paiperwork mantém o contexto do fluxo por telefone. Quando surgir uma pergunta de seguimento, as frases suportadas para continuar incluem <code>sim</code>, <code>sim por favor</code> e <code>continuar</code>. As frases suportadas para fechar incluem <code>não</code>, <code>não obrigado</code> e <code>já terminei</code>. Nos documentos, também pode sair do modo de perguntas com <code>sair do modo documento</code>.</p>
                <p>Para sair de um modo explícito e voltar ao chat normal, use <code>sair do modo</code>, <code>fechar modo</code> ou <code>desativar modo</code>.</p>
                <p>O mesmo fluxo de transformação de seguimento também funciona após resumos de documentos, relatórios de pesquisa e respostas devolvidas enquanto o modo de perguntas sobre documentos está ativo.</p>
                <h5>Exemplo de interação</h5>
                <p><strong>Utilizador:</strong> <code>&lt;nome do documento&gt; resumo</code></p>
                <p><strong>Paiperwork:</strong> Resumo do documento fornecido.</p>
                <p><strong>Paiperwork:</strong> Quer continuar a trabalhar com este documento?</p>
                <p><strong>Utilizador:</strong> <code>Traduz o resumo para chinês</code></p>
                <p><strong>Paiperwork:</strong> Tradução chinesa do resumo em memória fornecida.</p>
                <p><strong>Paiperwork:</strong> Quer continuar a trabalhar com este documento?</p>
                <p><strong>Utilizador:</strong> <code>Não</code></p>
                <p><strong>Paiperwork:</strong> Certo, o modo de seguimento do documento foi fechado.</p>
            `,
            },
            {
                id: "connectors-notes",
                title: "Notas Operacionais e Limites",
                content: `
                <ul>
                    <li>Enviar ficheiros e imagens para o modelo de IA ainda não é suportado.</li>
                    <li>Os fluxos de documentos exigem um modelo de embeddings local selecionado na aba Documentos.</li>
                    <li>O Paiperwork fica no chat normal por predefinição. Os fluxos de documentos, gráficos, modelos, pesquisa, apresentações e mini apps só começam depois de enviar as respetivas palavras-chave de modo explícito.</li>
                    <li>Se voltar da página de geração para a página de boas-vindas ou atualizar o navegador, o servidor de WhatsApp/WeChat será fechado. Tem de o iniciar manualmente novamente para retomar a comunicação pelo WhatsApp/WeChat.</li>
                    <li>As apresentações e os artefatos gerados a partir do WhatsApp/WeChat são enviados como ficheiros HTML. Depois pode abri-los no Paiperwork para edições manuais mais profundas.</li>
                    <li>Durante operações longas como resumo de documentos, pesquisa, criação de apresentações ou mini apps, pode cancelar a qualquer momento enviando <code>Cancel</code>, <code>Stop</code> ou <code>Exit</code> a partir do WhatsApp/WeChat.</li>
                    <li>Por predefinição, o Paiperwork isola o estado do conector do WhatsApp/WeChat por utilizador de Master Key, para que sessões guardadas, estado do dispositivo e dados de execução em fila não se misturem nem vazem entre diferentes utilizadores de Master Key no mesmo computador.</li>
                </ul>
            `,
            }
        ],
    },
};
