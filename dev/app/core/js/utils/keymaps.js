// Global keymap definitions for intent routing in ConnectorWhatsapp
// Contains data-viz, research, and document triggers in supported languages.
const documentKeymap = {
    nouns: [
        'document', 'documents', 'documento', 'documentos', 'documentacion', 'documentação', 'documentacao', 'doc', 'docs',
        'file', 'files', 'archivo', 'archivos', 'arquivo', 'arquivos', 'ficheiro', 'ficheiros',
        'report', 'reports', 'reporte', 'reportes', 'relatorio', 'relatório', 'relatorios', 'relatórios',
        'invoice', 'invoices', 'factura', 'facturas', 'fatura', 'faturas',
        'contract', 'contracts', 'contrato', 'contratos',
        'pdf', 'pdfs', 'upload', 'uploads', 'uploaded file', 'uploaded files',
        'document', 'documents', 'dossier', 'dossiers', 'fichier', 'fichiers', 'rapport', 'rapports',
        'dokument', 'dokumente', 'datei', 'dateien', 'bericht', 'berichte',
        'documento', 'documenti', 'file', 'files', 'rapporto', 'rapporti', 'contratto', 'contratti',
        '文档', '文件', '资料', '檔案', '档案',
        'ドキュメント', '文書', 'ファイル', '資料', 'レポート', '契約書',
        '문서', '파일', '자료', '보고서', '계약서'
    ],
    actions: {
        browse: [
            'show', 'list', 'open', 'browse', 'review', 'check', 'see', 'find', 'choose', 'select',
            'mostrar', 'lista', 'listar', 'abre', 'abrir', 'revisar', 'ver', 'buscar', 'elige', 'elegir', 'seleccionar', 'selecciona',
            'mostrar', 'listar', 'abrir', 'revisar', 'ver', 'procurar', 'buscar', 'escolher', 'selecionar', 'seleccione', 'navegar',
            'afficher', 'liste', 'lister', 'ouvrir', 'parcourir', 'examiner', 'voir', 'chercher', 'choisir', 'selectionner', 'sélectionner',
            'zeigen', 'liste', 'auflisten', 'offnen', 'öffnen', 'durchsuchen', 'prufen', 'prüfen', 'ansehen', 'finden', 'auswahlen', 'auswählen',
            'mostrare', 'elencare', 'aprire', 'sfogliare', 'rivedere', 'vedere', 'cercare', 'scegliere', 'selezionare',
            '查看', '显示', '列出', '打开', '浏览', '选择', '查找',
            '表示', '一覧', '開く', '閲覧', '確認', '選択', '探す',
            '보여', '목록', '열기', '찾아', '선택', '확인', '검토'
        ],
        summary: [
            'summary', 'summarize', 'summarise', 'overview', 'brief', 'abstract',
            'resumen', 'resumir', 'resumeme', 'resúmeme',
            'resumo', 'resumir', 'sumario', 'sumário', 'sintetizar',
            'resume', 'résumé', 'resumer', 'résumer', 'synthese', 'synthèse',
            'zusammenfassung', 'zusammenfassen', 'kurzfassung',
            'riassunto', 'riassumere', 'sintesi',
            '总结', '摘要', '概要',
            '要約', 'まとめ',
            '요약', '정리'
        ],
        question: [
            'ask', 'question', 'questions', 'query', 'ask about', 'question about', 'tell me about', 'explain', 'describe',
            'pregunta', 'preguntar', 'preguntas', 'consulta', 'consultar', 'explica', 'explicar', 'describe', 'describir',
            'pergunta', 'perguntar', 'perguntas', 'consulta', 'consultar', 'explica', 'explicar', 'descreve', 'descrever',
            'question', 'questions', 'demander', 'exppliquer', 'expliquer', 'decrire', 'décrire', 'parler de',
            'frage', 'fragen', 'erklaren', 'erklären', 'beschreiben',
            'domanda', 'domande', 'chiedere', 'spiegare', 'descrivere',
            '问题', '提问', '询问', '解释', '描述',
            '質問', '聞く', '説明', '記述',
            '질문', '물어', '설명', '묘사'
        ],
        exit: [
            'exit document mode', 'leave document mode', 'stop document mode', 'disable document mode', 'back to normal chat', 'regular chat',
            'salir del modo documento', 'dejar modo documento', 'volver al chat normal',
            'sair do modo documento', 'voltar ao chat normal',
            'quitter le mode document', 'revenir au chat normal',
            'dokumentmodus verlassen', 'zuruck zum normalen chat', 'zurück zum normalen chat',
            'uscire dalla modalita documento', 'uscire dalla modalità documento', 'torna alla chat normale',
            '退出文档模式', '返回普通聊天',
            'ドキュメントモードを終了', '通常チャットに戻る',
            '문서 모드 종료', '일반 채팅으로 돌아가기'
        ]
    },
    questionStarters: [
        'who', 'what', 'when', 'where', 'why', 'how', 'which', 'tell me', 'can you', 'could you', 'would you', 'is', 'are', 'do', 'does', 'did',
        'quien', 'quién', 'que', 'qué', 'cuando', 'cuándo', 'donde', 'dónde', 'por que', 'por qué', 'como', 'cómo',
        'quem', 'o que', 'quando', 'onde', 'por que', 'por quê', 'como',
        'qui', 'quoi', 'quand', 'ou', 'où', 'pourquoi', 'comment',
        'wer', 'was', 'wann', 'wo', 'warum', 'wie', 'welche', 'welcher', 'welches',
        'chi', 'cosa', 'quando', 'dove', 'perche', 'perché', 'come', 'quale',
        '谁', '什么', '何时', '哪里', '为什么', '怎么',
        '誰', '何', 'いつ', 'どこ', 'なぜ', 'どう',
        '누구', '무엇', '언제', '어디', '왜', '어떻게'
    ],
    generalChat: [
        'hello', 'hi', 'hey', 'thanks', 'thank you',
        'hola', 'gracias',
        'ola', 'olá', 'obrigado', 'obrigada',
        'bonjour', 'salut', 'merci',
        'hallo', 'danke',
        'ciao', 'grazie',
        '你好', '谢谢',
        'こんにちは', 'ありがとう',
        '안녕', '감사'
    ]
};

