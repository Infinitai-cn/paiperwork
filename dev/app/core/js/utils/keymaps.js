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
        'документ', 'документы', 'файл', 'файлы', 'отчет', 'отчеты', 'отчёт', 'отчёты', 'договор', 'договоры',
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
            'показать', 'список', 'перечислить', 'открыть', 'просмотреть', 'проверить', 'посмотреть', 'найти', 'выбрать',
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
            'сводка', 'резюме', 'суммировать', 'кратко изложить',
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
            'вопрос', 'вопросы', 'спросить', 'объяснить', 'описать', 'рассказать о',
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
            'выйти из режима документов', 'выйти из режима документа', 'вернуться в обычный чат',
            '退出文档模式', '退出', '关闭文档模式', '离开文档模式', '返回普通聊天',
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
        'кто', 'что', 'когда', 'где', 'почему', 'как', 'какой', 'какая', 'какие',
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
        'привет', 'спасибо',
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

const commonFollowUpCloseCueGroups = {
    English: ['no', 'no thanks', 'no thank you', 'im finished', "i'm finished", 'i am finished', 'finished', 'im good', "i'm good", 'i am good', 'all good', 'looks good', 'thats all', "that's all", 'no more changes', 'no more modifications', 'stop modifying', 'done'],
    Spanish: ['no', 'no gracias', 'estoy bien', 'ya termine', 'ya terminé', 'terminado', 'listo', 'sin mas cambios', 'sin más cambios', 'no mas cambios', 'no más cambios'],
    Portuguese: ['nao', 'não', 'nao obrigado', 'não obrigado', 'estou bem', 'ja terminei', 'já terminei', 'terminado', 'pronto', 'sem mais alteracoes', 'sem mais alterações'],
    French: ['non', 'non merci', 'cest bon', "c'est bon", 'je suis bon', 'jai fini', "j'ai fini", 'termine', 'terminé', 'plus de modifications', 'cest tout', "c'est tout"],
    German: ['nein', 'nein danke', 'ich bin fertig', 'fertig', 'alles gut', 'sieht gut aus', 'keine weiteren anderungen', 'keine weiteren änderungen', 'das ist alles'],
    Italian: ['no', 'no grazie', 'ho finito', 'finito', 'va bene cosi', 'va bene così', 'nessun altra modifica', "nessun'altra modifica", 'basta cosi', 'basta così'],
    Russian: ['нет', 'нет спасибо', 'я закончил', 'я закончила', 'готово', 'все хорошо', 'всё хорошо', 'без изменений', 'без дальнейших изменений'],
    Chinese: ['不用了', '不用', '不用，谢谢', '不需要', '好了', '我好了', '我没问题', '完成了', '我完成了', '结束', '不需要再修改'],
    Japanese: ['いいえ', '大丈夫', 'これでいい', 'これで大丈夫', '終わり', '完了', 'もういい', 'もう修正はいらない'],
    Korean: ['아니요', '괜찮아요', '됐어요', '끝났어요', '끝', '좋아요', '수정은 더 필요 없어요'],
    Arabic: ['لا', 'لا شكرا', 'لا شكرًا', 'انتهيت', 'أنا انتهيت', 'تم', 'هذا يكفي', 'لا مزيد من التعديلات'],
    Hindi: ['नहीं', 'नहीं धन्यवाद', 'मैं समाप्त कर चुका हूं', 'मैं समाप्त कर चुकी हूं', 'खत्म', 'हो गया', 'बस', 'और बदलाव नहीं']
};

const researchExitCueGroups = {
    English: ['exit research mode', 'leave research mode', 'close research mode', 'stop research mode'],
    Spanish: ['salir del modo de investigación', 'salir del modo de investigacion', 'cerrar el modo de investigación', 'cerrar el modo de investigacion'],
    Portuguese: ['sair do modo de pesquisa', 'fechar o modo de pesquisa', 'encerrar o modo de pesquisa'],
    French: ['quitter le mode recherche', 'fermer le mode recherche', 'sortir du mode recherche'],
    German: ['recherchemodus verlassen', 'recherchemodus schließen', 'recherchemodus schliessen'],
    Italian: ['uscire dalla modalità ricerca', 'uscire dalla modalita ricerca', 'chiudere la modalità ricerca', 'chiudere la modalita ricerca'],
    Russian: ['выйти из режима исследования', 'закрыть режим исследования', 'завершить режим исследования'],
    Chinese: ['退出研究模式', '关闭研究模式'],
    Japanese: ['リサーチモードを終了', 'リサーチモードを閉じる', '研究モードを終了'],
    Korean: ['리서치 모드 종료', '리서치 모드 닫기', '연구 모드 종료'],
    Arabic: ['الخروج من وضع البحث', 'إغلاق وضع البحث', 'اغلاق وضع البحث', 'إنهاء وضع البحث'],
    Hindi: ['रिसर्च मोड से बाहर निकलो', 'रिसर्च मोड बंद करो', 'शोध मोड से बाहर निकलो', 'शोध मोड बंद करो']
};

const commonFollowUpContinueCueGroups = {
    English: ['yes', 'yes please', 'sure', 'ok', 'okay', 'continue', 'keep going', 'more changes', 'modify more', 'lets continue', "let's continue"],
    Spanish: ['si', 'sí', 'si por favor', 'sí por favor', 'claro', 'vale', 'continuar', 'sigue', 'mas cambios', 'más cambios'],
    Portuguese: ['sim', 'sim por favor', 'claro', 'ok', 'continuar', 'continua', 'continue', 'mais alteracoes', 'mais alterações'],
    French: ['oui', 'oui sil vous plait', 'oui s il vous plait', 'bien sur', 'bien sûr', 'daccord', "d'accord", 'continuer', 'encore des modifications'],
    German: ['ja', 'ja bitte', 'klar', 'okay', 'weiter', 'weitermachen', 'mehr anderungen', 'mehr änderungen'],
    Italian: ['si', 'sì', 'si per favore', 'sì per favore', 'certo', 'ok', 'continua', 'continuare', 'piu modifiche', 'più modifiche'],
    Russian: ['да', 'да пожалуйста', 'конечно', 'продолжай', 'еще изменения', 'ещё изменения'],
    Chinese: ['是', '好的', '继续', '继续修改', '还要修改'],
    Japanese: ['はい', 'お願いします', '続けて', '続行', 'まだ修正したい'],
    Korean: ['네', '예', '계속', '계속해줘', '더 수정할게요'],
    Arabic: ['نعم', 'نعم من فضلك', 'بالتأكيد', 'حسنا', 'حسنًا', 'استمر', 'واصل', 'المزيد من التعديلات'],
    Hindi: ['हाँ', 'हां', 'हाँ कृपया', 'ज़रूर', 'ठीक है', 'जारी रखें', 'आगे बढ़ो', 'और बदलाव']
};

const flattenCueGroups = (groups) => [...new Set(Object.values(groups).flat())];

const commonFollowUpCloseCues = flattenCueGroups(commonFollowUpCloseCueGroups);
const researchExitCues = flattenCueGroups(researchExitCueGroups);

