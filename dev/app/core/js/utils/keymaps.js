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

const commonFollowUpCloseCues = [
    'no', 'no thanks', 'no thank you', 'im finished', "i'm finished", 'i am finished', 'finished', 'im good', "i'm good", 'i am good', 'all good', 'looks good', 'thats all', "that's all", 'no more changes', 'no more modifications', 'stop modifying', 'done',
    'no', 'no gracias', 'estoy bien', 'ya termine', 'ya terminé', 'terminado', 'listo', 'sin mas cambios', 'sin más cambios', 'no mas cambios', 'no más cambios',
    'nao', 'não', 'nao obrigado', 'não obrigado', 'estou bem', 'ja terminei', 'já terminei', 'terminado', 'pronto', 'sem mais alteracoes', 'sem mais alterações',
    'non', 'non merci', 'cest bon', "c'est bon", 'je suis bon', 'jai fini', "j'ai fini", 'termine', 'terminé', 'plus de modifications', 'cest tout', "c'est tout",
    'nein', 'nein danke', 'ich bin fertig', 'fertig', 'alles gut', 'sieht gut aus', 'keine weiteren anderungen', 'keine weiteren änderungen', 'das ist alles',
    'no', 'no grazie', 'ho finito', 'finito', 'va bene cosi', 'va bene così', 'nessun altra modifica', "nessun'altra modifica", 'basta cosi', 'basta così',
    'нет', 'нет спасибо', 'я закончил', 'я закончила', 'готово', 'все хорошо', 'всё хорошо', 'без изменений', 'без дальнейших изменений',
    '不用了', '不用', '好了', '我好了', '我没问题', '完成了', '结束', '不需要再修改',
    'いいえ', '大丈夫', 'これでいい', 'これで大丈夫', '終わり', '完了', 'もういい', 'もう修正はいらない',
    '아니요', '괜찮아요', '됐어요', '끝났어요', '끝', '좋아요', '수정은 더 필요 없어요'
];

const commonFollowUpContinueCues = [
    'yes', 'yes please', 'sure', 'ok', 'okay', 'continue', 'keep going', 'more changes', 'modify more', 'lets continue', "let's continue",
    'si', 'sí', 'si por favor', 'sí por favor', 'claro', 'vale', 'continuar', 'sigue', 'mas cambios', 'más cambios',
    'sim', 'sim por favor', 'claro', 'ok', 'continuar', 'continua', 'continue', 'mais alteracoes', 'mais alterações',
    'oui', 'oui sil vous plait', 'oui s il vous plait', 'bien sur', 'bien sûr', 'daccord', "d'accord", 'continuer', 'encore des modifications',
    'ja', 'ja bitte', 'klar', 'okay', 'weiter', 'weitermachen', 'mehr anderungen', 'mehr änderungen',
    'si', 'sì', 'si per favore', 'sì per favore', 'certo', 'ok', 'continua', 'continuare', 'piu modifiche', 'più modifiche',
    'да', 'да пожалуйста', 'конечно', 'продолжай', 'еще изменения', 'ещё изменения',
    '是', '好的', '继续', '继续修改', '还要修改',
    'はい', 'お願いします', '続けて', '続行', 'まだ修正したい',
    '네', '예', '계속', '계속해줘', '더 수정할게요'
];

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
    ],
    followUpCloseCues: commonFollowUpCloseCues,
    followUpContinueCues: commonFollowUpContinueCues
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
    webCues: [
        'use internet', 'use the internet', 'use web', 'use the web', 'with web search', 'using web search', 'search the web', 'search online', 'use online sources',
        'use online references', 'use internet sources', 'look on the web', 'look online', 'browse the web for sources', 'with internet research',
        'usa internet', 'usa el internet', 'usa la web', 'usa búsqueda web', 'con búsqueda web', 'busca en la web', 'busca en internet', 'usa fuentes en línea',
        'usa referencias en línea', 'con investigación web',
        'usa internet', 'usa a internet', 'usa a web', 'usa pesquisa web', 'com pesquisa web', 'pesquisa na web', 'pesquisa online', 'usa fontes online',
        'usa referências online', 'com pesquisa na internet',
        'utilise internet', 'utilise la recherche web', 'avec recherche web', 'recherche sur le web', 'cherche en ligne', 'utilise des sources en ligne',
        'avec recherche internet',
        'nutze das internet', 'nutze websuche', 'mit websuche', 'im web suchen', 'online suchen', 'nutze online-quellen', 'nutze internetquellen',
        'usa internet', 'usa il web', 'usa la ricerca web', 'con ricerca web', 'cerca sul web', 'cerca online', 'usa fonti online', 'usa fonti internet',
        'используй интернет', 'используй веб-поиск', 'с веб-поиском', 'ищи в интернете', 'используй онлайн-источники',
        '使用互联网', '使用网络搜索', '用网页搜索', '搜索网络', '在线搜索', '使用在线来源',
        'ウェブ検索を使う', 'インターネットを使う', 'ウェブで検索', 'オンラインで検索', 'オンライン情報を使う',
        '웹 검색 사용', '인터넷 사용', '웹에서 검색', '온라인 검색', '온라인 출처 사용'
    ],
    followUpCloseCues: commonFollowUpCloseCues,
    followUpContinueCues: commonFollowUpContinueCues,
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
    ...presentationKeymap.webCues,
    ...presentationKeymap.workflows.summaryToPresentation,
    ...presentationKeymap.sectionAnchors,
    ...Object.values(presentationKeymap.actions).flat()
])];