documentKeymap.terms = [...new Set([
    ...documentKeymap.nouns,
    ...documentKeymap.questionStarters,
    ...Object.values(documentKeymap.actions).flat()
])];

const researchKeymap = {
    intent: [
        'research', 'investigate', 'investigation', 'analyze', 'analyse', 'analysis', 'study', 'explore', 'examine',
        'investigar', 'investigacion', 'investigación', 'analizar', 'analise', 'análisis', 'estudiar', 'explorar', 'examinar',
        'investigar', 'investigacao', 'investigação', 'analisar', 'analise', 'análise', 'estudar', 'explorar', 'examinar',
        'recherche', 'rechercher', 'analyser', 'analyse', 'etudier', 'étudier', 'explorer', 'examiner',
        'forschung', 'recherchieren', 'analysieren', 'analyse', 'untersuchen', 'studieren',
        'ricerca', 'ricercare', 'analizzare', 'analisi', 'studiare', 'esplorare', 'esaminare',
        '研究', '调查', '調査', '研究する', '조사', '연구', '분석'
    ],
    actions: {
        create: [
            'prepare', 'create', 'make', 'write', 'generate', 'compile',
            'preparar', 'crear', 'hacer', 'escribir', 'generar', 'compilar',
            'preparar', 'criar', 'fazer', 'escrever', 'gerar', 'compilar',
            'preparer', 'préparer', 'creer', 'créer', 'rediger', 'rédiger', 'generer', 'générer', 'compiler',
            'erstellen', 'vorbereiten', 'schreiben', 'generieren', 'zusammenstellen',
            'preparare', 'creare', 'scrivere', 'generare', 'compilare',
            '准备', '创建', '生成', '撰写', '整理',
            '作成', '準備', '生成', '書く', 'まとめる',
            '준비', '작성', '생성', '정리'
        ],
        compare: [
            'compare', 'comparison', 'benchmark', 'versus', 'vs',
            'comparar', 'comparacion', 'comparación',
            'comparar', 'comparacao', 'comparação',
            'comparer', 'comparaison',
            'vergleichen', 'vergleich',
            'confrontare', 'comparazione',
            '比较', '对比',
            '比較',
            '비교'
        ]
    },
    outputs: [
        'report', 'reports', 'insight', 'insights', 'briefing', 'strategy', 'strategies', 'findings', 'opportunities',
        'reporte', 'reportes', 'informe', 'informes', 'insight', 'hallazgos', 'oportunidades', 'estrategia', 'estrategias',
        'relatorio', 'relatório', 'relatorios', 'relatórios', 'insights', 'descobertas', 'oportunidades', 'estrategia', 'estratégia',
        'rapport', 'rapports', 'constatations', 'opportunites', 'opportunités', 'strategie', 'stratégie', 'synthese', 'synthèse',
        'bericht', 'berichte', 'erkenntnisse', 'chancen', 'strategie', 'strategien',
        'rapporto', 'rapporti', 'risultati', 'opportunita', 'opportunità', 'strategia', 'strategie',
        '报告', '洞察', '机会', '策略', '结论',
        'レポート', '洞察', '機会', '戦略', '結論',
        '보고서', '인사이트', '기회', '전략', '결과'
    ],
    modifiers: [
        'latest', 'current', 'recent', 'deep', 'comprehensive', 'detailed', 'market', 'competitor', 'industry', 'trend', 'trends',
        'ultimo', 'último', 'actual', 'reciente', 'profundo', 'completo', 'detallado', 'mercado', 'competidor', 'industria', 'tendencia', 'tendencias',
        'atual', 'recente', 'profundo', 'completo', 'detalhado', 'mercado', 'concorrente', 'industria', 'indústria', 'tendencia', 'tendência', 'tendencias', 'tendências',
        'dernier', 'derniere', 'dernière', 'actuel', 'recente', 'récente', 'approfondi', 'complet', 'detaille', 'détaillé', 'marche', 'marché', 'concurrent', 'industrie', 'tendance', 'tendances',
        'aktuell', 'neueste', 'letzte', 'tief', 'umfassend', 'detailliert', 'markt', 'wettbewerber', 'branche', 'trend', 'trends',
        'attuale', 'recente', 'approfondito', 'completo', 'dettagliato', 'mercato', 'concorrente', 'industria', 'tendenza', 'tendenze',
        '最新', '当前', '最近', '深入', '全面', '详细', '市场', '竞争对手', '行业', '趋势',
        '最新', '現在', '最近', '詳細', '包括的', '市場', '競合', '業界', '動向', 'トレンド',
        '최신', '현재', '최근', '심층', '종합', '상세', '시장', '경쟁사', '업계', '동향', '트렌드'
    ]
};

