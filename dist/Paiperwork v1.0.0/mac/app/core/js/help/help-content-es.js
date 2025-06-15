window.helpContent = {
    gettingstarted: {
        title: "Inicio",
        intro:
            "Bienvenido a Paiperwork, una interfaz web segura para Ollama que prioriza la privacidad de datos y la facilidad de uso. Este asistente enfocado en profesionales ofrece características de productividad mientras mantiene tus datos locales y protegidos.",
        articles: [
            {
                id: "gs-welcome",
                title: "Pantalla de Bienvenida",
                content: `
            <p>** Si tienes un portatil o un ordenador sin una tarjeta gráfica potente, siempre elige modelos de tamaño pequeño para mejor rendimiento (a menos que tengas una máquina con mucha RAM y sepas lo que estás haciendo)**</p>
            <p>** Ten en cuenta que Paiperwork usa instrucciones para sus características, <b>Se requieren Modelos de Instrucción</b> (no uses modelos base o modelos de texto/chat)**</p>
            <p>La pantalla de bienvenida es tu punto de partida para todas las interacciones con Paiperwork.</p>
            <p>Desde aquí, puedes:</p>
            <ul>
            <li>Iniciar nuevas conversaciones y usar todas las opciones de la aplicación con la IA ingresando una Clave Maestra (Diferentes Claves Maestras crearán Chats/configuraciones/datos separados dentro de la base de datos)</li>
            <li>Acceder a tu historial de conversaciones usando una Clave Maestra ingresada previamente</li>
            <li>Verificar actualizaciones del programa</li>
            <li>Acceder a la documentación de ayuda</li>
        </ul>
        
        <div class="note">
            <p><strong>Importante:</strong> La Clave Maestra que ingreses cumple dos propósitos críticos:</p>
            <ul>
                <li>Puede crear entornos de trabajo separados (Usando diferentes Claves Maestras)</li>
                <li>Actúa como tu clave de cifrado para almacenar datos de conversación de forma segura (tus datos se almacenarán localmente en el almacenamiento de tu navegador en forma de base de datos). Nunca se enviarán datos fuera de tu sistema excepto consultas de búsqueda cuando el botón web se active para búsquedas web o la función de Investigación (enviando una consulta de búsqueda web al motor de búsqueda Bing de Microsoft) o consultas/descargas de modelos Ollama. No se recopila telemetría. Ten en cuenta que si cambias tu navegador, no habrá base de datos previa en él, así que comenzarás desde cero.</li>
            </ul>
            <p>Para acceder a una conversación anterior, debes ingresar la <em>misma Clave Maestra exacta</em> (sensible a mayúsculas) que usaste al crearla.</p>
        </div>
        
        <div class="note">
            <p><strong>Compatibilidad de Idioma:</strong> Aunque la interfaz de Paiperwork soporta múltiples idiomas, para una experiencia óptima debes usar modelos de IA entrenados en tu idioma preferido. Si estás usando un idioma de interfaz que no es inglés, considera usar modelos que soporten tu idioma para mejores resultados. Al solicitar información en características como Investigación o chat general, si no obtienes la respuesta/resultado en tu idioma, puedes necesitar especificar tu idioma de respuesta preferido en tu prompt, por ejemplo: "¿Por qué los gatos tienen pelo blanco? (Proporciona esta investigación en español)" o "(Responde en francés)" para asegurar que la IA responda en tu idioma deseado en lugar de usar inglés por defecto.</p>
        </div>
        
         <div class="note">
          <p><strong>Idioma de Respuesta de IA:</strong> Paiperwork ahora aplica automáticamente respuestas de IA en tu idioma preferido basado en tu selección del menú desplegable de idiomas en la página principal (index.html). El sistema automáticamente agrega instrucciones de aplicación de idioma para asegurar que todas las respuestas de IA coincidan con tu idioma de interfaz elegido. Si necesitas respuestas en un idioma diferente para conversaciones específicas, puedes anular esto agregando "Siempre respondes en [idioma específico]" a tu Prompt del Sistema en la pestaña Chat. (La consistencia del idioma de respuesta dependerá de la calidad del modelo de IA)</p>
         </div>
        
        <div class="note">
            <p><strong>Compatibilidad con Sistemas de Gama Baja:</strong> Paiperwork ha sido probado y optimizado para compatibilidad con modelos de IA más pequeños (como Qwen3.1 1.7B y Gemma3 4B) para asegurar rendimiento efectivo en sistemas de gama baja. Estos modelos más pequeños proporcionan buenos resultados mientras requieren significativamente menos VRAM y recursos del sistema, haciendo Paiperwork accesible para usuarios con capacidades de hardware limitadas.</p>
        </div>
        
        <div class="note">
            <p><strong>Soporte de Traducción:</strong> Si encuentras traducciones faltantes o incorrectas en Paiperwork, por favor háznoslo saber en nuestras <a href="https://github.com/discussions" target="_blank" rel="noopener noreferrer">Discusiones de GitHub</a>. Tu retroalimentación nos ayuda a mejorar la experiencia multilingüe para todos los usuarios.</p>
        </div>
    `,
                image: "welcome.png",
                imageAlt: "Pantalla de Bienvenida de Paiperwork",
                imageCaption:
                    "La pantalla de bienvenida de Paiperwork mostrando el campo de entrada de Clave Maestra",
            },
            {
                id: "gs-topics",
                title: "Usando la Clave Maestra Efectivamente",
                content: `
               <p>Las Claves Maestras son fundamentales para cómo funciona Paiperwork. Principalmente proporcionan seguridad para tus conversaciones.</p>
               
               <h4>Clave Maestra como Claves de Seguridad</h4>
               <p>Tu Clave Maestra actúa como una clave de cifrado que asegura los datos de tu conversación. Esto significa:</p>
               <ul>
                 <li>Las Claves Maestras son <strong>sensibles a mayúsculas</strong> - "Mi Proyecto" y "mi proyecto" se tratan como Claves Maestras diferentes</li>
                 <li>Debes ingresar exactamente la misma Clave Maestra para acceder a una conversación anterior</li>
                 <li>Si olvidas una Clave Maestra, no puedes recuperar esa conversación</li>
                 <li>Elige Claves Maestras cortas y memorables que puedas recordar fácilmente después</li>
               </ul>
               
               <h4>Creando Claves Maestras Efectivas</h4>
               <p>Para mejores resultados con tu Clave Maestra:</p>
               <ul>
                 <li>Mantenlas cortas y fáciles de recordar (ej., "ViajeItalia2025" o "Planes Jardín")</li>
                 <li>Usa patrones simples que recordarás (ej., "Casa-2023" o "Libro-Recetas")</li>
                 <li>Evita frases complejas con caracteres especiales o espaciado inusual</li>
                 <li>Considera usar ayudas de memoria personal que solo tú reconocerías</li>
               </ul>
               
               <div class="note">
                 <p><strong>Consejo:</strong> Considera mantener un registro seguro de las Claves Maestras importantes que uses frecuentemente, especialmente para proyectos a largo plazo. Piensa en las Claves Maestras como contraseñas - necesitan ser memorables y seguras.</p>
               </div>
             `,
                image: "memorabletopic.png",
                imageAlt: "Ejemplo de Entrada de Clave Maestra",
                imageCaption: "Ejemplo de ingresar una Clave Maestra corta y memorable",
            },
            {
                id: "gs-conversation",
                title: "Iniciando una Conversación",
                content: `
                <p>Para iniciar una nueva conversación con la IA:</p>
                <ol>
                    <li>Ingresa una Clave Maestra en el campo "Ingresa Clave maestra aquí..."</li>
                    <li>Asegúrate de que tu Clave Maestra sea tanto descriptiva como memorable</li>
                    <li>Haz clic en el botón "Comenzar"</li>
                    <li>La interfaz de chat se abrirá con tu nueva conversación</li>
                </ol>
                <p>Si has usado esta Clave Maestra antes, Paiperwork cargará tu historial de conversación anterior.</p>
                <p>Si es una nueva Clave Maestra, comenzará una conversación nueva.</p>
            
                <h4>Gestionando Conversaciones</h4>
                <p>En la parte superior derecha de la pantalla de bienvenida, encontrarás el botón "Eliminar toda la información". Úsalo con precaución, ya que eliminará permanentemente TODAS tus conversaciones y datos guardados.</p>
            `,
                image: "clickstart.png",
                imageAlt: "Iniciando una nueva conversación",
                imageCaption:
                    "Ingresa tu Clave maestra y haz clic en Comenzar para iniciar una nueva sesión de chat",
            },
            {
                id: "gs-password-protection",
                title: "Función de Contraseña de Protección",
                content: `
                <p>Paiperwork incluye una función opcional de contraseña de protección que agrega una capa extra de seguridad contra la eliminación accidental de datos para tus bases de datos almacenadas.</p>
                
                <h4>¿Qué es la Contraseña de Protección?</h4>
                <p>La contraseña de protección es una función de seguridad que:</p>
                <ul>
                    <li>Previene la eliminación accidental de todos tus datos y conversaciones</li>
                    <li>Requiere verificación de contraseña antes de realizar la acción "Eliminar Toda la Información"</li>
                    <li>Es completamente opcional - puedes elegir si configurar una (solo requerida para eliminar toda la información de la base de datos)</li>
                    <li>Se almacena de forma segura usando cifrado con hash basado en sal</li>
                </ul>
                
                <h4>Configurando la Contraseña de Protección</h4>
                <p>Cuando intentas eliminar toda la información por primera vez:</p>
                <ol>
                    <li>Haz clic en el botón "Eliminar Toda la Información" en la pantalla de bienvenida</li>
                    <li>Si no existe contraseña de protección, se te pedirá configurar una</li>
                    <li>Elige si configurar una contraseña de protección o saltar esta función (solo cierra esta ventana)</li>
                    <li>Si eliges configurar: ingresa una contraseña (mínimo 6 caracteres) y confírmala</li>
                    <li>La contraseña se cifrará de forma segura y se almacenará localmente</li>
                </ol>
                
                <h4>Usando la Contraseña de Protección</h4>
                <p>Una vez que se establece una contraseña de protección:</p>
                <ul>
                    <li>Cualquier intento de eliminar toda la información requerirá verificación de contraseña</li>
                    <li>Ingresa tu contraseña de protección en el diálogo de verificación</li>
                    <li>Solo con la contraseña correcta puedes proceder con la eliminación</li>
                    <li>La verificación de contraseña incluye una opción "Restablecer Contraseña" si necesitas cambiarla</li>
                </ul>
                
                <h4>Restableciendo tu Contraseña de Protección</h4>
                <p>Si necesitas cambiar tu contraseña de protección:</p>
                <ol>
                    <li>Intenta eliminar toda la información para abrir el diálogo de verificación de contraseña</li>
                    <li>Ingresa tu contraseña actual en el campo de entrada</li>
                    <li>Haz clic en el botón "Restablecer Contraseña"</li>
                    <li>Si tu contraseña actual es correcta, serás guiado para establecer una nueva contraseña</li>
                </ol>
                
                <h4>Detalles de Seguridad</h4>
                <ul>
                    <li><strong>Cifrado</strong> - Las contraseñas se hashean usando SHA-256 con sales únicas</li>
                    <li><strong>Almacenamiento Local</strong> - Las contraseñas de protección se almacenan solo en tu dispositivo</li>
                    <li><strong>Sin Recuperación</strong> - Si olvidas tu contraseña de protección, no puedes recuperarla</li>
                    <li><strong>Función Opcional</strong> - Puedes saltar la configuración de una contraseña de protección si prefieres (solo requerida para eliminar toda la información de la base de datos)</li>
                </ul>
                
                <div class="note">
                    <p><strong>Importante:</strong> La contraseña de protección está diseñada para prevenir eliminación accidental. Si olvidas tu contraseña de protección, no hay método de recuperación (necesitarás eliminar el almacenamiento local de tu navegador para localhost para comenzar limpio, perdiendo toda tu información almacenada para Paiperwork). Elige una contraseña que recordarás pero que sea diferente de opciones fáciles de adivinar.</p>
                </div>
            `,
                image: "protection_password.png",
                imageAlt: "Configuración de Contraseña de Protección",
                imageCaption: "El diálogo de configuración de contraseña de protección para asegurar la eliminación de datos",
            },
        ],
    },

    chat: {
        title: "Chat",
        intro:
            "La interfaz de chat proporciona potentes capacidades de conversación con IA con varias funciones avanzadas para mejorar tus interacciones.",
        articles: [
            {
                id: "chat-basics",
                title: "Fundamentos del Chat",
                content: `
                <p>La interfaz de chat es donde tienen lugar tus conversaciones con la IA. Está diseñada para ser intuitiva pero potente, con varias funciones clave que te ayudan a aprovechar al máximo tus interacciones.</p>
                <div class="note">
                    <p><strong>Importante:</strong> Actualizamos el prompt del sistema de IA con la fecha actual para propósitos de contexto temporal. Los modelos de IA pueden confundirse sobre eventos actuales ya que su fecha límite de conocimiento es muy probablemente anterior a la fecha actual. Se sugiere usar búsqueda web cuando preguntes sobre eventos actuales.</p>
                </div>
                <h4>Elementos Básicos del Chat</h4>
                <ul>
                    <li><strong>Área de Mensajes</strong> - Donde aparece tu historial de conversación, con mensajes de usuario a la derecha y respuestas de IA a la izquierda</li>
                    <li><strong>Campo de Entrada</strong> - Escribe tus mensajes aquí y presiona Enter o haz clic en Enviar para enviar</li>
                    <li><strong>Botón Enviar</strong> - Envía tu mensaje y se transforma en un botón Cancelar durante la generación de respuesta de IA</li>
                    <li><strong>Selector de Modelo</strong> - Elige diferentes modelos de IA según los requisitos de tu tarea</li>
                    <li><strong>Visualización de Clave Maestra</strong> - Muestra tu Clave Maestra actual (enmascarada por seguridad). Haz clic para revelar la clave real temporalmente, lo que ayuda a refrescar tu memoria sobre qué clave de encriptación estás usando actualmente</li>
                </ul>
                
                <h4>Función de Visualización de Clave Maestra</h4>
                <p>La visualización de Clave Maestra en la interfaz de chat te ayuda a seguir el rastro de tu clave de encriptación actual:</p>
                <ul>
                    <li><strong>Visualización de Seguridad</strong> - Por defecto, la Clave Maestra se muestra como puntos (••••••••••••) para proteger tu privacidad</li>
                    <li><strong>Clic para Revelar</strong> - Haz clic en la visualización de Clave Maestra para mostrar temporalmente el texto real de la clave</li>
                    <li><strong>Auto-ocultación</strong> - La clave se oculta automáticamente después de 3 segundos por seguridad</li>
                    <li><strong>Ayuda de Memoria</strong> - Útil para confirmar qué Clave Maestra estás usando actualmente, especialmente cuando trabajas con múltiples proyectos</li>
                </ul>
                
                <h4>Controles de Mensaje</h4>
                <p>Cada respuesta de IA incluye botones de acción en la parte inferior que te permiten:</p>
                <ul>
                    <li><strong>Regenerar</strong> - Crea una nueva respuesta a tu último mensaje, útil si quieres una respuesta diferente</li>
                    <li><strong>Eliminar</strong> - Remueve el par de mensajes (tu mensaje y la respuesta de la IA) de la conversación</li>
                    <li><strong>Copiar</strong> - Copia el contenido completo de la respuesta de la IA a tu portapapeles</li>
                </ul>
                
                <h4>Cancelar Generación</h4>
                <p>Si quieres detener la IA mientras está generando una respuesta, simplemente haz clic en el botón rojo Cancelar (que reemplazó al botón Enviar). Esto detiene inmediatamente el proceso de generación y marca la respuesta incompleta.</p>
                
                <div class="note">
                    <p><strong>Consejo:</strong> Para mantener organizadas tus conversaciones, intenta usar diferentes Claves Maestras para diferentes temas o proyectos. Usa la función de visualización de Clave Maestra para confirmar que estás en el contexto correcto antes de comenzar conversaciones importantes.</p>
                </div>
            `,
                images: [
                    {
                        src: "chat_interface.png",
                        alt: "Interfaz de Chat",
                        caption:
                            "La interfaz de chat mostrando controles de conversación y opciones de mensaje",
                    },
                    {
                        src: "Encrypted-database.png",
                        alt: "Base de datos encriptada para chats y datos",
                        caption: "Base de datos encriptada para chats y datos"
                    }
                ]

            },
            {
                id: "chat-system-prompt",
                title: "Usando Prompts del Sistema",
                content: `
                <p>El prompt del sistema es una forma potente de controlar cómo se comporta la IA en tu conversación. Piénsalo como establecer instrucciones para la personalidad, enfoque de conocimiento y estilo de respuesta de la IA.</p>
                
                <h4>Accediendo al Prompt del Sistema</h4>
                <p>Para ver y editar el prompt del sistema:</p>
                <ol>
                    <li>Haz clic en la pestaña "Prompt del Sistema" en la interfaz de chat</li>
                    <li>Edita el texto en el campo de texto grande</li>
                    <li>Haz clic en "Guardar" para aplicar tus cambios</li>
                </ol>
                
                <h4>Prompts del Sistema Efectivos</h4>
                <p>Para mejores resultados al personalizar tu prompt del sistema:</p>
                <ul>
                    <li>Sé específico sobre el rol de la IA (ej., "Eres un asistente de codificación útil especializado en JavaScript")</li>
                    <li>Define el estilo y formato preferido de las respuestas</li>
                    <li>Especifica cualquier limitación o boundary</li>
                    <li>Incluye cualquier dominio de conocimiento especializado en el que la IA debería enfocarse</li>
                </ul>
                
                <div class="note">
                    <p><strong>Nota:</strong> Cambiar el prompt del sistema reiniciará el contexto de la conversación, pero aparecerá un botón "Continuar Conversación" para ayudar a mantener el flujo de conversación.</p>
                </div>
            `,
                image: "system_prompt.png",
                imageAlt: "Editor de Prompt del Sistema",
                imageCaption:
                    "El editor de prompt del sistema te permite personalizar el comportamiento de la IA",
            },

            {
                id: "chat-insights",
                title: "Insights de Conversación",
                content: `
                <p>La función de Insights ayuda a la IA a entenderte mejor con el tiempo aprendiendo automáticamente de tus mensajes.</p>
                
                <h4>Cómo Funcionan los Insights</h4>
                <p>Cuando está habilitado, Paiperwork analiza tus mensajes para extraer información relevante sobre tus preferencias, intereses y estilo de comunicación. Esto ayuda a la IA a proporcionar respuestas más personalizadas mientras más interactúas con ella.</p>
                
                <ul>
                    <li><strong>Enfocado en Privacidad</strong> - Los insights están encriptados de forma segura usando tu Clave Maestra y almacenados localmente en tu dispositivo</li>
                    <li><strong>Análisis Selectivo</strong> - Solo se analizan los mensajes que contienen preferencias personales</li>
                    <li><strong>No Identificativo</strong> - El sistema se enfoca en rasgos generales en lugar de detalles personales específicos</li>
                    <li><strong>Tiempo de Procesamiento</strong> - Si usas un modelo de razonamiento, los insights tomarán significativamente más tiempo en generarse ya que el modelo razonará por un tiempo antes de crear el insight</li>
                </ul>
                
                <h4>Gestionando Insights</h4>
                <p>Tienes control completo sobre la función de Insights:</p>
                
                <h5>Habilitando o Deshabilitando la Recolección de Insights</h5>
                <ol>
                    <li>Haz clic en la pestaña "Chat" en la interfaz de chat</li>
                    <li>Encuentra el interruptor "Insights" (en la parte superior)</li>
                    <li>Actívalo o desactívalo para deshabilitar</li>
                </ol>
                <p>Cuando está deshabilitado, no se recolectarán nuevos insights de tus mensajes futuros. Los insights previamente almacenados permanecen en la base de datos y seguirán siendo cargados y utilizados para mejorar la comprensión de la IA sobre ti.</p>
                
                <h5>Viendo y Gestionando Insights Almacenados</h5>
                <p>Puedes ver, editar y eliminar insights almacenados:</p>
                <ol>
                    <li>Encuentra el pequeño botón "e" a la izquierda del interruptor de Insights</li>
                    <li>Haz clic en este botón para abrir el Editor de Insights</li>
                    <li>En la ventana del editor, puedes:</li>
                    <ul>
                        <li><strong>Ver</strong> - Ver todos los insights que el sistema ha recolectado sobre ti</li>
                        <li><strong>Editar</strong> - Modificar cualquier insight existente que sea inexacto o necesite actualización</li>
                        <li><strong>Eliminar</strong> - Remover insights específicos que no quieres que la IA use</li>
                        <li><strong>Agregar</strong> - Crear nuevos insights manualmente para guiar la comprensión de la IA</li>
                    </ul>
                    <li>Haz clic en "Guardar Cambios" para aplicar tus modificaciones</li>
                </ol>
                <p>Después de guardar cambios, el prompt del sistema se reconstruirá automáticamente para incorporar tus preferencias actualizadas.</p>
                
                <h4>Cómo los Insights Están Siempre Disponibles</h4>
                <p>Los insights funcionan de manera diferente al interruptor de recolección:</p>
                <ul>
                    <li><strong>Siempre Cargados</strong> - Cuando inicias una conversación, todos los insights almacenados se cargan automáticamente desde la base de datos</li>
                    <li><strong>Mejora Continua</strong> - Tus insights mejoran cada conversación, ayudando a la IA a entender tus preferencias</li>
                    <li><strong>El Interruptor Solo Controla la Recolección</strong> - El interruptor solo controla si se crean nuevos insights de mensajes futuros</li>
                    <li><strong>Gestión Manual</strong> - Usa el botón "e" para gestionar insights existentes independientemente del estado del interruptor</li>
                </ul>
                
                <h4>Qué Se Analiza</h4>
                <p>El sistema analiza selectivamente mensajes que contienen:</p>
                <ul>
                    <li>Auto-referencias (frases que comienzan con "Yo" como "Yo prefiero..." o "Yo disfruto...")</li>
                    <li>Mensajes más largos y detallados (típicamente 5+ palabras)</li>
                    <li>Mensajes que contienen preferencias u opiniones personales</li>
                </ul>
                
                <div class="note">
                    <p><strong>Nota de Privacidad:</strong> Todos los insights están encriptados con tu Clave Maestra y almacenados localmente en tu dispositivo. Solo son accesibles cuando ingresas exactamente la misma Clave Maestra que se usó para encriptarlos. Los insights siempre se cargan cuando están disponibles para mejorar tus conversaciones, pero puedes eliminarlos individualmente usando el editor de insights si ya no quieres que se usen.</p>
                </div>
                `,
                images: [
                    {
                        src: "insights_feature.png",
                        alt: "Interruptor de Función de Insights",
                        caption: "El interruptor de Insights en la pestaña de Configuración de la interfaz de chat"
                    },
                    {
                        src: "insights_editor.png",
                        alt: "Editor de Insights",
                        caption: "La interfaz del Editor de Insights para gestionar insights almacenados"
                    },
                    {
                        src: "Insightslog.png",
                        alt: "Logs de la Función de Insights",
                        caption: "Los logs de Insights en la consola del navegador"
                    }
                ]
            },
            {
                 id: "chat-advanced-features",
                 title: "Funciones Avanzadas de Chat",
                 content: `
                      <h4>Control del Tamaño de Contexto</h4>
                      <p>El tamaño de contexto determina cuánta conversación previa puede "recordar" y usar la IA al generar respuestas:</p>
                      <ul>
                          <li><strong>Tamaño de Contexto Automático</strong> - Al seleccionar un modelo, el sistema establece automáticamente el tamaño de contexto óptimo basado en las capacidades del modelo</li>
                          <li><strong>Optimización Específica del Modelo</strong> - Se detecta y aplica la ventana de contexto nativa de cada modelo</li>
                          <li><strong>Conservación de Recursos</strong> - Inicialmente limitado a 8K para prevenir uso excesivo de recursos, pero puede aumentarse manualmente</li>
                          <li><strong>Ajuste Manual</strong> - Seleccione el tamaño de contexto deseado del menú desplegable (de 1K a 10M tokens) para sobrescribir la configuración automática</li>
                          <li><strong>Configuraciones Persistentes</strong> - Su preferencia de tamaño de contexto se recuerda a través de sesiones para cada modelo</li>
                      </ul>
                      
                      <h5>Cómo el Tamaño de Contexto Afecta el Uso de Memoria</h5>
                      <p>El tamaño de contexto tiene un impacto directo en los requisitos de RAM y VRAM (memoria de tarjeta gráfica):</p>
                      <ul>
                          <li><strong>Cálculo de memoria</strong> - Para cada token en su ventana de contexto, el modelo necesita asignar memoria para cálculos de atención</li>
                          <li><strong>Relación de escalado</strong> - El uso de memoria escala cuadráticamente con el tamaño de contexto, no linealmente (duplicar el tamaño de contexto puede cuadruplicar los requisitos de memoria)</li>
                          <li><strong>Factores combinados</strong> - El uso total de memoria depende tanto del tamaño del modelo (parámetros) como de la longitud del contexto</li>
                      </ul>
                      
                      <h5>Pautas de Tamaño de Contexto Manual</h5>
                      <p>Como guía general para requisitos de memoria:</p>
                      <ul>
                          <li><strong>Contexto 4K</strong> - Requiere aproximadamente 1GB de VRAM/RAM</li>
                          <li><strong>Contexto 8K</strong> - Requiere aproximadamente 2GB de VRAM/RAM</li>
                          <li><strong>Contexto 16K</strong> - Requiere aproximadamente 4GB de VRAM/RAM</li>
                          <li><strong>Contexto 32K</strong> - Requiere aproximadamente 8GB de VRAM/RAM</li>
                          <li><strong>Contexto 64K</strong> - Requiere aproximadamente 16GB de VRAM/RAM</li>
                          <li><strong>Contexto 128K+</strong> - Requiere 32GB+ VRAM/RAM para sistemas de alta gama</li>
                      </ul>
                      
                      <p>Cuando aumente el tamaño de contexto, observe estas señales de presión de memoria:</p>
                      <ul>
                          <li>La respuesta del modelo no tiene sentido o el modelo vuelca el prompt del sistema en la respuesta (baje primero el contexto a una configuración pequeña para verificar que la respuesta sea correcta, luego aumente con precaución)</li>
                          <li>Generación de respuestas más lenta</li>
                          <li>Sistema menos responsivo</li>
                          <li>Errores de Ollama relacionados con condiciones de memoria insuficiente</li>
                          <li>Indicador de porcentaje de contexto volviéndose naranja o rojo</li>
                      </ul>
                      
                      <div class="note">
                          <p><strong>Consejo:</strong>Si experimenta problemas de memoria, siempre pruebe primero una configuración conservadora.</p>
                      </div>
                      
                      <h4>Modelos de Razonamiento Nativo (Ollama 0.9.0+)</h4>
                      <p>Paiperwork soporta la funcionalidad de razonamiento nativo de Ollama para modelos de razonamiento compatibles, que permite a los modelos de IA mostrar su proceso de razonamiento paso a paso:</p>
                      
                      <h5>Requisitos del Sistema</h5>
                      <ul>
                          <li><strong>Versión de Ollama</strong> - Requiere Ollama 0.9.0 o superior para soporte de razonamiento nativo</li>
                          <li><strong>Modelos Compatibles</strong> - Funciona con modelos habilitados para razonamiento como DeepSeek-R1 y modelos de razonamiento qwen3 (más vendrán en versiones futuras)</li>
                          <li><strong>Detección Automática</strong> - Paiperwork detecta automáticamente su versión de Ollama y compatibilidad del modelo</li>
                      </ul>
                      
                      <h5>Botón de Alternancia de Razonamiento</h5>
                      <p>Cuando selecciona un modelo de razonamiento compatible con Ollama 0.9.0+, aparece automáticamente un botón de alternancia de razonamiento:</p>
                      <ul>
                          <li><strong>Aparición Automática</strong> - El botón solo se muestra cuando tanto la versión de Ollama como el modelo soportan razonamiento</li>
                          <li><strong>Control de Alternancia</strong> - Haga clic para habilitar o deshabilitar la visualización del proceso de razonamiento del modelo</li>
                          <li><strong>Indicador Visual</strong> - El botón muestra un estado activo cuando el razonamiento está habilitado</li>
                          <li><strong>Configuración Persistente</strong> - Su preferencia de razonamiento se recuerda a través de sesiones</li>
                      </ul>
                      
                      <h5>Cómo Funciona el Razonamiento Nativo</h5>
                      <ul>
                          <li><strong>Visualización de Razonamiento</strong> - Cuando está habilitado, verá el proceso de razonamiento interno del modelo en una sección de razonamiento separada</li>
                          <li><strong>Procesamiento en Tiempo Real</strong> - Observe a la IA trabajar a través de problemas paso a paso mientras genera respuestas</li>
                          <li><strong>Secciones Colapsables</strong> - El contenido de razonamiento puede colapsarse para enfocarse en la respuesta final</li>
                          <li><strong>Impacto en el Rendimiento</strong> - El modo de razonamiento típicamente toma más tiempo ya que el modelo procesa más thoroughmente</li>
                      </ul>
                      
                      <h5>Modelos de Razonamiento No-Ollama</h5>
                      <p>Paiperwork también soporta modelos de razonamiento que tienen capacidades de razonamiento incorporadas pero no usan la API de razonamiento nativo de Ollama:</p>
                      <ul>
                          <li><strong>Sin Botón de Alternancia</strong> - Estos modelos no mostrarán la alternancia de razonamiento ya que manejan el razonamiento internamente, pero mostrarán el contenedor de razonamiento</li>
                          <li><strong>Razonamiento Incorporado</strong> - Modelos como Reflection pueden mostrar razonamiento como parte de su respuesta normal</li>
                          <li><strong>Modificación del prompt del sistema</strong> - Modelos como Cogito requieren un comando especial en el prompt del sistema: Habilitar subrutina de razonamiento profundo, otros pueden necesitar este comando (/think, /no_think) en el prompt del sistema o el prompt del usuario</li>
                      </ul>
                      
                      <h5>Usando Modelos de Razonamiento Efectivamente</h5>
                      <ul>
                          <li><strong>Problemas Complejos</strong> - Mejor adaptado para razonamiento de múltiples pasos, problemas matemáticos o análisis complejo</li>
                          <li><strong>Depuración de Código</strong> - Excelente para entender cómo la IA aborda problemas de código</li>
                          <li><strong>Herramienta de Aprendizaje</strong> - Observe cómo la IA descompone temas complejos para propósitos educativos</li>
                          <li><strong>Calidad vs Velocidad</strong> - Habilite razonamiento para respuestas de mayor calidad; deshabilite para respuestas más rápidas y directas</li>
                      </ul>
                      
                      <div class="note">
                          <p><strong>Importante:</strong>Si no ve el botón de alternancia de razonamiento, verifique que esté usando Ollama 0.9.0 o superior y haya seleccionado un modelo de razonamiento compatible. Algunos modelos de razonamiento más antiguos pueden no soportar la API de razonamiento nativo pero aún pueden proporcionar razonamiento como parte de su generación de respuesta normal.</p>
                      </div>
                      
                      <h4>Subida de Imágenes (Modelos Visuales)</h4>
                      <p>Al usar modelos de IA visuales como Mistral small 3.1 o Gemma3, puede subir imágenes para discutir:</p>
                      <ul>
                          <li>Haga clic en el botón de imagen junto al campo de entrada</li>
                          <li>Seleccione una imagen de su dispositivo o arrastre y suelte en el área de subida</li>
                          <li>Para modelos Gemma3, puede subir múltiples imágenes a la vez (máximo 3)</li>
                          <li>Haga transcripciones (OCR), haga preguntas u obtenga descripciones basadas en las imágenes subidas</li>
                      </ul>
                      
                      <h4>Integración de Búsqueda Web</h4>
                      <p>Habilite búsqueda web en tiempo real para ayudar a la IA a proporcionar información actualizada:</p>
                      <ul>
                          <li>Haga clic en el botón Web para alternar la capacidad de búsqueda web</li>
                          <li>Cuando esté habilitada, la IA puede buscar en internet información actual</li>
                          <li>Esto es especialmente útil para preguntas sobre eventos recientes o hechos específicos</li>
                          <li>La búsqueda web solo envía el prompt de búsqueda a la web (Bing.com) para consultas, no se envían datos personales, estadísticas o métricas</li>
                      </ul>
                      
                      <h4>Imagen + Búsqueda Web (Función Avanzada)</h4>
                      <p>Combine análisis de imagen con búsqueda web para capacidades potentes de investigación visual:</p>
                      <h5>Cómo Funciona</h5>
                      <ol>
                          <li><strong>Subir una Imagen</strong> - Agregue una imagen usando el botón de subida de imagen</li>
                          <li><strong>Habilitar Búsqueda Web</strong> - Asegúrese de que el botón Web esté activado (Naranja)</li>
                          <li><strong>Haga Su Pregunta</strong> - Describa lo que quiere encontrar sobre o similar a su imagen</li>
                          <li><strong>Análisis de IA</strong> - La IA primero analiza su imagen para generar términos de búsqueda</li>
                          <li><strong>Búsqueda Web</strong> - El sistema busca en la web usando palabras clave generadas por IA</li>
                          <li><strong>Respuesta Combinada</strong> - Recibe tanto análisis visual como resultados de búsqueda web</li>
                      </ol>
                      
                      <h5>Perfecto para:</h5>
                      <ul>
                          <li>Encontrar imágenes o productos similares en línea</li>
                          <li>Investigar estilos arquitectónicos, obras de arte o diseños</li>
                          <li>Identificar plantas, animales u objetos con contexto adicional</li>
                          <li>Obtener información de mercado sobre productos que fotografía</li>
                          <li>Encontrar contexto histórico o cultural para imágenes</li>
                          <li>Búsqueda reversa de imágenes con mejora de IA</li>
                      </ul>
                      
                      <h5>Requisitos:</h5>
                      <ul>
                          <li>Modelo de IA visual seleccionado (Qwen2.5vl, Mistral-small3.1, Gemma3, LLaVA, etc.)</li>
                          <li>Búsqueda web habilitada (botón Web activo)</li>
                          <li>Imagen clara y de alta calidad subida (tamaño: máximo 5mb)</li>
                          <li>Conexión a internet para funcionalidad de búsqueda web</li>
                      </ul>
                      
                      <h5>Ejemplo de Uso:</h5>
                      <p class="example-prompt"><strong>Prompt de Muestra:</strong>"Encuentra imágenes e información sobre muebles similares a esta silla. Estoy buscando piezas de mediados de siglo moderno con elementos de diseño similares y quiero saber sobre precios y dónde comprarlos."</p>
                      <p>Esto resultaría en:</p>
                      <ol>
                          <li>IA analizando el estilo, materiales y características de diseño de la silla</li>
                          <li>Búsqueda web para "silla moderna de mediados de siglo patas de madera asiento tapizado diseño muebles"</li>
                          <li>Respuesta combinada con análisis visual + productos similares + precios + minoristas</li>
                      </ol>
                      
                      <div class="note">
                          <p><strong>Consejo Profesional:</strong>Sea específico sobre lo que quiere encontrar. En lugar de solo "encontrar imágenes similares", pruebe "encontrar pósters vintage similares de los 1950s con información de precios" o "identificar esta especie de planta y encontrar instrucciones de cuidado."</p>
                      </div>
                      
                     <h4>Exportar Conversaciones</h4>
                      <p>Puede exportar todo su historial de conversación en diferentes formatos:</p>
                      <ul>
                          <li>Navegue a la pestaña Chat y desplácese hasta la parte inferior de la interfaz</li>
                          <li>Haga clic en el botón "Exportar Conversación" ubicado justo encima del botón "Limpiar Sesión Actual"</li>
                          <li>Elija entre formatos de texto plano (.txt), markdown (.md) o HTML (.html)</li>
                          <li>Los archivos descargados incluyen todos los mensajes y preservan el formato del código</li>
                      </ul>
                  `,
                images: [
                    {
                        src: "chat_export.png",
                        alt: "Exportación de chat",
                        caption: "Funciones de exportación de chat"
                    },
                    {
                        src: "thinking_toggle_button.png",
                        alt: "Alternar Razonamiento Nativo",
                        caption: "El botón de alternar razonamiento que aparece con modelos compatibles y Ollama 0.9.0+"
                    }
                ]
            },
            {
                id: "chat-code-blocks",
                title: "Trabajando con Bloques de Código",
                content: `
                <p>Paiperwork proporciona soporte mejorado para bloques de código dentro de conversaciones:</p>
                
                <h4>Funciones de Bloques de Código</h4>
                <ul>
                    <li><strong>Resaltado de Sintaxis</strong> - El código se colorea según el lenguaje de programación</li>
                    <li><strong>Detección de Lenguaje</strong> - La IA identifica y etiqueta automáticamente el lenguaje del código</li>
                    <li><strong>Botón Copiar</strong> - Copiado de bloques de código al portapapeles con un clic</li>
                    <li><strong>Números de Línea</strong> - Para referencia más fácil en fragmentos largos</li>
                </ul>
                
                <h4>Ejecutando Código</h4>
                <p>Para lenguajes soportados, puedes ejecutar código directamente desde la interfaz de chat:</p>
                <ul>
                    <li><strong>Vista Previa HTML</strong> - Renderiza código HTML para ver el resultado inmediatamente. Consejo: Pide a la IA que incluya cualquier código CSS o JavaScript dentro del HTML para evitar errores, ya que el código HTML estará aislado en una ventana flotante sin acceso a otros archivos de configuración o código</li>
                </ul>
                
                <div class="note">
                    <p><strong>Nota de Seguridad:</strong> La ejecución de código ocurre en sandboxes aislados para garantizar seguridad.</p>
                </div>
            `,

                images: [
                    {
                        src: "code_blocks.png",
                        alt: "Funciones de Bloques de Código",
                        caption:
                            "Bloque de código HTML con resaltado de sintaxis y opciones de ejecución",
                    },
                    {
                        src: "HTML-sandboxed.png",
                        alt: "Código HTML ejecutándose en sandbox",
                        caption: "Código HTML ejecutándose en una ventana flotante aislada."
                    }
                ]
            },
            {
                id: "chat-scroll-behavior",
                title: "Desplazamiento y Navegación",
                content: `
                <p>La interfaz de chat incluye comportamiento de desplazamiento inteligente para mejorar la usabilidad durante conversaciones:</p>
                
                <h4>Auto-desplazamiento</h4>
                <ul>
                    <li>Los nuevos mensajes se desplazan automáticamente a la vista</li>
                    <li>Durante la generación de respuesta de IA, la vista sigue el mensaje mientras crece</li>
                    <li>El auto-desplazamiento se deshabilita temporalmente cuando te desplazas manualmente hacia arriba para leer mensajes anteriores</li>
                    <li>El auto-desplazamiento se reabilita después de un período de inactividad (aproximadamente 5 segundos)</li>
                    <li>El auto-desplazamiento se reabilita inmediatamente si te desplazas completamente hacia abajo</li>
                </ul>
                
                <h4>Conversaciones Largas</h4>
                <p>Para navegar conversaciones largas:</p>
                <ul>
                    <li>Desplázate libremente para revisar mensajes anteriores</li>
                    <li>La barra de navegación pegajosa permanece accesible en la parte superior</li>
                    <li>Los cambios al prompt del sistema o tamaño de contexto agregarán un botón "Continuar Conversación" para ayudar a mantener el contexto, también nota que si te quedas sin contexto, aparecerá el botón continuar (El botón continuar siempre calculará cuántos mensajes pasados recapitular basado en tu tamaño de contexto actual y usará 25% de él para evitar que los mensajes pasados desborden tu contexto)</li>
                </ul>
            `,
            },
            {
                id: "chat-conversation-sessions",
                title: "Gestionando Sesiones de Conversación",
                content: `
                <p>Paiperwork organiza tus conversaciones en grupos de sesión que te ayudan a seguir el rastro de diferentes hilos de discusión dentro del mismo tema.</p>
                
                <h4>Lista de Sesiones de Conversación</h4>
                <p>La barra lateral izquierda en la vista de chat muestra tus sesiones de conversación:</p>
                <ul>
                    <li>Cada sesión muestra una vista previa del primer mensaje</li>
                    <li>Las sesiones muestran la fecha y hora en que fueron creadas</li>
                    <li>Las sesiones están separadas por líneas divisorias sutiles para fácil distinción</li>
                    <li>Las sesiones más recientes aparecen en la parte superior</li>
                </ul>
                
                <h4>Trabajando con Sesiones</h4>
                <ul>
                    <li><strong>Cargar una sesión</strong> - Haz clic en cualquier sesión para cargar la conversación</li>
                    <li><strong>Eliminar una sesión</strong> - Pasa el cursor sobre una sesión y haz clic en el botón "×" que aparece</li>
                    <li><strong>Sesión activa</strong> - La sesión actualmente cargada está resaltada</li>
                </ul>
                
                <h4>Iniciando una Nueva Conversación</h4>
                <p>Para comenzar una conversación fresca sin cambiar tu tema:</p>
                <ol>
                    <li>Haz clic en el botón "Nuevo Chat" en la parte superior de la lista de sesiones</li>
                    <li>Esto limpia la conversación actual y reinicia el contexto</li>
                    <li>Aparece un mensaje de bienvenida indicando que has iniciado una nueva conversación</li>
                    <li>Todas las sesiones anteriores permanecen accesibles en la barra lateral</li>
                </ol>
                
                <h4>Continuando Conversaciones</h4>
                <p>Cuando seleccionas una sesión anterior:</p>
                <ul>
                    <li>El historial completo de conversación se carga</li>
                    <li>Aparece un botón "Continuar Conversación" en la parte inferior</li>
                    <li>Haz clic en este botón para reanudar la conversación con contexto completo</li>
                    <li>El campo de entrada permanece deshabilitado hasta que hagas clic en continuar, previniendo mensajes accidentales</li>
                </ul>
                
                <div class="note">
                    <p><strong>Nota:</strong> Eliminar una sesión es permanente y no se puede deshacer. Cuando eliminas un grupo de conversación, solo ese hilo específico se remueve - todas las otras sesiones dentro de la misma Clave Maestra permanecen intactas.</p>
                </div>
            `,
                image: "conversations-list.png",
                imageAlt: "Interfaz de Sesiones de Conversación",
                imageCaption: "La lista de sesiones mostrando múltiples hilos de conversación con texto de vista previa y marcas de tiempo",
            },
        ],
    },

    documents: {
        title: "Documentos",
        intro:
            "La pestaña de Documentos te permite subir, gestionar e interactuar con tus documentos usando asistencia de IA.",
        articles: [
            {
                id: "docs-intro",
                title: "Introducción a Documentos",
                content: `
                <p>La pestaña de Documentos te permite trabajar con tus documentos de texto y PDF, aprovechando la IA para ayudarte a entender y extraer información de ellos.</p>
                
                <p>Con la función de Documentos, puedes:</p>
                <ul>
                    <li>Subir archivos PDF y de texto</li>
                    <li>Hacer preguntas sobre documentos específicos</li>
                    <li>Generar resúmenes comprehensivos</li>
                    <li>Buscar en tu colección de documentos</li>
                    <li>Gestionar tu biblioteca de documentos</li>
                </ul>
                
                <div class="note">
                    <p><strong>Nota:</strong> Los documentos están encriptados de forma segura usando tu Clave Maestra y almacenados localmente en tu dispositivo, asegurando que tu información sensible permanezca privada.</p>
                </div>
            `,
                image: "documents_intro.png",
                imageAlt: "Vista General de la Pestaña de Documentos",
                imageCaption:
                    "La interfaz de la pestaña de Documentos mostrando el área de subida y la lista de documentos",
            },
            {
                id: "docs-model-compatibility",
                title: "Compatibilidad de Modelos para Documentos",
                content: `
                <p>La función de Documentos requiere modelos de IA que soporten embeddings para funcionar correctamente. Entender la compatibilidad de modelos te ayudará a evitar problemas y optimizar tu flujo de trabajo con documentos.</p>
                
                <h4>Modelos y Soporte de Embeddings</h4>
                <p>Para que la funcionalidad de procesamiento y búsqueda de documentos funcione, necesitas modelos que soporten la generación de embeddings:</p>
                <ul>
                  <li><strong>Modelos compatibles</strong> incluyen: nomic-embed-text, llama3 (varios tamaños), mistral, mixtral, y otros modelos específicamente diseñados para soportar embeddings (Deepseek, Qwen, etc)</li>
                  <li><strong>Modelos incompatibles</strong>: Algunos modelos no soportan embeddings y activarán una notificación de advertencia si intentas usarlos con la función de Documentos</li>
                  <li><strong>Modelos visuales</strong>: Los modelos visuales a veces tienen el procesamiento de embeddings removido de su código</li>
                </ul>
                
                <h4>Sistema de Advertencia de Embeddings</h4>
                <p>Cuando intentas usar un modelo que no soporta embeddings para operaciones de documentos, el sistema:</p>
                <ul>
                  <li>Mostrará una notificación de advertencia prominente</li>
                  <li>Explicará que el modelo seleccionado es incompatible con la funcionalidad de búsqueda de documentos</li>
                  <li>Sugerirá modelos alternativos que soportan embeddings</li>
                  <li>Proporcionará un enlace para encontrar modelos capaces de embeddings</li>
                </ul>
                <p>La notificación de advertencia se descartará automáticamente después de 30 segundos o puedes cerrarla manualmente haciendo clic en el botón "Entiendo".</p>
                
                <h4>Optimización del Flujo de Trabajo</h4>
                <p>Puedes optimizar tu flujo de trabajo con documentos entendiendo cuándo se crean y usan los embeddings:</p>
                <ul>
                  <li><strong>Procesamiento inicial de documentos</strong>: Los embeddings se crean cuando subes y procesas documentos por primera vez</li>
                  <li><strong>Consultas posteriores de documentos</strong>: Después de que los documentos sean procesados, puedes cambiar a un modelo diferente (con soporte de embeddings) para consultas sin necesidad de regenerar embeddings</li>
                </ul>
                
                <h4>Usando Diferentes Modelos para Diferentes Tareas</h4>
                <p>Una estrategia útil de flujo de trabajo:</p>
                <ol>
                  <li>Selecciona un modelo pequeño capaz de embeddings (como nomic-embed-text) al subir y procesar documentos</li>
                  <li>Después de que los documentos sean procesados, puedes cambiar a un modelo más potente (con soporte de embeddings) para mejor respuesta a preguntas</li>
                  <li>El sistema usará los embeddings almacenados del procesamiento original independientemente del modelo que tengas seleccionado actualmente</li>
                </ol>
                
                <div class="note">
                  <p><strong>Consejo Pro:</strong> Para resultados óptimos, usa modelos de embeddings dedicados como nomic-embed-text para el procesamiento inicial de documentos, luego cambia a modelos de lenguaje más grandes como llama3:70b, Gemma3, Qwen3, etc, para consultas y análisis de documentos más sofisticados.</p>
                </div>
              `,
                image: "model-embedding-warning.png",
                imageAlt: "Advertencia de Embedding de Modelo",
                imageCaption: "Notificación de advertencia al intentar usar un modelo que no soporta embeddings"
            },
            {
                id: "docs-uploading",
                title: "Subiendo Documentos",
                content: `
                <p>Puedes agregar fácilmente documentos a tu biblioteca a través de la interfaz de subida.</p>
                
                <h4>Cómo Subir Documentos</h4>
                <ol>
                    <li>Navega a la pestaña de Documentos</li>
                    <li>Arrastra y suelta archivos PDF o de texto en la zona de subida, o haz clic en el área de subida para buscar archivos</li>
                    <li>Selecciona uno o más archivos de tu dispositivo</li>
                    <li>Espera a que el procesamiento se complete</li>
                </ol>
                
                <h4>Procesando Tus Documentos</h4>
                <p>Cuando subes documentos, el sistema:</p>
                <ul>
                    <li>Verifica que los archivos PDF tengan contenido de texto extraíble</li>
                    <li>Divide el contenido en fragmentos manejables</li>
                    <li>Crea representaciones amigables con IA (embeddings) del contenido</li>
                    <li>Encripta y almacena todo de forma segura localmente</li>
                    <li>Hace que el documento esté disponible para preguntas y búsquedas</li>
                </ul>
                
                <h4>Detección de Texto en PDF</h4>
                <p>Paiperwork verifica automáticamente los archivos PDF para asegurar que contengan texto extraíble:</p>
                <ul>
                    <li>Cada PDF se analiza para detectar contenido de texto antes de que comience el procesamiento</li>
                    <li>Si un PDF no contiene texto extraíble (como imágenes escaneadas sin OCR), recibirás una notificación de advertencia</li>
                    <li>Los PDFs sin texto no pueden ser procesados para RAG ya que requieren contenido de texto para embedding y búsqueda</li>
                    <li>Para PDFs que solo contienen imágenes, considera usar un modelo de IA visual para extracción de texto o una herramienta OCR para convertir imágenes a texto antes de subirlas</li>
                </ul>
                
                <div class="note">
                    <p><strong>Importante:</strong> Asegúrate de haber seleccionado un modelo de IA antes de subir documentos en la pestaña de Chat. El modelo seleccionado se usará para procesar los documentos.</p>
                </div>
            `,
                image: "documents-upload.png",
                imageAlt: "Proceso de Subida de Documentos",
                imageCaption:
                    "Zona de subida con indicador de progreso para el procesamiento de documentos",
            },
            {
                id: "docs-management",
                title: "Gestionando Tus Documentos",
                content: `
                <p>Después de subir, tus documentos aparecen en la lista de documentos donde puedes gestionarlos.</p>
                
                <h4>Información del Documento</h4>
                <p>Cada entrada de documento muestra:</p>
                <ul>
                    <li>Título/nombre del archivo del documento</li>
                    <li>Información del autor (cuando esté disponible)</li>
                    <li>Fecha de agregado a tu biblioteca</li>
                    <li>Conteo de páginas (para archivos PDF)</li>
                    <li>Número de fragmentos de texto creados</li>
                    <li>Estado de procesamiento (Procesando o Indexado)</li>
                </ul>
                
                <h4>Acciones de Documento</h4>
                <p>Puedes realizar varias acciones con tus documentos:</p>
                <ul>
                    <li><strong>Seleccionar/Deseleccionar</strong> - Haz clic en un documento para seleccionarlo y acceder a opciones adicionales</li>
                    <li><strong>Eliminar</strong> - Remover un documento de tu biblioteca</li>
                    <li><strong>Generar Resumen</strong> - Crear un resumen comprehensivo del contenido del documento</li>
                    <li><strong>Hacer Preguntas</strong> - Entrar al Modo de Documento para hacer preguntas específicas sobre el documento</li>
                </ul>
            `,
                image: "documents_management.png",
                imageAlt: "Interfaz de Gestión de Documentos",
                imageCaption:
                    "La interfaz de gestión de documentos mostrando entradas de documentos y botones de acción",
            },
            {
                id: "docs-summaries",
                title: "Resúmenes de Documentos",
                content: `
                <p>La función de resumen crea una vista general comprehensiva del contenido de tu documento, ayudándote a entender rápidamente sus puntos clave.</p>
                
                <h4>Generando un Resumen</h4>
                <ol>
                    <li>Selecciona un documento de tu biblioteca (haz clic en él)</li>
                    <li>Haz clic en el botón "Generar Resumen" que aparece</li>
                    <li>Espera mientras la IA lee y analiza tu documento</li>
                    <li>Revisa el resumen generado en la ventana modal</li>
                </ol>
                
                <h4>Características del Resumen</h4>
                <ul>
                    <li><strong>Seguimiento de Progreso</strong> - Observa la barra de progreso mientras la IA trabaja en tu documento</li>
                    <li><strong>Visualización Incremental</strong> - Ve el resumen construirse en tiempo real para documentos más largos</li>
                    <li><strong>Botón Copiar</strong> - Copia todo el resumen a tu portapapeles con un clic</li>
                    <li><strong>Opción Cancelar</strong> - Detén la generación del resumen si es necesario</li>
                </ul>
                
                <h4>Requisitos de Tamaño de Contexto</h4>
                <p>Mientras más grande sea el resumen del documento, más contexto necesitas en tu modelo de IA. Como guía general:</p>
                <ul>
                    <li><strong>Documentos pequeños</strong> (menos de 5,000 palabras) - tamaño de contexto de 4K es usualmente suficiente</li>
                    <li><strong>Documentos medianos</strong> (5,000-15,000 palabras) - tamaño de contexto de 8K recomendado</li>
                    <li><strong>Documentos grandes</strong> (15,000-50,000 palabras) - tamaño de contexto de 16K o mayor</li>
                    <li><strong>Documentos muy grandes</strong> (50,000+ palabras) - tamaño de contexto de 32K o mayor</li>
                </ul>
                <p>Para contexto, una página típica de espacio simple contiene aproximadamente 500 palabras, así que un PDF de 20 páginas necesitaría al menos 8K de contexto para una resumición efectiva.</p>
                
                <div class="note">
                    <p><strong>Consejo:</strong> Para documentos grandes, el sistema los procesa en lotes más pequeños y luego crea un resumen general, asegurando cobertura comprehensiva incluso para contenido extenso.</p>
                </div>
            `,
                image: "document_summary.png",
                imageAlt: "Modal de Resumen de Documento",
                imageCaption:
                    "Modal de resumen mostrando la vista general del documento generada con opción de copiar",
            },
            {
                id: "docs-questioning",
                title: "Haciendo Preguntas Sobre Documentos",
                content: `
                <p>El Modo de Documento te permite tener una conversación con la IA específicamente sobre un solo documento.</p>
                
                <h4>Entrando al Modo de Documento</h4>
                <ol>
                    <li>Selecciona un documento de tu biblioteca</li>
                    <li>Haz clic en el botón "Hacer Preguntas"</li>
                    <li>El sistema te redirigirá a la pestaña de Chat con el Modo de Documento habilitado</li>
                    <li>Aparecerá un indicador especial mostrando que estás en Modo de Documento</li>
                </ol>
                
                <h4>Usando el Modo de Documento</h4>
                <ul>
                    <li>Haz preguntas específicas sobre el contenido del documento</li>
                    <li>Solicita explicaciones de conceptos mencionados en el documento</li>
                    <li>Pide comparaciones entre diferentes secciones</li>
                    <li>Solicita información factual contenida en el documento</li>
                </ul>
                
                <h4>Saliendo del Modo de Documento</h4>
                <p>Cuando termines de trabajar con un documento específico:</p>
                <ul>
                    <li>Haz clic en el botón "Salir del Modo de Documento" en la barra indicadora</li>
                    <li>Volverás al modo de chat normal donde puedes discutir temas generales</li>
                </ul>
                
                <div class="note">
                    <p><strong>Importante:</strong> En el Modo de Documento, la IA se enfoca exclusivamente en el contenido del documento seleccionado, usando su conocimiento para ayudar a interpretar pero sin agregar información externa.</p>
                </div>
            `,
                image: "document_mode.png",
                imageAlt: "Interfaz del Modo de Documento",
                imageCaption:
                    "Interfaz de chat mostrando el indicador del Modo de Documento al hacer preguntas sobre un documento específico",
            },
            {
                id: "docs-searching",
                title: "Buscando en Documentos",
                content: `
            <p>Paiperwork hace fácil buscar información en todos tus documentos subidos directamente desde la interfaz de chat.</p>
            
            <h4>Búsqueda Global de Documentos</h4>
            <p>Cuando estás en la pestaña de Documentos, cualquier pregunta que hagas a través de la interfaz de Chat buscará automáticamente en todos tus documentos:</p>
            <ol>
                <li>Cambia a la pestaña de Documentos primero para activar la funcionalidad de búsqueda de documentos</li>
                <li>Escribe tu consulta de búsqueda o pregunta en el campo de entrada del chat</li>
                <li>La IA buscará automáticamente en todos tus documentos información relevante</li>
                <li>Los resultados de múltiples documentos se combinarán en una respuesta comprehensiva</li>
            </ol>
            
            <h4>Resultados de Búsqueda</h4>
            <p>Al usar búsqueda de documentos, la IA:</p>
            <ul>
                <li>Mostrará un indicador "Buscando documentos..." mientras recopila información</li>
                <li>Encontrará los pasajes más relevantes en todos tus documentos</li>
                <li>Priorizará resultados de documentos diversos para proporcionar cobertura comprehensiva</li>
                <li>Usará búsqueda semántica para entender el significado de tu consulta, no solo coincidir palabras clave</li>
                <li>Generará una respuesta que sintetiza información de todos los documentos relevantes</li>
                <li>Incluirá citas a documentos fuente cuando sea apropiado</li>
            </ul>
            
            <h4>Búsqueda Semántica vs. Búsqueda por Palabras Clave</h4>
            <p>Paiperwork usa tecnología de búsqueda semántica que entiende el significado detrás de tus preguntas:</p>
            <ul>
                <li>Puedes preguntar en lenguaje natural en lugar de usar palabras clave específicas</li>
                <li>El sistema encontrará información conceptualmente relacionada incluso cuando los términos exactos difieran</li>
                <li>La búsqueda es consciente del contexto y entiende sinónimos y conceptos relacionados</li>
                <li>Los resultados se clasifican por relevancia a tu pregunta específica</li>
            </ul>
            
            <div class="note">
                <p><strong>Consejo:</strong> Para mejores resultados, haz preguntas específicas sobre la información que buscas en lugar de usar términos de búsqueda genéricos. Por ejemplo, pregunta "¿Cuáles son las cifras de ventas trimestrales para 2024?" en lugar de solo "datos de ventas."</p>
            </div>
        `,
            },
            {
                id: "docs-memory-limits",
                title: "Limitaciones de Memoria y Mejores Prácticas",
                content: `
                <p>Al trabajar con documentos en Paiperwork, es importante entender cómo el uso de memoria afecta el rendimiento, especialmente al usar búsqueda global de documentos.</p>
                
                <h4>Consideraciones de Memoria con Búsqueda Global</h4>
                <p>La búsqueda global de documentos (buscar en todos los documentos simultáneamente) puede ser intensiva en memoria porque:</p>
                <ul>
                    <li>Todos los fragmentos de documentos relevantes deben cargarse en memoria a la vez</li>
                    <li>El modelo de IA necesita procesar estos fragmentos junto con tu consulta</li>
                    <li>Los navegadores web tienen asignación de memoria limitada comparada con aplicaciones de escritorio</li>
                    <li>A medida que el conteo y tamaño de documentos aumenta, los requisitos de memoria crecen exponencialmente</li>
                </ul>
                
                <h4>Señales de Presión de Memoria</h4>
                <p>Observa estos indicadores de que te estás acercando a los límites de memoria:</p>
                <ul>
                    <li>El navegador se vuelve lento o no responde</li>
                    <li>Demoras largas al cambiar entre pestañas</li>
                    <li>Mensajes de error sobre "sin memoria" o advertencias similares</li>
                    <li>Pestañas del navegador que se cuelgan o congelan</li>
                    <li>Respuestas de IA terminadas inesperadamente</li>
                </ul>
                
                <h4>Mejores Prácticas para Gestión de Documentos</h4>
                <p>Para evitar problemas de memoria al trabajar con documentos:</p>
                <ul>
                    <li><strong>Usa Modo Específico de Documento</strong> - Al trabajar con documentos grandes, selecciona un documento específico y usa "Hacer Preguntas" para entrar al modo de documento en lugar de búsqueda global</li>
                    <li><strong>Limita el Uso de Búsqueda Global</strong> - Reserva la búsqueda global para escenarios con colecciones de documentos más pequeñas o cuando específicamente necesites encontrar información en múltiples documentos</li>
                    <li><strong>Organiza Documentos Estratégicamente</strong> - Agrupa documentos relacionados para que puedas trabajar con subconjuntos específicos en lugar de toda tu biblioteca</li>
                    <li><strong>Cierra Otras Aplicaciones</strong> - Al trabajar con documentos grandes, cierra otras aplicaciones intensivas en memoria y pestañas del navegador</li>
                    <li><strong>Reinicia Ocasionalmente</strong> - Para sesiones extendidas de trabajo con documentos, reinicia tu navegador periódicamente para limpiar la memoria</li>
                </ul>
                
                <h4>Recomendaciones de Tamaño de Documento</h4>
                <p>Como guía general para búsqueda global:</p>
                <ul>
                    <li><strong>Uso seguro</strong>: 5-10 documentos pequeños a medianos (menos de 20 páginas cada uno)</li>
                    <li><strong>Se necesita precaución</strong>: 10-20 documentos o varios documentos más grandes (20-50 páginas)</li>
                    <li><strong>No recomendado</strong>: 20+ documentos o múltiples documentos grandes (50+ páginas)</li>
                </ul>
                
                <div class="note">
                    <p><strong>Importante:</strong> La búsqueda global de documentos está diseñada para acceso conveniente a través de una colección moderada de documentos. Para investigación intensiva que involucre documentos grandes o colecciones extensas, usa el modo de preguntas específicas de documento en su lugar. Esto enfoca los recursos de memoria en un documento a la vez, proporcionando mejor rendimiento y estabilidad.</p>
                </div>
            `,
            }
        ],
    },
    dataviz: {
        title: "DataViz",
        intro:
            "La pestaña DataViz te permite crear visualizaciones de datos interactivas describiendo tus datos a la IA.",
        articles: [
            {
                id: "dataviz-intro",
                title: "Introducción a la Visualización de Datos",
                content: `
                <p>La pestaña DataViz te permite generar varios gráficos y diagramas a partir de descripciones en lenguaje natural de tus datos. Simplemente selecciona un tipo de visualización y describe tus datos a la IA.</p>
                
                <p>Con DataViz, puedes:</p>
                <ul>
                    <li>Crear visualizaciones a partir de descripciones de texto</li>
                    <li>Generar gráficos sin formatear datos manualmente</li>
                    <li>Elegir entre múltiples tipos de visualización</li>
                    <li>Ver resultados inmediatamente en una ventana interactiva</li>
                    <li>Copiar visualizaciones generadas para usar en otras aplicaciones</li>
                </ul>
                
                <p>DataViz es perfecto para visualizar rápidamente conceptos, comparar puntos de datos o explorar tendencias sin necesidad de hojas de cálculo o herramientas especializadas.</p>
            `,
                image: "dataviz_intro.png",
                imageAlt: "Vista General de la Pestaña DataViz",
                imageCaption:
                    "La interfaz de la pestaña DataViz mostrando opciones de tipos de visualización",
            },
            {
                id: "dataviz-types",
                title: "Tipos de Visualización Disponibles",
                content: `
                <p>DataViz ofrece varias opciones de visualización para adaptarse a diferentes tipos de datos y necesidades analíticas:</p>
                
                <h4>Gráficos Circulares</h4>
                <p>Mejores para mostrar proporciones de un todo o comparar partes de un total. Ideales para:</p>
                <ul>
                    <li>Distribución de cuota de mercado</li>
                    <li>Asignación presupuestaria</li>
                    <li>Desglose de respuestas de encuestas</li>
                    <li>Cualquier dato donde los componentes sumen 100%</li>
                </ul>
                
                <h4>Gráficos de Barras</h4>
                <p>Perfectos para comparar cantidades entre diferentes categorías. Buenos para:</p>
                <ul>
                    <li>Comparaciones de ventas por región</li>
                    <li>Estadísticas de población</li>
                    <li>Resultados de encuestas con preguntas de opción múltiple</li>
                    <li>Métricas de rendimiento a través de períodos de tiempo</li>
                </ul>
                
                <h4>Gráficos de Líneas</h4>
                <p>Ideales para mostrar tendencias a lo largo del tiempo o datos continuos. Usar para:</p>
                <ul>
                    <li>Precios de acciones a lo largo del tiempo</li>
                    <li>Cambios de temperatura</li>
                    <li>Crecimiento de ingresos</li>
                    <li>Cualquier dato con una progresión clara</li>
                </ul>
                
                <h4>Gráficos de Dispersión</h4>
                <p>Mejores para mostrar relaciones entre dos variables. Perfectos para:</p>
                <ul>
                    <li>Análisis de correlación</li>
                    <li>Patrones de distribución</li>
                    <li>Identificar valores atípicos</li>
                    <li>Agrupar puntos de datos similares</li>
                </ul>
                
                <h4>Gráficos de Área</h4>
                <p>Similar a los gráficos de líneas pero con áreas rellenadas debajo de las líneas. Buenos para:</p>
                <ul>
                    <li>Mostrar cambios de volumen a lo largo del tiempo</li>
                    <li>Comparar totales acumulativos</li>
                    <li>Visualizar relaciones parte-todo a lo largo del tiempo</li>
                    <li>Enfatizar la magnitud de los cambios</li>
                </ul>
                
                <h4>Gráficos de Radar</h4>
                <p>Muestra datos multivariados como un gráfico bidimensional con tres o más variables cuantitativas. Ideales para:</p>
                <ul>
                    <li>Comparaciones de rendimiento a través de múltiples dimensiones</li>
                    <li>Evaluaciones de habilidades</li>
                    <li>Comparaciones de características de productos</li>
                    <li>Cualquier dato con múltiples atributos para comparar</li>
                </ul>
                
                <h4>Mapas de Calor</h4>
                <p>Usa intensidad de color para representar valores en formato de matriz. Perfectos para:</p>
                <ul>
                    <li>Matrices de correlación</li>
                    <li>Intensidad de datos geográficos</li>
                    <li>Patrones de clics en sitios web</li>
                    <li>Mostrar patrones en conjuntos de datos complejos</li>
                </ul>
                
                <h4>Gráficos de Burbujas</h4>
                <p>Como gráficos de dispersión pero con una dimensión adicional representada por el tamaño de la burbuja. Buenos para:</p>
                <ul>
                    <li>Comparar tres dimensiones de datos</li>
                    <li>Análisis de portafolio</li>
                    <li>Visualización de asignación de recursos</li>
                    <li>Comparaciones demográficas</li>
                </ul>
            `,
                image: "chart_types.png",
                imageAlt: "Tipos de Gráficos",
                imageCaption: "Los varios tipos de visualización disponibles en DataViz",
            },
            {
                id: "dataviz-usage",
                title: "Creando Visualizaciones",
                content: `
                <p>Crear visualizaciones de datos con DataViz es sencillo:</p>
                
                <h4>Paso 1: Selecciona un Tipo de Visualización</h4>
                <ol>
                    <li>Navega a la pestaña DataViz</li>
                    <li>Explora los tipos de gráficos disponibles</li>
                    <li>Haz clic en tu visualización preferida (circular, barras, líneas, etc.)</li>
                </ol>
                
                <h4>Paso 2: Describe Tus Datos</h4>
                <ol>
                    <li>Después de seleccionar un tipo de gráfico, volverás a la interfaz de chat</li>
                    <li>Nota que el campo de entrada ahora muestra un prompt especializado para tu gráfico seleccionado</li>
                    <li>Describe los datos que quieres visualizar en lenguaje natural</li>
                    <li>Sé lo más específico posible sobre categorías, valores y relaciones</li>
                </ol>
                
                <h4>Paso 3: Genera y Ve la Visualización</h4>
                <ol>
                    <li>La IA procesará tu descripción y generará un gráfico adecuado</li>
                    <li>Una ventana flotante mostrará la visualización</li>
                    <li>Si el gráfico no coincide con tus expectativas, puedes modificarlo proporcionando instrucciones más claras</li>
                </ol>
                
                <div class="note">
                    <p><strong>Consejo:</strong> Para mejores resultados, incluye valores numéricos específicos en tu descripción. Por ejemplo, en lugar de decir "las ventas fueron mayores en Q2," di "las ventas fueron $12,000 en Q1 y $15,500 en Q2."</p>
                </div>
            `,
                image: "dataviz_create.png",
                imageAlt: "Creando una Visualización",
                imageCaption:
                    "El proceso de crear una visualización de datos a partir de una descripción de texto",
            },
            {
                id: "dataviz-examples",
                title: "Ejemplos de Prompts",
                content: `
                <p>Aquí hay algunos ejemplos de prompts para ayudarte a comenzar con diferentes tipos de visualización:</p>
                
                <h4>Ejemplo de Gráfico Circular</h4>
                <p class="example-prompt">"Crea un gráfico circular mostrando la cuota de mercado de navegadores con Chrome al 65%, Safari al 18%, Firefox al 8%, Edge al 5%, y Otros al 4%."</p>
                
                <h4>Ejemplo de Gráfico de Barras</h4>
                <p class="example-prompt">"Genera un gráfico de barras comparando las ventas mensuales para Q1 2024: Enero $45,000, Febrero $52,000, y Marzo $61,000."</p>
                
                <h4>Ejemplo de Gráfico de Líneas</h4>
                <p class="example-prompt">"Muestra un gráfico de líneas de temperaturas promedio en Nueva York durante 2023: Ene 0°C, Feb 1°C, Mar 6°C, Abr 11°C, May 17°C, Jun 22°C, Jul 26°C, Ago 25°C, Sep 21°C, Oct 14°C, Nov 8°C, Dic 3°C."</p>
                
                <h4>Ejemplo Multi-Serie</h4>
                <p class="example-prompt">"Crea un gráfico de barras comparando las horas de uso de smartphones por grupo de edad: Adolescentes (14 hrs/semana), Adultos Jóvenes (12 hrs/semana), Mediana Edad (8 hrs/semana), y Adultos Mayores (4 hrs/semana). También incluye las horas de uso de redes sociales: Adolescentes (10 hrs/semana), Adultos Jóvenes (8 hrs/semana), Mediana Edad (5 hrs/semana), y Adultos Mayores (2 hrs/semana)."</p>
                
                <h4>Ejemplo de Gráfico de Dispersión</h4>
                <p class="example-prompt">"Genera un gráfico de dispersión mostrando la relación entre horas de estudio (eje x) y calificaciones de examen (eje y) para 10 estudiantes: (2 hrs, 65%), (3 hrs, 70%), (5 hrs, 85%), (8 hrs, 95%), (4 hrs, 75%), (6 hrs, 90%), (2 hrs, 60%), (7 hrs, 92%), (3.5 hrs, 72%), (5.5 hrs, 88%)."</p>
                
                <h4>Ejemplo de Gráfico de Radar</h4>
                <p class="example-prompt">"Crea un gráfico de radar comparando tres smartphones a través de cinco categorías: Teléfono A (Batería: 90, Cámara: 85, Rendimiento: 95, Diseño: 80, Precio: 70), Teléfono B (Batería: 75, Cámara: 95, Rendimiento: 90, Diseño: 85, Precio: 65), Teléfono C (Batería: 95, Cámara: 75, Rendimiento: 80, Diseño: 90, Precio: 85)."</p>
                
                <h4>Ejemplo de Mapa de Calor</h4>
                <p class="example-prompt">"Crea un mapa de calor mostrando la correlación entre diferentes lenguajes de programación y su popularidad a través de varios sectores industriales en 2025. Incluye datos para lenguajes como Python (IA/ML: 98, Finanzas: 85, Salud: 70, Juegos: 60, E-commerce: 92), JavaScript (Finanzas: 95, Salud: 55, Juegos: 75, E-commerce: 98, Medios: 90), Rust (Finanzas: 45, Salud: 35, Juegos: 90, IoT: 80, Ciberseguridad: 85), Go (Finanzas: 55, Salud: 45, Juegos: 35, IoT: 95, Nube: 85), y PHP (E-commerce: 60, Medios: 50, Educación: 40, Gobierno: 30, Salud: 35). Usa una escala de color de azul claro a azul oscuro, donde los colores más oscuros representen tasas de adopción más altas."</p>

                <h4>Ejemplo de Gráfico de Burbujas</h4>
                <p class="example-prompt">"Genera un gráfico de burbujas comparando la adopción de energía renovable de diferentes países. En el eje x, muestra PIB per cápita (EUA: 65000, Alemania: 48000, China: 12000, India: 2500, Brasil: 7000, Japón: 40000). En el eje y, muestra porcentaje de energía renovable en la mezcla energética total (EUA: 20%, Alemania: 45%, China: 25%, India: 35%, Brasil: 85%, Japón: 30%). Usa el tamaño de burbuja para representar población en millones (EUA: 330, Alemania: 83, China: 1400, India: 1380, Brasil: 212, Japón: 126). Etiqueta cada burbuja con el nombre del país y titula el gráfico 'Adopción de Energía Renovable vs. Desarrollo Económico (2025)'."</p>
                
                <div class="note">
                    <p><strong>Nota:</strong> Si tu primer intento no produce la visualización exacta que quieres, intenta refinar tu descripción con más detalles específicos sobre categorías, valores y relaciones.</p>
                </div>
            `,
                image: "dataviz_examples.png",
                imageAlt: "Visualizaciones de Ejemplo",
                imageCaption:
                    "Ejemplos de visualizaciones creadas a partir de descripciones de texto",
            },
            {
                id: "dataviz-advanced",
                title: "Consejos Avanzados",
                content: `
                <p>Saca el máximo provecho de DataViz con estas técnicas avanzadas:</p>
                
                <h4>Personalizando Visualizaciones</h4>
                <p>Puedes solicitar personalizaciones específicas en tu prompt:</p>
                <ul>
                    <li>"Usa colores azul y verde para el gráfico"</li>
                    <li>"Hazlo un gráfico de barras apiladas"</li>
                    <li>"Muestra porcentajes en las porciones del gráfico circular"</li>
                    <li>"Usa una escala logarítmica para el eje y"</li>
                </ul>
                
                <h4>Trabajando con Datos Complejos</h4>
                <p>Para conjuntos de datos más grandes:</p>
                <ul>
                    <li>Desglosa datos complejos en grupos lógicos</li>
                    <li>Considera usar múltiples gráficos para contar una historia completa</li>
                    <li>Usa tendencias y patrones en lugar de cada punto de datos</li>
                    <li>Sé explícito sobre qué dimensiones mostrar y cuáles omitir</li>
                </ul>
                
                <h4>Manejando Fallas de Generación</h4>
                <p>Si tu gráfico falla en generarse correctamente:</p>
                <ul>
                    <li>Asegúrate de haber especificado valores numéricos precisos</li>
                    <li>Verifica que tus datos sean apropiados para el tipo de gráfico seleccionado</li>
                    <li>Simplifica descripciones complejas en información más clara y estructurada</li>
                    <li>Reduce el número de categorías o puntos de datos</li>
                </ul>
                
                <h4>Cancelando la Generación de Gráficos</h4>
                <p>Si necesitas detener la generación de un gráfico:</p>
                <ul>
                    <li>Haz clic en el botón "Cancelar" en la ventana de carga</li>
                    <li>El proceso se terminará inmediatamente</li>
                    <li>Puedes intentar de nuevo con un prompt modificado</li>
                </ul>
                
                <div class="note">
                    <p><strong>Importante:</strong> Cuando cambies a una pestaña diferente, el modo DataViz se desactivará automáticamente, y volverás al modo de conversación normal.</p>
                </div>
            `,
                image: "dataviz_advanced.png",
                imageAlt: "Técnicas Avanzadas de DataViz",
                imageCaption:
                    "Técnicas avanzadas para crear visualizaciones personalizadas",
            },
        ],
    },
    paperworks: {
        title: "Papeleo",
        intro:
            "La pestaña Papeleo te ayuda a crear y gestionar plantillas de documentos profesionales y formularios con asistencia de IA, manteniendo todos tus datos privados y locales.",
        articles: [
            {
                id: "paperworks-intro",
                title: "Introducción a Papeleo",
                content: `
                <p>La pestaña Papeleo proporciona un sistema de creación de documentos potente que te ayuda a generar documentos profesionales, plantillas y formularios usando asistencia de IA.</p>
                
                <p>Las características clave de la pestaña Papeleo incluyen:</p>
                <ul>
                    <li>Plantillas de documentos prediseñadas para necesidades comerciales comunes</li>
                    <li>Creación de plantillas personalizadas con guía de IA</li>
                    <li>Generación de formularios para recolección de datos</li>
                    <li>Vista previa y edición de documentos</li>
                    <li>Opciones de exportación para varios formatos</li>
                </ul>
                
                <p>Todo el procesamiento de documentos ocurre localmente y en tu dispositivo, asegurando que tu información comercial sensible permanezca privada y segura. Como todas las características en Paiperwork, Papeleo usa tu clave de encriptación Maestra para proteger cualquier plantilla o formulario guardado.</p>
            `,
                image: "paperworks_intro.png",
                imageAlt: "Vista General de la Pestaña Papeleo",
                imageCaption:
                    "El panel de Papeleo mostrando opciones de creación de documentos",
            },
            {
                id: "paperworks-templates",
                title: "Plantillas de Documentos",
                content: `
                <p>La pestaña Papeleo muestra una cuadrícula de plantillas de documentos que puedes seleccionar para crear varios documentos profesionales.</p>
                
                <h4>Tipos de Plantillas Disponibles</h4>
                <ul>
                    <li><strong>Actas de Reunión</strong> - Crear actas de reunión estructuradas y profesionales</li>
                    <li><strong>Carta Comercial</strong> - Generar una carta comercial profesional</li>
                    <li><strong>Reporte Técnico</strong> - Crear un reporte técnico detallado con secciones e imágenes</li>
                    <li><strong>Contrato</strong> - Crear un documento de contrato legal</li>
                    <li><strong>Propuesta</strong> - Generar una propuesta comercial convincente</li>
                    <li><strong>Memorándum</strong> - Crear un memorándum corporativo profesional</li>
                </ul>
                
                <h4>Usando Plantillas</h4>
                <p>Para crear un documento desde una plantilla:</p>
                <ol>
                    <li>Haz clic en una tarjeta de plantilla de la cuadrícula</li>
                    <li>Llena la información requerida en los campos del formulario</li>
                    <li>Haz clic en "Generar Documento" para crear tu documento</li>
                    <li>Vista previa, edita o exporta tu documento completado</li>
                </ol>
                
                <div class="note">
                    <p><strong>Nota:</strong> Las plantillas son puntos de partida personalizables. Puedes modificar cualquier documento generado para adaptarlo mejor a tus necesidades específicas.</p>
                </div>
            `,
                image: "document_templates.png",
                imageAlt: "Cuadrícula de Plantillas de Documentos",
                imageCaption: "La cuadrícula de selección de plantillas de documentos",
            },
            {
                id: "paperworks-technical-reports",
                title: "Creando Reportes Técnicos",
                content: `
                <p>El creador de Reportes Técnicos ofrece capacidades de diseño de documentos potentes con un editor visual intuitivo y asistencia de IA.</p>
                
                <h4>Diseñador Visual de Plantillas</h4>
                <p>Cuando seleccionas la plantilla de Reporte Técnico, accederás al diseñador visual de plantillas que te permite:</p>
                <ul>
                    <li>Diseñar documentos multipágina profesionales con un editor visual</li>
                    <li>Construir tu reporte agregando diferentes tipos de secciones desde la barra lateral</li>
                    <li>Personalizar diseño y estructura con simplicidad</li>
                    <li>Agregar imágenes y elementos visuales con subida fácil</li>
                    <li>Vista previa del documento exactamente como aparecerá cuando se imprima</li>
                    <li>Maximizar la ventana del diseñador para una experiencia de edición en pantalla completa</li>
                </ul>
                
                <h4>Tipos de Secciones Disponibles</h4>
                <ul>
                    <li><strong>Encabezado del Documento</strong> - Título y subtítulo para tu reporte</li>
                    <li><strong>Encabezado de Sección</strong> - Divide tu reporte en secciones lógicas</li>
                    <li><strong>Área de Texto</strong> - Para párrafos y contenido de texto más largo</li>
                    <li><strong>Texto + Imagen (Derecha)</strong> - Texto con una imagen en el lado derecho</li>
                    <li><strong>Imagen + Texto (Derecha)</strong> - Imagen con texto en el lado derecho</li>
                    <li><strong>Galería de Imágenes</strong> - Diseño de cuadrícula para múltiples imágenes</li>
                    <li><strong>Fila de Imágenes</strong> - Arreglo horizontal de imágenes con leyenda opcional</li>
                    <li><strong>Divisor</strong> - Separador visual entre secciones</li>
                    <li><strong>Espacio Vacío</strong> - Espacio en blanco ajustable con capacidad de redimensionar</li>
                </ul>
                
                <h4>Características de Diseño Inteligente</h4>
                <ul>
                    <li><strong>Soporte multipágina</strong> - El contenido fluye automáticamente a través de múltiples páginas</li>
                    <li><strong>Saltos de página</strong> - Indicadores visuales muestran dónde el contenido se dividirá entre páginas</li>
                    <li><strong>Paginación automática</strong> - Los números de página se agregan automáticamente</li>
                    <li><strong>Formato A4</strong> - Tamaño de documento estándar con márgenes apropiados</li>
                    <li><strong>Controles de sección</strong> - Mover, editar o eliminar secciones con botones de fácil acceso</li>
                    <li><strong>Espaciado flexible</strong> - Opción para expandir secciones vacías para llenar una página</li>
                </ul>
                
                <h4>Mejora de Contenido</h4>
                <ul>
                    <li><strong>Mejora con IA</strong> - Mejora del contenido de texto con un clic usando asistencia de IA</li>
                    <li><strong>Edición directa</strong> - Editar texto directamente en la vista previa para experiencia WYSIWYG</li>
                    <li><strong>Subida de imágenes</strong> - Arrastra y suelta o haz clic para subir imágenes</li>
                    <li><strong>Marcadores de contenido</strong> - Marcadores útiles muestran dónde agregar contenido</li>
                    <li><strong>Capacidad de deshacer</strong> - Revertir mejoras de IA si es necesario</li>
                    <li><strong>Traducciones directas</strong> - Antepón "Traducir a (idioma):" al inicio del texto y haz clic en Mejorar con IA</li>
                </ul>
                
                <h4>Selección de Fuente y Vista Previa PDF</h4>
                <ul>
                    <li><strong>Selección de Fuente</strong> - Elige entre una variedad de fuentes usando el menú desplegable arriba del editor</li>
                    <li><strong>Vista Previa de Fuente</strong> - Ve cómo se ve tu documento con diferentes fuentes en tiempo real</li>
                    <li><strong>Persistencia de Fuente</strong> - Tu fuente seleccionada se recuerda entre sesiones para consistencia</li>
                    <li><strong>Vista Previa PDF</strong> - Ve una vista previa precisa de cómo aparecerá tu documento como PDF</li>
                    <li><strong>Diseño de Página</strong> - Ve exactamente cómo se distribuye el contenido a través de las páginas con dimensiones A4 apropiadas</li>
                    <li><strong>Saltos de Página</strong> - La vista previa muestra indicadores claros de salto de página entre las páginas del documento</li>
                </ul>               

                <h4>Usando Vista Previa PDF</h4>
                <ol>
                    <li>Haz clic en el botón "Vista Previa" junto al selector de fuente</li>
                    <li>Se abrirá una ventana modal mostrando tu documento como aparecería en formato PDF</li>
                    <li>Cada página se muestra en tamaño A4 apropiado con posicionamiento de diseño exacto</li>
                    <li>Revisa la paginación y asegúrate de que el contenido esté distribuido apropiadamente</li>
                    <li>Cierra la vista previa cuando termines para volver a la edición</li>
                </ol>
                
                <h4>Creando un Reporte Técnico</h4>
                <ol>
                    <li>Ingresa un nombre para tu reporte en la parte superior del diseñador</li>
                    <li>Haz clic en los preajustes de diseño del panel derecho para agregarlos a tu documento</li>
                    <li>Llena el contenido para cada sección haciendo clic y escribiendo directamente en la sección</li>
                    <li>Sube imágenes haciendo clic en los marcadores de imagen</li>
                    <li>Mejora el texto con los botones de IA debajo de las áreas de texto editables</li>
                    <li>Reorganiza las secciones usando los controles de flecha arriba/abajo</li>
                    <li>Una vez completo, guarda tu reporte y expórtalo o imprímelo</li>
                </ol>
                
                <div class="note">
                    <p><strong>Consejo:</strong> Maximiza la ventana del editor usando el botón maximizar en la esquina superior derecha para una experiencia de edición más cómoda con documentos más grandes. La interfaz se ajusta automáticamente para proporcionar un diseño óptimo tanto en vistas regulares como maximizadas.</p>
                </div>
                `,
                images: [
                    {
                        src: "technical_report_designer.png",
                        alt: "Reporte técnico",
                        caption:
                            "El diseñador visual de reportes técnicos mostrando el diseño del documento y tipos de sección",
                    },
                    {
                        src: "preview-window-technical-report.png",
                        alt: "La ventana de vista previa para reportes técnicos",
                        caption: "La ventana de vista previa para reportes técnicos"
                    }
                ]
            },
            {
                id: "paperworks-document-generation",
                title: "Generación de Documentos",
                content: `
                <p>Papeleo usa asistencia de IA para ayudarte a generar contenido de documentos profesionales basado en tus datos de entrada.</p>
                
                <h4>Proceso de Generación de Documentos</h4>
                <ol>
                    <li>Selecciona una plantilla de documento</li>
                    <li>Llena los campos de formulario requeridos con tu información</li>
                    <li>Haz clic en "Generar Documento" para crear tu documento</li>
                    <li>Revisa el contenido generado</li>
                    <li>Edita o refina el contenido según sea necesario</li>
                    <li>Exporta o guarda tu documento finalizado</li>
                </ol>
                
                <h4>Mejora con IA</h4>
                <p>La asistencia de IA puede ayudarte a:</p>
                <ul>
                    <li>Formatear tu contenido profesionalmente</li>
                    <li>Sugerir frases y terminología apropiadas</li>
                    <li>Asegurar consistencia a lo largo de tu documento</li>
                    <li>Generar secciones completas basadas en tus datos de entrada</li>
                </ul>
                
                <div class="note">
                    <p><strong>Nota:</strong> Para usar las características de mejora con IA, asegúrate de haber seleccionado un modelo de IA en la pestaña Chat primero.</p>
                </div>
            `,
                image: "document_generation.png",
                imageAlt: "Proceso de Generación de Documentos",
                imageCaption: "La interfaz del formulario de generación de documentos",
            },
            {
                id: "paperworks-export",
                title: "Exportando Documentos",
                content: `
                <p>Una vez que hayas creado y refinado tu documento, puedes exportarlo en varios formatos.</p>
                
                <h4>Opciones de Exportación Disponibles</h4>
                <ul>
                    <li><strong>Exportación de Texto</strong> - Copia el texto con su formato listo para ser pegado en cualquier procesador de texto</li>
                    <li><strong>Enviarlo por Email</strong> - Abre tu programa de email predeterminado, llena el asunto y el cuerpo del email</li>
                </ul>
                
                <h4>Exportando Tu Documento</h4>
                <ol>
                    <li>Después de generar tu documento, revisa la vista previa</li>
                    <li>Haz cualquier ajuste final según sea necesario</li>
                    <li>Haz clic en el botón de exportación apropiado (Copiar, Email)</li>
                    <li>Sigue las indicaciones para guardar o enviar tu documento</li>
                </ol>
                
                <p>Todos los documentos exportados mantienen el formato y estilo de tu vista previa, asegurando una presentación profesional sin importar el formato.</p>
            `,
                image: "document_export.png",
                imageAlt: "Opciones de Exportación de Documentos",
                imageCaption: "La interfaz de exportación de documentos mostrando opciones de formato",
            },
        ],
    },
    research: {
        title: "Investigación",
        intro: "La Pestaña de Investigación proporciona potentes capacidades de investigación asistida por IA y una base de conocimiento personal para almacenar y recuperar información.",
        articles: [
            {
                id: "research-intro",
                title: "Introducción a las Herramientas de Investigación",
                content: `
                <p>La pestaña de Investigación ofrece dos herramientas potentes para ayudarte a recopilar, analizar y almacenar información:</p>
                
                <ul>
                    <li><strong>Asistente de Investigación</strong> - Investigación web potenciada por IA que te ayuda a encontrar, analizar y sintetizar información sobre cualquier tema</li>
                    <li><strong>Base de Conocimiento</strong> - Una base de datos personal donde puedes almacenar, organizar y recuperar información importante para referencia futura</li>
                </ul>
                
                <h4>Privacidad y Seguridad de Datos</h4>
                <p>La pestaña de Investigación mantiene el compromiso de Paiperwork con la privacidad y seguridad de datos:</p>
                <ul>
                    <li><strong>Conexión a Internet Requerida</strong> - El Asistente de Investigación requiere una conexión a internet para realizar búsquedas web</li>
                    <li><strong>Transmisión de Datos Limitada</strong> - Solo las consultas de búsqueda se envían a internet (vía Bing Search). Nunca se transmiten datos personales o comerciales</li>
                    <li><strong>Procesamiento Local</strong> - Todos los resultados de búsqueda se procesan localmente en tu dispositivo por tu modelo de IA elegido</li>
                    <li><strong>Almacenamiento Encriptado</strong> - Los resultados de investigación y entradas de la base de conocimiento se encriptan usando tu Clave Maestra en tu base de datos local</li>
                    <li><strong>Base de Conocimiento Completamente Offline</strong> - La Base de Conocimiento opera completamente de forma local, sin requerir conexión a internet una vez que las entradas son creadas</li>
                </ul>
                
                <h4>Cambiando Entre Herramientas</h4>
                <p>Usa la navegación de sub-pestañas en la parte superior de la pestaña de Investigación para cambiar entre el Asistente de Investigación y la Base de Conocimiento:</p>
                <ul>
                    <li>Haz clic en <strong>Investigación</strong> para usar la herramienta de búsqueda y análisis web potenciada por IA</li>
                    <li>Haz clic en <strong>Base de Conocimiento</strong> para acceder a tus colecciones de información almacenada</li>
                </ul>
                
                <div class="note">
                    <p><strong>Importante:</strong> La pestaña de Investigación usa el modelo actualmente seleccionado en la pestaña de Chat. Asegúrate de seleccionar un modelo apropiado en la pestaña de Chat antes de usar las características de Investigación. Para tareas de investigación, los modelos sin razonamiento (como Mistral3, Qwen2.5 o LLaMA) funcionan mejor.</p>
                    <p><strong>Nota de Rendimiento:</strong> Usar modelos de IA de razonamiento (como Cogito, Qwen3 o Deepseek R1) aumentará significativamente el tiempo de investigación ya que estos modelos realizan razonamiento detallado en cada paso del proceso. Para resultados de investigación más rápidos, prefiere modelos de instrucción estándar que procesan información más directamente.</p>
                </div>
                `,
                image: "research_tab_overview.png",
                imageAlt: "Vista General de la Pestaña de Investigación",
                imageCaption: "La pestaña de Investigación mostrando la navegación de sub-pestañas entre Asistente de Investigación y Base de Conocimiento"
            },
            {
                id: "research-assistant",
                title: "Usando el Asistente de Investigación",
                content: `
                <p>El Asistente de Investigación combina búsqueda web, análisis de IA y generación de reportes para ayudarte a investigar cualquier tema exhaustivamente.</p>
                
                <h4>Iniciando Tu Investigación</h4>
                <ol>
                    <li>Asegúrate de haber seleccionado un modelo apropiado en la pestaña de Chat (la pestaña de Investigación usa tu modelo de la pestaña de Chat)</li>
                    <li>Ingresa tu pregunta de investigación en el campo de entrada</li>
                    <li>Elige un tamaño de reporte (detallado abajo)</li>
                    <li>Configura las opciones de Búsqueda Profunda si es necesario (detallado abajo)</li>
                    <li>Haz clic en el botón "Investigar" para comenzar el proceso de investigación</li>
                </ol>
                
                <h4>Opciones de Tamaño de Informe</h4>
                <p>Seleccione el tamaño de informe apropiado basado en sus necesidades y recursos de sistema disponibles:</p>
                <ul>
                    <li><strong>Conciso</strong> - Resumen breve de 500-800 palabras con hechos centrales
                        <br><em>Contexto recomendado: 8K-16K (2-4GB VRAM/RAM)</em></li>
                    <li><strong>Estándar</strong> - Informe equilibrado de 1000-1500 palabras con detalles clave
                        <br><em>Contexto recomendado: 16K-32K (4-8GB VRAM/RAM)</em></li>
                    <li><strong>Detallado</strong> - Análisis integral de 2000-3000 palabras
                        <br><em>Contexto recomendado: 32K-64K (8-16GB VRAM/RAM)</em></li>
                    <li><strong>Integral</strong> - Examen en profundidad de 4000-5000 palabras
                        <br><em>Contexto recomendado: 64K-128K (16-32GB VRAM/RAM)</em></li>
                    <li><strong>Extenso</strong> - Exploración exhaustiva de 6000+ palabras con máximo detalle
                        <br><em>Contexto recomendado: 128K+ (32GB+ VRAM/RAM para sistemas de gama alta)</em></li>
                </ul>
                
                <div class="note">
                    <p><strong>Requisitos de Contexto Explicados:</strong> El Asistente de Investigación procesa información en múltiples etapas - primero resumiendo fuentes individuales, luego generando informes parciales en lotes, y finalmente combinando todo en el informe final. Los informes más grandes requieren más contexto para mantener coherencia entre todas las fuentes y asegurar análisis integral. Si experimenta problemas de memoria o informes incompletos, intente reducir el tamaño del informe o aumentar el tamaño del contexto en la pestaña Chat.</p>
                </div>
                
                <h4>Optimizando el Rendimiento de Investigación</h4>
                <p>Para mejores resultados de investigación:</p>
                <ul>
                    <li><strong>Ajuste el tamaño del informe a su sistema</strong> - Use la calculadora de contexto en la pestaña Chat para determinar configuraciones óptimas</li>
                    <li><strong>Monitoree el uso de memoria</strong> - Observe señales de presión de memoria como informes incompletos o ralentización del sistema</li>
                    <li><strong>Considere el impacto de la Búsqueda Profunda</strong> - La Búsqueda Profunda con múltiples niveles aumenta significativamente la cantidad de contenido a procesar</li>
                    <li><strong>Use modelos apropiados</strong> - Los modelos no-razonantes (Mistral, Qwen2.5, LLaMA) procesan investigación más rápido que los modelos de razonamiento</li>
                </ul>
                
                <h4>Configuración de Búsqueda Profunda</h4>
                <p>La característica de Búsqueda Profunda proporciona capacidades de investigación mejoradas con control granular:</p>
                <ul>
                    <li><strong>Interruptor Habilitar/Deshabilitar</strong> - Activa o desactiva la Búsqueda Profunda para tu sesión de investigación</li>
                    <li><strong>Profundidad de Búsqueda</strong> - Elige entre 1-3 niveles de seguimiento de enlaces:
                        <ul>
                            <li>Nivel 1: Seguir enlaces inmediatos de los resultados de búsqueda</li>
                            <li>Nivel 2: Seguir enlaces del primer nivel de páginas descubiertas</li>
                            <li>Nivel 3: Exploración de profundidad máxima para cobertura comprehensiva</li>
                        </ul>
                    </li>
                    <li><strong>Enlaces Por Página</strong> - Selecciona 1-5 enlaces para seguir desde cada página descubierta</li>
                    <li><strong>Procesamiento de PDF Mejorado</strong> - Cuando está habilitado, la Búsqueda Profunda detecta y procesa automáticamente documentos PDF con capacidades de extracción mejoradas</li>
                </ul>
                <p>Pasa el cursor sobre las opciones de Búsqueda Profunda para ver tooltips detallados explicando el impacto de cada configuración en la exhaustividad de la investigación y el tiempo de procesamiento.</p>
                
                <h4>Proceso de Investigación con Ventana Flotante</h4>
                <p>Cuando inicias la investigación, el sistema muestra una ventana de progreso flotante que muestra:</p>
                <ol>
                    <li><strong>Generación de Consultas</strong> - Crea consultas de búsqueda optimizadas basadas en tu pregunta de investigación</li>
                    <li><strong>Búsqueda Web</strong> - Busca en la web usando múltiples consultas dirigidas</li>
                    <li><strong>Análisis de Contenido</strong> - Analiza y extrae información clave de los resultados de búsqueda</li>
                    <li><strong>Detección y Procesamiento de PDF</strong> - Identifica automáticamente documentos PDF y los procesa con extracción mejorada</li>
                    <li><strong>Ejecución de Búsqueda Profunda</strong> - Si está habilitado, sigue enlaces en tu profundidad y cantidad especificadas</li>
                    <li><strong>Generación de Reporte</strong> - Sintetiza toda la información recopilada en tu tamaño de reporte seleccionado</li>
                </ol>
                
                <p>La ventana de progreso flotante proporciona actualizaciones en tiempo real y te permite:</p>
                <ul>
                    <li>Monitorear la fase actual de investigación y progreso</li>
                    <li>Cancelar el proceso de investigación en cualquier momento</li>
                    <li>Ver el tiempo estimado de finalización</li>
                    <li>Rastrear el número de fuentes siendo procesadas</li>
                </ul>
                
                <h4>Manejo de PDF Mejorado</h4>
                <p>El Asistente de Investigación incluye capacidades avanzadas de procesamiento de PDF:</p>
                <ul>
                    <li><strong>Detección Automática</strong> - Identifica documentos PDF en resultados de búsqueda usando múltiples patrones (extensiones de archivo, patrones de URL, fuentes académicas)</li>
                    <li><strong>Extracción Mejorada</strong> - Usa métodos de extracción especializados para papers académicos y documentos técnicos</li>
                    <li><strong>Integración de Contenido</strong> - Incorpora sin problemas el contenido PDF en la síntesis de investigación</li>
                    <li><strong>Atribución de Fuente</strong> - Mantiene citas claras a las fuentes PDF originales</li>
                </ul>
                
                <div class="note">
                    <p><strong>Nota de Rendimiento:</strong> La Búsqueda Profunda con niveles de profundidad más altos y más enlaces por página proporciona resultados más comprehensivos pero aumenta el tiempo de investigación. El procesamiento de PDF agrega tiempo adicional pero mejora significativamente la calidad de investigación para temas académicos y técnicos.</p>
                </div>
                `,
            },

            {
                id: "research-results",
                title: "Trabajando con Resultados de Investigación",
                content: `
                <p>Después de que tu investigación se complete, el sistema genera un reporte de investigación comprehensivo en una ventana flotante editable.</p>
                
                <h4>Características de la Ventana de Resultados de Investigación</h4>
                <p>Los resultados de investigación aparecen en una ventana flotante que proporciona:</p>
                <ul>
                    <li><strong>Editabilidad Completa</strong> - Haz clic en cualquier lugar del área de contenido para editar el reporte de investigación directamente</li>
                    <li><strong>Edición en Tiempo Real</strong> - Haz cambios al contenido, agrega tus propias notas o reorganiza secciones</li>
                    <li><strong>Gestión de Enlaces de Fuente</strong> - Edita, actualiza o remueve citas de fuente según sea necesario</li>
                    <li><strong>Interfaz Maximizable</strong> - Expande la ventana para edición y revisión en pantalla completa</li>
                    <li><strong>Arrastrar y Reposicionar</strong> - Mueve la ventana a tu posición de pantalla preferida</li>
                </ul>
                
                <h4>Estructura del Reporte de Investigación</h4>
                <p>El reporte de investigación está estructurado para claridad y comprehensividad:</p>
                <ul>
                    <li><strong>Resumen Ejecutivo</strong> - Hallazgos clave y conclusiones principales</li>
                    <li><strong>Análisis Detallado</strong> - Examen comprehensivo organizado por subtemas</li>
                    <li><strong>Evidencia de Apoyo</strong> - Datos relevantes, citas y ejemplos de fuentes</li>
                    <li><strong>Conclusión</strong> - Perspectivas sintetizadas e implicaciones</li>
                    <li><strong>Referencias de Fuente</strong> - Citas completas con enlaces clickeables al contenido original</li>
                </ul>
                
                <h4>Editando Contenido de Investigación</h4>
                <p>Los resultados de investigación son completamente editables, permitiéndote:</p>
                <ul>
                    <li>Agregar tu propio análisis y comentarios</li>
                    <li>Reorganizar secciones para mejor flujo</li>
                    <li>Resaltar hallazgos clave que importan a tus necesidades específicas</li>
                    <li>Remover información irrelevante</li>
                    <li>Actualizar o corregir información de fuente</li>
                    <li>Agregar contexto adicional o explicaciones</li>
                </ul>
                
                <h4>Opciones de Exportación</h4>
                <p>Los resultados de investigación pueden ser exportados en múltiples formatos a través de la utilidad de exportación integrada:</p>
                <ul>
                    <li><strong>Texto Plano (.txt)</strong> - Formato de texto limpio con formato markdown eliminado para compatibilidad universal</li>
                    <li><strong>Markdown (.md)</strong> - Preserva formato, estructura, encabezados y enlaces en sintaxis markdown</li>
                    <li><strong>HTML (.html)</strong> - Formato completo con estilo apropiado, elementos markdown convertidos y enlaces clickeables</li>
                </ul>
                
                <h4>Guardando en la Base de Conocimiento</h4>
                <p>Cuando guardas investigación en tu Base de Conocimiento, tienes opciones mejoradas:</p>
                <ul>
                    <li><strong>Selección de Colección</strong> - Elige una colección existente o crea una nueva durante el proceso de guardado</li>
                    <li><strong>Guardar Fuentes Por Separado</strong> - Opción para guardar referencias de fuente como entradas separadas en tu base de conocimiento</li>
                    <li><strong>Personalización de Contenido</strong> - Guarda tu versión editada incluyendo cualquier modificación que hayas hecho</li>
                    <li><strong>Preservación de Metadatos</strong> - Mantiene fecha de investigación, consulta y parámetros para referencia futura</li>
                </ul>
                
                <h4>Gestión de Ventanas</h4>
                <p>La ventana de resultados flotante proporciona:</p>
                <ul>
                    <li><strong>Interfaz Redimensionable</strong> - Arrastra las esquinas para redimensionar para visualización óptima</li>
                    <li><strong>Minimizar/Maximizar</strong> - Ocultar temporalmente o expandir a pantalla completa</li>
                    <li><strong>Mantener Encima</strong> - Opción para mantener resultados visibles mientras trabajas en otras áreas</li>
                    <li><strong>Soporte de Múltiples Ventanas</strong> - Mantener resultados de investigación anteriores abiertos mientras inicias nueva investigación</li>
                </ul>
                
                <div class="note">
                    <p><strong>Consejo Pro:</strong> Aprovecha las capacidades de edición para personalizar reportes de investigación para tus necesidades específicas. Puedes agregar perspectivas personales, reorganizar contenido y crear un recurso de conocimiento personalizado antes de guardar en tu Base de Conocimiento.</p>
                </div>
                `,
                image: "research_results_editable.png",
                imageAlt: "Ventana de Resultados de Investigación Editable",
                imageCaption: "La ventana de resultados de investigación flotante mostrando capacidades de edición y opciones de exportación"
            },

            {
                id: "knowledge-base-intro",
                title: "Vista General de la Base de Conocimiento",
                content: `
                <p>La Base de Conocimiento te permite almacenar, organizar y navegar manualmente a través de colecciones de información que quieres mantener para referencia futura.</p>
                
                <h4>Estructura de la Base de Conocimiento</h4>
                <p>Tu conocimiento está organizado en colecciones y entradas:</p>
                <ul>
                    <li><strong>Colecciones</strong> - Carpetas o categorías que contienen entradas relacionadas (ej., "Investigación de Proyecto" o "Recetas de Cocina")</li>
                    <li><strong>Entradas</strong> - Piezas individuales de información almacenadas dentro de las colecciones</li>
                </ul>
                
                <h4>Creando una Colección</h4>
                <ol>
                    <li>Ingresa un nombre para tu nueva colección en el campo "Nombre de nueva colección..."</li>
                    <li>Haz clic en el botón "Crear Colección"</li>
                    <li>Tu nueva colección aparecerá en la lista de colecciones abajo</li>
                </ol>
                
                <h4>Gestionando Colecciones</h4>
                <p>Cada colección en tu lista tiene varios botones de acción:</p>
                <ul>
                    <li><strong>Ver</strong> - Abrir la colección para ver su contenido</li>
                    <li><strong>Editar</strong> - Renombrar la colección</li>
                    <li><strong>Exportar</strong> - Guardar la colección y sus entradas a un archivo</li>
                    <li><strong>Eliminar</strong> - Remover la colección y todas sus entradas</li>
                </ul>
                
                <h4>Almacenamiento y Organización</h4>
                <p>La Base de Conocimiento sirve como un sistema de almacenamiento simple pero efectivo:</p>
                <ul>
                    <li><strong>Organización Manual</strong> - Navega a través de tus colecciones para encontrar información almacenada</li>
                    <li><strong>Almacenamiento de Investigación</strong> - Perfecto para almacenar reportes de investigación completados del Asistente de Investigación</li>
                    <li><strong>Notas Personales</strong> - Almacena tus propias notas, ideas e información</li>
                    <li><strong>Sin Búsqueda Requerida</strong> - Navegación simple a través de colecciones organizadas</li>
                </ul>
                
                <div class="note">
                    <p><strong>Importante:</strong> Los datos de la Base de Conocimiento están encriptados usando tu Clave Maestra y almacenados localmente en tu dispositivo. Esto asegura privacidad pero también significa que debes usar la misma Clave Maestra para acceder a tu conocimiento en sesiones futuras.</p>
                </div>
                `,
                image: "knowledge_base_collections.png",
                imageAlt: "Colecciones de Base de Conocimiento",
                imageCaption: "La Base de Conocimiento mostrando una lista de colecciones con opciones de gestión"
            },
            {
                id: "knowledge-entries",
                title: "Trabajando con Entradas de Conocimiento",
                content: `
                <p>Las entradas de conocimiento son piezas individuales de información almacenadas dentro de tus colecciones.</p>
                
                <h4>Tipos de Entradas de Conocimiento</h4>
                <p>Puedes crear dos tipos de entradas en tu Base de Conocimiento:</p>
                <ul>
                    <li><strong>Entradas Manuales</strong> - Información que escribes o pegas directamente</li>
                    <li><strong>Entradas de Investigación</strong> - Información guardada de tus reportes de investigación</li>
                </ul>
                
                <h4>Creando una Nueva Entrada</h4>
                <ol>
                    <li>Abre una colección haciendo clic en el botón "Ver"</li>
                    <li>Haz clic en el botón "+ Nueva Entrada" en la parte superior de la vista de colección</li>
                    <li>Ingresa un título para tu entrada</li>
                    <li>Agrega tu contenido en el área de texto (se soporta formato Markdown)</li>
                    <li>Haz clic en "Guardar Entrada" para agregarla a tu colección</li>
                </ol>
                
                <h4>Viendo y Gestionando Entradas</h4>
                <p>Desde la vista de colección, puedes:</p>
                <ul>
                    <li>Hacer clic en cualquier entrada para ver su contenido completo</li>
                    <li>Usar el botón "Editar Entrada" para modificar el contenido de una entrada</li>
                    <li>Usar el botón "Eliminar Entrada" para remover una entrada</li>
                    <li>Hacer clic en el botón "← Volver a Entradas" para regresar a la vista de colección</li>
                </ul>
                
                <h4>Soporte de Markdown</h4>
                <p>Cuando creas o editas entradas, puedes usar formato Markdown:</p>
                <ul>
                    <li><strong>Encabezados</strong> - Usa # para encabezado nivel 1, ## para nivel 2, etc.</li>
                    <li><strong>Formato</strong> - Usa *cursiva* para cursivas y **negrita** para texto en negrita</li>
                    <li><strong>Listas</strong> - Crea listas con viñetas con * o listas numeradas con 1., 2., etc.</li>
                    <li><strong>Enlaces</strong> - Crea enlaces con sintaxis [texto](URL)</li>
                </ul>
                
                <div class="note">
                    <p><strong>Consejo:</strong> El formato Markdown hace tus entradas más organizadas y legibles, especialmente para contenido técnico o estructurado.</p>
                </div>
            `,
                image: "knowledge_entries.png",
                imageAlt: "Entradas de Conocimiento",
                imageCaption: "Una vista de colección mostrando múltiples entradas de conocimiento"
            },
            {
                id: "knowledge-browse",
                title: "Navegando Tu Base de Conocimiento",
                content: `
                <p>La Base de Conocimiento proporciona una forma simple de navegar y organizar tu información almacenada a través de colecciones y entradas.</p>
                
                <h4>Navegando Colecciones</h4>
                <ol>
                    <li>Desde la vista principal de la Base de Conocimiento, verás todas tus colecciones listadas</li>
                    <li>Haz clic en "Ver" en cualquier colección para ver su contenido</li>
                    <li>Navega a través de las entradas dentro de cada colección</li>
                    <li>Haz clic en entradas individuales para leer su contenido completo</li>
                </ol>
                
                <h4>Encontrando Información</h4>
                <p>Para localizar información específica en tu Base de Conocimiento:</p>
                <ul>
                    <li><strong>Navegar por Colección</strong> - Revisa colecciones relacionadas con tu tema</li>
                    <li><strong>Nomenclatura Descriptiva</strong> - Usa nombres claros y descriptivos para colecciones y entradas</li>
                    <li><strong>Organización Lógica</strong> - Agrupa información relacionada en la misma colección</li>
                    <li><strong>Revisión Manual</strong> - Navega a través de entradas para encontrar lo que necesitas</li>
                </ul>
                
                <h4>Consejos de Organización</h4>
                <p>Para gestión efectiva de conocimiento:</p>
                <ul>
                    <li>Crea colecciones para diferentes proyectos, temas o períodos de tiempo</li>
                    <li>Usa títulos claros y descriptivos tanto para colecciones como entradas</li>
                    <li>Considera organización basada en fechas para reportes de investigación</li>
                    <li>Mantén información relacionada junta en la misma colección</li>
                </ul>
                
                <div class="note">
                    <p><strong>Consejo:</strong> Una buena organización desde el principio hace mucho más fácil encontrar información después. Considera tus convenciones de nomenclatura y estructura de colección antes de agregar muchas entradas.</p>
                </div>
                `,
            },
            {
                id: "research-to-knowledge",
                title: "De Investigación a Conocimiento",
                content: `
                <p>Una de las características más potentes de la pestaña de Investigación es la integración entre el Asistente de Investigación y la Base de Conocimiento.</p>
                
                <h4>Guardando Investigación en la Base de Conocimiento</h4>
                <p>Después de completar una sesión de investigación:</p>
                <ol>
                    <li>Haz clic en el botón "Guardar en Base de Conocimiento" en la ventana de resultados de investigación</li>
                    <li>Selecciona una colección existente o crea una nueva</li>
                    <li>Confirma tu selección para guardar la investigación</li>
                </ol>
                
                <p>El reporte de investigación se guardará como una nueva entrada en tu colección seleccionada, incluyendo:</p>
                <ul>
                    <li>El contenido completo del reporte de investigación</li>
                    <li>La pregunta de investigación original como título de la entrada</li>
                    <li>Metadatos sobre cuándo se condujo la investigación</li>
                    <li>Todas las fuentes de la investigación</li>
                </ul>
                
                <h4>Gestión de Fuentes</h4>
                <p>Cuando guardas investigación en tu Base de Conocimiento, tienes opciones para manejar fuentes:</p>
                <ul>
                    <li><strong>Guardar con Fuentes</strong> - Incluye todos los enlaces de referencia y citas</li>
                    <li><strong>Guardar Solo Contenido</strong> - Guarda solo el contenido de investigación sin fuentes</li>
                </ul>
                
                <h4>Construyendo Tu Biblioteca de Conocimiento</h4>
                <p>Al guardar regularmente tu investigación en la Base de Conocimiento, puedes:</p>
                <ul>
                    <li>Construir una biblioteca personal de información verificada</li>
                    <li>Evitar repetir investigación en temas que ya has explorado</li>
                    <li>Referenciar rápidamente hallazgos anteriores en nuevos proyectos</li>
                    <li>Crear conexiones entre temas relacionados</li>
                </ul>
                
                <div class="note">
                    <p><strong>Consejo Pro:</strong> Crea colecciones temáticas para diferentes áreas de interés o proyectos, luego usa la función de búsqueda para encontrar conexiones a través de toda tu biblioteca de conocimiento.</p>
                </div>
            `,
                image: "research_to_knowledge.png",
                imageAlt: "Guardando Investigación en Base de Conocimiento",
                imageCaption: "El diálogo para guardar resultados de investigación en una colección de Base de Conocimiento"
            }
        ],
    },
    artworks: {
        title: "Gráficos",
        intro:
            "La pestaña Estudio de Diseño Visual te permite usar modelos de IA visual para analizar opciones de diseño, generar prototipos de sitios web basados en diseños visuales y crear superposiciones de texto para imágenes.",
        articles: [
            {
                id: "artworks-getting-started",
                title: "Comenzando con el Estudio de Diseño Visual",
                content: `
                    <div class="note">
                        <p><strong>Lanzamiento Inicial:</strong> El Estudio de Diseño Visual es una nueva característica en su lanzamiento inicial. Estamos emocionados de compartir esta innovadora herramienta de diseño potenciada por IA contigo y nos encantaría escuchar tus comentarios e ideas para futuras adiciones y mejoras. ¡Tus sugerencias nos ayudan a hacer Paiperwork mejor para todos!</p>
                    </div>
                    
                    <p>El Estudio de Diseño Visual proporciona herramientas potenciadas por IA para transformar imágenes en diseños web funcionales y analizar composiciones visuales.</p>
                    
                    <h4>Requisitos y Configuración</h4>
                    <ul>
                        <li><strong>Modelo de IA Visual Requerido</strong> - Necesitas un modelo con capacidades de visión instalado en Ollama (LLaVA, Gemma3, Phi3-Vision, etc.)</li>
                        <li><strong>Selección de Modelo</strong> - Elige tu modelo visual del menú desplegable en la parte superior de la pestaña</li>
                        <li><strong>Requisitos de Imagen</strong> - Sube imágenes claras y de alta calidad (máx 5MB) en formato PNG, JPEG, GIF o WebP</li>
                    </ul>
                    
                    <h4>Modelos Visuales Compatibles</h4>
                    <ul>
                        <li><strong>Mistral-small3.1</strong> - Modelo visual de Mistral con capacidades excelentes y soporte multiidioma</li>
                        <li><strong>Gemma3</strong> - Modelo visual de Google con fuertes capacidades de generación de código</li>
                        <li><strong>LLaVA & BakLLaVA</strong> - Variantes del Asistente de Lenguaje Grande y Visión</li>
                        <li><strong>Phi3-Vision</strong> - Modelo de visión de Microsoft con buen entendimiento de diseño</li>
                        <li>Cualquier otro modelo de Ollama con capacidades de visión</li>
                    </ul>
                    
                    <h4>Instalando Modelos Visuales</h4>
                    <p>Si no hay modelos compatibles disponibles:</p>
                    <ol>
                        <li>Haz clic en "Ir a la Pestaña de Modelos" desde la pantalla de advertencia</li>
                        <li>Instala un modelo con capacidades de visión usando Ollama</li>
                        <li>Regresa al Estudio de Diseño Visual después de la instalación</li>
                    </ol>
                    
                    <div class="note">
                        <p><strong>Importante:</strong> Al cambiar fuera de la pestaña Estudio de Diseño Visual, los datos de imagen se limpian de la memoria para prevenir problemas de uso de recursos, y el contexto del chat se reinicia para conversaciones regulares.</p>
                    </div>
                `,
                image: "artworks_intro.png",
                imageAlt: "Vista General del Estudio de Diseño Visual",
                imageCaption: "La interfaz del Estudio de Diseño Visual mostrando selección de modelo y área de subida",
            },
            {
                id: "artworks-workflow",
                title: "Flujo de Trabajo de Diseño y Modos",
                content: `
                <h4>Flujo de Trabajo Completo</h4>
                <ol>
                    <li><strong>Seleccionar Modelo Visual</strong> - Elige del menú desplegable (selección guardada para sesiones futuras)</li>
                    <li><strong>Elegir Modo de Diseño</strong> - Selecciona Transferencia de Estilo HTML, Superposición de Texto o Fundamento de Diseño</li>
                    <li><strong>Subir Imagen</strong> - Arrastra/suelta o haz clic para subir (el sistema analiza dimensiones y orientación)</li>
                    <li><strong>Escribir Instrucciones</strong> - Proporciona orientación específica (el texto de marcador de posición cambia según el modo)</li>
                    <li><strong>Generar y Vista Previa</strong> - Haz clic en "Generar Diseño" o presiona Enter; los resultados se abren en ventana de vista previa interactiva</li>
                </ol>
                
                <h4>Modos de Diseño Explicados</h4>
                
                <h5>Transferencia de Estilo HTML</h5>
                <ul>
                    <li>Convierte elementos de diseño visual en código HTML/CSS funcional</li>
                    <li>Extrae esquemas de color, diseños y patrones de estilo</li>
                    <li>Opción de "Usar como imagen de fondo" incorpora la imagen subida real</li>
                    <li>Perfecto para transformar inspiración de diseño en interfaces web</li>
                </ul>
                
                <h5>Superposición de Texto</h5>
                <ul>
                    <li>Analiza imágenes para encontrar áreas óptimas de colocación de texto</li>
                    <li>Genera HTML/CSS responsivo para superposiciones de texto</li>
                    <li>Considera dimensiones de imagen y orientación para posicionamiento apropiado</li>
                    <li>Ideal para materiales de marketing, banners y exhibiciones de productos</li>
                </ul>
                
                <h5>Fundamento de Diseño</h5>
                <ul>
                    <li>Proporciona análisis profesional de opciones y principios de diseño</li>
                    <li>Explica teoría del color, tipografía, diseño y jerarquía visual</li>
                    <li>Ofrece perspectivas sobre el impacto de la experiencia del usuario</li>
                    <li>Excelente para aprender principios de diseño o entender diseños exitosos</li>
                </ul>
                
                <h4>Gestión de Imágenes</h4>
                <ul>
                    <li><strong>Proceso de Subida</strong> - El sistema muestra dimensiones, orientación (Horizontal/Vertical/Cuadrado) y relación de aspecto</li>
                    <li><strong>Opción de Fondo</strong> - En modo Transferencia de Estilo, elige si incluir la imagen real en el código generado</li>
                    <li><strong>Reemplazar Imágenes</strong> - Haz clic en "×" en la vista previa para subir una nueva imagen</li>
                </ul>
                
                <div class="note">
                    <p><strong>Consejo:</strong> Presiona Enter (sin Shift) en el campo de instrucciones para comenzar inmediatamente la generación cuando todos los requisitos estén cumplidos.</p>
                </div>
            `,
            },
            {
                id: "artworks-examples",
                title: "Instrucciones de Ejemplo y Mejores Prácticas",
                content: `
                <h4>Ejemplos de Transferencia de Estilo HTML</h4>
                
                <h5>Sitio Web Brutalista (Ejemplo Comprehensivo)</h5>
                <p class="example-prompt">"Crea un sitio web de estilo brutalista con todos los botones de encabezado usuales y enlaces de pie de página, crea un botón en el medio del viewport que diga 'iniciar sesión', usa los colores de la imagen para la paleta de colores del sitio web en todos los componentes incluyendo el color de fondo para la página y pie de página/encabezado (hazlos semi transparentes), asegúrate de que la imagen de fondo llene el cuerpo de la página web y el pie de página esté pegado al fondo del viewport"</p>
                
                <h5>Sitio de E-commerce Moderno</h5>
                <p class="example-prompt">"Transforma esto en una página de producto de e-commerce moderna con una barra de navegación limpia, sección de galería de productos, área de reseñas de clientes y botón prominente de 'Agregar al Carrito'. Usa el esquema de colores de la imagen y crea un diseño minimalista con mucho espacio en blanco."</p>
                
                <h5>Portafolio Creativo</h5>
                <p class="example-prompt">"Crea un sitio web de portafolio creativo con una sección hero de pantalla completa, menú de navegación animado, cuadrícula de exhibición de proyectos y formulario de contacto. Extrae la paleta de colores artística de la imagen y aplícala a través del diseño con gradientes sutiles y efectos de hover."</p>
                
                <h5>Página de Aterrizaje Corporativa</h5>
                <p class="example-prompt">"Diseña una página de aterrizaje corporativa profesional con navegación de encabezado, sección hero con llamada a la acción, sección de características de tres columnas, carrusel de testimonios y pie de página con enlaces de la empresa. Usa la paleta de colores sofisticada de la imagen para transmitir confianza y autoridad."</p>
                
                <h5>Sitio de Restaurante/Comida</h5>
                <p class="example-prompt">"Transforma esto en un sitio web de restaurante apetitoso con secciones de menú, formulario de reservación, galería de fotos de platos, historia del chef e información de ubicación. Usa colores cálidos y acogedores de la imagen de comida para crear una atmósfera acogedora y hospitalaria."</p>
                
                <h4>Ejemplos de Superposición de Texto</h4>
                
                <h5>Exhibición de Producto</h5>
                <p class="example-prompt">"Agrega el siguiente texto a esta imagen de producto: Encabezado principal: 'Audífonos Inalámbricos Premium', Subencabezado: 'Experiencia de Sonido Inmersiva', Características clave: 'Cancelación de Ruido • Batería 30Hrs • Bluetooth 5.0', Precio: '$149.99', Botón de llamada a la acción: 'Comprar Ahora'"</p>
                
                <h5>Promoción de Evento</h5>
                <p class="example-prompt">"Crea superposición de texto promocional: Título del evento: 'Festival de Música de Verano 2024', Fecha: '15-17 de Julio, 2024', Ubicación: 'Central Park, NYC', Artistas principales: 'Artistas Destacados Por Anunciar', Información de boletos: 'Preventa $89', Botón: 'Obtener Boletos'"</p>
                
                <h4>Ejemplos de Fundamento de Diseño</h4>
                
                <h5>Análisis de Diseño</h5>
                <p class="example-prompt">"Analiza el diseño y composición de este diseño. Explica cómo la jerarquía visual guía la atención del usuario y cómo las opciones de espaciado y alineación impactan la legibilidad y el flujo del usuario."</p>
                
                <h5>Psicología del Color</h5>
                <p class="example-prompt">"Examina las opciones de color en este diseño y explica su impacto psicológico. ¿Cómo afectan estos colores las emociones del usuario y la toma de decisiones? ¿Qué comunica esta paleta de colores sobre la marca?"</p>
                
                <h4>Escribiendo Instrucciones Efectivas</h4>
                <ul>
                    <li><strong>Sé Específico</strong> - Incluye estilo de diseño, audiencia objetivo y componentes clave necesarios</li>
                    <li><strong>Menciona Elementos de Imagen</strong> - Haz referencia a colores específicos, diseños o características de tu imagen subida</li>
                    <li><strong>Define Propósito</strong> - Explica el objetivo (marketing, portafolio, e-commerce, etc.)</li>
                    <li><strong>Solicita Características</strong> - Especifica comportamiento responsivo, animaciones o elementos interactivos</li>
                </ul>
                
                <h4>Eligiendo las Imágenes Correctas</h4>
                <ul>
                    <li><strong>Transferencia de Estilo</strong> - Usa imágenes con elementos de diseño distintos y esquemas de color claros</li>
                    <li><strong>Superposición de Texto</strong> - Selecciona imágenes con áreas claras para colocación de texto</li>
                    <li><strong>Fundamento de Diseño</strong> - Elige diseños profesionales con elementos intencionales</li>
                    <li><strong>La Calidad Importa</strong> - Imágenes de alta resolución con buena iluminación producen mejores resultados</li>
                </ul>
                
                <div class="note">
                    <p><strong>Consejo Pro:</strong> Al usar "Usar como imagen de fondo" en modo Transferencia de Estilo HTML, el sistema maneja automáticamente la integración de imagen con comentarios de marcador de posición mostrando exactamente dónde se usa la imagen.</p>
                </div>
            `,

                images: [
                    {
                        src: "artworks_examples.png",
                        alt: "Instrucciones de Ejemplo",
                        caption:
                            "Ejemplo de instrucciones de diseño para un prototipo de promoción de audífonos",
                    },
                    {
                        src: "artworks_examples2.png",
                        alt: "Resultado final del prototipo",
                        caption: "Ejemplo de prototipo de diseño para una promoción de audífonos",
                    },
                ]

            },
            {
                id: "artworks-results-management",
                title: "Trabajando con Resultados y Solución de Problemas",
                content: `
                <h4>Proceso de Generación</h4>
                <ul>
                    <li><strong>Ventana de Progreso</strong> - Muestra IA analizando tu imagen (típicamente 30-60 segundos)</li>
                    <li><strong>Cancelar en Cualquier Momento</strong> - Haz clic en el botón cerrar en la ventana de progreso para detener la generación</li>
                    <li><strong>Visualización de Resultados</strong> - La salida aparece directamente en modo de vista previa</li>
                </ul>
                
                <h4>Ventana de Vista Previa Interactiva</h4>
                <p>Los resultados se abren en una ventana flotante donde puedes:</p>
                <ul>
                    <li><strong>Cambiar Vistas</strong> - Alternar entre vista de código y vista previa en vivo</li>
                    <li><strong>Editar Directamente</strong> - Modificar código generado en tiempo real</li>
                    <li><strong>Copiar Código</strong> - Usar para tus propios proyectos</li>
                    <li><strong>Exportar PNG</strong> - Guardar captura de pantalla del diseño</li>
                </ul>
                
                <h4>Trabajando con Código Generado</h4>
                <ul>
                    <li><strong>Punto de Partida</strong> - Considera el código como una base que puedes refinar más</li>
                    <li><strong>Pruebas de Navegador</strong> - Prueba en diferentes navegadores y tamaños de pantalla</li>
                    <li><strong>Edición Directa</strong> - Modifica y previsualiza código directamente en la ventana de resultados</li>
                    <li><strong>Regeneración</strong> - Intenta de nuevo con instrucciones más específicas si es necesario</li>
                </ul>
                
                <h4>Importante: URLs de Imagen Temporales creadas para uso de fondo durante la generación</h4>
                <div class="warning">
                    <p><strong>Reemplaza URLs Blob Antes del Despliegue:</strong></p>
                    <ul>
                        <li>El código generado contiene URLs blob temporales como <code>blob:http://localhost:8182/...</code></li>
                        <li>Estas están almacenadas en memoria solo para vista previa y no funcionarán fuera de tu sesión</li>
                        <li>Busca propiedades CSS como <code>background-image: url('blob:http://...')</code></li>
                        <li>Reemplaza URLs blob con rutas a tus archivos de imagen reales antes de usar el código</li>
                    </ul>
                </div>
                
                <h4>Solución de Problemas Comunes</h4>
                
                <h5>Fallas de Generación</h5>
                <ul>
                    <li><strong>Solución:</strong> Intenta un modelo visual diferente o imagen más pequeña</li>
                    <li><strong>Prevención:</strong> Usa imágenes claras con elementos de diseño distintos</li>
                    <li><strong>Reintentar:</strong> Debido a la naturaleza probabilística de los modelos de IA, debes reintentar varias veces antes de rendirte</li>
                </ul>
                
                <h5>Rendimiento Lento</h5>
                <ul>
                    <li><strong>Solución:</strong> Usa imágenes más pequeñas, simplifica instrucciones, usa modelos de IA más pequeños</li>
                    <li><strong>Nota:</strong> Diseños complejos e imágenes más grandes requieren más tiempo de procesamiento</li>
                </ul>
                
                <h5>Salida de Código Incompleta</h5>
                <ul>
                    <li><strong>Solución:</strong> Pide a la IA que continúe o complete el código en chat regular después de la generación</li>
                    <li><strong>Alternativa:</strong> Divide solicitudes complejas en generaciones más pequeñas y específicas</li>
                </ul>
                
                <h5>Colocación de Texto Pobre (Modo Superposición)</h5>
                <ul>
                    <li><strong>Solución:</strong> Especifica posiciones preferidas en tus instrucciones</li>
                    <li><strong>Ejemplo:</strong> "Coloca encabezado en esquina superior izquierda, precio en inferior derecha"</li>
                </ul>
                
                <div class="note">
                    <p><strong>Consejo de Rendimiento:</strong> El procesamiento visual es intensivo en recursos. Para mejores resultados, cierra aplicaciones innecesarias y usa imágenes de alta calidad y claramente compuestas.</p>
                </div>
            `,
                image: "artworks_examples3.png",
                imageAlt: "Gestión de Resultados",
                imageCaption: "La ventana de vista previa interactiva con capacidades de edición y exportación",
            },
        ],
    },
    models: {
        title: "Modelos",
        intro:
            "La pestaña Modelos te permite navegar, descargar y gestionar modelos de IA de Ollama usados por Paiperwork con control local completo.",
        articles: [
            {
                id: "models-intro",
                title: "Introducción a los Modelos",
                content: `
                <p>La pestaña Modelos proporciona una interfaz central para gestionar los modelos de IA que impulsan tu experiencia de Paiperwork.</p>
                
                <p>Las características clave de la pestaña Modelos incluyen:</p>
                <ul>
                    <li>Navegar modelos disponibles en la biblioteca de Ollama</li>
                    <li>Descargar nuevos modelos a tu sistema local</li>
                    <li>Gestionar tus modelos instalados</li>
                    <li>Configurar parámetros de modelo para rendimiento óptimo</li>
                    <li>Eliminar modelos que ya no necesites</li>
                </ul>
                
                <p>Todos los modelos se ejecutan localmente en tu dispositivo a través de Ollama, asegurando que tus datos permanezcan privados y seguros mientras sigues beneficiándote de poderosas capacidades de IA.</p>
                
                <h4>Modelos de Razonamiento</h4>
                <p>Algunos modelos especializados tienen capacidades de razonamiento mejoradas que pueden activarse con prompts de sistema específicos:</p>
                <ul>
                    <li><strong>Cogito</strong> y otros modelos enfocados en razonamiento pueden requerir un prompt de sistema especial para activar sus capacidades completas</li>
                    <li>Para modelos Cogito, agrega <code>"Enable deep thinking subroutine."</code> (sin comillas) a tu prompt de sistema</li>
                    <li>Esto activa características de razonamiento avanzado, permitiendo un razonamiento más estructurado, paso a paso</li>
                    <li>Diferentes modelos de razonamiento pueden tener diferentes frases de activación - consulta la documentación del modelo para detalles</li>
                </ul>
                
                <div class="note">
                    <p><strong>Nota:</strong> Los modelos en Paiperwork están potenciados por Ollama, que debe estar instalado y ejecutándose en tu sistema. La disponibilidad de modelos depende de tu instalación local de Ollama.</p>
                </div>
            `,
                image: "models_intro.png",
                imageAlt: "Vista General de la Pestaña Modelos",
                imageCaption:
                    "La interfaz de la pestaña Modelos mostrando secciones de modelos disponibles y locales",
            },
            {
                id: "models-browsing",
                title: "Navegando Modelos Disponibles",
                content: `
                <p>Paiperwork te permite navegar toda la biblioteca de modelos de Ollama directamente desde la interfaz de la aplicación.</p>
                
                <h4>Obteniendo Modelos Disponibles</h4>
                <ol>
                    <li>Navega a la pestaña Modelos</li>
                    <li>Haz clic en el botón "Fetch Ollama Models" en la parte superior de la pantalla</li>
                    <li>Espera mientras Paiperwork se conecta a la biblioteca de Ollama</li>
                    <li>Una vez completo, un mensaje de estado confirmará cuántos modelos se encontraron</li>
                </ol>
                
                <h4>Explorando Opciones de Modelos</h4>
                <p>Después de obtener modelos, puedes:</p>
                <ul>
                    <li>Navegar los modelos usando el selector desplegable</li>
                    <li>Ver descripciones de modelos que explican sus capacidades</li>
                    <li>Ver información de popularidad del modelo (número de descargas)</li>
                </ul>
                
                <h4>Tipos de Modelos</h4>
                <p>La biblioteca de Ollama incluye modelos con diferentes especializaciones:</p>
                <ul>
                    <li><strong>Propósito general</strong> - Modelos como Gemma3, Llama, Qwen2.5 y Mistral para tareas cotidianas</li>
                    <li><strong>Especializados en código</strong> - Modelos como Qwen2.5 coder, CodeLlama y WizardCoder optimizados para programación</li>
                    <li><strong>Capaces de visión</strong> - Modelos como Mistral3.1 y Gemma3 que pueden analizar imágenes</li>
                    <li><strong>Ajustados finamente</strong> - Modelos entrenados para casos de uso específicos o con características particulares</li>
                </ul>
                
                <div class="note">
                    <p><strong>Consejo:</strong> Lee las descripciones de modelos cuidadosamente para entender las fortalezas y capacidades de cada modelo antes de descargar.</p>
                </div>
            `,
                image: "models_browsing.png",
                imageAlt: "Navegando Modelos Disponibles",
                imageCaption:
                    "El menú desplegable de selección de modelos mostrando modelos disponibles de la biblioteca de Ollama",
            },
            {
                id: "models-downloading",
                title: "Descargando Modelos",
                content: `
                    <p>Una vez que hayas identificado un modelo que quieres usar, puedes descargarlo directamente a tu sistema local.</p>
                    
                    <h4>Seleccionando un Tamaño de Modelo</h4>
                    <ol>
                        <li>Selecciona un modelo de la lista desplegable</li>
                        <li>Revisa la descripción del modelo</li>
                        <li>Cuando elijas un modelo, las opciones de tamaño aparecerán automáticamente</li>
                        <li>Selecciona la versión de tamaño apropiada que coincida con tus necesidades y capacidades del sistema</li>
                    </ol>
                    
                    <h4>Entendiendo Tamaños de Modelos</h4>
                    <p>La mayoría de modelos están disponibles en múltiples variantes de tamaño:</p>
                    <ul>
                        <li><strong>Tamaños más grandes</strong> (7B, 13B, 34B parámetros) - Estos modelos más grandes proporcionan mejor calidad pero requieren más VRAM (memoria de tarjeta gráfica, excediendo el tamaño del modelo debido a la inclusión de contexto, ten en cuenta que la resolución de pantalla afectará el uso de memoria), RAM (igual que con VRAM, ten en cuenta que tu sistema operativo también usa RAM, así que no toda estará disponible para uso de modelo de IA+contexto), y poder de procesamiento (mientras más rápido el CPU, mejor).</li>
                        <li><strong>Tamaños más pequeños</strong> (3B, 1.5B parámetros) - Más eficientes pero pueden tener capacidades reducidas</li>
                        <li><strong>Versiones cuantizadas</strong> (Q4_K_M, Q5_K_S) - Modelos comprimidos que usan menos memoria mientras mantienen calidad</li>
                    </ul>
                    
                    <h4>Ejemplo de Requisitos de VRAM</h4>
                    <p>Para darte una idea de los requisitos de hardware para ejecutar modelos con una ventana de contexto de 8K:</p>
                    <ul>
                        <li><strong>Modelos pequeños (3B)</strong>: ~4-6GB VRAM con cuantización (Q4/Q5)</li>
                        <li><strong>Modelos medianos (7B)</strong>: ~8-10GB VRAM con cuantización (Q4/Q5)</li>
                        <li><strong>Modelos grandes (13B)</strong>: ~14-16GB VRAM con cuantización (Q4/Q5)</li>
                        <li><strong>Modelos muy grandes (34B+)</strong>: 24GB+ VRAM con cuantización (Q4/Q5)</li>
                    </ul>
                    <p>Estos requisitos pueden variar basándose en modelos específicos y configuraciones del sistema. Considera comenzar con modelos más pequeños o más fuertemente cuantizados si tienes VRAM limitada.</p>
                    
                    <h4>Iniciando la Descarga</h4>
                    <ol>
                        <li>Haz clic en el botón "Download Model"</li>
                        <li>El botón mostrará información del progreso de descarga</li>
                        <li>Un mensaje de estado abajo mostrará la operación actual (descargando, procesando)</li>
                        <li>Aparecerá un botón de cancelar permitiéndote detener la descarga si es necesario</li>
                    </ol>
                    
                    <h4>Proceso de Descarga</h4>
                    <p>Durante la descarga, verás:</p>
                    <ul>
                        <li>Información de progreso mostrando tamaño descargado y tamaño total</li>
                        <li>Actualizaciones de estado para diferentes etapas (obteniendo manifiesto, descargando archivos, verificando)</li>
                        <li>El selector de modelo, selector de tamaño y botón "Fetch Ollama Models" se deshabilitarán durante la descarga</li>
                        <li>Confirmación cuando la descarga esté completa</li>
                    </ul>
                    
                    <h4>Cancelando Descargas</h4>
                    <p>Si necesitas cancelar una descarga en progreso:</p>
                    <ul>
                        <li>Haz clic en el botón "Cancel Download" que aparece debajo del botón de descarga (Si quieres reanudar, haz clic en el botón de descarga nuevamente)</li>
                        <li>Confirma la cancelación cuando se te solicite</li>
                        <li>Después de la cancelación, aparecerá un mensaje recomendando que reinicies Ollama para limpiar archivos parcialmente descargados</li>
                        <li>Este mensaje desaparecerá automáticamente después de 30 segundos</li>
                        <li>El selector de modelo, selector de tamaño y botón "Fetch Ollama Models" se volverán a habilitar</li>
                    </ul>
                    
                    <h4>Cambiando Entre Pestañas</h4>
                    <p>Si cambias a otra pestaña durante una descarga:</p>
                    <ul>
                        <li>La descarga continuará en segundo plano</li>
                        <li>Cuando regreses a la pestaña Modelos, se mostrará el estado actual de descarga</li>
                        <li>La interfaz mostrará qué archivo se está descargando actualmente y el progreso general</li>
                    </ul>
                    
                    <div class="note">
                        <p><strong>Importante:</strong> Las descargas de modelos pueden ser grandes (desde cientos de MB hasta cientos de GB). Asegúrate de tener suficiente espacio en disco y una conexión a internet estable antes de iniciar una descarga. Si necesitas obtener nuevos modelos mientras una descarga está en progreso, debes cancelar la descarga actual primero.</p>
                    </div>
                `,
                image: "models_downloading.png",
                imageAlt: "Descargando Modelos",
                imageCaption: "La interfaz de descarga de modelos mostrando progreso de descarga y selección de tamaño",
            },
            {
                id: "models-managing",
                title: "Gestionando Modelos Locales",
                content: `
                <p>Después de descargar modelos, puedes gestionarlos a través de la sección Modelos Locales de la pestaña Modelos.</p>
                
                <h4>Viendo Modelos Instalados</h4>
                <p>La sección Modelos Locales muestra todos los modelos actualmente instalados en tu sistema:</p>
                <ul>
                    <li>Los modelos se listan en un selector desplegable</li>
                    <li>Selecciona un modelo para acceder a opciones de gestión</li>
                    <li>El modelo descargado más recientemente se selecciona automáticamente</li>
                </ul>
                
                <h4>Eliminando Modelos</h4>
                <p>Para remover modelos que ya no necesitas:</p>
                <ol>
                    <li>Selecciona el modelo del menú desplegable Modelos Locales</li>
                    <li>Haz clic en el botón "Delete"</li>
                    <li>Confirma la eliminación cuando se te solicite</li>
                    <li>Espera a que el proceso se complete</li>
                </ol>
                <p>Eliminar modelos no utilizados ayuda a liberar espacio en disco en tu sistema.</p>
                
                <div class="note">
                    <p><strong>Nota:</strong> Si eliminas un modelo que está siendo usado actualmente en una conversación, necesitarás seleccionar un nuevo modelo para continuar chateando.</p>
                </div>
            `,
                image: "models_managing.png",
                imageAlt: "Gestionando Modelos Locales",
                imageCaption:
                    "La sección de modelos locales mostrando opciones de gestión de modelos",
            },
            {
                id: "models-configuration",
                title: "Configurando Parámetros de Modelos",
                content: `
                <p>Ajusta finamente cómo responden los modelos modificando sus parámetros en el archivo modelparameters.js.</p>
                
                <h4>Configuración de Parámetros</h4>
                <p>Los parámetros de modelo ahora se configuran directamente en el archivo <code>modelparameters.js</code>:</p>
                <ul>
                    <li>Abre el archivo <code>modelparameters.js</code> en tu editor de código</li>
                    <li>Agrega tu modelo al objeto <code>MODEL_PARAMETERS</code> o modifica entradas existentes</li>
                    <li>Guarda el archivo y reinicia la aplicación para aplicar cambios</li>
                </ul>
                
                <h4>Ejemplo para Agregar un Nuevo Modelo</h4>
                <pre><code>// Agregar al objeto MODEL_PARAMETERS en modelparameters.js
                'nombre-de-tu-modelo': {
                    temperature: 0.7,
                    top_k: 50,
                    top_p: 0.9,
                    min_p: 0.05,
                    repeat_penalty: 1.1
                }</code></pre>
                
                <h4>Parámetros Disponibles</h4>
                <p>Los siguientes parámetros pueden ajustarse para la mayoría de modelos:</p>
                <ul>
                    <li><strong>Temperature</strong> (0.0-2.0) - Controla la aleatoriedad en respuestas. Valores más altos producen salidas más diversas y creativas, mientras que valores más bajos hacen respuestas más enfocadas y determinísticas.</li>
                    <li><strong>Top P</strong> (0.0-1.0) - Controla diversidad limitando la selección de tokens a un umbral de probabilidad acumulativa. Valores más bajos crean respuestas más enfocadas.</li>
                    <li><strong>Top K</strong> (1-100+) - Restringe la selección de tokens a los K tokens más probables. Valores más bajos crean respuestas más predecibles.</li>
                    <li><strong>Min P</strong> (0.0-1.0) - Establece un umbral mínimo de probabilidad para selección de tokens. Valores más altos fuerzan al modelo a ser más decisivo.</li>
                    <li><strong>Repeat Penalty</strong> (1.0-2.0) - Desalienta repetición penalizando tokens usados previamente. Valores más altos reducen repetición más agresivamente.</li>
                </ul>
                
                <h4>Recomendaciones de Parámetros</h4>
                <p>Diferentes tareas se benefician de diferentes configuraciones de parámetros:</p>
                <ul>
                    <li><strong>Escritura creativa</strong> - Temperature más alta (0.7-1.0), top_p más alto (0.9)</li>
                    <li><strong>Respuestas factuales</strong> - Temperature más baja (0.1-0.3), top_k bajo (40)</li>
                    <li><strong>Generación de código</strong> - Temperature más baja (0.1-0.4), repeat_penalty más alto (1.1)</li>
                </ul>
                
                <div class="note">
                    <p><strong>Importante:</strong> Después de modificar el archivo modelparameters.js, necesitas reiniciar la aplicación para que los cambios tengan efecto.</p>
                </div>
                `,
                image: "models_configuration.png",
                imageAlt: "Interfaz de Configuración de Modelos",
                imageCaption: "Ejemplo del archivo modelparameters.js con configuración personalizada",
            },
            {
                id: "models-troubleshooting",
                title: "Solucionando Problemas de Modelos",
                content: `
                    <p>Si encuentras problemas con modelos en Paiperwork, aquí hay algunos problemas comunes y soluciones:</p>
                    
                    <h4>Fallas de Obtención de Modelos</h4>
                    <p>Si no puedes obtener modelos de la biblioteca de Ollama:</p>
                    <ul>
                        <li>Verifica que Ollama esté ejecutándose en tu sistema</li>
                        <li>Revisa tu conexión a internet</li>
                        <li>Reinicia Ollama e intenta nuevamente</li>
                        <li>Asegúrate de estar usando una versión compatible de Ollama (actualmente:0.6.6)</li>
                    </ul>
                    
                    <h4>Problemas de Descarga</h4>
                    <p>Si las descargas de modelos fallan o se atascan:</p>
                    <ul>
                        <li>Revisa la estabilidad de tu conexión a internet</li>
                        <li>Asegúrate de tener suficiente espacio en disco</li>
                        <li>Intenta cancelar y reiniciar la descarga</li>
                        <li>Reinicia Ollama después de cancelar para limpiar archivos incompletos</li>
                        <li>Intenta descargar un tamaño de modelo más pequeño primero</li>
                    </ul>
                    
                    <h4>Limpieza de Descarga Incompleta</h4>
                    <p>Si cancelaste una descarga y necesitas limpiar archivos:</p>
                    <ul>
                        <li>Reinicia el servicio de Ollama en tu sistema</li>
                        <li>Esto permite a Ollama limpiar cualquier archivo de modelo parcialmente descargado</li>
                        <li>Después de reiniciar, puedes intentar una nueva descarga</li>
                    </ul>
                    
                    <h4>Problemas de Elementos de UI</h4>
                    <p>Si los elementos de UI en la pestaña Modelos aparecen atascados o deshabilitados:</p>
                    <ul>
                        <li>Si los selectores permanecen deshabilitados después de que una descarga se complete o sea cancelada, actualiza la página</li>
                        <li>Si el botón "Fetch Ollama Models" está deshabilitado sin una descarga activa, actualiza la página</li>
                        <li>Después de múltiples errores de descarga, el sistema eventualmente rehabilitará todos los controles automáticamente</li>
                    </ul>
                    
                    <h4>Problemas de Rendimiento de Modelos</h4>
                    <p>Si un modelo se ejecuta lentamente o falla:</p>
                    <ul>
                        <li>Revisa los recursos de tu sistema (uso de VRAM, RAM y CPU)</li>
                        <li>Intenta un modelo más pequeño o versión cuantizada</li>
                        <li>Cierra otras aplicaciones intensivas en recursos</li>
                        <li>Ajusta el tamaño de contexto en la pestaña Chat a un valor más pequeño</li>
                    </ul>
                    
                    <h4>Modelo No Aparece en Chat</h4>
                    <p>Si un modelo descargado no aparece en el menú desplegable de selección de modelo en Chat:</p>
                    <ul>
                        <li>Verifica que la descarga del modelo se completó exitosamente</li>
                        <li>Actualiza la pestaña Chat o reinicia la aplicación</li>
                        <li>Revisa si el modelo requiere características específicas o configuraciones</li>
                    </ul>
                    
                    <div class="note">
                        <p><strong>Nota:</strong> Si los problemas persisten, revisa la documentación de Ollama o busca registros de Ollama en tu sistema para información de error más detallada.</p>
                    </div>
                `,
            }
        ],
    },
    database: {
        title: "Datos",
        intro: "La pestaña Base de Datos proporciona herramientas para monitorear y mantener tu base de datos local, asegurando un rendimiento óptimo e integridad de los datos mientras preserva la privacidad completa.",
        articles: [
            {
                id: "database-intro",
                title: "Introducción a la Gestión de Base de Datos",
                content: `
                <p>La pestaña Base de Datos te da visibilidad y control sobre el sistema de base de datos local de Paiperwork que almacena todas tus conversaciones, documentos y datos de la aplicación.</p>
                
                <p>Las características clave de la pestaña Base de Datos incluyen:</p>
                <ul>
                    <li>Estadísticas en tiempo real sobre el tamaño y contenido de la base de datos</li>
                    <li>Herramientas para identificar y limpiar datos huérfanos</li>
                    <li>Capacidades de optimización de base de datos</li>
                    <li>Información sobre tu método de almacenamiento y seguridad</li>
                </ul>
                
                <p>Todos los datos en Paiperwork se almacenan localmente en una base de datos SQLite dentro del almacenamiento de tu navegador. Esta base de datos está completamente encriptada usando tu Clave Maestra, asegurando privacidad y seguridad completas.</p>
                
                <div class="note">
                    <p><strong>Importante:</strong> A diferencia de las aplicaciones basadas en la nube, la base de datos de Paiperwork requiere mantenimiento ocasional para asegurar un rendimiento óptimo. La pestaña Base de Datos proporciona las herramientas que necesitas para este mantenimiento.</p>
                </div>
            `,
                image: "database_overview.png",
                imageAlt: "Vista General de la Pestaña Base de Datos",
                imageCaption: "La pestaña Base de Datos mostrando estadísticas y herramientas de gestión"
            },
            {
                id: "database-stats",
                title: "Comprendiendo las Estadísticas de la Base de Datos",
                content: `
                <p>El panel de Estadísticas de Base de Datos proporciona información importante sobre tu base de datos local:</p>
                
                <h4>Estadísticas Clave</h4>
                <ul>
                    <li><strong>Tamaño de Base de Datos</strong> - Espacio total en disco usado por tu base de datos</li>
                    <li><strong>Documentos</strong> - Número de documentos almacenados en tu base de datos</li>
                    <li><strong>Total de Fragmentos</strong> - Segmentos de texto usados para búsqueda y recuperación de documentos</li>
                    <li><strong>Salud de Base de Datos</strong> - Indicador de estado para la integridad de la base de datos</li>
                </ul>
                
                <h4>Indicadores de Salud</h4>
                <p>El indicador de Salud de Base de Datos puede mostrar:</p>
                <ul>
                    <li><strong>Saludable</strong> - La marca verde indica que tu base de datos está optimizada y no tiene datos huérfanos</li>
                    <li><strong>Fragmentos Huérfanos</strong> - Aparece una advertencia amarilla cuando se detectan fragmentos huérfanos, mostrando cuántos fragmentos están huérfanos</li>
                </ul>
                
                <h4>Método de Almacenamiento</h4>
                <p>La sección "Acerca de Tu Base de Datos" muestra tu método de almacenamiento actual:</p>
                <ul>
                    <li><strong>OPFS (Sistema de Archivos Privado de Origen)</strong> - Almacenamiento moderno de alto rendimiento disponible en navegadores más nuevos</li>
                    <li><strong>IndexedDB</strong> - Método de almacenamiento alternativo para navegadores sin soporte OPFS</li>
                </ul>
                
                <h4>Actualizando Estadísticas</h4>
                <p>Para obtener la información más actualizada:</p>
                <ol>
                    <li>Haz clic en el botón "Actualizar Estadísticas"</li>
                    <li>Espera a que el sistema analice tu base de datos</li>
                    <li>Revisa las estadísticas actualizadas</li>
                </ol>
                
                <div class="note">
                    <p><strong>Nota:</strong> Las estadísticas de base de datos se cargan automáticamente cuando abres por primera vez la pestaña Base de Datos y cuando regresas a ella después de usar otras pestañas.</p>
                </div>
            `,
            },
            {
                id: "database-orphaned",
                title: "Gestionando Datos Huérfanos",
                content: `
                <p>Cuando eliminas documentos o conversaciones, a veces pequeños fragmentos de datos pueden volverse "huérfanos" - desconectados de su contenido padre pero aún ocupando espacio en tu base de datos.</p>
                
                <h4>¿Qué Son los Fragmentos Huérfanos?</h4>
                <p>Los fragmentos huérfanos son segmentos de texto que una vez fueron parte de un documento o conversación pero ya no están asociados con ningún contenido existente. Ocurren cuando:</p>
                <ul>
                    <li>Los documentos se eliminan sin limpiar adecuadamente todos los fragmentos asociados</li>
                    <li>Ocurren interrupciones de operación durante la eliminación de documentos</li>
                    <li>Los errores del sistema impiden la limpieza completa durante operaciones normales</li>
                </ul>
                
                <h4>Identificando Datos Huérfanos</h4>
                <p>La pestaña Base de Datos detecta automáticamente fragmentos huérfanos y te alerta con:</p>
                <ul>
                    <li>Un indicador de advertencia amarillo en la sección Salud de Base de Datos</li>
                </ul>
                
                <h4>Limpiando Datos Huérfanos</h4>
                <ol>
                    <li>Cuando se detectan fragmentos huérfanos, haz clic en el botón "Limpiar base de datos"</li>
                    <li>El sistema identificará y eliminará todos los fragmentos huérfanos</li>
                    <li>Aparecerá un mensaje de éxito mostrando cuántos fragmentos fueron eliminados y cuánto espacio se recuperó</li>
                    <li>Las estadísticas de base de datos se actualizarán automáticamente para mostrar el estado mejorado</li>
                </ol>
                
                <div class="note">
                    <p><strong>Importante:</strong> Limpiar datos huérfanos solo elimina fragmentos innecesarios - no afecta ninguno de tus documentos reales, conversaciones o información almacenada.</p>
                </div>
            `,
                image: "database_orphaned.png",
                imageAlt: "Limpieza de Datos Huérfanos",
                imageCaption: "El mensaje de base de datos limpiada"
            },
            {
                id: "database-optimize",
                title: "Optimizando el Rendimiento de la Base de Datos",
                content: `
                <p>Con el tiempo, a medida que agregas y eliminas contenido, tu base de datos puede fragmentarse y usar más espacio del necesario. La pestaña Base de Datos proporciona herramientas para optimizar el rendimiento y recuperar espacio no utilizado.</p>
                
                <h4>Cuándo Optimizar Tu Base de Datos</h4>
                <p>Considera ejecutar la optimización de base de datos cuando:</p>
                <ul>
                    <li>Has eliminado documentos grandes o muchas conversaciones</li>
                    <li>La aplicación parece más lenta de lo usual</li>
                    <li>Notas que el tamaño de la base de datos es mayor de lo esperado</li>
                    <li>Quieres recuperar espacio en disco</li>
                </ul>
                
                <h4>Cómo Cambia el Tamaño de la Base de Datos</h4>
                <p>Entendiendo cómo funciona el tamaño de base de datos en SQLite:</p>
                <ul>
                    <li>Cuando agregas contenido, la base de datos crece para acomodarlo</li>
                    <li>Cuando eliminas contenido, el archivo de base de datos no se reduce automáticamente</li>
                    <li>El espacio eliminado se marca como disponible para reutilización pero aún cuenta en el tamaño total del archivo</li>
                    <li>Solo la optimización (VACUUM) realmente reduce el tamaño del archivo reconstruyendo la base de datos</li>
                </ul>
                
                <h4>Ejecutando la Optimización de Base de Datos</h4>
                <ol>
                    <li>Haz clic en el botón "Limpiar Base de Datos" en la pestaña Base de Datos</li>
                    <li>Espera a que el proceso de optimización se complete (esto puede tomar un momento para bases de datos más grandes)</li>
                    <li>Aparecerá una notificación mostrando cuánto espacio se recuperó</li>
                    <li>Las estadísticas de base de datos se actualizarán automáticamente</li>
                </ol>
                
                <h4>Qué Hace la Optimización</h4>
                <ul>
                    <li>Reconstruye el archivo de base de datos para eliminar espacio no utilizado</li>
                    <li>Desfragmenta datos para un almacenamiento más eficiente</li>
                    <li>Reorganiza índices para consultas más rápidas</li>
                    <li>Reduce el archivo de base de datos a su tamaño óptimo</li>
                </ul>
                
                <div class="note">
                    <p><strong>Consejo:</strong> Haz el hábito de ejecutar la optimización de base de datos después de eliminar documentos grandes o múltiples conversaciones para mantener un rendimiento óptimo. A diferencia de muchas aplicaciones en la nube, las aplicaciones de base de datos locales como Paiperwork requieren mantenimiento ocasional para continuar funcionando sin problemas.</p>
                </div>
            `,
            },
            {
                id: "database-maintenance",
                title: "Mejores Prácticas de Mantenimiento de Base de Datos",
                content: `
                <p>El mantenimiento adecuado de la base de datos asegura que Paiperwork continúe funcionando sin problemas y eficientemente. Sigue estas mejores prácticas para mantener tu base de datos saludable.</p>
                
                <h4>Calendario de Mantenimiento Regular</h4>
                <p>Establece un calendario de mantenimiento rutinario:</p>
                <ul>
                    <li><strong>Semanal</strong> - Verifica las estadísticas de base de datos y limpia datos huérfanos si se encuentran</li>
                    <li><strong>Mensual</strong> - Ejecuta optimización de base de datos para recuperar espacio y mejorar rendimiento</li>
                    <li><strong>Después de operaciones masivas</strong> - Optimiza después de eliminar múltiples documentos o conversaciones</li>
                </ul>
                
                <h4>Indicadores de Rendimiento</h4>
                <p>Observa señales de que tu base de datos necesita mantenimiento:</p>
                <ul>
                    <li>Tiempos de respuesta más lentos de la aplicación</li>
                    <li>Retrasos al cambiar entre pestañas</li>
                    <li>Tiempos de carga más largos para documentos o conversaciones</li>
                    <li>Crecimiento inesperado en el tamaño de la base de datos</li>
                </ul>
                
                <h4>Mantenimiento Preventivo</h4>
                <ul>
                    <li>Limpia documentos y conversaciones innecesarios regularmente</li>
                    <li>Ejecuta optimización después de eliminar cantidades significativas de datos</li>
                    <li>Verifica fragmentos huérfanos periódicamente incluso si no aparece advertencia</li>
                    <li>Reinicia la aplicación ocasionalmente para permitir optimización del almacenamiento del navegador</li>
                </ul>
                
                <h4>Entendiendo el Crecimiento de la Base de Datos</h4>
                <p>Es normal que tu base de datos crezca con el tiempo a medida que:</p>
                <ul>
                    <li>Agregas más documentos para procesamiento RAG</li>
                    <li>Tienes más conversaciones con la IA</li>
                    <li>Creas entradas de base de conocimientos y colecciones</li>
                    <li>Generas y guardas más reportes de investigación</li>
                </ul>
                <p>Lo que no es normal es cuando la base de datos permanece grande después de que has eliminado este contenido - ahí es cuando se necesita optimización.</p>
                
                <div class="note">
                    <p><strong>Importante:</strong> A diferencia de las aplicaciones en la nube, las aplicaciones de base de datos locales no tienen procesos de mantenimiento automático ejecutándose en servidores. La pestaña Base de Datos te da las herramientas para realizar este mantenimiento tú mismo, manteniendo tu aplicación funcionando sin problemas.</p>
                </div>
            `,
            },
            {
                id: "database-troubleshooting",
                title: "Solucionando Problemas de Base de Datos",
                content: `
                <p>Si encuentras problemas con la base de datos o notas problemas de rendimiento, aquí hay algunos pasos de solución de problemas:</p>
                
                <h4>Problemas Comunes y Soluciones</h4>
                
                <h5>Rendimiento Lento de la Aplicación</h5>
                <ul>
                    <li><strong>Problema:</strong> Paiperwork se siente lento o tarda más en responder</li>
                    <li><strong>Solución:</strong> Ejecuta optimización de base de datos haciendo clic en el botón "Limpiar Base de Datos"</li>
                    <li><strong>Prevención:</strong> Programa optimización regular, especialmente después de eliminaciones grandes</li>
                </ul>
                
                <h5>Tamaño Grande de Base de Datos</h5>
                <ul>
                    <li><strong>Problema:</strong> El tamaño de la base de datos parece desproporcionadamente grande comparado con tu contenido</li>
                    <li><strong>Solución 1:</strong> Verifica y limpia fragmentos huérfanos</li>
                    <li><strong>Solución 2:</strong> Ejecuta optimización de base de datos para recuperar espacio no utilizado</li>
                    <li><strong>Solución 3:</strong> Revisa y elimina documentos y conversaciones innecesarios</li>
                </ul>
                
                <h5>Contenido Faltante Después de Cambios de Sesión</h5>
                <ul>
                    <li><strong>Problema:</strong> El contenido parece estar faltando al cambiar Claves Maestras</li>
                    <li><strong>Solución:</strong> Verifica que estés usando la Clave Maestra correcta para ese contenido</li>
                    <li><strong>Explicación:</strong> Diferentes Claves Maestras crean áreas de almacenamiento seguro separadas</li>
                </ul>
                
                <h5>Estadísticas No Se Actualizan</h5>
                <ul>
                    <li><strong>Problema:</strong> Las estadísticas de base de datos no parecen reflejar cambios recientes</li>
                    <li><strong>Solución:</strong> Haz clic en el botón "Actualizar Estadísticas" para actualizar manualmente</li>
                    <li><strong>Explicación:</strong> Algunas estadísticas están en caché y necesitan actualización manual</li>
                </ul>
                
                <h5>Fragmentos Huérfanos Persistentes</h5>
                <ul>
                    <li><strong>Problema:</strong> Los fragmentos huérfanos reaparecen después de la limpieza</li>
                    <li><strong>Solución 1:</strong> Intenta ejecutar el proceso de limpieza nuevamente</li>
                    <li><strong>Solución 2:</strong> Actualiza el navegador e intenta limpiar de nuevo</li>
                    <li><strong>Solución 3:</strong> Ejecuta optimización de base de datos después de la limpieza</li>
                </ul>
                
                <h4>Último Recurso: Reinicio de Base de Datos</h4>
                <p>Si ocurren problemas persistentes y el mantenimiento normal no ayuda:</p>
                <ol>
                    <li>Exporta cualquier conversación o documento importante primero</li>
                    <li>Regresa a la pantalla de bienvenida</li>
                    <li>Haz clic en "Eliminar Toda la Información" para reiniciar la base de datos</li>
                    <li>Esto eliminará todos los datos y creará una base de datos nueva</li>
                </ol>
                
                <div class="note">
                    <p><strong>Advertencia:</strong> El reinicio de base de datos es irreversible y eliminará todos tus datos. Siempre exporta información importante primero.</p>
                </div>
            `,
            }
        ],
    },

}