const artifactKeymap = {
    intent: [
        'miniapp', 'miniapps', 'mini app', 'mini apps', 'mini-app', 'mini-apps',
        'mini application', 'mini applications', 'mini-application', 'mini-applications',
        'artifact', 'artifacts', 'artefact', 'artefacts',
        'html miniapp', 'html miniapps', 'html mini app', 'html mini apps', 'html mini-app', 'html mini-apps',
        'html artifact', 'html artifacts', 'web miniapp', 'web miniapps', 'web mini app', 'web mini apps', 'web mini-app', 'web mini-apps',
        'miniaplicacion', 'miniaplicaciones', 'miniaplicación', 'miniaplicaciones', 'mini app', 'mini apps', 'mini-app', 'mini-apps', 'artefacto', 'artefactos',
        'miniaplicacao', 'miniaplicacoes', 'miniaplicação', 'miniaplicações', 'mini app', 'mini apps', 'mini-app', 'mini-apps', 'artefato', 'artefatos',
        'mini application', 'mini applications', 'mini-application', 'mini-applications', 'mini app', 'mini apps', 'mini-app', 'mini-apps', 'artefact', 'artefacts',
        'mini anwendung', 'mini anwendungen', 'mini-anwendung', 'mini-anwendungen', 'mini app', 'mini apps', 'mini-app', 'mini-apps', 'miniapp', 'miniapps', 'artefakt', 'artefakte',
        'mini applicazione', 'mini applicazioni', 'mini-applicazione', 'mini-applicazioni', 'mini app', 'mini apps', 'mini-app', 'mini-apps', 'miniapp', 'miniapps', 'artefatto', 'artefatti',
        'мини-приложение', 'мини-приложения', 'мини приложение', 'мини приложения', 'миниапп', 'миниаппы', 'артефакт', 'артефакты',
        '迷你应用', '迷你应用程序', '小应用', '小程序', '工件', '网页小应用',
        'ミニアプリ', 'ミニアプリケーション', '小さなアプリ', 'アーティファクト',
        '미니앱', '미니앱들', '미니 앱', '미니 앱들', '미니어플', '아티팩트'
    ],
    actions: {
        create: [
            'create', 'make', 'build', 'generate', 'prepare', 'craft', 'design',
            'crear', 'hacer', 'generar', 'preparar', 'disenar', 'diseñar',
            'criar', 'fazer', 'gerar', 'preparar', 'montar',
            'creer', 'créer', 'generer', 'générer', 'preparer', 'préparer', 'concevoir',
            'erstellen', 'machen', 'generieren', 'vorbereiten', 'entwerfen',
            'creare', 'fare', 'generare', 'preparare', 'progettare',
            'создать', 'сделать', 'сгенерировать', 'подготовить',
            '创建', '生成', '制作', '构建',
            '作成', '生成', '作る', '構築',
            '만들어', '생성', '작성', '구성'
        ],
        browse: [
            'show', 'list', 'open', 'browse', 'view', 'find', 'choose', 'select', 'pick',
            'mostrar', 'lista', 'listar', 'abrir', 'ver', 'buscar', 'elige', 'elegir', 'seleccionar', 'mostrarme', 'muéstrame',
            'mostrar', 'listar', 'abrir', 'ver', 'procurar', 'buscar', 'escolher', 'selecionar', 'mostra-me',
            'afficher', 'lister', 'ouvrir', 'parcourir', 'voir', 'chercher', 'choisir', 'selectionner', 'sélectionner', 'montre-moi',
            'zeigen', 'auflisten', 'offnen', 'öffnen', 'durchsuchen', 'ansehen', 'finden', 'auswahlen', 'auswählen', 'zeig', 'zeig mir',
            'mostrare', 'elencare', 'aprire', 'sfogliare', 'vedere', 'cercare', 'scegliere', 'selezionare', 'mostrami',
            'показать', 'список', 'перечислить', 'открыть', 'просмотреть', 'найти', 'выбрать',
            '查看', '显示', '列出', '打开', '浏览', '选择', '查找',
            '表示', '一覧', '開く', '閲覧', '確認', '選択', '探す',
            '보여', '목록', '열기', '찾아', '선택', '확인'
        ],
        send: [
            'send', 'share', 'deliver', 'export', 'send me',
            'enviar', 'enviame', 'envíame', 'mandar', 'mandame', 'mándame', 'compartir',
            'enviar', 'envia-me', 'manda-me', 'partilhar', 'compartilhar',
            'envoyer', 'envoie-moi', 'partager',
            'senden', 'sende mir', 'teilen',
            'inviare', 'inviami', 'condividere',
            'отправить', 'поделиться',
            '发送', '分享',
            '送信', '共有',
            '보내', '전송', '공유'
        ]
    },
    savedCues: [
        'saved miniapp', 'saved miniapps', 'saved artifact', 'saved artifacts', 'existing miniapp', 'existing miniapps', 'my miniapp', 'my miniapps', 'my artifact', 'my artifacts',
        'miniaplicacion guardada', 'miniaplicación guardada', 'miniaplicaciones guardadas', 'artefacto guardado', 'artefactos guardados', 'mi miniaplicacion', 'mi miniaplicación', 'mis miniaplicaciones', 'mi artefacto', 'mis artefactos',
        'miniaplicacao guardada', 'miniaplicação guardada', 'miniaplicacoes guardadas', 'miniaplicações guardadas', 'artefato guardado', 'artefatos guardados', 'minha miniaplicacao', 'minha miniaplicação', 'minhas miniaplicações', 'meu artefato', 'meus artefatos',
        'miniapp enregistree', 'miniapp enregistrée', 'miniapps enregistrees', 'miniapps enregistrées', 'artefact enregistre', 'artefact enregistré', 'artefacts enregistres', 'artefacts enregistrés', 'ma miniapp', 'mes miniapps', 'mon artefact', 'mes artefacts',
        'gespeicherte mini app', 'gespeicherte mini-app', 'gespeicherte miniapps', 'gespeichertes artefakt', 'gespeicherte artefakte', 'meine miniapp', 'meine miniapps', 'mein artefakt', 'meine artefakte',
        'mini app salvata', 'miniapp salvata', 'miniapp salvate', 'artefatto salvato', 'artefatti salvati', 'la mia miniapp', 'le mie miniapp', 'il mio artefatto', 'i miei artefatti',
        'сохраненное мини-приложение', 'сохраненные мини-приложения', 'сохраненный артефакт', 'сохраненные артефакты', 'мое мини-приложение', 'мои мини-приложения',
        '已保存的迷你应用', '已保存的小应用', '已保存的工件', '我的迷你应用', '我的工件',
        '保存済みのミニアプリ', '保存済みのアーティファクト', '自分のミニアプリ', '自分のアーティファクト',
        '저장된 미니앱', '저장된 미니 앱', '저장된 아티팩트', '내 미니앱', '내 아티팩트'
    ],
    followUpCloseCues: commonFollowUpCloseCues,
    followUpContinueCues: commonFollowUpContinueCues,
    webCues: [
        'use internet', 'use the internet', 'use web', 'use the web', 'with web search', 'using web search', 'search the web', 'search online', 'use online sources',
        'usa internet', 'usa el internet', 'usa la web', 'con busqueda web', 'con búsqueda web', 'buscar en la web', 'usa fuentes en linea', 'usa fuentes en línea',
        'usa internet', 'usa a internet', 'usa a web', 'com pesquisa web', 'pesquisar na web', 'usa fontes online',
        'utilise internet', 'utiliser internet', 'utilise le web', 'avec recherche web', 'chercher sur le web', 'utilise des sources en ligne',
        'nutze internet', 'nutze das internet', 'nutze das web', 'mit websuche', 'im web suchen', 'online quellen nutzen',
        'usa internet', 'usa il web', 'con ricerca web', 'cerca sul web', 'usa fonti online',
        'используй интернет', 'используй веб', 'с веб-поиском', 'ищи в интернете', 'используй онлайн источники',
        '使用互联网', '使用网络', '使用网页搜索', '联网搜索', '使用在线资料',
        'インターネットを使って', 'ウェブを使って', 'ウェブ検索を使って', 'オンラインで検索して', 'オンライン情報を使って',
        '인터넷을 사용해서', '웹을 사용해서', '웹 검색을 사용해서', '온라인에서 검색해서', '온라인 자료를 사용해서'
    ]
};

