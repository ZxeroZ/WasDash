// --- FUNCIONES DE RENDERIZADO DE VISTAS (HTML) ---

/**
 * Renderiza el HTML para el encabezado (usado en múltiples vistas).
 * @param {string} title - El título del chat.
 * @param {string} activeView - La vista activa ('readOnlyChat', 'chat', 'stats', 'export').
 * @param {string|null} statsLabel - Texto para el botón de stats (ej: "Analizar Chat").
 * @returns {string} HTML del encabezado.
 */
function renderHeader(title, activeView, statsLabel = null) {
    const isAnalysisView = ['chat', 'stats', 'export'].includes(activeView);
    const isReadOnlyView = activeView === 'readOnlyChat';

    return `
        <div class="bg-emerald-600 text-white p-4 shadow-lg sticky top-0 z-10 no-print">
            <div class="max-w-7xl mx-auto flex items-center justify-between">
                <div class="flex items-center gap-3 min-w-0">
                    <svg class="w-8 h-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                    <div class="min-w-0">
                        <h1 class="text-lg font-semibold truncate" title="${title}">${title}</h1>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${isReadOnlyView ? `
                        <button onclick="startAnalysis()" class="px-4 py-2 rounded-lg bg-white text-emerald-600 font-semibold text-sm transition-colors hover:bg-emerald-100">
                            ${statsLabel || '📊 Analizar Chat'}
                        </button>
                    ` : ''}
                    
                    ${isAnalysisView ? `
                        <button onclick="setView('chat')" class="px-3 py-2 rounded-lg text-sm transition-colors ${activeView === 'chat' ? 'bg-white text-emerald-600' : 'bg-emerald-700 hover:bg-emerald-800'}" title="Chat">
                            <span class="hidden sm:inline">💬 Chat</span>
                            <span class="sm:hidden">💬</span>
                        </button>
                        <button onclick="setView('stats')" class="px-3 py-2 rounded-lg text-sm transition-colors ${activeView === 'stats' ? 'bg-white text-emerald-600' : 'bg-emerald-700 hover:bg-emerald-800'}" title="Estadísticas">
                            <span class="hidden sm:inline">📊 Stats</span>
                            <span class="sm:hidden">📊</span>
                        </button>
                        <button onclick="setView('export')" class="px-3 py-2 rounded-lg text-sm transition-colors ${activeView === 'export' ? 'bg-white text-emerald-600' : 'bg-emerald-700 hover:bg-emerald-800'}" title="Exportar">
                            <span class="hidden sm:inline">Exportar</span>
                            <span class="sm:hidden">💾</span>
                        </button>
                    ` : ''}

                    <button onclick="resetApp(true)" title="Cargar nuevo chat" 
                            class="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-red-500 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2.086a10.001 10.001 0 01-15.356-2.086m0 0V4h-.582m15.356 5.914a10.001 10.001 0 01-15.356 2.086m0 0H4v5m.582-15.356a10.001 10.001 0 0115.356 2.086m0 0V20h-.582m-15.356-5.914a10.001 10.001 0 0115.356-2.086m0 0H20v-5"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renderiza el HTML para la vista de "cargando".
 * @returns {string} HTML de la vista.
 */
export function renderLoadingView() {
    return `
        <div class="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
            <div class="text-center">
                <svg class="w-16 h-16 text-emerald-600 mx-auto mb-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2.086a10.001 10.001 0 01-15.356-2.086m0 0V4h-.582m15.356 5.914a10.001 10.001 0 01-15.356 2.086m0 0H4v5m.582-15.356a10.001 10.001 0 0115.356 2.086m0 0V20h-.582m-15.356-5.914a10.001 10.001 0 0115.356-2.086m0 0H20v-5"></path>
                </svg>
                <h2 class="text-2xl font-semibold text-gray-800">Procesando tu chat...</h2>
                <p class="text-gray-600">Esto puede tardar un momento si el chat es muy grande o tiene muchos archivos.</p>
            </div>
        </div>
    `;
}

/**
 * Renderiza el HTML para la vista inicial de subida.
 * @param {Array} savedAnalyses - Lista de análisis guardados.
 * @returns {string} HTML de la vista.
 */
export function renderUploadView(savedAnalyses) {
    return `
        <div class="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
            <div class="max-w-3xl w-full">
                <div class="text-center mb-8">
                    <svg class="w-16 h-16 text-emerald-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                    <h1 class="text-4xl font-bold text-gray-900 mb-2">Dashboard de Chats</h1>
                    <p class="text-gray-600">Analiza tus conversaciones de WhatsApp con IA y estadísticas detalladas.</p>
                </div>
                
                <div id="dropzone" class="bg-white rounded-2xl shadow-xl p-12 border-2 border-dashed border-gray-300 hover:border-emerald-500 transition-colors cursor-pointer">
                    <input type="file" accept=".zip" id="file-upload" class="hidden">
                    <label for="file-upload" class="cursor-pointer block text-center">
                        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                        <p class="text-xl font-semibold text-gray-700 mb-2">
                            Arrastra tu archivo o haz clic para seleccionar
                        </p>
                        <p class="text-sm text-gray-500">
                            Solo archivos <strong>.zip</strong> exportados de WhatsApp (con o sin multimedia)
                        </p>
                    </label>
                </div>

                ${savedAnalyses.length > 0 ? `
                    <div class="mt-8 bg-white rounded-2xl shadow-xl p-8">
                        <div class="flex justify-between items-center mb-4">
                            <h2 class="text-xl font-semibold text-gray-800">Análisis Guardados</h2>
                            <button onclick="clearSavedAnalyses()" class="text-sm text-red-500 hover:underline">Borrar todo</button>
                        </div>
                        <ul class="space-y-3">
                            ${savedAnalyses.map((stats, index) => `
                                <li class="flex justify-between items-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100">
                                    <div>
                                        <p class="font-semibold text-emerald-700">Chat con ${stats.receiverName}</p>
                                        <p class="text-sm text-gray-500">${stats.messageCount} mensajes | Guardado: ${new Date(stats.savedAt).toLocaleDateString()}</p>
                                    </div>
                                    <button onclick="loadSavedAnalysis(${index})" class="px-3 py-1 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700">
                                        Cargar
                                    </button>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Función helper para hacer los links en el texto clickables.
 * @param {string} text - El contenido del mensaje.
 * @returns {string} - HTML con etiquetas <a> para los links.
 */
function renderLinks(text) {
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(linkRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800">$1</a>');
}

/**
 * Renderiza el HTML para la vista de "solo lectura" (post-subida).
 * @param {Array} messages - El array de mensajes.
 * @param {string} title - El título del chat.
 * @returns {string} HTML de la vista.
 */
export function renderReadOnlyChatView(messages, title) {
    return `
        <div class="min-h-screen bg-gray-100">
            ${renderHeader(title, 'readOnlyChat')}
            
            <div class="max-w-4xl mx-auto p-4">
                <div class="mb-4">
                    <input type="text" id="search-bar" placeholder="Buscar en el chat (ej: 'hola' o 'Jose')..." 
                           class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 no-print">
                </div>
                
                <div class="bg-white rounded-lg shadow-lg p-6 space-y-5 max-h-[calc(100vh-180px)] overflow-y-auto">
                    ${messages.map((msg, idx) => `
                        <div class="message-bubble max-w-[75%]"> 
                        <p class="font-semibold text-emerald-700 mb-1">${msg.sender}</p>
                            
                            ${msg.mediaBlobUrl ? `
                                <div class="my-2 media-container">
                                ${msg.mediaType === 'image' ? 
                                    `<img src="${msg.mediaBlobUrl}" class="rounded-lg max-w-full h-auto" alt="${msg.mediaFileName}">` :
                                msg.mediaType === 'sticker' ?
                                    `<img src="${msg.mediaBlobUrl}" class="w-36 h-36" alt="${msg.mediaFileName}">` :
                                msg.mediaType === 'video' ?
                                    `<video src="${msg.mediaBlobUrl}" controls class="rounded-lg max-w-full">Video no soportado.</video>` :
                                msg.mediaType === 'audio' ?
                                    `<audio src="${msg.mediaBlobUrl}" controls class="w-full">Audio no soportado.</audio>` :
                                    `<a href="${msg.mediaBlobUrl}" target="_blank" class="text-blue-600 underline">${msg.mediaFileName || 'Ver archivo'}</a>`
                                }
                                </div>
                            ` : msg.isMultimedia ? `
                                <p class="text-sm text-gray-500 italic my-2">[${msg.content}]</p>
                            ` : ''}

                            ${!msg.isMultimedia || (msg.isMultimedia && msg.content !== `[Adjunto: ${msg.mediaFileName}]`) ? `
                                <p class="whitespace-pre-wrap break-words">${renderLinks(msg.content)}</p>
                            ` : ''}
                            
                            <p class="text-xs text-gray-400 mt-1.5">${msg.date} ${msg.time}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

/**
 * Renderiza el HTML para la vista de selección de participantes.
 * @param {Array} participants - Lista de participantes.
 * @returns {string} HTML de la vista.
 */
export function renderSelectView(participants) {
    return `
        <div class="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
            <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <svg class="w-12 h-12 text-emerald-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
                <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">
                    Analizar Conversación 1-a-1
                </h2>
                <p class="text-center text-gray-600 mb-6">
                    Selecciona los dos participantes que quieres analizar.
                </p>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Participante 1 (Ej: Tú)
                        </label>
                        <select id="sender-select" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                            <option value="">Selecciona...</option>
                            ${participants.map(p => `<option value="${p}">${p}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Participante 2
                        </label>
                        <select id="receiver-select" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                            <option value="">Selecciona...</option>
                        </select>
                    </div>
                </div>
                
                <button id="continue-btn" disabled class="w-full mt-6 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                    Continuar Análisis
                </button>
            </div>
        </div>
    `;
}

/**
 * Renderiza el HTML para la vista de chat analizado (1-a-1).
 * @param {Array} messages - El array de mensajes.
 * @param {string} selectedSender - El remitente (tú).
 * @param {string} selectedReceiver - El destinatario.
 * @returns {string} HTML de la vista.
 */
export function renderChatView(messages, selectedSender, selectedReceiver) {
    const relevantMessages = messages.filter(m => m.sender === selectedSender || m.sender === selectedReceiver);
    
    return `
        <div class="min-h-screen bg-gray-100">
            ${renderHeader(`Chat: ${selectedSender} ↔ ${selectedReceiver}`, 'chat')}

            <div class="max-w-4xl mx-auto p-4">
                 <div class="mb-4">
                    <input type="text" id="search-bar" placeholder="Buscar en esta conversación..." 
                           class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 no-print">
                </div>

                <div class="bg-white rounded-lg shadow-lg p-6 space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto">
                    ${relevantMessages.map((msg, idx) => {
                        const isSender = msg.sender === selectedSender;
                        return `
                            <div class="flex message-bubble ${isSender ? 'justify-end' : 'justify-start'}">
                                <div class="max-w-[70%] ${isSender ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-900'} rounded-2xl px-4 py-2 shadow-md">
                                    
                                    ${msg.mediaBlobUrl ? `
                                        <div class="my-1 media-container">
                                        ${msg.mediaType === 'image' ? 
                                            `<img src="${msg.mediaBlobUrl}" class="rounded-lg max-w-full h-auto" alt="${msg.mediaFileName}">` :
                                        msg.mediaType === 'sticker' ?
                                            `<img src="${msg.mediaBlobUrl}" class="w-36 h-36" alt="${msg.mediaFileName}">` :
                                        msg.mediaType === 'video' ?
                                            `<video src="${msg.mediaBlobUrl}" controls class="rounded-lg max-w-full">Video no soportado.</video>` :
                                        msg.mediaType === 'audio' ?
                                            `<audio src="${msg.mediaBlobUrl}" controls class="max-w-full">Audio no soportado.</audio>` :
                                            `<a href="${msg.mediaBlobUrl}" target="_blank" class="${isSender ? 'text-white underline' : 'text-blue-600 underline'}">${msg.mediaFileName || 'Ver archivo'}</a>`
                                        }
                                        </div>
                                    ` : msg.isMultimedia ? `
                                        <p class="text-sm ${isSender ? 'text-emerald-100' : 'text-gray-500'} italic my-1">[${msg.content}]</p>
                                    ` : ''}

                                    ${!msg.isMultimedia || (msg.isMultimedia && msg.content !== `[Adjunto: ${msg.mediaFileName}]`) ? `
                                        <p class="whitespace-pre-wrap break-words">${renderLinks(msg.content)}</p>
                                    ` : ''}

                                    <p class="text-xs mt-1 text-right ${isSender ? 'text-emerald-100' : 'text-gray-500'}">
                                        ${msg.time}
                                    </p>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

// 
// --- ¡FUNCIÓN ACTUALIZADA! ---
// 
/**
 * Renderiza el HTML para la vista de estadísticas.
 * @param {object} stats - El objeto de estadísticas de calculateStatistics.
 * @param {string} selectedSender - El remitente (tú).
 * @param {string} selectedReceiver - El destinatario.
 * @returns {string} HTML de la vista.
 */
export function renderStatsView(stats, selectedSender, selectedReceiver) {
    if (!stats) {
        return `
            <div class="min-h-screen bg-gray-100">
                ${renderHeader('Error de Estadísticas', 'stats')}
                <div class="max-w-7xl mx-auto p-4 pb-8">
                    <p class="text-red-500">No se pudieron calcular las estadísticas. Intenta volver a cargar el chat.</p>
                </div>
            </div>
        `;
    }

    // --- CÁLCULOS ADICIONALES PARA LA VISTA ---

    // 1. Fecha del primer mensaje
    const firstMessageDate = stats.dayCounts.length > 0 ? stats.dayCounts[0][0] : 'N/A';

    // 2. Porcentaje de quién inicia
    const totalStarters = (stats.conversationStarters[selectedSender] || 0) + (stats.conversationStarters[selectedReceiver] || 0);
    const starterPercent = totalStarters > 0 ? Math.round((stats.conversationStarters[stats.conversationStarter] / totalStarters) * 100) : 0;
    const conversationStarterInfo = {
        name: stats.conversationStarter,
        percent: starterPercent
    };

    // 3. Racha de mensajes más larga (El "Insistente")
    const longestTextStreak = stats.longestSenderStreak > stats.longestReceiverStreak ?
        { name: selectedSender, count: stats.longestSenderStreak } :
        { name: selectedReceiver, count: stats.longestReceiverStreak };

    // 4. Porcentajes de mensajes
    const senderPercent = stats.total > 0 ? Math.round((stats.senderTotal / stats.total) * 100) : 0;
    const receiverPercent = stats.total > 0 ? Math.round((stats.receiverTotal / stats.total) * 100) : 0;

    // 5. Totales de multimedia por usuario
    const senderMediaTotal = Object.values(stats.senderMedia).reduce((a, b) => a + b, 0);
    const receiverMediaTotal = Object.values(stats.receiverMedia).reduce((a, b) => a + b, 0);

    // 6. ¡NUEVO! Porcentajes de Sentimiento
    const totalSent = stats.sentiment.total.positive + stats.sentiment.total.negative + stats.sentiment.total.neutral;
    const sentPositivePercent = totalSent > 0 ? Math.round((stats.sentiment.total.positive / totalSent) * 100) : 0;
    const sentNegativePercent = totalSent > 0 ? Math.round((stats.sentiment.total.negative / totalSent) * 100) : 0;
    const sentNeutralPercent = 100 - sentPositivePercent - sentNegativePercent;


    return `
        <div class="min-h-screen bg-gray-100">
            ${renderHeader(`Stats: ${selectedSender} ↔ ${selectedReceiver}`, 'stats')}

            <div class="max-w-7xl mx-auto p-4 pb-8 printable-area">
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                    <div class="bg-white rounded-xl shadow-lg p-5">
                        <p class="text-gray-500 text-sm">Total Mensajes</p>
                        <p class="text-3xl font-bold text-gray-900">${stats.total}</p>
                    </div>
                    <div class="bg-white rounded-xl shadow-lg p-5">
                        <p class="text-gray-500 text-sm">Días de chat</p>
                        <p class="text-3xl font-bold text-gray-900">${stats.totalDays}</p>
                    </div>
                    <div class="bg-white rounded-xl shadow-lg p-5">
                        <p class="text-gray-500 text-sm">Promedio/día</p>
                        <p class="text-3xl font-bold text-gray-900">${stats.avgPerDay}</p>
                    </div>
                    <div class="bg-white rounded-xl shadow-lg p-5">
                        <p class="text-gray-500 text-sm">Total Links</p>
                        <p class="text-3xl font-bold text-gray-900">${stats.totalLinks}</p>
                    </div>
                    <div class="bg-white rounded-xl shadow-lg p-5">
                        <p class="text-gray-500 text-sm">Primer mensaje</p>
                        <p class="text-xl font-bold text-gray-900">${firstMessageDate}</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div class="bg-white rounded-xl shadow-lg p-5">
                        <p class="text-gray-500 text-sm">Inicia Conversación</p>
                        <p class="text-xl font-bold text-gray-900 truncate" title="${conversationStarterInfo.name}">${conversationStarterInfo.name}</p>
                        <p class="text-sm text-gray-600">${conversationStarterInfo.percent}% de las veces</p>
                    </div>
                    <div class="bg-white rounded-xl shadow-lg p-5">
                        <p class="text-gray-500 text-sm">El "Insistente"</p>
                        <p class="text-xl font-bold text-gray-900 truncate" title="${longestTextStreak.name}">${longestTextStreak.name}</p>
                        <p class="text-sm text-gray-600">${longestTextStreak.count} mensajes seguidos</p>
                    </div>
                    <div class="bg-white rounded-xl shadow-lg p-5">
                        <p class="text-gray-500 text-sm">Silencio más largo</p>
                        <p class="text-2xl font-bold text-gray-900">${stats.longestSilence}</p>
                        <p class="text-sm text-gray-600">(Ghosting)</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Actividad de ${selectedSender}</h3>
                        <div class="w-full bg-gray-200 rounded-full h-4 mb-2">
                            <div class="bg-emerald-500 h-4 rounded-full" style="width: ${senderPercent}%"></div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-gray-500 text-sm">Mensajes</p>
                                <p class="text-xl font-bold">${stats.senderTotal}</p>
                            </div>
                            <div>
                                <p class="text-gray-500 text-sm">Largo Promedio</p>
                                <p class="text-xl font-bold">${stats.senderAvgLength} <span class="text-sm font-normal">car.</span></p>
                            </div>
                            <div>
                                <p class="text-gray-500 text-sm">T. Resp. Promedio</p>
                                <p class="text-xl font-bold">${stats.avgSenderResponse}</p>
                            </div>
                            <div>
                                <p class="text-gray-500 text-sm">Multimedia</p>
                                <p class="text-xl font-bold">${senderMediaTotal}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Actividad de ${selectedReceiver}</h3>
                        <div class="w-full bg-gray-200 rounded-full h-4 mb-2">
                            <div class="bg-blue-500 h-4 rounded-full" style="width: ${receiverPercent}%"></div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-gray-500 text-sm">Mensajes</p>
                                <p class="text-xl font-bold">${stats.receiverTotal}</p>
                            </div>
                            <div>
                                <p class="text-gray-500 text-sm">Largo Promedio</p>
                                <p class="text-xl font-bold">${stats.receiverAvgLength} <span class="text-sm font-normal">car.</span></p>
                            </div>
                            <div>
                                <p class="text-gray-500 text-sm">T. Resp. Promedio</p>
                                <p class="text-xl font-bold">${stats.avgReceiverResponse}</p>
                            </div>
                            <div>
                                <p class="text-gray-500 text-sm">Multimedia</p>
                                <p class="text-xl font-bold">${receiverMediaTotal}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">⏰ Actividad por Hora</h3>
                        <div class="relative h-80">
                            <canvas id="hourChart"></canvas>
                        </div>
                    </div>
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">📅 Actividad Diaria (Últimos 60 días)</h3>
                         <div class="relative h-80">
                            <canvas id="dayChart"></canvas>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">🔥 Mapa de Calor de Actividad</h3>
                        <p class="text-sm text-gray-500 mb-2">¿Cuándo está más activo el chat? (Dom-Sáb)</p>
                        <div class="relative h-80">
                            <canvas id="heatmapChart"></canvas>
                        </div>
                    </div>
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">☁️ Nube de Palabras (Top 50)</h3>
                        <div id="wordCloudContainer" class="relative h-80 w-full">
                            </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Vibras del Chat (Análisis de Sentimiento)</h3>
                        <p class="text-sm text-gray-500 mb-3">Estimación de la positividad/negatividad de los mensajes.</p>
                        <div class="w-full flex rounded-full h-6 overflow-hidden mb-4">
                            <div class="bg-green-500" style="width: ${sentPositivePercent}%" title="Positivo"></div>
                            <div class="bg-gray-400" style="width: ${sentNeutralPercent}%" title="Neutral"></div>
                            <div class="bg-red-500" style="width: ${sentNegativePercent}%" title="Negativo"></div>
                        </div>
                        <div class="flex justify-between text-sm mb-4">
                            <span class="font-semibold text-green-600">Positivo (${sentPositivePercent}%)</span>
                            <span class="font-semibold text-gray-600">Neutral (${sentNeutralPercent}%)</span>
                            <span class="font-semibold text-red-600">Negativo (${sentNegativePercent}%)</span>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 text-center">
                             <div>
                                <p class="font-semibold mb-1">${selectedSender}</p>
                                <p class="text-sm">😊 ${stats.sentiment.sender.positive} <span class="mx-1">|</span> 😐 ${stats.sentiment.sender.neutral} <span class="mx-1">|</span> 😠 ${stats.sentiment.sender.negative}</p>
                             </div>
                             <div>
                                <p class="font-semibold mb-1">${selectedReceiver}</p>
                                <p class="text-sm">😊 ${stats.sentiment.receiver.positive} <span class="mx-1">|</span> 😐 ${stats.sentiment.receiver.neutral} <span class="mx-1">|</span> 😠 ${stats.sentiment.receiver.negative}</p>
                             </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">🔗 Top 5 Dominios Compartidos</h3>
                        <div class="space-y-3">
                            ${stats.topDomains.length > 0 ? stats.topDomains.map(([domain, count]) => `
                                <div>
                                    <div class="flex justify-between mb-1">
                                        <span class="font-medium text-blue-600 truncate" title="${domain}">${domain}</span>
                                        <span class="text-gray-600">${count}</span>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full h-2">
                                        <div class="bg-blue-500 h-2 rounded-full" style="width: ${(count / stats.topDomains[0][1]) * 100}%"></div>
                                    </div>
                                </div>
                            `).join('') : '<p class="text-gray-500 text-center mt-4">No se compartieron links en este chat.</p>'}
                        </div>
                    </div>
                </div>


                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">📝 Palabras Más Usadas (Top 10)</h3>
                        <div class="space-y-3">
                            ${stats.topWords.map(([word, count]) => `
                                <div>
                                    <div class="flex justify-between mb-1">
                                        <span class="font-medium text-gray-700 capitalize">${word}</span>
                                        <span class="text-gray-600">${count}</span>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full h-2">
                                        <div class="bg-purple-500 h-2 rounded-full" style="width: ${stats.topWords.length > 0 ? (count / stats.topWords[0][1]) * 100 : 0}%"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">😊 Emojis Más Usados</h3>
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            ${stats.topEmojis.map(([emoji, count]) => `
                                <div class="bg-gray-50 rounded-lg p-4 text-center">
                                    <div class="text-4xl mb-2">${emoji}</div>
                                    <div class="text-2xl font-bold text-gray-900">${count}</div>
                                    <div class="text-sm text-gray-500">veces</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="mt-6 bg-white rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">🖼️ Resumen de Multimedia</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <p class="text-4xl">🖼️</p>
                            <p class="text-2xl font-bold">${stats.totalImages}</p>
                            <p class="text-gray-500">Imágenes</p>
                        </div>
                        <div>
                            <p class="text-4xl">🎬</p>
                            <p class="text-2xl font-bold">${stats.totalVideos}</p>
                            <p class="text-gray-500">Videos</p>
                        </div>
                        <div>
                            <p class="text-4xl">🎭</p>
                            <p class="text-2xl font-bold">${stats.totalStickers}</p>
                            <p class="text-gray-500">Stickers</p>
                        </div>
                         <div>
                            <p class="text-4xl">🎧</p>
                            <p class="text-2xl font-bold">${stats.totalAudios}</p>
                            <p class="text-gray-500">Audios</p>
                        </div>
                    </div>
                    <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p class="font-semibold text-center mb-2">${selectedSender}</p>
                            <ul class="space-y-2 text-sm">
                                <li class="flex justify-between"><span>Imágenes:</span> <span class="font-medium">${stats.senderMedia.image}</span></li>
                                <li class="flex justify-between"><span>Videos:</span> <span class="font-medium">${stats.senderMedia.video}</span></li>
                                <li class="flex justify-between"><span>Stickers:</span> <span class="font-medium">${stats.senderMedia.sticker}</span></li>
                                <li class="flex justify-between"><span>Audios:</span> <span class="font-medium">${stats.senderMedia.audio}</span></li>
                            </ul>
                        </div>
                        <div>
                            <p class="font-semibold text-center mb-2">${selectedReceiver}</p>
                             <ul class="space-y-2 text-sm">
                                <li class="flex justify-between"><span>Imágenes:</span> <span class="font-medium">${stats.receiverMedia.image}</span></li>
                                <li class="flex justify-between"><span>Videos:</span> <span class="font-medium">${stats.receiverMedia.video}</span></li>
                                <li class="flex justify-between"><span>Stickers:</span> <span class="font-medium">${stats.receiverMedia.sticker}</span></li>
                                <li class="flex justify-between"><span>Audios:</span> <span class="font-medium">${stats.receiverMedia.audio}</span></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renderiza el HTML para la vista de exportación.
 * @param {string} receiverName - El nombre del destinatario.
 * @param {number} messageCount - El conteo total de mensajes.
 * @returns {string} HTML de la vista.
 */
export function renderExportView(receiverName, messageCount) {
    return `
        <div class="min-h-screen bg-gray-100">
            ${renderHeader(`Exportar Chat`, 'export')}
            <div class="max-w-3xl mx-auto p-4 printable-area">
                <div class="bg-white rounded-xl shadow-lg p-8">
                    <h2 class="text-2xl font-semibold text-gray-900 mb-6">Exportar y Guardar Análisis</h2>
                    
                    <div class="space-y-6">
                        <div class="bg-emerald-50 p-6 rounded-lg border border-emerald-200">
                            <h3 class="text-lg font-semibold text-emerald-800 mb-2">💾 Guardar Análisis en este Navegador</h3>
                            <p class="text-sm text-emerald-700 mb-4">
                                Guarda un resumen de este análisis (${messageCount} mensajes con ${receiverName}) para cargarlo al instante la próxima vez que abras la app, sin necesidad de subir el .zip.
                            </p>
                            <button id="save-analysis-btn" class="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors">
                                Guardar Análisis
                            </button>
                        </div>
                        
                        <div class="bg-gray-50 p-6 rounded-lg border border-gray-200">
                            <h3 class="text-lg font-semibold text-gray-800 mb-2">📊 Exportar Estadísticas (JSON)</h3>
                            <p class="text-sm text-gray-700 mb-4">
                                Descarga todos los datos de las estadísticas en un archivo JSON para usar en otras herramientas (Excel, PowerBI, etc.)
                            </p>
                            <button id="export-stats-btn" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                                Descargar .json
                            </button>
                        </div>

                        <div class="bg-gray-50 p-6 rounded-lg border border-gray-200">
                            <h3 class="text-lg font-semibold text-gray-800 mb-2">📄 Exportar Chat (CSV)</h3>
                            <p class="text-sm text-gray-700 mb-4">
                                Descarga la conversación completa como un archivo CSV, compatible con Excel y Google Sheets.
                            </p>
                            <button id="export-chat-btn" class="w-full bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
                                Descargar .csv
                            </button>
                        </div>

                        <div class="bg-gray-50 p-6 rounded-lg border border-gray-200">
                            <h3 class="text-lg font-semibold text-gray-800 mb-2">🖨️ Imprimir Reporte (PDF)</h3>
                            <p class="text-sm text-gray-700 mb-4">
                                Abre la vista de impresión para guardar un resumen de las estadísticas como un archivo PDF.
                            </p>
                            <button id="print-report-btn" class="w-full bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
                                Imprimir/Guardar PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
