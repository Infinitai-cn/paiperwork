window.helpContent = {

    gettingstarted: {
        title: "Commencer",
        intro: [
            "Bienvenue dans Paiperwork, une interface web sécurisée pour Ollama qui privilégie la confidentialité des données et la facilité d'utilisation. Cet assistant axé sur les professionnels offre des fonctionnalités de productivité tout en gardant vos données locales et protégées.",
            "Vous pouvez telecharger et executer des modeles localement sur votre ordinateur, ou utiliser des modeles cloud si votre machine ne peut pas gerer des modeles locaux. Les modeles cloud necessitent une connexion sur ollama.com et la creation d'une cle API. Lors de la premiere utilisation d'un modele cloud, Paiperwork demandera cette cle et la stockera chiffree dans votre base de donnees locale.",
            "Instructions detaillees pour utiliser les modeles cloud Ollama : 1) Telechargez Paiperwork depuis https://infinitai-cn.github.io/paiperwork/. 2) Decompressez le fichier. 2.1) Si vous ne pouvez pas ouvrir Paiperwork, verifiez les parametres de securite pour autoriser son execution. Sous Windows, cliquez sur le bouton More info. Sous macOS, ouvrez Confidentialite et securite dans les Reglages. 3) Allez sur https://ollama.com et creez votre compte. 4) Telechargez et installez Ollama. 5) Dans votre compte Ollama, ouvrez Settings. 6) Ouvrez Usage pour verifier le credit gratuit restant (important). 7) Ouvrez Keys, cliquez sur Add API key, puis sur Generate API key, et copiez la cle generee. 8) Enregistrez la cle dans un fichier texte sur votre ordinateur. 9) Lancez Paiperwork (Mac, Windows ou Linux). 10) Saisissez une cle maitre puis, dans l'onglet Chat, cliquez sur Manage Cloud API key et ajoutez votre cle API Ollama. 11) Vous pouvez maintenant utiliser les modeles cloud gratuits d'Ollama.",
            "Avis mode en ligne (<a href=\"https://huggingface.co/spaces/Infinitai/Paiperwork\" target=\"_blank\" rel=\"noopener noreferrer\">Hugginface spaces</a>) : En raison de contraintes locales, les onglets Documents, Translate et Models sont desactives en mode en ligne. Ces onglets sont actives lorsque vous executez Paiperwork localement sur votre ordinateur."
        ],
        articles: [
            {
                id: "gs-welcome",
                title: "Écran d'accueil",
                content: `
            <p>** Si vous avez un ordinateur portable ou un ordinateur sans carte graphique puissante, choisissez toujours des modèles de petite taille pour de meilleures performances (sauf si vous avez une machine avec beaucoup de RAM et savez ce que vous faites)**</p>
            <p>** Veuillez noter que Paiperwork utilise des instructions pour ses fonctionnalités, <b>des modèles d'instruction sont requis</b> (n'utilisez pas de modèles de base ou de modèles texte/chat)**</p>
            <p>L'écran d'accueil est votre point de départ pour toutes les interactions avec Paiperwork.</p>
            <p>À partir d'ici, vous pouvez :</p>
            <ul>
            <li>Commencer de nouvelles conversations et utiliser toutes les options de l'application avec l'IA en saisissant une Clé Maître (Différentes Clés Maître créeront des Chats/paramètres/données séparés dans la base de données)</li>
            <li>Accéder à votre historique de conversation en utilisant une Clé Maître précédemment saisie</li>
            <li>Vérifier les mises à jour du programme</li>
            <li>Accéder à la documentation d'aide</li>
        </ul>
        
        <div class="note">
            <p><strong>Important :</strong> La Clé Maître que vous saisissez sert deux objectifs critiques :</p>
            <ul>
                <li>Elle peut créer des environnements de travail séparés (En utilisant différentes Clés Maître)</li>
                <li>Elle agit comme votre clé de chiffrement pour stocker les données de conversation de manière sécurisée (vos données seront stockées localement dans le stockage de votre navigateur sous forme de base de données). Aucune donnée ne sera jamais envoyée en dehors de votre système à l'exception des invites de recherche lorsque le bouton web est activé pour les recherches web ou la fonction de Recherche (envoi d'une requête de recherche web au moteur de recherche Bing de Microsoft) ou les requêtes/téléchargements de modèles Ollama. Aucune télémétrie n'est collectée. Veuillez noter que si vous changez de navigateur, il n'y aura pas de base de données précédente dessus, donc vous recommencerez à zéro.</li>
            </ul>
            <p>Pour accéder à une conversation précédente, vous devez saisir la <em>même Clé Maître exacte</em> (sensible à la casse) que vous avez utilisée lors de sa création.</p>
        </div>
        
        <div class="note">
            <p><strong>Compatibilité linguistique :</strong> Bien que l'interface de Paiperwork prenne en charge plusieurs langues, pour une expérience optimale, vous devriez utiliser des modèles d'IA qui sont formés dans votre langue préférée. Si vous utilisez une langue d'interface non anglaise, considérez l'utilisation de modèles qui prennent en charge votre langue pour de meilleurs résultats. Lors de la demande d'informations dans des fonctionnalités comme la Recherche ou le chat général, si vous n'obtenez pas la réponse/résultat dans votre langue, vous pourriez avoir besoin de spécifier votre langue de réponse préférée dans votre invite, par exemple : "Pourquoi les chats ont-ils des poils blancs ? (Fournissez cette recherche en espagnol)" ou "(Répondez en français)" pour vous assurer que l'IA répond dans votre langue désirée plutôt que de prendre l'anglais par défaut.</p>
        </div>
        
         <div class="note">
          <p><strong>Langue de réponse de l'IA :</strong> Paiperwork applique maintenant automatiquement les réponses de l'IA dans votre langue préférée basée sur votre sélection du menu déroulant de langue sur la page principale (index.html). Le système ajoute automatiquement des instructions d'application de langue pour s'assurer que toutes les réponses de l'IA correspondent à votre langue d'interface choisie. Si vous avez besoin de réponses dans une langue différente pour des conversations spécifiques, vous pouvez remplacer cela en ajoutant "Vous répondez toujours en [langue spécifique]" à votre Invite Système dans l'onglet Chat. (La cohérence de la langue de réponse dépendra de la qualité du modèle d'IA)</p>
         </div>
        
        <div class="note">
            <p><strong>Compatibilité système bas de gamme :</strong> Paiperwork a été testé et optimisé pour la compatibilité avec des modèles d'IA plus petits (comme Qwen3.1 1.7B et Gemma3 4B) pour assurer des performances efficaces sur des systèmes bas de gamme. Ces modèles plus petits fournissent de bons résultats tout en nécessitant significativement moins de VRAM et de ressources système, rendant Paiperwork accessible aux utilisateurs avec des capacités matérielles limitées.</p>
        </div>
        
        <div class="note">
            <p><strong>Support de traduction :</strong> Si vous trouvez des traductions manquantes ou incorrectes dans Paiperwork, veuillez nous le faire savoir sur nos <a href="https://github.com/discussions" target="_blank" rel="noopener noreferrer">Discussions GitHub</a>. Vos commentaires nous aident à améliorer l'expérience multilingue pour tous les utilisateurs.</p>
        </div>
    `,
                image: "welcome.png",
                imageAlt: "Écran d'accueil Paiperwork",
                imageCaption: "L'écran d'accueil Paiperwork montrant le champ de saisie de la Clé Maître",
            },
            {
                id: "gs-topics",
                title: "Utilisation efficace de la Clé Maître",
                content: `
               <p>Les Clés Maître sont fondamentales au fonctionnement de Paiperwork. Elles fournissent principalement la sécurité pour vos conversations.</p>
               
               <h4>Clé Maître comme clés de sécurité</h4>
               <p>Votre Clé Maître agit comme une clé de chiffrement qui sécurise vos données de conversation. Cela signifie :</p>
               <ul>
                 <li>Les Clés Maître sont <strong>sensibles à la casse</strong> - "Mon Projet" et "mon projet" sont traitées comme des Clés Maître différentes</li>
                 <li>Vous devez saisir exactement la même Clé Maître pour accéder à une conversation précédente</li>
                 <li>Si vous oubliez une Clé Maître, vous ne pouvez pas récupérer cette conversation</li>
                 <li>Choisissez des Clés Maître courtes et mémorables que vous pouvez facilement rappeler plus tard</li>
               </ul>
               
               <h4>Création de Clés Maître efficaces</h4>
               <p>Pour de meilleurs résultats avec vos Clés Maître :</p>
               <ul>
                 <li>Gardez-les courtes et faciles à retenir (ex., "VoyageItalie2025" ou "Plans Jardin")</li>
                 <li>Utilisez des modèles simples dont vous vous souviendrez (ex., "Maison-2023" ou "Livre-Recettes")</li>
                 <li>Évitez les phrases complexes avec des caractères spéciaux ou des espacements inhabituels</li>
                 <li>Considérez l'utilisation d'aides-mémoire personnels que seul vous reconnaîtriez</li>
               </ul>
               
               <div class="note">
                 <p><strong>Conseil :</strong> Considérez garder un enregistrement sécurisé des Clés Maître importantes que vous utilisez fréquemment, surtout pour les projets à long terme. Pensez aux Clés Maître comme des mots de passe - elles doivent être mémorables et sécurisées.</p>
               </div>
             `,
                image: "memorabletopic.png",
                imageAlt: "Exemple de saisie de Clé Maître",
                imageCaption: "Exemple de saisie d'une Clé Maître courte et mémorable",
            },
            {
                id: "gs-conversation",
                title: "Commencer une conversation",
                content: `
                <p>Pour commencer une nouvelle conversation avec l'IA :</p>
                <ol>
                    <li>Saisissez une Clé Maître dans le champ "Saisissez la clé maître ici..."</li>
                    <li>Assurez-vous que votre Clé Maître soit à la fois descriptive et mémorable</li>
                    <li>Cliquez sur le bouton "Commencer"</li>
                    <li>L'interface de chat s'ouvrira avec votre nouvelle conversation</li>
                </ol>
                <p>Si vous avez utilisé cette Clé Maître auparavant, Paiperwork chargera votre historique de conversation précédent.</p>
                <p>Si c'est une nouvelle Clé Maître, une nouvelle conversation commencera.</p>
            
                <h4>Gestion des conversations</h4>
                <p>En haut à droite de l'écran d'accueil, vous trouverez le bouton "Supprimer toutes les informations". Utilisez-le avec prudence, car il supprimera définitivement TOUTES vos conversations et données sauvegardées.</p>
            `,
                image: "clickstart.png",
                imageAlt: "Commencer une nouvelle conversation",
                imageCaption: "Saisissez votre Clé Maître et cliquez sur Commencer pour débuter une nouvelle session de chat",
            },
            {
                id: "gs-password-protection",
                title: "Fonctionnalité de mot de passe de protection",
                content: `
                <p>Paiperwork inclut une fonctionnalité optionnelle de mot de passe de protection qui ajoute une couche de sécurité supplémentaire contre la suppression accidentelle de données pour vos bases de données stockées.</p>
                
                <h4>Qu'est-ce que le mot de passe de protection ?</h4>
                <p>Le mot de passe de protection est une fonctionnalité de sécurité qui :</p>
                <ul>
                    <li>Empêche la suppression accidentelle de toutes vos données et conversations</li>
                    <li>Nécessite une vérification par mot de passe avant d'effectuer l'action "Supprimer toutes les informations"</li>
                    <li>Est complètement optionnel - vous pouvez choisir d'en configurer un ou non (requis seulement pour supprimer toutes les informations de la base de données)</li>
                    <li>Est stocké de manière sécurisée en utilisant le chiffrement avec hachage basé sur le sel</li>
                </ul>
                
                <h4>Configuration du mot de passe de protection</h4>
                <p>Lorsque vous essayez pour la première fois de supprimer toutes les informations :</p>
                <ol>
                    <li>Cliquez sur le bouton "Supprimer toutes les informations" sur l'écran d'accueil</li>
                    <li>Si aucun mot de passe de protection n'existe, vous serez invité à en configurer un</li>
                    <li>Choisissez de configurer un mot de passe de protection ou d'ignorer cette fonctionnalité (fermez simplement cette fenêtre)</li>
                    <li>Si vous choisissez de configurer : saisissez un mot de passe (minimum 6 caractères) et confirmez-le</li>
                    <li>Le mot de passe sera chiffré de manière sécurisée et stocké localement</li>
                </ol>
                
                <h4>Utilisation du mot de passe de protection</h4>
                <p>Une fois qu'un mot de passe de protection est configuré :</p>
                <ul>
                    <li>Toute tentative de suppression de toutes les informations nécessitera une vérification par mot de passe</li>
                    <li>Saisissez votre mot de passe de protection dans la boîte de dialogue de vérification</li>
                    <li>Seul le mot de passe correct vous permettra de procéder à la suppression</li>
                    <li>La vérification du mot de passe inclut une option "Réinitialiser le mot de passe" si vous devez le changer</li>
                </ul>
                
                <h4>Réinitialisation de votre mot de passe de protection</h4>
                <p>Si vous devez changer votre mot de passe de protection :</p>
                <ol>
                    <li>Tentez de supprimer toutes les informations pour faire apparaître la boîte de dialogue de vérification du mot de passe</li>
                    <li>Saisissez votre mot de passe actuel dans le champ de saisie</li>
                    <li>Cliquez sur le bouton "Réinitialiser le mot de passe"</li>
                    <li>Si votre mot de passe actuel est correct, vous serez guidé à travers la configuration d'un nouveau mot de passe</li>
                </ol>
                
                <h4>Détails de sécurité</h4>
                <ul>
                    <li><strong>Chiffrement</strong> - Les mots de passe sont hachés en utilisant SHA-256 avec des sels uniques</li>
                    <li><strong>Stockage local</strong> - Les mots de passe de protection sont stockés uniquement sur votre appareil</li>
                    <li><strong>Pas de récupération</strong> - Si vous oubliez votre mot de passe de protection, vous ne pouvez pas le récupérer</li>
                    <li><strong>Fonctionnalité optionnelle</strong> - Vous pouvez ignorer la configuration d'un mot de passe de protection si vous préférez (requis seulement pour supprimer toutes les informations de la base de données)</li>
                </ul>
                
                <div class="note">
                    <p><strong>Important :</strong> Le mot de passe de protection est conçu pour empêcher la suppression accidentelle. Si vous oubliez votre mot de passe de protection, il n'y a pas de méthode de récupération (vous devrez supprimer le stockage local de votre navigateur pour localhost pour recommencer à zéro, perdant toutes vos informations stockées pour Paiperwork). Choisissez un mot de passe dont vous vous souviendrez mais qui est différent des options facilement devinables.</p>
                </div>
            `,
                image: "protection_password.png",
                imageAlt: "Configuration du mot de passe de protection",
                imageCaption: "La boîte de dialogue de configuration du mot de passe de protection pour sécuriser la suppression de données",
            },
        ],
    },
    chat: {
        title: "Chat",
        intro:
            "L'interface de chat offre de puissantes capacités de conversation avec l'IA, avec plusieurs fonctionnalités avancées pour améliorer vos interactions.",
        articles: [
            {
                id: "chat-basics",
                title: "Bases du Chat",
                content: `
                <p>L'interface de chat est l'endroit où vos conversations avec l'IA ont lieu. Elle est conçue pour être intuitive mais puissante, avec plusieurs fonctionnalités clés qui vous aident à tirer le meilleur parti de vos interactions.</p>
                <div class="note">
                    <p><strong>Important :</strong> Nous mettons à jour l'invite système de l'IA avec la date actuelle à des fins de contexte temporel. Les modèles d'IA peuvent être confus concernant les événements actuels car leur limite de connaissances est probablement antérieure à la date actuelle. Il est suggéré d'utiliser la recherche web pour s'informer sur les événements actuels.</p>
                </div>
                <h4>Éléments de Chat Principaux</h4>
                <ul>
                    <li><strong>Zone de Messages</strong> - Où l'historique de votre conversation apparaît, avec les messages utilisateur à droite et les réponses de l'IA à gauche</li>
                    <li><strong>Champ de Saisie</strong> - Tapez vos messages ici et appuyez sur Entrée ou cliquez sur Envoyer pour soumettre</li>
                    <li><strong>Bouton Envoyer</strong> - Soumet votre message et se transforme en bouton Annuler pendant la génération de réponse de l'IA</li>
                    <li><strong>Sélecteur de Modèle</strong> - Choisissez différents modèles d'IA selon vos exigences de tâche</li>
                    <li><strong>Affichage de la Clé Maître</strong> - Montre votre Clé Maître actuelle (masquée pour la sécurité). Cliquez pour révéler temporairement la vraie clé, ce qui aide à rafraîchir votre mémoire sur quelle clé de chiffrement vous utilisez actuellement</li>
                </ul>
                
                <h4>Fonctionnalité d'Affichage de la Clé Maître</h4>
                <p>L'affichage de la Clé Maître dans l'interface de chat vous aide à garder une trace de votre clé de chiffrement actuelle :</p>
                <ul>
                    <li><strong>Affichage de Sécurité</strong> - Par défaut, la Clé Maître est affichée sous forme de points (••••••••••••) pour protéger votre vie privée</li>
                    <li><strong>Cliquer pour Révéler</strong> - Cliquez sur l'affichage de la Clé Maître pour montrer temporairement le texte réel de la clé</li>
                    <li><strong>Masquage Automatique</strong> - La clé se masque automatiquement après 3 secondes pour la sécurité</li>
                    <li><strong>Aide-Mémoire</strong> - Utile pour confirmer quelle Clé Maître vous utilisez actuellement, surtout quand vous travaillez avec plusieurs projets</li>
                </ul>
                
                <h4>Contrôles de Messages</h4>
                <p>Chaque réponse de l'IA inclut des boutons d'action en bas qui vous permettent de :</p>
                <ul>
                    <li><strong>Régénérer</strong> - Crée une nouvelle réponse à votre dernier message, utile si vous voulez une réponse différente</li>
                    <li><strong>Supprimer</strong> - Supprime la paire de messages (votre message et la réponse de l'IA) de la conversation</li>
                    <li><strong>Copier</strong> - Copie tout le contenu de la réponse de l'IA dans votre presse-papiers</li>
                </ul>
                
                <h4>Annulation de la Génération</h4>
                <p>Si vous voulez arrêter l'IA pendant qu'elle génère une réponse, cliquez simplement sur le bouton rouge Annuler (qui a remplacé le bouton Envoyer). Cela arrête immédiatement le processus de génération et marque la réponse incomplète.</p>
                
                <div class="note">
                    <p><strong>Astuce :</strong> Pour garder vos conversations organisées, essayez d'utiliser différentes Clés Maître pour différents sujets ou projets. Utilisez la fonctionnalité d'affichage de la Clé Maître pour confirmer que vous êtes dans le bon contexte avant de commencer des conversations importantes.</p>
                </div>
            `,
                images: [
                    {
                        src: "chat_interface.png",
                        alt: "Interface de Chat",
                        caption:
                            "L'interface de chat montrant les contrôles de conversation et les options de messages",
                    },
                    {
                        src: "Encrypted-database.png",
                        alt: "Base de données chiffrée pour les chats et données",
                        caption: "Base de données chiffrée pour les chats et données"
                    }
                ]

            },
            {
                id: "chat-system-prompt",
                title: "Utilisation des Invites Système",
                content: `
                <p>L'invite système est un moyen puissant de contrôler comment l'IA se comporte dans votre conversation. Pensez-y comme définir des instructions pour la personnalité, le focus de connaissances et le style de réponse de l'IA.</p>
                
                <h4>Accéder à l'Invite Système</h4>
                <p>Pour voir et éditer l'invite système :</p>
                <ol>
                    <li>Cliquez sur l'onglet "Invite Système" dans l'interface de chat</li>
                    <li>Éditez le texte dans le grand champ de texte</li>
                    <li>Cliquez sur "Enregistrer" pour appliquer vos changements</li>
                </ol>
                
                <h4>Invites Système Efficaces</h4>
                <p>Pour de meilleurs résultats lors de la personnalisation de votre invite système :</p>
                <ul>
                    <li>Soyez spécifique sur le rôle de l'IA (par ex., "Vous êtes un assistant de codage utile spécialisé en JavaScript")</li>
                    <li>Définissez le style et format préférés des réponses</li>
                    <li>Spécifiez toutes limitations ou frontières</li>
                    <li>Incluez tous domaines de connaissances spécialisés sur lesquels l'IA devrait se concentrer</li>
                </ul>
                
                <div class="note">
                    <p><strong>Note :</strong> Changer l'invite système réinitialisera le contexte de conversation, mais un bouton "Continuer la Conversation" apparaîtra pour aider à maintenir le flux de conversation.</p>
                </div>
            `,
                image: "system_prompt.png",
                imageAlt: "Éditeur d'Invite Système",
                imageCaption:
                    "L'éditeur d'invite système vous permet de personnaliser le comportement de l'IA",
            },

            {
                id: "chat-insights",
                title: "Aperçus de Conversation",
                content: `
                <p>La fonctionnalité Aperçus aide l'IA à mieux vous comprendre au fil du temps en apprenant automatiquement de vos messages.</p>
                
                <h4>Comment Fonctionnent les Aperçus</h4>
                <p>Quand activé, Paiperwork analyse vos messages pour extraire des informations pertinentes sur vos préférences, intérêts et style de communication. Cela aide l'IA à fournir des réponses plus personnalisées plus vous interagissez avec elle.</p>
                
                <ul>
                    <li><strong>Centré sur la Vie Privée</strong> - Les aperçus sont chiffrés de manière sécurisée en utilisant votre Clé Maître et stockés localement sur votre appareil</li>
                    <li><strong>Analyse Sélective</strong> - Seuls les messages qui contiennent des préférences personnelles sont analysés</li>
                    <li><strong>Non-Identifiant</strong> - Le système se concentre sur des traits généraux plutôt que sur des détails personnels spécifiques</li>
                    <li><strong>Temps de Traitement</strong> - Si vous utilisez un modèle de raisonnement, les aperçus prendront significativement plus de temps à être générés car le modèle raisonnera pendant un certain temps avant de créer l'aperçu</li>
                </ul>
                
                <h4>Gestion des Aperçus</h4>
                <p>Vous avez un contrôle complet sur la fonctionnalité Aperçus :</p>
                
                <h5>Activer ou Désactiver la Collecte d'Aperçus</h5>
                <ol>
                    <li>Cliquez sur l'onglet "Chat" dans l'interface de chat</li>
                    <li>Trouvez le commutateur "Aperçus" (en haut)</li>
                    <li>Basculez-le pour l'activer ou le désactiver</li>
                </ol>
                <p>Quand désactivé, aucun nouvel aperçu ne sera collecté de vos futurs messages. Les aperçus précédemment stockés restent dans la base de données et seront toujours chargés et utilisés pour améliorer la compréhension de l'IA sur vous.</p>
                
                <h5>Voir et Gérer les Aperçus Stockés</h5>
                <p>Vous pouvez voir, éditer et supprimer les aperçus stockés :</p>
                <ol>
                    <li>Trouvez le petit bouton "e" à gauche du commutateur Aperçus</li>
                    <li>Cliquez sur ce bouton pour ouvrir l'Éditeur d'Aperçus</li>
                    <li>Dans la fenêtre de l'éditeur, vous pouvez :</li>
                    <ul>
                        <li><strong>Voir</strong> - Voir tous les aperçus que le système a collectés sur vous</li>
                        <li><strong>Éditer</strong> - Modifier tout aperçu existant qui est inexact ou nécessite une mise à jour</li>
                        <li><strong>Supprimer</strong> - Supprimer des aperçus spécifiques que vous ne voulez pas que l'IA utilise</li>
                        <li><strong>Ajouter</strong> - Créer de nouveaux aperçus manuellement pour guider la compréhension de l'IA</li>
                    </ul>
                    <li>Cliquez sur "Enregistrer les Changements" pour appliquer vos modifications</li>
                </ol>
                <p>Après avoir enregistré les changements, l'invite système sera automatiquement reconstruite pour incorporer vos préférences mises à jour.</p>
                
                <h4>Comment les Aperçus Sont Toujours Disponibles</h4>
                <p>Les aperçus fonctionnent différemment du commutateur de collecte :</p>
                <ul>
                    <li><strong>Toujours Chargés</strong> - Quand vous commencez une conversation, tous les aperçus stockés sont automatiquement chargés de la base de données</li>
                    <li><strong>Amélioration Continue</strong> - Vos aperçus améliorent chaque conversation, aidant l'IA à comprendre vos préférences</li>
                    <li><strong>Le Commutateur Contrôle Seulement la Collecte</strong> - Le commutateur contrôle seulement si de nouveaux aperçus sont créés à partir de futurs messages</li>
                    <li><strong>Gestion Manuelle</strong> - Utilisez le bouton "e" pour gérer les aperçus existants indépendamment de l'état du commutateur</li>
                </ul>
                
                <h4>Ce Qui Est Analysé</h4>
                <p>Le système analyse sélectivement les messages qui contiennent :</p>
                <ul>
                    <li>Des auto-références (phrases commençant par "Je" comme "Je préfère..." ou "J'aime...")</li>
                    <li>Des messages plus longs et détaillés (typiquement 5+ mots)</li>
                    <li>Des messages contenant des préférences personnelles ou des opinions</li>
                </ul>
                
                <div class="note">
                    <p><strong>Note de Confidentialité :</strong> Tous les aperçus sont chiffrés avec votre Clé Maître et stockés localement sur votre appareil. Ils ne sont accessibles que lorsque vous entrez exactement la même Clé Maître qui a été utilisée pour les chiffrer. Les aperçus sont toujours chargés quand disponibles pour améliorer vos conversations, mais vous pouvez les supprimer individuellement en utilisant l'éditeur d'aperçus si vous ne voulez plus qu'ils soient utilisés.</p>
                </div>
                `,
                images: [
                    {
                        src: "insights_feature.png",
                        alt: "Commutateur de Fonctionnalité Aperçus",
                        caption: "Le commutateur Aperçus dans l'onglet Paramètres de l'interface de chat"
                    },
                    {
                        src: "insights_editor.png",
                        alt: "Éditeur d'Aperçus",
                        caption: "L'interface de l'Éditeur d'Aperçus pour gérer les aperçus stockés"
                    },
                    {
                        src: "Insightslog.png",
                        alt: "Journaux de la Fonctionnalité Aperçus",
                        caption: "Les journaux des Aperçus dans la console du navigateur"
                    }
                ]
            },
            {
                id: "chat-advanced-features",
                title: "Fonctionnalités Avancées du Chat",
                content: `
                     <h4>Contrôle de la Taille du Contexte</h4>
                     <p>La taille du contexte détermine combien de votre conversation précédente l'IA peut "se rappeler" et utiliser lors de la génération de réponses :</p>
                     <ul>
                         <li><strong>Taille de Contexte Automatique</strong> - Lors de la sélection d'un modèle, le système définit automatiquement la taille de contexte optimale basée sur les capacités du modèle</li>
                         <li><strong>Optimisation Spécifique au Modèle</strong> - La fenêtre de contexte native de chaque modèle est détectée et appliquée</li>
                         <li><strong>Conservation des Ressources</strong> - Initialement limitée à 8K pour éviter une utilisation excessive des ressources, mais peut être augmentée manuellement</li>
                         <li><strong>Ajustement Manuel</strong> - Sélectionnez la taille de contexte désirée dans le menu déroulant (de 1K à 10M tokens) pour remplacer le paramètre automatique</li>
                         <li><strong>Paramètres Persistants</strong> - Votre préférence de taille de contexte est mémorisée à travers les sessions pour chaque modèle</li>
                     </ul>
                     
                     <h5>Comment la Taille du Contexte Affecte l'Utilisation de la Mémoire</h5>
                     <p>La taille du contexte a un impact direct sur les exigences RAM et VRAM (mémoire de carte graphique) :</p>
                     <ul>
                         <li><strong>Calcul de mémoire</strong> - Pour chaque token dans votre fenêtre de contexte, le modèle doit allouer de la mémoire pour les calculs d'attention</li>
                         <li><strong>Relation d'échelle</strong> - L'utilisation de la mémoire évolue quadratiquement avec la taille du contexte, pas linéairement (doubler la taille du contexte peut quadrupler les exigences de mémoire)</li>
                         <li><strong>Facteurs combinés</strong> - L'utilisation totale de la mémoire dépend à la fois de la taille du modèle (paramètres) et de la longueur du contexte</li>
                     </ul>
                     
                     <h5>Directives de Taille de Contexte Manuel</h5>
                     <p>Comme directive générale pour les exigences de mémoire :</p>
                     <ul>
                         <li><strong>Contexte 4K</strong> - Nécessite environ 1GB de VRAM/RAM</li>
                         <li><strong>Contexte 8K</strong> - Nécessite environ 2GB de VRAM/RAM</li>
                         <li><strong>Contexte 16K</strong> - Nécessite environ 4GB de VRAM/RAM</li>
                         <li><strong>Contexte 32K</strong> - Nécessite environ 8GB de VRAM/RAM</li>
                         <li><strong>Contexte 64K</strong> - Nécessite environ 16GB de VRAM/RAM</li>
                         <li><strong>Contexte 128K+</strong> - Nécessite 32GB+ VRAM/RAM pour les systèmes haut de gamme</li>
                     </ul>
                     
                     <p>Lorsque vous augmentez la taille du contexte, surveillez ces signes de pression mémoire :</p>
                     <ul>
                         <li>La réponse du modèle est incohérente ou le modèle déverse le prompt système dans la réponse (abaissez d'abord le contexte à un petit paramètre pour vérifier que la réponse est correcte, puis augmentez avec prudence)</li>
                         <li>Génération de réponse plus lente</li>
                         <li>Système moins réactif</li>
                         <li>Erreurs Ollama liées aux conditions de manque de mémoire</li>
                         <li>Indicateur de pourcentage de contexte devenant orange ou rouge</li>
                     </ul>
                     
                     <div class="note">
                         <p><strong>Conseil :</strong>Si vous rencontrez des problèmes de mémoire, essayez toujours d'abord un paramètre conservateur.</p>
                     </div>
                     
                     <h4>Modèles de Pensée Native (Ollama 0.9.0+)</h4>
                     <p>Paiperwork prend en charge la fonctionnalité de pensée native d'Ollama pour les modèles de raisonnement compatibles, qui permet aux modèles d'IA de montrer leur processus de raisonnement étape par étape :</p>
                     
                     <h5>Exigences Système</h5>
                     <ul>
                         <li><strong>Version Ollama</strong> - Nécessite Ollama 0.9.0 ou supérieur pour le support de pensée native</li>
                         <li><strong>Modèles Compatibles</strong> - Fonctionne avec les modèles activés pour la pensée comme DeepSeek-R1 et les modèles de raisonnement qwen3 (plus à venir dans les versions futures)</li>
                         <li><strong>Détection Automatique</strong> - Paiperwork détecte automatiquement votre version Ollama et la compatibilité du modèle</li>
                     </ul>
                     
                     <h5>Bouton de Basculement de Pensée</h5>
                     <p>Lorsque vous sélectionnez un modèle de pensée compatible avec Ollama 0.9.0+, un bouton de basculement de pensée apparaît automatiquement :</p>
                     <ul>
                         <li><strong>Apparition Automatique</strong> - Le bouton ne s'affiche que lorsque la version Ollama et le modèle supportent la pensée</li>
                         <li><strong>Contrôle de Basculement</strong> - Cliquez pour activer ou désactiver l'affichage du processus de pensée du modèle</li>
                         <li><strong>Indicateur Visuel</strong> - Le bouton montre un état actif lorsque la pensée est activée</li>
                         <li><strong>Paramètre Persistant</strong> - Votre préférence de pensée est mémorisée à travers les sessions</li>
                     </ul>
                     
                     <h5>Comment Fonctionne la Pensée Native</h5>
                     <ul>
                         <li><strong>Affichage de la Pensée</strong> - Lorsqu'activé, vous verrez le processus de raisonnement interne du modèle dans une section de pensée séparée</li>
                         <li><strong>Traitement en Temps Réel</strong> - Regardez l'IA travailler à travers les problèmes étape par étape pendant qu'elle génère des réponses</li>
                         <li><strong>Sections Repliables</strong> - Le contenu de pensée peut être replié pour se concentrer sur la réponse finale</li>
                         <li><strong>Impact sur la Performance</strong> - Le mode pensée prend généralement plus de temps car le modèle traite plus minutieusement</li>
                     </ul>
                     
                     <h5>Modèles de Pensée Non-Ollama</h5>
                     <p>Paiperwork prend également en charge les modèles de raisonnement qui ont des capacités de pensée intégrées mais n'utilisent pas l'API de pensée native d'Ollama :</p>
                     <ul>
                         <li><strong>Pas de Bouton de Basculement</strong> - Ces modèles n'afficheront pas le basculement de pensée car ils gèrent le raisonnement en interne, mais afficheront le conteneur de pensée</li>
                         <li><strong>Raisonnement Intégré</strong> - Les modèles comme Reflection peuvent montrer le raisonnement dans le cadre de leur réponse normale</li>
                         <li><strong>Modification du prompt système</strong> - Les modèles comme Cogito nécessitent une commande spéciale dans le prompt système : Activer la sous-routine de pensée profonde, d'autres peuvent avoir besoin de cette commande (/think, /no_think) dans le prompt système ou le prompt utilisateur</li>
                     </ul>
                     
                     <h5>Utiliser les Modèles de Pensée Efficacement</h5>
                     <ul>
                         <li><strong>Problèmes Complexes</strong> - Mieux adapté pour le raisonnement multi-étapes, les problèmes mathématiques ou l'analyse complexe</li>
                         <li><strong>Débogage de Code</strong> - Excellent pour comprendre comment l'IA aborde les problèmes de code</li>
                         <li><strong>Outil d'Apprentissage</strong> - Regardez comment l'IA décompose les sujets complexes à des fins éducatives</li>
                         <li><strong>Qualité vs Vitesse</strong> - Activez la pensée pour des réponses de meilleure qualité ; désactivez pour des réponses plus rapides et directes</li>
                     </ul>
                     
                     <div class="note">
                         <p><strong>Important :</strong>Si vous ne voyez pas le bouton de basculement de pensée, vérifiez que vous utilisez Ollama 0.9.0 ou supérieur et avez sélectionné un modèle de pensée compatible. Certains modèles de raisonnement plus anciens peuvent ne pas supporter l'API de pensée native mais peuvent encore fournir un raisonnement dans le cadre de leur génération de réponse normale.</p>
                     </div>
                     
                     <h4>Téléchargement d'Images (Modèles Visuels)</h4>
                     <p>Lors de l'utilisation de modèles d'IA visuels comme Mistral small 3.1 ou Gemma3, vous pouvez télécharger des images pour discuter :</p>
                     <ul>
                         <li>Cliquez sur le bouton image à côté du champ de saisie</li>
                         <li>Sélectionnez une image de votre appareil ou glissez-déposez dans la zone de téléchargement</li>
                         <li>Pour les modèles Gemma3, vous pouvez télécharger plusieurs images à la fois (3 max)</li>
                         <li>Faites des transcriptions (OCR), posez des questions ou obtenez des descriptions basées sur les images téléchargées</li>
                     </ul>
                     
                     <h4>Intégration de Recherche Web</h4>
                     <p>Activez la recherche web en temps réel pour aider l'IA à fournir des informations à jour :</p>
                     <ul>
                         <li>Cliquez sur le bouton Web pour basculer la capacité de recherche web</li>
                         <li>Lorsqu'activée, l'IA peut rechercher sur internet des informations actuelles</li>
                         <li>Ceci est particulièrement utile pour les questions sur les événements récents ou les faits spécifiques</li>
                         <li>La recherche web n'envoie que le prompt de recherche au web (Bing.com) pour les requêtes, aucune donnée personnelle, statistique ou métrique n'est jamais envoyée</li>
                     </ul>
                     
                     <h4>Image + Recherche Web (Fonctionnalité Avancée)</h4>
                     <p>Combinez l'analyse d'image avec la recherche web pour des capacités puissantes de recherche visuelle :</p>
                     <h5>Comment Ça Fonctionne</h5>
                     <ol>
                         <li><strong>Télécharger une Image</strong> - Ajoutez une image en utilisant le bouton de téléchargement d'image</li>
                         <li><strong>Activer la Recherche Web</strong> - Assurez-vous que le bouton Web est activé (Orange)</li>
                         <li><strong>Posez Votre Question</strong> - Décrivez ce que vous voulez trouver à propos ou similaire à votre image</li>
                         <li><strong>Analyse IA</strong> - L'IA analyse d'abord votre image pour générer des termes de recherche</li>
                         <li><strong>Recherche Web</strong> - Le système recherche sur le web en utilisant des mots-clés générés par l'IA</li>
                         <li><strong>Réponse Combinée</strong> - Vous recevez à la fois l'analyse visuelle et les résultats de recherche web</li>
                     </ol>
                     
                     <h5>Parfait pour :</h5>
                     <ul>
                         <li>Trouver des images ou produits similaires en ligne</li>
                         <li>Rechercher des styles architecturaux, œuvres d'art ou designs</li>
                         <li>Identifier des plantes, animaux ou objets avec du contexte supplémentaire</li>
                         <li>Obtenir des informations de marché sur les produits que vous photographiez</li>
                         <li>Trouver le contexte historique ou culturel pour les images</li>
                         <li>Recherche d'image inversée avec amélioration IA</li>
                     </ul>
                     
                     <h5>Exigences :</h5>
                     <ul>
                         <li>Modèle d'IA visuel sélectionné (Qwen2.5vl, Mistral-small3.1, Gemma3, LLaVA, etc.)</li>
                         <li>Recherche web activée (bouton Web actif)</li>
                         <li>Image claire et de haute qualité téléchargée (taille : 5mb max)</li>
                         <li>Connexion internet pour la fonctionnalité de recherche web</li>
                     </ul>
                     
                     <h5>Exemple d'Utilisation :</h5>
                     <p class="example-prompt"><strong>Prompt d'Exemple :</strong>"Trouve des images et informations sur des meubles similaires à cette chaise. Je cherche des pièces modernes du milieu du siècle avec des éléments de design similaires et je veux connaître les prix et où les acheter."</p>
                     <p>Cela donnerait :</p>
                     <ol>
                         <li>IA analysant le style, les matériaux et les caractéristiques de design de la chaise</li>
                         <li>Recherche web pour "chaise moderne milieu siècle pieds bois siège rembourré design mobilier"</li>
                         <li>Réponse combinée avec analyse visuelle + produits similaires + prix + détaillants</li>
                     </ol>
                     
                     <div class="note">
                         <p><strong>Conseil Pro :</strong>Soyez spécifique sur ce que vous voulez trouver. Au lieu de simplement "trouver des images similaires", essayez "trouver des affiches vintage similaires des années 1950 avec informations de prix" ou "identifier cette espèce de plante et trouver des instructions de soins."</p>
                     </div>
                     
                    <h4>Exporter les Conversations</h4>
                     <p>Vous pouvez exporter tout votre historique de conversation dans différents formats :</p>
                     <ul>
                         <li>Naviguez vers l'onglet Chat et faites défiler jusqu'en bas de l'interface</li>
                         <li>Cliquez sur le bouton "Exporter Conversation" situé juste au-dessus du bouton "Effacer Session Actuelle"</li>
                         <li>Choisissez parmi les formats texte brut (.txt), markdown (.md) ou HTML (.html)</li>
                         <li>Les fichiers téléchargés incluent tous les messages et préservent le formatage du code</li>
                     </ul>
                 `,
                images: [
                    {
                        src: "chat_export.png",
                        alt: "Export de chat",
                        caption: "Fonctionnalités d'export de chat"
                    },
                    {
                        src: "thinking_toggle_button.png",
                        alt: "Basculement de Pensée Native",
                        caption: "Le bouton de basculement de pensée qui apparaît avec des modèles compatibles et Ollama 0.9.0+"
                    }
                ]
            },
            {
                id: "chat-code-blocks",
                title: "Travailler avec les Blocs de Code",
                content: `
                <p>Paiperwork fournit un support amélioré pour les blocs de code dans les conversations :</p>
                
                <h4>Fonctionnalités des Blocs de Code</h4>
                <ul>
                    <li><strong>Coloration Syntaxique</strong> - Le code est coloré selon le langage de programmation</li>
                    <li><strong>Détection de Langage</strong> - L'IA identifie et étiquette automatiquement le langage de code</li>
                    <li><strong>Bouton Copier</strong> - Copie en un clic des blocs de code vers le presse-papiers</li>
                    <li><strong>Numéros de Ligne</strong> - Pour une référence plus facile dans les extraits plus longs</li>
                </ul>
                
                <h4>Exécution de Code</h4>
                <p>Pour les langages supportés, vous pouvez exécuter le code directement depuis l'interface de chat :</p>
                <ul>
                    <li><strong>Aperçu HTML</strong> - Rend le code HTML pour voir le résultat immédiatement. Astuce : Demandez à l'IA d'inclure tout code CSS ou JavaScript à l'intérieur du HTML pour éviter les erreurs, car le code HTML sera isolé dans une fenêtre flottante sans accès à d'autres fichiers de configuration ou de code</li>
                </ul>
                
                <div class="note">
                    <p><strong>Note de Sécurité :</strong> L'exécution de code se fait dans des bacs à sable isolés pour assurer la sécurité.</p>
                </div>
            `,

                images: [
                    {
                        src: "code_blocks.png",
                        alt: "Fonctionnalités des Blocs de Code",
                        caption:
                            "Bloc de code HTML avec coloration syntaxique et options d'exécution",
                    },
                    {
                        src: "HTML-sandboxed.png",
                        alt: "Code HTML s'exécutant en bac à sable",
                        caption: "Code HTML s'exécutant dans une fenêtre flottante isolée."
                    }
                ]
            },
            {
                id: "chat-scroll-behavior",
                title: "Défilement et Navigation",
                content: `
                <p>L'interface de chat inclut un comportement de défilement intelligent pour améliorer l'utilisabilité pendant les conversations :</p>
                
                <h4>Défilement Automatique</h4>
                <ul>
                    <li>Les nouveaux messages défilent automatiquement dans la vue</li>
                    <li>Pendant la génération de réponse de l'IA, la vue suit le message pendant qu'il grandit</li>
                    <li>Le défilement automatique se désactive temporairement quand vous défilez manuellement vers le haut pour lire les messages précédents</li>
                    <li>Le défilement automatique se réactive après une période d'inactivité (environ 5 secondes)</li>
                    <li>Le défilement automatique se réactive immédiatement si vous défilez complètement vers le bas</li>
                </ul>
                
                <h4>Conversations Longues</h4>
                <p>Pour naviguer dans les conversations longues :</p>
                <ul>
                    <li>Défilez librement pour revoir les messages antérieurs</li>
                    <li>La barre de navigation collante reste accessible en haut</li>
                    <li>Les changements à l'invite système ou à la taille de contexte ajouteront un bouton "Continuer la Conversation" pour aider à maintenir le contexte, notez aussi que si vous manquez de contexte, le bouton continuer apparaîtra (Le bouton continuer calculera toujours combien de messages passés récapituler basé sur votre taille de contexte actuelle et utilisera 25% de celle-ci pour éviter que les messages passés débordent votre contexte)</li>
                </ul>
            `,
            },
            {
                id: "chat-conversation-sessions",
                title: "Gestion des Sessions de Conversation",
                content: `
                <p>Paiperwork organise vos conversations en groupes de sessions qui vous aident à garder une trace de différents fils de discussion dans le même sujet.</p>
                
                <h4>Liste des Sessions de Conversation</h4>
                <p>La barre latérale gauche dans la vue chat affiche vos sessions de conversation :</p>
                <ul>
                    <li>Chaque session montre un aperçu du premier message</li>
                    <li>Les sessions affichent la date et l'heure où elles ont été créées</li>
                    <li>Les sessions sont séparées par des lignes de division subtiles pour une distinction facile</li>
                    <li>Les sessions les plus récentes apparaissent en haut</li>
                </ul>
                
                <h4>Travailler avec les Sessions</h4>
                <ul>
                    <li><strong>Charger une session</strong> - Cliquez sur n'importe quelle session pour charger la conversation</li>
                    <li><strong>Supprimer une session</strong> - Survolez une session et cliquez sur le bouton "×" qui apparaît</li>
                    <li><strong>Session active</strong> - La session actuellement chargée est mise en évidence</li>
                </ul>
                
                <h4>Commencer une Nouvelle Conversation</h4>
                <p>Pour commencer une conversation fraîche sans changer votre sujet :</p>
                <ol>
                    <li>Cliquez sur le bouton "Nouveau Chat" en haut de la liste des sessions</li>
                    <li>Ceci efface la conversation actuelle et remet à zéro le contexte</li>
                    <li>Un message de bienvenue apparaît indiquant que vous avez commencé une nouvelle conversation</li>
                    <li>Toutes les sessions précédentes restent accessibles dans la barre latérale</li>
                </ol>
                
                <h4>Continuer les Conversations</h4>
                <p>Quand vous sélectionnez une session précédente :</p>
                <ul>
                    <li>L'historique complet de conversation est chargé</li>
                    <li>Un bouton "Continuer la Conversation" apparaît en bas</li>
                    <li>Cliquez sur ce bouton pour reprendre la conversation avec le contexte complet</li>
                    <li>Le champ de saisie reste désactivé jusqu'à ce que vous cliquiez sur continuer, prévenant les messages accidentels</li>
                </ul>
                
                <div class="note">
                    <p><strong>Note :</strong> Supprimer une session est permanent et ne peut pas être annulé. Quand vous supprimez un groupe de conversation, seul ce fil spécifique est supprimé - toutes les autres sessions dans la même Clé Maître restent intactes.</p>
                </div>
            `,
                image: "conversations-list.png",
                imageAlt: "Interface des Sessions de Conversation",
                imageCaption: "La liste des sessions montrant plusieurs fils de conversation avec texte d'aperçu et horodatages",
            },
        ],
    },
    documents: {
        title: "Documents",
        intro: "L'onglet Documents vous permet de télécharger, gérer et interagir avec vos documents en utilisant l'assistance IA.",
        articles: [
            {
                id: "docs-intro",
                title: "Introduction aux Documents",
                content: `
                <p>L'onglet Documents vous permet de travailler avec vos documents texte et PDF, en tirant parti de l'IA pour vous aider à comprendre et extraire des informations.</p>
                
                <p>Avec la fonctionnalité Documents, vous pouvez :</p>
                <ul>
                    <li>Télécharger des fichiers PDF et texte</li>
                    <li>Poser des questions sur des documents spécifiques</li>
                    <li>Générer des résumés complets</li>
                    <li>Rechercher dans votre collection de documents</li>
                    <li>Gérer votre bibliothèque de documents</li>
                </ul>
                
                <div class="note">
                    <p><strong>Note :</strong> Les documents sont chiffrés de manière sécurisée en utilisant votre Clé Maîtresse et stockés localement sur votre appareil, garantissant que vos informations sensibles restent privées.</p>
                </div>
            `,
                image: "documents_intro.png",
                imageAlt: "Aperçu de l'Onglet Documents",
                imageCaption: "Interface de l'onglet Documents montrant la zone de téléchargement et la liste des documents",
            },
            {
                id: "docs-model-compatibility",
                title: "Compatibilité des Modèles pour les Documents",
                content: `
                <p>La fonctionnalité Documents nécessite des modèles IA qui supportent les embeddings pour fonctionner correctement. Comprendre la compatibilité des modèles vous aidera à éviter les problèmes et optimiser votre flux de travail documentaire.</p>
                
                <h4>Modèles et Support d'Embeddings</h4>
                <p>Pour que les fonctionnalités de traitement et recherche de documents fonctionnent, vous avez besoin de modèles qui supportent la génération d'embeddings :</p>
                <ul>
                  <li><strong>Modèles compatibles</strong> incluent : nomic-embed-text, llama3 (diverses tailles), mistral, mixtral, et autres modèles spécifiquement conçus pour supporter les embeddings (Deepseek, Qwen, etc)</li>
                  <li><strong>Modèles incompatibles</strong> : Certains modèles ne supportent pas les embeddings et déclencheront une notification d'avertissement si vous tentez de les utiliser avec la fonctionnalité Documents</li>
                  <li><strong>Modèles visuels</strong> : Les modèles visuels ont parfois le traitement des embeddings retiré de leur code</li>
                </ul>
                
                <h4>Système d'Avertissement d'Embeddings</h4>
                <p>Lorsque vous essayez d'utiliser un modèle qui ne supporte pas les embeddings pour les opérations de documents, le système va :</p>
                <ul>
                  <li>Afficher une notification d'avertissement proéminente</li>
                  <li>Expliquer que le modèle sélectionné est incompatible avec la fonctionnalité de recherche de documents</li>
                  <li>Suggérer des modèles alternatifs qui supportent les embeddings</li>
                  <li>Fournir un lien pour trouver des modèles capables d'embeddings</li>
                </ul>
                <p>La notification d'avertissement se fermera automatiquement après 30 secondes ou vous pouvez la fermer manuellement en cliquant sur le bouton "Je Comprends".</p>
                
                <h4>Optimisation du Flux de Travail</h4>
                <p>Vous pouvez optimiser votre flux de travail documentaire en comprenant quand les embeddings sont créés et utilisés :</p>
                <ul>
                  <li><strong>Traitement initial des documents</strong> : Les embeddings sont créés lors du premier téléchargement et traitement des documents</li>
                  <li><strong>Requêtes de documents ultérieures</strong> : Après le traitement des documents, vous pouvez passer à un modèle différent (avec support d'embeddings) pour les requêtes sans avoir besoin de régénérer les embeddings</li>
                </ul>
                
                <h4>Utilisation de Différents Modèles pour Différentes Tâches</h4>
                <p>Une stratégie de flux de travail utile :</p>
                <ol>
                  <li>Sélectionnez un modèle plus petit capable d'embeddings (comme nomic-embed-text) lors du téléchargement et traitement des documents</li>
                  <li>Après le traitement des documents, vous pouvez passer à un modèle plus puissant (avec support d'embeddings) pour de meilleures réponses aux questions</li>
                  <li>Le système utilisera les embeddings stockés du traitement original quel que soit le modèle actuellement sélectionné</li>
                </ol>
                
                <div class="note">
                  <p><strong>Conseil Pro :</strong> Pour des résultats optimaux, utilisez des modèles d'embeddings dédiés comme nomic-embed-text pour le traitement initial des documents, puis passez à des modèles de langage plus grands comme llama3:70b, Gemma3, Qwen3, etc., pour des requêtes et analyses de documents plus sophistiquées.</p>
                </div>
              `,
                image: "model-embedding-warning.png",
                imageAlt: "Avertissement d'Embedding de Modèle",
                imageCaption: "Notification d'avertissement lors de la tentative d'utilisation d'un modèle qui ne supporte pas les embeddings"
            },
            {
                id: "docs-uploading",
                title: "Téléchargement de Documents",
                content: `
                <p>Vous pouvez facilement ajouter des documents à votre bibliothèque via l'interface de téléchargement.</p>
                
                <h4>Comment Télécharger des Documents</h4>
                <ol>
                    <li>Naviguez vers l'onglet Documents</li>
                    <li>Glissez-déposez des fichiers PDF ou texte sur la zone de téléchargement, ou cliquez sur la zone de téléchargement pour parcourir les fichiers</li>
                    <li>Sélectionnez un ou plusieurs fichiers de votre appareil</li>
                    <li>Attendez que le traitement soit terminé</li>
                </ol>
                
                <h4>Traitement de Vos Documents</h4>
                <p>Lorsque vous téléchargez des documents, le système :</p>
                <ul>
                    <li>Vérifie les fichiers PDF pour le contenu textuel extractible</li>
                    <li>Divise le contenu en blocs gérables</li>
                    <li>Crée des représentations compatibles IA (embeddings) du contenu</li>
                    <li>Chiffre et stocke tout de manière sécurisée localement</li>
                    <li>Rend le document disponible pour les questions et recherches</li>
                </ul>
                
                <h4>Détection de Texte PDF</h4>
                <p>Paiperwork vérifie automatiquement les fichiers PDF pour s'assurer qu'ils contiennent du texte extractible :</p>
                <ul>
                    <li>Chaque PDF est analysé pour détecter le contenu textuel avant le début du traitement</li>
                    <li>Si un PDF ne contient pas de texte extractible (comme des images scannées sans OCR), vous recevrez une notification d'avertissement</li>
                    <li>Les PDF sans texte ne peuvent pas être traités pour le RAG car ils nécessitent du contenu textuel pour les embeddings et la recherche</li>
                    <li>Pour les PDF d'images uniquement, considérez utiliser un modèle IA visuel pour l'extraction de texte ou un outil OCR pour convertir les images en texte avant téléchargement</li>
                </ul>
                
                <div class="note">
                    <p><strong>Important :</strong> Utilisez le sélecteur de <strong>modèle d'embedding</strong> dans l'onglet Documents lors du téléchargement et du traitement des fichiers. Ce sélecteur affiche les modèles compatibles avec les embeddings et sélectionne automatiquement le premier disponible.</p>
                    <p>Si aucun modèle d'embedding n'est disponible, une fenêtre d'information s'affiche avec des exemples de modèles et un bouton <strong>Télécharger un modèle</strong> qui ouvre l'onglet Modèles.</p>
                    <p><strong>Note :</strong> La recherche globale de documents utilise le modèle sélectionné dans le sélecteur de modèle de l'onglet Chat.</p>
                </div>
            `,
                image: "documents-upload.png",
                imageAlt: "Processus de Téléchargement de Documents",
                imageCaption: "Zone de téléchargement avec indicateur de progression pour le traitement des documents",
            },
            {
                id: "docs-management",
                title: "Gestion de Vos Documents",
                content: `
                <p>Après téléchargement, vos documents apparaissent dans la liste des documents où vous pouvez les gérer.</p>
                
                <h4>Informations sur les Documents</h4>
                <p>Chaque entrée de document affiche :</p>
                <ul>
                    <li>Titre/nom de fichier du document</li>
                    <li>Informations sur l'auteur (si disponibles)</li>
                    <li>Date d'ajout à votre bibliothèque</li>
                    <li>Nombre de pages (pour les fichiers PDF)</li>
                    <li>Nombre de blocs de texte créés</li>
                    <li>Statut de traitement (En cours ou Indexé)</li>
                </ul>
                
                <h4>Actions sur les Documents</h4>
                <p>Vous pouvez effectuer plusieurs actions avec vos documents :</p>
                <ul>
                    <li><strong>Sélectionner/Désélectionner</strong> - Cliquez sur un document pour le sélectionner et accéder à d'autres options</li>
                    <li><strong>Supprimer</strong> - Retirer un document de votre bibliothèque</li>
                    <li><strong>Générer un Résumé</strong> - Créer un résumé complet du contenu du document</li>
                    <li><strong>Poser des Questions</strong> - Entrer en Mode Document pour poser des questions spécifiques sur le document</li>
                </ul>
            `,
                image: "documents_management.png",
                imageAlt: "Interface de Gestion des Documents",
                imageCaption: "Interface de gestion des documents montrant les entrées de documents et les boutons d'action",
            },
            {
                id: "docs-summaries",
                title: "Résumés de Documents",
                content: `
                <p>La fonctionnalité de résumé crée un aperçu complet du contenu de votre document, vous aidant à comprendre rapidement ses points clés.</p>
                
                <h4>Génération d'un Résumé</h4>
                <ol>
                    <li>Sélectionnez un document de votre bibliothèque (cliquez dessus)</li>
                    <li>Cliquez sur le bouton "Générer un Résumé" qui apparaît</li>
                    <li>Attendez pendant que l'IA lit et analyse votre document</li>
                    <li>Examinez le résumé généré dans la fenêtre modale</li>
                </ol>
                
                <h4>Fonctionnalités du Résumé</h4>
                <ul>
                    <li><strong>Suivi de Progression</strong> - Regardez la barre de progression pendant que l'IA travaille sur votre document</li>
                    <li><strong>Affichage Incrémental</strong> - Voyez le résumé se construire en temps réel pour les documents plus longs</li>
                    <li><strong>Bouton Copier</strong> - Copiez l'ensemble du résumé dans votre presse-papiers en un clic</li>
                    <li><strong>Option d'Annulation</strong> - Arrêtez la génération du résumé si nécessaire</li>
                </ul>
                
                <h4>Exigences de Taille de Contexte</h4>
                <p>Plus le résumé du document est grand, plus vous avez besoin de contexte dans votre modèle IA. Comme directive générale :</p>
                <ul>
                    <li><strong>Petits documents</strong> (moins de 5 000 mots) - 4K de taille de contexte est généralement suffisant</li>
                    <li><strong>Documents moyens</strong> (5 000-15 000 mots) - 8K de taille de contexte recommandé</li>
                    <li><strong>Grands documents</strong> (15 000-50 000 mots) - 16K de taille de contexte ou plus</li>
                    <li><strong>Très grands documents</strong> (50 000+ mots) - 32K de taille de contexte ou plus</li>
                </ul>
                <p>Pour référence, une page typique à interligne simple contient environ 500 mots, donc un PDF de 20 pages aurait besoin d'au moins 8K de contexte pour une résumé efficace.</p>
                
                <div class="note">
                    <p><strong>Conseil :</strong> Pour les grands documents, le système les traite par petits lots puis crée un résumé global, assurant une couverture complète même pour le contenu long.</p>
                </div>
            `,
                image: "document_summary.png",
                imageAlt: "Modal de Résumé de Document",
                imageCaption: "Modal de résumé montrant l'aperçu du document généré avec option de copie",
            },
            {
                id: "docs-questioning",
                title: "Poser des Questions sur les Documents",
                content: `
                <p>Le Mode Document vous permet d'avoir une conversation avec l'IA spécifiquement sur un seul document.</p>
                
                <h4>Entrer en Mode Document</h4>
                <ol>
                    <li>Sélectionnez un document de votre bibliothèque</li>
                    <li>Cliquez sur le bouton "Poser des Questions"</li>
                    <li>Le système vous redirigera vers l'onglet Chat avec le Mode Document activé</li>
                    <li>Un indicateur spécial apparaîtra montrant que vous êtes en Mode Document</li>
                </ol>
                
                <h4>Utilisation du Mode Document</h4>
                <ul>
                    <li>Posez des questions spécifiques sur le contenu du document</li>
                    <li>Demandez des explications de concepts mentionnés dans le document</li>
                    <li>Demandez des comparaisons entre différentes sections</li>
                    <li>Demandez des informations factuelles contenues dans le document</li>
                </ul>
                
                <h4>Sortir du Mode Document</h4>
                <p>Lorsque vous avez fini de travailler avec un document spécifique :</p>
                <ul>
                    <li>Cliquez sur le bouton "Sortir du Mode Document" sur la barre d'indicateur</li>
                    <li>Vous reviendrez au mode de chat normal où vous pouvez discuter de sujets généraux</li>
                </ul>
                
                <div class="note">
                    <p><strong>Important :</strong> En Mode Document, l'IA se concentre exclusivement sur le contenu du document sélectionné, utilisant ses connaissances pour aider à interpréter mais sans ajouter d'informations externes.</p>
                </div>

                <div class="note">
                    <p><strong>Note sur les modèles cloud :</strong> Avec des modèles cloud en offre gratuite, les réponses en mode "Poser des questions" peuvent être limitées ou tronquées car les prompts RAG sont volumineux. Si vous avez besoin de réponses longues et complètes de façon fiable, utilisez une offre cloud payante.</p>
                </div>
            `,
                image: "document_mode.png",
                imageAlt: "Interface du Mode Document",
                imageCaption: "Interface de chat montrant l'indicateur du Mode Document lors de questions sur un document spécifique",
            },
            {
                id: "docs-searching",
                title: "Recherche dans les Documents",
                content: `
                <p>Paiperwork facilite la recherche d'informations dans tous vos documents téléchargés directement depuis l'interface de chat.</p>
                
                <h4>Recherche Globale de Documents</h4>
                <p>Lorsque vous êtes dans l'onglet Documents, toute question que vous posez via l'interface de Chat recherchera automatiquement dans tous vos documents :</p>
                <ol>
                    <li>Passez d'abord à l'onglet Documents pour activer la fonctionnalité de recherche de documents</li>
                    <li>Tapez votre requête de recherche ou question dans le champ de saisie du chat</li>
                    <li>L'IA recherchera automatiquement dans tous vos documents pour des informations pertinentes</li>
                    <li>Les résultats de plusieurs documents seront combinés en une réponse complète</li>
                </ol>
                
                <h4>Résultats de Recherche</h4>
                <p>Lors de l'utilisation de la recherche de documents, l'IA va :</p>
                <ul>
                    <li>Afficher un indicateur "Recherche de documents..." pendant la collecte d'informations</li>
                    <li>Trouver les passages les plus pertinents dans tous vos documents</li>
                    <li>Prioriser les résultats de documents divers pour fournir une couverture complète</li>
                    <li>Utiliser la recherche sémantique pour comprendre le sens de votre requête, pas seulement correspondre aux mots-clés</li>
                    <li>Générer une réponse qui synthétise les informations de tous les documents pertinents</li>
                    <li>Inclure des citations aux documents sources quand approprié</li>
                </ul>
                
                <h4>Recherche Sémantique vs Mots-clés</h4>
                <p>Paiperwork utilise la technologie de recherche sémantique qui comprend le sens derrière vos questions :</p>
                <ul>
                    <li>Vous pouvez poser des questions en langage naturel plutôt qu'utiliser des mots-clés spécifiques</li>
                    <li>Le système trouvera des informations conceptuellement liées même quand les termes exacts diffèrent</li>
                    <li>La recherche est contextuelle et comprend les synonymes et concepts liés</li>
                    <li>Les résultats sont classés par pertinence à votre question spécifique</li>
                </ul>
                
                <div class="note">
                    <p><strong>Conseil :</strong> Pour de meilleurs résultats, posez des questions spécifiques sur les informations que vous recherchez plutôt qu'utiliser des termes de recherche génériques. Par exemple, demandez "Quels sont les chiffres de ventes trimestrielles pour 2024 ?" au lieu de simplement "données de ventes".</p>
                </div>
            `,
            },
            {
                id: "docs-memory-limits",
                title: "Limitations de Mémoire et Meilleures Pratiques",
                content: `
                <p>Lors du travail avec des documents dans Paiperwork, il est important de comprendre comment l'utilisation de la mémoire affecte les performances, surtout lors de l'utilisation de la recherche globale de documents.</p>
                
                <h4>Considérations de Mémoire avec la Recherche Globale</h4>
                <p>La recherche globale de documents (recherche simultanée dans tous les documents) peut être intensive en mémoire car :</p>
                <ul>
                    <li>Tous les blocs de documents pertinents doivent être chargés en mémoire à la fois</li>
                    <li>Le modèle IA doit traiter ces blocs avec votre requête</li>
                    <li>Les navigateurs web ont une allocation de mémoire limitée comparée aux applications de bureau</li>
                    <li>Comme le nombre et la taille des documents augmentent, les exigences de mémoire croissent exponentiellement</li>
                </ul>
                
                <h4>Signes de Pression Mémoire</h4>
                <p>Surveillez ces indicateurs que vous approchez des limites de mémoire :</p>
                <ul>
                    <li>Le navigateur devient lent ou ne répond plus</li>
                    <li>Longs délais lors du changement d'onglets</li>
                    <li>Messages d'erreur sur "mémoire insuffisante" ou avertissements similaires</li>
                    <li>Crash ou gel d'onglets du navigateur</li>
                    <li>Réponses IA terminées de manière inattendue</li>
                </ul>
                
                <h4>Meilleures Pratiques pour la Gestion des Documents</h4>
                <p>Pour éviter les problèmes de mémoire lors du travail avec les documents :</p>
                <ul>
                    <li><strong>Utilisez le Mode Spécifique au Document</strong> - Lors du travail avec de grands documents, sélectionnez un document spécifique et utilisez "Poser des Questions" pour entrer en mode document au lieu de la recherche globale</li>
                    <li><strong>Limitez l'Utilisation de la Recherche Globale</strong> - Réservez la recherche globale pour les scénarios avec de petites collections de documents ou quand vous avez spécifiquement besoin de trouver des informations dans plusieurs documents</li>
                    <li><strong>Organisez les Documents Stratégiquement</strong> - Groupez les documents liés pour pouvoir travailler avec des sous-ensembles ciblés plutôt que votre bibliothèque entière</li>
                    <li><strong>Fermez les Autres Applications</strong> - Lors du travail avec de grands documents, fermez les autres applications intensives en mémoire et onglets de navigateur</li>
                    <li><strong>Redémarrez Occasionnellement</strong> - Pour les sessions de travail documentaire étendues, redémarrez votre navigateur périodiquement pour vider la mémoire</li>
                </ul>
                
                <h4>Recommandations de Taille de Documents</h4>
                <p>Comme directive générale pour la recherche globale :</p>
                <ul>
                    <li><strong>Utilisation sûre</strong> : 5-10 petits à moyens documents (moins de 20 pages chacun)</li>
                    <li><strong>Prudence nécessaire</strong> : 10-20 documents ou plusieurs documents plus grands (20-50 pages)</li>
                    <li><strong>Non recommandé</strong> : 20+ documents ou plusieurs grands documents (50+ pages)</li>
                </ul>
                
                <div class="note">
                    <p><strong>Important :</strong> La recherche globale de documents est conçue pour un accès pratique dans une collection modérée de documents. Pour la recherche intensive impliquant de grands documents ou des collections étendues, utilisez plutôt le mode de questionnement spécifique au document. Cela concentre les ressources mémoire sur un seul document à la fois, fournissant de meilleures performances et stabilité.</p>
                </div>
            `,
            }
        ],
    },
    dataviz: {
        title: "DataViz",
        intro:
            "L'onglet DataViz vous permet de créer des visualisations de données interactives en décrivant vos données à l'IA.",
        articles: [
            {
                id: "dataviz-intro",
                title: "Introduction à la visualisation de données",
                content: `
                <p>L'onglet DataViz vous permet de générer divers graphiques et diagrammes à partir de descriptions en langage naturel de vos données. Sélectionnez simplement un type de visualisation et décrivez vos données à l'IA.</p>
                
                <p>Avec DataViz, vous pouvez :</p>
                <ul>
                    <li>Créer des visualisations à partir de descriptions textuelles</li>
                    <li>Générer des graphiques sans formater manuellement les données</li>
                    <li>Choisir parmi plusieurs types de visualisation</li>
                    <li>Voir les résultats immédiatement dans une fenêtre interactive</li>
                    <li>Copier les visualisations générées pour les utiliser dans d'autres applications</li>
                </ul>
                
                <p>DataViz est parfait pour visualiser rapidement des concepts, comparer des points de données, ou explorer des tendances sans avoir besoin de feuilles de calcul ou d'outils spécialisés.</p>
            `,
                image: "dataviz_intro.png",
                imageAlt: "Aperçu de l'onglet DataViz",
                imageCaption:
                    "L'interface de l'onglet DataViz montrant les options de types de visualisation",
            },
            {
                id: "dataviz-types",
                title: "Types de visualisation disponibles",
                content: `
                <p>DataViz offre plusieurs options de visualisation pour s'adapter à différents types de données et besoins analytiques :</p>
                
                <h4>Graphiques circulaires</h4>
                <p>Idéaux pour montrer les proportions d'un ensemble ou comparer les parties d'un total. Parfaits pour :</p>
                <ul>
                    <li>Distribution des parts de marché</li>
                    <li>Allocation budgétaire</li>
                    <li>Répartition des réponses à un sondage</li>
                    <li>Toute donnée où les composants totalisent 100%</li>
                </ul>
                
                <h4>Graphiques en barres</h4>
                <p>Parfaits pour comparer des quantités entre différentes catégories. Utiles pour :</p>
                <ul>
                    <li>Comparaisons de ventes par région</li>
                    <li>Statistiques de population</li>
                    <li>Résultats de sondages à choix multiples</li>
                    <li>Métriques de performance sur différentes périodes</li>
                </ul>
                
                <h4>Graphiques linéaires</h4>
                <p>Idéaux pour montrer les tendances dans le temps ou les données continues. À utiliser pour :</p>
                <ul>
                    <li>Prix des actions dans le temps</li>
                    <li>Changements de température</li>
                    <li>Croissance des revenus</li>
                    <li>Toute donnée avec une progression claire</li>
                </ul>
                
                <h4>Nuages de points</h4>
                <p>Idéaux pour montrer les relations entre deux variables. Parfaits pour :</p>
                <ul>
                    <li>Analyse de corrélation</li>
                    <li>Modèles de distribution</li>
                    <li>Identification des valeurs aberrantes</li>
                    <li>Regroupement de points de données similaires</li>
                </ul>
                
                <h4>Graphiques en aires</h4>
                <p>Similaires aux graphiques linéaires mais avec des zones remplies sous les lignes. Utiles pour :</p>
                <ul>
                    <li>Montrer les changements de volume dans le temps</li>
                    <li>Comparer les totaux cumulatifs</li>
                    <li>Visualiser les relations partie-ensemble dans le temps</li>
                    <li>Souligner l'ampleur des changements</li>
                </ul>
                <h4>Graphiques radar</h4>
                <p>Affichent des données multivariées sous forme de graphique bidimensionnel avec trois variables quantitatives ou plus. Idéaux pour :</p>
                <ul>
                    <li>Comparaisons de performance sur plusieurs dimensions</li>
                    <li>Évaluations de compétences</li>
                    <li>Comparaisons de caractéristiques de produits</li>
                    <li>Toute donnée avec plusieurs attributs à comparer</li>
                </ul>
                
                <h4>Cartes de chaleur</h4>
                <p>Utilisent l'intensité de couleur pour représenter les valeurs dans un format matriciel. Parfaites pour :</p>
                <ul>
                    <li>Matrices de corrélation</li>
                    <li>Intensité de données géographiques</li>
                    <li>Modèles de clics sur un site web</li>
                    <li>Montrer des modèles dans des jeux de données complexes</li>
                </ul>
                
                <h4>Graphiques à bulles</h4>
                <p>Comme les nuages de points mais avec une dimension supplémentaire représentée par la taille des bulles. Utiles pour :</p>
                <ul>
                    <li>Comparer trois dimensions de données</li>
                    <li>Analyse de portefeuille</li>
                    <li>Visualisation de l'allocation des ressources</li>
                    <li>Comparaisons démographiques</li>
                </ul>
            `,
                image: "chart_types.png",
                imageAlt: "Types de graphiques",
                imageCaption: "Les différents types de visualisation disponibles dans DataViz",
            },
            {
                id: "dataviz-usage",
                title: "Création de visualisations",
                content: `
                <p>Créer des visualisations de données avec DataViz est simple :</p>
                
                <h4>Étape 1 : Sélectionner un type de visualisation</h4>
                <ol>
                    <li>Naviguez vers l'onglet DataViz</li>
                    <li>Parcourez les types de graphiques disponibles</li>
                    <li>Cliquez sur votre visualisation préférée (circulaire, barres, ligne, etc.)</li>
                </ol>
                
                <h4>Étape 2 : Décrire vos données</h4>
                <ol>
                    <li>Après avoir sélectionné un type de graphique, vous reviendrez à l'interface de chat</li>
                    <li>Notez que le champ de saisie affiche maintenant une invite spécialisée pour votre graphique sélectionné</li>
                    <li>Décrivez les données que vous voulez visualiser en langage naturel</li>
                    <li>Soyez aussi précis que possible concernant les catégories, valeurs et relations</li>
                </ol>
                
                <h4>Étape 3 : Générer et visualiser la visualisation</h4>
                <ol>
                    <li>L'IA traitera votre description et générera un graphique approprié</li>
                    <li>Une fenêtre flottante affichera la visualisation</li>
                    <li>Si le graphique ne correspond pas à vos attentes, vous pouvez le modifier en fournissant des instructions plus claires</li>
                </ol>
                
                <div class="note">
                    <p><strong>Conseil :</strong> Pour de meilleurs résultats, incluez des valeurs numériques spécifiques dans votre description. Par exemple, au lieu de dire "les ventes étaient plus élevées au T2", dites "les ventes étaient de 12 000 $ au T1 et 15 500 $ au T2."</p>
                </div>
            `,
                image: "dataviz_create.png",
                imageAlt: "Création d'une visualisation",
                imageCaption:
                    "Le processus de création d'une visualisation de données à partir d'une description textuelle",
            },
            {
                id: "dataviz-examples",
                title: "Exemples d'invites",
                content: `
                <p>Voici quelques exemples d'invites pour vous aider à démarrer avec différents types de visualisation :</p>
                
                <h4>Exemple de graphique circulaire</h4>
                <p class="example-prompt">"Créez un graphique circulaire montrant les parts de marché des navigateurs avec Chrome à 65%, Safari à 18%, Firefox à 8%, Edge à 5%, et Autres à 4%."</p>
                
                <h4>Exemple de graphique en barres</h4>
                <p class="example-prompt">"Générez un graphique en barres comparant les ventes mensuelles du T1 2024 : janvier 45 000 $, février 52 000 $, et mars 61 000 $."</p>
                
                <h4>Exemple de graphique linéaire</h4>
                <p class="example-prompt">"Montrez un graphique linéaire des températures moyennes à New York en 2023 : jan 0°C, fév 1°C, mar 6°C, avr 11°C, mai 17°C, juin 22°C, juil 26°C, aoû 25°C, sep 21°C, oct 14°C, nov 8°C, déc 3°C."</p>
                
                <h4>Exemple multi-séries</h4>
                <p class="example-prompt">"Créez un graphique en barres comparant les heures d'utilisation de smartphone par groupe d'âge : Adolescents (14 h/semaine), Jeunes adultes (12 h/semaine), Âge moyen (8 h/semaine), et Seniors (4 h/semaine). Incluez aussi les heures d'utilisation des réseaux sociaux : Adolescents (10 h/semaine), Jeunes adultes (8 h/semaine), Âge moyen (5 h/semaine), et Seniors (2 h/semaine)."</p>
                
                <h4>Exemple de nuage de points</h4>
                <p class="example-prompt">"Générez un nuage de points montrant la relation entre heures d'étude (axe x) et notes d'examen (axe y) pour 10 étudiants : (2 h, 65%), (3 h, 70%), (5 h, 85%), (8 h, 95%), (4 h, 75%), (6 h, 90%), (2 h, 60%), (7 h, 92%), (3,5 h, 72%), (5,5 h, 88%)."</p>
                
                <h4>Exemple de graphique radar</h4>
                <p class="example-prompt">"Créez un graphique radar comparant trois smartphones sur cinq catégories : Téléphone A (Batterie : 90, Appareil photo : 85, Performance : 95, Design : 80, Prix : 70), Téléphone B (Batterie : 75, Appareil photo : 95, Performance : 90, Design : 85, Prix : 65), Téléphone C (Batterie : 95, Appareil photo : 75, Performance : 80, Design : 90, Prix : 85)."</p>
                
                <h4>Exemple de carte de chaleur</h4>
                <p class="example-prompt">"Créez une carte de chaleur montrant la corrélation entre différents langages de programmation et leur popularité dans divers secteurs industriels en 2025. Incluez des données pour des langages comme Python (IA/ML : 98, Finance : 85, Santé : 70, Jeux : 60, E-commerce : 92), JavaScript (Finance : 95, Santé : 55, Jeux : 75, E-commerce : 98, Médias : 90), Rust (Finance : 45, Santé : 35, Jeux : 90, IoT : 80, Cybersécurité : 85), Go (Finance : 55, Santé : 45, Jeux : 35, IoT : 95, Cloud : 85), et PHP (E-commerce : 60, Médias : 50, Éducation : 40, Gouvernement : 30, Santé : 35). Utilisez une échelle de couleur du bleu clair au bleu foncé, où les couleurs plus foncées représentent des taux d'adoption plus élevés."</p>

                <h4>Exemple de graphique à bulles</h4>
                <p class="example-prompt">"Générez un graphique à bulles comparant l'adoption des énergies renouvelables par différents pays. Sur l'axe x, montrez le PIB par habitant (USA : 65000, Allemagne : 48000, Chine : 12000, Inde : 2500, Brésil : 7000, Japon : 40000). Sur l'axe y, montrez le pourcentage d'énergie renouvelable dans le mix énergétique total (USA : 20%, Allemagne : 45%, Chine : 25%, Inde : 35%, Brésil : 85%, Japon : 30%). Utilisez la taille des bulles pour représenter la population en millions (USA : 330, Allemagne : 83, Chine : 1400, Inde : 1380, Brésil : 212, Japon : 126). Étiquetez chaque bulle avec le nom du pays et intitulez le graphique 'Adoption des énergies renouvelables vs. Développement économique (2025)'."</p>
                
                <div class="note">
                    <p><strong>Note :</strong> Si votre première tentative ne produit pas exactement la visualisation que vous voulez, essayez d'affiner votre description avec des détails plus spécifiques sur les catégories, valeurs et relations.</p>
                </div>
            `,
                image: "dataviz_examples.png",
                imageAlt: "Exemples de visualisations",
                imageCaption:
                    "Exemples de visualisations créées à partir de descriptions textuelles",
            },
            {
                id: "dataviz-advanced",
                title: "Conseils avancés",
                content: `
                <p>Tirez le meilleur parti de DataViz avec ces techniques avancées :</p>
                
                <h4>Personnalisation des visualisations</h4>
                <p>Vous pouvez demander des personnalisations spécifiques dans votre invite :</p>
                <ul>
                    <li>"Utilisez des couleurs bleues et vertes pour le graphique"</li>
                    <li>"Faites-en un graphique en barres empilées"</li>
                    <li>"Montrez les pourcentages sur les tranches du camembert"</li>
                    <li>"Utilisez une échelle logarithmique pour l'axe y"</li>
                </ul>
                
                <h4>Travailler avec des données complexes</h4>
                <p>Pour des jeux de données plus importants :</p>
                <ul>
                    <li>Décomposez les données complexes en groupes logiques</li>
                    <li>Envisagez d'utiliser plusieurs graphiques pour raconter une histoire complète</li>
                    <li>Utilisez des tendances et des modèles plutôt que chaque point de données</li>
                    <li>Soyez explicite sur les dimensions à montrer et celles à omettre</li>
                </ul>
                
                <h4>Gestion des échecs de génération</h4>
                <p>Si votre graphique ne se génère pas correctement :</p>
                <ul>
                    <li>Assurez-vous d'avoir spécifié des valeurs numériques précises</li>
                    <li>Vérifiez que vos données sont appropriées pour le type de graphique sélectionné</li>
                    <li>Simplifiez les descriptions complexes en informations plus claires et structurées</li>
                    <li>Réduisez le nombre de catégories ou de points de données</li>
                </ul>
                
                <h4>Annulation de la génération de graphique</h4>
                <p>Si vous devez arrêter la génération d'un graphique :</p>
                <ul>
                    <li>Cliquez sur le bouton "Annuler" dans la fenêtre de chargement</li>
                    <li>Le processus se terminera immédiatement</li>
                    <li>Vous pourrez ensuite réessayer avec une invite modifiée</li>
                </ul>
                
                <div class="note">
                    <p><strong>Important :</strong> Lorsque vous basculez vers un onglet différent, le mode DataViz sera automatiquement désactivé et vous reviendrez au mode de conversation normal.</p>
                </div>
            `,
                image: "dataviz_advanced.png",
                imageAlt: "Techniques DataViz avancées",
                imageCaption:
                    "Techniques avancées pour créer des visualisations personnalisées",
            },
        ],
    },
    paperworks: {
        title: "Paperasse",
        intro:
            "L'onglet Paperasse vous aide à créer et gérer des modèles de documents professionnels et des formulaires avec l'assistance de l'IA, tout en gardant toutes vos données privées et locales.",
        articles: [
            {
                id: "paperworks-intro",
                title: "Introduction aux Documents",
                content: `
                <p>L'onglet Documents fournit un système puissant de création de documents qui vous aide à générer des documents professionnels, modèles et formulaires en utilisant l'assistance de l'IA.</p>
                
                <p>Les fonctionnalités clés de l'onglet Documents incluent :</p>
                <ul>
                    <li>Modèles de documents pré-conçus pour les besoins commerciaux courants</li>
                    <li>Création de modèles personnalisés avec guidage par IA</li>
                    <li>Génération de formulaires pour la collecte de données</li>
                    <li>Aperçu et édition de documents</li>
                    <li>Options d'exportation pour divers formats</li>
                </ul>
                
                <p>Tout le traitement de documents se fait localement et sur votre appareil, garantissant que vos informations commerciales sensibles restent privées et sécurisées. Comme toutes les fonctionnalités de Paiperwork, Documents utilise votre clé de chiffrement principale pour protéger tous les modèles ou formulaires sauvegardés.</p>
            `,
                image: "paperworks_intro.png",
                imageAlt: "Aperçu de l'onglet Documents",
                imageCaption:
                    "Le tableau de bord des Documents montrant les options de création de documents",
            },
            {
                id: "paperworks-templates",
                title: "Modèles de Documents",
                content: `
                <p>L'onglet Documents affiche une grille de modèles de documents que vous pouvez sélectionner pour créer divers documents professionnels.</p>
                
                <h4>Types de Modèles Disponibles</h4>
                <ul>
                    <li><strong>Procès-verbaux de Réunion</strong> - Créer des procès-verbaux de réunion structurés et professionnels</li>
                    <li><strong>Lettre Commerciale</strong> - Générer une lettre commerciale professionnelle</li>
                    <li><strong>Rapport Technique</strong> - Créer un rapport technique détaillé avec sections et images</li>
                    <li><strong>Contrat</strong> - Créer un document de contrat légal</li>
                    <li><strong>Proposition</strong> - Générer une proposition commerciale convaincante</li>
                    <li><strong>Mémo</strong> - Créer un mémo d'entreprise professionnel</li>
                </ul>
                
                <h4>Utilisation des Modèles</h4>
                <p>Pour créer un document à partir d'un modèle :</p>
                <ol>
                    <li>Cliquez sur une carte de modèle dans la grille</li>
                    <li>Remplissez les informations requises dans les champs du formulaire</li>
                    <li>Cliquez sur "Générer le Document" pour créer votre document</li>
                    <li>Prévisualisez, éditez ou exportez votre document terminé</li>
                </ol>
                
                <div class="note">
                    <p><strong>Note :</strong> Les modèles sont des points de départ personnalisables. Vous pouvez modifier tout document généré pour mieux répondre à vos besoins spécifiques.</p>
                </div>
            `,
                image: "document_templates.png",
                imageAlt: "Grille des Modèles de Documents",
                imageCaption: "La grille de sélection des modèles de documents",
            },
            {
                id: "paperworks-technical-reports",
                title: "Création de Rapports Techniques",
                content: `
                <p>Le créateur de Rapports Techniques offre de puissantes capacités de conception de documents avec un éditeur visuel intuitif et une assistance IA.</p>
                
                <h4>Concepteur de Modèles Visuels</h4>
                <p>Lorsque vous sélectionnez le modèle de Rapport Technique, vous accédez au concepteur de modèles visuels qui vous permet de :</p>
                <ul>
                    <li>Concevoir des documents multipages professionnels avec un éditeur visuel</li>
                    <li>Construire votre rapport en ajoutant différents types de sections depuis la barre latérale</li>
                    <li>Personnaliser la mise en page et la structure avec simplicité</li>
                    <li>Ajouter des images et éléments visuels avec téléchargement facile</li>
                    <li>Prévisualiser le document exactement comme il apparaîtra à l'impression</li>
                    <li>Maximiser la fenêtre du concepteur pour une expérience d'édition plein écran</li>
                </ul>
                
                <h4>Types de Sections Disponibles</h4>
                <ul>
                    <li><strong>En-tête de Document</strong> - Titre et sous-titre pour votre rapport</li>
                    <li><strong>En-tête de Section</strong> - Divise votre rapport en sections logiques</li>
                    <li><strong>Zone de Texte</strong> - Pour les paragraphes et le contenu textuel plus long</li>
                    <li><strong>Texte + Image (Droite)</strong> - Texte avec une image sur le côté droit</li>
                    <li><strong>Image + Texte (Droite)</strong> - Image avec du texte sur le côté droit</li>
                    <li><strong>Galerie d'Images</strong> - Disposition en grille pour plusieurs images</li>
                    <li><strong>Rangée d'Images</strong> - Arrangement horizontal d'images avec légende optionnelle</li>
                    <li><strong>Séparateur</strong> - Séparateur visuel entre les sections</li>
                    <li><strong>Espace Vide</strong> - Espace blanc ajustable avec capacité de redimensionnement</li>
                </ul>
                
                <h4>Fonctionnalités de Mise en Page Intelligente</h4>
                <ul>
                    <li><strong>Support multipage</strong> - Le contenu s'écoule automatiquement sur plusieurs pages</li>
                    <li><strong>Sauts de page</strong> - Des indicateurs visuels montrent où le contenu se divisera entre les pages</li>
                    <li><strong>Pagination automatique</strong> - Les numéros de page sont ajoutés automatiquement</li>
                    <li><strong>Format A4</strong> - Taille de document standard avec marges appropriées</li>
                    <li><strong>Contrôles de section</strong> - Déplacer, éditer ou supprimer des sections avec des boutons d'accès facile</li>
                    <li><strong>Espacement flexible</strong> - Option d'étendre les sections vides pour remplir une page</li>
                </ul>
                
                <h4>Amélioration du Contenu</h4>
                <ul>
                    <li><strong>Amélioration IA</strong> - Amélioration en un clic du contenu textuel utilisant l'assistance IA</li>
                    <li><strong>Édition directe</strong> - Éditer le texte directement dans l'aperçu pour une expérience WYSIWYG</li>
                    <li><strong>Téléchargement d'images</strong> - Glisser-déposer ou cliquer pour télécharger des images</li>
                    <li><strong>Espaces réservés de contenu</strong> - Des espaces réservés utiles montrent où ajouter du contenu</li>
                    <li><strong>Capacité d'annulation</strong> - Annuler les améliorations IA si nécessaire</li>
                    <li><strong>Traductions directes</strong> - Préfixer "Traduire en (langue) :" au début du texte et cliquer sur Améliorer avec IA</li>
                </ul>
                <h4>Sélection de Police et Aperçu PDF</h4>
                <ul>
                    <li><strong>Sélection de Police</strong> - Choisir parmi une variété de polices en utilisant le menu déroulant au-dessus de l'éditeur</li>
                    <li><strong>Aperçu de Police</strong> - Voir comment votre document apparaît avec différentes polices en temps réel</li>
                    <li><strong>Persistance de Police</strong> - Votre police sélectionnée est mémorisée entre les sessions pour la cohérence</li>
                    <li><strong>Aperçu PDF</strong> - Voir un aperçu précis de comment votre document apparaîtra en PDF</li>
                    <li><strong>Mise en Page</strong> - Voir exactement comment le contenu est distribué sur les pages avec un dimensionnement A4 approprié</li>
                    <li><strong>Sauts de Page</strong> - L'aperçu montre des indicateurs clairs de saut de page entre les pages du document</li>
                </ul>               

                <h4>Utilisation de l'Aperçu PDF</h4>
                <ol>
                    <li>Cliquez sur le bouton "Aperçu" à côté du sélecteur de police</li>
                    <li>Une fenêtre modale s'ouvrira montrant votre document tel qu'il apparaîtrait en format PDF</li>
                    <li>Chaque page est affichée à la taille A4 appropriée avec un positionnement exact de la mise en page</li>
                    <li>Examinez la pagination et assurez-vous que le contenu est correctement distribué</li>
                    <li>Fermez l'aperçu une fois terminé pour retourner à l'édition</li>
                </ol>
                <h4>Création d'un Rapport Technique</h4>
                <ol>
                    <li>Entrez un nom pour votre rapport en haut du concepteur</li>
                    <li>Cliquez sur les préréglages de conception du panneau de droite pour les ajouter à votre document</li>
                    <li>Remplissez le contenu de chaque section en cliquant et tapant directement dans la section</li>
                    <li>Téléchargez des images en cliquant sur les espaces réservés d'images</li>
                    <li>Améliorez le texte avec les boutons IA sous les zones de texte éditables</li>
                    <li>Réorganisez les sections en utilisant les contrôles de flèches haut/bas</li>
                    <li>Une fois terminé, sauvegardez votre rapport et exportez-le ou imprimez-le</li>
                </ol>
                
                <div class="note">
                    <p><strong>Conseil :</strong> Maximisez la fenêtre de l'éditeur en utilisant le bouton maximiser dans le coin supérieur droit pour une expérience d'édition plus confortable avec des documents plus volumineux. L'interface s'ajuste automatiquement pour fournir une mise en page optimale dans les vues régulière et maximisée.</p>
                </div>
                `,
                images: [
                    {
                        src: "technical_report_designer.png",
                        alt: "Rapport technique",
                        caption:
                            "Le concepteur de rapport technique visuel montrant la mise en page du document et les types de sections",
                    },
                    {
                        src: "preview-window-technical-report.png",
                        alt: "La fenêtre d'aperçu pour les rapports techniques",
                        caption: "La fenêtre d'aperçu pour les rapports techniques"
                    }
                ]
            },
            {
                id: "paperworks-document-generation",
                title: "Génération de Documents",
                content: `
                <p>Documents utilise l'assistance IA pour vous aider à générer du contenu de document professionnel basé sur vos entrées.</p>
                
                <h4>Processus de Génération de Documents</h4>
                <ol>
                    <li>Sélectionnez un modèle de document</li>
                    <li>Remplissez les champs de formulaire requis avec vos informations</li>
                    <li>Cliquez sur "Générer le Document" pour créer votre document</li>
                    <li>Examinez le contenu généré</li>
                    <li>Éditez ou affinez le contenu selon les besoins</li>
                    <li>Exportez ou sauvegardez votre document finalisé</li>
                </ol>
                
                <h4>Amélioration IA</h4>
                <p>L'assistance IA peut vous aider à :</p>
                <ul>
                    <li>Formater votre contenu de manière professionnelle</li>
                    <li>Suggérer une phraséologie et une terminologie appropriées</li>
                    <li>Assurer la cohérence dans tout votre document</li>
                    <li>Générer des sections complètes basées sur vos entrées</li>
                </ul>
                
                <div class="note">
                    <p><strong>Note :</strong> Pour utiliser les fonctionnalités d'amélioration IA, assurez-vous d'avoir d'abord sélectionné un modèle IA dans l'onglet Chat.</p>
                </div>
            `,
                image: "document_generation.png",
                imageAlt: "Processus de Génération de Documents",
                imageCaption: "L'interface de formulaire de génération de documents",
            },
            {
                id: "paperworks-export",
                title: "Exportation de Documents",
                content: `
                <p>Une fois que vous avez créé et affiné votre document, vous pouvez l'exporter dans divers formats.</p>
                
                <h4>Options d'Exportation Disponibles</h4>
                <ul>
                    <li><strong>Exportation Texte</strong> - Copier le texte avec son formatage prêt à être collé dans n'importe quel processeur de texte</li>
                    <li><strong>Envoyer par Email</strong> - Ouvrir votre programme email par défaut, remplit l'objet et le corps de l'email</li>
                </ul>
                
                <h4>Exportation de Votre Document</h4>
                <ol>
                    <li>Après avoir généré votre document, examinez l'aperçu</li>
                    <li>Effectuez les ajustements finaux selon les besoins</li>
                    <li>Cliquez sur le bouton d'exportation approprié (Copier, Email)</li>
                    <li>Suivez les instructions pour sauvegarder ou envoyer votre document</li>
                </ol>
                
                <p>Tous les documents exportés maintiennent le formatage et le style de votre aperçu, garantissant une présentation professionnelle quel que soit le format.</p>
            `,
                image: "document_export.png",
                imageAlt: "Options d'Exportation de Documents",
                imageCaption: "L'interface d'exportation de documents montrant les options de format",
            },
        ],
    },
    research: {
        title: "Recherche",
        intro: "L'onglet Recherche fournit de puissantes capacités de recherche assistée par IA et une base de connaissances personnelle pour stocker et récupérer des informations.",
        articles: [
            {
                id: "research-intro",
                title: "Introduction aux outils de recherche",
                content: `
                <p>L'onglet Recherche offre deux outils puissants pour vous aider à rassembler, analyser et stocker des informations :</p>
                
                <ul>
                    <li><strong>Assistant de Recherche</strong> - Recherche web alimentée par IA qui vous aide à trouver, analyser et synthétiser des informations sur n'importe quel sujet</li>
                    <li><strong>Base de Connaissances</strong> - Une base de données personnelle où vous pouvez stocker, organiser et récupérer des informations importantes pour référence future</li>
                </ul>
                
                <h4>Confidentialité et Sécurité des Données</h4>
                <p>L'onglet Recherche maintient l'engagement de Paiperwork envers la confidentialité et la sécurité des données :</p>
                <ul>
                    <li><strong>Connexion Internet Requise</strong> - L'Assistant de Recherche nécessite une connexion internet pour effectuer des recherches web</li>
                    <li><strong>Transmission de Données Limitée</strong> - Seules les requêtes de recherche sont envoyées à internet (via Bing Search). Aucune donnée personnelle ou professionnelle n'est jamais transmise</li>
                    <li><strong>Traitement Local</strong> - Tous les résultats de recherche sont traités localement sur votre appareil par votre modèle IA choisi</li>
                    <li><strong>Stockage Chiffré</strong> - Les résultats de recherche et les entrées de la base de connaissances sont chiffrés en utilisant votre Clé Maître dans votre base de données locale</li>
                    <li><strong>Base de Connaissances Complètement Hors Ligne</strong> - La Base de Connaissances fonctionne entièrement localement, ne nécessitant aucune connexion internet une fois les entrées créées</li>
                </ul>
                
                <h4>Basculer Entre les Outils</h4>
                <p>Utilisez la navigation par sous-onglets en haut de l'onglet Recherche pour basculer entre l'Assistant de Recherche et la Base de Connaissances :</p>
                <ul>
                    <li>Cliquez sur <strong>Recherche</strong> pour utiliser l'outil de recherche et d'analyse web alimenté par IA</li>
                    <li>Cliquez sur <strong>Base de Connaissances</strong> pour accéder à vos collections d'informations stockées</li>
                </ul>
                
                <div class="note">
                    <p><strong>Important :</strong> L'onglet Recherche utilise le modèle actuellement sélectionné dans l'onglet Chat. Assurez-vous de sélectionner un modèle approprié dans l'onglet Chat avant d'utiliser les fonctionnalités de Recherche. Pour les tâches de recherche, les modèles non-raisonnants (comme Mistral3, Qwen2.5 ou LLaMA) performent le mieux.</p>
                    <p><strong>Note de Performance :</strong> L'utilisation de modèles IA de raisonnement (comme Cogito, Qwen3 ou Deepseek R1) augmentera considérablement le temps de recherche car ces modèles effectuent une réflexion détaillée à chaque étape du processus. Pour des résultats de recherche plus rapides, préférez les modèles d'instruction standard qui traitent l'information plus directement.</p>
                </div>
                `,
                image: "research_tab_overview.png",
                imageAlt: "Aperçu de l'onglet Recherche",
                imageCaption: "L'onglet Recherche montrant la navigation par sous-onglets entre l'Assistant de Recherche et la Base de Connaissances"
            },
            {
                id: "research-assistant",
                title: "Utilisation de l'Assistant de Recherche",
                content: `
                <p>L'Assistant de Recherche combine la recherche web, l'analyse IA et la génération de rapports pour vous aider à rechercher n'importe quel sujet de manière approfondie.</p>
                
                <h4>Commencer Votre Recherche</h4>
                <ol>
                    <li>Assurez-vous d'avoir sélectionné un modèle approprié dans l'onglet Chat (l'onglet Recherche utilise votre modèle de l'onglet Chat)</li>
                    <li>Entrez votre question de recherche dans le champ de saisie</li>
                    <li>Choisissez une taille de rapport (détaillé ci-dessous)</li>
                    <li>Configurez les options de Recherche Approfondie si nécessaire (détaillé ci-dessous)</li>
                    <li>Cliquez sur le bouton "Recherche" pour commencer le processus de recherche</li>
                </ol>
                
                <h4>Options de Taille de Rapport</h4>
                <p>Sélectionnez la taille de rapport appropriée en fonction de vos besoins et des ressources système disponibles :</p>
                <ul>
                    <li><strong>Concis</strong> - Résumé bref de 500-800 mots avec les faits essentiels
                        <br><em>Contexte recommandé : 8K-16K (2-4GB VRAM/RAM)</em></li>
                    <li><strong>Standard</strong> - Rapport équilibré de 1000-1500 mots avec les détails clés
                        <br><em>Contexte recommandé : 16K-32K (4-8GB VRAM/RAM)</em></li>
                    <li><strong>Détaillé</strong> - Analyse complète de 2000-3000 mots
                        <br><em>Contexte recommandé : 32K-64K (8-16GB VRAM/RAM)</em></li>
                    <li><strong>Complet</strong> - Examen approfondi de 4000-5000 mots
                        <br><em>Contexte recommandé : 64K-128K (16-32GB VRAM/RAM)</em></li>
                    <li><strong>Étendu</strong> - Exploration approfondie de 6000+ mots avec un maximum de détails
                        <br><em>Contexte recommandé : 128K+ (32GB+ VRAM/RAM pour systèmes haut de gamme)</em></li>
                </ul>
                
                <div class="note">
                  <p><strong>Explication des Exigences de Contexte :</strong> L'Assistant de Recherche traite les informations en plusieurs étapes - d'abord en résumant les sources individuelles, puis en générant des rapports partiels par lots, et enfin en combinant tout dans le rapport final. Les rapports plus volumineux nécessitent plus de contexte pour maintenir la cohérence entre toutes les sources et assurer une analyse complète. Si vous rencontrez des problèmes de mémoire ou des rapports incomplets, essayez de réduire la taille du rapport ou d'augmenter la taille du contexte dans l'onglet Chat.</p>
                </div>
                
                <h4>Optimisation des Performances de Recherche</h4>
                <p>Pour de meilleurs résultats de recherche :</p>
                <ul>
                    <li><strong>Adapter la taille du rapport à votre système</strong> - Utilisez le calculateur de contexte dans l'onglet Chat pour déterminer les paramètres optimaux</li>
                    <li><strong>Surveiller l'utilisation de la mémoire</strong> - Surveillez les signes de pression mémoire comme des rapports incomplets ou des ralentissements système</li>
                    <li><strong>Considérer l'impact de la Recherche Profonde</strong> - La Recherche Profonde avec plusieurs niveaux augmente significativement la quantité de contenu à traiter</li>
                    <li><strong>Utiliser des modèles appropriés</strong> - Les modèles non-raisonnants (Mistral, Qwen2.5, LLaMA) traitent la recherche plus rapidement que les modèles de raisonnement</li>
                </ul>
                
                <h4>Configuration de la Recherche Approfondie</h4>
                <p>La fonctionnalité de Recherche Approfondie offre des capacités de recherche améliorées avec un contrôle granulaire :</p>
                <ul>
                    <li><strong>Basculer Activer/Désactiver</strong> - Activez ou désactivez la Recherche Approfondie pour votre session de recherche</li>
                    <li><strong>Profondeur de Recherche</strong> - Choisissez parmi 1-3 niveaux de suivi de liens :
                        <ul>
                            <li>Niveau 1 : Suivre les liens immédiats des résultats de recherche</li>
                            <li>Niveau 2 : Suivre les liens du premier niveau de pages découvertes</li>
                            <li>Niveau 3 : Exploration de profondeur maximale pour une couverture complète</li>
                        </ul>
                    </li>
                    <li><strong>Liens par Page</strong> - Sélectionnez 1-5 liens à suivre depuis chaque page découverte</li>
                    <li><strong>Traitement PDF Amélioré</strong> - Lorsqu'activé, la Recherche Approfondie détecte automatiquement et traite les documents PDF avec des capacités d'extraction améliorées</li>
                </ul>
                <p>Survolez les options de Recherche Approfondie pour voir des info-bulles détaillées expliquant l'impact de chaque paramètre sur la minutie de la recherche et le temps de traitement.</p>
                
                <h4>Processus de Recherche avec Fenêtre Flottante</h4>
                <p>Lorsque vous initiez une recherche, le système affiche une fenêtre de progression flottante qui montre :</p>
                <ol>
                    <li><strong>Génération de Requête</strong> - Crée des requêtes de recherche optimisées basées sur votre question de recherche</li>
                    <li><strong>Recherche Web</strong> - Recherche sur le web en utilisant plusieurs requêtes ciblées</li>
                    <li><strong>Analyse de Contenu</strong> - Analyse et extrait les informations clés des résultats de recherche</li>
                    <li><strong>Détection et Traitement PDF</strong> - Identifie automatiquement les documents PDF et les traite avec une extraction améliorée</li>
                    <li><strong>Exécution de Recherche Approfondie</strong> - Si activée, suit les liens à votre profondeur et quantité spécifiées</li>
                    <li><strong>Génération de Rapport</strong> - Synthétise toutes les informations rassemblées dans votre taille de rapport sélectionnée</li>
                </ol>
                
                <p>La fenêtre de progression flottante fournit des mises à jour en temps réel et vous permet de :</p>
                <ul>
                    <li>Surveiller la phase de recherche actuelle et les progrès</li>
                    <li>Annuler le processus de recherche à tout moment</li>
                    <li>Voir le temps d'achèvement estimé</li>
                    <li>Suivre le nombre de sources en cours de traitement</li>
                </ul>
                
                <h4>Gestion PDF Améliorée</h4>
                <p>L'Assistant de Recherche inclut des capacités de traitement PDF avancées :</p>
                <ul>
                    <li><strong>Détection Automatique</strong> - Identifie les documents PDF dans les résultats de recherche en utilisant plusieurs modèles (extensions de fichier, modèles d'URL, sources académiques)</li>
                    <li><strong>Extraction Améliorée</strong> - Utilise des méthodes d'extraction spécialisées pour les articles académiques et documents techniques</li>
                    <li><strong>Intégration de Contenu</strong> - Incorpore de manière transparente le contenu PDF dans la synthèse de recherche</li>
                    <li><strong>Attribution de Source</strong> - Maintient des citations claires vers les sources PDF originales</li>
                </ul>
                
                <div class="note">
                    <p><strong>Note de Performance :</strong> La Recherche Approfondie avec des niveaux de profondeur plus élevés et plus de liens par page fournit des résultats plus complets mais augmente le temps de recherche. Le traitement PDF ajoute du temps supplémentaire mais améliore considérablement la qualité de recherche pour les sujets académiques et techniques.</p>
                </div>
                `,
            },

            {
                id: "research-results",
                title: "Travailler avec les Résultats de Recherche",
                content: `
                <p>Après la fin de votre recherche, le système génère un rapport de recherche complet dans une fenêtre flottante modifiable.</p>
                
                <h4>Fonctionnalités de la Fenêtre de Résultats de Recherche</h4>
                <p>Les résultats de recherche apparaissent dans une fenêtre flottante qui fournit :</p>
                <ul>
                    <li><strong>Édition Complète</strong> - Cliquez n'importe où dans la zone de contenu pour éditer directement le rapport de recherche</li>
                    <li><strong>Édition en Temps Réel</strong> - Effectuez des modifications au contenu, ajoutez vos propres notes, ou réorganisez les sections</li>
                    <li><strong>Gestion des Liens Sources</strong> - Éditez, mettez à jour, ou supprimez les citations de sources selon les besoins</li>
                    <li><strong>Interface Maximisable</strong> - Agrandissez la fenêtre pour l'édition et la révision en plein écran</li>
                    <li><strong>Glisser et Repositionner</strong> - Déplacez la fenêtre vers votre position d'écran préférée</li>
                </ul>
                
                <h4>Structure du Rapport de Recherche</h4>
                <p>Le rapport de recherche est structuré pour la clarté et l'exhaustivité :</p>
                <ul>
                    <li><strong>Résumé Exécutif</strong> - Principales découvertes et conclusions principales</li>
                    <li><strong>Analyse Détaillée</strong> - Examen complet organisé par sous-sujets</li>
                    <li><strong>Preuves à l'Appui</strong> - Données pertinentes, citations et exemples des sources</li>
                    <li><strong>Conclusion</strong> - Insights synthétisés et implications</li>
                    <li><strong>Références de Sources</strong> - Citations complètes avec liens cliquables vers le contenu original</li>
                </ul>
                
                <h4>Édition du Contenu de Recherche</h4>
                <p>Les résultats de recherche sont entièrement modifiables, vous permettant de :</p>
                <ul>
                    <li>Ajouter votre propre analyse et commentaire</li>
                    <li>Réorganiser les sections pour un meilleur flux</li>
                    <li>Surligner les découvertes clés importantes pour vos besoins spécifiques</li>
                    <li>Supprimer les informations non pertinentes</li>
                    <li>Mettre à jour ou corriger les informations de source</li>
                    <li>Ajouter du contexte ou des explications supplémentaires</li>
                </ul>
                
                <h4>Options d'Exportation</h4>
                <p>Les résultats de recherche peuvent être exportés en plusieurs formats via l'utilitaire d'exportation intégré :</p>
                <ul>
                    <li><strong>Texte Brut (.txt)</strong> - Format de texte propre avec le formatage markdown supprimé pour une compatibilité universelle</li>
                    <li><strong>Markdown (.md)</strong> - Préserve le formatage, la structure, les en-têtes et les liens dans la syntaxe markdown</li>
                    <li><strong>HTML (.html)</strong> - Formatage complet avec style approprié, éléments markdown convertis et liens cliquables</li>
                </ul>
                
                <h4>Sauvegarder dans la Base de Connaissances</h4>
                <p>Lors de la sauvegarde de recherche dans votre Base de Connaissances, vous avez des options améliorées :</p>
                <ul>
                    <li><strong>Sélection de Collection</strong> - Choisissez une collection existante ou créez-en une nouvelle pendant le processus de sauvegarde</li>
                    <li><strong>Sauvegarder les Sources Séparément</strong> - Option pour sauvegarder les références de sources comme entrées séparées dans votre base de connaissances</li>
                    <li><strong>Personnalisation du Contenu</strong> - Sauvegardez votre version éditée incluant toutes les modifications que vous avez apportées</li>
                    <li><strong>Préservation des Métadonnées</strong> - Maintient la date de recherche, la requête et les paramètres pour référence future</li>
                </ul>
                
                <h4>Gestion de Fenêtre</h4>
                <p>La fenêtre de résultats flottante fournit :</p>
                <ul>
                    <li><strong>Interface Redimensionnable</strong> - Glissez les coins pour redimensionner pour un affichage optimal</li>
                    <li><strong>Minimiser/Maximiser</strong> - Masquez temporairement ou agrandissez en plein écran</li>
                    <li><strong>Rester au Dessus</strong> - Option pour garder les résultats visibles pendant que vous travaillez dans d'autres zones</li>
                    <li><strong>Support Multi-Fenêtres</strong> - Gardez les résultats de recherche précédents ouverts pendant le démarrage d'une nouvelle recherche</li>
                </ul>
                
                <div class="note">
                    <p><strong>Conseil Pro :</strong> Profitez des capacités d'édition pour personnaliser les rapports de recherche selon vos besoins spécifiques. Vous pouvez ajouter des insights personnels, réorganiser le contenu, et créer une ressource de connaissance personnalisée avant de sauvegarder dans votre Base de Connaissances.</p>
                </div>
                `,
                image: "research_results_editable.png",
                imageAlt: "Fenêtre de Résultats de Recherche Modifiable",
                imageCaption: "La fenêtre de résultats de recherche flottante montrant les capacités d'édition et les options d'exportation"
            },

            {
                id: "knowledge-base-intro",
                title: "Aperçu de la Base de Connaissances",
                content: `
                <p>La Base de Connaissances vous permet de stocker, organiser et parcourir manuellement les collections d'informations que vous voulez conserver pour référence future.</p>
                
                <h4>Structure de la Base de Connaissances</h4>
                <p>Vos connaissances sont organisées en collections et entrées :</p>
                <ul>
                    <li><strong>Collections</strong> - Dossiers ou catégories qui contiennent des entrées liées (ex. "Recherche de Projet" ou "Recettes de Cuisine")</li>
                    <li><strong>Entrées</strong> - Pièces individuelles d'information stockées dans les collections</li>
                </ul>
                
                <h4>Créer une Collection</h4>
                <ol>
                    <li>Entrez un nom pour votre nouvelle collection dans le champ "Nom de la nouvelle collection..."</li>
                    <li>Cliquez sur le bouton "Créer Collection"</li>
                    <li>Votre nouvelle collection apparaîtra dans la liste des collections ci-dessous</li>
                </ol>
                
                <h4>Gestion des Collections</h4>
                <p>Chaque collection dans votre liste a plusieurs boutons d'action :</p>
                <ul>
                    <li><strong>Voir</strong> - Ouvrir la collection pour voir son contenu</li>
                    <li><strong>Éditer</strong> - Renommer la collection</li>
                    <li><strong>Exporter</strong> - Sauvegarder la collection et ses entrées dans un fichier</li>
                    <li><strong>Supprimer</strong> - Retirer la collection et toutes ses entrées</li>
                </ul>
                
                <h4>Stockage et Organisation</h4>
                <p>La Base de Connaissances sert de système de stockage simple mais efficace :</p>
                <ul>
                    <li><strong>Organisation Manuelle</strong> - Parcourez vos collections pour trouver les informations stockées</li>
                    <li><strong>Stockage de Recherche</strong> - Parfait pour stocker les rapports de recherche complets de l'Assistant de Recherche</li>
                    <li><strong>Notes Personnelles</strong> - Stockez vos propres notes, idées et informations</li>
                    <li><strong>Pas de Recherche Requise</strong> - Navigation simple à travers les collections organisées</li>
                </ul>
                
                <div class="note">
                    <p><strong>Important :</strong> Les données de la Base de Connaissances sont chiffrées en utilisant votre Clé Maître et stockées localement sur votre appareil. Cela assure la confidentialité mais signifie aussi que vous devez utiliser la même Clé Maître pour accéder à vos connaissances dans les sessions futures.</p>
                </div>
                `,
                image: "knowledge_base_collections.png",
                imageAlt: "Collections de la Base de Connaissances",
                imageCaption: "La Base de Connaissances montrant une liste de collections avec options de gestion"
            },
            {
                id: "knowledge-entries",
                title: "Travailler avec les Entrées de Connaissances",
                content: `
                <p>Les entrées de connaissances sont des pièces individuelles d'information stockées dans vos collections.</p>
                
                <h4>Types d'Entrées de Connaissances</h4>
                <p>Vous pouvez créer deux types d'entrées dans votre Base de Connaissances :</p>
                <ul>
                    <li><strong>Entrées Manuelles</strong> - Informations que vous écrivez ou collez directement</li>
                    <li><strong>Entrées de Recherche</strong> - Informations sauvegardées de vos rapports de recherche</li>
                </ul>
                
                <h4>Créer une Nouvelle Entrée</h4>
                <ol>
                    <li>Ouvrez une collection en cliquant sur le bouton "Voir"</li>
                    <li>Cliquez sur le bouton "+ Nouvelle Entrée" en haut de la vue de collection</li>
                    <li>Entrez un titre pour votre entrée</li>
                    <li>Ajoutez votre contenu dans la zone de texte (le formatage Markdown est supporté)</li>
                    <li>Cliquez sur "Sauvegarder Entrée" pour l'ajouter à votre collection</li>
                </ol>
                
                <h4>Visualiser et Gérer les Entrées</h4>
                <p>Depuis la vue de collection, vous pouvez :</p>
                <ul>
                    <li>Cliquer sur n'importe quelle entrée pour voir son contenu complet</li>
                    <li>Utiliser le bouton "Éditer Entrée" pour modifier le contenu d'une entrée</li>
                    <li>Utiliser le bouton "Supprimer Entrée" pour retirer une entrée</li>
                    <li>Cliquer sur le bouton "← Retour aux Entrées" pour revenir à la vue de collection</li>
                </ul>
                
                <h4>Support Markdown</h4>
                <p>Lors de la création ou édition d'entrées, vous pouvez utiliser le formatage Markdown :</p>
                <ul>
                    <li><strong>En-têtes</strong> - Utilisez # pour le niveau d'en-tête 1, ## pour le niveau 2, etc.</li>
                    <li><strong>Formatage</strong> - Utilisez *italique* pour l'italique et **gras** pour le texte gras</li>
                    <li><strong>Listes</strong> - Créez des listes à puces avec * ou des listes numérotées avec 1., 2., etc.</li>
                    <li><strong>Liens</strong> - Créez des liens avec la syntaxe [texte](URL)</li>
                </ul>
                
                <div class="note">
                    <p><strong>Conseil :</strong> Le formatage Markdown rend vos entrées plus organisées et lisibles, particulièrement pour le contenu technique ou structuré.</p>
                </div>
            `,
                image: "knowledge_entries.png",
                imageAlt: "Entrées de Connaissances",
                imageCaption: "Une vue de collection montrant plusieurs entrées de connaissances"
            },
            {
                id: "knowledge-browse",
                title: "Parcourir Votre Base de Connaissances",
                content: `
                <p>La Base de Connaissances fournit un moyen simple de parcourir et organiser vos informations stockées à travers les collections et entrées.</p>
                
                <h4>Naviguer dans les Collections</h4>
                <ol>
                    <li>Depuis la vue principale de la Base de Connaissances, vous verrez toutes vos collections listées</li>
                    <li>Cliquez sur "Voir" sur n'importe quelle collection pour voir son contenu</li>
                    <li>Parcourez les entrées dans chaque collection</li>
                    <li>Cliquez sur les entrées individuelles pour lire leur contenu complet</li>
                </ol>
                
                <h4>Trouver des Informations</h4>
                <p>Pour localiser des informations spécifiques dans votre Base de Connaissances :</p>
                <ul>
                    <li><strong>Parcourir par Collection</strong> - Vérifiez les collections liées à votre sujet</li>
                    <li><strong>Nommage Descriptif</strong> - Utilisez des noms clairs et descriptifs pour les collections et entrées</li>
                    <li><strong>Organisation Logique</strong> - Groupez les informations liées dans la même collection</li>
                    <li><strong>Révision Manuelle</strong> - Parcourez les entrées pour trouver ce dont vous avez besoin</li>
                </ul>
                
                <h4>Conseils d'Organisation</h4>
                <p>Pour une gestion efficace des connaissances :</p>
                <ul>
                    <li>Créez des collections pour différents projets, sujets ou périodes de temps</li>
                    <li>Utilisez des titres clairs et descriptifs pour les collections et les entrées</li>
                    <li>Considérez l'organisation basée sur la date pour les rapports de recherche</li>
                    <li>Gardez les informations liées ensemble dans la même collection</li>
                </ul>
                
                <div class="note">
                    <p><strong>Conseil :</strong> Une bonne organisation en amont rend beaucoup plus facile la recherche d'informations plus tard. Considérez vos conventions de nommage et structure de collection avant d'ajouter de nombreuses entrées.</p>
                </div>
                `,
            },
            {
                id: "research-to-knowledge",
                title: "De la Recherche à la Connaissance",
                content: `
                <p>L'une des fonctionnalités les plus puissantes de l'onglet Recherche est l'intégration entre l'Assistant de Recherche et la Base de Connaissances.</p>
                
                <h4>Sauvegarder la Recherche dans la Base de Connaissances</h4>
                <p>Après avoir terminé une session de recherche :</p>
                <ol>
                    <li>Cliquez sur le bouton "Sauvegarder dans la Base de Connaissances" dans la fenêtre de résultats de recherche</li>
                    <li>Sélectionnez une collection existante ou créez-en une nouvelle</li>
                    <li>Confirmez votre sélection pour sauvegarder la recherche</li>
                </ol>
                
                <p>Le rapport de recherche sera sauvegardé comme nouvelle entrée dans votre collection sélectionnée, incluant :</p>
                <ul>
                    <li>Le contenu complet du rapport de recherche</li>
                    <li>La question de recherche originale comme titre d'entrée</li>
                    <li>Les métadonnées sur quand la recherche a été menée</li>
                    <li>Toutes les sources de la recherche</li>
                </ul>
                
                <h4>Gestion des Sources</h4>
                <p>Lors de la sauvegarde de recherche dans votre Base de Connaissances, vous avez des options pour gérer les sources :</p>
                <ul>
                    <li><strong>Sauvegarder avec Sources</strong> - Inclut tous les liens de référence et citations</li>
                    <li><strong>Sauvegarder Contenu Seulement</strong> - Sauvegarde seulement le contenu de recherche sans les sources</li>
                </ul>
                
                <h4>Construire Votre Bibliothèque de Connaissances</h4>
                <p>En sauvegardant régulièrement vos recherches dans la Base de Connaissances, vous pouvez :</p>
                <ul>
                    <li>Construire une bibliothèque personnelle d'informations vérifiées</li>
                    <li>Éviter de répéter la recherche sur des sujets que vous avez déjà explorés</li>
                    <li>Référencer rapidement les découvertes précédentes dans de nouveaux projets</li>
                    <li>Créer des connexions entre des sujets liés</li>
                </ul>
                
                <div class="note">
                    <p><strong>Conseil Pro :</strong> Créez des collections thématiques pour différents domaines d'intérêt ou projets, puis utilisez la fonction de recherche pour trouver des connexions à travers toute votre bibliothèque de connaissances.</p>
                </div>
            `,
                image: "research_to_knowledge.png",
                imageAlt: "Sauvegarder la Recherche dans la Base de Connaissances",
                imageCaption: "Le dialogue pour sauvegarder les résultats de recherche dans une collection de Base de Connaissances"
            }
        ],
    },
    artworks: {
        title: "Conception",
        intro:
            "L'onglet Conception Visuelle vous permet d'utiliser des modèles de vision IA pour analyser les choix de design, générer des prototypes de sites web basés sur des designs visuels, et créer des superpositions de texte pour les images.",
        articles: [
            {
                id: "artworks-getting-started",
                title: "Débuter avec Visual Design Studio",
                content: `
                    <div class="note">
                        <p><strong>Version initiale :</strong> L'onglet Créations est une nouvelle fonctionnalité dans sa version initiale. Nous sommes ravis de partager cet outil de design innovant alimenté par l'IA avec vous et aimerions beaucoup entendre vos commentaires et idées pour les futures additions et améliorations. Vos suggestions nous aident à améliorer Paiperwork pour tout le monde !</p>
                    </div>
                    
                    <p>L'onglet Créations fournit des outils alimentés par l'IA pour transformer les images en designs web fonctionnels et analyser les compositions visuelles.</p>
                    
                    <h4>Exigences et configuration</h4>
                    <ul>
                        <li><strong>Modèle IA visuel requis</strong> - Vous avez besoin d'un modèle avec capacités visuelles installé dans Ollama (LLaVA, Gemma3, Phi3-Vision, etc.)</li>
                        <li><strong>Sélection du modèle</strong> - Choisissez votre modèle visuel dans le menu déroulant en haut de l'onglet</li>
                        <li><strong>Exigences d'image</strong> - Téléchargez des images claires et de haute qualité (max 5MB) au format PNG, JPEG, GIF ou WebP</li>
                    </ul>
                    
                    <h4>Modèles visuels compatibles</h4>
                    <ul>
                        <li><strong>Mistral-small3.1</strong> - Modèle visuel Mistral avec des capacités superbes et un support multilingue</li>
                        <li><strong>Gemma3</strong> - Modèle visuel de Google avec de fortes capacités de génération de code</li>
                        <li><strong>LLaVA & BakLLaVA</strong> - Variantes de Large Language and Vision Assistant</li>
                        <li><strong>Phi3-Vision</strong> - Modèle de vision Microsoft avec une bonne compréhension du design</li>
                        <li>Tout autre modèle Ollama avec capacités visuelles</li>
                    </ul>
                    
                    <h4>Installation des modèles visuels</h4>
                    <p>Si aucun modèle compatible n'est disponible :</p>
                    <ol>
                        <li>Cliquez sur "Aller à l'onglet Modèles" depuis l'écran d'avertissement</li>
                        <li>Installez un modèle avec capacités visuelles en utilisant Ollama</li>
                        <li>Retournez au Visual Design Studio après l'installation</li>
                    </ol>
                    
                    <div class="note">
                        <p><strong>Important :</strong> Lors du changement d'onglet depuis les créations, les données d'image sont effacées de la mémoire pour éviter les problèmes d'utilisation des ressources, et le contexte de chat se remet à zéro pour les conversations régulières.</p>
                    </div>
                `,
                image: "tab_overview.png",
                imageAlt: "Aperçu du Visual Design Studio",
                imageCaption: "Interface de l'onglet Créations montrant la sélection de modèle et la zone de téléchargement",
            },
            {
                id: "artworks-workflow",
                title: "Flux de travail de design et modes",
                content: `
                <h4>Flux de travail complet</h4>
                <ol>
                    <li><strong>Sélectionner le modèle visuel</strong> - Choisissez dans le menu déroulant (sélection sauvegardée pour les futures sessions)</li>
                    <li><strong>Choisir le mode de design</strong> - Sélectionnez Transfert de style HTML, Superposition de texte, ou Justification de design</li>
                    <li><strong>Télécharger l'image</strong> - Glissez/déposez ou cliquez pour télécharger (le système analyse les dimensions et l'orientation)</li>
                    <li><strong>Écrire les instructions</strong> - Fournissez des conseils spécifiques (le texte d'espace réservé change selon le mode)</li>
                    <li><strong>Générer et prévisualiser</strong> - Cliquez sur "Générer le design" ou appuyez sur Entrée ; les résultats s'ouvrent dans une fenêtre de prévisualisation interactive</li>
                </ol>
                
                <h4>Modes de design expliqués</h4>
                
                <h5>Transfert de style HTML</h5>
                <ul>
                    <li>Convertit les éléments de design visuel en code HTML/CSS fonctionnel</li>
                    <li>Extrait les schémas de couleur, les mises en page et les motifs de style</li>
                    <li>Option pour "Utiliser comme image de fond" incorpore l'image téléchargée réelle</li>
                    <li>Parfait pour transformer l'inspiration de design en interfaces web</li>
                </ul>
                
                <h5>Superposition de texte</h5>
                <ul>
                    <li>Analyse les images pour trouver les zones de placement de texte optimales</li>
                    <li>Génère du HTML/CSS responsive pour les superpositions de texte</li>
                    <li>Considère les dimensions et l'orientation de l'image pour un positionnement approprié</li>
                    <li>Idéal pour les matériaux marketing, bannières et présentations de produits</li>
                </ul>
                
                <h5>Justification de design</h5>
                <ul>
                    <li>Fournit une analyse professionnelle des choix et principes de design</li>
                    <li>Explique la théorie des couleurs, la typographie, la mise en page et la hiérarchie visuelle</li>
                    <li>Offre des insights sur l'impact de l'expérience utilisateur</li>
                    <li>Excellent pour apprendre les principes de design ou comprendre les designs réussis</li>
                </ul>
                
                <h4>Gestion des images</h4>
                <ul>
                    <li><strong>Processus de téléchargement</strong> - Le système affiche les dimensions, l'orientation (Paysage/Portrait/Carré) et le ratio d'aspect</li>
                    <li><strong>Option d'arrière-plan</strong> - En mode Transfert de style, choisissez d'inclure l'image réelle dans le code généré</li>
                    <li><strong>Remplacer les images</strong> - Cliquez sur "×" sur la prévisualisation pour télécharger une nouvelle image</li>
                </ul>
                
                <div class="note">
                    <p><strong>Conseil :</strong> Appuyez sur Entrée (sans Shift) dans le champ d'instructions pour commencer immédiatement la génération lorsque toutes les exigences sont remplies.</p>
                </div>
            `,
            },
            {
                id: "artworks-examples",
                title: "Exemples d'instructions et meilleures pratiques",
                content: `
                <h4>Exemples de transfert de style HTML</h4>
                
                <h5>Site web brutaliste (exemple complet)</h5>
                <p class="example-prompt">"Créer un site web de style brutaliste avec tous les boutons d'en-tête habituels et les liens de pied de page, créer un bouton au milieu de la fenêtre d'affichage qui dit 'se connecter', utiliser les couleurs de l'image pour la palette de couleurs du site web sur tous les composants y compris la couleur de fond pour la page et le pied de page/en-tête (les rendre semi-transparents), s'assurer que l'image de fond remplit le corps de la page web et que le pied de page soit collé au bas de la fenêtre d'affichage"</p>
                
                <h5>Site e-commerce moderne</h5>
                <p class="example-prompt">"Transformer ceci en une page produit e-commerce moderne avec une barre de navigation propre, une section galerie de produits, une zone d'avis clients et un bouton proéminent 'Ajouter au panier'. Utiliser le schéma de couleurs de l'image et créer une mise en page minimaliste avec beaucoup d'espace blanc."</p>
                
                <h5>Portfolio créatif</h5>
                <p class="example-prompt">"Créer un site web de portfolio créatif avec une section héros plein écran, un menu de navigation animé, une grille de présentation de projets et un formulaire de contact. Extraire la palette de couleurs artistique de l'image et l'appliquer dans tout le design avec des dégradés subtils et des effets de survol."</p>
                
                <h5>Page d'atterrissage d'entreprise</h5>
                <p class="example-prompt">"Concevoir une page d'atterrissage d'entreprise professionnelle avec une navigation d'en-tête, une section héros avec appel à l'action, une section de fonctionnalités à trois colonnes, un carrousel de témoignages et un pied de page avec des liens d'entreprise. Utiliser la palette de couleurs sophistiquée de l'image pour transmettre confiance et autorité."</p>
                
                <h5>Site restaurant/alimentaire</h5>
                <p class="example-prompt">"Transformer ceci en un site web de restaurant appétissant avec des sections de menu, un formulaire de réservation, une galerie photo de plats, l'histoire du chef et des informations de localisation. Utiliser les couleurs chaudes et invitantes de l'image alimentaire pour créer une atmosphère confortable et accueillante."</p>
                
                <h4>Exemples de superposition de texte</h4>
                
                <h5>Présentation de produit</h5>
                <p class="example-prompt">"Ajouter le texte suivant à cette image de produit : Titre principal : 'Casques sans fil premium', Sous-titre : 'Expérience sonore immersive', Fonctionnalités clés : 'Réduction de bruit • Batterie 30h • Bluetooth 5.0', Prix : '149,99€', Bouton d'appel à l'action : 'Acheter maintenant'"</p>
                
                <h5>Promotion d'événement</h5>
                <p class="example-prompt">"Créer une superposition de texte promotionnelle : Titre de l'événement : 'Festival de musique d'été 2024', Date : '15-17 juillet 2024', Lieu : 'Central Park, NYC', Têtes d'affiche : 'Artistes vedettes à annoncer', Info billets : 'Tarif précoce 89€', Bouton : 'Obtenir des billets'"</p>
                
                <h4>Exemples de justification de design</h4>
                
                <h5>Analyse de mise en page</h5>
                <p class="example-prompt">"Analyser la mise en page et la composition de ce design. Expliquer comment la hiérarchie visuelle guide l'attention de l'utilisateur et comment les choix d'espacement et d'alignement impactent la lisibilité et le flux utilisateur."</p>
                
                <h5>Psychologie des couleurs</h5>
                <p class="example-prompt">"Examiner les choix de couleurs dans ce design et expliquer leur impact psychologique. Comment ces couleurs affectent-elles les émotions et la prise de décision des utilisateurs ? Que communique cette palette de couleurs sur la marque ?"</p>
                
                <h4>Rédiger des instructions efficaces</h4>
                <ul>
                    <li><strong>Être spécifique</strong> - Inclure le style de design, le public cible et les composants clés nécessaires</li>
                    <li><strong>Mentionner les éléments d'image</strong> - Référencer des couleurs, mises en page ou fonctionnalités spécifiques de votre image téléchargée</li>
                    <li><strong>Définir l'objectif</strong> - Expliquer le but (marketing, portfolio, e-commerce, etc.)</li>
                    <li><strong>Demander des fonctionnalités</strong> - Spécifier le comportement responsive, les animations ou les éléments interactifs</li>
                </ul>
                
                <h4>Choisir les bonnes images</h4>
                <ul>
                    <li><strong>Transfert de style</strong> - Utiliser des images avec des éléments de design distincts et des schémas de couleurs clairs</li>
                    <li><strong>Superposition de texte</strong> - Sélectionner des images avec des zones claires pour le placement de texte</li>
                    <li><strong>Justification de design</strong> - Choisir des designs professionnels avec des éléments intentionnels</li>
                    <li><strong>La qualité compte</strong> - Les images haute résolution avec un bon éclairage produisent de meilleurs résultats</li>
                </ul>
                
                <div class="note">
                    <p><strong>Conseil pro :</strong> Lors de l'utilisation de "Utiliser comme image de fond" en mode Transfert de style HTML, le système gère automatiquement l'intégration d'image avec des commentaires d'espace réservé montrant exactement où l'image est utilisée.</p>
                </div>
            `,

                images: [
                    {
                        src: "artworks_examples.png",
                        alt: "Exemples d'instructions",
                        caption:
                            "Exemple d'instructions de design pour un prototype de promo de casque",
                    },
                    {
                        src: "artworks_examples2.png",
                        alt: "Résultat final du prototype",
                        caption: "Exemple de prototype de design pour une promo de casque",
                    },
                ]

            },
            {
                id: "artworks-results-management",
                title: "Travailler avec les résultats et dépannage",
                content: `
                <h4>Processus de génération</h4>
                <ul>
                    <li><strong>Fenêtre de progression</strong> - Montre l'IA analysant votre image (typiquement 30-60 secondes)</li>
                    <li><strong>Annuler à tout moment</strong> - Cliquez sur le bouton fermer dans la fenêtre de progression pour arrêter la génération</li>
                    <li><strong>Affichage des résultats</strong> - La sortie apparaît directement en mode prévisualisation</li>
                </ul>
                
                <h4>Fenêtre de prévisualisation interactive</h4>
                <p>Les résultats s'ouvrent dans une fenêtre flottante où vous pouvez :</p>
                <ul>
                    <li><strong>Changer de vue</strong> - Basculer entre la vue code et la prévisualisation en direct</li>
                    <li><strong>Éditer directement</strong> - Modifier le code généré en temps réel</li>
                    <li><strong>Copier le code</strong> - Utiliser pour vos propres projets</li>
                    <li><strong>Exporter PNG</strong> - Sauvegarder une capture d'écran du design</li>
                </ul>
                
                <h4>Travailler avec le code généré</h4>
                <ul>
                    <li><strong>Point de départ</strong> - Considérer le code comme une base que vous pouvez affiner davantage</li>
                    <li><strong>Test navigateur</strong> - Tester sur différents navigateurs et tailles d'écran</li>
                    <li><strong>Édition directe</strong> - Modifier et prévisualiser le code directement dans la fenêtre de résultat</li>
                    <li><strong>Régénération</strong> - Essayer à nouveau avec des instructions plus spécifiques si nécessaire</li>
                </ul>
                
                <h4>Important : URLs d'image temporaires créées pour l'utilisation en arrière-plan pendant la génération</h4>
                <div class="warning">
                    <p><strong>Remplacer les URLs Blob avant le déploiement :</strong></p>
                    <ul>
                        <li>Le code généré contient des URLs blob temporaires comme <code>blob:http://localhost:8182/...</code></li>
                        <li>Celles-ci sont stockées en mémoire pour la prévisualisation uniquement et ne fonctionneront pas en dehors de votre session</li>
                        <li>Cherchez les propriétés CSS comme <code>background-image: url('blob:http://...')</code></li>
                        <li>Remplacez les URLs blob par des chemins vers vos fichiers d'image réels avant d'utiliser le code</li>
                    </ul>
                </div>
                
                <h4>Dépannage des problèmes courants</h4>
                
                <h5>Échecs de génération</h5>
                <ul>
                    <li><strong>Solution :</strong> Essayez un modèle visuel différent ou une image plus petite</li>
                    <li><strong>Prévention :</strong> Utilisez des images claires avec des éléments de design distincts</li>
                    <li><strong>Réessayer :</strong> En raison de la nature probabiliste des modèles IA, vous devriez réessayer plusieurs fois avant d'abandonner</li>
                </ul>
                
                <h5>Performance lente</h5>
                <ul>
                    <li><strong>Solution :</strong> Utilisez des images plus petites, simplifiez les instructions, utilisez des modèles IA plus petits</li>
                    <li><strong>Note :</strong> Les designs complexes et les images plus grandes nécessitent plus de temps de traitement</li>
                </ul>
                
                <h5>Sortie de code incomplète</h5>
                <ul>
                    <li><strong>Solution :</strong> Demandez à l'IA de continuer ou compléter le code dans le chat régulier après la génération</li>
                    <li><strong>Alternative :</strong> Divisez les demandes complexes en générations plus petites et spécifiques</li>
                </ul>
                
                <h5>Mauvais placement de texte (mode superposition)</h5>
                <ul>
                    <li><strong>Solution :</strong> Spécifiez les positions préférées dans vos instructions</li>
                    <li><strong>Exemple :</strong> "Placer le titre dans le coin supérieur gauche, le prix dans le coin inférieur droit"</li>
                </ul>
                
                <div class="note">
                    <p><strong>Conseil de performance :</strong> Le traitement visuel est intensif en ressources. Pour de meilleurs résultats, fermez les applications inutiles et utilisez des images de haute qualité et clairement composées.</p>
                </div>
            `,
                image: "artworks_examples3.png",
                imageAlt: "Gestion des résultats",
                imageCaption: "La fenêtre de prévisualisation interactive avec capacités d'édition et d'export",
            },
        ],
    },
    presentation: {
        title: "Présentation",
        intro: "Créez des diaporamas à partir de documents en utilisant l'extraction assistée par IA et un éditeur de prévisualisation.",
        articles: [
            {
                id: "presentation-overview",
                title: "Aperçu",
                content: `
            <p>L'onglet Présentation convertit les documents pris en charge (.pdf, .docx, .txt, .md) en une séquence de diapositives. L'onglet extrait le texte de votre fichier, utilise l'IA pour générer le contenu des diapositives, récupère éventuellement des images pour les diapositives et ouvre une prévisualisation interactive où vous pouvez examiner et exporter le résultat.</p>
            <p>Flux rapide :</p>
            <ol>
                <li>Téléversez un document en le glissant-déposant ou via le bouton Parcourir.</li>
                <li>Choisissez le nombre de diapositives et le nombre de puces par diapositive.</li>
                <li>Ajoutez un prompt supplémentaire optionnel pour contrôler le ton ou le style.</li>
                <li>Cliquez sur Générer pour lancer l'extraction et la génération par IA.</li>
                <li>Examinez et éditez les diapositives dans la fenêtre de prévisualisation, puis exportez.</li>
            </ol>
        `,
                image: "tab_overview.png",
                imageAlt: "Aperçu de l'onglet Présentation",
                imageCaption: "Aperçu de l'onglet Présentation",
            },
            {
                id: "presentation-direct-copy",
                title: "Mode Copie directe",
                content: `
            <p>Utilisez Copie directe lorsque votre document contient déjà du texte prêt pour les diapositives que vous souhaitez conserver exactement tel quel. L'IA ne fait que structurer et découper le contenu ; elle ne paraphrase pas.</p>

            <h4>Comment préparer votre document</h4>
            <ul>
                <li><strong>Étiquetez les diapositives explicitement :</strong> ajoutez "cover:" pour la première diapositive, puis "Slide 1:", "Slide 2:", etc. dans l'ordre.</li>
                <li><strong>Texte de couverture :</strong> après "cover:" ajoutez un titre et éventuellement un sous-titre séparé par une virgule.</li>
                <li><strong>Une section par diapositive :</strong> placez le texte de chaque diapositive juste après son étiquette ; gardez l'ordre et la langue cohérents.</li>
                <li><strong>Ajustez le nombre de puces :</strong> réglez le sélecteur de puces par diapositive selon le découpage souhaité. L'IA découpe de façon séquentielle sans reformulation et remplit avec des chaînes vides si nécessaire.</li>
                <li><strong>Restez dans le contexte :</strong> gardez un volume de texte raisonnable (le sélecteur de contexte fixe la longueur maximale) pour que toutes les diapositives étiquetées soient prises en compte.</li>
            </ul>

            <h4>Comment exécuter Copie directe</h4>
            <ol>
                <li>Sélectionnez "Copie directe" dans le sélecteur de mode.</li>
                <li>Définissez le nombre de diapositives et de puces par diapositive (la diapositive 1 est toujours la couverture).</li>
                <li>Déposez votre document étiqueté ou collez le texte, et ajoutez éventuellement un prompt supplémentaire pour de petites consignes (par exemple : casse ou espacement).</li>
                <li>Cliquez sur Générer ; la sortie reflète votre formulation. Les diapositives ou puces manquantes restent des chaînes vides plutôt que réécrites.</li>
            </ol>

            <p>Astuce : si vous constatez des reformulations inattendues, vérifiez que le mode est "Copie directe" et que les étiquettes sont écrites exactement ("Slide 1:", "Slide 2:", etc.).</p>
        `,
                image: "tab_overview.png",
                imageAlt: "Mode Copie directe",
                imageCaption: "Étiquetez les diapositives et lancez Copie directe",
            },
            {
                id: "presentation-promptable",
                title: "Présentation configurable par prompt",
                content: `
            <p><strong>Présentation configurable par prompt</strong> ouvre un espace de travail plein écran dédié à la création de decks par consignes.</p>
            <ul>
                <li><strong>Nombre de diapositives</strong> — choisissez le nombre exact (1 à 20).</li>
                <li><strong>Ajouter du texte</strong> — ouvre une fenêtre flottante pour coller un texte source volumineux.</li>
                <li><strong>Persistance du texte</strong> — si vous fermez puis rouvrez la fenêtre, le texte précédemment enregistré réapparaît.</li>
                <li><strong>Flux Envoyer</strong> — Envoyer construit automatiquement le prompt utilisateur avec le nombre de diapositives et le texte enregistré.</li>
                <li><strong>Demande supplémentaire (optionnelle)</strong> — utilisez le bouton Demande supplémentaire pour préciser le style/la mise en page (par exemple : « utiliser des couleurs rouges » ou « cadres d'image arrondis ») ; si fournie, elle est ajoutée avant le texte source principal dans le prompt.</li>
                <li><strong>Sélection du mode</strong> — utilisez le <strong>Mode interactif</strong> pour des présentations naviguées avec des boutons <strong>Précédent/Suivant</strong>, ou le <strong>Mode défilant</strong> pour des présentations parcourues de haut en bas.</li>
                <li><strong>Bascule de recherche web</strong> — après <strong>Envoyer</strong>, utilisez la bascule <strong>Web</strong> pour construire le contenu de la présentation à partir des résultats web en utilisant le contenu de Add text comme prompt de recherche ; lorsqu'elle est active, le bouton devient <strong>Prompt de recherche web</strong>.</li>
                <li><strong>Astuce prompt web</strong> — dans ce mode, saisissez uniquement le sujet à traiter pour la présentation. Évitez des formulations comme « créer une présentation sur... », car elles peuvent influencer la recherche web ; indiquez seulement le sujet.</li>
                <li><strong>Astuce remplacement d'image</strong> — si une image ne se charge pas, ou si vous voulez simplement la remplacer, cliquez sur l'image dans l'aperçu puis lancez une recherche d'images pour la remplacer.</li>
                <li><strong>Astuce édition de texte</strong> — les zones de texte sont directement modifiables dans l'aperçu, afin de faire vos retouches finales avant d'enregistrer la présentation HTML.</li>
                <li><strong>Modèle recommandé</strong> — pour cette fonctionnalité, <strong>GLM 4.7 Flash</strong> est un très bon modèle de présentation.</li>
                <li><strong>Présentations enregistrées</strong> — les decks HTML peuvent être enregistrés chiffrés en base et listés dans la barre latérale droite.</li>
                <li><strong>Ouverture depuis la barre latérale</strong> — cliquez sur une présentation enregistrée pour la charger dans la zone de prévisualisation paysage.</li>
                <li><strong>Sécurité de suppression</strong> — une confirmation est demandée avant suppression.</li>
            </ul>
            <p>Conseil : structurez le texte source en sections logiques et choisissez un nombre de diapositives réaliste pour un meilleur résultat.</p>
        `,
                image: "tab_overview.png",
                imageAlt: "Flux de présentation configurable par prompt",
                imageCaption: "Espace de travail et contrôles de présentation configurable par prompt",
            },
            {
                id: "presentation-generating",
                title: "Génération de présentations",
                content: `
            <p>Après avoir cliqué sur Générer, le système effectue plusieurs étapes et affiche une fenêtre modale de progression :</p>
            <ul>
                <li><strong>Extraction du texte</strong> — le texte du document est extrait pour être consommé par l'IA.</li>
                <li><strong>Génération par IA</strong> — l'IA transforme le texte extrait en contenu de diapositives (le prompt supplémentaire est inclus si fourni).</li>
                <li><strong>Analyse et images</strong> — la sortie de l'IA est analysée en diapositives structurées et les images sont téléchargées si elles sont disponibles.</li>
                <li><strong>Gestion des erreurs</strong> — l'onglet réessaie automatiquement une fois en cas de réponses IA mal formées ; les erreurs sont affichées dans la modale de chargement.</li>
            </ul>
            <p>Vous pouvez annuler la génération à tout moment en utilisant le bouton fermer/abort dans la modale de chargement. L'annulation arrêtera les tâches en arrière-plan et fermera la modale.</p>
        `,
                image: "generating_presentation.png",
                imageAlt: "Génération de présentations",
                imageCaption: "Processus de génération et indicateurs de progression",
            },
            {
                id: "presentation-preview-export",
                title: "Aperçu, édition et export",
                content: `
            <p>Lorsque la génération réussit, une fenêtre de prévisualisation en plein écran s'ouvre. Principales fonctionnalités de la prévisualisation :</p>
            <ul>
                <li><strong>Vue large de la diapositive</strong> — consultez la diapositive actuellement sélectionnée rendue en HTML.</li>
                <li><strong>Vignettes</strong> — naviguez entre les diapositives avec la barre de vignettes et accédez à n'importe quelle diapositive.</li>
                <li><strong>Édition en ligne</strong> — modifiez le texte de la diapositive directement dans la prévisualisation (la prévisualisation applique les données de la diapositive via l'API PreviewWindow).</li>
                <li><strong>Options d'export</strong> — utilisez les contrôles de prévisualisation pour copier le texte de la diapositive, exporter des images ou télécharger le HTML (le menu d'export précis est fourni par l'UI de prévisualisation).</li>
            </ul>
            <p>Conseils : maintenez le texte du document clair pour une meilleure extraction, utilisez un nombre raisonnable de diapositives relatif à la longueur du contenu et ajoutez un prompt supplémentaire lorsque vous avez besoin d'un ton ou d'un style spécifique.</p>
        `,
                image: "preview_editing_export.png",
                imageAlt: "Aperçu et export",
                imageCaption: "Fenêtre de prévisualisation, édition et options d'export",
            },
            {
                id: "presentation-sidebar",
                title: "Barre latérale de Présentation",
                content: `
            <p>La barre latérale de Présentation fournit des contrôles par diapositive et globaux pour styliser les diapositives, éditer le texte, gérer les images et appliquer des modifications de texte assistées par IA.</p>
            <h4>Onglets</h4>
            <ul>
                <li><strong>Style</strong> — choisissez et appliquez des styles de présentation (cartes préconstruites comme Classique, Mode sombre, Produit, Corporate et de nombreux presets de thème). Le style <em>DIY</em> ouvre un gestionnaire de styles où vous pouvez créer ou réutiliser des styles personnalisés stockés localement.</li>
                <li><strong>Texte</strong> — contient des contrôles de texte globaux (police, couleur, puces) et des contrôles spécifiques au nœud pour les éléments de texte sélectionnés.</li>
                <li><strong>Image</strong> — outils d'image incluant importer/remplacer, changer l'image de couverture, rechercher des images par description et une galerie de vignettes pour un remplacement rapide.</li>
            </ul>

            <h4>Contrôles globaux vs sélectionnés</h4>
            <p>L'onglet Texte expose des contrôles globaux appliqués aux puces et aux styles de texte par défaut. Lorsque vous sélectionnez un nœud de texte sur une diapositive, des contrôles spécifiques au nœud apparaissent (taille de police, sélecteur de couleur, modification IA) permettant des ajustements par nœud.</p>

            <h4>Modification de texte par IA</h4>
            <ul>
                <li>Entrez une instruction dans la zone de texte IA (exemple : "Traduire en français" ou "Rendre ces puces plus concises").</li>
                <li>Utilisez le bouton <em>Modifier</em> pour appliquer les changements aux nœuds actuellement sélectionnés.</li>
                <li>Activez l'interrupteur <em>Appliquer à tout le texte</em> pour exécuter la modification sur tous les nœuds de texte correspondants ; la barre latérale tentera une exécution par lots avec rapport de progression lorsque disponible.</li>
                <li>Le bouton Modifier bascule en <em>Annuler</em> pendant l'exécution — il interrompt l'opération via le SlideForge AbortController partagé.</li>
            </ul>

            <h4>Outils d'image</h4>
            <ul>
                <li><strong>Importer une image</strong> — remplace l'image sélectionnée de la diapositive ou, lorsqu'activé, remplace l'image de couverture de la première diapositive.</li>
                <li><strong>Changer la couverture</strong> — flux compatible helper pour remplacer une image de couverture sur une étape complète ; revient au flux d'importation standard si aucun helper n'est disponible.</li>
                <li><strong>Rechercher des images</strong> — saisissez une description et cliquez sur Rechercher ; les résultats remplissent la grille de vignettes où vous pouvez choisir une image pour remplacer celle sélectionnée.</li>
                <li>La grille de vignettes est dimensionnée pour afficher plusieurs lignes et fournit des messages de progression/état pendant l'importation ou le remplacement d'images.</li>
            </ul>

            <h4>Cartes de style et DIY</h4>
            <p>Les cartes de style vous permettent d'appliquer rapidement des thèmes visuels. La carte DIY ouvre le gestionnaire de styles si des styles personnalisés existent (en mémoire ou dans la BD) ou lance une modale de création. Les cartes reflètent visuellement la disponibilité et l'état de sélection.</p>

            <h4>Intégration avec les helpers</h4>
            <p>La barre latérale repose sur des helpers de sélection attachés aux étapes de la présentation pour effectuer le remplacement d'images, les éditions IA par lots et les opérations sur les nœuds. Si aucun helper n'est trouvé, la barre latérale affiche des messages utiles et bascule vers les flux globaux disponibles.</p>
        `,
                image: "sidebar_controls.png",
                imageAlt: "Barre latérale de présentation",
                imageCaption: "Contrôles de la barre latérale pour le style, le texte et les images",
            },
            {
                id: "presentation-export-note",
                title: "Exporter en PDF : ce qui est exporté",
                content: `
            <p><strong>Remarque :</strong> Le bouton <em>Export PDF</em> exporte la présentation exactement telle qu'elle apparaît à l'écran — y compris le texte des diapositives, les images, les formes et les éléments d'arrière-plan.</p>
        `,
                image: "export_slides.png",
                imageAlt: "Remarque Exporter en PDF",
                imageCaption: "Exporte les diapositives telles qu'elles sont affichées dans la prévisualisation",
            },
        ],
    },
    // Section de l'onglet Traduire
    artifacts: {
        title: "Artefacts",
        intro: "L'onglet Artefacts est un espace dedie pour generer des artefacts HTML interactifs, les affiner avec l'IA et enregistrer des resultats reutilisables.",
        articles: [
            {
                id: "artifacts-overview",
                title: "Vue d'ensemble",
                content: `
            <p>L'onglet Artefacts se concentre sur la generation d'artefacts HTML dans un flux plein ecran. Il est utile pour creer des prototypes, des pages d'atterrissage, des extraits interactifs et des experiences visuelles a partir de prompts.</p>
            <ul>
                <li><strong>Sortie principale</strong> - l'IA renvoie du HTML/CSS/JS executable et l'ouvre dans la zone d'aperçu.</li>
                <li><strong>Boucle d'iteration</strong> - demandez des modifications, regenerez, puis verifiez le comportement dans le meme espace.</li>
                <li><strong>Compatibilite des modeles</strong> - fonctionne avec les modeles locaux ou cloud disponibles dans le selecteur.</li>
            </ul>
        `,
            },
            {
                id: "artifacts-controls",
                title: "Boutons et controles",
                content: `
            <p>Les controles de l'en-tete sont conçus pour iterer rapidement sur les prompts :</p>
            <ul>
                <li><strong>Web / Web actif</strong> - active ou desactive le mode assiste par le web ; le libelle change lorsqu'il est actif.</li>
                <li><strong>Envoyer</strong> - envoie le prompt et lance la generation.</li>
                <li><strong>Barre de progression</strong> - apparait dans l'en-tete pendant l'execution de la requete.</li>
                <li><strong>Annuler</strong> - arrete la generation en cours si necessaire.</li>
            </ul>
            <p>Conseil : structurez votre prompt (objectif, mise en page, interactions, contraintes) pour ameliorer la qualite du premier resultat.</p>
        `,
            },
            {
                id: "artifacts-saved",
                title: "Artefacts enregistres et historique des prompts",
                content: `
            <p>Les artefacts generes peuvent etre stockes dans la base locale chiffree puis reouverts plus tard depuis la barre laterale.</p>
            <ul>
                <li><strong>Enregistrer</strong> - enregistre la sortie actuelle pour une reutilisation ulterieure.</li>
                <li><strong>Ouverture depuis la barre laterale</strong> - cliquez sur une entree enregistree pour la recharger dans l'aperçu.</li>
                <li><strong>Bouton Prompt</strong> - affiche le prompt utilise pour creer cet artefact.</li>
                <li><strong>Copier le prompt</strong> - copie le prompt enregistre depuis la boite de dialogue pour le reutiliser ou l'ameliorer.</li>
                <li><strong>Supprimer</strong> - supprime les artefacts enregistres devenus inutiles.</li>
            </ul>
            <p>Ce flux permet de constituer une bibliotheque reutilisable des resultats et de leurs instructions d'origine.</p>
        `,
            },
        ],
    },

    translate: {
        title: "Traduire",
        intro: "L'onglet Traduire convertit le texte des documents avec l'IA et fournit une fenêtre d'aperçu flottante pour la révision, les mises à jour en direct et l'export.",
        articles: [
            {
                id: "translate-overview",
                title: "Vue d'ensemble",
                content: `
            <p>L'onglet Traduire est un flux orienté document pour traduire des fichiers et vérifier le résultat avant export.</p>

            <h4>Formats pris en charge</h4>
            <ul>
                <li><strong>PDF</strong> - aperçu avec superposition éditable et rendu par page</li>
                <li><strong>TXT</strong> - traduction de texte brut avec conservation des lignes et paragraphes</li>
                <li><strong>MD</strong> - traduction compatible Markdown avec conservation de la structure</li>
            </ul>

            <h4>Contrôles principaux</h4>
            <ul>
                <li><strong>Zone glisser-déposer</strong> - déposez un fichier ou cliquez pour parcourir</li>
                <li><strong>Sélecteur de portée</strong> - choisissez Selection, Page ou Document avant de lancer la traduction</li>
                <li><strong>Champ d'instruction</strong> - par exemple <em>"Traduire ce document en français"</em></li>
                <li><strong>Bouton Traduire</strong> - démarre la traduction du document courant</li>
                <li><strong>Exporter le document traduit</strong> - exporte le résultat depuis l'état actuel de l'aperçu</li>
            </ul>

            <h4>Sélecteur de portée</h4>
            <ul>
                <li><strong>Selection</strong> - cible une ou plusieurs pages sélectionnées dans l'aperçu.</li>
                <li><strong>Page</strong> - cible uniquement la page actuellement sélectionnée.</li>
                <li><strong>Document</strong> - cible tout le document (toutes les pages/blocs).</li>
            </ul>

            <div class="note">
                <p><strong>Conseil :</strong> Pour une meilleure qualité, utilisez un modèle orienté traduction comme TranslateGemma depuis la bibliothèque de modèles.</p>
            </div>
        `,
                image: "Translate-1.png",
                imageAlt: "Aperçu de l'onglet Traduire",
                imageCaption: "L'interface de l'onglet Traduire avec la zone de glisser-déposer",
            },
            {
                id: "translate-preview",
                title: "Fenêtre d'aperçu flottante",
                content: `
            <p>Après le chargement d'un document, Traduire ouvre une fenêtre flottante où vous pouvez inspecter et affiner les résultats.</p>

            <h4>Contrôles de la fenêtre</h4>
            <ul>
                <li><strong>Maximiser/restaurer</strong> - alterne entre un espace compact et étendu</li>
                <li><strong>Fermer/rouvrir</strong> - fermez l'aperçu puis utilisez <em>Ouvrir la fenêtre d'aperçu</em> pour le réafficher</li>
            </ul>

            <h4>Comportement PDF</h4>
            <ul>
                <li>Les blocs de texte sont mappés sur les pages PDF et peuvent être modifiés directement.</li>
                <li>Les mises à jour de traduction en streaming s'appliquent progressivement aux blocs correspondants.</li>
                <li>Vous pouvez relire et ajuster le texte traduit avant l'export.</li>
            </ul>

            <h4>Comportement TXT / MD</h4>
            <ul>
                <li>L'aperçu utilise une mise en page de type document pour une lecture plus claire.</li>
                <li>Les remplacements en streaming mettent à jour le contenu progressivement (pas uniquement à la fin).</li>
                <li>Les sauts de ligne et la structure du document sont préservés autant que possible.</li>
            </ul>
        `,
                image: "Translate-2.png",
                imageAlt: "Aperçu de la fenêtre Traduire",
                imageCaption: "La fenêtre Traduire affichant les contrôles et un PDF chargé",
            },
            {
                id: "translate-export-troubleshooting",
                title: "Export et dépannage",
                content: `
            <p>Utilisez l'option d'export après vérification pour enregistrer le résultat traduit.</p>

            <h4>Sortie d'export</h4>
            <ul>
                <li><strong>Entrée PDF</strong> - export en PDF traduit</li>
                <li><strong>Entrée TXT</strong> - exporté en <code>-translated.txt</code></li>
                <li><strong>Entrée MD</strong> - exporté en <code>-translated.md</code></li>
            </ul>

            <h4>Cas fréquents</h4>
            <ul>
                <li><strong>Pas de texte PDF extractible</strong> - les PDF scannés/image peuvent ne pas fournir de blocs éditables.</li>
                <li><strong>Qualité insuffisante</strong> - affinez l'instruction ou choisissez un meilleur modèle de traduction.</li>
                <li><strong>Flux de contexte</strong> - après des changements de traduction, fermer l'aperçu peut déclencher le flux de continuation dans le Chat.</li>
            </ul>

            <div class="note">
                <p><strong>Note :</strong> La traduction dans cet onglet est orientée document. Ajoutez des contraintes de ton/style dans le champ d'instruction si nécessaire.</p>
            </div>
        `,
            },
        ],
    },
    models: {
        title: "Modèles",
        intro:
            "L'onglet Modèles vous permet de parcourir, télécharger et gérer les modèles IA d'Ollama utilisés par Paiperwork avec un contrôle local complet.",
        articles: [
            {
                id: "models-intro",
                title: "Introduction aux Modèles",
                content: `
                <p>L'onglet Modèles fournit une interface centrale pour gérer les modèles IA qui alimentent votre expérience Paiperwork.</p>
                
                <p>Les principales fonctionnalités de l'onglet Modèles incluent :</p>
                <ul>
                    <li>Parcourir les modèles disponibles dans la bibliothèque Ollama</li>
                    <li>Télécharger de nouveaux modèles sur votre système local</li>
                    <li>Gérer vos modèles installés</li>
                    <li>Configurer les paramètres des modèles pour des performances optimales</li>
                    <li>Supprimer les modèles dont vous n'avez plus besoin</li>
                </ul>
                
                <p>Tous les modèles s'exécutent localement sur votre appareil via Ollama, garantissant que vos données restent privées et sécurisées tout en bénéficiant de puissantes capacités IA.</p>
                
                <h4>Modèles de Raisonnement</h4>
                <p>Certains modèles spécialisés ont des capacités de raisonnement améliorées qui peuvent être activées avec des invites système spécifiques :</p>
                <ul>
                    <li><strong>Cogito</strong> et d'autres modèles axés sur le raisonnement peuvent nécessiter une invite système spéciale pour activer toutes leurs capacités</li>
                    <li>Pour les modèles Cogito, ajoutez <code>"Enable deep thinking subroutine."</code> (sans guillemets) à votre invite système</li>
                    <li>Cela active les fonctionnalités de raisonnement avancé, permettant une pensée plus structurée et étape par étape</li>
                    <li>Différents modèles de raisonnement peuvent avoir différentes phrases d'activation - consultez la documentation du modèle pour les détails</li>
                </ul>
                
                <div class="note">
                    <p><strong>Note :</strong> Les modèles dans Paiperwork sont alimentés par Ollama, qui doit être installé et en cours d'exécution sur votre système. La disponibilité des modèles dépend de votre installation locale d'Ollama.</p>
                </div>
            `,
                image: "models_intro.png",
                imageAlt: "Aperçu de l'Onglet Modèles",
                imageCaption:
                    "L'interface de l'onglet Modèles montrant les sections modèles disponibles et locaux",
            },
            {
                id: "models-browsing",
                title: "Parcourir les Modèles Disponibles",
                content: `
                <p>Paiperwork vous permet de parcourir toute la bibliothèque de modèles Ollama directement depuis l'interface de l'application.</p>
                
                <h4>Récupérer les Modèles Disponibles</h4>
                <ol>
                    <li>Naviguez vers l'onglet Modèles</li>
                    <li>Cliquez sur le bouton "Récupérer les Modèles Ollama" en haut de l'écran</li>
                    <li>Attendez que Paiperwork se connecte à la bibliothèque Ollama</li>
                    <li>Une fois terminé, un message de statut confirmera combien de modèles ont été trouvés</li>
                </ol>
                
                <h4>Explorer les Options de Modèles</h4>
                <p>Après avoir récupéré les modèles, vous pouvez :</p>
                <ul>
                    <li>Parcourir les modèles en utilisant le sélecteur déroulant</li>
                    <li>Voir les descriptions des modèles qui expliquent leurs capacités</li>
                    <li>Voir les informations de popularité des modèles (nombre de téléchargements)</li>
                </ul>
                
                <h4>Types de Modèles</h4>
                <p>La bibliothèque Ollama inclut des modèles avec différentes spécialisations :</p>
                <ul>
                    <li><strong>Usage général</strong> - Modèles comme Gemma3, Llama, Qwen2.5 et Mistral pour les tâches quotidiennes</li>
                    <li><strong>Spécialisés en code</strong> - Modèles comme Qwen2.5 coder, CodeLlama et WizardCoder optimisés pour la programmation</li>
                    <li><strong>Capacités visuelles</strong> - Modèles comme Mistral3.1 et Gemma3 qui peuvent analyser les images</li>
                    <li><strong>Affinés</strong> - Modèles entraînés pour des cas d'usage spécifiques ou avec des caractéristiques particulières</li>
                </ul>
                
                <div class="note">
                    <p><strong>Conseil :</strong> Lisez attentivement les descriptions des modèles pour comprendre les forces et capacités de chaque modèle avant de les télécharger.</p>
                </div>
            `,
                image: "models_browsing.png",
                imageAlt: "Parcourir les Modèles Disponibles",
                imageCaption:
                    "Le menu déroulant de sélection de modèles affichant les modèles disponibles de la bibliothèque Ollama",
            },
            {
                id: "models-downloading",
                title: "Télécharger des Modèles",
                content: `
                    <p>Une fois que vous avez identifié un modèle que vous voulez utiliser, vous pouvez le télécharger directement sur votre système local.</p>
                    
                    <h4>Sélectionner une Taille de Modèle</h4>
                    <ol>
                        <li>Sélectionnez un modèle dans la liste déroulante</li>
                        <li>Examinez la description du modèle</li>
                        <li>Quand vous choisissez un modèle, les options de taille apparaîtront automatiquement</li>
                        <li>Sélectionnez la version de taille appropriée qui correspond à vos besoins et aux capacités de votre système</li>
                    </ol>
                    
                    <h4>Comprendre les Tailles de Modèles</h4>
                    <p>La plupart des modèles sont disponibles en plusieurs variantes de taille :</p>
                    <ul>
                        <li><strong>Tailles plus grandes</strong> (7B, 13B, 34B paramètres) - Ces modèles plus grands offrent une meilleure qualité mais nécessitent plus de VRAM (mémoire de carte graphique, dépassant la taille du modèle en raison de l'inclusion du contexte, veuillez noter que la résolution d'écran affectera l'utilisation de la mémoire), RAM (comme avec la VRAM, veuillez noter que votre système d'exploitation utilise aussi de la RAM, donc tout ne sera pas disponible pour l'utilisation modèle IA+contexte), et puissance de traitement (plus le CPU est rapide, mieux c'est).</li>
                        <li><strong>Tailles plus petites</strong> (3B, 1,5B paramètres) - Plus efficaces mais peuvent avoir des capacités réduites</li>
                        <li><strong>Versions quantifiées</strong> (Q4_K_M, Q5_K_S) - Modèles compressés qui utilisent moins de mémoire tout en maintenant la qualité</li>
                    </ul>
                    <h4>Exemple d'Exigences VRAM</h4>
                    <p>Pour vous donner une idée des exigences matérielles pour exécuter des modèles avec une fenêtre de contexte de 8K :</p>
                    <ul>
                        <li><strong>Petits modèles (3B)</strong> : ~4-6GB VRAM avec quantification (Q4/Q5)</li>
                        <li><strong>Modèles moyens (7B)</strong> : ~8-10GB VRAM avec quantification (Q4/Q5)</li>
                        <li><strong>Grands modèles (13B)</strong> : ~14-16GB VRAM avec quantification (Q4/Q5)</li>
                        <li><strong>Très grands modèles (34B+)</strong> : 24GB+ VRAM avec quantification (Q4/Q5)</li>
                    </ul>
                    <p>Ces exigences peuvent varier selon les modèles spécifiques et les configurations système. Considérez commencer avec des modèles plus petits ou plus fortement quantifiés si vous avez une VRAM limitée.</p>
                    
                    <h4>Démarrer le Téléchargement</h4>
                    <ol>
                        <li>Cliquez sur le bouton "Télécharger le Modèle"</li>
                        <li>Le bouton affichera les informations de progression du téléchargement</li>
                        <li>Un message de statut en dessous montrera l'opération actuelle (téléchargement, traitement)</li>
                        <li>Un bouton d'annulation apparaîtra vous permettant d'arrêter le téléchargement si nécessaire</li>
                    </ol>
                    
                    <h4>Processus de Téléchargement</h4>
                    <p>Pendant le téléchargement, vous verrez :</p>
                    <ul>
                        <li>Informations de progression montrant la taille téléchargée et la taille totale</li>
                        <li>Mises à jour de statut pour différentes étapes (récupération du manifeste, téléchargement des fichiers, vérification)</li>
                        <li>Le sélecteur de modèle, sélecteur de taille, et bouton "Récupérer les Modèles Ollama" seront désactivés pendant le téléchargement</li>
                        <li>Confirmation quand le téléchargement est terminé</li>
                    </ul>
                    
                    <h4>Annuler les Téléchargements</h4>
                    <p>Si vous devez annuler un téléchargement en cours :</p>
                    <ul>
                        <li>Cliquez sur le bouton "Annuler le Téléchargement" qui apparaît sous le bouton de téléchargement (Si vous voulez reprendre, cliquez à nouveau sur le bouton de téléchargement)</li>
                        <li>Confirmez l'annulation quand demandé</li>
                        <li>Après l'annulation, un message apparaîtra recommandant de redémarrer Ollama pour nettoyer les fichiers partiellement téléchargés</li>
                        <li>Ce message disparaîtra automatiquement après 30 secondes</li>
                        <li>Le sélecteur de modèle, sélecteur de taille, et bouton "Récupérer les Modèles Ollama" seront réactivés</li>
                    </ul>
                    
                    <h4>Basculer Entre les Onglets</h4>
                    <p>Si vous basculez vers un autre onglet pendant un téléchargement :</p>
                    <ul>
                        <li>Le téléchargement continuera en arrière-plan</li>
                        <li>Quand vous revenez à l'onglet Modèles, le statut de téléchargement actuel sera affiché</li>
                        <li>L'interface montrera quel fichier est actuellement en téléchargement et la progression globale</li>
                    </ul>
                    
                    <div class="note">
                        <p><strong>Important :</strong> Les téléchargements de modèles peuvent être volumineux (de centaines de Mo à centaines de Go). Assurez-vous d'avoir suffisamment d'espace disque et une connexion internet stable avant de commencer un téléchargement. Si vous devez récupérer de nouveaux modèles pendant qu'un téléchargement est en cours, vous devez d'abord annuler le téléchargement actuel.</p>
                    </div>
                `,
                image: "models_downloading.png",
                imageAlt: "Télécharger des Modèles",
                imageCaption: "L'interface de téléchargement de modèles montrant la progression du téléchargement et la sélection de taille",
            },
            {
                id: "models-managing",
                title: "Gérer les Modèles Locaux",
                content: `
                <p>Après avoir téléchargé des modèles, vous pouvez les gérer via la section Modèles Locaux de l'onglet Modèles.</p>
                
                <h4>Voir les Modèles Installés</h4>
                <p>La section Modèles Locaux montre tous les modèles actuellement installés sur votre système :</p>
                <ul>
                    <li>Les modèles sont listés dans un sélecteur déroulant</li>
                    <li>Sélectionnez un modèle pour accéder aux options de gestion</li>
                    <li>Le modèle le plus récemment téléchargé est automatiquement sélectionné</li>
                </ul>
                
                <h4>Supprimer des Modèles</h4>
                <p>Pour supprimer des modèles dont vous n'avez plus besoin :</p>
                <ol>
                    <li>Sélectionnez le modèle dans le menu déroulant Modèles Locaux</li>
                    <li>Cliquez sur le bouton "Supprimer"</li>
                    <li>Confirmez la suppression quand demandé</li>
                    <li>Attendez que le processus se termine</li>
                </ol>
                <p>Supprimer les modèles non utilisés aide à libérer de l'espace disque sur votre système.</p>
                
                <div class="note">
                    <p><strong>Note :</strong> Si vous supprimez un modèle qui est actuellement utilisé dans une conversation, vous devrez sélectionner un nouveau modèle pour continuer à discuter.</p>
                </div>
            `,
                image: "models_managing.png",
                imageAlt: "Gérer les Modèles Locaux",
                imageCaption: "La section modèles locaux montrant les options de gestion des modèles",
            },
            {
                id: "models-configuration",
                title: "Configurer les Paramètres des Modèles",
                content: `
                <p>Affinez la façon dont les modèles répondent en ajustant leurs paramètres dans le fichier modelparameters.js.</p>
                
                <h4>Configuration des Paramètres</h4>
                <p>Les paramètres des modèles sont maintenant configurés directement dans le fichier <code>modelparameters.js</code> :</p>
                <ul>
                    <li>Ouvrez le fichier <code>modelparameters.js</code> dans votre éditeur de code</li>
                    <li>Ajoutez votre modèle à l'objet <code>MODEL_PARAMETERS</code> ou modifiez les entrées existantes</li>
                    <li>Sauvegardez le fichier et redémarrez l'application pour appliquer les changements</li>
                </ul>
                
                <h4>Exemple pour Ajouter un Nouveau Modèle</h4>
                <pre><code>// Ajouter à l'objet MODEL_PARAMETERS dans modelparameters.js
                'nom-de-votre-modele': {
                    temperature: 0.7,
                    top_k: 50,
                    top_p: 0.9,
                    min_p: 0.05,
                    repeat_penalty: 1.1
                }</code></pre>
                
                <h4>Paramètres Disponibles</h4>
                <p>Les paramètres suivants peuvent être ajustés pour la plupart des modèles :</p>
                <ul>
                    <li><strong>Temperature</strong> (0.0-2.0) - Contrôle l'aléatoire dans les réponses. Des valeurs plus élevées produisent des sorties plus diverses et créatives, tandis que des valeurs plus basses rendent les réponses plus focalisées et déterministes.</li>
                    <li><strong>Top P</strong> (0.0-1.0) - Contrôle la diversité en limitant la sélection de tokens à un seuil de probabilité cumulative. Des valeurs plus basses créent des réponses plus focalisées.</li>
                    <li><strong>Top K</strong> (1-100+) - Restreint la sélection de tokens aux K tokens les plus probables. Des valeurs plus basses créent des réponses plus prévisibles.</li>
                    <li><strong>Min P</strong> (0.0-1.0) - Définit un seuil de probabilité minimum pour la sélection de tokens. Des valeurs plus élevées forcent le modèle à être plus décisif.</li>
                    <li><strong>Repeat Penalty</strong> (1.0-2.0) - Décourage la répétition en pénalisant les tokens précédemment utilisés. Des valeurs plus élevées réduisent la répétition plus agressivement.</li>
                </ul>
                
                <h4>Recommandations de Paramètres</h4>
                <p>Différentes tâches bénéficient de différents réglages de paramètres :</p>
                <ul>
                    <li><strong>Écriture créative</strong> - Temperature plus élevée (0.7-1.0), top_p plus élevé (0.9)</li>
                    <li><strong>Réponses factuelles</strong> - Temperature plus basse (0.1-0.3), top_k bas (40)</li>
                    <li><strong>Génération de code</strong> - Temperature plus basse (0.1-0.4), repeat_penalty plus élevé (1.1)</li>
                </ul>
                
                <div class="note">
                    <p><strong>Important :</strong> Après avoir modifié le fichier modelparameters.js, vous devez redémarrer l'application pour que les changements prennent effet.</p>
                </div>
                `,
                image: "models_configuration.png",
                imageAlt: "Interface de Configuration des Modèles",
                imageCaption: "Exemple du fichier modelparameters.js avec configuration personnalisée",
            },
            {
                id: "models-troubleshooting",
                title: "Dépannage des Problèmes de Modèles",
                content: `
                    <p>Si vous rencontrez des problèmes avec les modèles dans Paiperwork, voici quelques problèmes courants et leurs solutions :</p>
                    
                    <h4>Échecs de Récupération de Modèles</h4>
                    <p>Si vous ne pouvez pas récupérer les modèles de la bibliothèque Ollama :</p>
                    <ul>
                        <li>Vérifiez qu'Ollama fonctionne sur votre système</li>
                        <li>Vérifiez votre connexion internet</li>
                        <li>Redémarrez Ollama et réessayez</li>
                        <li>Assurez-vous d'utiliser une version compatible d'Ollama (actuellement : 0.6.6)</li>
                    </ul>
                    
                    <h4>Problèmes de Téléchargement</h4>
                    <p>Si les téléchargements de modèles échouent ou se bloquent :</p>
                    <ul>
                        <li>Vérifiez la stabilité de votre connexion internet</li>
                        <li>Assurez-vous d'avoir suffisamment d'espace disque</li>
                        <li>Essayez d'annuler et redémarrer le téléchargement</li>
                        <li>Redémarrez Ollama après annulation pour nettoyer les fichiers incomplets</li>
                        <li>Essayez de télécharger d'abord une taille de modèle plus petite</li>
                    </ul>
                    
                    <h4>Nettoyage de Téléchargement Incomplet</h4>
                    <p>Si vous avez annulé un téléchargement et devez nettoyer les fichiers :</p>
                    <ul>
                        <li>Redémarrez le service Ollama sur votre système</li>
                        <li>Cela permet à Ollama de nettoyer tous les fichiers de modèles partiellement téléchargés</li>
                        <li>Après redémarrage, vous pouvez tenter un nouveau téléchargement</li>
                    </ul>
                    
                    <h4>Problèmes d'Éléments d'Interface</h4>
                    <p>Si les éléments d'interface dans l'onglet Modèles semblent bloqués ou désactivés :</p>
                    <ul>
                        <li>Si les sélecteurs restent désactivés après qu'un téléchargement se termine ou soit annulé, actualisez la page</li>
                        <li>Si le bouton "Récupérer les Modèles Ollama" est désactivé sans téléchargement actif, actualisez la page</li>
                        <li>Après plusieurs erreurs de téléchargement, le système réactivera finalement tous les contrôles automatiquement</li>
                    </ul>
                    
                    <h4>Problèmes de Performance des Modèles</h4>
                    <p>Si un modèle fonctionne lentement ou plante :</p>
                    <ul>
                        <li>Vérifiez vos ressources système (utilisation VRAM, RAM et CPU)</li>
                        <li>Essayez un modèle plus petit ou une version quantifiée</li>
                        <li>Fermez d'autres applications gourmandes en ressources</li>
                        <li>Ajustez la taille du contexte dans l'onglet Chat à une valeur plus petite</li>
                    </ul>
                    
                    <h4>Modèle n'Apparaît pas dans le Chat</h4>
                    <p>Si un modèle téléchargé n'apparaît pas dans le menu déroulant de sélection de modèles dans le Chat :</p>
                    <ul>
                        <li>Vérifiez que le téléchargement du modèle s'est terminé avec succès</li>
                        <li>Actualisez l'onglet Chat ou redémarrez l'application</li>
                        <li>Vérifiez si le modèle nécessite des fonctionnalités ou configurations spécifiques</li>
                    </ul>
                    
                    <div class="note">
                        <p><strong>Note :</strong> Si les problèmes persistent, consultez la documentation Ollama ou recherchez les journaux Ollama sur votre système pour des informations d'erreur plus détaillées.</p>
                    </div>
                `,
            }
        ],
    },
    database: {
        title: "Données",
        intro: "L'onglet Base de données fournit des outils pour surveiller et maintenir votre base de données locale, garantissant des performances optimales et l'intégrité des données tout en préservant une confidentialité complète.",
        articles: [
            {
                id: "database-intro",
                title: "Introduction à la gestion de base de données",
                content: `
                <p>L'onglet Base de données vous donne visibilité et contrôle sur le système de base de données local de Paiperwork qui stocke toutes vos conversations, documents et données d'application.</p>
                
                <p>Les fonctionnalités clés de l'onglet Base de données incluent :</p>
                <ul>
                    <li>Statistiques en temps réel sur la taille et le contenu de la base de données</li>
                    <li>Outils pour identifier et nettoyer les données orphelines</li>
                    <li>Capacités d'optimisation de la base de données</li>
                    <li>Informations sur votre méthode de stockage et sécurité</li>
                </ul>
                
                <p>Toutes les données dans Paiperwork sont stockées localement dans une base de données SQLite au sein du stockage de votre navigateur. Cette base de données est entièrement chiffrée en utilisant votre Clé Maître, garantissant une confidentialité et sécurité complètes.</p>
                
                <div class="note">
                    <p><strong>Important :</strong> Contrairement aux applications basées sur le cloud, la base de données de Paiperwork nécessite une maintenance occasionnelle pour garantir des performances optimales. L'onglet Base de données fournit les outils dont vous avez besoin pour cette maintenance.</p>
                </div>
            `,
                image: "database_overview.png",
                imageAlt: "Vue d'ensemble de l'onglet Base de données",
                imageCaption: "L'onglet Base de données montrant les statistiques et outils de gestion"
            },
            {
                id: "database-stats",
                title: "Comprendre les statistiques de base de données",
                content: `
                <p>Le panneau Statistiques de Base de données fournit des informations importantes sur votre base de données locale :</p>
                
                <h4>Statistiques clés</h4>
                <ul>
                    <li><strong>Taille de la base de données</strong> - Espace disque total utilisé par votre base de données</li>
                    <li><strong>Documents</strong> - Nombre de documents stockés dans votre base de données</li>
                    <li><strong>Total des segments</strong> - Segments de texte utilisés pour la recherche et récupération de documents</li>
                    <li><strong>Santé de la base de données</strong> - Indicateur de statut pour l'intégrité de la base de données</li>
                </ul>
                
                <h4>Indicateurs de santé</h4>
                <p>L'indicateur de Santé de la Base de données peut afficher :</p>
                <ul>
                    <li><strong>Saine</strong> - Coche verte indique que votre base de données est optimisée et n'a pas de données orphelines</li>
                    <li><strong>Segments orphelins</strong> - Avertissement jaune apparaît quand des segments orphelins sont détectés, montrant combien de segments sont orphelins</li>
                </ul>
                
                <h4>Méthode de stockage</h4>
                <p>La section "À propos de votre base de données" montre votre méthode de stockage actuelle :</p>
                <ul>
                    <li><strong>OPFS (Origin Private File System)</strong> - Stockage moderne et haute performance disponible dans les navigateurs récents</li>
                    <li><strong>IndexedDB</strong> - Méthode de stockage de secours pour les navigateurs sans support OPFS</li>
                </ul>
                
                <h4>Actualiser les statistiques</h4>
                <p>Pour obtenir les informations les plus récentes :</p>
                <ol>
                    <li>Cliquez sur le bouton "Actualiser les statistiques"</li>
                    <li>Attendez que le système analyse votre base de données</li>
                    <li>Consultez les statistiques mises à jour</li>
                </ol>
                
                <div class="note">
                    <p><strong>Note :</strong> Les statistiques de base de données sont automatiquement chargées quand vous ouvrez l'onglet Base de données pour la première fois et quand vous y revenez après avoir utilisé d'autres onglets.</p>
                </div>
            `,
            },
            {
                id: "database-orphaned",
                title: "Gestion des données orphelines",
                content: `
                <p>Quand vous supprimez des documents ou conversations, parfois de petits morceaux de données peuvent devenir "orphelins" - déconnectés de leur contenu parent mais occupant toujours de l'espace dans votre base de données.</p>
                
                <h4>Que sont les segments orphelins ?</h4>
                <p>Les segments orphelins sont des segments de texte qui faisaient autrefois partie d'un document ou conversation mais ne sont plus associés à aucun contenu existant. Ils se produisent quand :</p>
                <ul>
                    <li>Les documents sont supprimés sans nettoyer correctement tous les segments associés</li>
                    <li>Des interruptions d'opération se produisent pendant la suppression de documents</li>
                    <li>Des erreurs système empêchent un nettoyage complet pendant les opérations normales</li>
                </ul>
                
                <h4>Identifier les données orphelines</h4>
                <p>L'onglet Base de données détecte automatiquement les segments orphelins et vous alerte avec :</p>
                <ul>
                    <li>Un indicateur d'avertissement jaune dans la section Santé de la base de données</li>
                </ul>
                
                <h4>Nettoyer les données orphelines</h4>
                <ol>
                    <li>Quand des segments orphelins sont détectés, cliquez sur le bouton "Nettoyer la base de données"</li>
                    <li>Le système identifiera et supprimera tous les segments orphelins</li>
                    <li>Un message de succès apparaîtra montrant combien de segments ont été supprimés et combien d'espace a été récupéré</li>
                    <li>Les statistiques de base de données s'actualiseront automatiquement pour montrer l'état amélioré</li>
                </ol>
                
                <div class="note">
                    <p><strong>Important :</strong> Nettoyer les données orphelines ne supprime que les fragments non nécessaires - cela n'affecte aucun de vos documents, conversations ou informations stockées réels.</p>
                </div>
            `,
                image: "database_orphaned.png",
                imageAlt: "Nettoyage des données orphelines",
                imageCaption: "Le message de nettoyage de base de données terminé"
            },
            {
                id: "database-optimize",
                title: "Optimisation des performances de la base de données",
                content: `
                <p>Au fil du temps, alors que vous ajoutez et supprimez du contenu, votre base de données peut devenir fragmentée et utiliser plus d'espace que nécessaire. L'onglet Base de données fournit des outils pour optimiser les performances et récupérer l'espace inutilisé.</p>
                
                <h4>Quand optimiser votre base de données</h4>
                <p>Considérez exécuter l'optimisation de base de données quand :</p>
                <ul>
                    <li>Vous avez supprimé de gros documents ou de nombreuses conversations</li>
                    <li>L'application semble plus lente que d'habitude</li>
                    <li>Vous notez que la taille de la base de données est plus grande que prévu</li>
                    <li>Vous voulez récupérer de l'espace disque</li>
                </ul>
                
                <h4>Comment la taille de base de données change</h4>
                <p>Comprendre comment la taille de base de données fonctionne dans SQLite :</p>
                <ul>
                    <li>Quand vous ajoutez du contenu, la base de données grandit pour l'accommoder</li>
                    <li>Quand vous supprimez du contenu, le fichier de base de données ne rétrécit pas automatiquement</li>
                    <li>L'espace supprimé est marqué comme disponible pour réutilisation mais compte toujours dans la taille totale du fichier</li>
                    <li>Seule l'optimisation (VACUUM) réduit réellement la taille du fichier en reconstruisant la base de données</li>
                </ul>
                <h4>Exécuter l'optimisation de base de données</h4>
                <ol>
                    <li>Cliquez sur le bouton "Nettoyer la base de données" dans l'onglet Base de données</li>
                    <li>Attendez que le processus d'optimisation se termine (cela peut prendre un moment pour les bases de données plus grandes)</li>
                    <li>Une notification apparaîtra montrant combien d'espace a été récupéré</li>
                    <li>Les statistiques de base de données s'actualiseront automatiquement</li>
                </ol>
                
                <h4>Ce que fait l'optimisation</h4>
                <ul>
                    <li>Reconstruit le fichier de base de données pour supprimer l'espace inutilisé</li>
                    <li>Défragmente les données pour un stockage plus efficace</li>
                    <li>Réorganise les index pour des requêtes plus rapides</li>
                    <li>Réduit le fichier de base de données à sa taille optimale</li>
                </ul>
                
                <div class="note">
                    <p><strong>Astuce :</strong> Prenez l'habitude d'exécuter l'optimisation de base de données après avoir supprimé de gros documents ou plusieurs conversations pour maintenir des performances optimales. Contrairement à de nombreuses applications cloud, les applications de base de données locales comme Paiperwork nécessitent une maintenance occasionnelle pour continuer à fonctionner en douceur.</p>
                </div>
            `,
            },
            {
                id: "database-backup",
                title: "Exporter et importer des sauvegardes completes",
                content: `
                <p>L'onglet Base de donnees inclut deux boutons de sauvegarde pour transferer vos donnees entre navigateurs ou appareils en toute securite :</p>
                <ul>
                    <li><strong>Exporter la base de donnees</strong> - Cree un fichier de sauvegarde complet nomme <code>Paiperwork-Backup.pwdb</code></li>
                    <li><strong>Importer la base de donnees</strong> - Restaure ce fichier dans votre stockage local actuel</li>
                </ul>

                <h4>Contenu de la sauvegarde</h4>
                <p>La sauvegarde exportee inclut tous les roles de base de donnees Paiperwork :</p>
                <ul>
                    <li><strong>Main</strong> - Conversations et parametres principaux</li>
                    <li><strong>RAG</strong> - Segments de documents et donnees de retrieval</li>
                    <li><strong>HTML</strong> - Contenu HTML enregistre pour presentations et artifacts</li>
                    <li><strong>Knowledge Base</strong> - Collections et entrees de connaissance</li>
                </ul>

                <h4>Comportement important a l'import</h4>
                <ul>
                    <li>L'import <strong>remplace</strong> vos bases locales actuelles</li>
                    <li>L'import <strong>ne fusionne pas</strong> avec le contenu local existant</li>
                    <li>Apres l'import, Paiperwork revient a l'ecran d'accueil pour ressaisir votre Cle Maitre</li>
                </ul>

                <h4>Procedure recommandee</h4>
                <ol>
                    <li>Dans le navigateur source, ouvrez l'onglet Base de donnees et cliquez sur "Exporter la base de donnees"</li>
                    <li>Copiez le fichier <code>Paiperwork-Backup.pwdb</code> vers le navigateur ou l'appareil cible</li>
                    <li>Dans le navigateur cible, ouvrez Base de donnees et cliquez sur "Importer la base de donnees"</li>
                    <li>Confirmez le remplacement puis reconnectez-vous avec votre Cle Maitre</li>
                </ol>

                <div class="note">
                    <p><strong>Note :</strong> Les imports legacy d'un seul fichier <code>.db</code> restent compatibles, mais ne restaurent que la base principale. Utilisez <code>Paiperwork-Backup.pwdb</code> pour une portabilite complete.</p>
                </div>
            `,
            },
            {
                id: "database-maintenance",
                title: "Meilleures pratiques de maintenance de base de données",
                content: `
                <p>Une maintenance appropriée de la base de données garantit que Paiperwork continue à fonctionner de manière fluide et efficace. Suivez ces meilleures pratiques pour garder votre base de données saine.</p>
                
                <h4>Planning de maintenance régulière</h4>
                <p>Établissez un planning de maintenance de routine :</p>
                <ul>
                    <li><strong>Hebdomadaire</strong> - Vérifiez les statistiques de base de données et nettoyez les données orphelines si trouvées</li>
                    <li><strong>Mensuelle</strong> - Exécutez l'optimisation de base de données pour récupérer l'espace et améliorer les performances</li>
                    <li><strong>Après des opérations en masse</strong> - Optimisez après avoir supprimé plusieurs documents ou conversations</li>
                </ul>
                
                <h4>Indicateurs de performance</h4>
                <p>Surveillez les signes que votre base de données a besoin de maintenance :</p>
                <ul>
                    <li>Temps de réponse d'application plus lents</li>
                    <li>Délais lors du changement entre onglets</li>
                    <li>Temps de chargement plus longs pour les documents ou conversations</li>
                    <li>Croissance inattendue de la taille de base de données</li>
                </ul>
                
                <h4>Maintenance préventive</h4>
                <ul>
                    <li>Nettoyez régulièrement les documents et conversations inutiles</li>
                    <li>Exécutez l'optimisation après avoir supprimé des quantités importantes de données</li>
                    <li>Vérifiez périodiquement les segments orphelins même si aucun avertissement n'apparaît</li>
                    <li>Redémarrez l'application occasionnellement pour permettre l'optimisation du stockage du navigateur</li>
                </ul>
                
                <h4>Comprendre la croissance de base de données</h4>
                <p>Il est normal que votre base de données grandisse au fil du temps alors que vous :</p>
                <ul>
                    <li>Ajoutez plus de documents pour le traitement RAG</li>
                    <li>Avez plus de conversations avec l'IA</li>
                    <li>Créez des entrées de base de connaissances et collections</li>
                    <li>Générez et sauvegardez plus de rapports de recherche</li>
                </ul>
                <p>Ce qui n'est pas normal c'est quand la base de données reste grande après que vous ayez supprimé ce contenu - c'est quand l'optimisation est nécessaire.</p>
                
                <div class="note">
                    <p><strong>Important :</strong> Contrairement aux applications cloud, les applications de base de données locales n'ont pas de processus de maintenance automatique fonctionnant sur des serveurs. L'onglet Base de données vous donne les outils pour effectuer cette maintenance vous-même, gardant votre application en bon fonctionnement.</p>
                </div>
            `,
            },
            {
                id: "database-troubleshooting",
                title: "Dépannage des problèmes de base de données",
                content: `
                <p>Si vous rencontrez des problèmes avec la base de données ou notez des problèmes de performance, voici quelques étapes de dépannage :</p>
                
                <h4>Problèmes courants et solutions</h4>
                
                <h5>Performance d'application lente</h5>
                <ul>
                    <li><strong>Problème :</strong> Paiperwork semble lent ou met plus de temps à répondre</li>
                    <li><strong>Solution :</strong> Exécutez l'optimisation de base de données en cliquant sur le bouton "Nettoyer la base de données"</li>
                    <li><strong>Prévention :</strong> Planifiez une optimisation régulière, surtout après de grandes suppressions</li>
                </ul>
                
                <h5>Grande taille de base de données</h5>
                <ul>
                    <li><strong>Problème :</strong> La taille de base de données semble disproportionnellement grande comparée à votre contenu</li>
                    <li><strong>Solution 1 :</strong> Vérifiez et nettoyez les segments orphelins</li>
                    <li><strong>Solution 2 :</strong> Exécutez l'optimisation de base de données pour récupérer l'espace inutilisé</li>
                    <li><strong>Solution 3 :</strong> Révisez et supprimez les documents et conversations inutiles</li>
                </ul>
                
                <h5>Contenu manquant après changements de session</h5>
                <ul>
                    <li><strong>Problème :</strong> Le contenu semble manquer lors du changement de Clés Maîtres</li>
                    <li><strong>Solution :</strong> Vérifiez que vous utilisez la Clé Maître correcte pour ce contenu</li>
                    <li><strong>Explication :</strong> Différentes Clés Maîtres créent des zones de stockage sécurisées séparées</li>
                </ul>
                
                <h5>Statistiques ne se mettent pas à jour</h5>
                <ul>
                    <li><strong>Problème :</strong> Les statistiques de base de données ne semblent pas refléter les changements récents</li>
                    <li><strong>Solution :</strong> Cliquez sur le bouton "Actualiser les statistiques" pour mettre à jour manuellement</li>
                    <li><strong>Explication :</strong> Certaines statistiques sont mises en cache et nécessitent une actualisation manuelle</li>
                </ul>
                
                <h5>Segments orphelins persistants</h5>
                <ul>
                    <li><strong>Problème :</strong> Les segments orphelins réapparaissent après nettoyage</li>
                    <li><strong>Solution 1 :</strong> Essayez d'exécuter le processus de nettoyage à nouveau</li>
                    <li><strong>Solution 2 :</strong> Actualisez le navigateur et essayez de nettoyer à nouveau</li>
                    <li><strong>Solution 3 :</strong> Exécutez l'optimisation de base de données après le nettoyage</li>
                </ul>
                
                <h4>Dernier recours : Réinitialisation de base de données</h4>
                <p>Si des problèmes persistants se produisent et que la maintenance normale n'aide pas :</p>
                <ol>
                    <li>Exportez d'abord toutes conversations ou documents importants</li>
                    <li>Retournez à l'écran d'accueil</li>
                    <li>Cliquez sur "Supprimer toutes les informations" pour réinitialiser la base de données</li>
                    <li>Cela supprimera toutes les données et créera une base de données fraîche</li>
                </ol>
                
                <div class="note">
                    <p><strong>Avertissement :</strong> La réinitialisation de base de données est irréversible et supprimera toutes vos données. Exportez toujours les informations importantes d'abord.</p>
                </div>
            `,
            }
        ],
    },




};