researchKeymap.terms = [...new Set([
    ...researchKeymap.intent,
    ...researchKeymap.outputs,
    ...researchKeymap.modifiers,
    ...Object.values(researchKeymap.actions).flat()
])];

const presentationKeymap = {
    intent: [
        'presentation', 'presentations', 'slide', 'slides', 'slide deck', 'slidedeck', 'deck', 'powerpoint', 'ppt', 'slideforge',
        'presentacion', 'presentación', 'presentaciones', 'presentacions', 'diapositiva', 'diapositivas', 'deck de diapositivas',
        'apresentacao', 'apresentação', 'apresentacoes', 'apresentações', 'apresentacao guardada', 'slide', 'slides', 'deck',
        'presentation', 'presentations', 'diapositive', 'diapositives', 'jeu de diapositives', 'presentation sauvegardee', 'présentation sauvegardée',
        'prasentation', 'präsentation', 'prasentationen', 'präsentationen', 'folie', 'folien',
        'presentazione', 'presentazioni', 'diapositiva', 'diapositive', 'mazzo di slide',
        'презентация', 'презентации', 'слайд', 'слайды', 'слайд дек', 'дек',
        '演示', '演示文稿', '简报', '幻灯片', '投影片',
        'プレゼン', 'プレゼンテーション', 'スライド', '資料',
        '프레젠테이션', '슬라이드', '발표자료'
    ],
    actions: {
        create: [
            'create', 'make', 'build', 'generate', 'prepare', 'craft', 'design', 'turn into', 'convert into',
            'crear', 'creame', 'créame', 'hacer', 'hazme', 'generar', 'generame', 'genérame', 'preparar', 'preparame', 'prepárame', 'disenar', 'diseñar', 'convertir en',
            'criar', 'cria-me', 'criame', 'fazer', 'faz-me', 'fazeme', 'gerar', 'gera-me', 'gerame', 'preparar', 'prepara-me', 'preparame', 'montar', 'converter em',
            'creer', 'créer', 'cree-moi', 'crée-moi', 'generer', 'générer', 'prepare', 'preparer', 'préparer', 'prepare-moi', 'prépare-moi', 'concevoir', 'transformer en',
            'erstellen', 'mach', 'machen', 'erzeuge', 'generieren', 'vorbereiten', 'entwerfen', 'umwandeln in',
            'creare', 'creami', 'generare', 'generami', 'preparare', 'preparami', 'progettare', 'trasformare in',
            'создать', 'сделать', 'подготовить', 'сгенерировать', 'собрать', 'преобразовать в',
            '创建', '生成', '制作', '整理成', '转换成',
            '作成', '生成', '作る', '変換',
            '만들어', '생성', '작성', '구성', '변환'
        ],
        browse: [
            'show', 'list', 'open', 'browse', 'view', 'find', 'choose', 'select', 'pick',
            'mostrar', 'muestrame', 'muéstrame', 'lista', 'listar', 'abrir', 'buscar', 'elige', 'elegir', 'seleccionar', 'seleccionala', 'ensename', 'enséñame',
            'mostrar', 'mostra-me', 'mostrame', 'listar', 'abrir', 'ver', 'procurar', 'buscar', 'escolher', 'selecionar', 'mostre-me',
            'afficher', 'montre-moi', 'montrer', 'lister', 'ouvrir', 'parcourir', 'voir', 'chercher', 'choisir', 'selectionner', 'sélectionner',
            'zeigen', 'zeig', 'zeig mir', 'auflisten', 'offnen', 'öffnen', 'durchsuchen', 'ansehen', 'finden', 'auswahlen', 'auswählen',
            'mostrare', 'mostrami', 'elencare', 'aprire', 'sfogliare', 'vedere', 'cercare', 'scegliere', 'selezionare',
            'показать', 'список', 'перечислить', 'открыть', 'просмотреть', 'найти', 'выбрать',
            '查看', '显示', '列出', '打开', '浏览', '选择', '查找',
            '表示', '一覧', '開く', '閲覧', '確認', '選択', '探す',
            '보여', '목록', '열기', '찾아', '선택', '확인'
        ],
        send: [
            'send', 'share', 'deliver', 'export',
            'send', 'send me',
            'enviar', 'enviame', 'envíame', 'mandar', 'mandame', 'mándame', 'compartir',
            'enviar', 'envia-me', 'enviame', 'mandar', 'manda-me', 'mandame', 'partilhar', 'compartilhar',
            'envoyer', 'envoie-moi', 'partager',
            'senden', 'sende mir', 'teilen',
            'inviare', 'inviami', 'condividere',
            'отправить', 'поделиться',
            '发送', '分享',
            '送信', '共有',
            '보내', '전송', '공유'
        ]
    },
    sourceCues: [
        'with this text', 'with the following text', 'using this text', 'using the following text', 'from this text', 'based on this text', 'provided text', 'provided content', 'source text', 'source content',
        'con este texto', 'con el siguiente texto', 'usando este texto', 'a partir de este texto', 'texto proporcionado', 'contenido proporcionado',
        'com este texto', 'com o seguinte texto', 'usando este texto', 'a partir deste texto', 'texto fornecido', 'conteudo fornecido', 'conteúdo fornecido',
        'avec ce texte', 'avec le texte suivant', 'en utilisant ce texte', 'a partir de ce texte', 'à partir de ce texte', 'texte fourni', 'contenu fourni',
        'mit diesem text', 'mit folgendem text', 'unter verwendung dieses textes', 'aus diesem text', 'bereitgestellter text', 'bereitgestellter inhalt',
        'con questo testo', 'con il seguente testo', 'usando questo testo', 'da questo testo', 'testo fornito', 'contenuto fornito',
        'с этим текстом', 'со следующим текстом', 'используя этот текст', 'на основе этого текста', 'предоставленный текст', 'предоставленный контент',
        '用这段文字', '使用以下文本', '根据这段文字', '提供的文本', '提供的内容',
        'このテキストで', '次のテキストを使って', 'この文章から', '提供されたテキスト',
        '이 텍스트로', '다음 텍스트로', '제공한 텍스트', '제공된 내용으로'
    ],
    savedCues: [
        'saved presentation', 'saved presentations', 'existing presentation', 'existing presentations', 'my presentation', 'my presentations',
        'presentacion guardada', 'presentaciones guardadas', 'presentación guardada', 'presentaciones existentes', 'mis presentaciones',
        'apresentacao guardada', 'apresentação guardada', 'apresentacoes guardadas', 'apresentações guardadas', 'minhas apresentações',
        'presentation enregistree', 'présentation enregistrée', 'presentations enregistrees', 'présentations enregistrées', 'mes presentations', 'mes présentations',
        'gespeicherte prasentation', 'gespeicherte präsentation', 'gespeicherte prasentationen', 'gespeicherte präsentationen', 'meine prasentationen', 'meine präsentationen',
        'presentazione salvata', 'presentazioni salvate', 'le mie presentazioni',
        'сохраненная презентация', 'сохраненные презентации', 'моя презентация', 'мои презентации',
        '已保存的演示文稿', '保存的演示文稿', '我的演示文稿',
        '保存済みのプレゼン', '保存済みのプレゼンテーション', '自分のプレゼン',
        '저장된 프레젠테이션', '내 프레젠테이션'
    ],
    workflows: {
        summaryToPresentation: [
            'summarize and create a presentation', 'summarise and create a presentation', 'summary and create a presentation',
            'summary and presentation', 'summary presentation',
            'summarize then create a presentation', 'summarise then create a presentation', 'create a presentation from the summary',
            'make a presentation from the summary', 'use the summary to create a presentation',
            'resumir y crear una presentación', 'resumen y crear una presentación', 'resumen y presentación', 'resumen presentación', 'crear una presentación con el resumen',
            'usar el resumen para crear una presentación',
            'resumir e criar uma apresentação', 'resumo e criar uma apresentação', 'resumo e apresentação', 'resumo apresentação', 'criar uma apresentação com o resumo',
            'usar o resumo para criar uma apresentação',
            'résumer et créer une présentation', 'résumé et créer une présentation', 'résumé et présentation', 'résumé présentation', 'créer une présentation à partir du résumé',
            'utiliser le résumé pour créer une présentation',
            'zusammenfassen und eine präsentation erstellen', 'zusammenfassung und eine präsentation erstellen', 'zusammenfassung und präsentation', 'zusammenfassung präsentation',
            'eine präsentation aus der zusammenfassung erstellen', 'mit der zusammenfassung eine präsentation erstellen',
            'riassumere e creare una presentazione', 'riassunto e creare una presentazione', 'riassunto e presentazione', 'riassunto presentazione',
            'creare una presentazione dal riassunto', 'usare il riassunto per creare una presentazione',
            'сделать сводку и создать презентацию', 'сводка и презентация', 'создать презентацию из сводки', 'использовать сводку для создания презентации',
            '总结并创建演示文稿', '摘要并创建演示文稿', '摘要和演示文稿', '总结和演示文稿', '根据摘要创建演示文稿', '用摘要创建演示文稿',
            '要約してプレゼンテーションを作成', '要約してプレゼンを作成', '要約とプレゼンテーション', '要約とプレゼン', '要約からプレゼンテーションを作成',
            '요약하고 프레젠테이션 만들기', '요약과 프레젠테이션', '요약 프레젠테이션', '요약으로 프레젠테이션 만들기', '요약을 사용해 프레젠테이션 만들기'
        ]
    },
    sectionAnchors: [
        'agenda', 'overview', 'introduction', 'intro', 'background', 'context', 'problem', 'solution', 'proposal', 'strategy', 'plan', 'roadmap', 'timeline', 'milestones', 'goals', 'objectives', 'benefits', 'features', 'implementation', 'execution', 'budget', 'pricing', 'results', 'metrics', 'conclusion', 'summary', 'next steps', 'questions', 'q&a', 'faq',
        'agenda', 'resumen', 'introduccion', 'introducción', 'contexto', 'problema', 'solucion', 'solución', 'propuesta', 'estrategia', 'plan', 'hoja de ruta', 'cronograma', 'hitos', 'objetivos', 'beneficios', 'caracteristicas', 'características', 'implementacion', 'implementación', 'presupuesto', 'precios', 'resultados', 'metricas', 'métricas', 'conclusion', 'conclusión', 'siguientes pasos', 'preguntas',
        'agenda', 'resumo', 'introducao', 'introdução', 'contexto', 'problema', 'solucao', 'solução', 'proposta', 'estrategia', 'estratégia', 'plano', 'roteiro', 'cronograma', 'marcos', 'objetivos', 'beneficios', 'benefícios', 'funcionalidades', 'implementacao', 'implementação', 'orcamento', 'orçamento', 'precos', 'preços', 'resultados', 'metricas', 'métricas', 'conclusao', 'conclusão', 'proximos passos', 'próximos passos', 'perguntas',
        'ordre du jour', 'vue d ensemble', 'vue d’ensemble', 'introduction', 'contexte', 'probleme', 'problème', 'solution', 'proposition', 'strategie', 'stratégie', 'plan', 'feuille de route', 'calendrier', 'jalons', 'objectifs', 'avantages', 'fonctionnalites', 'fonctionnalités', 'mise en oeuvre', 'mise en œuvre', 'budget', 'tarification', 'resultats', 'résultats', 'metriques', 'métriques', 'conclusion', 'resume', 'résumé', 'prochaines etapes', 'prochaines étapes', 'questions',
        'agenda', 'uberblick', 'überblick', 'einfuhrung', 'einführung', 'hintergrund', 'kontext', 'problem', 'losung', 'lösung', 'vorschlag', 'strategie', 'plan', 'fahrplan', 'zeitplan', 'meilensteine', 'ziele', 'vorteile', 'funktionen', 'umsetzung', 'budget', 'preise', 'ergebnisse', 'kennzahlen', 'fazit', 'zusammenfassung', 'nächste schritte', 'nachste schritte', 'fragen',
        'agenda', 'panoramica', 'introduzione', 'contesto', 'problema', 'soluzione', 'proposta', 'strategia', 'piano', 'roadmap', 'cronologia', 'tempistica', 'traguardi', 'obiettivi', 'vantaggi', 'funzionalita', 'funzionalità', 'implementazione', 'budget', 'prezzi', 'risultati', 'metriche', 'conclusione', 'riepilogo', 'prossimi passi', 'domande',
        'повестка', 'обзор', 'введение', 'фон', 'контекст', 'проблема', 'решение', 'предложение', 'стратегия', 'план', 'дорожная карта', 'таймлайн', 'этапы', 'цели', 'преимущества', 'функции', 'реализация', 'исполнение', 'бюджет', 'цены', 'результаты', 'метрики', 'заключение', 'итоги', 'следующие шаги', 'вопросы', 'вопросы и ответы',
        '议程', '概览', '介绍', '背景', '上下文', '问题', '方案', '解决方案', '提案', '策略', '计划', '路线图', '时间线', '里程碑', '目标', '收益', '功能', '实施', '预算', '价格', '结果', '指标', '结论', '总结', '下一步', '问答', '常见问题',
        'アジェンダ', '概要', '紹介', '導入', '背景', '文脈', '課題', '問題', '解決策', '提案', '戦略', '計画', 'ロードマップ', 'タイムライン', 'マイルストーン', '目標', '利点', '機能', '実装', '予算', '価格', '結果', '指標', '結論', 'まとめ', '次のステップ', '質問', 'q&a',
        '아젠다', '개요', '소개', '배경', '맥락', '문제', '해결책', '제안', '전략', '계획', '로드맵', '타임라인', '마일스톤', '목표', '장점', '기능', '구현', '예산', '가격', '결과', '지표', '결론', '요약', '다음 단계', '질문', '문답'
    ]
};