const commonFollowUpContinueCues = flattenCueGroups(commonFollowUpContinueCueGroups);

const researchKeymap = {
    intent: [
        'research', 'investigate', 'investigation', 'analyze', 'analyse', 'analysis', 'study', 'explore', 'examine',
        'investigar', 'investigacion', 'investigación', 'analizar', 'analise', 'análisis', 'estudiar', 'explorar', 'examinar',
        'investigar', 'investigacao', 'investigação', 'analisar', 'analise', 'análise', 'estudar', 'explorar', 'examinar',
        'recherche', 'rechercher', 'analyser', 'analyse', 'etudier', 'étudier', 'explorer', 'examiner',
        'forschung', 'recherchieren', 'analysieren', 'analyse', 'untersuchen', 'studieren',
        'ricerca', 'ricercare', 'analizzare', 'analisi', 'studiare', 'esplorare', 'esaminare',
        'исследование', 'исследовать', 'изучить', 'анализ', 'проанализировать',
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
            'подготовить', 'создать', 'написать', 'сгенерировать', 'собрать',
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
            'сравнить', 'сравнение',
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
        'отчет', 'отчеты', 'отчёт', 'отчёты', 'вывод', 'выводы', 'возможность', 'возможности', 'стратегия', 'стратегии',
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
        'последние', 'актуальные', 'недавние', 'глубокий', 'подробный', 'рынок', 'конкурент', 'конкуренты', 'отрасль', 'тренд', 'тренды',
        '最新', '当前', '最近', '深入', '全面', '详细', '市场', '竞争对手', '行业', '趋势',
        '最新', '現在', '最近', '詳細', '包括的', '市場', '競合', '業界', '動向', 'トレンド',
        '최신', '현재', '최근', '심층', '종합', '상세', '시장', '경쟁사', '업계', '동향', '트렌드'
    ],
    followUpCloseCues: [...new Set([...commonFollowUpCloseCues, ...researchExitCues])],
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
        '프레젠테이션', '슬라이드', '발표자료',
        'عرض تقديمي', 'عروض تقديمية', 'شرائح',
        'प्रस्तुति', 'प्रस्तुतियाँ', 'प्रस्तुतियां', 'स्लाइड', 'स्लाइड्स'
    ],
    actions: {
        create: [
            'create', 'make', 'build', 'generate', 'prepare', 'craft', 'design', 'turn into', 'convert into',
            'crear', 'crea', 'creame', 'créame', 'hacer', 'haz', 'hazme', 'generar', 'genera', 'generame', 'genérame', 'preparar', 'prepara', 'preparame', 'prepárame', 'disenar', 'diseñar', 'disena', 'diseña', 'convertir en', 'convierte en',
            'criar', 'cria', 'cria-me', 'criame', 'fazer', 'faz', 'faz-me', 'fazeme', 'gerar', 'gera', 'gera-me', 'gerame', 'preparar', 'prepara', 'prepara-me', 'preparame', 'montar', 'monta', 'converter em', 'converte em',
            'creer', 'créer', 'cree', 'crée', 'cree-moi', 'crée-moi', 'generer', 'générer', 'genere', 'génère', 'prepare', 'preparer', 'préparer', 'prepare-moi', 'prépare-moi', 'concevoir', 'concois', 'conçois', 'transformer en', 'transforme en',
            'erstellen', 'erstelle', 'mach', 'machen', 'erzeuge', 'generieren', 'generiere', 'vorbereiten', 'bereite vor', 'entwerfen', 'entwirf', 'umwandeln in', 'wandle in',
            'creare', 'crea', 'creami', 'generare', 'genera', 'generami', 'preparare', 'prepara', 'preparami', 'progettare', 'progetta', 'trasformare in', 'trasforma in',
            'создать', 'сделать', 'подготовить', 'сгенерировать', 'собрать', 'преобразовать в',
            '创建', '生成', '制作', '整理成', '转换成',
            '作成', '生成', '作る', '変換',
            '만들어', '생성', '작성', '구성', '변환',
            'أنشئ', 'انشئ', 'أنشئ لي', 'انشئ لي', 'اصنع', 'جهز', 'جهّز', 'كوّن', 'حوّل إلى',
            'बनाओ', 'बनाइए', 'तैयार करो', 'तैयार कीजिए', 'बनाना', 'तैयार करना', 'बना दो', 'रूपांतरित करो'
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
            '보여', '목록', '열기', '찾아', '선택', '확인',
            'اعرض', 'أرني', 'ارني', 'قائمة', 'افتح', 'تصفح', 'اختر', 'ابحث',
            'दिखाओ', 'दिखाइए', 'सूची', 'खोलो', 'खोलिए', 'देखो', 'चुनो', 'चुनिए', 'खोजो', 'ढूंढो'
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
            '보내', '전송', '공유',
            'أرسل', 'ارسل', 'أرسل لي', 'ارسل لي', 'شارك',
            'भेजो', 'भेजिए', 'मुझे भेजो', 'मुझे भेजिए', 'साझा करो'
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
        '이 텍스트로', '다음 텍스트로', '제공한 텍스트', '제공된 내용으로',
        'بهذا النص', 'باستخدام هذا النص', 'باستخدام النص التالي', 'من هذا النص', 'استنادا إلى هذا النص', 'استنادًا إلى هذا النص', 'النص المقدم', 'المحتوى المقدم',
        'इस पाठ के साथ', 'इस टेक्स्ट के साथ', 'निम्नलिखित पाठ के साथ', 'निम्नलिखित टेक्स्ट के साथ', 'इस पाठ का उपयोग करके', 'इस टेक्स्ट का उपयोग करके', 'इस पाठ से', 'इस टेक्स्ट से', 'दिया गया पाठ', 'दिया गया टेक्स्ट', 'प्रदान किया गया पाठ', 'प्रदान की गई सामग्री'
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
        '저장된 프레젠테이션', '내 프레젠테이션',
        'عرض تقديمي محفوظ', 'عروض تقديمية محفوظة', 'عرضي التقديمي', 'عروضي التقديمية',
        'सहेजी गई प्रस्तुति', 'सहेजी गई प्रस्तुतियाँ', 'सहेजी गई प्रस्तुतियां', 'मेरी प्रस्तुति', 'मेरी प्रस्तुतियाँ', 'मेरी प्रस्तुतियां'
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
        '웹 검색 사용', '인터넷 사용', '웹에서 검색', '온라인 검색', '온라인 출처 사용',
        'استخدم الإنترنت', 'استخدم الويب', 'استخدم البحث على الويب', 'مع بحث الويب', 'ابحث على الويب', 'ابحث عبر الإنترنت', 'استخدم مصادر عبر الإنترنت',
        'इंटरनेट का उपयोग करो', 'वेब का उपयोग करो', 'वेब खोज का उपयोग करो', 'वेब खोज के साथ', 'वेब पर खोजो', 'ऑनलाइन खोजो', 'ऑनलाइन स्रोतों का उपयोग करो'
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

const knowledgeKeymap = {
    intent: [
        'knowledge base', 'knowledge bases', 'knowledgebase', 'knowledge', 'stored knowledge', 'saved knowledge', 'kb',
        'base de conocimiento', 'base de conocimientos', 'bases de conocimiento', 'bases de conocimientos', 'conocimiento guardado', 'conocimiento almacenado', 'kb',
        'base de conhecimento', 'base de conhecimentos', 'bases de conhecimento', 'bases de conhecimentos', 'conhecimento guardado', 'conhecimento armazenado', 'kb',
        'base de connaissances', 'bases de connaissances', 'connaissances enregistrees', 'connaissances enregistrées', 'kb',
        'wissensdatenbank', 'wissensdatenbanken', 'wissensbasis', 'wissensbasen', 'gespeichertes wissen', 'kb',
        'base di conoscenza', 'base di conoscenze', 'basi di conoscenza', 'basi di conoscenze', 'conoscenza salvata', 'conoscenza archiviata', 'kb',
        'база знаний', 'базы знаний', 'сохраненные знания', 'знания',
        '知识库', '已保存知识', '知识',
        'ナレッジベース', '保存済みナレッジ', '知識ベース',
        '지식 베이스', '저장된 지식', '지식'
    ],
    actions: {
        browse: [
            'show', 'show me', 'list', 'open', 'browse', 'view', 'see', 'find', 'choose', 'select', 'read',
            'mostrar', 'muestra', 'mostrarme', 'muestrame', 'muéstrame', 'lista', 'listar', 'abrir', 'ver', 'buscar', 'elige', 'seleccionar', 'leer',
            'mostrar', 'mostra', 'mostrar-me', 'mostra-me', 'listar', 'abrir', 'ver', 'procurar', 'buscar', 'escolher', 'selecionar', 'ler',
            'afficher', 'montre', 'montre moi', 'montre-moi', 'lister', 'ouvrir', 'parcourir', 'voir', 'chercher', 'choisir', 'selectionner', 'sélectionner', 'lire',
            'zeigen', 'zeig', 'zeig mir', 'auflisten', 'offnen', 'öffnen', 'durchsuchen', 'ansehen', 'finden', 'auswahlen', 'auswählen', 'lesen',
            'mostrare', 'mostra', 'mostrami', 'elencare', 'aprire', 'sfogliare', 'vedere', 'cercare', 'scegliere', 'selezionare', 'leggere',
            'показать', 'покажи', 'список', 'перечислить', 'открыть', 'просмотреть', 'найти', 'выбрать', 'читать',
            '查看', '显示', '列出', '打开', '浏览', '选择', '查找', '阅读',
            '表示', '見せて', '一覧', '開く', '閲覧', '確認', '選択', '探す', '読む',
            '보여', '보여줘', '목록', '열기', '찾아', '선택', '확인', '읽어'
        ]
    },
    collectionNouns: [
        'knowledge collection', 'knowledge collections', 'collection', 'collections',
        'coleccion de conocimiento', 'colección de conocimiento', 'colecciones de conocimiento',
        'colecao de conhecimento', 'coleção de conhecimento', 'colecoes de conhecimento', 'coleções de conhecimento',
        'collection de connaissances', 'collections de connaissances',
        'wissenssammlung', 'wissenssammlungen',
        'collezione di conoscenza', 'collezioni di conoscenza',
        'коллекция знаний', 'коллекции знаний',
        '知识集合', '知识库集合', '集合',
        'ナレッジコレクション', 'コレクション',
        '지식 컬렉션', '컬렉션'
    ],
    entryNouns: [
        'knowledge entry', 'knowledge entries', 'entry', 'entries', 'note', 'notes', 'article', 'articles',
        'entrada de conocimiento', 'entradas de conocimiento', 'entrada', 'entradas', 'nota', 'notas', 'articulo', 'artículo', 'articulos', 'artículos',
        'entrada de conhecimento', 'entradas de conhecimento', 'entrada', 'entradas', 'nota', 'notas', 'artigo', 'artigos',
        'entree de connaissance', 'entrée de connaissance', 'entrees de connaissance', 'entrées de connaissance', 'entree', 'entrée', 'entrees', 'entrées', 'note', 'notes', 'article', 'articles',
        'wissenseintrag', 'wissenseintrage', 'wissenseinträge', 'eintrag', 'eintrage', 'einträge', 'notiz', 'notizen', 'artikel',
        'voce di conoscenza', 'voci di conoscenza', 'voce', 'voci', 'nota', 'note', 'articolo', 'articoli',
        'запись знаний', 'записи знаний', 'запись', 'записи', 'заметка', 'заметки', 'статья', 'статьи',
        '知识条目', '条目', '笔记', '文章',
        'ナレッジエントリ', 'エントリ', 'ノート', '記事',
        '지식 항목', '항목', '노트', '문서'
    ],
    savedCues: [
        'saved knowledge base', 'saved knowledge bases', 'saved knowledge', 'stored knowledge base', 'stored knowledge bases', 'stored knowledge', 'my knowledge base', 'my knowledge bases', 'my saved knowledge base', 'my saved knowledge bases', 'my knowledge collections',
        'base de conocimiento guardada', 'bases de conocimiento guardadas', 'base de conocimientos guardada', 'bases de conocimientos guardadas', 'conocimiento guardado', 'base de conocimiento almacenada', 'base de conocimientos almacenada', 'mi base de conocimiento', 'mi base de conocimientos', 'mis bases de conocimiento', 'mis bases de conocimientos', 'mis colecciones de conocimiento',
        'base de conhecimento guardada', 'bases de conhecimento guardadas', 'base de conhecimentos guardada', 'bases de conhecimentos guardadas', 'conhecimento guardado', 'base de conhecimento armazenada', 'base de conhecimentos armazenada', 'minha base de conhecimento', 'minha base de conhecimentos', 'minhas bases de conhecimento', 'minhas bases de conhecimentos', 'minhas colecoes de conhecimento', 'minhas coleções de conhecimento',
        'base de connaissances enregistree', 'base de connaissances enregistrée', 'bases de connaissances enregistrees', 'bases de connaissances enregistrées', 'connaissances enregistrees', 'connaissances enregistrées', 'ma base de connaissances', 'mes bases de connaissances', 'mes collections de connaissances',
        'gespeicherte wissensdatenbank', 'gespeicherte wissensdatenbanken', 'gespeichertes wissen', 'meine wissensdatenbank', 'meine wissensdatenbanken', 'meine wissenssammlungen',
        'base di conoscenza salvata', 'basi di conoscenza salvate', 'base di conoscenze salvata', 'basi di conoscenze salvate', 'conoscenza salvata', 'la mia base di conoscenza', 'la mia base di conoscenze', 'le mie basi di conoscenza', 'le mie basi di conoscenze', 'le mie collezioni di conoscenza',
        'сохраненная база знаний', 'сохраненные базы знаний', 'сохраненные знания', 'моя база знаний', 'мои базы знаний', 'мои коллекции знаний',
        '已保存知识库', '保存的知识库', '我的知识库', '我的知识集合',
        '保存済みのナレッジベース', '保存済みのナレッジベース一覧', '保存済みナレッジ', '自分のナレッジベース', '自分のナレッジコレクション',
        '저장된 지식 베이스', '저장된 지식 베이스들', '저장된 지식', '내 지식 베이스', '내 지식 컬렉션'
    ],
    followUpCloseCues: commonFollowUpCloseCues,
    followUpContinueCues: commonFollowUpContinueCues
};

knowledgeKeymap.terms = [...new Set([
    ...knowledgeKeymap.intent,
    ...knowledgeKeymap.collectionNouns,
    ...knowledgeKeymap.entryNouns,
    ...knowledgeKeymap.savedCues,
    ...Object.values(knowledgeKeymap.actions).flat()
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
    sourceCues: [
        'with this summary', 'with the summary', 'from this summary', 'from the summary', 'based on this summary', 'based on the summary', 'use this summary', 'use the summary',
        'with this research', 'with the research', 'from this research', 'from the research', 'based on this research', 'based on the research', 'based on this report', 'based on the report', 'use this research', 'use the research', 'use this report', 'use the report',
        'with this knowledge base entry', 'with this knowledge entry', 'with this entry', 'from this knowledge base entry', 'from this knowledge entry', 'from this entry', 'based on this knowledge base entry', 'based on this knowledge entry', 'based on this entry', 'use this knowledge base entry', 'use this knowledge entry', 'use this entry',
        'con este resumen', 'con el resumen', 'a partir de este resumen', 'a partir del resumen', 'basado en este resumen', 'basado en el resumen', 'usa este resumen', 'usa el resumen',
        'con esta investigación', 'con esta investigacion', 'con la investigación', 'con la investigacion', 'a partir de esta investigación', 'a partir de esta investigacion', 'a partir de la investigación', 'a partir de la investigacion', 'basado en esta investigación', 'basado en esta investigacion', 'basado en el informe', 'usa esta investigación', 'usa esta investigacion', 'usa la investigación', 'usa la investigacion', 'usa este informe', 'usa el informe',
        'con esta entrada de la base de conocimiento', 'con esta entrada de conocimiento', 'con esta entrada', 'a partir de esta entrada de la base de conocimiento', 'a partir de esta entrada de conocimiento', 'a partir de esta entrada', 'basado en esta entrada de la base de conocimiento', 'basado en esta entrada de conocimiento', 'basado en esta entrada', 'usa esta entrada de la base de conocimiento', 'usa esta entrada de conocimiento', 'usa esta entrada',
        'com este resumo', 'com o resumo', 'a partir deste resumo', 'a partir do resumo', 'baseado neste resumo', 'baseado no resumo', 'usa este resumo', 'usa o resumo',
        'com esta pesquisa', 'com a pesquisa', 'a partir desta pesquisa', 'a partir da pesquisa', 'baseado nesta pesquisa', 'baseado na pesquisa', 'baseado neste relatório', 'baseado neste relatorio', 'baseado no relatório', 'baseado no relatorio', 'usa esta pesquisa', 'usa a pesquisa', 'usa este relatório', 'usa este relatorio', 'usa o relatório', 'usa o relatorio',
        'com esta entrada da base de conhecimento', 'com esta entrada de conhecimento', 'com esta entrada', 'a partir desta entrada da base de conhecimento', 'a partir desta entrada de conhecimento', 'a partir desta entrada', 'baseado nesta entrada da base de conhecimento', 'baseado nesta entrada de conhecimento', 'baseado nesta entrada', 'usa esta entrada da base de conhecimento', 'usa esta entrada de conhecimento', 'usa esta entrada',
        'avec ce resume', 'avec ce résumé', 'avec le resume', 'avec le résumé', 'a partir de ce resume', 'à partir de ce résumé', 'a partir du resume', 'à partir du résumé', 'base sur ce resume', 'basé sur ce résumé', 'utilise ce resume', 'utilise ce résumé', 'utilise le resume', 'utilise le résumé',
        'avec cette recherche', 'avec la recherche', 'a partir de cette recherche', 'à partir de cette recherche', 'a partir de la recherche', 'à partir de la recherche', 'base sur cette recherche', 'basé sur cette recherche', 'base sur ce rapport', 'basé sur ce rapport', 'utilise cette recherche', 'utilise la recherche', 'utilise ce rapport', 'utilise le rapport',
        'avec cette entree de la base de connaissances', 'avec cette entrée de la base de connaissances', 'avec cette entree de connaissance', 'avec cette entrée de connaissance', 'avec cette entree', 'avec cette entrée', 'a partir de cette entree de la base de connaissances', 'à partir de cette entrée de la base de connaissances', 'base sur cette entree de la base de connaissances', 'basé sur cette entrée de la base de connaissances', 'utilise cette entree de la base de connaissances', 'utilise cette entrée de la base de connaissances', 'utilise cette entree', 'utilise cette entrée',
        'mit dieser zusammenfassung', 'mit der zusammenfassung', 'aus dieser zusammenfassung', 'aus der zusammenfassung', 'basierend auf dieser zusammenfassung', 'basierend auf der zusammenfassung', 'nutze diese zusammenfassung', 'nutze die zusammenfassung',
        'mit dieser recherche', 'mit dem forschungsbericht', 'aus dieser recherche', 'aus dem forschungsbericht', 'basierend auf dieser recherche', 'basierend auf dem forschungsbericht', 'nutze diese recherche', 'nutze den forschungsbericht',
        'mit diesem wissenseintrag', 'mit diesem eintrag', 'aus diesem wissenseintrag', 'aus diesem eintrag', 'basierend auf diesem wissenseintrag', 'basierend auf diesem eintrag', 'nutze diesen wissenseintrag', 'nutze diesen eintrag',
        'con questo riassunto', 'con il riassunto', 'da questo riassunto', 'dal riassunto', 'basato su questo riassunto', 'basato sul riassunto', 'usa questo riassunto', 'usa il riassunto',
        'con questa ricerca', 'con la ricerca', 'da questa ricerca', 'dalla ricerca', 'basato su questa ricerca', 'basato sulla ricerca', 'basato su questo rapporto', 'basato sul rapporto', 'usa questa ricerca', 'usa la ricerca', 'usa questo rapporto', 'usa il rapporto',
        'con questa voce della base di conoscenza', 'con questa voce di conoscenza', 'con questa voce', 'da questa voce della base di conoscenza', 'da questa voce di conoscenza', 'da questa voce', 'basato su questa voce della base di conoscenza', 'basato su questa voce di conoscenza', 'basato su questa voce', 'usa questa voce della base di conoscenza', 'usa questa voce di conoscenza', 'usa questa voce',
        'с этой сводкой', 'с этой сводки', 'из этой сводки', 'на основе этой сводки', 'на основе сводки', 'используй эту сводку', 'используй сводку',
        'с этим исследованием', 'из этого исследования', 'на основе этого исследования', 'на основе исследования', 'на основе этого отчета', 'на основе этого отчёта', 'используй это исследование', 'используй исследование', 'используй этот отчет', 'используй этот отчёт',
        'с этой записью базы знаний', 'с этой записью знаний', 'с этой записью', 'из этой записи базы знаний', 'из этой записи знаний', 'из этой записи', 'на основе этой записи базы знаний', 'на основе этой записи знаний', 'на основе этой записи', 'используй эту запись базы знаний', 'используй эту запись знаний', 'используй эту запись',
        '用这份摘要', '根据这份摘要', '基于这份摘要', '使用这份摘要', '用摘要', '根据摘要',
        '用这份研究', '根据这份研究', '基于这份研究', '使用这份研究', '用这份报告', '根据这份报告', '基于这份报告', '使用这份报告', '根据研究', '根据报告',
        '用这个知识库条目', '根据这个知识库条目', '基于这个知识库条目', '使用这个知识库条目', '用这个条目', '根据这个条目',
        'この要約で', 'この要約から', '要約から', '要約を使って', 'この要約を使って',
        'このリサーチで', 'このリサーチから', 'リサーチから', 'このレポートで', 'このレポートから', 'レポートから', 'この研究を使って', 'このレポートを使って',
        'このナレッジエントリで', 'このナレッジベースのエントリで', 'このエントリで', 'このナレッジエントリから', 'このナレッジベースのエントリから', 'このエントリから', 'このナレッジエントリを使って', 'このエントリを使って',
        '이 요약으로', '이 요약에서', '요약으로', '요약을 사용해서', '이 요약을 사용해서',
        '이 리서치로', '이 리서치에서', '리서치로', '이 보고서로', '이 보고서에서', '보고서로', '이 리서치를 사용해서', '이 보고서를 사용해서',
        '이 지식 항목으로', '이 지식 베이스 항목으로', '이 항목으로', '이 지식 항목에서', '이 지식 베이스 항목에서', '이 항목에서', '이 지식 항목을 사용해서', '이 항목을 사용해서',
        'باستخدام هذا الملخص', 'باستخدام الملخص', 'من هذا الملخص', 'استنادا إلى هذا الملخص', 'استنادًا إلى هذا الملخص', 'اعتمادا على هذا الملخص', 'اعتمادًا على هذا الملخص',
        'باستخدام هذا البحث', 'باستخدام البحث', 'من هذا البحث', 'استنادا إلى هذا البحث', 'استنادًا إلى هذا البحث', 'باستخدام هذا التقرير', 'باستخدام التقرير', 'من هذا التقرير', 'استنادا إلى هذا التقرير', 'استنادًا إلى هذا التقرير',
        'باستخدام إدخال قاعدة المعرفة هذا', 'باستخدام إدخال المعرفة هذا', 'باستخدام هذا الإدخال', 'من إدخال قاعدة المعرفة هذا', 'من إدخال المعرفة هذا', 'استنادا إلى إدخال قاعدة المعرفة هذا', 'استنادًا إلى إدخال قاعدة المعرفة هذا', 'استنادا إلى هذا الإدخال', 'استنادًا إلى هذا الإدخال',
        'इस सारांश के साथ', 'इस सारांश से', 'इस सारांश के आधार पर', 'सारांश के आधार पर', 'इस सारांश का उपयोग करके',
        'इस रिसर्च के साथ', 'इस रिसर्च से', 'इस शोध के साथ', 'इस शोध से', 'इस रिसर्च के आधार पर', 'इस शोध के आधार पर', 'इस रिपोर्ट के साथ', 'इस रिपोर्ट से', 'इस रिपोर्ट के आधार पर', 'इस रिसर्च का उपयोग करके', 'इस शोध का उपयोग करके', 'इस रिपोर्ट का उपयोग करके',
        'इस नॉलेज बेस एंट्री के साथ', 'इस नॉलेज एंट्री के साथ', 'इस एंट्री के साथ', 'इस नॉलेज बेस एंट्री से', 'इस नॉलेज एंट्री से', 'इस एंट्री से', 'इस नॉलेज बेस एंट्री के आधार पर', 'इस नॉलेज एंट्री के आधार पर', 'इस एंट्री के आधार पर', 'इस नॉलेज बेस एंट्री का उपयोग करके', 'इस नॉलेज एंट्री का उपयोग करके', 'इस एंट्री का उपयोग करके'
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
    ],
    workflows: {
        summaryToArtifact: [
            'summarize and create a miniapp', 'summarise and create a miniapp', 'summary and create a miniapp', 'summary and miniapp', 'summary miniapp',
            'summarize then create a miniapp', 'summarise then create a miniapp', 'create a miniapp from the summary', 'make a miniapp from the summary', 'use the summary to create a miniapp',
            'summarize and create an artifact', 'summary and artifact', 'create an artifact from the summary', 'use the summary to create an artifact',
            'resumir y crear una miniaplicación', 'resumir y crear una miniaplicacion', 'resumen y crear una miniaplicación', 'resumen y crear una miniaplicacion', 'resumen y miniaplicación', 'resumen y miniaplicacion', 'resumen miniaplicación', 'resumen miniaplicacion', 'crear una miniaplicación con el resumen', 'crear una miniaplicacion con el resumen', 'usar el resumen para crear una miniaplicación', 'usar el resumen para crear una miniaplicacion',
            'resumir e criar uma miniaplicação', 'resumir e criar uma miniaplicacao', 'resumo e criar uma miniaplicação', 'resumo e criar uma miniaplicacao', 'resumo e miniaplicação', 'resumo e miniaplicacao', 'resumo miniaplicação', 'resumo miniaplicacao', 'criar uma miniaplicação com o resumo', 'criar uma miniaplicacao com o resumo', 'usar o resumo para criar uma miniaplicação', 'usar o resumo para criar uma miniaplicacao',
            'résumer et créer une miniapp', 'resumer et creer une miniapp', 'résumé et créer une miniapp', 'resume et creer une miniapp', 'résumé et miniapp', 'resume et miniapp', 'résumé miniapp', 'resume miniapp', 'créer une miniapp à partir du résumé', 'creer une miniapp a partir du resume', 'utiliser le résumé pour créer une miniapp', 'utiliser le resume pour creer une miniapp',
            'zusammenfassen und eine miniapp erstellen', 'zusammenfassung und eine miniapp erstellen', 'zusammenfassung und miniapp', 'zusammenfassung miniapp', 'eine miniapp aus der zusammenfassung erstellen', 'mit der zusammenfassung eine miniapp erstellen',
            'riassumere e creare una miniapp', 'riassunto e creare una miniapp', 'riassunto e miniapp', 'riassunto miniapp', 'creare una miniapp dal riassunto', 'usare il riassunto per creare una miniapp',
            'сделать сводку и создать мини-приложение', 'сводка и мини-приложение', 'создать мини-приложение из сводки', 'использовать сводку для создания мини-приложения',
            '总结并创建迷你应用', '摘要并创建迷你应用', '摘要和迷你应用', '总结和迷你应用', '根据摘要创建迷你应用', '用摘要创建迷你应用',
            '要約してミニアプリを作成', '要約とミニアプリ', '要約ミニアプリ', '要約からミニアプリを作成', '要約を使ってミニアプリを作成',
            '요약하고 미니앱 만들기', '요약과 미니앱', '요약 미니앱', '요약으로 미니앱 만들기', '요약을 사용해 미니앱 만들기',
            'لخص وأنشئ ميني آب', 'لخص وأنشئ تطبيقا مصغرا', 'لخّص وأنشئ تطبيقًا مصغرًا', 'الملخص وميني آب', 'أنشئ ميني آب من الملخص', 'أنشئ تطبيقا مصغرا من الملخص', 'استخدم الملخص لإنشاء ميني آب',
            'सारांश बनाओ और मिनीऐप बनाओ', 'सारांश और मिनीऐप', 'सारांश मिनीऐप', 'सारांश से मिनीऐप बनाओ', 'सारांश का उपयोग करके मिनीऐप बनाओ'
        ],
        researchToArtifact: [
            'create a miniapp from this research', 'make a miniapp from this research', 'use this research to create a miniapp', 'create a miniapp from this report', 'use this report to create a miniapp',
            'create an artifact from this research', 'use this research to create an artifact',
            'crear una miniaplicación con esta investigación', 'crear una miniaplicacion con esta investigacion', 'hacer una miniaplicación con esta investigación', 'hacer una miniaplicacion con esta investigacion', 'usar esta investigación para crear una miniaplicación', 'usar esta investigacion para crear una miniaplicacion', 'crear una miniaplicación con este informe', 'crear una miniaplicacion con este informe',
            'criar uma miniaplicação com esta pesquisa', 'criar uma miniaplicacao com esta pesquisa', 'fazer uma miniaplicação com esta pesquisa', 'fazer uma miniaplicacao com esta pesquisa', 'usar esta pesquisa para criar uma miniaplicação', 'usar esta pesquisa para criar uma miniaplicacao', 'criar uma miniaplicação com este relatório', 'criar uma miniaplicacao com este relatorio',
            'créer une miniapp avec cette recherche', 'creer une miniapp avec cette recherche', 'utiliser cette recherche pour créer une miniapp', 'utiliser cette recherche pour creer une miniapp', 'créer une miniapp avec ce rapport', 'creer une miniapp avec ce rapport',
            'eine miniapp aus dieser recherche erstellen', 'eine miniapp aus diesem forschungsbericht erstellen', 'diese recherche verwenden um eine miniapp zu erstellen', 'diesen forschungsbericht verwenden um eine miniapp zu erstellen',
            'creare una miniapp da questa ricerca', 'usare questa ricerca per creare una miniapp', 'creare una miniapp da questo rapporto', 'usare questo rapporto per creare una miniapp',
            'создать мини-приложение из этого исследования', 'использовать это исследование для создания мини-приложения', 'создать мини-приложение из этого отчета', 'создать мини-приложение из этого отчёта',
            '根据这份研究创建迷你应用', '用这份研究创建迷你应用', '根据这份报告创建迷你应用', '用这份报告创建迷你应用',
            'このリサーチからミニアプリを作成', 'このリサーチを使ってミニアプリを作成', 'このレポートからミニアプリを作成', 'このレポートを使ってミニアプリを作成',
            '이 리서치로 미니앱 만들기', '이 리서치를 사용해 미니앱 만들기', '이 보고서로 미니앱 만들기', '이 보고서를 사용해 미니앱 만들기',
            'أنشئ ميني آب من هذا البحث', 'أنشئ تطبيقا مصغرا من هذا البحث', 'استخدم هذا البحث لإنشاء ميني آب', 'أنشئ ميني آب من هذا التقرير', 'استخدم هذا التقرير لإنشاء ميني آب',
            'इस रिसर्च से मिनीऐप बनाओ', 'इस रिसर्च का उपयोग करके मिनीऐप बनाओ', 'इस शोध से मिनीऐप बनाओ', 'इस रिपोर्ट से मिनीऐप बनाओ', 'इस रिपोर्ट का उपयोग करके मिनीऐप बनाओ'
        ],
        knowledgeToArtifact: [
            'create a miniapp from this knowledge base entry', 'create a miniapp from this knowledge entry', 'create a miniapp from this entry', 'make a miniapp from this knowledge base entry', 'use this knowledge base entry to create a miniapp', 'use this entry to create a miniapp',
            'create an artifact from this knowledge base entry', 'use this knowledge base entry to create an artifact',
            'crear una miniaplicación con esta entrada de la base de conocimiento', 'crear una miniaplicacion con esta entrada de la base de conocimiento', 'crear una miniaplicación con esta entrada de conocimiento', 'crear una miniaplicacion con esta entrada de conocimiento', 'crear una miniaplicación con esta entrada', 'crear una miniaplicacion con esta entrada', 'usar esta entrada de la base de conocimiento para crear una miniaplicación', 'usar esta entrada para crear una miniaplicación',
            'criar uma miniaplicação com esta entrada da base de conhecimento', 'criar uma miniaplicacao com esta entrada da base de conhecimento', 'criar uma miniaplicação com esta entrada de conhecimento', 'criar uma miniaplicacao com esta entrada de conhecimento', 'criar uma miniaplicação com esta entrada', 'criar uma miniaplicacao com esta entrada', 'usar esta entrada da base de conhecimento para criar uma miniaplicação', 'usar esta entrada para criar uma miniaplicação',
            'créer une miniapp avec cette entrée de la base de connaissances', 'creer une miniapp avec cette entree de la base de connaissances', 'créer une miniapp avec cette entrée', 'creer une miniapp avec cette entree', 'utiliser cette entrée de la base de connaissances pour créer une miniapp', 'utiliser cette entrée pour créer une miniapp',
            'eine miniapp aus diesem wissenseintrag erstellen', 'eine miniapp aus diesem eintrag erstellen', 'diesen wissenseintrag verwenden um eine miniapp zu erstellen', 'diesen eintrag verwenden um eine miniapp zu erstellen',
            'creare una miniapp da questa voce della base di conoscenza', 'creare una miniapp da questa voce di conoscenza', 'creare una miniapp da questa voce', 'usare questa voce della base di conoscenza per creare una miniapp', 'usare questa voce per creare una miniapp',
            'создать мини-приложение из этой записи базы знаний', 'создать мини-приложение из этой записи знаний', 'создать мини-приложение из этой записи', 'использовать эту запись базы знаний для создания мини-приложения', 'использовать эту запись для создания мини-приложения',
            '根据这个知识库条目创建迷你应用', '用这个知识库条目创建迷你应用', '根据这个条目创建迷你应用', '用这个条目创建迷你应用',
            'このナレッジエントリからミニアプリを作成', 'このナレッジベースのエントリからミニアプリを作成', 'このエントリからミニアプリを作成', 'このナレッジエントリを使ってミニアプリを作成', 'このエントリを使ってミニアプリを作成',
            '이 지식 항목으로 미니앱 만들기', '이 지식 베이스 항목으로 미니앱 만들기', '이 항목으로 미니앱 만들기', '이 지식 항목을 사용해 미니앱 만들기', '이 항목을 사용해 미니앱 만들기',
            'أنشئ ميني آب من إدخال قاعدة المعرفة هذا', 'أنشئ تطبيقا مصغرا من إدخال قاعدة المعرفة هذا', 'أنشئ ميني آب من هذا الإدخال', 'استخدم إدخال قاعدة المعرفة هذا لإنشاء ميني آب', 'استخدم هذا الإدخال لإنشاء ميني آب',
            'इस नॉलेज बेस एंट्री से मिनीऐप बनाओ', 'इस नॉलेज एंट्री से मिनीऐप बनाओ', 'इस एंट्री से मिनीऐप बनाओ', 'इस नॉलेज बेस एंट्री का उपयोग करके मिनीऐप बनाओ', 'इस एंट्री का उपयोग करके मिनीऐप बनाओ'
        ]
    }
};

artifactKeymap.terms = [...new Set([
    ...artifactKeymap.intent,
    ...artifactKeymap.savedCues,
    ...artifactKeymap.sourceCues,
    ...artifactKeymap.webCues,
    ...artifactKeymap.workflows.summaryToArtifact,
    ...artifactKeymap.workflows.researchToArtifact,
    ...artifactKeymap.workflows.knowledgeToArtifact,
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
            '現在のモデル', '選択中のモデル', '使用中のモデル', '今使っているモデル', '今のモデル', '現在選択されているモデル', '今選択されているモデル',
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
            '使用', '使用模型', '切换到', '改用', '改为', '把当前模型改为', '将当前模型改为', '把模型改为', '将模型改为', '选择', '设为模型',
            '使う', 'モデルを使う', '切り替え', 'に切り替え', 'へ切り替え', '切り替える', '変更して', '変更する', '選択',
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
        '请', '我的', '现在', '把', '将',
        'お願いします', '私の', '今', 'を', 'に', 'へ',
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

const webSearchKeymap = {
    direct: [
        'search the web', 'search web', 'search online', 'search internet', 'look online', 'look on the web', 'browse the web',
        'use internet', 'use the internet', 'use web', 'use the web', 'with web search', 'using web search',
        'buscar en internet', 'buscar en la web', 'busca en internet', 'busca en la web', 'usar internet', 'usa internet', 'con busqueda web', 'con búsqueda web',
        'pesquisar na internet', 'pesquisar na web', 'busca na internet', 'busca na web', 'usar internet', 'usa internet', 'com pesquisa web',
        'chercher en ligne', 'chercher sur le web', 'recherche web', 'utilise internet', 'utilise le web', 'avec recherche web',
        'im web suchen', 'online suchen', 'nutze das internet', 'nutze websuche', 'mit websuche',
        'cerca online', 'cerca sul web', 'usa internet', 'usa il web', 'con ricerca web',
        'ищи в интернете', 'поиск в интернете', 'используй интернет', 'с веб-поиском',
        '在线搜索', '在线查找', '搜索网络', '搜索互联网', '使用网络搜索', '使用互联网',
        'ウェブで検索', 'オンラインで検索', 'ウェブ検索を使う', 'インターネットを使う',
        '웹 검색', '온라인 검색', '인터넷 검색', '웹 검색 사용'
    ],
    freshness: [
        'latest', 'current', 'recent', 'up to date', 'today', 'now', 'news', 'live updates',
        'ultimo', 'último', 'actual', 'reciente', 'hoy', 'ahora', 'noticias',
        'atual', 'recente', 'hoje', 'agora', 'noticias', 'notícias',
        'actuel', 'actuelle', 'recent', 'récente', 'aujourdhui', "aujourd'hui", 'maintenant', 'actualites', 'actualités',
        'aktuell', 'neueste', 'letzte', 'heute', 'jetzt', 'nachrichten',
        'attuale', 'recente', 'oggi', 'adesso', 'notizie',
        'последние', 'актуальные', 'сегодня', 'сейчас', 'новости',
        '最新', '当前', '最近', '今天', '现在', '新闻',
        '最新', '現在', '最近', '今日', '今', 'ニュース',
        '최신', '현재', '최근', '오늘', '지금', '뉴스'
    ],
    citations: [
        'citation', 'citations', 'sources', 'source', 'references', 'reference', 'verify', 'verifiable',
        'cita', 'citas', 'fuentes', 'fuente', 'referencias', 'referencia', 'verificar',
        'citacao', 'citação', 'citacoes', 'citações', 'fontes', 'fonte', 'referencias', 'referências', 'verificar',
        'citation', 'citations', 'sources', 'references', 'verifier', 'vérifier',
        'zitat', 'zitate', 'quelle', 'quellen', 'referenz', 'referenzen', 'verifizieren',
        'citazione', 'citazioni', 'fonti', 'riferimenti', 'verificare',
        'цитата', 'цитаты', 'источник', 'источники', 'ссылки', 'проверить',
        '引用', '来源', '参考', '可验证',
        '引用', '出典', '参考', '検証',
        '인용', '출처', '참고', '검증'
    ]
};

webSearchKeymap.terms = [...new Set([
    ...webSearchKeymap.direct,
    ...webSearchKeymap.freshness,
    ...webSearchKeymap.citations
])];

const dataVizKeymap = {
    nouns: [
        'chart', 'charts', 'graph', 'graphs', 'plot', 'plots', 'diagram', 'diagrams', 'visualization', 'visualisation',
        'gráfico', 'graficos', 'gráficos', 'gráfica', 'grafico', 'grafica', 'diagrama',
        'graphique', 'graphe', 'graphes', 'diagramme', 'visualisation',
        'grafik', 'grafiken', 'diagramm', 'diagramme',
        'grafico', 'grafici', 'diagramma', 'diagrammi',
        '图', '图表', '图形', '图示',
        'グラフ', 'チャート', '図表',
        '차트', '그래프', '도표'
    ],
    actions: {
        create: [
            'create', 'make', 'build', 'generate', 'show', 'draw', 'plot',
            'crear', 'hacer', 'genera', 'generar', 'mostrar', 'dibujar',
            'criar', 'fazer', 'gerar', 'mostrar', 'desenhar',
            'creer', 'créer', 'generer', 'générer', 'afficher', 'dessiner',
            'erstellen', 'machen', 'generieren', 'zeigen', 'zeichnen',
            'creare', 'fare', 'generare', 'mostrare', 'disegnare',
            'создать', 'сделать', 'построить', 'показать',
            '创建', '生成', '制作', '显示',
            '作成', '生成', '表示',
            '만들어', '생성', '보여', '그려'
        ]
    },
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
};

const workflowRules = {
    dataviz: {
        required: [
            { id: 'chartType', tokens: Object.values(dataVizKeymap.chartType).flat(), wholeWordOnly: true },
            { id: 'vizNoun', tokens: dataVizKeymap.nouns, wholeWordOnly: true }
        ],
        optional: [
            { id: 'createAction', tokens: dataVizKeymap.actions.create, wholeWordOnly: true }
        ],
        strong: [
            { id: 'explicitChartPhrase', tokens: [
                'pie chart', 'donut chart', 'doughnut chart', 'bar chart', 'line chart',
                'scatter plot', 'area chart', 'radar chart', 'heat map', 'bubble chart'
            ], wholeWordOnly: true }
        ],
        negative: [
            { id: 'presentationNoun', tokens: presentationKeymap.intent, wholeWordOnly: true },
            { id: 'artifactNoun', tokens: artifactKeymap.intent, wholeWordOnly: true }
        ],
        followUpOnly: false
    },
    artifact: {
        required: [
            { id: 'artifactNoun', tokens: artifactKeymap.intent, wholeWordOnly: true },
            { id: 'artifactCreate', tokens: artifactKeymap.actions.create, wholeWordOnly: true }
        ],
        optional: [
            { id: 'artifactBrowse', tokens: artifactKeymap.actions.browse, wholeWordOnly: true },
            { id: 'artifactSend', tokens: artifactKeymap.actions.send, wholeWordOnly: true },
            { id: 'artifactWeb', tokens: artifactKeymap.webCues, wholeWordOnly: true },
            { id: 'artifactSourceCue', tokens: artifactKeymap.sourceCues, wholeWordOnly: true }
        ],
        strong: [
            { id: 'savedArtifact', tokens: artifactKeymap.savedCues, wholeWordOnly: true },
            { id: 'summaryToArtifact', tokens: artifactKeymap.workflows.summaryToArtifact, wholeWordOnly: true },
            { id: 'researchToArtifact', tokens: artifactKeymap.workflows.researchToArtifact, wholeWordOnly: true },
            { id: 'knowledgeToArtifact', tokens: artifactKeymap.workflows.knowledgeToArtifact, wholeWordOnly: true }
        ],
        negative: [
            { id: 'presentationNoun', tokens: presentationKeymap.intent, wholeWordOnly: true },
            { id: 'documentNoun', tokens: documentKeymap.nouns, wholeWordOnly: true }
        ],
        followUpOnly: false
    },
    presentation: {
        required: [
            { id: 'presentationNoun', tokens: presentationKeymap.intent, wholeWordOnly: true },
            { id: 'presentationAction', tokens: [
                ...presentationKeymap.actions.create,
                ...presentationKeymap.actions.browse,
                ...presentationKeymap.actions.send,
                ...presentationKeymap.sourceCues,
                ...presentationKeymap.savedCues
            ], wholeWordOnly: true }
        ],
        optional: [
            { id: 'presentationWeb', tokens: presentationKeymap.webCues, wholeWordOnly: true },
            { id: 'presentationSections', tokens: presentationKeymap.sectionAnchors, wholeWordOnly: true }
        ],
        strong: [
            { id: 'summaryToPresentation', tokens: presentationKeymap.workflows.summaryToPresentation, wholeWordOnly: true },
            { id: 'savedPresentation', tokens: presentationKeymap.savedCues, wholeWordOnly: true }
        ],
        negative: [
            { id: 'artifactNoun', tokens: artifactKeymap.intent, wholeWordOnly: true }
        ],
        followUpOnly: false
    },
    knowledge: {
        required: [
            { id: 'knowledgeTarget', tokens: [...knowledgeKeymap.intent, ...knowledgeKeymap.collectionNouns, ...knowledgeKeymap.entryNouns, ...knowledgeKeymap.savedCues], wholeWordOnly: true },
            { id: 'knowledgeAction', tokens: knowledgeKeymap.actions.browse, wholeWordOnly: true }
        ],
        optional: [
            { id: 'knowledgeSaved', tokens: knowledgeKeymap.savedCues, wholeWordOnly: true }
        ],
        strong: [
            { id: 'knowledgeIntent', tokens: knowledgeKeymap.intent, wholeWordOnly: true },
            { id: 'knowledgeSavedCue', tokens: knowledgeKeymap.savedCues, wholeWordOnly: true }
        ],
        negative: [
            { id: 'artifactNoun', tokens: artifactKeymap.intent, wholeWordOnly: true },
            { id: 'presentationNoun', tokens: presentationKeymap.intent, wholeWordOnly: true },
            { id: 'documentNoun', tokens: documentKeymap.nouns, wholeWordOnly: true }
        ],
        followUpOnly: false
    },
    research: {
        required: [
            { id: 'researchIntent', tokens: researchKeymap.intent, wholeWordOnly: true },
            { id: 'researchTarget', tokens: [...researchKeymap.outputs, ...researchKeymap.modifiers], wholeWordOnly: true }
        ],
        optional: [
            { id: 'researchCreate', tokens: researchKeymap.actions.create, wholeWordOnly: true },
            { id: 'researchCompare', tokens: researchKeymap.actions.compare, wholeWordOnly: true }
        ],
        strong: [
            { id: 'researchExplicit', tokens: ['research', 'investigate', 'market research', 'competitive analysis', 'trend report', ...researchKeymap.intent], wholeWordOnly: true }
        ],
        negative: [
            { id: 'documentNoun', tokens: documentKeymap.nouns, wholeWordOnly: true },
            { id: 'artifactNoun', tokens: artifactKeymap.intent, wholeWordOnly: true },
            { id: 'presentationNoun', tokens: presentationKeymap.intent, wholeWordOnly: true }
        ],
        followUpOnly: false
    },
    'document-check': {
        required: [
            { id: 'documentNoun', tokens: documentKeymap.nouns, wholeWordOnly: true },
            { id: 'documentAction', tokens: [
                ...documentKeymap.actions.browse,
                ...documentKeymap.actions.summary,
                ...documentKeymap.actions.question
            ], wholeWordOnly: true }
        ],
        optional: [
            { id: 'documentQuestionStarter', tokens: documentKeymap.questionStarters, wholeWordOnly: true }
        ],
        strong: [
            { id: 'documentExit', tokens: documentKeymap.actions.exit, wholeWordOnly: true },
            { id: 'documentSummary', tokens: documentKeymap.actions.summary, wholeWordOnly: true }
        ],
        negative: [
            { id: 'artifactNoun', tokens: artifactKeymap.intent, wholeWordOnly: true },
            { id: 'presentationNoun', tokens: presentationKeymap.intent, wholeWordOnly: true }
        ],
        followUpOnly: false
    },
    'chat+websearch': {
        required: [
            { id: 'webCue', tokens: [...webSearchKeymap.direct, ...webSearchKeymap.citations], wholeWordOnly: true }
        ],
        optional: [
            { id: 'freshnessCue', tokens: webSearchKeymap.freshness, wholeWordOnly: true }
        ],
        strong: [
            { id: 'directWebCue', tokens: webSearchKeymap.direct, wholeWordOnly: true },
            { id: 'citationCue', tokens: webSearchKeymap.citations, wholeWordOnly: true }
        ],
        negative: [
            { id: 'artifactWeb', tokens: artifactKeymap.webCues, wholeWordOnly: true },
            { id: 'presentationWeb', tokens: presentationKeymap.webCues, wholeWordOnly: true }
        ],
        followUpOnly: false
    }
};

window.Keymaps = {
    dataViz: dataVizKeymap,
    research: researchKeymap,
    document: documentKeymap,
    presentation: presentationKeymap,
    knowledge: knowledgeKeymap,
    artifact: artifactKeymap,
    model: modelKeymap,
    chat: chatKeymap,
    webSearch: webSearchKeymap,
    workflowRules,
    meta: {
        followUpCloseCueGroups: commonFollowUpCloseCueGroups,
        followUpContinueCueGroups: commonFollowUpContinueCueGroups,
        researchExitCueGroups
    }
};