artifactKeymap.terms = [...new Set([
    ...artifactKeymap.intent,
    ...artifactKeymap.savedCues,
    ...artifactKeymap.webCues,
    ...Object.values(artifactKeymap.actions).flat()
])];

const modelKeymap = {
    nouns: [
        'model', 'models', 'my model', 'my models', 'installed model', 'installed models', 'available model', 'available models', 'ai model', 'ai models',
        'modelo', 'modelos', 'mi modelo', 'mis modelos', 'modelo instalado', 'modelos instalados', 'modelo disponible', 'modelos disponibles',
        'modelo', 'modelos', 'meu modelo', 'meus modelos', 'modelo instalado', 'modelos instalados', 'modelo disponivel', 'modelo disponível', 'modelos disponiveis', 'modelos disponíveis',
        'modele', 'modèle', 'modeles', 'modèles', 'mon modele', 'mon modèle', 'mes modeles', 'mes modèles', 'modele installe', 'modèle installé', 'modeles installes', 'modèles installés',
        'modell', 'modelle', 'mein modell', 'meine modelle', 'installiertes modell', 'installierte modelle', 'verfugbare modelle', 'verfügbare modelle',
        'modello', 'modelli', 'mio modello', 'miei modelli', 'modello installato', 'modelli installati', 'modello disponibile', 'modelli disponibili',
        'модель', 'модели', 'моя модель', 'мои модели', 'установленная модель', 'доступные модели',
        '模型', '我的模型', '可用模型', '已安装模型',
        'モデル', '自分のモデル', '利用可能なモデル', 'インストール済みモデル',
        '모델', '내 모델', '사용 가능한 모델', '설치된 모델'
    ],
    actions: {
        current: [
            'current model', 'selected model', 'active model', 'used model', 'model in use', 'what model is selected', 'what model is selected now', 'what model is used now', 'which model is selected', 'which model are you using', 'what are you using now',
            'modelo actual', 'modelo seleccionado', 'modelo activo', 'modelo en uso', 'que modelo esta seleccionado', 'qué modelo está seleccionado', 'que modelo usas ahora', 'qué modelo usas ahora', 'cual es el modelo actual', 'cuál es el modelo actual',
            'modelo atual', 'modelo selecionado', 'modelo activo', 'modelo em uso', 'qual modelo esta selecionado', 'qual modelo está selecionado', 'qual modelo esta usando', 'qual modelo está usando', 'qual e o modelo atual', 'qual é o modelo atual',
            'modele actuel', 'modèle actuel', 'modele selectionne', 'modèle sélectionné', 'modele actif', 'modèle actif', 'modele utilise', 'modèle utilisé', 'quel modele est selectionne', 'quel modèle est sélectionné', 'quel modele utilises tu', 'quel modèle utilises-tu',
            'aktuelles modell', 'ausgewahltes modell', 'ausgewähltes modell', 'aktives modell', 'verwendetes modell', 'welches modell ist ausgewahlt', 'welches modell ist ausgewählt', 'welches modell nutzt du',
            'modello attuale', 'modello selezionato', 'modello attivo', 'modello in uso', 'quale modello e selezionato', 'quale modello è selezionato', 'quale modello stai usando',
            'текущая модель', 'выбранная модель', 'активная модель', 'какая модель выбрана', 'какую модель ты используешь',
            '当前模型', '已选模型', '正在使用的模型', '现在用的模型', '现在选择的模型',
            '現在のモデル', '選択中のモデル', '使用中のモデル', '今使っているモデル',
            '현재 모델', '선택된 모델', '사용 중인 모델', '지금 쓰는 모델'
        ],
        list: [
            'show', 'list', 'show my models', 'show me my models', 'list my models', 'what models do i have', 'which models do i have', 'available models', 'installed models',
            'mostrar', 'mostrar mis modelos', 'muestrame mis modelos', 'muéstrame mis modelos', 'listar', 'lista mis modelos', 'que modelos tengo', 'qué modelos tengo', 'cuales son mis modelos', 'cuáles son mis modelos', 'modelos disponibles', 'modelos instalados',
            'mostrar', 'mostra meus modelos', 'mostra me meus modelos', 'listar', 'liste meus modelos', 'quais modelos eu tenho', 'quais sao meus modelos', 'quais são meus modelos', 'modelos disponiveis', 'modelos disponíveis', 'modelos instalados',
            'afficher', 'montre moi mes modeles', 'montre-moi mes modèles', 'liste', 'lister', 'liste mes modeles', 'liste mes modèles', 'quels modeles ai je', 'quels modèles ai-je', 'modeles disponibles', 'modèles disponibles', 'modeles installes', 'modèles installés',
            'zeigen', 'zeige meine modelle', 'liste meine modelle', 'welche modelle habe ich', 'verfugbare modelle', 'verfügbare modelle', 'installierte modelle',
            'mostra', 'mostrami i miei modelli', 'elenca i miei modelli', 'quali modelli ho', 'modelli disponibili', 'modelli installati',
            'покажи мои модели', 'список моделей', 'какие модели у меня есть', 'доступные модели', 'установленные модели',
            '显示我的模型', '列出我的模型', '我有哪些模型', '可用模型', '已安装模型',
            'モデルを表示', '自分のモデルを表示', 'モデル一覧', '使えるモデル', 'インストール済みモデル',
            '내 모델 보여줘', '모델 목록', '사용 가능한 모델', '설치된 모델'
        ],
        use: [
            'use', 'use model', 'switch to', 'switch model to', 'switch the model to', 'change to', 'change model to', 'change the model to', 'set model to', 'set the model to', 'select', 'choose',
            'usar', 'usar modelo', 'usa', 'cambiar a', 'cambia a', 'cambiar el modelo a', 'cambia el modelo a', 'poner modelo', 'poner el modelo en', 'seleccionar', 'elige',
            'usar', 'usar modelo', 'usa', 'mudar para', 'mudar o modelo para', 'trocar para', 'trocar o modelo para', 'definir modelo', 'definir o modelo para', 'selecionar', 'escolher',
            'utiliser', 'utiliser le modele', 'utiliser le modèle', 'passer a', 'passer à', 'passer le modele a', 'passer le modèle à', 'changer pour', 'changer le modele pour', 'changer le modèle pour', 'definir le modele', 'définir le modèle', 'selectionner', 'sélectionner', 'choisir',
            'verwende', 'nutze', 'benutze', 'modell verwenden', 'wechsle zu', 'wechsel zu', 'wechsle das modell zu', 'wechsel das modell zu', 'andere das modell zu', 'ändere das modell zu', 'setze modell auf', 'setze das modell auf', 'auswahlen', 'auswählen', 'wahlen', 'wählen',
            'usa', 'usa modello', 'passa a', 'passa il modello a', 'cambia a', 'cambia il modello a', 'imposta il modello', 'imposta il modello su', 'seleziona', 'scegli',
            'используй', 'используй модель', 'переключи на', 'смени на', 'выбери', 'установи модель',
            '使用', '使用模型', '切换到', '改用', '选择', '设为模型',
            '使う', 'モデルを使う', '切り替え', '変更して', '選択',
            '사용', '모델 사용', '바꿔', '전환', '선택', '모델로 설정'
        ]
    },
    providers: {
        local: [
            'local', 'locally', 'on device', 'device', 'local model',
            'local', 'localmente', 'modelo local',
            'local', 'localmente', 'modelo local',
            'local', 'localement', 'modele local', 'modèle local',
            'lokal', 'lokales modell',
            'locale', 'modello locale',
            'локально', 'локальная', 'локальная модель', 'локально установленная',
            '本地', '本地模型',
            'ローカル', 'ローカルモデル',
            '로컬', '로컬 모델'
        ],
        cloud: [
            'cloud', 'online', 'remote', 'cloud model',
            'nube', 'en la nube', 'modelo en la nube',
            'nuvem', 'na nuvem', 'modelo na nuvem',
            'cloud', 'nuage', 'en ligne', 'modele cloud', 'modèle cloud',
            'cloud', 'online', 'fern', 'cloud modell',
            'cloud', 'nuvola', 'modello cloud',
            'облако', 'облачная', 'облачная модель',
            '云端', '云', '云模型',
            'クラウド', 'クラウドモデル',
            '클라우드', '클라우드 모델'
        ]
    },
    fillers: [
        'please', 'my', 'the', 'to', 'for', 'now',
        'por favor', 'mi', 'mis', 'el', 'la', 'los', 'las', 'para', 'ahora',
        'por favor', 'meu', 'meus', 'minha', 'minhas', 'o', 'a', 'os', 'as', 'para', 'agora',
        's il vous plait', 's il te plait', 'mon', 'mes', 'le', 'la', 'les', 'pour', 'maintenant',
        'bitte', 'mein', 'meine', 'das', 'der', 'die', 'den', 'zu', 'jetzt',
        'per favore', 'mio', 'mia', 'miei', 'mie', 'il', 'la', 'i', 'le', 'per', 'adesso',
        'пожалуйста', 'мой', 'моя', 'мои', 'для', 'сейчас',
        '请', '我的', '现在',
        'お願いします', '私の', '今',
        '제발', '내', '지금'
    ]
};