presentationKeymap.terms = [...new Set([
    ...presentationKeymap.intent,
    ...presentationKeymap.sourceCues,
    ...presentationKeymap.savedCues,
    ...presentationKeymap.workflows.summaryToPresentation,
    ...presentationKeymap.sectionAnchors,
    ...Object.values(presentationKeymap.actions).flat()
])];

window.Keymaps = {
    dataViz: {
        intent: [
            'pie', 'bar', 'line', 'scatter', 'area', 'radar', 'heatmap', 'bubble',
            'chart', 'charts', 'graph', 'plot', 'diagram', 'visualization', 'visualisation',
            'gráfico', 'graficos', 'gráfica', 'grafic', 'grafico', 'grafica', 'diagrama',
            'graphique', 'diagramme', 'graphe',
            'grafik', 'diagramm',
            'grafico', 'grafici',
            'gráfico', 'gráficos',
            '图', '图表', '图形', '图示',
            'グラフ', 'チャート', '図表',
            '차트', '그래프',
            'pie chart', 'donut chart', 'doughnut chart', 'bar chart', 'line chart',
            'scatter plot', 'area chart', 'radar chart', 'heat map', 'bubble chart',
            'circular', 'torta', 'pastel', '円グラフ', '파이', '饼', '円', '圆形'
        ],
        chartType: {
            pie: [
                'pie', 'pie chart', 'donut', 'doughnut', 'donut chart', 'doughnut chart',
                'pastel', 'torta', 'circular', 'camembert', 'sector', 'sectores', 'setores',
                '饼图', '圈图', '圆饼图', '円グラフ', 'ドーナツ', '파이 차트', '파이차트', '파이'
            ],
            bar: [
                'bar', 'bar chart', 'barras', 'grafico de barras', 'gráfico de barras',
                'balken', 'balkendiagramm', 'barre', 'graphique en barres',
                '棒状图', '柱状图', '条形图', '棒グラフ', '棒状', '막대 그래프', '막대차트', '막대'
            ],
            line: [
                'line', 'line chart', 'línea', 'grafico de linea', 'gráfico de línea',
                'ligne', 'graphique en ligne', 'linie', 'liniendiagramm',
                '线图', '折线图', '折れ線グラフ', '선형', '선 그래프', 'linea'
            ],
            scatter: [
                'scatter', 'scatter plot', 'dispersión', 'diagrama de dispersion', 'diagrama de dispersión',
                'nuage de points', 'streudiagramm',
                '散点图', '散布図', '산점도'
            ],
            area: [
                'area', 'area chart', 'área', 'grafico de area', 'gráfico de área',
                'zone', 'graphique de zone', 'flachendiagramm',
                '区域图', '面积图', 'エリアチャート', '영역 차트'
            ],
            radar: [
                'radar', 'radar chart', 'spider chart', 'araña', 'telaraña', 'toile',
                '雷达图', 'レーダーチャート', '레이더 차트'
            ],
            heatmap: [
                'heatmap', 'heat map', 'mapa de calor', 'carte thermique', 'wärmekarte',
                '热图', '热力图', 'ヒートマップ', '히트맵'
            ],
            bubble: [
                'bubble', 'bubble chart', 'burbuja', 'grafico de burbujas', 'gráfico de burbujas',
                'bulles', 'blasendiagramm', '泡', '气泡图', 'バブルチャート', '버블', '버블 차트'
            ]
        }
    },
    research: researchKeymap,
    document: documentKeymap,
    presentation: presentationKeymap
};
