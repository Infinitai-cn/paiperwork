window.helpContent = {

    gettingstarted: {
        title: "Erste Schritte",
        intro: [
            "Willkommen bei Paiperwork, einer sicheren Web-Oberfläche für Ollama, die Datenschutz und Benutzerfreundlichkeit priorisiert. Dieser professionell ausgerichtete Assistent bietet Produktivitätsfunktionen und hält dabei Ihre Daten lokal und geschützt.",
            "Sie konnen Modelle lokal auf Ihrem Computer herunterladen und ausfuhren oder Cloud-Modelle verwenden, wenn Ihre Hardware lokale Modelle nicht verarbeiten kann. Fur Cloud-Modelle sind eine Anmeldung auf ollama.com und ein API-Schlussel erforderlich. Bei der ersten Nutzung eines Cloud-Modells fordert Paiperwork diesen Schlussel an und speichert ihn verschlusselt in Ihrer lokalen Datenbank.",
            "Detaillierte Anleitung zur Nutzung von Ollama-Cloud-Modellen: 1) Laden Sie Paiperwork von https://infinitai-cn.github.io/paiperwork/ herunter. 2) Entpacken Sie die Datei. 2.1) Wenn Sie Paiperwork nicht offnen konnen, prufen Sie die Sicherheitseinstellungen, um die Ausfuhrung zu erlauben. Unter Windows klicken Sie auf die Schaltflache More info. Unter macOS offnen Sie Datenschutz und Sicherheit in den Einstellungen. 3) Gehen Sie zu https://ollama.com und erstellen Sie ein Konto. 4) Laden Sie Ollama herunter und installieren Sie es. 5) Offnen Sie in Ihrem Ollama-Konto Settings. 6) Offnen Sie Usage, um zu sehen, wie viel kostenlose Nutzung noch verfugbar ist (wichtig). 7) Offnen Sie Keys, klicken Sie auf Add API key, dann auf Generate API key, und kopieren Sie den erzeugten Schlussel. 8) Speichern Sie den Schlussel in einer Textdatei auf Ihrem Computer. 9) Starten Sie Paiperwork (Mac, Windows oder Linux). 10) Geben Sie einen Master Key ein und klicken Sie dann im Chat-Tab auf Manage Cloud API key, um den Ollama-API-Schlussel hinzuzufugen. 11) Jetzt konnen Sie die kostenlosen Cloud-Modelle von Ollama nutzen.",
            "Hinweis zum Online-Modus (<a href=\"https://huggingface.co/spaces/Infinitai/Paiperwork\" target=\"_blank\" rel=\"noopener noreferrer\">Hugginface spaces</a>): Aufgrund lokaler Anforderungen sind die Tabs Documents, Translate und Models im Online-Modus deaktiviert. Diese Tabs werden aktiviert, wenn Sie Paiperwork lokal auf Ihrem Computer ausfuhren."
        ],
        articles: [
            {
                id: "gs-welcome",
                title: "Willkommensbildschirm",
                content: `
            <p>** Wenn Sie einen Laptop oder Computer ohne leistungsstarke Grafikkarte haben, wählen Sie immer kleine Modelle für bessere Leistung (es sei denn, Sie haben eine Maschine mit viel RAM und wissen, was Sie tun)**</p>
            <p>** Bitte beachten Sie, dass Paiperwork Anweisungen für seine Funktionen verwendet, <b>Anweisungsmodelle sind erforderlich</b> (verwenden Sie keine Basis- oder Text-/Chat-Modelle)**</p>
            <p>Der Willkommensbildschirm ist Ihr Ausgangspunkt für alle Interaktionen mit Paiperwork.</p>
            <p>Von hier aus können Sie:</p>
            <ul>
            <li>Neue Gespräche starten und alle App-Optionen mit der KI verwenden, indem Sie einen Hauptschlüssel eingeben (Verschiedene Hauptschlüssel erstellen getrennte Chats/Einstellungen/Daten in der Datenbank)</li>
            <li>Auf Ihre Gesprächshistorie zugreifen, indem Sie einen zuvor eingegebenen Hauptschlüssel verwenden</li>
            <li>Nach Programm-Updates suchen</li>
            <li>Auf die Hilfedokumentation zugreifen</li>

                <h4>Thinking-Modellliste bearbeiten</h4>
                <p>Verwenden Sie die Schaltfläche <strong>Thinking-Modellliste bearbeiten</strong> im Models-Tab, um festzulegen, welche Modelle die Thinking-Schaltfläche im Chat-Tab anzeigen.</p>
                <ul>
                    <li>Die Schaltfläche öffnet die Liste <code>thinkingmodels.js</code></li>
                    <li>Fügen Sie Modellnamen in <code>window.THINKING_MODELS</code> hinzu oder entfernen Sie sie</li>
                    <li>Speichern Sie die Liste, um die Thinking-Unterstützung sofort ohne Neustart der Anwendung zu aktualisieren</li>
                </ul>

                <h4>Visuelle Modellliste bearbeiten</h4>
                <p>Verwenden Sie die Schaltfläche <strong>Visuelle Modellliste bearbeiten</strong> im Models-Tab, um festzulegen, welche Modelle Bild-Uploads und andere visuelle Funktionen im Chat-Tab aktivieren.</p>
                <ul>
                    <li>Die Schaltfläche öffnet die Liste <code>visualmodels.js</code></li>
                    <li>Fügen Sie Modellkennungen in <code>window.VISUAL_MODELS</code> hinzu oder entfernen Sie sie</li>
                    <li>Speichern Sie die Liste, um die Erkennung visueller Modelle sofort ohne Neustart der Anwendung zu aktualisieren</li>
                </ul>
        </ul>
        
        <div class="note">
            <p><strong>Wichtig:</strong> Der Hauptschlüssel, den Sie eingeben, dient zwei kritischen Zwecken:</p>
            <ul>
                <li>Er kann getrennte Arbeitsumgebungen erstellen (Verwendung verschiedener Hauptschlüssel)</li>
                    <li>Speichern Sie die Datei, um die Änderungen sofort ohne Neustart der Anwendung zu übernehmen</li>
            </ul>
            <p>Um auf ein vorheriges Gespräch zuzugreifen, müssen Sie den <em>exakt gleichen Hauptschlüssel</em> (groß-/kleinschreibungsempfindlich) eingeben, den Sie bei der Erstellung verwendet haben.</p>
        </div>
        
        <div class="note">
            <p><strong>Sprachkompatibilität:</strong> Während Paiperworks Benutzeroberfläche mehrere Sprachen unterstützt, sollten Sie für optimale Erfahrung KI-Modelle verwenden, die in Ihrer bevorzugten Sprache trainiert sind. Wenn Sie eine nicht-englische Oberflächensprache verwenden, ziehen Sie Modelle in Betracht, die Ihre Sprache für beste Ergebnisse unterstützen. Bei Informationsanfragen in Funktionen wie Forschung oder allgemeinem Chat, wenn Sie die Antwort/das Ergebnis nicht in Ihrer Sprache erhalten, müssen Sie möglicherweise Ihre bevorzugte Antwortsprache in Ihrer Eingabe spezifizieren, zum Beispiel: "Warum haben Katzen weißes Haar? (Stellen Sie diese Forschung auf Spanisch bereit)" oder "(Antworten Sie auf Französisch)", um sicherzustellen, dass die KI in Ihrer gewünschten Sprache statt standardmäßig auf Englisch antwortet.</p>
        </div>
        
         <div class="note">
          <p><strong>KI-Antwortsprache:</strong> Paiperwork erzwingt jetzt automatisch KI-Antworten in Ihrer bevorzugten Sprache basierend auf Ihrer Auswahl aus dem Sprachdropdown auf der Hauptseite (index.html). Das System fügt automatisch Sprachdurchsetzungsanweisungen hinzu, um sicherzustellen, dass alle KI-Antworten Ihrer gewählten Oberflächensprache entsprechen. Wenn Sie Antworten in einer anderen Sprache für bestimmte Gespräche benötigen, können Sie dies überschreiben, indem Sie "Sie antworten immer auf [spezifische Sprache]" zu Ihrer Systemaufforderung im Chat-Tab hinzufügen. (Die Konsistenz der Antwortsprache hängt von der KI-Modellqualität ab)</p>
         </div>
        
        <div class="note">
            <p><strong>Low-End-System-Kompatibilität:</strong> Paiperwork wurde getestet und für die Kompatibilität mit kleineren KI-Modellen (wie Qwen3.1 1.7B und Gemma3 4B) optimiert, um effektive Leistung auf Low-End-Systemen zu gewährleisten. Diese kleineren Modelle bieten gute Ergebnisse und benötigen dabei erheblich weniger VRAM und Systemressourcen, wodurch Paiperwork für Benutzer mit begrenzten Hardware-Fähigkeiten zugänglich wird.</p>
        </div>
        
        <div class="note">
            <p><strong>Übersetzungsunterstützung:</strong> Wenn Sie fehlende oder falsche Übersetzungen in Paiperwork finden, teilen Sie uns dies bitte in unseren <a href="https://github.com/discussions" target="_blank" rel="noopener noreferrer">GitHub-Diskussionen</a> mit. Ihr Feedback hilft uns, die mehrsprachige Erfahrung für alle Benutzer zu verbessern.</p>
        </div>
    `,
                image: "welcome.png",
                imageAlt: "Paiperwork Willkommensbildschirm",
                imageCaption: "Der Paiperwork Willkommensbildschirm mit dem Hauptschlüssel-Eingabefeld",
            },
            {
                id: "gs-topics",
                title: "Effektive Nutzung des Hauptschlüssels",
                content: `
               <p>Hauptschlüssel sind grundlegend für die Funktionsweise von Paiperwork. Sie bieten hauptsächlich Sicherheit für Ihre Gespräche.</p>
               
               <h4>Hauptschlüssel als Sicherheitsschlüssel</h4>
               <p>Ihr Hauptschlüssel fungiert als Verschlüsselungsschlüssel, der Ihre Gesprächsdaten sichert. Das bedeutet:</p>
               <ul>
                 <li>Hauptschlüssel sind <strong>groß-/kleinschreibungsempfindlich</strong> - "Mein Projekt" und "mein projekt" werden als verschiedene Hauptschlüssel behandelt</li>
                 <li>Sie müssen den exakt gleichen Hauptschlüssel eingeben, um auf ein vorheriges Gespräch zuzugreifen</li>
                 <li>Wenn Sie einen Hauptschlüssel vergessen, können Sie dieses Gespräch nicht wiederherstellen</li>
                 <li>Wählen Sie kurze, einprägsame Hauptschlüssel, an die Sie sich später leicht erinnern können</li>
               </ul>
               
               <h4>Effektive Hauptschlüssel erstellen</h4>
               <p>Für beste Ergebnisse mit Ihren Hauptschlüsseln:</p>
               <ul>
                 <li>Halten Sie sie kurz und leicht zu merken (z.B. "ItalienReise2025" oder "Gartenpläne")</li>
                 <li>Verwenden Sie einfache Muster, an die Sie sich erinnern werden (z.B. "Zuhause-2023" oder "Rezept-Buch")</li>
                 <li>Vermeiden Sie komplexe Phrasen mit Sonderzeichen oder ungewöhnlicher Formatierung</li>
                 <li>Erwägen Sie die Verwendung persönlicher Gedächtnisstützen, die nur Sie erkennen würden</li>
               </ul>
               
               <div class="note">
                 <p><strong>Tipp:</strong> Erwägen Sie, eine sichere Aufzeichnung wichtiger Hauptschlüssel zu führen, die Sie häufig verwenden, besonders für langfristige Projekte. Denken Sie an Hauptschlüssel wie an Passwörter - sie müssen einprägsam und sicher sein.</p>
               </div>
             `,
                image: "memorabletopic.png",
                imageAlt: "Hauptschlüssel-Eingabebeispiel",
                imageCaption: "Beispiel für die Eingabe eines kurzen, einprägsamen Hauptschlüssels",
            },
            {
                id: "gs-conversation",
                title: "Ein Gespräch beginnen",
                content: `
                <p>Um ein neues Gespräch mit der KI zu beginnen:</p>
                <ol>
                    <li>Geben Sie einen Hauptschlüssel in das Feld "Hauptschlüssel hier eingeben..." ein</li>
                    <li>Stellen Sie sicher, dass Ihr Hauptschlüssel sowohl beschreibend als auch einprägsam ist</li>
                    <li>Klicken Sie auf die Schaltfläche "Start"</li>
                    <li>Die Chat-Oberfläche öffnet sich mit Ihrem neuen Gespräch</li>
                </ol>
                <p>Wenn Sie diesen Hauptschlüssel schon einmal verwendet haben, lädt Paiperwork Ihre vorherige Gesprächshistorie.</p>
                <p>Wenn es ein neuer Hauptschlüssel ist, beginnt ein frisches Gespräch.</p>
            
                <h4>Gespräche verwalten</h4>
                <p>Oben rechts auf dem Willkommensbildschirm finden Sie die Schaltfläche "Alle Informationen löschen". Verwenden Sie diese mit Vorsicht, da sie ALLE Ihre gespeicherten Gespräche und Daten dauerhaft entfernt.</p>
            `,
                image: "clickstart.png",
                imageAlt: "Ein neues Gespräch beginnen",
                imageCaption: "Geben Sie Ihren Hauptschlüssel ein und klicken Sie auf Start, um eine neue Chat-Sitzung zu beginnen",
            },
            ],
    },
    chat: {
        title: "Chat",
        intro:
            "Die Chat-Oberfläche bietet leistungsstarke KI-Gesprächsfunktionen mit mehreren erweiterten Funktionen zur Verbesserung Ihrer Interaktionen.",
        articles: [
            {
                id: "chat-basics",
                title: "Chat-Grundlagen",
                content: `
                <p>Die Chat-Oberfläche ist der Ort, an dem Ihre Gespräche mit der KI stattfinden. Sie ist so konzipiert, dass sie intuitiv und dennoch leistungsstark ist, mit mehreren Schlüsselfunktionen, die Ihnen helfen, das Beste aus Ihren Interaktionen herauszuholen.</p>
                <div class="note">
                    <p><strong>Wichtig:</strong> Wir aktualisieren die KI-System-Aufforderung mit dem aktuellen Datum für Datumskontextzwecke. KI-Modelle können bei aktuellen Ereignissen verwirrt sein, da ihr Wissensstichtag sehr wahrscheinlich vor dem aktuellen Datum liegt. Es wird empfohlen, die Websuche zu verwenden, wenn Sie nach aktuellen Ereignissen fragen.</p>
                </div>
                <h4>Zentrale Chat-Elemente</h4>
                <ul>
                    <li><strong>Nachrichtenbereich</strong> - Hier erscheint Ihr Gesprächsverlauf, mit Benutzernachrichten rechts und KI-Antworten links</li>
                    <li><strong>Eingabefeld</strong> - Geben Sie hier Ihre Nachrichten ein und drücken Sie Enter oder klicken Sie auf Senden</li>
                    <li><strong>Senden-Button</strong> - Sendet Ihre Nachricht und verwandelt sich während der KI-Antwortgenerierung in einen Abbrechen-Button</li>
                    <li><strong>Modellauswahl</strong> - Wählen Sie verschiedene KI-Modelle je nach Ihren Aufgabenanforderungen</li>
                    <li><strong>Master-Key-Anzeige</strong> - Zeigt Ihren aktuellen Master-Key (aus Sicherheitsgründen maskiert). Klicken Sie, um den tatsächlichen Schlüssel vorübergehend anzuzeigen, was hilft, Ihr Gedächtnis aufzufrischen, welchen Verschlüsselungsschlüssel Sie gerade verwenden</li>
                </ul>
                
                <h4>Master-Key-Anzeigefunktion</h4>
                <p>Die Master-Key-Anzeige in der Chat-Oberfläche hilft Ihnen, Ihren aktuellen Verschlüsselungsschlüssel im Auge zu behalten:</p>
                <ul>
                    <li><strong>Sicherheitsanzeige</strong> - Standardmäßig wird der Master-Key als Punkte (••••••••••••) angezeigt, um Ihre Privatsphäre zu schützen</li>
                    <li><strong>Klicken zum Anzeigen</strong> - Klicken Sie auf die Master-Key-Anzeige, um vorübergehend den tatsächlichen Schlüsseltext anzuzeigen</li>
                    <li><strong>Automatisches Ausblenden</strong> - Der Schlüssel wird nach 3 Sekunden automatisch wieder ausgeblendet</li>
                    <li><strong>Gedächtnisstütze</strong> - Nützlich zur Bestätigung, welchen Master-Key Sie gerade verwenden, besonders beim Arbeiten mit mehreren Projekten</li>
                </ul>
                
                <h4>Nachrichtenkontrolle</h4>
                <p>Jede KI-Antwort enthält Aktionsschaltflächen am unteren Rand, mit denen Sie:</p>
                <ul>
                    <li><strong>Regenerieren</strong> - Erstellt eine neue Antwort auf Ihre letzte Nachricht, nützlich wenn Sie eine andere Antwort wünschen</li>
                    <li><strong>Löschen</strong> - Entfernt das Nachrichtenpaar (Ihre Nachricht und die KI-Antwort) aus der Unterhaltung</li>
                    <li><strong>Kopieren</strong> - Kopiert den vollständigen Inhalt der KI-Antwort in Ihre Zwischenablage</li>
                </ul>
                
                <h4>Generierung abbrechen</h4>
                <p>Wenn Sie die KI stoppen möchten, während sie eine Antwort generiert, klicken Sie einfach auf den roten Abbrechen-Button (der den Senden-Button ersetzt hat). Dies stoppt sofort den Generierungsprozess und markiert die unvollständige Antwort.</p>
                
                <div class="note">
                    <p><strong>Tipp:</strong> Um Ihre Gespräche organisiert zu halten, versuchen Sie, verschiedene Master-Keys für verschiedene Themen oder Projekte zu verwenden. Nutzen Sie die Master-Key-Anzeigefunktion, um zu bestätigen, dass Sie im richtigen Kontext sind, bevor Sie wichtige Gespräche beginnen.</p>
                </div>
            `,
                images: [
                    {
                        src: "chat_interface.png",
                        alt: "Chat-Oberfläche",
                        caption:
                            "Die Chat-Oberfläche zeigt Gesprächskontrollen und Nachrichtenoptionen",
                    },
                    {
                        src: "Encrypted-database.png",
                        alt: "Verschlüsselte Datenbank für Chats und Daten",
                        caption: "Verschlüsselte Datenbank für Chats und Daten"
                    }
                ]

            },
            {
                id: "chat-system-prompt",
                title: "System-Prompts verwenden",
                content: `
                <p>Der System-Prompt ist eine mächtige Möglichkeit zu kontrollieren, wie sich die KI in Ihrer Unterhaltung verhält. Denken Sie daran als das Setzen von Anweisungen für die Persönlichkeit, den Wissensfokus und den Antwortstil der KI.</p>
                
                <h4>Zugriff auf den System-Prompt</h4>
                <p>Um den System-Prompt anzuzeigen und zu bearbeiten:</p>
                <ol>
                    <li>Klicken Sie auf den "System-Prompt"-Tab in der Chat-Oberfläche</li>
                    <li>Bearbeiten Sie den Text im großen Textfeld</li>
                    <li>Klicken Sie auf "Speichern", um Ihre Änderungen anzuwenden</li>
                </ol>
                
                <h4>Effektive System-Prompts</h4>
                <p>Für beste Ergebnisse bei der Anpassung Ihres System-Prompts:</p>
                <ul>
                    <li>Seien Sie spezifisch über die Rolle der KI (z.B. "Sie sind ein hilfreicher Coding-Assistent, der sich auf JavaScript spezialisiert hat")</li>
                    <li>Definieren Sie den bevorzugten Stil und das Format der Antworten</li>
                    <li>Geben Sie alle Einschränkungen oder Grenzen an</li>
                    <li>Schließen Sie alle spezialisierten Wissensbereiche ein, auf die sich die KI konzentrieren soll</li>
                </ul>
                
                <div class="note">
                    <p><strong>Hinweis:</strong> Das Ändern des System-Prompts setzt den Gesprächskontext zurück, aber ein "Gespräch fortsetzen"-Button erscheint, um den Gesprächsfluss aufrechtzuerhalten.</p>
                </div>
            `,
                image: "system_prompt.png",
                imageAlt: "System-Prompt-Editor",
                imageCaption:
                    "Der System-Prompt-Editor ermöglicht es Ihnen, das Verhalten der KI anzupassen",
            },

            {
                id: "chat-insights",
                title: "Gesprächseinblicke",
                content: `
                <p>Die Insights-Funktion hilft der KI, Sie im Laufe der Zeit besser zu verstehen, indem sie automatisch aus Ihren Nachrichten lernt.</p>
                
                <h4>Wie Insights funktionieren</h4>
                <p>Wenn aktiviert, analysiert Paiperwork Ihre Nachrichten, um relevante Informationen über Ihre Vorlieben, Interessen und Kommunikationsstil zu extrahieren. Dies hilft der KI, personalisierte Antworten zu geben, je mehr Sie mit ihr interagieren.</p>
                
                <ul>
                    <li><strong>Datenschutzorientiert</strong> - Insights werden sicher mit Ihrem Master-Key verschlüsselt und lokal auf Ihrem Gerät gespeichert</li>
                    <li><strong>Selektive Analyse</strong> - Nur Nachrichten, die persönliche Vorlieben enthalten, werden analysiert</li>
                    <li><strong>Nicht-identifizierend</strong> - Das System konzentriert sich auf allgemeine Eigenschaften anstatt auf spezifische persönliche Details</li>
                    <li><strong>Verarbeitungszeit</strong> - Wenn Sie ein Reasoning-Modell verwenden, werden Insights deutlich mehr Zeit benötigen, da das Modell eine Weile nachdenkt, bevor es den Insight erstellt</li>
                </ul>
                
                <h4>Verwaltung von Insights</h4>
                <p>Sie haben vollständige Kontrolle über die Insights-Funktion:</p>
                
                <h5>Aktivieren oder Deaktivieren der Insights-Sammlung</h5>
                <ol>
                    <li>Klicken Sie auf den "Chat"-Tab in der Chat-Oberfläche</li>
                    <li>Finden Sie den "Insights"-Schalter (oben)</li>
                    <li>Schalten Sie ihn ein oder aus, um zu deaktivieren</li>
                </ol>
                <p>Wenn deaktiviert, werden keine neuen Insights aus Ihren zukünftigen Nachrichten gesammelt. Zuvor gespeicherte Insights bleiben in der Datenbank und werden weiterhin geladen und verwendet, um das Verständnis der KI für Sie zu verbessern.</p>
                
                <h5>Anzeigen und Verwalten gespeicherter Insights</h5>
                <p>Sie können gespeicherte Insights anzeigen, bearbeiten und löschen:</p>
                <ol>
                    <li>Finden Sie den kleinen "e"-Button links vom Insights-Schalter</li>
                    <li>Klicken Sie auf diesen Button, um den Insights-Editor zu öffnen</li>
                    <li>Im Editor-Fenster können Sie:</li>
                    <ul>
                        <li><strong>Anzeigen</strong> - Alle Insights sehen, die das System über Sie gesammelt hat</li>
                        <li><strong>Bearbeiten</strong> - Jeden vorhandenen Insight ändern, der ungenau ist oder aktualisiert werden muss</li>
                        <li><strong>Löschen</strong> - Spezifische Insights entfernen, die Sie nicht von der KI verwenden lassen möchten</li>
                        <li><strong>Hinzufügen</strong> - Neue Insights manuell erstellen, um das Verständnis der KI zu leiten</li>
                    </ul>
                    <li>Klicken Sie auf "Änderungen speichern", um Ihre Änderungen anzuwenden</li>
                </ol>
                <p>Nach dem Speichern der Änderungen wird der System-Prompt automatisch neu erstellt, um Ihre aktualisierten Vorlieben zu berücksichtigen.</p>
                
                <h4>Wie Insights immer verfügbar sind</h4>
                <p>Insights funktionieren anders als der Sammlungsschalter:</p>
                <ul>
                    <li><strong>Immer geladen</strong> - Wenn Sie ein Gespräch beginnen, werden alle gespeicherten Insights automatisch aus der Datenbank geladen</li>
                    <li><strong>Kontinuierliche Verbesserung</strong> - Ihre Insights verbessern jedes Gespräch und helfen der KI, Ihre Vorlieben zu verstehen</li>
                    <li><strong>Schalter kontrolliert nur die Sammlung</strong> - Der Schalter kontrolliert nur, ob neue Insights aus zukünftigen Nachrichten erstellt werden</li>
                    <li><strong>Manuelle Verwaltung</strong> - Verwenden Sie den "e"-Button, um vorhandene Insights unabhängig vom Schalterstatus zu verwalten</li>
                </ul>
                
                <h4>Was analysiert wird</h4>
                <p>Das System analysiert selektiv Nachrichten, die enthalten:</p>
                <ul>
                    <li>Selbstreferenzen (Phrasen, die mit "Ich" beginnen, wie "Ich bevorzuge..." oder "Ich genieße...")</li>
                    <li>Längere, detailliertere Nachrichten (typischerweise 5+ Wörter)</li>
                    <li>Nachrichten mit persönlichen Vorlieben oder Meinungen</li>
                </ul>
                
                <div class="note">
                    <p><strong>Datenschutzhinweis:</strong> Alle Insights werden mit Ihrem Master-Key verschlüsselt und lokal auf Ihrem Gerät gespeichert. Sie sind nur zugänglich, wenn Sie genau denselben Master-Key eingeben, der zu ihrer Verschlüsselung verwendet wurde. Insights werden immer geladen, wenn verfügbar, um Ihre Gespräche zu verbessern, aber Sie können sie einzeln mit dem Insights-Editor löschen, wenn Sie nicht mehr möchten, dass sie verwendet werden.</p>
                </div>
                `,
                images: [
                    {
                        src: "insights_feature.png",
                        alt: "Insights-Funktionsschalter",
                        caption: "Der Insights-Schalter im Einstellungs-Tab der Chat-Oberfläche"
                    },
                    {
                        src: "insights_editor.png",
                        alt: "Insights-Editor",
                        caption: "Die Insights-Editor-Oberfläche zur Verwaltung gespeicherter Insights"
                    },
                    {
                        src: "Insightslog.png",
                        alt: "Insights-Funktions-Logs",
                        caption: "Die Insights-Logs in der Browser-Konsole"
                    }
                ]
            },
            {
              id: "chat-advanced-features",
              title: "Erweiterte Chat-Funktionen",
              content: `
                   <h4>Kontextgröße-Kontrolle</h4>
                   <p>Die Kontextgröße bestimmt, wie viel von Ihrem vorherigen Gespräch die KI "erinnern" und bei der Generierung von Antworten verwenden kann:</p>
                   <ul>
                       <li><strong>Automatische Kontextgröße</strong> - Bei der Auswahl eines Modells setzt das System automatisch die optimale Kontextgröße basierend auf den Fähigkeiten des Modells</li>
                       <li><strong>Modell-spezifische Optimierung</strong> - Das native Kontextfenster jedes Modells wird erkannt und angewendet</li>
                       <li><strong>Ressourcenschonung</strong> - Anfangs auf 8K begrenzt, um übermäßigen Ressourcenverbrauch zu verhindern, kann aber manuell erhöht werden</li>
                       <li><strong>Manuelle Anpassung</strong> - Wählen Sie Ihre gewünschte Kontextgröße aus dem Dropdown-Menü (von 1K bis 10M Token), um die automatische Einstellung zu überschreiben</li>
                       <li><strong>Persistente Einstellungen</strong> - Ihre Kontextgröße-Präferenz wird sitzungsübergreifend für jedes Modell gespeichert</li>
                   </ul>
                   
                   <h5>Wie Kontextgröße die Speichernutzung beeinflusst</h5>
                   <p>Die Kontextgröße hat einen direkten Einfluss auf RAM- und VRAM-Anforderungen (Grafikkartenspeicher):</p>
                   <ul>
                       <li><strong>Speicherberechnung</strong> - Für jeden Token in Ihrem Kontextfenster muss das Modell Speicher für Aufmerksamkeitsberechnungen zuweisen</li>
                       <li><strong>Skalierungsverhältnis</strong> - Die Speichernutzung skaliert quadratisch mit der Kontextgröße, nicht linear (eine Verdopplung der Kontextgröße kann den Speicherbedarf vervierfachen)</li>
                       <li><strong>Kombinierte Faktoren</strong> - Die gesamte Speichernutzung hängt sowohl von der Modellgröße (Parameter) als auch von der Kontextlänge ab</li>
                   </ul>
                   
                   <h5>Richtlinien für manuelle Kontextgröße</h5>
                   <p>Als allgemeine Richtlinie für Speicheranforderungen:</p>
                   <ul>
                       <li><strong>4K Kontext</strong> - Benötigt etwa 1GB VRAM/RAM</li>
                       <li><strong>8K Kontext</strong> - Benötigt etwa 2GB VRAM/RAM</li>
                       <li><strong>16K Kontext</strong> - Benötigt etwa 4GB VRAM/RAM</li>
                       <li><strong>32K Kontext</strong> - Benötigt etwa 8GB VRAM/RAM</li>
                       <li><strong>64K Kontext</strong> - Benötigt etwa 16GB VRAM/RAM</li>
                       <li><strong>128K+ Kontext</strong> - Benötigt 32GB+ VRAM/RAM für High-End-Systeme</li>
                   </ul>
                   
                   <p>Wenn Sie die Kontextgröße erhöhen, achten Sie auf diese Anzeichen von Speicherdruck:</p>
                   <ul>
                       <li>Die Modellantwort ist unsinnig oder das Modell gibt den System-Prompt in der Antwort aus (senken Sie zuerst den Kontext auf eine kleine Einstellung, um zu überprüfen, ob die Antwort korrekt ist, dann vorsichtig erhöhen)</li>
                       <li>Langsamere Antwortgenerierung</li>
                       <li>System wird weniger reaktionsfähig</li>
                       <li>Ollama-Fehler im Zusammenhang mit Out-of-Memory-Bedingungen</li>
                       <li>Kontextprozent-Indikator wird orange oder rot</li>
                   </ul>
                   
                   <div class="note">
                       <p><strong>Tipp:</strong>Wenn Sie Speicherprobleme haben, versuchen Sie immer zuerst eine konservative Einstellung.</p>
                   </div>
                   
                   <h4>Native Denkmodelle (Ollama 0.9.0+)</h4>
                   <p>Paiperwork unterstützt Ollamas native Denkfunktionalität für kompatible Argumentationsmodelle, die es KI-Modellen ermöglicht, ihren schrittweisen Denkprozess zu zeigen:</p>
                   
                   <h5>Systemanforderungen</h5>
                   <ul>
                       <li><strong>Ollama-Version</strong> - Benötigt Ollama 0.9.0 oder höher für native Denkunterstützung</li>
                       <li><strong>Kompatible Modelle</strong> - Funktioniert mit denkfähigen Modellen wie DeepSeek-R1 und qwen3-Argumentationsmodellen (weitere werden in zukünftigen Versionen kommen)</li>
                       <li><strong>Automatische Erkennung</strong> - Paiperwork erkennt automatisch Ihre Ollama-Version und Modellkompatibilität</li>
                   </ul>
                   
                   <h5>Denk-Umschaltknopf</h5>
                   <p>Wenn Sie ein kompatibles Denkmodell mit Ollama 0.9.0+ auswählen, erscheint automatisch ein Denk-Umschaltknopf:</p>
                   <ul>
                       <li><strong>Automatisches Erscheinen</strong> - Der Knopf wird nur angezeigt, wenn sowohl Ollama-Version als auch Modell das Denken unterstützen</li>
                       <li><strong>Umschalt-Kontrolle</strong> - Klicken Sie, um die Anzeige des Denkprozesses des Modells zu aktivieren oder zu deaktivieren</li>
                       <li><strong>Visueller Indikator</strong> - Der Knopf zeigt einen aktiven Zustand an, wenn das Denken aktiviert ist</li>
                       <li><strong>Persistente Einstellung</strong> - Ihre Denkpräferenz wird sitzungsübergreifend gespeichert</li>
                   </ul>
                   
                   <h5>Wie natives Denken funktioniert</h5>
                   <ul>
                       <li><strong>Denkanzeige</strong> - Wenn aktiviert, sehen Sie den internen Denkprozess des Modells in einem separaten Denkbereich</li>
                       <li><strong>Echtzeitverarbeitung</strong> - Beobachten Sie, wie die KI Probleme schrittweise durcharbeitet, während sie Antworten generiert</li>
                       <li><strong>Einklappbare Bereiche</strong> - Denkinhalte können eingeklappt werden, um sich auf die endgültige Antwort zu konzentrieren</li>
                       <li><strong>Leistungsauswirkung</strong> - Der Denkmodus dauert normalerweise länger, da das Modell gründlicher verarbeitet</li>
                   </ul>
                   
                   <h5>Nicht-Ollama-Denkmodelle</h5>
                   <p>Paiperwork unterstützt auch Argumentationsmodelle, die eingebaute Denkfähigkeiten haben, aber nicht Ollamas native Denk-API verwenden:</p>
                   <ul>
                       <li><strong>Kein Umschaltknopf</strong> - Diese Modelle zeigen den Denk-Umschaltknopf nicht an, da sie die Argumentation intern handhaben, aber den Denkcontainer anzeigen</li>
                       <li><strong>Eingebaute Argumentation</strong> - Modelle wie Reflection können die Argumentation als Teil ihrer normalen Antwort zeigen</li>
                       <li><strong>System-Prompt-Modifikation</strong> - Modelle wie Cogito benötigen einen speziellen Befehl im System-Prompt: Aktiviere tiefe Denkroutine, andere mögen diesen Befehl (/think, /no_think) im System-Prompt oder im Benutzer-Prompt benötigen</li>
                   </ul>
                   
                   <h5>Effektive Nutzung von Denkmodellen</h5>
                   <ul>
                       <li><strong>Komplexe Probleme</strong> - Am besten geeignet für mehrstufige Argumentation, Mathematikprobleme oder komplexe Analysen</li>
                       <li><strong>Code-Debugging</strong> - Ausgezeichnet, um zu verstehen, wie die KI an Code-Probleme herangeht</li>
                       <li><strong>Lernwerkzeug</strong> - Beobachten Sie, wie die KI komplexe Themen für Bildungszwecke aufschlüsselt</li>
                       <li><strong>Qualität vs. Geschwindigkeit</strong> - Aktivieren Sie das Denken für qualitativ hochwertigere Antworten; deaktivieren Sie es für schnellere, direkte Antworten</li>
                   </ul>
                   
                   <div class="note">
                       <p><strong>Wichtig:</strong> Wenn Sie den Denk-Umschaltknopf nicht sehen, überprüfen Sie, ob Sie Ollama 0.9.0 oder höher verwenden und ein kompatibles Denkmodell ausgewählt haben. Einige ältere Argumentationsmodelle unterstützen möglicherweise nicht die native Denk-API, können aber dennoch Argumentation als Teil ihrer normalen Antwortgenerierung liefern.</p>
                   </div>
                   
                   <h4>Bild-Upload (Visuelle Modelle)</h4>
                   <p>Bei der Verwendung visueller KI-Modelle wie Mistral small 3.1 oder Gemma3 können Sie Bilder hochladen, um sie zu besprechen:</p>
                   <ul>
                       <li>Klicken Sie auf den Bildknopf neben dem Eingabefeld</li>
                       <li>Wählen Sie ein Bild von Ihrem Gerät aus oder ziehen Sie es in den Upload-Bereich</li>
                       <li>Für Gemma3-Modelle können Sie mehrere Bilder gleichzeitig hochladen (maximal 3)</li>
                       <li>Erstellen Sie Transkriptionen (OCR), stellen Sie Fragen oder erhalten Sie Beschreibungen basierend auf den hochgeladenen Bildern</li>
                   </ul>
                   
                   <h4>Web-Such-Integration</h4>
                   <p>Aktivieren Sie die Echtzeit-Websuche, um der KI zu helfen, aktuelle Informationen bereitzustellen:</p>
                   <ul>
                       <li>Klicken Sie auf den Web-Knopf, um die Web-Such-Fähigkeit umzuschalten</li>
                       <li>Wenn aktiviert, kann die KI das Internet nach aktuellen Informationen durchsuchen</li>
                       <li>Dies ist besonders nützlich für Fragen zu aktuellen Ereignissen oder spezifischen Fakten</li>
                       <li>Die Websuche sendet nur den Such-Prompt an das Web (Bing.com) für Anfragen, keine persönlichen Daten, Statistiken oder Metriken werden jemals gesendet</li>
                   </ul>
                   
                   <h4>Bild + Websuche (Erweiterte Funktion)</h4>
                   <p>Kombinieren Sie Bildanalyse mit Websuche für leistungsstarke visuelle Recherchefähigkeiten:</p>
                   <h5>Wie es funktioniert</h5>
                   <ol>
                       <li><strong>Bild hochladen</strong> - Fügen Sie ein Bild mit dem Bild-Upload-Knopf hinzu</li>
                       <li><strong>Websuche aktivieren</strong> - Stellen Sie sicher, dass der Web-Knopf aktiviert ist (Orange)</li>
                       <li><strong>Frage stellen</strong> - Beschreiben Sie, was Sie über Ihr Bild oder ähnliches finden möchten</li>
                       <li><strong>KI-Analyse</strong> - Die KI analysiert zuerst Ihr Bild, um Suchbegriffe zu generieren</li>
                       <li><strong>Websuche</strong> - Das System durchsucht das Web mit KI-generierten Schlüsselwörtern</li>
                       <li><strong>Kombinierte Antwort</strong> - Sie erhalten sowohl visuelle Analyse als auch Websuch-Ergebnisse</li>
                   </ol>
                   
                   <h5>Perfekt für:</h5>
                   <ul>
                       <li>Ähnliche Bilder oder Produkte online finden</li>
                       <li>Architekturstile, Kunstwerke oder Designs recherchieren</li>
                       <li>Pflanzen, Tiere oder Objekte mit zusätzlichem Kontext identifizieren</li>
                       <li>Marktinformationen über fotografierte Produkte erhalten</li>
                       <li>Historischen oder kulturellen Kontext für Bilder finden</li>
                       <li>Rückwärts-Bildsuche mit KI-Verbesserung</li>
                   </ul>
                   
                   <h5>Anforderungen:</h5>
                   <ul>
                       <li>Visuelles KI-Modell ausgewählt (Qwen2.5vl, Mistral-small3.1, Gemma3, LLaVA, etc.)</li>
                       <li>Websuche aktiviert (Web-Knopf aktiv)</li>
                       <li>Klares, hochwertiges Bild hochgeladen (Größe: max. 5MB)</li>
                       <li>Internetverbindung für Websuch-Funktionalität</li>
                   </ul>
                   
                   <h5>Beispielverwendung:</h5>
                   <p class="example-prompt"><strong>Beispiel-Prompt:</strong> "Finde Bilder und Informationen über Möbel ähnlich diesem Stuhl. Ich suche nach Mid-Century-Modern-Stücken mit ähnlichen Designelementen und möchte über Preise und Kaufmöglichkeiten wissen."</p>
                   <p>Dies würde zu folgendem Ergebnis führen:</p>
                   <ol>
                       <li>KI analysiert den Stil, die Materialien und Designmerkmale des Stuhls</li>
                       <li>Websuche nach "Mid-Century Modern Stuhl Holzbeine gepolsterter Sitz Design Möbel"</li>
                       <li>Kombinierte Antwort mit visueller Analyse + ähnliche Produkte + Preise + Händler</li>
                   </ol>
                   
                   <div class="note">
                       <p><strong>Profi-Tipp:</strong> Seien Sie spezifisch darüber, was Sie finden möchten. Anstatt nur "ähnliche Bilder finden" zu sagen, versuchen Sie "ähnliche Vintage-Poster aus den 1950ern mit Preisinformationen finden" oder "diese Pflanzenart identifizieren und Pflegeanleitungen finden."</p>
                   </div>
                   
                  <h4>Gespräche exportieren</h4>
                   <p>Sie können Ihre gesamte Gesprächshistorie in verschiedenen Formaten exportieren:</p>
                   <ul>
                       <li>Navigieren Sie zum Chat-Tab und scrollen Sie zum unteren Ende der Benutzeroberfläche</li>
                       <li>Klicken Sie auf den "Gespräch exportieren"-Knopf, der sich direkt über dem "Aktuelle Sitzung löschen"-Knopf befindet</li>
                       <li>Wählen Sie zwischen Klartext (.txt), Markdown (.md) oder HTML (.html) Formaten</li>
                       <li>Heruntergeladene Dateien enthalten alle Nachrichten und erhalten die Code-Formatierung bei</li>
                   </ul>
               `,
                images: [
                    {
                        src: "chat_export.png",
                        alt: "Chat-Export",
                        caption: "Chat-Export-Funktionen"
                    },
                    {
                        src: "thinking_toggle_button.png",
                        alt: "Natives Denk-Toggle",
                        caption: "Der Denk-Toggle-Button, der mit kompatiblen Modellen und Ollama 0.9.0+ erscheint"
                    }
                ]
            },
            {
                id: "chat-code-blocks",
                title: "Arbeiten mit Code-Blöcken",
                content: `
                <p>Paiperwork bietet erweiterte Unterstützung für Code-Blöcke in Gesprächen:</p>
                
                <h4>Code-Block-Funktionen</h4>
                <ul>
                    <li><strong>Syntax-Hervorhebung</strong> - Code wird basierend auf der Programmiersprache farbkodiert</li>
                    <li><strong>Spracherkennung</strong> - Die KI identifiziert und kennzeichnet automatisch die Code-Sprache</li>
                    <li><strong>Kopier-Button</strong> - Ein-Klick-Kopieren von Code-Blöcken in die Zwischenablage</li>
                    <li><strong>Zeilennummern</strong> - Für einfachere Referenz in längeren Snippets</li>
                </ul>
                
                <h4>Code ausführen</h4>
                <p>Für unterstützte Sprachen können Sie Code direkt aus der Chat-Oberfläche ausführen:</p>
                <ul>
                    <li><strong>HTML-Vorschau</strong> - Rendert HTML-Code, um das Ergebnis sofort zu sehen. Tipp: Bitten Sie die KI, jeglichen CSS- oder JavaScript-Code innerhalb des HTML einzuschließen, um Fehler zu vermeiden, da der HTML-Code in einem schwebenden Fenster isoliert wird, ohne Zugriff auf andere Konfigurations- oder Code-Dateien</li>
                </ul>
                
                <div class="note">
                    <p><strong>Sicherheitshinweis:</strong> Code-Ausführung erfolgt in isolierten Sandboxen, um Sicherheit zu gewährleisten.</p>
                </div>
            `,

                images: [
                    {
                        src: "code_blocks.png",
                        alt: "Code-Block-Funktionen",
                        caption:
                            "HTML-Code-Block mit Syntax-Hervorhebung und Ausführungsoptionen",
                    },
                    {
                        src: "HTML-sandboxed.png",
                        alt: "HTML-Code läuft in Sandbox",
                        caption: "HTML-Code läuft in einem isolierten schwebenden Fenster."
                    }
                ]
            },
            {
                id: "chat-scroll-behavior",
                title: "Scrollen und Navigation",
                content: `
                <p>Die Chat-Oberfläche enthält intelligentes Scroll-Verhalten zur Verbesserung der Benutzerfreundlichkeit während Gesprächen:</p>
                
                <h4>Automatisches Scrollen</h4>
                <ul>
                    <li>Neue Nachrichten scrollen automatisch in die Ansicht</li>
                    <li>Während der KI-Antwortgenerierung folgt die Ansicht der Nachricht, während sie wächst</li>
                    <li>Automatisches Scrollen deaktiviert sich vorübergehend, wenn Sie manuell nach oben scrollen, um frühere Nachrichten zu lesen</li>
                    <li>Automatisches Scrollen aktiviert sich nach einer Inaktivitätsperiode wieder (etwa 5 Sekunden)</li>
                    <li>Automatisches Scrollen aktiviert sich sofort wieder, wenn Sie ganz nach unten scrollen</li>
                </ul>
                
                <h4>Lange Gespräche</h4>
                <p>Zur Navigation in langen Gesprächen:</p>
                <ul>
                    <li>Scrollen Sie frei, um frühere Nachrichten zu überprüfen</li>
                    <li>Die klebrige Navigationsleiste bleibt oben zugänglich</li>
                    <li>Änderungen am System-Prompt oder der Kontextgröße fügen einen "Gespräch fortsetzen"-Button hinzu, um den Kontext aufrechtzuerhalten. Beachten Sie auch, dass wenn Ihnen der Kontext ausgeht, der Fortsetzungsbutton erscheint (Der Fortsetzungsbutton berechnet immer, wie viele vergangene Nachrichten basierend auf Ihrer aktuellen Kontextgröße zusammenzufassen sind und verwendet 25% davon, um zu vermeiden, dass vergangene Nachrichten Ihren Kontext überlasten)</li>
                </ul>
            `,
            },
            {
                id: "chat-conversation-sessions",
                title: "Verwaltung von Gesprächssitzungen",
                content: `
                <p>Paiperwork organisiert Ihre Gespräche in Sitzungsgruppen, die Ihnen helfen, verschiedene Diskussionsstränge innerhalb desselben Themas im Auge zu behalten.</p>
                
                <h4>Gesprächssitzungsliste</h4>
                <p>Die linke Seitenleiste in der Chat-Ansicht zeigt Ihre Gesprächssitzungen:</p>
                <ul>
                    <li>Jede Sitzung zeigt eine Vorschau der ersten Nachricht</li>
                    <li>Sitzungen zeigen das Datum und die Uhrzeit ihrer Erstellung</li>
                    <li>Sitzungen sind durch subtile Trennlinien für einfache Unterscheidung getrennt</li>
                    <li>Die neuesten Sitzungen erscheinen oben</li>
                </ul>
                
                <h4>Arbeiten mit Sitzungen</h4>
                <ul>
                    <li><strong>Sitzung laden</strong> - Klicken Sie auf eine beliebige Sitzung, um das Gespräch zu laden</li>
                    <li><strong>Sitzung löschen</strong> - Fahren Sie über eine Sitzung und klicken Sie auf den "×"-Button, der erscheint</li>
                    <li><strong>Aktive Sitzung</strong> - Die aktuell geladene Sitzung ist hervorgehoben</li>
                </ul>
                
                <h4>Ein neues Gespräch beginnen</h4>
                <p>Um ein frisches Gespräch zu beginnen, ohne Ihr Thema zu ändern:</p>
                <ol>
                    <li>Klicken Sie auf den "Neuer Chat"-Button oben in der Sitzungsliste</li>
                    <li>Dies löscht das aktuelle Gespräch und setzt den Kontext zurück</li>
                    <li>Eine Willkommensnachricht erscheint, die anzeigt, dass Sie ein neues Gespräch begonnen haben</li>
                    <li>Alle vorherigen Sitzungen bleiben in der Seitenleiste zugänglich</li>
                </ol>
                
                <h4>Gespräche fortsetzen</h4>
                <p>Wenn Sie eine vorherige Sitzung auswählen:</p>
                <ul>
                    <li>Der vollständige Gesprächsverlauf wird geladen</li>
                    <li>Ein "Gespräch fortsetzen"-Button erscheint unten</li>
                    <li>Klicken Sie auf diesen Button, um das Gespräch mit vollem Kontext fortzusetzen</li>
                    <li>Das Eingabefeld bleibt deaktiviert, bis Sie auf fortsetzen klicken, um versehentliche Nachrichten zu verhindern</li>
                </ul>
                
                <div class="note">
                    <p><strong>Hinweis:</strong> Das Löschen einer Sitzung ist permanent und kann nicht rückgängig gemacht werden. Wenn Sie eine Gesprächsgruppe löschen, wird nur dieser spezifische Thread entfernt - alle anderen Sitzungen innerhalb desselben Master-Keys bleiben intakt.</p>
                </div>
            `,
                image: "conversations-list.png",
                imageAlt: "Gesprächssitzungs-Oberfläche",
                imageCaption: "Die Sitzungsliste zeigt mehrere Gesprächsstränge mit Vorschautext und Zeitstempeln",
            },
        ],
    },
    documents: {
        title: "Dokumente",
        intro: "Der Dokumente-Tab ermöglicht es Ihnen, Ihre Dokumente mit KI-Unterstützung hochzuladen, zu verwalten und mit ihnen zu interagieren.",
        articles: [
            {
                id: "docs-intro",
                title: "Einführung in Dokumente",
                content: `
                <p>Der Dokumente-Tab ermöglicht es Ihnen, mit Ihren Text- und PDF-Dokumenten zu arbeiten und dabei KI zu nutzen, um Informationen zu verstehen und zu extrahieren.</p>
                
                <p>Mit der Dokumente-Funktion können Sie:</p>
                <ul>
                    <li>PDF- und Textdateien hochladen</li>
                    <li>Fragen zu spezifischen Dokumenten stellen</li>
                    <li>Umfassende Zusammenfassungen erstellen</li>
                    <li>Ihre Dokumentensammlung durchsuchen</li>
                    <li>Ihre Dokumentenbibliothek verwalten</li>
                </ul>
                
                <div class="note">
                    <p><strong>Hinweis:</strong> Dokumente werden sicher mit Ihrem Hauptschlüssel verschlüsselt und lokal auf Ihrem Gerät gespeichert, um zu gewährleisten, dass Ihre sensiblen Informationen privat bleiben.</p>
                </div>
            `,
                image: "documents_intro.png",
                imageAlt: "Dokumente-Tab Übersicht",
                imageCaption: "Die Dokumente-Tab-Oberfläche zeigt den Upload-Bereich und die Dokumentenliste",
            },
            {
                id: "docs-model-compatibility",
                title: "Modellkompatibilität für Dokumente",
                content: `
                <p>Die Dokumente-Funktion benötigt KI-Modelle, die Embeddings unterstützen, um ordnungsgemäß zu funktionieren. Das Verständnis der Modellkompatibilität hilft Ihnen, Probleme zu vermeiden und Ihren Dokumenten-Workflow zu optimieren.</p>
                
                <h4>Modelle und Embedding-Unterstützung</h4>
                <p>Damit die Dokumentenverarbeitung und Suchfunktionalität funktioniert, benötigen Sie Modelle, die das Generieren von Embeddings unterstützen:</p>
                <ul>
                  <li><strong>Kompatible Modelle</strong> umfassen: nomic-embed-text, llama3 (verschiedene Größen), mistral, mixtral und andere Modelle, die speziell zur Unterstützung von Embeddings entwickelt wurden (Deepseek, Qwen, etc.)</li>
                  <li><strong>Inkompatible Modelle</strong>: Einige Modelle unterstützen keine Embeddings und lösen eine Warnmeldung aus, wenn Sie versuchen, sie mit der Dokumente-Funktion zu verwenden</li>
                  <li><strong>Visuelle Modelle</strong>: Bei visuellen Modellen wird manchmal die Embedding-Verarbeitung aus ihrem Code entfernt</li>
                </ul>
                
                <h4>Embedding-Warnsystem</h4>
                <p>Wenn Sie versuchen, ein Modell zu verwenden, das keine Embeddings für Dokumentenoperationen unterstützt, wird das System:</p>
                <ul>
                  <li>Eine auffällige Warnmeldung anzeigen</li>
                  <li>Erklären, dass das ausgewählte Modell mit der Dokumentensuchfunktionalität inkompatibel ist</li>
                  <li>Alternative Modelle vorschlagen, die Embeddings unterstützen</li>
                  <li>Einen Link bereitstellen, um embedding-fähige Modelle zu finden</li>
                </ul>
                <p>Die Warnmeldung schließt sich automatisch nach 30 Sekunden oder Sie können sie manuell durch Klicken auf die Schaltfläche "Verstanden" schließen.</p>
                
                <h4>Workflow-Optimierung</h4>
                <p>Sie können Ihren Dokumenten-Workflow optimieren, indem Sie verstehen, wann Embeddings erstellt und verwendet werden:</p>
                <ul>
                  <li><strong>Erste Dokumentenverarbeitung</strong>: Embeddings werden erstellt, wenn Sie Dokumente zum ersten Mal hochladen und verarbeiten</li>
                  <li><strong>Nachfolgende Dokumentenanfragen</strong>: Nach der Verarbeitung von Dokumenten können Sie zu einem anderen Modell (mit Embedding-Unterstützung) für Anfragen wechseln, ohne Embeddings neu generieren zu müssen</li>
                </ul>
                
                <h4>Verwendung verschiedener Modelle für verschiedene Aufgaben</h4>
                <p>Eine nützliche Workflow-Strategie:</p>
                <ol>
                  <li>Wählen Sie ein kleineres embedding-fähiges Modell (wie nomic-embed-text) beim Hochladen und Verarbeiten von Dokumenten</li>
                  <li>Nach der Dokumentenverarbeitung können Sie zu einem leistungsstärkeren Modell (mit Embedding-Unterstützung) für bessere Antworten wechseln</li>
                  <li>Das System verwendet die gespeicherten Embeddings aus der ursprünglichen Verarbeitung, unabhängig davon, welches Modell Sie aktuell ausgewählt haben</li>
                </ol>
                
                <div class="note">
                  <p><strong>Profi-Tipp:</strong> Für optimale Ergebnisse verwenden Sie dedizierte Embedding-Modelle wie nomic-embed-text für die anfängliche Dokumentenverarbeitung und wechseln dann zu größeren Sprachmodellen wie llama3:70b, Gemma3, Qwen3, etc., für anspruchsvollere Dokumentenanfragen und -analysen.</p>
                </div>
              `,
                image: "model-embedding-warning.png",
                imageAlt: "Modell-Embedding-Warnung",
                imageCaption: "Warnmeldung beim Versuch, ein Modell zu verwenden, das keine Embeddings unterstützt"
            },
            {
                id: "docs-uploading",
                title: "Dokumente hochladen",
                content: `
                <p>Sie können Dokumente einfach über die Upload-Oberfläche zu Ihrer Bibliothek hinzufügen.</p>
                
                <h4>So laden Sie Dokumente hoch</h4>
                <ol>
                    <li>Navigieren Sie zum Dokumente-Tab</li>
                    <li>Ziehen Sie PDF- oder Textdateien in die Upload-Zone oder klicken Sie auf den Upload-Bereich, um nach Dateien zu suchen</li>
                    <li>Wählen Sie eine oder mehrere Dateien von Ihrem Gerät aus</li>
                    <li>Warten Sie, bis die Verarbeitung abgeschlossen ist</li>
                </ol>
                
                <h4>Verarbeitung Ihrer Dokumente</h4>
                <p>Wenn Sie Dokumente hochladen, führt das System folgende Schritte aus:</p>
                <ul>
                    <li>Überprüft PDF-Dateien auf extrahierbaren Textinhalt</li>
                    <li>Teilt den Inhalt in handhabbare Abschnitte auf</li>
                    <li>Erstellt KI-freundliche Darstellungen (Embeddings) des Inhalts</li>
                    <li>Verschlüsselt und speichert alles sicher lokal</li>
                    <li>Macht das Dokument für Fragen und Suchen verfügbar</li>
                </ul>
                
                <h4>PDF-Texterkennung</h4>
                <p>Paiperwork überprüft automatisch PDF-Dateien, um sicherzustellen, dass sie extrahierbaren Text enthalten:</p>
                <ul>
                    <li>Jede PDF wird analysiert, um Textinhalt zu erkennen, bevor die Verarbeitung beginnt</li>
                    <li>Wenn eine PDF keinen extrahierbaren Text enthält (wie gescannte Bilder ohne OCR), erhalten Sie eine Warnmeldung</li>
                    <li>PDFs ohne Text können nicht für RAG verarbeitet werden, da sie Textinhalt für Embedding und Suche benötigen</li>
                    <li>Für reine Bild-PDFs erwägen Sie die Verwendung eines visuellen KI-Modells zur Textextraktion oder eines OCR-Tools, um Bilder vor dem Hochladen in Text umzuwandeln</li>
                </ul>
                
                <div class="note">
                    <p><strong>Wichtig:</strong> Verwenden Sie beim Hochladen und Verarbeiten von Dateien den <strong>Embedding-Modell</strong>-Selektor im Dokumente-Tab. Dieser Selektor zeigt embedding-fähige Modelle an und wählt automatisch das erste verfügbare Modell aus.</p>
                    <p>Wenn kein Embedding-Modell verfügbar ist, erscheint ein Hinweisfenster mit Beispiel-Modellnamen und einer Schaltfläche <strong>Modell herunterladen</strong>, die den Modelle-Tab öffnet.</p>
                    <p><strong>Hinweis:</strong> Die globale Dokumentensuche verwendet das im Chat-Tab ausgewählte Modell.</p>
                </div>
            `,
                image: "documents-upload.png",
                imageAlt: "Dokument-Upload-Prozess",
                imageCaption: "Upload-Zone mit Fortschrittsanzeige für die Dokumentenverarbeitung",
            },
            {
                id: "docs-management",
                title: "Verwaltung Ihrer Dokumente",
                content: `
                <p>Nach dem Hochladen erscheinen Ihre Dokumente in der Dokumentenliste, wo Sie sie verwalten können.</p>
                
                <h4>Dokumenteninformationen</h4>
                <p>Jeder Dokumenteneintrag zeigt:</p>
                <ul>
                    <li>Dokumententitel/Dateiname</li>
                    <li>Autoreninformationen (falls verfügbar)</li>
                    <li>Datum der Hinzufügung zu Ihrer Bibliothek</li>
                    <li>Seitenzahl (für PDF-Dateien)</li>
                    <li>Anzahl der erstellten Textabschnitte</li>
                    <li>Verarbeitungsstatus (Verarbeitung oder Indexiert)</li>
                </ul>
                
                <h4>Dokumentenaktionen</h4>
                <p>Sie können verschiedene Aktionen mit Ihren Dokumenten durchführen:</p>
                <ul>
                    <li><strong>Auswählen/Abwählen</strong> - Klicken Sie auf ein Dokument, um es auszuwählen und weitere Optionen zu erhalten</li>
                    <li><strong>Löschen</strong> - Ein Dokument aus Ihrer Bibliothek entfernen</li>
                    <li><strong>Zusammenfassung erstellen</strong> - Eine umfassende Zusammenfassung des Dokumenteninhalts erstellen</li>
                    <li><strong>Fragen stellen</strong> - In den Dokumentenmodus wechseln, um spezifische Fragen zum Dokument zu stellen</li>
                </ul>
            `,
                image: "documents_management.png",
                imageAlt: "Dokumentenverwaltungs-Oberfläche",
                imageCaption: "Die Dokumentenverwaltungs-Oberfläche zeigt Dokumenteneinträge und Aktionsschaltflächen",
            },
            {
                id: "docs-summaries",
                title: "Dokumentenzusammenfassungen",
                content: `
                <p>Die Zusammenfassungsfunktion erstellt einen umfassenden Überblick über den Inhalt Ihres Dokuments und hilft Ihnen, schnell die wichtigsten Punkte zu verstehen.</p>
                
                <h4>Erstellen einer Zusammenfassung</h4>
                <ol>
                    <li>Wählen Sie ein Dokument aus Ihrer Bibliothek aus (klicken Sie darauf)</li>
                    <li>Klicken Sie auf die Schaltfläche "Zusammenfassung erstellen", die erscheint</li>
                    <li>Warten Sie, während die KI Ihr Dokument liest und analysiert</li>
                    <li>Überprüfen Sie die generierte Zusammenfassung im Modal-Fenster</li>
                </ol>
                
                <h4>Zusammenfassungsfunktionen</h4>
                <ul>
                    <li><strong>Fortschrittsverfolgung</strong> - Beobachten Sie den Fortschrittsbalken, während die KI Ihr Dokument bearbeitet</li>
                    <li><strong>Schrittweise Anzeige</strong> - Sehen Sie, wie sich die Zusammenfassung bei längeren Dokumenten in Echtzeit aufbaut</li>
                    <li><strong>Kopieren-Schaltfläche</strong> - Kopieren Sie die gesamte Zusammenfassung mit einem Klick in Ihre Zwischenablage</li>
                    <li><strong>Abbrechen-Option</strong> - Stoppen Sie die Zusammenfassungserstellung bei Bedarf</li>
                </ul>
                
                <h4>Kontextgrößen-Anforderungen</h4>
                <p>Je größer die Dokumentenzusammenfassung, desto mehr Kontext benötigen Sie in Ihrem KI-Modell. Als allgemeine Richtlinie:</p>
                <ul>
                    <li><strong>Kleine Dokumente</strong> (unter 5.000 Wörtern) - 4K Kontextgröße ist normalerweise ausreichend</li>
                    <li><strong>Mittlere Dokumente</strong> (5.000-15.000 Wörter) - 8K Kontextgröße empfohlen</li>
                    <li><strong>Große Dokumente</strong> (15.000-50.000 Wörter) - 16K Kontextgröße oder größer</li>
                    <li><strong>Sehr große Dokumente</strong> (50.000+ Wörter) - 32K Kontextgröße oder größer</li>
                </ul>
                <p>Zur Orientierung: Eine typische einfach beabstandete Seite enthält etwa 500 Wörter, daher würde eine 20-seitige PDF mindestens 8K Kontext für eine effektive Zusammenfassung benötigen.</p>
                
                <div class="note">
                    <p><strong>Tipp:</strong> Für große Dokumente verarbeitet das System sie in kleineren Chargen und erstellt dann eine Gesamtzusammenfassung, um eine umfassende Abdeckung auch für längere Inhalte zu gewährleisten.</p>
                </div>
            `,
                image: "document_summary.png",
                imageAlt: "Dokumentenzusammenfassungs-Modal",
                imageCaption: "Zusammenfassungs-Modal zeigt generierte Dokumentenübersicht mit Kopier-Option",
            },
            {
                id: "docs-questioning",
                title: "Fragen zu Dokumenten stellen",
                content: `
                <p>Der Dokumentenmodus ermöglicht es Ihnen, ein Gespräch mit der KI speziell über ein einzelnes Dokument zu führen.</p>
                
                <h4>In den Dokumentenmodus wechseln</h4>
                <ol>
                    <li>Wählen Sie ein Dokument aus Ihrer Bibliothek aus</li>
                    <li>Klicken Sie auf die Schaltfläche "Fragen stellen"</li>
                    <li>Das System leitet Sie zum Chat-Tab mit aktiviertem Dokumentenmodus weiter</li>
                    <li>Ein spezieller Indikator zeigt an, dass Sie sich im Dokumentenmodus befinden</li>
                </ol>
                
                <h4>Verwendung des Dokumentenmodus</h4>
                <ul>
                    <li>Stellen Sie spezifische Fragen zum Inhalt des Dokuments</li>
                    <li>Bitten Sie um Erklärungen von Konzepten, die im Dokument erwähnt werden</li>
                    <li>Fragen Sie nach Vergleichen zwischen verschiedenen Abschnitten</li>
                    <li>Bitten Sie um Fakteinformationen, die im Dokument enthalten sind</li>
                </ul>
                
                <h4>Dokumentenmodus verlassen</h4>
                <p>Wenn Sie mit der Arbeit an einem spezifischen Dokument fertig sind:</p>
                <ul>
                    <li>Klicken Sie auf die Schaltfläche "Dokumentenmodus verlassen" in der Indikatorleiste</li>
                    <li>Sie kehren zum normalen Chat-Modus zurück, wo Sie allgemeine Themen besprechen können</li>
                </ul>
                
                <div class="note">
                    <p><strong>Wichtig:</strong> Im Dokumentenmodus konzentriert sich die KI ausschließlich auf den Inhalt des ausgewählten Dokuments und nutzt ihr Wissen zur Interpretation, fügt aber keine externen Informationen hinzu.</p>
                </div>

                <div class="note">
                    <p><strong>Hinweis zu Cloud-Modellen:</strong> Bei der Nutzung von Cloud-Modellen in Free-Tiers können Antworten im Modus "Fragen stellen" begrenzt oder abgeschnitten werden, da RAG-Prompts groß sind. Für dauerhaft vollständige längere Antworten sollte ein kostenpflichtiger Cloud-Tier verwendet werden.</p>
                </div>
            `,
                image: "document_mode.png",
                imageAlt: "Dokumentenmodus-Oberfläche",
                imageCaption: "Chat-Oberfläche zeigt Dokumentenmodus-Indikator beim Stellen von Fragen zu einem spezifischen Dokument",
            },
            {
                id: "docs-searching",
                title: "Durchsuchen von Dokumenten",
                content: `
                <p>Paiperwork macht es einfach, Informationen in allen Ihren hochgeladenen Dokumenten direkt über die Chat-Oberfläche zu suchen.</p>
                
                <h4>Globale Dokumentensuche</h4>
                <p>Wenn Sie sich im Dokumente-Tab befinden, durchsuchen alle Fragen, die Sie über die Chat-Oberfläche stellen, automatisch alle Ihre Dokumente:</p>
                <ol>
                    <li>Wechseln Sie zuerst zum Dokumente-Tab, um die Dokumentensuchfunktionalität zu aktivieren</li>
                    <li>Geben Sie Ihre Suchanfrage oder Frage in das Chat-Eingabefeld ein</li>
                    <li>Die KI durchsucht automatisch alle Ihre Dokumente nach relevanten Informationen</li>
                    <li>Ergebnisse aus mehreren Dokumenten werden zu einer umfassenden Antwort zusammengefasst</li>
                </ol>
                
                <h4>Suchergebnisse</h4>
                <p>Bei der Verwendung der Dokumentensuche wird die KI:</p>
                <ul>
                    <li>Einen "Dokumente durchsuchen..."-Indikator anzeigen, während Informationen gesammelt werden</li>
                    <li>Die relevantesten Passagen in allen Ihren Dokumenten finden</li>
                    <li>Ergebnisse aus verschiedenen Dokumenten priorisieren, um umfassende Abdeckung zu bieten</li>
                    <li>Semantische Suche verwenden, um die Bedeutung Ihrer Anfrage zu verstehen, nicht nur Schlüsselwörter abzugleichen</li>
                    <li>Eine Antwort generieren, die Informationen aus allen relevanten Dokumenten synthetisiert</li>
                    <li>Zitate zu Quelldokumenten einschließen, wenn angemessen</li>
                </ul>
                
                <h4>Semantische vs. Schlüsselwort-Suche</h4>
                <p>Paiperwork verwendet semantische Suchtechnologie, die die Bedeutung hinter Ihren Fragen versteht:</p>
                <ul>
                    <li>Sie können in natürlicher Sprache fragen, anstatt spezifische Schlüsselwörter zu verwenden</li>
                    <li>Das System findet konzeptionell verwandte Informationen, auch wenn sich die exakten Begriffe unterscheiden</li>
                    <li>Die Suche ist kontextbewusst und versteht Synonyme und verwandte Konzepte</li>
                    <li>Ergebnisse werden nach Relevanz zu Ihrer spezifischen Frage eingestuft</li>
                </ul>
                
                <div class="note">
                    <p><strong>Tipp:</strong> Für beste Ergebnisse stellen Sie spezifische Fragen zu den Informationen, die Sie suchen, anstatt allgemeine Suchbegriffe zu verwenden. Fragen Sie zum Beispiel "Was sind die Quartalsumsatzzahlen für 2024?" anstatt nur "Verkaufsdaten".</p>
                </div>
            `,
            },
            {
                id: "docs-memory-limits",
                title: "Speicherbegrenzungen und bewährte Praktiken",
                content: `
                <p>Bei der Arbeit mit Dokumenten in Paiperwork ist es wichtig zu verstehen, wie die Speichernutzung die Leistung beeinflusst, insbesondere bei der Verwendung der globalen Dokumentensuche.</p>
                
                <h4>Speicherüberlegungen bei der globalen Suche</h4>
                <p>Die globale Dokumentensuche (gleichzeitiges Durchsuchen aller Dokumente) kann speicherintensiv sein, weil:</p>
                <ul>
                    <li>Alle relevanten Dokumentenabschnitte müssen gleichzeitig in den Speicher geladen werden</li>
                    <li>Das KI-Modell muss diese Abschnitte zusammen mit Ihrer Anfrage verarbeiten</li>
                    <li>Webbrowser haben begrenzte Speicherzuteilung im Vergleich zu Desktop-Anwendungen</li>
                    <li>Mit zunehmender Dokumentenanzahl und -größe steigen die Speicheranforderungen exponentiell</li>
                </ul>
                
                <h4>Anzeichen von Speicherdruck</h4>
                <p>Achten Sie auf diese Indikatoren, dass Sie sich Speichergrenzen nähern:</p>
                <ul>
                    <li>Browser wird träge oder reagiert nicht mehr</li>
                    <li>Lange Verzögerungen beim Wechseln zwischen Tabs</li>
                    <li>Fehlermeldungen über "nicht genügend Speicher" oder ähnliche Warnungen</li>
                    <li>Browser-Tab stürzt ab oder friert ein</li>
                    <li>Unerwartet beendete KI-Antworten</li>
                </ul>
                
                <h4>Bewährte Praktiken für die Dokumentenverwaltung</h4>
                <p>Um Speicherprobleme bei der Arbeit mit Dokumenten zu vermeiden:</p>
                <ul>
                    <li><strong>Verwenden Sie den dokumentenspezifischen Modus</strong> - Bei der Arbeit mit großen Dokumenten wählen Sie ein spezifisches Dokument aus und verwenden "Fragen stellen", um in den Dokumentenmodus zu wechseln, anstatt die globale Suche zu verwenden</li>
                    <li><strong>Begrenzen Sie die Nutzung der globalen Suche</strong> - Reservieren Sie die globale Suche für Szenarien mit kleineren Dokumentensammlungen oder wenn Sie speziell Informationen über mehrere Dokumente hinweg finden müssen</li>
                    <li><strong>Organisieren Sie Dokumente strategisch</strong> - Gruppieren Sie verwandte Dokumente, damit Sie mit gezielten Teilmengen anstatt Ihrer gesamten Bibliothek arbeiten können</li>
                    <li><strong>Schließen Sie andere Anwendungen</strong> - Bei der Arbeit mit großen Dokumenten schließen Sie andere speicherintensive Anwendungen und Browser-Tabs</li>
                    <li><strong>Gelegentlich neu starten</strong> - Für erweiterte Dokumentenarbeitssitzungen starten Sie Ihren Browser regelmäßig neu, um den Speicher zu leeren</li>
                </ul>
                
                <h4>Empfehlungen zur Dokumentengröße</h4>
                <p>Als allgemeine Richtlinie für die globale Suche:</p>
                <ul>
                    <li><strong>Sichere Nutzung</strong>: 5-10 kleine bis mittlere Dokumente (unter 20 Seiten jeweils)</li>
                    <li><strong>Vorsicht erforderlich</strong>: 10-20 Dokumente oder mehrere größere Dokumente (20-50 Seiten)</li>
                    <li><strong>Nicht empfohlen</strong>: 20+ Dokumente oder mehrere große Dokumente (50+ Seiten)</li>
                </ul>
                
                <div class="note">
                    <p><strong>Wichtig:</strong> Die globale Dokumentensuche ist für bequemen Zugriff auf eine moderate Sammlung von Dokumenten konzipiert. Für intensive Recherche mit großen Dokumenten oder umfangreichen Sammlungen verwenden Sie stattdessen den dokumentenspezifischen Fragemodus. Dies konzentriert Speicherressourcen auf ein einzelnes Dokument zur Zeit und bietet bessere Leistung und Stabilität.</p>
                </div>
            `,
            }
        ],
    },
    dataviz: {
        title: "DataViz",
        intro:
            "Der DataViz-Tab ermöglicht es Ihnen, interaktive Datenvisualisierungen zu erstellen, indem Sie Ihre Daten der KI beschreiben.",
        articles: [
            {
                id: "dataviz-intro",
                title: "Einführung in die Datenvisualisierung",
                content: `
                <p>Der DataViz-Tab ermöglicht es Ihnen, verschiedene Diagramme und Grafiken aus natürlichsprachlichen Beschreibungen Ihrer Daten zu generieren. Wählen Sie einfach einen Visualisierungstyp aus und beschreiben Sie Ihre Daten der KI.</p>
                
                <p>Mit DataViz können Sie:</p>
                <ul>
                    <li>Visualisierungen aus Textbeschreibungen erstellen</li>
                    <li>Diagramme generieren, ohne Daten manuell formatieren zu müssen</li>
                    <li>Aus mehreren Visualisierungstypen wählen</li>
                    <li>Ergebnisse sofort in einem interaktiven Fenster sehen</li>
                    <li>Generierte Visualisierungen für die Verwendung in anderen Anwendungen kopieren</li>
                </ul>
                
                <p>DataViz ist perfekt, um Konzepte schnell zu visualisieren, Datenpunkte zu vergleichen oder Trends zu erkunden, ohne Tabellenkalkulationen oder spezialisierte Tools zu benötigen.</p>
            `,
                image: "dataviz_intro.png",
                imageAlt: "DataViz-Tab Übersicht",
                imageCaption:
                    "Die DataViz-Tab-Oberfläche mit Visualisierungstyp-Optionen",
            },
            {
                id: "dataviz-types",
                title: "Verfügbare Visualisierungstypen",
                content: `
                <p>DataViz bietet mehrere Visualisierungsoptionen für verschiedene Datentypen und analytische Bedürfnisse:</p>
                
                <h4>Kreisdiagramme</h4>
                <p>Am besten für die Darstellung von Anteilen eines Ganzen oder zum Vergleich von Teilen einer Gesamtheit. Ideal für:</p>
                <ul>
                    <li>Marktanteilsverteilung</li>
                    <li>Budgetzuteilung</li>
                    <li>Umfrageantworten-Aufschlüsselung</li>
                    <li>Alle Daten, deren Komponenten sich zu 100% summieren</li>
                </ul>
                
                <h4>Balkendiagramme</h4>
                <p>Perfekt zum Vergleichen von Mengen zwischen verschiedenen Kategorien. Gut für:</p>
                <ul>
                    <li>Verkaufsvergleiche nach Region</li>
                    <li>Bevölkerungsstatistiken</li>
                    <li>Umfrageergebnisse mit Multiple-Choice-Fragen</li>
                    <li>Leistungskennzahlen über Zeiträume hinweg</li>
                </ul>
                
                <h4>Liniendiagramme</h4>
                <p>Ideal für die Darstellung von Trends über Zeit oder kontinuierliche Daten. Verwenden für:</p>
                <ul>
                    <li>Aktienkurse über Zeit</li>
                    <li>Temperaturveränderungen</li>
                    <li>Umsatzwachstum</li>
                    <li>Alle Daten mit einer klaren Progression</li>
                </ul>
                
                <h4>Streudiagramme</h4>
                <p>Am besten für die Darstellung von Beziehungen zwischen zwei Variablen. Perfekt für:</p>
                <ul>
                    <li>Korrelationsanalyse</li>
                    <li>Verteilungsmuster</li>
                    <li>Identifizierung von Ausreißern</li>
                    <li>Clustering ähnlicher Datenpunkte</li>
                </ul>
                
                <h4>Flächendiagramme</h4>
                <p>Ähnlich wie Liniendiagramme, aber mit gefüllten Bereichen unter den Linien. Gut für:</p>
                <ul>
                    <li>Darstellung von Volumenänderungen über Zeit</li>
                    <li>Vergleich kumulativer Gesamtsummen</li>
                    <li>Visualisierung von Teil-zu-Ganzes-Beziehungen über Zeit</li>
                    <li>Betonung der Größenordnung von Änderungen</li>
                </ul>
                
                <h4>Netzdiagramme</h4>
                <p>Zeigt multivariate Daten als zweidimensionales Diagramm mit drei oder mehr quantitativen Variablen an. Ideal für:</p>
                <ul>
                    <li>Leistungsvergleiche über mehrere Dimensionen</li>
                    <li>Fähigkeitsbewertungen</li>
                    <li>Funktionsvergleiche von Produkten</li>
                    <li>Alle Daten mit mehreren zu vergleichenden Attributen</li>
                </ul>
                
                <h4>Heatmaps</h4>
                <p>Verwendet Farbintensität zur Darstellung von Werten in einem Matrixformat. Perfekt für:</p>
                <ul>
                    <li>Korrelationsmatrizen</li>
                    <li>Geografische Datenintensität</li>
                    <li>Website-Klickmuster</li>
                    <li>Aufzeigen von Mustern in komplexen Datensätzen</li>
                </ul>
                
                <h4>Blasendiagramme</h4>
                <p>Wie Streudiagramme, aber mit einer zusätzlichen Dimension, die durch die Blasengröße dargestellt wird. Gut für:</p>
                <ul>
                    <li>Vergleich von drei Datendimensionen</li>
                    <li>Portfolio-Analyse</li>
                    <li>Ressourcenallokations-Visualisierung</li>
                    <li>Demografische Vergleiche</li>
                </ul>
            `,
                image: "chart_types.png",
                imageAlt: "Diagrammtypen",
                imageCaption: "Die verschiedenen in DataViz verfügbaren Visualisierungstypen",
            },
            {
                id: "dataviz-usage",
                title: "Erstellen von Visualisierungen",
                content: `
                <p>Das Erstellen von Datenvisualisierungen mit DataViz ist einfach:</p>
                
                <h4>Schritt 1: Visualisierungstyp auswählen</h4>
                <ol>
                    <li>Navigieren Sie zum DataViz-Tab</li>
                    <li>Durchsuchen Sie die verfügbaren Diagrammtypen</li>
                    <li>Klicken Sie auf Ihre bevorzugte Visualisierung (Kreis, Balken, Linie, etc.)</li>
                </ol>
                
                <h4>Schritt 2: Ihre Daten beschreiben</h4>
                <ol>
                    <li>Nach der Auswahl eines Diagrammtyps kehren Sie zur Chat-Oberfläche zurück</li>
                    <li>Beachten Sie, dass das Eingabefeld nun eine spezialisierte Eingabeaufforderung für Ihr ausgewähltes Diagramm zeigt</li>
                    <li>Beschreiben Sie die Daten, die Sie visualisieren möchten, in natürlicher Sprache</li>
                    <li>Seien Sie so spezifisch wie möglich über Kategorien, Werte und Beziehungen</li>
                </ol>
                
                <h4>Schritt 3: Visualisierung generieren und anzeigen</h4>
                <ol>
                    <li>Die KI wird Ihre Beschreibung verarbeiten und ein geeignetes Diagramm generieren</li>
                    <li>Ein schwebendes Fenster zeigt die Visualisierung an</li>
                    <li>Wenn das Diagramm nicht Ihren Erwartungen entspricht, können Sie es durch klarere Anweisungen modifizieren</li>
                </ol>
                
                <div class="note">
                    <p><strong>Tipp:</strong> Für beste Ergebnisse fügen Sie spezifische numerische Werte in Ihre Beschreibung ein. Zum Beispiel, anstatt zu sagen "Verkäufe waren höher in Q2", sagen Sie "Verkäufe waren 12.000€ in Q1 und 15.500€ in Q2."</p>
                </div>
            `,
                image: "dataviz_create.png",
                imageAlt: "Erstellen einer Visualisierung",
                imageCaption:
                    "Der Prozess der Erstellung einer Datenvisualisierung aus einer Textbeschreibung",
            },
            {
                id: "dataviz-examples",
                title: "Beispiel-Eingabeaufforderungen",
                content: `
                <p>Hier sind einige Beispiel-Eingabeaufforderungen, um Ihnen den Einstieg in verschiedene Visualisierungstypen zu erleichtern:</p>
                
                <h4>Kreisdiagramm-Beispiel</h4>
                <p class="example-prompt">"Erstelle ein Kreisdiagramm, das Browser-Marktanteile zeigt mit Chrome bei 65%, Safari bei 18%, Firefox bei 8%, Edge bei 5% und Andere bei 4%."</p>
                
                <h4>Balkendiagramm-Beispiel</h4>
                <p class="example-prompt">"Generiere ein Balkendiagramm, das monatliche Verkäufe für Q1 2024 vergleicht: Januar 45.000€, Februar 52.000€ und März 61.000€."</p>
                
                <h4>Liniendiagramm-Beispiel</h4>
                <p class="example-prompt">"Zeige ein Liniendiagramm der Durchschnittstemperaturen in Berlin über 2023: Jan 0°C, Feb 2°C, Mär 6°C, Apr 11°C, Mai 17°C, Jun 22°C, Jul 25°C, Aug 24°C, Sep 20°C, Okt 13°C, Nov 7°C, Dez 2°C."</p>
                
                <h4>Multi-Serien-Beispiel</h4>
                <p class="example-prompt">"Erstelle ein Balkendiagramm, das Smartphone-Nutzungsstunden nach Altersgruppe vergleicht: Teenager (14 Std/Woche), Junge Erwachsene (12 Std/Woche), Mittleres Alter (8 Std/Woche) und Senioren (4 Std/Woche). Füge auch Social-Media-Nutzungsstunden hinzu: Teenager (10 Std/Woche), Junge Erwachsene (8 Std/Woche), Mittleres Alter (5 Std/Woche) und Senioren (2 Std/Woche)."</p>
                
                <h4>Streudiagramm-Beispiel</h4>
                <p class="example-prompt">"Generiere ein Streudiagramm, das die Beziehung zwischen Lernstunden (x-Achse) und Testergebnissen (y-Achse) für 10 Studenten zeigt: (2 Std, 65%), (3 Std, 70%), (5 Std, 85%), (8 Std, 95%), (4 Std, 75%), (6 Std, 90%), (2 Std, 60%), (7 Std, 92%), (3,5 Std, 72%), (5,5 Std, 88%)."</p>
                
                <h4>Netzdiagramm-Beispiel</h4>
                <p class="example-prompt">"Erstelle ein Netzdiagramm, das drei Smartphones über fünf Kategorien vergleicht: Telefon A (Akku: 90, Kamera: 85, Leistung: 95, Design: 80, Preis: 70), Telefon B (Akku: 75, Kamera: 95, Leistung: 90, Design: 85, Preis: 65), Telefon C (Akku: 95, Kamera: 75, Leistung: 80, Design: 90, Preis: 85)."</p>
                
                <h4>Heatmap-Beispiel</h4>
                <p class="example-prompt">"Erstelle eine Heatmap, die die Korrelation zwischen verschiedenen Programmiersprachen und ihrer Beliebtheit in verschiedenen Industriesektoren in 2025 zeigt. Füge Daten für Sprachen wie Python (KI/ML: 98, Finanzen: 85, Gesundheitswesen: 70, Gaming: 60, E-Commerce: 92), JavaScript (Finanzen: 95, Gesundheitswesen: 55, Gaming: 75, E-Commerce: 98, Medien: 90), Rust (Finanzen: 45, Gesundheitswesen: 35, Gaming: 90, IoT: 80, Cybersicherheit: 85), Go (Finanzen: 55, Gesundheitswesen: 45, Gaming: 35, IoT: 95, Cloud: 85) und PHP (E-Commerce: 60, Medien: 50, Bildung: 40, Regierung: 30, Gesundheitswesen: 35) hinzu. Verwende eine Farbskala von hellblau bis dunkelblau, wobei dunklere Farben höhere Adoptionsraten darstellen."</p>

                <h4>Blasendiagramm-Beispiel</h4>
                <p class="example-prompt">"Generiere ein Blasendiagramm, das die Adoption erneuerbarer Energien verschiedener Länder vergleicht. Auf der x-Achse zeige das BIP pro Kopf (USA: 65000, Deutschland: 48000, China: 12000, Indien: 2500, Brasilien: 7000, Japan: 40000). Auf der y-Achse zeige den Prozentsatz erneuerbarer Energie im gesamten Energiemix (USA: 20%, Deutschland: 45%, China: 25%, Indien: 35%, Brasilien: 85%, Japan: 30%). Verwende die Blasengröße zur Darstellung der Bevölkerung in Millionen (USA: 330, Deutschland: 83, China: 1400, Indien: 1380, Brasilien: 212, Japan: 126). Beschrifte jede Blase mit dem Ländernamen und betitle das Diagramm 'Adoption erneuerbarer Energien vs. Wirtschaftsentwicklung (2025)'."</p>
                
                <div class="note">
                    <p><strong>Hinweis:</strong> Wenn Ihr erster Versuch nicht die gewünschte Visualisierung erzeugt, versuchen Sie, Ihre Beschreibung mit spezifischeren Details über Kategorien, Werte und Beziehungen zu verfeinern.</p>
                </div>
            `,
                image: "dataviz_examples.png",
                imageAlt: "Beispiel-Visualisierungen",
                imageCaption:
                    "Beispiele von Visualisierungen, die aus Textbeschreibungen erstellt wurden",
            },
            {
                id: "dataviz-advanced",
                title: "Erweiterte Tipps",
                content: `
                <p>Holen Sie das Beste aus DataViz mit diesen erweiterten Techniken heraus:</p>
                
                <h4>Anpassung von Visualisierungen</h4>
                <p>Sie können spezifische Anpassungen in Ihrer Eingabeaufforderung anfordern:</p>
                <ul>
                    <li>"Verwende blaue und grüne Farben für das Diagramm"</li>
                    <li>"Mache es zu einem gestapelten Balkendiagramm"</li>
                    <li>"Zeige Prozentsätze auf den Kreissegmenten"</li>
                    <li>"Verwende eine logarithmische Skala für die y-Achse"</li>
                </ul>
                
                <h4>Arbeiten mit komplexen Daten</h4>
                <p>Für größere Datensätze:</p>
                <ul>
                    <li>Zerlegen Sie komplexe Daten in logische Gruppen</li>
                    <li>Erwägen Sie die Verwendung mehrerer Diagramme, um eine vollständige Geschichte zu erzählen</li>
                    <li>Verwenden Sie Trends und Muster anstatt jeden Datenpunkt</li>
                    <li>Seien Sie explizit darüber, welche Dimensionen gezeigt und welche weggelassen werden sollen</li>
                </ul>
                
                <h4>Umgang mit Generierungsfehlern</h4>
                <p>Wenn Ihr Diagramm nicht ordnungsgemäß generiert wird:</p>
                <ul>
                    <li>Stellen Sie sicher, dass Sie präzise numerische Werte angegeben haben</li>
                    <li>Überprüfen Sie, ob Ihre Daten für den ausgewählten Diagrammtyp geeignet sind</li>
                    <li>Vereinfachen Sie komplexe Beschreibungen zu klareren, strukturierten Informationen</li>
                    <li>Reduzieren Sie die Anzahl der Kategorien oder Datenpunkte</li>
                </ul>
                
                <h4>Abbrechen der Diagrammgenerierung</h4>
                <p>Wenn Sie die Generierung eines Diagramms stoppen müssen:</p>
                <ul>
                    <li>Klicken Sie auf die Schaltfläche "Abbrechen" im Ladefenster</li>
                    <li>Der Prozess wird sofort beendet</li>
                    <li>Sie können dann mit einer modifizierten Eingabeaufforderung erneut versuchen</li>
                </ul>
                
                <div class="note">
                    <p><strong>Wichtig:</strong> Wenn Sie zu einem anderen Tab wechseln, wird der DataViz-Modus automatisch deaktiviert und Sie kehren zum normalen Unterhaltungsmodus zurück.</p>
                </div>
            `,
                image: "dataviz_advanced.png",
                imageAlt: "Erweiterte DataViz-Techniken",
                imageCaption:
                    "Erweiterte Techniken zur Erstellung angepasster Visualisierungen",
            },
        ],
    },
    paperworks: {
        title: "Papierkram",
        intro:
            "Der Papierkram-Reiter hilft Ihnen dabei, professionelle Dokumentvorlagen und Formulare mit KI-Unterstützung zu erstellen und zu verwalten, während alle Ihre Daten privat und lokal bleiben.",
        articles: [
            {
                id: "paperworks-intro",
                title: "Einführung in Dokumente",
                content: `
                <p>Der Dokumente-Reiter bietet ein leistungsstarkes Dokumentenerstellungssystem, das Ihnen hilft, professionelle Dokumente, Vorlagen und Formulare mit KI-Unterstützung zu generieren.</p>
                
                <p>Hauptfunktionen des Dokumente-Reiters sind:</p>
                <ul>
                    <li>Vorgefertigte Dokumentvorlagen für gängige Geschäftsanforderungen</li>
                    <li>Benutzerdefinierte Vorlagenerstellung mit KI-Anleitung</li>
                    <li>Formulargenerierung für Datensammlung</li>
                    <li>Dokumentvorschau und -bearbeitung</li>
                    <li>Exportoptionen für verschiedene Formate</li>
                </ul>
                
                <p>Alle Dokumentverarbeitung erfolgt lokal und auf Ihrem Gerät, wodurch sichergestellt wird, dass Ihre sensiblen Geschäftsinformationen privat und sicher bleiben. Wie alle Funktionen in Paiperwork verwendet Dokumente Ihren Master-Verschlüsselungsschlüssel, um alle gespeicherten Vorlagen oder Formulare zu schützen.</p>
            `,
                image: "paperworks_intro.png",
                imageAlt: "Dokumente-Reiter Übersicht",
                imageCaption:
                    "Das Dokumente-Dashboard zeigt Dokumenterstellungsoptionen",
            },
            {
                id: "paperworks-templates",
                title: "Dokumentvorlagen",
                content: `
                <p>Der Dokumente-Reiter zeigt ein Raster von Dokumentvorlagen an, die Sie auswählen können, um verschiedene professionelle Dokumente zu erstellen.</p>
                
                <h4>Verfügbare Vorlagentypen</h4>
                <ul>
                    <li><strong>Sitzungsprotokoll</strong> - Strukturierte, professionelle Sitzungsprotokolle erstellen</li>
                    <li><strong>Geschäftsbrief</strong> - Einen professionellen Geschäftsbrief generieren</li>
                    <li><strong>Technischer Bericht</strong> - Einen detaillierten technischen Bericht mit Abschnitten und Bildern erstellen</li>
                    <li><strong>Vertrag</strong> - Ein rechtliches Vertragsdokument erstellen</li>
                    <li><strong>Vorschlag</strong> - Einen überzeugenden Geschäftsvorschlag generieren</li>
                    <li><strong>Memo</strong> - Ein professionelles Firmenmemo erstellen</li>
                </ul>
                
                <h4>Verwendung von Vorlagen</h4>
                <p>Um ein Dokument aus einer Vorlage zu erstellen:</p>
                <ol>
                    <li>Klicken Sie auf eine Vorlagenkarte aus dem Raster</li>
                    <li>Füllen Sie die erforderlichen Informationen in die Formularfelder aus</li>
                    <li>Klicken Sie auf "Dokument generieren", um Ihr Dokument zu erstellen</li>
                    <li>Vorschau, bearbeiten oder exportieren Sie Ihr fertiges Dokument</li>
                </ol>
                
                <div class="note">
                    <p><strong>Hinweis:</strong> Vorlagen sind anpassbare Ausgangspunkte. Sie können jedes generierte Dokument ändern, um es besser an Ihre spezifischen Bedürfnisse anzupassen.</p>
                </div>
            `,
                image: "document_templates.png",
                imageAlt: "Dokumentvorlagen-Raster",
                imageCaption: "Das Dokumentvorlagen-Auswahlraster",
            },
            {
                id: "paperworks-technical-reports",
                title: "Technische Berichte erstellen",
                content: `
                <p>Der Technische Bericht-Ersteller bietet leistungsstarke Dokumentdesign-Funktionen mit einem intuitiven visuellen Editor und KI-Unterstützung.</p>
                
                <h4>Visueller Vorlagen-Designer</h4>
                <p>Wenn Sie die Vorlage für Technische Berichte auswählen, erhalten Sie Zugang zum visuellen Vorlagen-Designer, der es Ihnen ermöglicht:</p>
                <ul>
                    <li>Professionelle mehrseitige Dokumente mit einem visuellen Editor zu entwerfen</li>
                    <li>Ihren Bericht zu erstellen, indem Sie verschiedene Abschnittstypen aus der Seitenleiste hinzufügen</li>
                    <li>Layout und Struktur einfach anzupassen</li>
                    <li>Bilder und visuelle Elemente mit einfachem Upload hinzuzufügen</li>
                    <li>Das Dokument genau so zu betrachten, wie es beim Drucken erscheinen wird</li>
                    <li>Das Designer-Fenster für eine Vollbild-Bearbeitungserfahrung zu maximieren</li>
                </ul>
                
                <h4>Verfügbare Abschnittstypen</h4>
                <ul>
                    <li><strong>Dokumentkopf</strong> - Titel und Untertitel für Ihren Bericht</li>
                    <li><strong>Abschnittskopf</strong> - Unterteilt Ihren Bericht in logische Abschnitte</li>
                    <li><strong>Textbereich</strong> - Für Absätze und längere Textinhalte</li>
                    <li><strong>Text + Bild (Rechts)</strong> - Text mit einem Bild auf der rechten Seite</li>
                    <li><strong>Bild + Text (Rechts)</strong> - Bild mit Text auf der rechten Seite</li>
                    <li><strong>Bildergalerie</strong> - Raster-Layout für mehrere Bilder</li>
                    <li><strong>Bilderreihe</strong> - Horizontale Anordnung von Bildern mit optionaler Bildunterschrift</li>
                    <li><strong>Trennlinie</strong> - Visueller Trenner zwischen Abschnitten</li>
                    <li><strong>Leerraum</strong> - Anpassbarer Leerraum mit Größenänderungsfunktion</li>
                </ul>
                
                <h4>Intelligente Layout-Funktionen</h4>
                <ul>
                    <li><strong>Mehrseitige Unterstützung</strong> - Inhalt fließt automatisch über mehrere Seiten</li>
                    <li><strong>Seitenumbrüche</strong> - Visuelle Indikatoren zeigen, wo Inhalt zwischen Seiten geteilt wird</li>
                    <li><strong>Automatische Paginierung</strong> - Seitenzahlen werden automatisch hinzugefügt</li>
                    <li><strong>A4-Format</strong> - Standard-Dokumentgröße mit ordnungsgemäßen Rändern</li>
                    <li><strong>Abschnittssteuerung</strong> - Abschnitte mit leicht zugänglichen Schaltflächen verschieben, bearbeiten oder löschen</li>
                    <li><strong>Flexibler Abstand</strong> - Option, leere Abschnitte zu erweitern, um eine Seite zu füllen</li>
                </ul>
                
                <h4>Inhaltsverbesserung</h4>
                <ul>
                    <li><strong>KI-Verbesserung</strong> - Ein-Klick-Verbesserung von Textinhalten mit KI-Unterstützung</li>
                    <li><strong>Direkte Bearbeitung</strong> - Text direkt in der Vorschau für WYSIWYG-Erfahrung bearbeiten</li>
                    <li><strong>Bild-Upload</strong> - Bilder per Drag & Drop oder Klick hochladen</li>
                    <li><strong>Inhalts-Platzhalter</strong> - Hilfreiche Platzhalter zeigen, wo Inhalt hinzugefügt werden soll</li>
                    <li><strong>Rückgängig-Funktion</strong> - KI-Verbesserungen bei Bedarf rückgängig machen</li>
                    <li><strong>Direkte Übersetzungen</strong> - "Übersetze zu (Sprache):" am Textanfang voranstellen und auf Mit KI verbessern klicken</li>
                </ul>
                <h4>Schriftauswahl und PDF-Vorschau</h4>
                <ul>
                    <li><strong>Schriftauswahl</strong> - Aus einer Vielzahl von Schriften über das Dropdown-Menü oberhalb des Editors wählen</li>
                    <li><strong>Schrift-Vorschau</strong> - Sehen Sie in Echtzeit, wie Ihr Dokument mit verschiedenen Schriften aussieht</li>
                    <li><strong>Schrift-Persistenz</strong> - Ihre gewählte Schrift wird zwischen Sitzungen für Konsistenz gespeichert</li>
                    <li><strong>PDF-Vorschau</strong> - Eine genaue Vorschau ansehen, wie Ihr Dokument als PDF erscheinen wird</li>
                    <li><strong>Seitenlayout</strong> - Genau sehen, wie Inhalt mit ordnungsgemäßer A4-Größe auf Seiten verteilt wird</li>
                    <li><strong>Seitenumbrüche</strong> - Vorschau zeigt klare Seitenumbruch-Indikatoren zwischen Dokumentseiten</li>
                </ul>               

                <h4>PDF-Vorschau verwenden</h4>
                <ol>
                    <li>Klicken Sie auf die Schaltfläche "Vorschau" neben dem Schriftauswähler</li>
                    <li>Ein modales Fenster öffnet sich und zeigt Ihr Dokument, wie es im PDF-Format erscheinen würde</li>
                    <li>Jede Seite wird in ordnungsgemäßer A4-Größe mit exakter Layout-Positionierung angezeigt</li>
                    <li>Überprüfen Sie die Paginierung und stellen Sie sicher, dass Inhalt ordnungsgemäß verteilt ist</li>
                    <li>Schließen Sie die Vorschau nach Abschluss, um zur Bearbeitung zurückzukehren</li>
                </ol>
                <h4>Einen technischen Bericht erstellen</h4>
                <ol>
                    <li>Geben Sie einen Namen für Ihren Bericht oben im Designer ein</li>
                    <li>Klicken Sie auf Design-Voreinstellungen aus dem rechten Panel, um sie zu Ihrem Dokument hinzuzufügen</li>
                    <li>Füllen Sie Inhalt für jeden Abschnitt aus, indem Sie direkt in den Abschnitt klicken und tippen</li>
                    <li>Laden Sie Bilder hoch, indem Sie auf Bild-Platzhalter klicken</li>
                    <li>Verbessern Sie Text mit den KI-Schaltflächen unter bearbeitbaren Textbereichen</li>
                    <li>Ordnen Sie Abschnitte mit den Aufwärts-/Abwärts-Pfeilsteuerungen neu an</li>
                    <li>Nach Abschluss speichern Sie Ihren Bericht und exportieren oder drucken ihn</li>
                </ol>
                
                <div class="note">
                    <p><strong>Tipp:</strong> Maximieren Sie das Editor-Fenster mit der Maximieren-Schaltfläche in der oberen rechten Ecke für eine komfortablere Bearbeitungserfahrung mit größeren Dokumenten. Die Benutzeroberfläche passt sich automatisch an, um optimales Layout in regulärer und maximierter Ansicht zu bieten.</p>
                </div>
                `,
                images: [
                    {
                        src: "technical_report_designer.png",
                        alt: "Technischer Bericht",
                        caption:
                            "Der visuelle technische Bericht-Designer zeigt das Dokumentlayout und die Abschnittstypen",
                    },
                    {
                        src: "preview-window-technical-report.png",
                        alt: "Das Vorschaufenster für technische Berichte",
                        caption: "Das Vorschaufenster für technische Berichte"
                    }
                ]
            },
            {
                id: "paperworks-document-generation",
                title: "Dokumentgenerierung",
                content: `
                <p>Dokumente verwendet KI-Unterstützung, um Ihnen bei der Generierung professioneller Dokumentinhalte basierend auf Ihren Eingaben zu helfen.</p>
                
                <h4>Dokumentgenerierungsprozess</h4>
                <ol>
                    <li>Wählen Sie eine Dokumentvorlage aus</li>
                    <li>Füllen Sie die erforderlichen Formularfelder mit Ihren Informationen aus</li>
                    <li>Klicken Sie auf "Dokument generieren", um Ihr Dokument zu erstellen</li>
                    <li>Überprüfen Sie den generierten Inhalt</li>
                    <li>Bearbeiten oder verfeinern Sie den Inhalt nach Bedarf</li>
                    <li>Exportieren oder speichern Sie Ihr finalisiertes Dokument</li>
                </ol>
                
                <h4>KI-Verbesserung</h4>
                <p>Die KI-Unterstützung kann Ihnen helfen:</p>
                <ul>
                    <li>Ihren Inhalt professionell zu formatieren</li>
                    <li>Angemessene Formulierungen und Terminologie vorzuschlagen</li>
                    <li>Konsistenz in Ihrem gesamten Dokument sicherzustellen</li>
                    <li>Vollständige Abschnitte basierend auf Ihren Eingaben zu generieren</li>
                </ul>
                
                <div class="note">
                    <p><strong>Hinweis:</strong> Um die KI-Verbesserungsfunktionen zu nutzen, stellen Sie sicher, dass Sie zuerst ein KI-Modell im Chat-Reiter ausgewählt haben.</p>
                </div>
            `,
                image: "document_generation.png",
                imageAlt: "Dokumentgenerierungsprozess",
                imageCaption: "Die Dokumentgenerierungs-Formularschnittstelle",
            },
            {
                id: "paperworks-export",
                title: "Dokumente exportieren",
                content: `
                <p>Nachdem Sie Ihr Dokument erstellt und verfeinert haben, können Sie es in verschiedenen Formaten exportieren.</p>
                
                <h4>Verfügbare Exportoptionen</h4>
                <ul>
                    <li><strong>Text-Export</strong> - Den Text mit seiner Formatierung kopieren, bereit zum Einfügen in jeden Textprozessor</li>
                    <li><strong>Per E-Mail senden</strong> - Ihr Standard-E-Mail-Programm öffnen, füllt Betreff und E-Mail-Text aus</li>
                </ul>
                
                <h4>Ihr Dokument exportieren</h4>
                <ol>
                    <li>Nach der Generierung Ihres Dokuments überprüfen Sie die Vorschau</li>
                    <li>Nehmen Sie nach Bedarf finale Anpassungen vor</li>
                    <li>Klicken Sie auf die entsprechende Export-Schaltfläche (Kopieren, E-Mail)</li>
                    <li>Folgen Sie den Aufforderungen, um Ihr Dokument zu speichern oder zu senden</li>
                </ol>
                
                <p>Alle exportierten Dokumente behalten die Formatierung und das Styling aus Ihrer Vorschau bei und gewährleisten eine professionelle Präsentation unabhängig vom Format.</p>
            `,
                image: "document_export.png",
                imageAlt: "Dokumentexportoptionen",
                imageCaption: "Die Dokumentexport-Schnittstelle zeigt Formatoptionen",
            },
        ],
    },
    research: {
        title: "Forschung",
        intro: "Der Forschungs-Tab bietet leistungsstarke KI-unterstützte Forschungsfunktionen und eine persönliche Wissensdatenbank zum Speichern und Abrufen von Informationen.",
        articles: [
            {
                id: "research-intro",
                title: "Einführung in die Forschungstools",
                content: `
                <p>Der Forschungs-Tab bietet zwei leistungsstarke Tools, die Ihnen beim Sammeln, Analysieren und Speichern von Informationen helfen:</p>
                
                <ul>
                    <li><strong>Forschungsassistent</strong> - KI-gestützte Webrecherche, die Ihnen hilft, Informationen zu jedem Thema zu finden, zu analysieren und zu synthetisieren</li>
                    <li><strong>Wissensdatenbank</strong> - Eine persönliche Datenbank, in der Sie wichtige Informationen für zukünftige Referenzen speichern, organisieren und abrufen können</li>
                </ul>
                
                <h4>Datenschutz und Datensicherheit</h4>
                <p>Der Forschungs-Tab hält Paiperworks Engagement für Datenschutz und Datensicherheit aufrecht:</p>
                <ul>
                    <li><strong>Internetverbindung erforderlich</strong> - Der Forschungsassistent benötigt eine Internetverbindung, um Websuchen durchzuführen</li>
                    <li><strong>Begrenzte Datenübertragung</strong> - Nur Suchanfragen werden an das Internet gesendet (über Bing Search). Keine persönlichen oder geschäftlichen Daten werden jemals übertragen</li>
                    <li><strong>Lokale Verarbeitung</strong> - Alle Suchergebnisse werden lokal auf Ihrem Gerät von Ihrem gewählten KI-Modell verarbeitet</li>
                    <li><strong>Verschlüsselte Speicherung</strong> - Forschungsergebnisse und Wissensdatenbank-Einträge werden mit Ihrem Hauptschlüssel in Ihrer lokalen Datenbank verschlüsselt</li>
                    <li><strong>Vollständig offline Wissensdatenbank</strong> - Die Wissensdatenbank arbeitet vollständig lokal und benötigt keine Internetverbindung, sobald Einträge erstellt wurden</li>
                </ul>
                
                <h4>Zwischen den Tools wechseln</h4>
                <p>Verwenden Sie die Unter-Tab-Navigation oben im Forschungs-Tab, um zwischen dem Forschungsassistenten und der Wissensdatenbank zu wechseln:</p>
                <ul>
                    <li>Klicken Sie auf <strong>Forschung</strong>, um das KI-gestützte Websuch- und Analysetool zu verwenden</li>
                    <li>Klicken Sie auf <strong>Wissensdatenbank</strong>, um auf Ihre gespeicherten Informationssammlungen zuzugreifen</li>
                </ul>
                
                <div class="note">
                    <p><strong>Wichtig:</strong> Der Forschungs-Tab verwendet das aktuell im Chat-Tab ausgewählte Modell. Stellen Sie sicher, dass Sie ein geeignetes Modell im Chat-Tab auswählen, bevor Sie die Forschungsfunktionen verwenden. Für Forschungsaufgaben funktionieren nicht-schlussfolgernde Modelle (wie Mistral3, Qwen2.5 oder LLaMA) am besten.</p>
                    <p><strong>Leistungshinweis:</strong> Die Verwendung von schlussfolgernden KI-Modellen (wie Cogito, Qwen3 oder Deepseek R1) wird die Forschungszeit erheblich verlängern, da diese Modelle bei jedem Schritt des Prozesses detailliert nachdenken. Für schnellere Forschungsergebnisse bevorzugen Sie Standard-Instruktionsmodelle, die Informationen direkter verarbeiten.</p>
                </div>
                `,
                image: "research_tab_overview.png",
                imageAlt: "Forschungs-Tab Übersicht",
                imageCaption: "Der Forschungs-Tab zeigt die Unter-Tab-Navigation zwischen Forschungsassistent und Wissensdatenbank"
            },
            {
                id: "research-assistant",
                title: "Verwendung des Forschungsassistenten",
                content: `
                <p>Der Forschungsassistent kombiniert Websuche, KI-Analyse und Berichterstellung, um Ihnen bei der gründlichen Erforschung jeden Themas zu helfen.</p>
                
                <h4>Ihre Forschung beginnen</h4>
                <ol>
                    <li>Stellen Sie sicher, dass Sie ein geeignetes Modell im Chat-Tab ausgewählt haben (der Forschungs-Tab verwendet Ihr Chat-Tab-Modell)</li>
                    <li>Geben Sie Ihre Forschungsfrage in das Eingabefeld ein</li>
                    <li>Wählen Sie eine Berichtsgröße (unten detailliert)</li>
                    <li>Konfigurieren Sie Deep Search-Optionen bei Bedarf (unten detailliert)</li>
                    <li>Klicken Sie auf die Schaltfläche "Forschung", um den Forschungsprozess zu beginnen</li>
                </ol>
                
                <h4>Berichtsgrößen-Optionen</h4>
                <p>Wählen Sie die angemessene Berichtsgröße basierend auf Ihren Bedürfnissen und verfügbaren Systemressourcen:</p>
                <ul>
                    <li><strong>Prägnant</strong> - Kurze 500-800 Wort Zusammenfassung mit Kernfakten
                        <br><em>Empfohlener Kontext: 8K-16K (2-4GB VRAM/RAM)</em></li>
                    <li><strong>Standard</strong> - Ausgewogener 1000-1500 Wort Bericht mit wichtigen Details
                        <br><em>Empfohlener Kontext: 16K-32K (4-8GB VRAM/RAM)</em></li>
                    <li><strong>Detailliert</strong> - Umfassende 2000-3000 Wort Analyse
                        <br><em>Empfohlener Kontext: 32K-64K (8-16GB VRAM/RAM)</em></li>
                    <li><strong>Umfassend</strong> - Eingehende 4000-5000 Wort Untersuchung
                        <br><em>Empfohlener Kontext: 64K-128K (16-32GB VRAM/RAM)</em></li>
                    <li><strong>Ausführlich</strong> - Gründliche 6000+ Wort Erkundung mit maximalen Details
                        <br><em>Empfohlener Kontext: 128K+ (32GB+ VRAM/RAM für High-End-Systeme)</em></li>
                </ul>
                
                <div class="note">
                    <p><strong>Kontext-Anforderungen Erklärt:</strong> Der Forschungsassistent verarbeitet Informationen in mehreren Stufen - zuerst werden einzelne Quellen zusammengefasst, dann werden Teilberichte in Chargen generiert und schließlich wird alles zum finalen Bericht kombiniert. Größere Berichte benötigen mehr Kontext, um die Kohärenz über alle Quellen hinweg zu bewahren und eine umfassende Analyse zu gewährleisten. Wenn Sie Speicherprobleme oder unvollständige Berichte erleben, versuchen Sie die Berichtsgröße zu reduzieren oder die Kontextgröße im Chat-Tab zu erhöhen.</p>
                </div>
                
                <h4>Forschungsleistung Optimieren</h4>
                <p>Für beste Forschungsergebnisse:</p>
                <ul>
                    <li><strong>Berichtsgröße an Ihr System anpassen</strong> - Verwenden Sie den Kontext-Rechner im Chat-Tab, um optimale Einstellungen zu bestimmen</li>
                    <li><strong>Speichernutzung überwachen</strong> - Achten Sie auf Anzeichen von Speicherdruck wie unvollständige Berichte oder Systemverlangsamungen</li>
                    <li><strong>Deep Search Auswirkungen berücksichtigen</strong> - Deep Search mit mehreren Ebenen erhöht die zu verarbeitende Inhaltsmenge erheblich</li>
                    <li><strong>Geeignete Modelle verwenden</strong> - Nicht-reasoning Modelle (Mistral, Qwen2.5, LLaMA) verarbeiten Forschung schneller als Reasoning-Modelle</li>
                </ul>
                
                <h4>Deep Search Konfiguration</h4>
                <p>Die Deep Search-Funktion bietet erweiterte Forschungsfähigkeiten mit granularer Kontrolle:</p>
                <ul>
                    <li><strong>Aktivieren/Deaktivieren Umschalter</strong> - Schalten Sie Deep Search für Ihre Forschungssession ein oder aus</li>
                    <li><strong>Suchtiefe</strong> - Wählen Sie aus 1-3 Ebenen der Link-Verfolgung:
                        <ul>
                            <li>Ebene 1: Direkte Links aus Suchergebnissen verfolgen</li>
                            <li>Ebene 2: Links aus der ersten Ebene entdeckter Seiten verfolgen</li>
                            <li>Ebene 3: Maximale Tiefenerkundung für umfassende Abdeckung</li>
                        </ul>
                    </li>
                    <li><strong>Links pro Seite</strong> - Wählen Sie 1-5 Links, die von jeder entdeckten Seite verfolgt werden sollen</li>
                    <li><strong>Erweiterte PDF-Verarbeitung</strong> - Wenn aktiviert, erkennt Deep Search automatisch PDF-Dokumente und verarbeitet sie mit erweiterten Extraktionsfähigkeiten</li>
                </ul>
                <p>Fahren Sie mit der Maus über die Deep Search-Optionen, um detaillierte Tooltips zu sehen, die die Auswirkungen jeder Einstellung auf die Forschungsgründlichkeit und Verarbeitungszeit erklären.</p>
                
                <h4>Forschungsprozess mit schwebendem Fenster</h4>
                <p>Wenn Sie eine Forschung initiieren, zeigt das System ein schwebendes Fortschrittsfenster, das Folgendes anzeigt:</p>
                <ol>
                    <li><strong>Anfrage-Generierung</strong> - Erstellt optimierte Suchanfragen basierend auf Ihrer Forschungsfrage</li>
                    <li><strong>Websuche</strong> - Durchsucht das Web mit mehreren gezielten Anfragen</li>
                    <li><strong>Inhaltsanalyse</strong> - Analysiert und extrahiert wichtige Informationen aus Suchergebnissen</li>
                    <li><strong>PDF-Erkennung & Verarbeitung</strong> - Identifiziert automatisch PDF-Dokumente und verarbeitet sie mit erweiterter Extraktion</li>
                    <li><strong>Deep Search Ausführung</strong> - Falls aktiviert, verfolgt Links in Ihrer angegebenen Tiefe und Anzahl</li>
                    <li><strong>Berichtserstellung</strong> - Synthetisiert alle gesammelten Informationen in Ihre gewählte Berichtsgröße</li>
                </ol>
                
                <p>Das schwebende Fortschrittsfenster bietet Echtzeit-Updates und ermöglicht es Ihnen:</p>
                <ul>
                    <li>Aktuelle Forschungsphase und Fortschritt zu überwachen</li>
                    <li>Den Forschungsprozess jederzeit zu stoppen</li>
                    <li>Geschätzte Fertigstellungszeit zu sehen</li>
                    <li>Die Anzahl der bearbeiteten Quellen zu verfolgen</li>
                </ul>
                
                <h4>Erweiterte PDF-Behandlung</h4>
                <p>Der Forschungsassistent enthält erweiterte PDF-Verarbeitungsfähigkeiten:</p>
                <ul>
                    <li><strong>Automatische Erkennung</strong> - Identifiziert PDF-Dokumente in Suchergebnissen mit mehreren Mustern (Dateierweiterungen, URL-Muster, akademische Quellen)</li>
                    <li><strong>Erweiterte Extraktion</strong> - Verwendet spezialisierte Extraktionsmethoden für akademische Arbeiten und technische Dokumente</li>
                    <li><strong>Inhaltsintegration</strong> - Integriert PDF-Inhalte nahtlos in die Forschungssynthese</li>
                    <li><strong>Quellenattribution</strong> - Behält klare Zitate zu ursprünglichen PDF-Quellen bei</li>
                </ul>
                
                <div class="note">
                    <p><strong>Leistungshinweis:</strong> Deep Search mit höheren Tiefenebenen und mehr Links pro Seite bietet umfassendere Ergebnisse, verlängert aber die Forschungszeit. PDF-Verarbeitung fügt zusätzliche Zeit hinzu, verbessert aber die Forschungsqualität für akademische und technische Themen erheblich.</p>
                </div>
                `,
            },

            {
                id: "research-results",
                title: "Arbeiten mit Forschungsergebnissen",
                content: `
                <p>Nach Abschluss Ihrer Forschung generiert das System einen umfassenden Forschungsbericht in einem bearbeitbaren, schwebenden Fenster.</p>
                
                <h4>Funktionen des Forschungsergebnisse-Fensters</h4>
                <p>Die Forschungsergebnisse erscheinen in einem schwebenden Fenster, das Folgendes bietet:</p>
                <ul>
                    <li><strong>Vollständige Bearbeitbarkeit</strong> - Klicken Sie überall im Inhaltsbereich, um den Forschungsbericht direkt zu bearbeiten</li>
                    <li><strong>Echtzeit-Bearbeitung</strong> - Nehmen Sie Änderungen am Inhalt vor, fügen Sie Ihre eigenen Notizen hinzu oder reorganisieren Sie Abschnitte</li>
                    <li><strong>Quellenlink-Verwaltung</strong> - Bearbeiten, aktualisieren oder entfernen Sie Quellenzitate nach Bedarf</li>
                    <li><strong>Maximierbare Oberfläche</strong> - Erweitern Sie das Fenster für Vollbild-Bearbeitung und -Überprüfung</li>
                    <li><strong>Ziehen und Neupositionieren</strong> - Bewegen Sie das Fenster an Ihre bevorzugte Bildschirmposition</li>
                </ul>
                
                <h4>Forschungsbericht-Struktur</h4>
                <p>Der Forschungsbericht ist für Klarheit und Vollständigkeit strukturiert:</p>
                <ul>
                    <li><strong>Zusammenfassung</strong> - Wichtige Erkenntnisse und Hauptschlussfolgerungen</li>
                    <li><strong>Detaillierte Analyse</strong> - Umfassende Untersuchung nach Unterthemen organisiert</li>
                    <li><strong>Unterstützende Beweise</strong> - Relevante Daten, Zitate und Beispiele aus Quellen</li>
                    <li><strong>Schlussfolgerung</strong> - Synthetisierte Einsichten und Implikationen</li>
                    <li><strong>Quellenreferenzen</strong> - Vollständige Zitate mit anklickbaren Links zum ursprünglichen Inhalt</li>
                </ul>
                
                <h4>Bearbeitung des Forschungsinhalts</h4>
                <p>Die Forschungsergebnisse sind vollständig bearbeitbar und ermöglichen es Ihnen:</p>
                <ul>
                    <li>Ihre eigene Analyse und Kommentare hinzuzufügen</li>
                    <li>Abschnitte für besseren Fluss neu zu organisieren</li>
                    <li>Wichtige Erkenntnisse hervorzuheben, die für Ihre spezifischen Bedürfnisse wichtig sind</li>
                    <li>Irrelevante Informationen zu entfernen</li>
                    <li>Quelleninformationen zu aktualisieren oder zu korrigieren</li>
                    <li>Zusätzlichen Kontext oder Erklärungen hinzuzufügen</li>
                </ul>
                
                <h4>Export-Optionen</h4>
                <p>Die Forschungsergebnisse können über das integrierte Export-Dienstprogramm in mehreren Formaten exportiert werden:</p>
                <ul>
                    <li><strong>Klartext (.txt)</strong> - Sauberes Textformat mit entfernter Markdown-Formatierung für universelle Kompatibilität</li>
                    <li><strong>Markdown (.md)</strong> - Bewahrt Formatierung, Struktur, Überschriften und Links in Markdown-Syntax</li>
                    <li><strong>HTML (.html)</strong> - Vollständige Formatierung mit angemessenem Stil, konvertierten Markdown-Elementen und anklickbaren Links</li>
                </ul>
                
                <h4>In Wissensdatenbank speichern</h4>
                <p>Beim Speichern von Forschung in Ihrer Wissensdatenbank haben Sie erweiterte Optionen:</p>
                <ul>
                    <li><strong>Sammlungsauswahl</strong> - Wählen Sie eine bestehende Sammlung oder erstellen Sie eine neue während des Speichervorgangs</li>
                    <li><strong>Quellen separat speichern</strong> - Option, Quellenreferenzen als separate Einträge in Ihrer Wissensdatenbank zu speichern</li>
                    <li><strong>Inhaltsanpassung</strong> - Speichern Sie Ihre bearbeitete Version einschließlich aller Änderungen, die Sie vorgenommen haben</li>
                    <li><strong>Metadaten-Bewahrung</strong> - Behält Forschungsdatum, Anfrage und Parameter für zukünftige Referenz bei</li>
                </ul>
                
                <h4>Fensterverwaltung</h4>
                <p>Das schwebende Ergebnisfenster bietet:</p>
                <ul>
                    <li><strong>Größenveränderbare Oberfläche</strong> - Ziehen Sie Ecken, um die Größe für optimale Ansicht zu ändern</li>
                    <li><strong>Minimieren/Maximieren</strong> - Temporär verstecken oder auf Vollbild erweitern</li>
                    <li><strong>Oben bleiben</strong> - Option, Ergebnisse sichtbar zu halten, während Sie in anderen Bereichen arbeiten</li>
                    <li><strong>Mehrfensterstützung</strong> - Halten Sie vorherige Forschungsergebnisse offen, während Sie neue Forschung starten</li>
                </ul>
                
                <div class="note">
                    <p><strong>Profi-Tipp:</strong> Nutzen Sie die Bearbeitungsfähigkeiten, um Forschungsberichte für Ihre spezifischen Bedürfnisse anzupassen. Sie können persönliche Einsichten hinzufügen, Inhalte neu organisieren und eine personalisierte Wissensressource erstellen, bevor Sie in Ihrer Wissensdatenbank speichern.</p>
                </div>
                `,
                image: "research_results_editable.png",
                imageAlt: "Bearbeitbares Forschungsergebnisse-Fenster",
                imageCaption: "Das schwebende Forschungsergebnisse-Fenster zeigt Bearbeitungsfähigkeiten und Export-Optionen"
            },

            {
                id: "knowledge-base-intro",
                title: "Wissensdatenbank Übersicht",
                content: `
                <p>Die Wissensdatenbank ermöglicht es Ihnen, Informationssammlungen zu speichern, zu organisieren und manuell zu durchsuchen, die Sie für zukünftige Referenzen behalten möchten.</p>
                
                <h4>Wissensdatenbank-Struktur</h4>
                <p>Ihr Wissen ist in Sammlungen und Einträge organisiert:</p>
                <ul>
                    <li><strong>Sammlungen</strong> - Ordner oder Kategorien, die verwandte Einträge enthalten (z.B. "Projektforschung" oder "Kochrezepte")</li>
                    <li><strong>Einträge</strong> - Einzelne Informationsstücke, die in Sammlungen gespeichert sind</li>
                </ul>
                
                <h4>Eine Sammlung erstellen</h4>
                <ol>
                    <li>Geben Sie einen Namen für Ihre neue Sammlung in das Feld "Neuer Sammlungsname..." ein</li>
                    <li>Klicken Sie auf die Schaltfläche "Sammlung erstellen"</li>
                    <li>Ihre neue Sammlung wird in der Sammlungsliste unten erscheinen</li>
                </ol>
                
                <h4>Sammlungen verwalten</h4>
                <p>Jede Sammlung in Ihrer Liste hat mehrere Aktionsschaltflächen:</p>
                <ul>
                    <li><strong>Anzeigen</strong> - Öffnen Sie die Sammlung, um ihren Inhalt zu sehen</li>
                    <li><strong>Bearbeiten</strong> - Benennen Sie die Sammlung um</li>
                    <li><strong>Exportieren</strong> - Speichern Sie die Sammlung und ihre Einträge in eine Datei</li>
                    <li><strong>Löschen</strong> - Entfernen Sie die Sammlung und alle ihre Einträge</li>
                </ul>
                
                <h4>Speicherung und Organisation</h4>
                <p>Die Wissensdatenbank dient als einfaches aber effektives Speichersystem:</p>
                <ul>
                    <li><strong>Manuelle Organisation</strong> - Durchsuchen Sie Ihre Sammlungen, um gespeicherte Informationen zu finden</li>
                    <li><strong>Forschungsspeicherung</strong> - Perfekt zum Speichern vollständiger Forschungsberichte vom Forschungsassistenten</li>
                    <li><strong>Persönliche Notizen</strong> - Speichern Sie Ihre eigenen Notizen, Ideen und Informationen</li>
                    <li><strong>Keine Suche erforderlich</strong> - Einfache Navigation durch organisierte Sammlungen</li>
                </ul>
                
                <div class="note">
                    <p><strong>Wichtig:</strong> Wissensdatenbank-Daten werden mit Ihrem Hauptschlüssel verschlüsselt und lokal auf Ihrem Gerät gespeichert. Dies gewährleistet Datenschutz, bedeutet aber auch, dass Sie denselben Hauptschlüssel verwenden müssen, um in zukünftigen Sitzungen auf Ihr Wissen zuzugreifen.</p>
                </div>
                `,
                image: "knowledge_base_collections.png",
                imageAlt: "Wissensdatenbank-Sammlungen",
                imageCaption: "Die Wissensdatenbank zeigt eine Liste von Sammlungen mit Verwaltungsoptionen"
            },
            {
                id: "knowledge-entries",
                title: "Arbeiten mit Wissenseinträgen",
                content: `
                <p>Wissenseinträge sind einzelne Informationsstücke, die in Ihren Sammlungen gespeichert sind.</p>
                
                <h4>Arten von Wissenseinträgen</h4>
                <p>Sie können zwei Arten von Einträgen in Ihrer Wissensdatenbank erstellen:</p>
                <ul>
                    <li><strong>Manuelle Einträge</strong> - Informationen, die Sie direkt schreiben oder einfügen</li>
                    <li><strong>Forschungseinträge</strong> - Informationen, die aus Ihren Forschungsberichten gespeichert wurden</li>
                </ul>
                
                <h4>Einen neuen Eintrag erstellen</h4>
                <ol>
                    <li>Öffnen Sie eine Sammlung, indem Sie auf die Schaltfläche "Anzeigen" klicken</li>
                    <li>Klicken Sie auf die Schaltfläche "+ Neuer Eintrag" oben in der Sammlungsansicht</li>
                    <li>Geben Sie einen Titel für Ihren Eintrag ein</li>
                    <li>Fügen Sie Ihren Inhalt im Textbereich hinzu (Markdown-Formatierung wird unterstützt)</li>
                    <li>Klicken Sie auf "Eintrag speichern", um ihn zu Ihrer Sammlung hinzuzufügen</li>
                </ol>
                
                <h4>Einträge anzeigen und verwalten</h4>
                <p>Aus der Sammlungsansicht können Sie:</p>
                <ul>
                    <li>Auf jeden Eintrag klicken, um seinen vollständigen Inhalt anzuzeigen</li>
                    <li>Die Schaltfläche "Eintrag bearbeiten" verwenden, um den Inhalt eines Eintrags zu ändern</li>
                    <li>Die Schaltfläche "Eintrag löschen" verwenden, um einen Eintrag zu entfernen</li>
                    <li>Auf die Schaltfläche "← Zurück zu Einträgen" klicken, um zur Sammlungsansicht zurückzukehren</li>
                </ul>
                
                <h4>Markdown-Unterstützung</h4>
                <p>Beim Erstellen oder Bearbeiten von Einträgen können Sie Markdown-Formatierung verwenden:</p>
                <ul>
                    <li><strong>Überschriften</strong> - Verwenden Sie # für Überschriftenebene 1, ## für Ebene 2, usw.</li>
                    <li><strong>Formatierung</strong> - Verwenden Sie *kursiv* für Kursivschrift und **fett** für fetten Text</li>
                    <li><strong>Listen</strong> - Erstellen Sie Aufzählungslisten mit * oder nummerierte Listen mit 1., 2., usw.</li>
                    <li><strong>Links</strong> - Erstellen Sie Links mit [Text](URL) Syntax</li>
                </ul>
                
                <div class="note">
                    <p><strong>Tipp:</strong> Markdown-Formatierung macht Ihre Einträge organisierter und lesbarer, besonders für technische oder strukturierte Inhalte.</p>
                </div>
            `,
                image: "knowledge_entries.png",
                imageAlt: "Wissenseinträge",
                imageCaption: "Eine Sammlungsansicht zeigt mehrere Wissenseinträge"
            },
            {
                id: "knowledge-browse",
                title: "Durchsuchen Ihrer Wissensdatenbank",
                content: `
                <p>Die Wissensdatenbank bietet einen einfachen Weg, Ihre gespeicherten Informationen durch Sammlungen und Einträge zu durchsuchen und zu organisieren.</p>
                
                <h4>Navigation in Sammlungen</h4>
                <ol>
                    <li>Aus der Hauptansicht der Wissensdatenbank sehen Sie alle Ihre Sammlungen aufgelistet</li>
                    <li>Klicken Sie auf "Anzeigen" bei jeder Sammlung, um ihren Inhalt zu sehen</li>
                    <li>Durchsuchen Sie die Einträge in jeder Sammlung</li>
                    <li>Klicken Sie auf einzelne Einträge, um ihren vollständigen Inhalt zu lesen</li>
                </ol>
                
                <h4>Informationen finden</h4>
                <p>Um spezifische Informationen in Ihrer Wissensdatenbank zu lokalisieren:</p>
                <ul>
                    <li><strong>Nach Sammlung durchsuchen</strong> - Überprüfen Sie Sammlungen, die mit Ihrem Thema verwandt sind</li>
                    <li><strong>Beschreibende Benennung</strong> - Verwenden Sie klare, beschreibende Namen für Sammlungen und Einträge</li>
                    <li><strong>Logische Organisation</strong> - Gruppieren Sie verwandte Informationen in derselben Sammlung</li>
                    <li><strong>Manuelle Überprüfung</strong> - Durchsuchen Sie Einträge, um zu finden, was Sie brauchen</li>
                </ul>
                
                <h4>Organisationstipps</h4>
                <p>Für effektives Wissensmanagement:</p>
                <ul>
                    <li>Erstellen Sie Sammlungen für verschiedene Projekte, Themen oder Zeiträume</li>
                    <li>Verwenden Sie klare, beschreibende Titel sowohl für Sammlungen als auch für Einträge</li>
                    <li>Erwägen Sie datumsbasierte Organisation für Forschungsberichte</li>
                    <li>Halten Sie verwandte Informationen zusammen in derselben Sammlung</li>
                </ul>
                
                <div class="note">
                    <p><strong>Tipp:</strong> Gute Organisation im Voraus macht es viel einfacher, Informationen später zu finden. Überlegen Sie sich Ihre Benennungskonventionen und Sammlungsstruktur, bevor Sie viele Einträge hinzufügen.</p>
                </div>
                `,
            },
            {
                id: "research-to-knowledge",
                title: "Von der Forschung zum Wissen",
                content: `
                <p>Eine der mächtigsten Funktionen des Forschungs-Tabs ist die Integration zwischen dem Forschungsassistenten und der Wissensdatenbank.</p>
                
                <h4>Forschung in Wissensdatenbank speichern</h4>
                <p>Nach Abschluss einer Forschungssitzung:</p>
                <ol>
                    <li>Klicken Sie auf die Schaltfläche "In Wissensdatenbank speichern" im Forschungsergebnisse-Fenster</li>
                    <li>Wählen Sie eine bestehende Sammlung aus oder erstellen Sie eine neue</li>
                    <li>Bestätigen Sie Ihre Auswahl, um die Forschung zu speichern</li>
                </ol>
                
                <p>Der Forschungsbericht wird als neuer Eintrag in Ihrer ausgewählten Sammlung gespeichert, einschließlich:</p>
                <ul>
                    <li>Der vollständige Forschungsberichtsinhalt</li>
                    <li>Die ursprüngliche Forschungsfrage als Eintragstitel</li>
                    <li>Metadaten darüber, wann die Forschung durchgeführt wurde</li>
                    <li>Alle Quellen aus der Forschung</li>
                </ul>
                
                <h4>Quellenverwaltung</h4>
                <p>Beim Speichern von Forschung in Ihrer Wissensdatenbank haben Sie Optionen für den Umgang mit Quellen:</p>
                <ul>
                    <li><strong>Mit Quellen speichern</strong> - Enthält alle Referenzlinks und Zitate</li>
                    <li><strong>Nur Inhalt speichern</strong> - Speichert nur den Forschungsinhalt ohne Quellen</li>
                </ul>
                
                <h4>Aufbau Ihrer Wissensbibliothek</h4>
                <p>Durch regelmäßiges Speichern Ihrer Forschung in der Wissensdatenbank können Sie:</p>
                <ul>
                    <li>Eine persönliche Bibliothek verifizierter Informationen aufbauen</li>
                    <li>Vermeiden, Forschung zu Themen zu wiederholen, die Sie bereits erkundet haben</li>
                    <li>Schnell auf vorherige Erkenntnisse in neuen Projekten verweisen</li>
                    <li>Verbindungen zwischen verwandten Themen erstellen</li>
                </ul>
                
                <div class="note">
                    <p><strong>Profi-Tipp:</strong> Erstellen Sie thematische Sammlungen für verschiedene Interessensgebiete oder Projekte und verwenden Sie dann die Suchfunktion, um Verbindungen in Ihrer gesamten Wissensbibliothek zu finden.</p>
                </div>
            `,
                image: "research_to_knowledge.png",
                imageAlt: "Forschung in Wissensdatenbank speichern",
                imageCaption: "Der Dialog zum Speichern von Forschungsergebnissen in eine Wissensdatenbank-Sammlung"
            }
        ],
    },
    artworks: {
        title: "Gestaltung",
        intro:
            "Der Kunstwerke-Tab ermöglicht es Ihnen, KI-Vision-Modelle zu verwenden, um Designentscheidungen zu analysieren, Website-Prototypen basierend auf visuellen Designs zu generieren und Textüberlagerungen für Bilder zu erstellen.",
        articles: [
            {
                id: "artworks-getting-started",
                title: "Erste Schritte mit Visual Design Studio",
                content: `
                    <div class="note">
                        <p><strong>Erstveröffentlichung:</strong> Der Kunstwerke-Tab ist eine neue Funktion in ihrer Erstveröffentlichung. Wir freuen uns, dieses innovative KI-gestützte Design-Tool mit Ihnen zu teilen und würden gerne Ihr Feedback und Ihre Ideen für zukünftige Ergänzungen und Verbesserungen hören. Ihre Vorschläge helfen uns, Paiperwork für alle besser zu machen!</p>
                    </div>
                    
                    <p>Der Kunstwerke-Tab bietet KI-gestützte Tools zur Transformation von Bildern in funktionale Webdesigns und zur Analyse visueller Kompositionen.</p>
                    
                    <h4>Anforderungen und Einrichtung</h4>
                    <ul>
                        <li><strong>Visuelles KI-Modell erforderlich</strong> - Sie benötigen ein visionsfähiges Modell, das in Ollama installiert ist (LLaVA, Gemma3, Phi3-Vision, etc.)</li>
                        <li><strong>Modellauswahl</strong> - Wählen Sie Ihr visuelles Modell aus dem Dropdown-Menü oben im Tab</li>
                        <li><strong>Bildanforderungen</strong> - Laden Sie klare, hochwertige Bilder (max. 5MB) im PNG-, JPEG-, GIF- oder WebP-Format hoch</li>
                    </ul>
                    
                    <h4>Kompatible visuelle Modelle</h4>
                    <ul>
                        <li><strong>Mistral-small3.1</strong> - Mistrals visuelles Modell mit hervorragenden Fähigkeiten und mehrsprachiger Unterstützung</li>
                        <li><strong>Gemma3</strong> - Googles visuelles Modell mit starken Code-Generierungsfähigkeiten</li>
                        <li><strong>LLaVA & BakLLaVA</strong> - Large Language and Vision Assistant Varianten</li>
                        <li><strong>Phi3-Vision</strong> - Microsofts Vision-Modell mit gutem Designverständnis</li>
                        <li>Jedes andere Ollama-Modell mit Visionsfähigkeiten</li>
                    </ul>
                    
                    <h4>Installation von visuellen Modellen</h4>
                    <p>Falls keine kompatiblen Modelle verfügbar sind:</p>
                    <ol>
                        <li>Klicken Sie auf "Zum Modelle-Tab gehen" vom Warnbildschirm</li>
                        <li>Installieren Sie ein visionsfähiges Modell mit Ollama</li>
                        <li>Kehren Sie nach der Installation zum Visual Design Studio zurück</li>
                    </ol>
                    
                    <div class="note">
                        <p><strong>Wichtig:</strong> Beim Wechseln weg vom Kunstwerke-Tab werden Bilddaten aus dem Speicher gelöscht, um Ressourcennutzungsprobleme zu vermeiden, und der Chat-Kontext wird für reguläre Gespräche zurückgesetzt.</p>
                    </div>
                `,
                image: "artworks_intro.png",
                imageAlt: "Visual Design Studio Übersicht",
                imageCaption: "Kunstwerke-Tab-Interface mit Modellauswahl und Upload-Bereich",
            },
            {
                id: "artworks-workflow",
                title: "Design-Workflow und Modi",
                content: `
                <h4>Vollständiger Workflow</h4>
                <ol>
                    <li><strong>Visuelles Modell auswählen</strong> - Aus dem Dropdown wählen (Auswahl für zukünftige Sitzungen gespeichert)</li>
                    <li><strong>Design-Modus wählen</strong> - HTML-Stil-Transfer, Textüberlagerung oder Design-Begründung auswählen</li>
                    <li><strong>Bild hochladen</strong> - Ziehen/Ablegen oder Klicken zum Hochladen (System analysiert Dimensionen und Orientierung)</li>
                    <li><strong>Anweisungen schreiben</strong> - Spezifische Anleitung geben (Platzhaltertext ändert sich je nach Modus)</li>
                    <li><strong>Generieren & Vorschau</strong> - "Design generieren" klicken oder Enter drücken; Ergebnisse öffnen sich in interaktivem Vorschaufenster</li>
                </ol>
                
                <h4>Design-Modi erklärt</h4>
                
                <h5>HTML-Stil-Transfer</h5>
                <ul>
                    <li>Wandelt visuelle Designelemente in funktionalen HTML/CSS-Code um</li>
                    <li>Extrahiert Farbschemata, Layouts und Styling-Muster</li>
                    <li>Option "Als Hintergrundbild verwenden" integriert das tatsächlich hochgeladene Bild</li>
                    <li>Perfekt zur Transformation von Design-Inspiration in Web-Interfaces</li>
                </ul>
                
                <h5>Textüberlagerung</h5>
                <ul>
                    <li>Analysiert Bilder zur Findung optimaler Textplatzierungsbereiche</li>
                    <li>Generiert responsives HTML/CSS für Textüberlagerungen</li>
                    <li>Berücksichtigt Bildabmessungen und -orientierung für richtige Positionierung</li>
                    <li>Ideal für Marketingmaterialien, Banner und Produktpräsentationen</li>
                </ul>
                
                <h5>Design-Begründung</h5>
                <ul>
                    <li>Bietet professionelle Analyse von Designentscheidungen und -prinzipien</li>
                    <li>Erklärt Farbtheorie, Typografie, Layout und visuelle Hierarchie</li>
                    <li>Bietet Einblicke in Benutzererfahrungs-Auswirkungen</li>
                    <li>Großartig zum Lernen von Designprinzipien oder Verstehen erfolgreicher Designs</li>
                </ul>
                
                <h4>Bildverwaltung</h4>
                <ul>
                    <li><strong>Upload-Prozess</strong> - System zeigt Dimensionen, Orientierung (Querformat/Hochformat/Quadrat) und Seitenverhältnis</li>
                    <li><strong>Hintergrund-Option</strong> - Im Stil-Transfer-Modus wählen, ob das tatsächliche Bild im generierten Code enthalten sein soll</li>
                    <li><strong>Bilder ersetzen</strong> - "×" in der Vorschau klicken, um ein neues Bild hochzuladen</li>
                </ul>
                
                <div class="note">
                    <p><strong>Tipp:</strong> Drücken Sie Enter (ohne Shift) im Anweisungsfeld, um sofort mit der Generierung zu beginnen, wenn alle Anforderungen erfüllt sind.</p>
                </div>
            `,
            },
            {
                id: "artworks-examples",
                title: "Beispielanweisungen und bewährte Praktiken",
                content: `
                <h4>HTML-Stil-Transfer Beispiele</h4>
                
                <h5>Brutalistische Website (umfassendes Beispiel)</h5>
                <p class="example-prompt">"Erstelle eine brutalistische Website mit allen üblichen Header-Buttons und Footer-Links, erstelle einen Button in der Mitte des Viewports, der 'Anmelden' sagt, verwende die Farben aus dem Bild für die Website-Farbpalette auf allen Komponenten einschließlich der Hintergrundfarbe für die Seite und Footer/Header (mache sie halbtransparent), stelle sicher, dass das Hintergrundbild den Body der Webseite füllt und der Footer am unteren Rand des Viewports klebt"</p>
                
                <h5>Moderne E-Commerce-Seite</h5>
                <p class="example-prompt">"Verwandle dies in eine moderne E-Commerce-Produktseite mit einer sauberen Navigationsleiste, Produktgalerie-Bereich, Kundenbewertungsbereich und prominentem 'In den Warenkorb'-Button. Verwende das Farbschema aus dem Bild und erstelle ein minimalistisches Layout mit viel Weißraum."</p>
                
                <h5>Kreatives Portfolio</h5>
                <p class="example-prompt">"Erstelle eine kreative Portfolio-Website mit einem Vollbild-Hero-Bereich, animiertem Navigationsmenü, Projekt-Showcase-Raster und Kontaktformular. Extrahiere die künstlerische Farbpalette aus dem Bild und wende sie im gesamten Design mit subtilen Verläufen und Hover-Effekten an."</p>
                
                <h5>Unternehmens-Landingpage</h5>
                <p class="example-prompt">"Entwerfe eine professionelle Unternehmens-Landingpage mit Header-Navigation, Hero-Bereich mit Call-to-Action, dreispaltiger Feature-Sektion, Testimonials-Karussell und Footer mit Unternehmenslinks. Verwende die sophistizierte Farbpalette aus dem Bild, um Vertrauen und Autorität zu vermitteln."</p>
                
                <h5>Restaurant/Food-Site</h5>
                <p class="example-prompt">"Verwandle dies in eine appetitliche Restaurant-Website mit Menübereichen, Reservierungsformular, Fotogalerie von Gerichten, Kochgeschichte und Standortinformationen. Verwende warme, einladende Farben aus dem Food-Bild, um eine gemütliche, willkommende Atmosphäre zu schaffen."</p>
                
                <h4>Textüberlagerungs-Beispiele</h4>
                
                <h5>Produktpräsentation</h5>
                <p class="example-prompt">"Füge den folgenden Text zu diesem Produktbild hinzu: Hauptüberschrift: 'Premium Wireless Kopfhörer', Unterüberschrift: 'Immersives Klangerlebnis', Hauptmerkmale: 'Geräuschunterdrückung • 30h Akku • Bluetooth 5.0', Preis: '149,99€', Call-to-Action-Button: 'Jetzt kaufen'"</p>
                
                <h5>Event-Promotion</h5>
                <p class="example-prompt">"Erstelle eine Werbe-Textüberlagerung: Event-Titel: 'Sommer Musikfestival 2024', Datum: '15.-17. Juli 2024', Ort: 'Central Park, NYC', Headliner: 'Featured Artists TBA', Ticket-Info: 'Frühbucher 89€', Button: 'Tickets holen'"</p>
                
                <h4>Design-Begründungs-Beispiele</h4>
                
                <h5>Layout-Analyse</h5>
                <p class="example-prompt">"Analysiere das Layout und die Komposition dieses Designs. Erkläre, wie die visuelle Hierarchie die Benutzeraufmerksamkeit lenkt und wie die Abstands- und Ausrichtungsentscheidungen die Lesbarkeit und den Benutzerfluss beeinflussen."</p>
                
                <h5>Farbpsychologie</h5>
                <p class="example-prompt">"Untersuche die Farbwahl in diesem Design und erkläre ihre psychologischen Auswirkungen. Wie beeinflussen diese Farben Benutzeremotionen und Entscheidungsfindung? Was kommuniziert diese Farbpalette über die Marke?"</p>
                
                <h4>Effektive Anweisungen schreiben</h4>
                <ul>
                    <li><strong>Spezifisch sein</strong> - Designstil, Zielgruppe und benötigte Schlüsselkomponenten einbeziehen</li>
                    <li><strong>Bildelemente erwähnen</strong> - Spezifische Farben, Layouts oder Features aus Ihrem hochgeladenen Bild referenzieren</li>
                    <li><strong>Zweck definieren</strong> - Das Ziel erklären (Marketing, Portfolio, E-Commerce, etc.)</li>
                    <li><strong>Features anfordern</strong> - Responsives Verhalten, Animationen oder interaktive Elemente spezifizieren</li>
                </ul>
                
                <h4>Die richtigen Bilder wählen</h4>
                <ul>
                    <li><strong>Stil-Transfer</strong> - Bilder mit unterschiedlichen Designelementen und klaren Farbschemata verwenden</li>
                    <li><strong>Textüberlagerung</strong> - Bilder mit klaren Bereichen für Textplatzierung auswählen</li>
                    <li><strong>Design-Begründung</strong> - Professionelle Designs mit intentionalen Elementen wählen</li>
                    <li><strong>Qualität zählt</strong> - Hochauflösende Bilder mit guter Beleuchtung erzeugen bessere Ergebnisse</li>
                </ul>
                
                <div class="note">
                    <p><strong>Profi-Tipp:</strong> Bei Verwendung von "Als Hintergrundbild verwenden" im HTML-Stil-Transfer-Modus übernimmt das System automatisch die Bildintegration mit Platzhalter-Kommentaren, die genau zeigen, wo das Bild verwendet wird.</p>
                </div>
            `,

                images: [
                    {
                        src: "artworks_examples.png",
                        alt: "Beispielanweisungen",
                        caption:
                            "Beispiel für Design-Anweisungen für einen Kopfhörer-Promo-Prototyp",
                    },
                    {
                        src: "artworks_examples2.png",
                        alt: "Finales Prototyp-Ergebnis",
                        caption: "Beispiel eines Design-Prototyps für eine Kopfhörer-Promo",
                    },
                ]

            },
            {
                id: "artworks-results-management",
                title: "Arbeiten mit Ergebnissen und Problembehandlung",
                content: `
                <h4>Generierungsprozess</h4>
                <ul>
                    <li><strong>Fortschrittsfenster</strong> - Zeigt KI beim Analysieren Ihres Bildes (typischerweise 30-60 Sekunden)</li>
                    <li><strong>Jederzeit abbrechen</strong> - Schließen-Button im Fortschrittsfenster klicken, um Generierung zu stoppen</li>
                    <li><strong>Ergebnisanzeige</strong> - Ausgabe erscheint direkt im Vorschau-Modus</li>
                </ul>
                
                <h4>Interaktives Vorschaufenster</h4>
                <p>Ergebnisse öffnen sich in einem schwebenden Fenster, wo Sie:</p>
                <ul>
                    <li><strong>Ansichten wechseln</strong> - Zwischen Code-Ansicht und Live-Vorschau umschalten</li>
                    <li><strong>Direkt bearbeiten</strong> - Generierten Code in Echtzeit modifizieren</li>
                    <li><strong>Code kopieren</strong> - Für Ihre eigenen Projekte verwenden</li>
                    <li><strong>PNG exportieren</strong> - Screenshot des Designs speichern</li>
                </ul>
                
                <h4>Arbeiten mit generiertem Code</h4>
                <ul>
                    <li><strong>Ausgangspunkt</strong> - Code als Grundlage betrachten, die Sie weiter verfeinern können</li>
                    <li><strong>Browser-Tests</strong> - Über verschiedene Browser und Bildschirmgrößen testen</li>
                    <li><strong>Direkte Bearbeitung</strong> - Code direkt im Ergebnisfenster modifizieren und vorschauen</li>
                    <li><strong>Neugenerierung</strong> - Bei Bedarf mit spezifischeren Anweisungen erneut versuchen</li>
                </ul>
                
                <h4>Wichtig: Temporäre Bild-URLs erstellt für Hintergrundverwendung während der Generierung</h4>
                <div class="warning">
                    <p><strong>Blob-URLs vor Deployment ersetzen:</strong></p>
                    <ul>
                        <li>Generierter Code enthält temporäre Blob-URLs wie <code>blob:http://localhost:8182/...</code></li>
                        <li>Diese sind nur im Speicher für die Vorschau gespeichert und funktionieren nicht außerhalb Ihrer Sitzung</li>
                        <li>Suchen Sie nach CSS-Eigenschaften wie <code>background-image: url('blob:http://...')</code></li>
                        <li>Ersetzen Sie Blob-URLs durch Pfade zu Ihren tatsächlichen Bilddateien, bevor Sie den Code verwenden</li>
                    </ul>
                </div>
                
                <h4>Problembehandlung häufiger Probleme</h4>
                
                <h5>Generierungsfehler</h5>
                <ul>
                    <li><strong>Lösung:</strong> Anderes visuelles Modell oder kleineres Bild versuchen</li>
                    <li><strong>Vorbeugung:</strong> Klare Bilder mit unterschiedlichen Designelementen verwenden</li>
                    <li><strong>Wiederholen:</strong> Aufgrund der probabilistischen Natur von KI-Modellen sollten Sie mehrmals wiederholen, bevor Sie aufgeben</li>
                </ul>
                
                <h5>Langsame Leistung</h5>
                <ul>
                    <li><strong>Lösung:</strong> Kleinere Bilder verwenden, Anweisungen vereinfachen, kleinere KI-Modelle verwenden</li>
                    <li><strong>Hinweis:</strong> Komplexe Designs und größere Bilder benötigen mehr Verarbeitungszeit</li>
                </ul>
                
                <h5>Unvollständige Code-Ausgabe</h5>
                <ul>
                    <li><strong>Lösung:</strong> KI bitten, den Code im regulären Chat nach der Generierung fortzusetzen oder zu vervollständigen</li>
                    <li><strong>Alternative:</strong> Komplexe Anfragen in kleinere, spezifische Generierungen aufteilen</li>
                </ul>
                
                <h5>Schlechte Textplatzierung (Überlagerungsmodus)</h5>
                <ul>
                    <li><strong>Lösung:</strong> Bevorzugte Positionen in Ihren Anweisungen spezifizieren</li>
                    <li><strong>Beispiel:</strong> "Überschrift in der oberen linken Ecke platzieren, Preis in der unteren rechten"</li>
                </ul>
                
                <div class="note">
                    <p><strong>Leistungstipp:</strong> Visuelle Verarbeitung ist ressourcenintensiv. Für beste Ergebnisse schließen Sie unnötige Anwendungen und verwenden Sie hochqualitative, klar komponierte Bilder.</p>
                </div>
            `,
                image: "artworks_examples3.png",
                imageAlt: "Ergebnisverwaltung",
                imageCaption: "Das interaktive Vorschaufenster mit Bearbeitungs- und Exportfunktionen",
            },
        ],
    },
    presentation: {
        title: "Präsentation",
        intro: "Erstellen Sie Folienpräsentationen aus Dokumenten mithilfe KI-gestützter Extraktion und eines Vorschau-Editors.",
        articles: [
            {
                id: "presentation-overview",
                title: "Überblick",
                content: `
            <p>Der Reiter Präsentation wandelt unterstützte Dokumente (.pdf, .docx, .txt, .md) in eine Abfolge von Folien um. Der Reiter extrahiert Text aus Ihrer Datei, verwendet die KI zur Erstellung von Folieninhalten, lädt gegebenenfalls Bilder für Folien herunter und öffnet eine interaktive Vorschau, in der Sie das Ergebnis überprüfen und exportieren können.</p>
            <p>Schneller Ablauf:</p>
            <ol>
                <li>Laden Sie ein Dokument per Drag & Drop oder über die Schaltfläche Durchsuchen hoch.</li>
                <li>Wählen Sie die Anzahl der Folien und die Stichpunkte pro Folie.</li>
                <li>Fügen Sie optional eine zusätzliche Eingabeaufforderung hinzu, um Ton oder Stil zu steuern.</li>
                <li>Klicken Sie auf Generieren, um Extraktion und KI-Generierung zu starten.</li>
                <li>Überprüfen und bearbeiten Sie die Folien im Vorschaufenster und exportieren Sie dann.</li>
            </ol>
        `,
                image: "tab_overview.png",
                imageAlt: "Überblick über den Präsentationsreiter",
                imageCaption: "Überblick über den Reiter Präsentation",
            },
            {
                id: "presentation-direct-copy",
                title: "Modus Direkte Kopie",
                content: `
            <p>Nutzen Sie Direkte Kopie, wenn Ihr Dokument bereits folienfertigen Text enthält, den Sie exakt beibehalten möchten. Die KI strukturiert und teilt nur; sie paraphrasiert nicht.</p>

            <h4>So bereiten Sie Ihr Dokument vor</h4>
            <ul>
                <li><strong>Folien eindeutig beschriften:</strong> fügen Sie "cover:" für die erste Folie hinzu, danach "Slide 1:", "Slide 2:", usw. in der richtigen Reihenfolge.</li>
                <li><strong>Cover-Text angeben:</strong> nach "cover:" einen Titel und optional einen Untertitel angeben, getrennt durch ein Komma.</li>
                <li><strong>Ein Abschnitt pro Folie:</strong> platzieren Sie den Text jeder Folie direkt hinter ihrem Label; halten Sie Reihenfolge und Sprache konsistent.</li>
                <li><strong>Aufzählungen anpassen:</strong> stellen Sie den Aufzählungen-pro-Folie-Selektor so ein, wie der Text gesplittet werden soll. Die KI splittet der Reihe nach ohne Umschreiben und füllt fehlende Einträge mit leeren Strings.</li>
                <li><strong>Kontext einhalten:</strong> halten Sie den Gesamttext überschaubar (der Kontext-Selector bestimmt die maximale Länge), damit alle beschrifteten Folien erfasst werden.</li>
            </ul>

            <h4>So führen Sie Direkte Kopie aus</h4>
            <ol>
                <li>Wählen Sie "Direkte Kopie" im Modus-Selektor.</li>
                <li>Legen Sie Folienanzahl und Aufzählungen pro Folie fest (Folie 1 ist immer die Cover-Folie).</li>
                <li>Ziehen Sie Ihr beschriftetes Dokument hinein oder fügen Sie den Text ein und ergänzen Sie optional einen zusätzlichen Prompt für kleine Vorgaben (z. B. Groß-/Kleinschreibung oder Abstände).</li>
                <li>Klicken Sie auf Generieren; die Ausgabe spiegelt Ihren Wortlaut. Fehlende Folien oder Aufzählungen bleiben leere Strings statt umformuliert zu werden.</li>
            </ol>

            <p>Tipp: Wenn unerwartete Umschreibungen auftreten, prüfen Sie, ob der Modus "Direkte Kopie" aktiv ist und ob die Labels exakt geschrieben sind ("Slide 1:", "Slide 2:", usw.).</p>
        `,
                image: "tab_overview.png",
                imageAlt: "Modus Direkte Kopie",
                imageCaption: "Folien beschriften und Direkte Kopie ausführen",
            },
            {
                id: "presentation-promptable",
                title: "Promptbare Präsentation",
                content: `
            <p><strong>Promptbare Präsentation</strong> öffnet einen eigenen Vollbild-Arbeitsbereich für promptbasierte Deck-Erstellung.</p>
            <ul>
                <li><strong>Anzahl der Folien</strong> — wählen Sie die exakte Folienanzahl (1 bis 20).</li>
                <li><strong>Text hinzufügen</strong> — öffnet ein schwebendes Textfenster, in das Sie längere Quelltexte einfügen können.</li>
                <li><strong>Text bleibt erhalten</strong> — wenn Sie das Textfenster schließen und erneut öffnen, erscheint der zuvor gespeicherte Text wieder.</li>
                <li><strong>Send-Ablauf</strong> — Send erstellt den Benutzer-Prompt automatisch aus Folienanzahl und gespeichertem Quelltext.</li>
                <li><strong>Zusätzliche Anfrage (optional)</strong> — nutzen Sie die Schaltfläche „Zusätzliche Anfrage“ für Stil-/Layout-Vorgaben (z. B. „rote Farben verwenden“ oder „runde Bildrahmen“); falls gesetzt, wird sie im Prompt vor dem Hauptquelltext eingefügt.</li>
                <li><strong>Modusauswahl</strong> — verwenden Sie den <strong>Interaktiven Modus</strong> für Präsentationen mit <strong>Zurück/Weiter</strong>-Schaltflächen oder den <strong>Scrollbaren Modus</strong> für Präsentationen, die von oben nach unten gescrollt werden.</li>
                <li><strong>Websuche-Umschalter</strong> — nach <strong>Send</strong> können Sie den <strong>Web</strong>-Umschalter nutzen, um Präsentationsinhalte aus Websuchergebnissen auf Basis Ihres Add-Text-Inhalts zu erzeugen; wenn aktiv, wechselt die Schaltfläche auf <strong>Websuche-Prompt</strong>.</li>
                <li><strong>Web-Prompt-Tipp</strong> — schreiben Sie in diesem Modus nur das Thema für die Präsentation. Formulierungen wie „Erstelle eine Präsentation über ...“ bitte vermeiden, da sie die Websuche beeinflussen können; geben Sie nur das Thema ein.</li>
                <li><strong>Bild-Ersetzen-Tipp</strong> — wenn ein Bild nicht lädt oder Sie es austauschen möchten, klicken Sie im Vorschaubereich auf das Bild und starten Sie eine Bildsuche, um es zu ersetzen.</li>
                <li><strong>Textbearbeitungs-Tipp</strong> — Textfelder sind in der Vorschau direkt bearbeitbar, sodass Sie vor dem Speichern der HTML-Präsentation letzte Formulierungen anpassen können.</li>
                <li><strong>Empfohlenes Modell</strong> — für diese Funktion ist <strong>GLM 4.7 Flash</strong> ein sehr gutes Präsentationsmodell.</li>
                <li><strong>Gespeicherte Präsentationen</strong> — erzeugte HTML-Decks können verschlüsselt in der DB gespeichert und rechts in der Seitenleiste gelistet werden.</li>
                <li><strong>Aus Seitenleiste öffnen</strong> — klicken Sie auf eine gespeicherte Präsentation, um sie im Landscape-Vorschaubereich zu laden.</li>
                <li><strong>Löschschutz</strong> — vor dem Löschen wird eine Bestätigung abgefragt.</li>
            </ul>
            <p>Tipp: Strukturieren Sie den Quelltext in sinnvolle Abschnitte und wählen Sie eine realistische Folienanzahl für klarere Ergebnisse.</p>
        `,
                image: "tab_overview.png",
                imageAlt: "Ablauf der promptbaren Präsentation",
                imageCaption: "Arbeitsbereich und Steuerelemente der promptbaren Präsentation",
            },
            {
                id: "presentation-generating",
                title: "Erstellung von Präsentationen",
                content: `
            <p>Nachdem Sie auf Generieren klicken, führt das System mehrere Schritte aus und zeigt ein Fortschritts-Modal an:</p>
            <ul>
                <li><strong>Text-Extraktion</strong> — der Dokumenttext wird zur Verarbeitung durch die KI extrahiert.</li>
                <li><strong>KI-Generierung</strong> — die KI wandelt den extrahierten Text in Folieninhalte um (die zusätzliche Eingabeaufforderung wird mitverwendet, falls angegeben).</li>
                <li><strong>Parsing & Bilder</strong> — KI-Ausgabe wird in strukturierte Folien geparst und Bilder werden bei Verfügbarkeit heruntergeladen.</li>
                <li><strong>Fehlerbehandlung</strong> — das Reiter versucht bei fehlerhaften KI-Antworten automatisch einmal neu; Fehler werden im Lade-Modal angezeigt.</li>
            </ul>
            <p>Sie können die Generierung jederzeit mit der Schließen/Abbrechen-Schaltfläche im Lade-Modal abbrechen. Das Abbrechen stoppt Hintergrundaufgaben und schließt das Modal.</p>
        `,
                image: "generating_presentation.png",
                imageAlt: "Erstellung von Präsentationen",
                imageCaption: "Generierungsprozess und Fortschrittsanzeige",
            },
            {
                id: "presentation-preview-export",
                title: "Vorschau, Bearbeiten & Export",
                content: `
            <p>Wenn die Generierung erfolgreich ist, öffnet sich ein Vollbild-Vorschaufenster. Wichtige Funktionen der Vorschau:</p>
            <ul>
                <li><strong>Große Folienansicht</strong> — prüfen Sie die aktuell ausgewählte Folie, die als HTML gerendert wird.</li>
                <li><strong>Thumbnails</strong> — navigieren Sie mit der Thumbnail-Leiste durch die Folien und springen Sie zu jeder beliebigen Folie.</li>
                <li><strong>Inline-Bearbeitung</strong> — bearbeiten Sie Folientexte direkt in der Vorschau (die Vorschau wendet Folien-Daten über die PreviewWindow-API an).</li>
                <li><strong>Exportoptionen</strong> — verwenden Sie die Vorschau-Steuerelemente, um Folientext zu kopieren, Bilder zu exportieren oder HTML herunterzuladen (das genaue Exportmenü stellt die Vorschau-UI bereit).</li>
            </ul>
            <p>Tipp: Halten Sie den Dokumenttext klar für eine bessere Extraktion, wählen Sie eine angemessene Folienanzahl entsprechend der Inhaltslänge und fügen Sie einen zusätzlichen Prompt hinzu, wenn Sie einen bestimmten Ton oder Stil wünschen.</p>
        `,
                image: "preview_editing_export.png",
                imageAlt: "Vorschau und Export",
                imageCaption: "Vorschaufenster, Bearbeitung und Exportoptionen",
            },
            {
                id: "presentation-sidebar",
                title: "Präsentations-Seitenleiste",
                content: `
            <p>Die Präsentations-Seitenleiste bietet pro Folie sowie globale Steuerungen, um Folien zu stylen, Text zu bearbeiten, Bilder zu verwalten und KI-gestützte Textänderungen anzuwenden.</p>
            <h4>Tabs</h4>
            <ul>
                <li><strong>Style</strong> — wählen und wenden Sie Präsentationsstile an (vorgefertigte Karten wie Classic, Dark mode, Product, Corporate und viele Themen-Presets). Der <em>DIY</em>-Stil öffnet einen Style-Manager, in dem Sie benutzerdefinierte Stile lokal erstellen oder wiederverwenden können.</li>
                <li><strong>Text</strong> — enthält globale Textsteuerungen (Schriftart, Farbe, Aufzählungen) und knotenspezifische Controls für ausgewählte Textelemente.</li>
                <li><strong>Pic</strong> — Bildwerkzeuge einschließlich Import/Ersetzen, Cover-Bild ändern, Bildsuche per Beschreibung und eine Thumbnail-Galerie für schnellen Austausch.</li>
            </ul>

            <h4>Globale vs. ausgewählte Steuerungen</h4>
            <p>Der Text-Tab bietet globale Steuerungen, die auf Aufzählungen und Standardtextstile angewendet werden. Wenn Sie einen Textknoten auf einer Folie auswählen, erscheinen knotenspezifische Steuerungen (Schriftgröße, Farbwähler, KI-Textmodifikation), die Anpassungen pro Knoten erlauben.</p>

            <h4>KI-Textmodifikation</h4>
            <ul>
                <li>Geben Sie eine Anweisung in das KI-Textfeld ein (Beispiel: "Ins Deutsche übersetzen" oder "Mach diese Aufzählungen prägnanter").</li>
                <li>Verwenden Sie die Schaltfläche <em>Modify</em>, um Änderungen auf die aktuell ausgewählten Knoten anzuwenden.</li>
                <li>Aktivieren Sie den Schalter <em>Apply to all text</em>, um die Modifikation auf alle passenden Textknoten auszuführen; die Seitenleiste versucht bei Verfügbarkeit einen batchartigen, fortschrittsberichtenden Ablauf.</li>
                <li>Die Modify-Schaltfläche wechselt während der Ausführung zu <em>Cancel</em> — sie bricht den Vorgang über den gemeinsamen SlideForge AbortController ab.</li>
            </ul>

            <h4>Bildwerkzeuge</h4>
            <ul>
                <li><strong>Bild importieren</strong> — ersetzt das ausgewählte Folienbild oder, wenn aktiviert, das Cover-Bild der ersten Seite.</li>
                <li><strong>Cover ändern</strong> — helper-unterstützter Ablauf zum Ersetzen eines vollseitigen Cover-Bildes; fällt auf den Standardimport zurück, wenn kein Helper verfügbar ist.</li>
                <li><strong>Bilder suchen</strong> — geben Sie eine Beschreibung ein und klicken Sie auf Search; die Ergebnisse füllen das Thumbnail-Grid, in dem Sie ein Bild auswählen können, um das ausgewählte Bild zu ersetzen.</li>
                <li>Das Thumbnail-Grid ist so dimensioniert, dass mehrere Reihen angezeigt werden, und zeigt während Import/Ersetzen Status-/Fortschrittsmeldungen an.</li>
            </ul>

            <h4>Style-Karten & DIY</h4>
            <p>Style-Karten ermöglichen das schnelle Anwenden visueller Themen. Die DIY-Karte öffnet den Style-Manager, falls benutzerdefinierte Stile vorhanden sind (im Speicher oder in der DB), oder startet ein Erstellungs-Modal. Karten zeigen Verfügbarkeit und Auswahlstatus visuell an.</p>

            <h4>Integration mit Helpers</h4>
            <p>Die Seitenleiste ist auf Auswahl-Helpers angewiesen, die an Präsentationsstages angehängt sind, um Bildersetzungen, batchartige KI-Edits und Knotenoperationen durchzuführen. Findet sich kein Helper, zeigt die Seitenleiste hilfreiche Meldungen und greift auf verfügbare globale Abläufe zurück.</p>
        `,
                    image: "sidebar_controls.png",
                    imageAlt: "Präsentations-Seitenleiste",
                    imageCaption: "Seitenleistensteuerungen für Style, Text und Bilder",
            },
            {
                id: "presentation-export-note",
                title: "PDF exportieren: Was exportiert wird",
                content: `
            <p><strong>Hinweis:</strong> Die Schaltfläche <em>Export PDF</em> exportiert die Präsentation genau so, wie sie auf dem Bildschirm angezeigt wird — einschließlich Folientext, Bilder, Formen und Hintergrundelemente.</p>
        `,
                    image: "export_slides.png",
                    imageAlt: "Hinweis Export PDF",
                    imageCaption: "Exportiert die Folien wie in der Vorschau angezeigt",
            },
        ],
    },

    artifacts: {
        title: "Artefakte",
        intro: "Der Artefakte-Tab ist ein eigener Arbeitsbereich zum Erzeugen interaktiver HTML-Artefakte, zur KI-gestuetzten Verfeinerung und zum Speichern wiederverwendbarer Ergebnisse.",
        articles: [
            {
                id: "artifacts-overview",
                title: "Ueberblick",
                content: `
            <p>Der Artefakte-Tab konzentriert sich auf die Erstellung von HTML-Artefakten in einem Vollbild-Workflow. Er eignet sich fuer Prototypen, Landingpages, interaktive Snippets und visuelle Experimente direkt aus Prompts.</p>
            <ul>
                <li><strong>Hauptausgabe</strong> - Die KI liefert lauffaehigen HTML/CSS/JS-Code und oeffnet ihn in der Vorschau.</li>
                <li><strong>Iterative Schleife</strong> - Aenderungen anfordern, neu generieren und Verhalten direkt im selben Arbeitsbereich pruefen.</li>
                <li><strong>Modellunterstuetzung</strong> - Funktioniert mit lokalen oder Cloud-Modellen aus Ihrer Modellauswahl.</li>
            </ul>
        `,
            },
            {
                id: "artifacts-controls",
                title: "Schaltflaechen und Steuerungen",
                content: `
            <p>Die Kopfzeilen-Steuerungen sind fuer schnelle Prompt-Iterationen ausgelegt:</p>
            <ul>
                <li><strong>Web / Web aktiv</strong> - schaltet den web-gestuetzten Generierungsmodus um; die Beschriftung wechselt bei Aktivierung.</li>
                <li><strong>Senden</strong> - sendet den Prompt und startet die Generierung.</li>
                <li><strong>Fortschrittsbalken</strong> - erscheint in der Kopfzeile, solange eine Anfrage laeuft.</li>
                <li><strong>Abbrechen</strong> - stoppt bei Bedarf die aktuelle Generierung.</li>
            </ul>
            <p>Tipp: Strukturierte Prompts (Ziel, Layout, Interaktionen, Einschränkungen) verbessern die Erstresultate.</p>
        `,
            },
            {
                id: "artifacts-saved",
                title: "Gespeicherte Artefakte und Prompt-Verlauf",
                content: `
            <p>Generierte Artefakte koennen in der verschluesselten lokalen Datenbank gespeichert und spaeter ueber die Seitenleiste erneut geoeffnet werden.</p>
            <ul>
                <li><strong>Speichern</strong> - speichert die aktuelle Artefakt-Ausgabe fuer die spaetere Wiederverwendung.</li>
                <li><strong>Aus Seitenleiste oeffnen</strong> - klicken Sie auf einen gespeicherten Eintrag, um ihn wieder in die Vorschau zu laden.</li>
                <li><strong>Prompt-Schaltflaeche</strong> - zeigt den Prompt, mit dem das Artefakt erzeugt wurde.</li>
                <li><strong>Prompt kopieren</strong> - kopiert den gespeicherten Prompt aus dem Dialog zum Wiederverwenden oder Verfeinern.</li>
                <li><strong>Loeschen</strong> - entfernt gespeicherte Artefakte, die nicht mehr benoetigt werden.</li>
            </ul>
            <p>So bauen Sie eine wiederverwendbare Bibliothek aus Artefakt-Ergebnissen und den zugehoerigen Anweisungen auf.</p>
        `,
            },
        ],
    },

    // Translate-Tab Abschnitt
    translate: {
        title: "Übersetzen",
        intro: "Der Übersetzen-Tab konvertiert Dokumenttext mit KI und bietet ein schwebendes Vorschaufenster zur Prüfung, Live-Aktualisierung und zum Export.",
        articles: [
            {
                id: "translate-overview",
                title: "Überblick",
                content: `
            <p>Der Übersetzen-Tab ist ein dokumentorientierter Ablauf zum Übersetzen von Dateien und zur Prüfung der Ergebnisse vor dem Export.</p>

            <h4>Unterstützte Formate</h4>
            <ul>
                <li><strong>PDF</strong> - editierbare Overlay-Vorschau mit Seitenrendering</li>
                <li><strong>TXT</strong> - Klartext-Übersetzung mit Erhalt von Zeilen- und Absatzstruktur</li>
                <li><strong>MD</strong> - markdown-bewusste Übersetzung mit Strukturerhalt</li>
            </ul>

            <h4>Hauptsteuerungen</h4>
            <ul>
                <li><strong>Drag-&-drop-Bereich</strong> - Datei ablegen oder zum Auswählen klicken</li>
                <li><strong>Scope-Selektor</strong> - wählen Sie Selection, Page oder Document vor dem Start</li>
                <li><strong>Anweisungsfeld</strong> - z. B. <em>"Dieses Dokument ins Französische übersetzen"</em></li>
                <li><strong>Übersetzen-Schaltfläche</strong> - startet die Übersetzung für das aktuelle Dokument</li>
                <li><strong>Übersetztes Dokument exportieren</strong> - exportiert das Ergebnis aus dem aktuellen Vorschauzustand</li>
            </ul>

            <h4>Scope-Selektor</h4>
            <ul>
                <li><strong>Selection</strong> - zielt auf eine oder mehrere ausgewählte Seiten in der Vorschau.</li>
                <li><strong>Page</strong> - zielt nur auf die aktuell ausgewählte Seite.</li>
                <li><strong>Document</strong> - zielt auf das gesamte Dokument (alle Seiten/Blöcke).</li>
            </ul>

            <div class="note">
                <p><strong>Tipp:</strong> Für beste Qualität nutzen Sie ein übersetzungsorientiertes Modell wie TranslateGemma aus der Modellbibliothek.</p>
            </div>
        `,
                image: "Translate-1.png",
                imageAlt: "Übersetzen-Tab Übersicht",
                imageCaption: "Die Übersetzen-Tab-Oberfläche mit Drag-&-drop-Bereich",
            },
            {
                id: "translate-preview",
                title: "Schwebendes Vorschaufenster",
                content: `
            <p>Nach dem Laden eines Dokuments öffnet Übersetzen ein schwebendes Vorschaufenster, in dem Sie Ergebnisse prüfen und verfeinern können.</p>

            <h4>Fenstersteuerungen</h4>
            <ul>
                <li><strong>Maximieren/Wiederherstellen</strong> - zwischen kompakter und erweiterter Ansicht wechseln</li>
                <li><strong>Schließen/Erneut öffnen</strong> - schließen und mit <em>Vorschaufenster öffnen</em> erneut anzeigen</li>
            </ul>

            <h4>PDF-Verhalten</h4>
            <ul>
                <li>Textblöcke sind über PDF-Seiten gelegt und direkt editierbar.</li>
                <li>Streaming-Übersetzungsupdates werden schrittweise auf passende Blöcke angewendet.</li>
                <li>Sie können den übersetzten Text vor dem Export überprüfen und anpassen.</li>
            </ul>

            <h4>TXT-/MD-Verhalten</h4>
            <ul>
                <li>Die Vorschau verwendet ein dokumentähnliches Textlayout für bessere Lesbarkeit.</li>
                <li>Streaming-Ersetzungen aktualisieren den Inhalt schrittweise (nicht nur am Ende).</li>
                <li>Zeilenumbrüche und Dokumentstruktur werden so weit wie möglich erhalten.</li>
            </ul>
        `,
                image: "Translate-2.png",
                imageAlt: "Übersetzen-Fenster Übersicht",
                imageCaption: "Das Übersetzen-Fenster mit Steuerungen und geladener PDF",
            },
            {
                id: "translate-export-troubleshooting",
                title: "Export und Fehlerbehebung",
                content: `
            <p>Verwenden Sie nach der Prüfung die Exportfunktion, um das übersetzte Ergebnis zu speichern.</p>

            <h4>Exportausgabe</h4>
            <ul>
                <li><strong>PDF-Eingabe</strong> - Export als übersetztes PDF</li>
                <li><strong>TXT-Eingabe</strong> - Export als <code>-translated.txt</code></li>
                <li><strong>MD-Eingabe</strong> - Export als <code>-translated.md</code></li>
            </ul>

            <h4>Häufige Probleme</h4>
            <ul>
                <li><strong>Kein extrahierbarer PDF-Text</strong> - gescannte/bildbasierte PDFs liefern ggf. keine editierbaren Textblöcke.</li>
                <li><strong>Qualität passt nicht</strong> - Anweisung verfeinern oder ein besseres Übersetzungsmodell wählen.</li>
                <li><strong>Kontext-Workflow</strong> - nach Übersetzungsänderungen kann das Schließen der Vorschau einen Continue-Conversation-Flow im Chat auslösen.</li>
            </ul>

            <div class="note">
                <p><strong>Hinweis:</strong> Übersetzung in diesem Tab ist dokumentorientiert. Ergänzen Sie bei Bedarf explizite Ton-/Stilvorgaben im Anweisungsfeld.</p>
            </div>
        `,
            },
        ],
    },
    models: {
        title: "Modelle",
        intro:
            "Der Modelle-Tab ermöglicht es Ihnen, KI-Modelle von Ollama zu durchsuchen, herunterzuladen und zu verwalten, die von Paiperwork mit vollständiger lokaler Kontrolle verwendet werden.",
        articles: [
            {
                id: "models-intro",
                title: "Einführung in Modelle",
                content: `
                <p>Der Modelle-Tab bietet eine zentrale Schnittstelle für die Verwaltung der KI-Modelle, die Ihre Paiperwork-Erfahrung antreiben.</p>
                
                <p>Hauptfunktionen des Modelle-Tabs umfassen:</p>
                <ul>
                    <li>Verfügbare Modelle in der Ollama-Bibliothek durchsuchen</li>
                    <li>Neue Modelle auf Ihr lokales System herunterladen</li>
                    <li>Ihre installierten Modelle verwalten</li>
                    <li>Modellparameter für optimale Leistung konfigurieren</li>
                    <li>Modelle löschen, die Sie nicht mehr benötigen</li>
                </ul>
                
                <p>Alle Modelle laufen lokal auf Ihrem Gerät über Ollama, wodurch sichergestellt wird, dass Ihre Daten privat und sicher bleiben, während Sie dennoch von leistungsstarken KI-Funktionen profitieren.</p>
                
                <h4>Reasoning-Modelle</h4>
                <p>Einige spezialisierte Modelle haben erweiterte Reasoning-Fähigkeiten, die mit spezifischen System-Prompts aktiviert werden können:</p>
                <ul>
                    <li><strong>Cogito</strong> und andere reasoning-fokussierte Modelle benötigen möglicherweise einen speziellen System-Prompt, um ihre vollen Fähigkeiten zu aktivieren</li>
                    <li>Für Cogito-Modelle fügen Sie <code>"Enable deep thinking subroutine."</code> (ohne Anführungszeichen) zu Ihrem System-Prompt hinzu</li>
                    <li>Dies aktiviert erweiterte Reasoning-Funktionen und ermöglicht strukturierteres, schrittweises Denken</li>
                    <li>Verschiedene Reasoning-Modelle können unterschiedliche Aktivierungsphrasen haben - prüfen Sie die Dokumentation des Modells für Details</li>
                </ul>
                
                <div class="note">
                    <p><strong>Hinweis:</strong> Die Modelle in Paiperwork werden von Ollama betrieben, das auf Ihrem System installiert und ausgeführt werden muss. Die Verfügbarkeit von Modellen hängt von Ihrer lokalen Ollama-Installation ab.</p>
                </div>
            `,
                image: "models_intro.png",
                imageAlt: "Modelle-Tab Übersicht",
                imageCaption:
                    "Die Modelle-Tab-Schnittstelle zeigt verfügbare und lokale Modell-Bereiche",
            },
            {
                id: "models-browsing",
                title: "Verfügbare Modelle durchsuchen",
                content: `
                <p>Paiperwork ermöglicht es Ihnen, die gesamte Ollama-Modellbibliothek direkt von der Anwendungsschnittstelle aus zu durchsuchen.</p>
                
                <h4>Verfügbare Modelle abrufen</h4>
                <ol>
                    <li>Navigieren Sie zum Modelle-Tab</li>
                    <li>Klicken Sie auf die Schaltfläche "Ollama-Modelle abrufen" oben auf dem Bildschirm</li>
                    <li>Warten Sie, während Paiperwork sich mit der Ollama-Bibliothek verbindet</li>
                    <li>Nach Abschluss bestätigt eine Statusmeldung, wie viele Modelle gefunden wurden</li>
                </ol>
                
                <h4>Modelloptionen erkunden</h4>
                <p>Nach dem Abrufen der Modelle können Sie:</p>
                <ul>
                    <li>Die Modelle mit dem Dropdown-Selektor durchsuchen</li>
                    <li>Modellbeschreibungen anzeigen, die ihre Fähigkeiten erklären</li>
                    <li>Modell-Popularitätsinformationen sehen (Anzahl der Downloads)</li>
                </ul>
                
                <h4>Modelltypen</h4>
                <p>Die Ollama-Bibliothek umfasst Modelle mit verschiedenen Spezialisierungen:</p>
                <ul>
                    <li><strong>Allgemeine Verwendung</strong> - Modelle wie Gemma3, Llama, Qwen2.5 und Mistral für alltägliche Aufgaben</li>
                    <li><strong>Code-spezialisiert</strong> - Modelle wie Qwen2.5 coder, CodeLlama und WizardCoder, optimiert für Programmierung</li>
                    <li><strong>Vision-fähig</strong> - Modelle wie Mistral3.1 und Gemma3, die Bilder analysieren können</li>
                    <li><strong>Feinabgestimmt</strong> - Modelle, die für spezifische Anwendungsfälle oder mit besonderen Eigenschaften trainiert wurden</li>
                </ul>
                
                <div class="note">
                    <p><strong>Tipp:</strong> Lesen Sie die Modellbeschreibungen sorgfältig, um die Stärken und Fähigkeiten jedes Modells vor dem Herunterladen zu verstehen.</p>
                </div>
            `,
                image: "models_browsing.png",
                imageAlt: "Verfügbare Modelle durchsuchen",
                imageCaption:
                    "Das Modellauswahl-Dropdown zeigt verfügbare Modelle aus der Ollama-Bibliothek",
            },
            {
                id: "models-downloading",
                title: "Modelle herunterladen",
                content: `
                    <p>Sobald Sie ein Modell identifiziert haben, das Sie verwenden möchten, können Sie es direkt auf Ihr lokales System herunterladen.</p>
                    
                    <h4>Eine Modellgröße auswählen</h4>
                    <ol>
                        <li>Wählen Sie ein Modell aus der Dropdown-Liste</li>
                        <li>Überprüfen Sie die Modellbeschreibung</li>
                        <li>Wenn Sie ein Modell wählen, erscheinen automatisch die Größenoptionen</li>
                        <li>Wählen Sie die entsprechende Größenversion, die Ihren Bedürfnissen und Systemfähigkeiten entspricht</li>
                    </ol>
                    
                    <h4>Modellgrößen verstehen</h4>
                    <p>Die meisten Modelle sind in mehreren Größenvarianten verfügbar:</p>
                    <ul>
                        <li><strong>Größere Größen</strong> (7B, 13B, 34B Parameter) - Diese größeren Modelle bieten bessere Qualität, benötigen aber mehr VRAM (Grafikkartenspeicher, der die Modellgröße aufgrund der Kontexteinbeziehung übersteigt, beachten Sie, dass die Bildschirmauflösung die Speichernutzung beeinflusst), RAM (wie bei VRAM, beachten Sie, dass Ihr Betriebssystem auch RAM verwendet, sodass nicht alles für KI-Modell+Kontext-Nutzung verfügbar ist) und Rechenleistung (je schneller die CPU, desto besser).</li>
                        <li><strong>Kleinere Größen</strong> (3B, 1,5B Parameter) - Effizienter, aber möglicherweise mit reduzierten Fähigkeiten</li>
                        <li><strong>Quantisierte Versionen</strong> (Q4_K_M, Q5_K_S) - Komprimierte Modelle, die weniger Speicher verwenden und dabei die Qualität beibehalten</li>
                    </ul>
                    
                    <h4>VRAM-Anforderungen Beispiel</h4>
                    <p>Um Ihnen eine Vorstellung von den Hardware-Anforderungen für das Ausführen von Modellen mit einem 8K-Kontextfenster zu geben:</p>
                    <ul>
                        <li><strong>Kleine Modelle (3B)</strong>: ~4-6GB VRAM mit Quantisierung (Q4/Q5)</li>
                        <li><strong>Mittlere Modelle (7B)</strong>: ~8-10GB VRAM mit Quantisierung (Q4/Q5)</li>
                        <li><strong>Große Modelle (13B)</strong>: ~14-16GB VRAM mit Quantisierung (Q4/Q5)</li>
                        <li><strong>Sehr große Modelle (34B+)</strong>: 24GB+ VRAM mit Quantisierung (Q4/Q5)</li>
                    </ul>
                    <p>Diese Anforderungen können je nach spezifischen Modellen und Systemkonfigurationen variieren. Erwägen Sie, mit kleineren oder stärker quantisierten Modellen zu beginnen, wenn Sie begrenzten VRAM haben.</p>
                    
                    <h4>Download starten</h4>
                    <ol>
                        <li>Klicken Sie auf die Schaltfläche "Modell herunterladen"</li>
                        <li>Die Schaltfläche zeigt Download-Fortschrittsinformationen an</li>
                        <li>Eine Statusmeldung darunter zeigt die aktuelle Operation (Herunterladen, Verarbeiten)</li>
                        <li>Eine Abbrechen-Schaltfläche erscheint, mit der Sie den Download bei Bedarf stoppen können</li>
                    </ol>
                    
                    <h4>Download-Prozess</h4>
                    <p>Während des Downloads sehen Sie:</p>
                    <ul>
                        <li>Fortschrittsinformationen, die heruntergeladene Größe und Gesamtgröße anzeigen</li>
                        <li>Status-Updates für verschiedene Phasen (Manifest abrufen, Dateien herunterladen, überprüfen)</li>
                        <li>Der Modellselektor, Größenselektor und die "Ollama-Modelle abrufen"-Schaltfläche werden während des Downloads deaktiviert</li>
                        <li>Bestätigung, wenn der Download abgeschlossen ist</li>
                    </ul>
                    
                    <h4>Downloads abbrechen</h4>
                    <p>Wenn Sie einen laufenden Download abbrechen müssen:</p>
                    <ul>
                        <li>Klicken Sie auf die "Download abbrechen"-Schaltfläche, die unter der Download-Schaltfläche erscheint (Wenn Sie fortsetzen möchten, klicken Sie erneut auf die Download-Schaltfläche)</li>
                        <li>Bestätigen Sie den Abbruch, wenn Sie dazu aufgefordert werden</li>
                        <li>Nach dem Abbruch erscheint eine Meldung, die empfiehlt, Ollama neu zu starten, um teilweise heruntergeladene Dateien zu bereinigen</li>
                        <li>Diese Meldung verschwindet automatisch nach 30 Sekunden</li>
                        <li>Der Modellselektor, Größenselektor und die "Ollama-Modelle abrufen"-Schaltfläche werden wieder aktiviert</li>
                    </ul>
                    
                    <h4>Zwischen Tabs wechseln</h4>
                    <p>Wenn Sie während eines Downloads zu einem anderen Tab wechseln:</p>
                    <ul>
                        <li>Der Download wird im Hintergrund fortgesetzt</li>
                        <li>Wenn Sie zum Modelle-Tab zurückkehren, wird der aktuelle Download-Status angezeigt</li>
                        <li>Die Schnittstelle zeigt, welche Datei gerade heruntergeladen wird und den Gesamtfortschritt</li>
                    </ul>
                    
                    <div class="note">
                        <p><strong>Wichtig:</strong> Modell-Downloads können groß sein (von Hunderten von MB bis zu Hunderten von GB). Stellen Sie sicher, dass Sie ausreichend Festplattenspeicher und eine stabile Internetverbindung haben, bevor Sie einen Download starten. Wenn Sie neue Modelle abrufen müssen, während ein Download läuft, müssen Sie zuerst den aktuellen Download abbrechen.</p>
                    </div>
                `,
                image: "models_downloading.png",
                imageAlt: "Modelle herunterladen",
                imageCaption: "Die Modell-Download-Schnittstelle zeigt Download-Fortschritt und Größenauswahl",
            },
            {
                id: "models-managing",
                title: "Lokale Modelle verwalten",
                content: `
                <p>Nach dem Herunterladen von Modellen können Sie diese über den Bereich "Lokale Modelle" des Modelle-Tabs verwalten.</p>
                
                <h4>Installierte Modelle anzeigen</h4>
                <p>Der Bereich "Lokale Modelle" zeigt alle derzeit auf Ihrem System installierten Modelle:</p>
                <ul>
                    <li>Modelle werden in einem Dropdown-Selektor aufgelistet</li>
                    <li>Wählen Sie ein Modell aus, um auf Verwaltungsoptionen zuzugreifen</li>
                    <li>Das zuletzt heruntergeladene Modell wird automatisch ausgewählt</li>
                </ul>
                
                <h4>Modelle löschen</h4>
                <p>Um Modelle zu entfernen, die Sie nicht mehr benötigen:</p>
                <ol>
                    <li>Wählen Sie das Modell aus dem Dropdown "Lokale Modelle"</li>
                    <li>Klicken Sie auf die "Löschen"-Schaltfläche</li>
                    <li>Bestätigen Sie das Löschen, wenn Sie dazu aufgefordert werden</li>
                    <li>Warten Sie, bis der Vorgang abgeschlossen ist</li>
                </ol>
                <p>Das Löschen ungenutzter Modelle hilft dabei, Festplattenspeicher auf Ihrem System freizugeben.</p>
                
                <div class="note">
                    <p><strong>Hinweis:</strong> Wenn Sie ein Modell löschen, das derzeit in einer Unterhaltung verwendet wird, müssen Sie ein neues Modell auswählen, um das Chatten fortzusetzen.</p>
                </div>
            `,
                image: "models_managing.png",
                imageAlt: "Lokale Modelle verwalten",
                imageCaption:
                    "Der lokale Modelle-Bereich zeigt Modellverwaltungsoptionen",
            },
            {
                id: "models-configuration",
                title: "Modellparameter konfigurieren",
                content: `
                <p>Feinabstimmung, wie Modelle reagieren, durch Anpassung ihrer Parameter in der modelparameters.js-Datei.</p>
                
                <h4>Parameterkonfiguration</h4>
                <p>Modellparameter werden jetzt direkt in der <code>modelparameters.js</code>-Datei konfiguriert:</p>
                <ul>
                    <li>Öffnen Sie die <code>modelparameters.js</code>-Datei in Ihrem Code-Editor</li>
                    <li>Fügen Sie Ihr Modell zum <code>MODEL_PARAMETERS</code>-Objekt hinzu oder ändern Sie bestehende Einträge</li>
                    <li>Speichern Sie die Datei und starten Sie die Anwendung neu, um Änderungen anzuwenden</li>
                </ul>
                
                <h4>Beispiel für das Hinzufügen eines neuen Modells</h4>
                <pre><code>// Zum MODEL_PARAMETERS-Objekt in modelparameters.js hinzufügen
                'ihr-modell-name': {
                    temperature: 0.7,
                    top_k: 50,
                    top_p: 0.9,
                    min_p: 0.05,
                    repeat_penalty: 1.1
                }</code></pre>
                
                <h4>Verfügbare Parameter</h4>
                <p>Die folgenden Parameter können für die meisten Modelle angepasst werden:</p>
                <ul>
                    <li><strong>Temperature</strong> (0.0-2.0) - Kontrolliert Zufälligkeit in Antworten. Höhere Werte erzeugen vielfältigere, kreativere Ausgaben, während niedrigere Werte Antworten fokussierter und deterministischer machen.</li>
                    <li><strong>Top P</strong> (0.0-1.0) - Kontrolliert Vielfalt durch Begrenzung der Token-Auswahl auf einen kumulativen Wahrscheinlichkeitsschwellenwert. Niedrigere Werte erzeugen fokussiertere Antworten.</li>
                    <li><strong>Top K</strong> (1-100+) - Beschränkt Token-Auswahl auf die K wahrscheinlichsten Token. Niedrigere Werte erzeugen vorhersagbarere Antworten.</li>
                    <li><strong>Min P</strong> (0.0-1.0) - Setzt einen minimalen Wahrscheinlichkeitsschwellenwert für Token-Auswahl. Höhere Werte zwingen das Modell, entscheidungsfreudiger zu sein.</li>
                    <li><strong>Repeat Penalty</strong> (1.0-2.0) - Verhindert Wiederholungen durch Bestrafung zuvor verwendeter Token. Höhere Werte reduzieren Wiederholungen aggressiver.</li>
                </ul>
                
                <h4>Parameter-Empfehlungen</h4>
                <p>Verschiedene Aufgaben profitieren von verschiedenen Parameter-Einstellungen:</p>
                <ul>
                    <li><strong>Kreatives Schreiben</strong> - Höhere Temperature (0.7-1.0), höheres top_p (0.9)</li>
                    <li><strong>Faktische Antworten</strong> - Niedrigere Temperature (0.1-0.3), niedriges top_k (40)</li>
                    <li><strong>Code-Generierung</strong> - Niedrigere Temperature (0.1-0.4), höheres repeat_penalty (1.1)</li>
                </ul>
                
                <div class="note">
                    <p><strong>Wichtig:</strong> Nach dem Speichern im Modell-Editor wird die geladene Konfiguration automatisch aktualisiert.</p>
                </div>
                `,
                image: "models_configuration.png",
                imageAlt: "Modellkonfigurations-Schnittstelle",
                imageCaption: "Beispiel der modelparameters.js-Datei mit benutzerdefinierter Konfiguration",
            },
            {
                id: "models-troubleshooting",
                title: "Fehlerbehebung bei Modellproblemen",
                content: `
                    <p>Wenn Sie Probleme mit Modellen in Paiperwork haben, hier sind einige häufige Probleme und Lösungen:</p>
                    
                    <h4>Modell-Abruf-Fehler</h4>
                    <p>Wenn Sie keine Modelle aus der Ollama-Bibliothek abrufen können:</p>
                    <ul>
                        <li>Überprüfen Sie, dass Ollama auf Ihrem System läuft</li>
                        <li>Überprüfen Sie Ihre Internetverbindung</li>
                        <li>Starten Sie Ollama neu und versuchen Sie es erneut</li>
                        <li>Stellen Sie sicher, dass Sie eine kompatible Ollama-Version verwenden (aktuell: 0.6.6)</li>
                    </ul>
                    
                    <h4>Download-Probleme</h4>
                    <p>Wenn Modell-Downloads fehlschlagen oder hängen bleiben:</p>
                    <ul>
                        <li>Überprüfen Sie die Stabilität Ihrer Internetverbindung</li>
                        <li>Stellen Sie sicher, dass Sie genügend Festplattenspeicher haben</li>
                        <li>Versuchen Sie, den Download abzubrechen und neu zu starten</li>
                        <li>Starten Sie Ollama nach dem Abbruch neu, um unvollständige Dateien zu bereinigen</li>
                        <li>Versuchen Sie zuerst, eine kleinere Modellgröße herunterzuladen</li>
                    </ul>
                    
                    <h4>Unvollständige Download-Bereinigung</h4>
                    <p>Wenn Sie einen Download abgebrochen haben und Dateien bereinigen müssen:</p>
                    <ul>
                        <li>Starten Sie den Ollama-Dienst auf Ihrem System neu</li>
                        <li>Dies ermöglicht es Ollama, alle teilweise heruntergeladenen Modelldateien zu bereinigen</li>
                        <li>Nach dem Neustart können Sie einen neuen Download versuchen</li>
                    </ul>
                    
                    <h4>UI-Element-Probleme</h4>
                    <p>Wenn UI-Elemente im Modelle-Tab hängen oder deaktiviert erscheinen:</p>
                    <ul>
                        <li>Wenn Selektoren nach Abschluss oder Abbruch eines Downloads deaktiviert bleiben, aktualisieren Sie die Seite</li>
                        <li>Wenn die "Ollama-Modelle abrufen"-Schaltfläche ohne aktiven Download deaktiviert ist, aktualisieren Sie die Seite</li>
                        <li>Nach mehreren Download-Fehlern wird das System schließlich alle Steuerelemente automatisch wieder aktivieren</li>
                    </ul>
                    
                    <h4>Modell-Leistungsprobleme</h4>
                    <p>Wenn ein Modell langsam läuft oder abstürzt:</p>
                    <ul>
                        <li>Überprüfen Sie Ihre Systemressourcen (VRAM, RAM und CPU-Nutzung)</li>
                        <li>Versuchen Sie ein kleineres Modell oder eine quantisierte Version</li>
                        <li>Schließen Sie andere ressourcenintensive Anwendungen</li>
                        <li>Passen Sie die Kontextgröße im Chat-Tab auf einen kleineren Wert an</li>
                    </ul>
                    
                    <h4>Modell erscheint nicht im Chat</h4>
                    <p>Wenn ein heruntergeladenes Modell nicht im Modellauswahl-Dropdown im Chat angezeigt wird:</p>
                    <ul>
                        <li>Überprüfen Sie, dass der Modell-Download erfolgreich abgeschlossen wurde</li>
                        <li>Aktualisieren Sie den Chat-Tab oder starten Sie die Anwendung neu</li>
                        <li>Überprüfen Sie, ob das Modell spezifische Funktionen oder Konfigurationen benötigt</li>
                    </ul>
                    
                    <div class="note">
                        <p><strong>Hinweis:</strong> Wenn Probleme bestehen bleiben, überprüfen Sie die Ollama-Dokumentation oder suchen Sie nach Ollama-Logs auf Ihrem System für detailliertere Fehlerinformationen.</p>
                    </div>
                `,
            }
        ],
    },
    database: {
        title: "Datenbank",
        intro: "Der Datenbank-Tab bietet Tools zur Überwachung und Wartung Ihrer lokalen Datenbank und gewährleistet optimale Leistung und Datenintegrität bei vollständiger Wahrung der Privatsphäre.",
        articles: [
            {
                id: "database-intro",
                title: "Einführung in die Datenbankverwaltung",
                content: `
                <p>Der Datenbank-Tab gibt Ihnen Einblick und Kontrolle über Paiperworks lokales Datenbanksystem, das alle Ihre Gespräche, Dokumente und Anwendungsdaten speichert.</p>
                
                <p>Hauptfunktionen des Datenbank-Tabs umfassen:</p>
                <ul>
                    <li>Echtzeitstatistiken über Datenbankgröße und Inhalte</li>
                    <li>Tools zur Identifizierung und Bereinigung verwaister Daten</li>
                    <li>Datenbankoptimierungsfunktionen</li>
                    <li>Informationen über Ihre Speichermethode und Sicherheit</li>
                </ul>
                
                <p>Alle Daten in Paiperwork werden lokal in einer SQLite-Datenbank innerhalb des Speichers Ihres Browsers gespeichert. Diese Datenbank ist vollständig mit Ihrem Hauptschlüssel verschlüsselt und gewährleistet vollständige Privatsphäre und Sicherheit.</p>
                
                <div class="note">
                    <p><strong>Wichtig:</strong> Im Gegensatz zu cloud-basierten Anwendungen erfordert Paiperworks Datenbank gelegentliche Wartung, um optimale Leistung zu gewährleisten. Der Datenbank-Tab bietet die Tools, die Sie für diese Wartung benötigen.</p>
                </div>
            `,
                image: "database_overview.png",
                imageAlt: "Datenbank-Tab Übersicht",
                imageCaption: "Der Datenbank-Tab zeigt Statistiken und Verwaltungstools"
            },
            {
                id: "database-stats",
                title: "Datenbankstatistiken verstehen",
                content: `
                <p>Das Datenbankstatistik-Panel bietet wichtige Einblicke in Ihre lokale Datenbank:</p>
                
                <h4>Hauptstatistiken</h4>
                <ul>
                    <li><strong>Datenbankgröße</strong> - Gesamter von Ihrer Datenbank verwendeter Speicherplatz</li>
                    <li><strong>Dokumente</strong> - Anzahl der in Ihrer Datenbank gespeicherten Dokumente</li>
                    <li><strong>Gesamte Chunks</strong> - Textsegmente, die für Dokumentensuche und -abruf verwendet werden</li>
                    <li><strong>Datenbankgesundheit</strong> - Statusindikator für Datenbankintegrität</li>
                </ul>
                
                <h4>Gesundheitsindikatoren</h4>
                <p>Der Datenbankgesundheitsindikator kann zeigen:</p>
                <ul>
                    <li><strong>Gesund</strong> - Grünes Häkchen zeigt an, dass Ihre Datenbank optimiert ist und keine verwaisten Daten hat</li>
                    <li><strong>Verwaiste Chunks</strong> - Gelbe Warnung erscheint, wenn verwaiste Chunks erkannt werden, zeigt an, wie viele Chunks verwaist sind</li>
                </ul>
                
                <h4>Speichermethode</h4>
                <p>Der Abschnitt "Über Ihre Datenbank" zeigt Ihre aktuelle Speichermethode:</p>
                <ul>
                    <li><strong>OPFS (Origin Private File System)</strong> - Moderner, hochleistungsfähiger Speicher verfügbar in neueren Browsern</li>
                    <li><strong>IndexedDB</strong> - Fallback-Speichermethode für Browser ohne OPFS-Unterstützung</li>
                </ul>
                
                <h4>Statistiken aktualisieren</h4>
                <p>Um die aktuellsten Informationen zu erhalten:</p>
                <ol>
                    <li>Klicken Sie auf die Schaltfläche "Statistiken aktualisieren"</li>
                    <li>Warten Sie, bis das System Ihre Datenbank analysiert</li>
                    <li>Überprüfen Sie die aktualisierten Statistiken</li>
                </ol>
                
                <div class="note">
                    <p><strong>Hinweis:</strong> Datenbankstatistiken werden automatisch geladen, wenn Sie den Datenbank-Tab zum ersten Mal öffnen und wenn Sie nach der Nutzung anderer Tabs dorthin zurückkehren.</p>
                </div>
            `,
            },
            {
                id: "database-orphaned",
                title: "Verwaiste Daten verwalten",
                content: `
                <p>Wenn Sie Dokumente oder Gespräche löschen, können manchmal kleine Datenstücke "verwaist" werden - getrennt von ihrem übergeordneten Inhalt, aber immer noch Platz in Ihrer Datenbank beanspruchend.</p>
                
                <h4>Was sind verwaiste Chunks?</h4>
                <p>Verwaiste Chunks sind Textsegmente, die einst Teil eines Dokuments oder Gesprächs waren, aber nicht mehr mit vorhandenem Inhalt verknüpft sind. Sie entstehen, wenn:</p>
                <ul>
                    <li>Dokumente gelöscht werden, ohne alle zugehörigen Chunks ordnungsgemäß zu bereinigen</li>
                    <li>Betriebsunterbrechungen während der Dokumentenlöschung auftreten</li>
                    <li>Systemfehler eine vollständige Bereinigung während normaler Operationen verhindern</li>
                </ul>
                
                <h4>Verwaiste Daten identifizieren</h4>
                <p>Der Datenbank-Tab erkennt automatisch verwaiste Chunks und warnt Sie mit:</p>
                <ul>
                    <li>Einem gelben Warnindikator im Datenbankgesundheitsbereich</li>
                </ul>
                
                <h4>Verwaiste Daten bereinigen</h4>
                <ol>
                    <li>Wenn verwaiste Chunks erkannt werden, klicken Sie auf die Schaltfläche "Datenbank bereinigen"</li>
                    <li>Das System identifiziert und entfernt alle verwaisten Chunks</li>
                    <li>Eine Erfolgsmeldung erscheint, die zeigt, wie viele Chunks entfernt und wie viel Speicherplatz wiederhergestellt wurde</li>
                    <li>Datenbankstatistiken werden automatisch aktualisiert, um den verbesserten Zustand zu zeigen</li>
                </ol>
                
                <div class="note">
                    <p><strong>Wichtig:</strong> Die Bereinigung verwaister Daten entfernt nur unbenötigte Fragmente - sie beeinflusst keine Ihrer tatsächlichen Dokumente, Gespräche oder gespeicherten Informationen.</p>
                </div>
            `,
                image: "database_orphaned.png",
                imageAlt: "Verwaiste Daten-Bereinigung",
                imageCaption: "Die Meldung über die abgeschlossene Datenbankbereinigung"
            },
            {
                id: "database-optimize",
                title: "Datenbankleistung optimieren",
                content: `
                <p>Mit der Zeit, während Sie Inhalte hinzufügen und löschen, kann Ihre Datenbank fragmentiert werden und mehr Speicherplatz als nötig verwenden. Der Datenbank-Tab bietet Tools zur Leistungsoptimierung und Wiederherstellung ungenutzten Speicherplatzes.</p>
                
                <h4>Wann Sie Ihre Datenbank optimieren sollten</h4>
                <p>Erwägen Sie eine Datenbankoptimierung, wenn:</p>
                <ul>
                    <li>Sie große Dokumente oder viele Gespräche gelöscht haben</li>
                    <li>Die Anwendung langsamer als gewöhnlich erscheint</li>
                    <li>Sie bemerken, dass die Datenbankgröße größer als erwartet ist</li>
                    <li>Sie Speicherplatz zurückgewinnen möchten</li>
                </ul>
                
                <h4>Wie sich die Datenbankgröße ändert</h4>
                <p>Verstehen, wie die Datenbankgröße in SQLite funktioniert:</p>
                <ul>
                    <li>Wenn Sie Inhalte hinzufügen, wächst die Datenbank, um sie aufzunehmen</li>
                    <li>Wenn Sie Inhalte löschen, schrumpft die Datenbankdatei nicht automatisch</li>
                    <li>Gelöschter Platz wird als verfügbar für Wiederverwendung markiert, zählt aber immer noch zur Gesamtdateigröße</li>
                    <li>Nur Optimierung (VACUUM) reduziert tatsächlich die Dateigröße durch Neuaufbau der Datenbank</li>
                </ul>
                
                <h4>Datenbankoptimierung durchführen</h4>
                <ol>
                    <li>Klicken Sie auf die Schaltfläche "Datenbank bereinigen" im Datenbank-Tab</li>
                    <li>Warten Sie, bis der Optimierungsprozess abgeschlossen ist (dies kann bei größeren Datenbanken einen Moment dauern)</li>
                    <li>Eine Benachrichtigung erscheint, die zeigt, wie viel Speicherplatz wiederhergestellt wurde</li>
                    <li>Datenbankstatistiken werden automatisch aktualisiert</li>
                </ol>
                
                <h4>Was die Optimierung bewirkt</h4>
                <ul>
                    <li>Baut die Datenbankdatei neu auf, um ungenutzten Speicherplatz zu entfernen</li>
                    <li>Defragmentiert Daten für effizienteren Speicher</li>
                    <li>Reorganisiert Indizes für schnellere Abfragen</li>
                    <li>Verkleinert die Datenbankdatei auf ihre optimale Größe</li>
                </ul>
                
                <div class="note">
                    <p><strong>Tipp:</strong> Machen Sie es sich zur Gewohnheit, die Datenbankoptimierung nach dem Löschen großer Dokumente oder mehrerer Gespräche durchzuführen, um optimale Leistung zu erhalten. Im Gegensatz zu vielen Cloud-Anwendungen benötigen lokale Datenbankanwendungen wie Paiperwork gelegentliche Wartung, um reibungslos zu funktionieren.</p>
                </div>
            `,
            },
            {
                id: "database-backup",
                title: "Vollstandige Datenbank-Backups exportieren und importieren",
                content: `
                <p>Im Datenbank-Tab gibt es zwei Backup-Schaltflachen, mit denen Sie Ihre Daten sicher zwischen Browsern oder Geraten ubertragen konnen:</p>
                <ul>
                    <li><strong>Datenbank exportieren</strong> - Erstellt eine vollstandige Sicherungsdatei namens <code>Paiperwork-Backup.pwdb</code></li>
                    <li><strong>Datenbank importieren</strong> - Stellt diese Sicherung im aktuellen lokalen Speicher wieder her</li>
                <h4>Verwendung der Datenbankschaltflächen</h4>
                <p>Verwenden Sie die Schaltflächen oben im Datenbank-Tab wie folgt:</p>
                <ol>
                    <li>Klicken Sie auf "Datenbank exportieren", um eine vollständige Sicherungsdatei herunterzuladen.</li>
                    <li>Klicken Sie auf "Datenbank importieren", um eine Sicherungsdatei auszuwählen und wiederherzustellen. Dies ersetzt Ihre aktuelle lokale Datenbank.</li>
                    <li>Klicken Sie auf "Alle Informationen löschen", um alle gespeicherten Gespräche, Dokumente und Einstellungen dauerhaft zu entfernen und zur Willkommensseite zurückzukehren.</li>
                </ol>

                </ul>

                <h4>Was im Backup enthalten ist</h4>
                <p>Die exportierte Sicherung enthalt alle Datenbankrollen von Paiperwork:</p>
                <ul>
                    <li><strong>Main</strong> - Kern-Gesprache und Einstellungen</li>
                    <li><strong>RAG</strong> - Dokument-Chunks und Retrieval-Daten</li>
                    <li><strong>HTML</strong> - Gespeicherte HTML-Inhalte fur Prasentationen und Artifacts</li>
                    <li><strong>Knowledge Base</strong> - Wissenssammlungen und Eintrage</li>
                </ul>

                <h4>Wichtiges Importverhalten</h4>
                <ul>
                    <li>Der Import <strong>ersetzt</strong> Ihre aktuellen lokalen Datenbanken</li>
                    <li>Der Import <strong>fuhrt nicht zusammen</strong> mit bereits vorhandenen lokalen Daten</li>
                    <li>Nach dem Import leitet Paiperwork zur Willkommensseite weiter, damit Sie den Master Key erneut eingeben</li>
                </ul>

                <h4>Empfohlener Ablauf</h4>
                <ol>
                    <li>Im Quell-Browser den Datenbank-Tab offnen und auf "Datenbank exportieren" klicken</li>
                    <li>Die erzeugte Datei <code>Paiperwork-Backup.pwdb</code> auf den Ziel-Browser bzw. das Ziel-Gerat ubertragen</li>
                    <li>Im Ziel-Browser den Datenbank-Tab offnen und auf "Datenbank importieren" klicken</li>
                    <li>Ersetzen bestatigen und anschlieend mit dem Master Key erneut anmelden</li>
                </ol>

                <div class="note">
                    <p><strong>Hinweis:</strong> Legacy-Importe einzelner <code>.db</code>-Dateien werden weiterhin unterstutzt, stellen aber nur die Hauptdatenbank wieder her. Verwenden Sie <code>Paiperwork-Backup.pwdb</code> fur vollstandige Portabilitat.</p>
                </div>
            `,
            },
            {
                id: "database-maintenance",
                title: "Best Practices für Datenbankwartung",
                content: `
                <p>Ordnungsgemäße Datenbankwartung stellt sicher, dass Paiperwork weiterhin reibungslos und effizient läuft. Befolgen Sie diese Best Practices, um Ihre Datenbank gesund zu halten.</p>
                
                <h4>Regelmäßiger Wartungsplan</h4>
                <p>Erstellen Sie einen routinemäßigen Wartungsplan:</p>
                <ul>
                    <li><strong>Wöchentlich</strong> - Überprüfen Sie Datenbankstatistiken und bereinigen Sie verwaiste Daten, falls gefunden</li>
                    <li><strong>Monatlich</strong> - Führen Sie Datenbankoptimierung durch, um Speicherplatz zurückzugewinnen und die Leistung zu verbessern</li>
                    <li><strong>Nach Massenoperationen</strong> - Optimieren Sie nach dem Löschen mehrerer Dokumente oder Gespräche</li>
                </ul>
                
                <h4>Leistungsindikatoren</h4>
                <p>Achten Sie auf Anzeichen, dass Ihre Datenbank Wartung benötigt:</p>
                <ul>
                    <li>Langsamere Anwendungsreaktionszeiten</li>
                    <li>Verzögerungen beim Wechseln zwischen Tabs</li>
                    <li>Längere Ladezeiten für Dokumente oder Gespräche</li>
                    <li>Unerwartetes Wachstum der Datenbankgröße</li>
                </ul>
                
                <h4>Vorbeugende Wartung</h4>
                <ul>
                    <li>Bereinigen Sie regelmäßig unnötige Dokumente und Gespräche</li>
                    <li>Führen Sie Optimierung nach dem Löschen bedeutender Datenmengen durch</li>
                    <li>Überprüfen Sie regelmäßig auf verwaiste Chunks, auch wenn keine Warnung erscheint</li>
                    <li>Starten Sie die Anwendung gelegentlich neu, um Browser-Speicheroptimierung zu ermöglichen</li>
                </ul>
                
                <h4>Datenbankwachstum verstehen</h4>
                <p>Es ist normal, dass Ihre Datenbank mit der Zeit wächst, während Sie:</p>
                <ul>
                    <li>Mehr Dokumente für RAG-Verarbeitung hinzufügen</li>
                    <li>Mehr Gespräche mit der KI führen</li>
                    <li>Wissensbasis-Einträge und Sammlungen erstellen</li>
                    <li>Mehr Forschungsberichte generieren und speichern</li>
                </ul>
                <p>Was nicht normal ist, ist wenn die Datenbank groß bleibt, nachdem Sie diese Inhalte gelöscht haben - dann ist Optimierung erforderlich.</p>
                
                <div class="note">
                    <p><strong>Wichtig:</strong> Im Gegensatz zu Cloud-Anwendungen haben lokale Datenbankanwendungen keine automatischen Wartungsprozesse, die auf Servern laufen. Der Datenbank-Tab gibt Ihnen die Tools, um diese Wartung selbst durchzuführen und Ihre Anwendung reibungslos am Laufen zu halten.</p>
                </div>
            `,
            },
            {
                id: "database-troubleshooting",
                title: "Fehlerbehebung bei Datenbankproblemen",
                content: `
                <p>Wenn Sie Probleme mit der Datenbank haben oder Leistungsprobleme bemerken, hier sind einige Schritte zur Fehlerbehebung:</p>
                
                <h4>Häufige Probleme und Lösungen</h4>
                
                <h5>Langsame Anwendungsleistung</h5>
                <ul>
                    <li><strong>Problem:</strong> Paiperwork fühlt sich träge an oder braucht länger zum Antworten</li>
                    <li><strong>Lösung:</strong> Führen Sie Datenbankoptimierung durch, indem Sie auf die Schaltfläche "Datenbank bereinigen" klicken</li>
                    <li><strong>Vorbeugung:</strong> Planen Sie regelmäßige Optimierung, besonders nach großen Löschungen</li>
                </ul>
                
                <h5>Große Datenbankgröße</h5>
                <ul>
                    <li><strong>Problem:</strong> Datenbankgröße scheint unverhältnismäßig groß im Vergleich zu Ihrem Inhalt</li>
                    <li><strong>Lösung 1:</strong> Überprüfen und bereinigen Sie verwaiste Chunks</li>
                    <li><strong>Lösung 2:</strong> Führen Sie Datenbankoptimierung durch, um ungenutzten Speicherplatz zurückzugewinnen</li>
                    <li><strong>Lösung 3:</strong> Überprüfen und löschen Sie unnötige Dokumente und Gespräche</li>
                </ul>
                
                <h5>Fehlender Inhalt nach Sitzungsänderungen</h5>
                <ul>
                    <li><strong>Problem:</strong> Inhalt scheint zu fehlen beim Wechseln der Hauptschlüssel</li>
                    <li><strong>Lösung:</strong> Überprüfen Sie, dass Sie den korrekten Hauptschlüssel für diesen Inhalt verwenden</li>
                    <li><strong>Erklärung:</strong> Verschiedene Hauptschlüssel erstellen separate sichere Speicherbereiche</li>
                </ul>
                
                <h5>Statistiken werden nicht aktualisiert</h5>
                <ul>
                    <li><strong>Problem:</strong> Datenbankstatistiken scheinen aktuelle Änderungen nicht zu reflektieren</li>
                    <li><strong>Lösung:</strong> Klicken Sie auf die Schaltfläche "Statistiken aktualisieren" für manuelle Aktualisierung</li>
                    <li><strong>Erklärung:</strong> Einige Statistiken sind zwischengespeichert und benötigen manuelle Aktualisierung</li>
                </ul>
                
                <h5>Hartnäckige verwaiste Chunks</h5>
                <ul>
                    <li><strong>Problem:</strong> Verwaiste Chunks erscheinen nach der Bereinigung wieder</li>
                    <li><strong>Lösung 1:</strong> Versuchen Sie, den Bereinigungsprozess erneut auszuführen</li>
                    <li><strong>Lösung 2:</strong> Aktualisieren Sie den Browser und versuchen Sie erneut zu bereinigen</li>
                    <li><strong>Lösung 3:</strong> Führen Sie Datenbankoptimierung nach der Bereinigung durch</li>
                </ul>
                
                <h4>Letzter Ausweg: Datenbank-Reset</h4>
                <p>Wenn anhaltende Probleme auftreten und normale Wartung nicht hilft:</p>
                <ol>
                    <li>Exportieren Sie zuerst wichtige Gespräche oder Dokumente</li>
                    <li>Kehren Sie zum Willkommensbildschirm zurück</li>
                    <li>Klicken Sie auf "Alle Informationen löschen", um die Datenbank zurückzusetzen</li>
                    <li>Dies entfernt alle Daten und erstellt eine neue Datenbank</li>
                </ol>
                
                <div class="note">
                    <p><strong>Warnung:</strong> Datenbank-Reset ist irreversibel und löscht alle Ihre Daten. Exportieren Sie immer zuerst wichtige Informationen.</p>
                </div>
            `,
            }
        ],
    },


};