modelKeymap.terms = [...new Set([
    ...modelKeymap.nouns,
    ...modelKeymap.fillers,
    ...Object.values(modelKeymap.actions).flat(),
    ...Object.values(modelKeymap.providers).flat()
])];

const chatKeymap = {
    actions: {
        regenerate: [
            'regenerate', 'retry', 'try again', 'send again', 'repeat that', 'repeat last', 'do it again',
            'regenerar', 'reintentar', 'intentar de nuevo', 'repite eso', 'repetir eso', 'repite el ultimo', 'repite el último', 'hazlo de nuevo',
            'regenerar', 'tentar novamente', 'reenviar', 'repete isso', 'repetir isso', 'repete o ultimo', 'repete o último', 'faz de novo',
            'regenerer', 'régénérer', 'reessayer', 'réessayer', 'renvoyer', 'repete ca', 'répète ça', 'repeter', 'répéter', 'refais',
            'regenerieren', 'erneut versuchen', 'wiederholen', 'nochmal', 'noch einmal', 'erneut senden',
            'rigenera', 'riprova', 'invia di nuovo', 'ripeti', 'ripeti questo', 'rifallo',
            'повтори', 'попробуй снова', 'регенерируй', 'отправь снова',
            '重新生成', '重试', '再试一次', '再来一次', '重新发送',
            '再生成', 'やり直し', 'もう一度', '再送',
            '다시 생성', '다시 시도', '한 번 더', '다시 보내'
        ]
    },
    fillers: [
        'please', 'pls', 'plz',
        'por favor',
        's il vous plait', 's il te plait',
        'bitte',
        'per favore',
        'пожалуйста',
        '请',
        'お願いします',
        '제발'
    ]
};

chatKeymap.terms = [...new Set([
    ...Object.values(chatKeymap.actions).flat(),
    ...chatKeymap.fillers
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
    presentation: presentationKeymap,
    artifact: artifactKeymap,
    model: modelKeymap,
    chat: chatKeymap
};
