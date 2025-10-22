/**
 * Calcula todas las estadísticas de un chat.
 * @param {Array} messages - El array de mensajes de parseWhatsAppChat.
 * @param {string} selectedSender - El nombre del remitente.
 * @param {string} selectedReceiver - El nombre del destinatario.
 * @returns {object} - Un objeto con todas las estadísticas.
 */
export function calculateStatistics(messages, selectedSender, selectedReceiver) {
    if (!messages || messages.length === 0 || !selectedSender || !selectedReceiver) {
        return null;
    }

    const senderMessages = messages.filter(m => m.sender === selectedSender);
    const receiverMessages = messages.filter(m => m.sender === selectedReceiver);

    // --- CÁLCULOS BÁSICOS (Total, Promedios) ---
    const dayCounts = {};
    const hourCounts = Array(24).fill(0);
    let totalLinks = 0;
    
    // Matriz para el heatmap [día_semana][hora]
    let dayActivityMatrix = Array(7).fill(0).map(() => Array(24).fill(0));

    messages.forEach(msg => {
        const hour = msg.timestamp.getHours();
        const dayOfWeek = msg.timestamp.getDay(); // 0 (Dom) - 6 (Sáb)
        
        hourCounts[hour]++;
        dayActivityMatrix[dayOfWeek][hour]++;
        
        const day = msg.date; 
        dayCounts[day] = (dayCounts[day] || 0) + 1;

        totalLinks += msg.links.length;
    });

    const senderAvgLength = senderMessages.reduce((acc, m) => acc + m.content.length, 0) / (senderMessages.length || 1);
    const receiverAvgLength = receiverMessages.reduce((acc, m) => acc + m.content.length, 0) / (receiverMessages.length || 1);
    const totalDays = Object.keys(dayCounts).length;
    
    // --- CÁLCULOS DE PALABRAS Y EMOJIS (Para Top 10 y Nube de Palabras) ---
    const wordFreq = {};
    const stopWords = new Set(['de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'se', 'del', 'las', 'un', 'por', 'con', 'no', 'una', 'su', 'para', 'es', 'al', 'lo', 'como', 'más', 'o', 'pero', 'sus', 'le', 'ya', 'fue', 'este', 'ha', 'si', 'porque', 'esta', 'son', 'entre', 'está', 'cuando', 'muy', 'sin', 'sobre', 'ser', 'tiene', 'también', 'me', 'hasta', 'hay', 'donde', 'han', 'quien', 'están', 'estado', 'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'fueron', 'ese', 'eso', 'había', 'ante', 'ellos', 'e', 'esto', 'mí', 'antes', 'algunos', 'qué', 'unos', 'yo', 'otro', 'otras', 'otra', 'él', 'tanto', 'esa', 'estos', 'mucho', 'quienes', 'nada', 'muchos', 'cual', 'sea', 'poco', 'ella', 'estar', 'haber', 'estas', 'estaba', 'estamos', 'algunas', 'algo', 'nosotros', 'te', 'tu', 'mi', 'jaja', 'jajaja']);
    
    messages.forEach(msg => {
        if (!msg.isMultimedia) {
            const words = msg.content.toLowerCase().match(/[a-záéíóúñü]+/g) || [];
            words.forEach(word => {
                if (word.length > 2 && !stopWords.has(word)) {
                    wordFreq[word] = (wordFreq[word] || 0) + 1;
                }
            });
        }
    });

    const topWords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
        
    const wordCloudData = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .map(([text, value]) => ({ text, value }));

    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu;
    const emojiCounts = {};
    messages.forEach(msg => {
        const emojis = msg.content.match(emojiRegex) || [];
        emojis.forEach(emoji => {
            emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
        });
    });

    const topEmojis = Object.entries(emojiCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    // --- CÁLCULOS DE MULTIMEDIA (¡NUEVO!) ---
    const senderMedia = { image: 0, audio: 0, video: 0, sticker: 0, file: 0 };
    const receiverMedia = { image: 0, audio: 0, video: 0, sticker: 0, file: 0 };

    senderMessages.forEach(msg => {
        if (msg.mediaType) senderMedia[msg.mediaType] = (senderMedia[msg.mediaType] || 0) + 1;
    });
    receiverMessages.forEach(msg => {
        if (msg.mediaType) receiverMedia[msg.mediaType] = (receiverMedia[msg.mediaType] || 0) + 1;
    });
    
    const totalImages = senderMedia.image + receiverMedia.image;
    const totalAudios = senderMedia.audio + receiverMedia.audio;
    const totalVideos = senderMedia.video + receiverMedia.video;
    const totalStickers = senderMedia.sticker + receiverMedia.sticker;
    const totalFiles = senderMedia.file + receiverMedia.file;
    const totalMultimedia = totalImages + totalAudios + totalVideos + totalStickers + totalFiles;

    // --- CÁLCULOS DE INTERACCIÓN (¡NUEVO!) ---
    let senderResponseTimes = [];
    let receiverResponseTimes = [];
    let lastSenderTime = null;
    let lastReceiverTime = null;

    let conversationStarters = { [selectedSender]: 0, [selectedReceiver]: 0 };
    let lastMessageTime = null;
    const CONVERSATION_GAP_HOURS = 8;
    
    let currentStreakSender = null;
    let currentStreakCount = 0;
    let longestSenderStreak = 0;
    let longestReceiverStreak = 0;

    // --- ¡NUEVO! MÉTRICAS DE RELACIÓN Y SENTIMIENTO ---
    let longestSilenceMs = 0;
    const domainCounts = {};
    
    // Listas *muy* básicas de palabras para sentimiento.
    const positiveWords = new Set(['gracias', 'bien', 'bueno', 'genial', 'excelente', 'gusta', 'encanta', 'amor', 'feliz', 'jaja', 'jajaja', 'xd', 'jiji', 'jeje', '👍', '❤️', '😂', '😊', '😍', '🎉']);
    const negativeWords = new Set(['mal', 'triste', 'odio', 'terrible', 'horrible', 'asco', 'pena', ':(', '😭', '😠', '😡', '👎']);
    
    let senderSentiment = { positive: 0, negative: 0, neutral: 0 };
    let receiverSentiment = { positive: 0, negative: 0, neutral: 0 };
    let totalSentiment = { positive: 0, negative: 0, neutral: 0 };
    // --- FIN DE NUEVAS VARIABLES ---

    messages.forEach(msg => {
        // 1. Quién inicia y "Ghosting" (Silencio más largo)
        if (lastMessageTime === null) {
            conversationStarters[msg.sender]++; // El primero inicia la primera
        } else {
            const diffMs = msg.timestamp.getTime() - lastMessageTime.getTime();
            
            // "Ghosting"
            if (diffMs > longestSilenceMs) {
                longestSilenceMs = diffMs;
            }

            // "Quién inicia"
            const diffHours = diffMs / (1000 * 60 * 60);
            if (diffHours > CONVERSATION_GAP_HOURS) {
                conversationStarters[msg.sender]++;
            }
        }
        lastMessageTime = msg.timestamp;

        // 2. Tiempos de respuesta
        if (msg.sender === selectedSender) {
            if (lastReceiverTime) {
                const diffMs = msg.timestamp.getTime() - lastReceiverTime.getTime();
                senderResponseTimes.push(diffMs);
                lastReceiverTime = null; // Resetea
            }
            lastSenderTime = msg.timestamp;
        } else if (msg.sender === selectedReceiver) {
            if (lastSenderTime) {
                const diffMs = msg.timestamp.getTime() - lastSenderTime.getTime();
                receiverResponseTimes.push(diffMs);
                lastSenderTime = null; // Resetea
            }
            lastReceiverTime = msg.timestamp;
        }
        
        // 3. Rachas (Insistente)
        if (msg.sender === currentStreakSender) {
            currentStreakCount++;
        } else {
            currentStreakSender = msg.sender;
            currentStreakCount = 1;
        }
        
        if (currentStreakSender === selectedSender) {
            if (currentStreakCount > longestSenderStreak) longestSenderStreak = currentStreakCount;
        } else {
            if (currentStreakCount > longestReceiverStreak) longestReceiverStreak = currentStreakCount;
        }

        // 4. Top Links
        msg.links.forEach(link => {
            try {
                // Extrae el "hostname" (ej: www.youtube.com)
                const domain = new URL(link).hostname.replace(/^www\./, ''); // Quita 'www.'
                domainCounts[domain] = (domainCounts[domain] || 0) + 1;
            } catch (e) { 
                // Ignora si no es una URL válida
            }
        });

        // 5. Sentimiento
        if (!msg.isMultimedia) {
            const contentLower = msg.content.toLowerCase();
            let sentiment = 'neutral';

            // Revisa si alguna palabra positiva está en el mensaje
            for (const word of positiveWords) {
                if (contentLower.includes(word)) {
                    sentiment = 'positive';
                    break;
                }
            }
            
            // Si no es positivo, revisa si es negativo
            if (sentiment === 'neutral') {
                for (const word of negativeWords) {
                    if (contentLower.includes(word)) {
                        sentiment = 'negative';
                        break;
                    }
                }
            }
            
            // Asigna el puntaje
            if (msg.sender === selectedSender) {
                senderSentiment[sentiment]++;
            } else if (msg.sender === selectedReceiver) {
                receiverSentiment[sentiment]++;
            }
            totalSentiment[sentiment]++;
        }
    });

    const avgSenderResponse = senderResponseTimes.length ? (senderResponseTimes.reduce((a, b) => a + b, 0) / senderResponseTimes.length) : 0;
    const avgReceiverResponse = receiverResponseTimes.length ? (receiverResponseTimes.reduce((a, b) => a + b, 0) / receiverResponseTimes.length) : 0;
    
    // Función de utilidad para formatear tiempo (usada para T. Respuesta y "Ghosting")
    const formatTime = (ms) => {
        if (ms === 0) return 'N/A';
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds} seg`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ${minutes % 60}m`;
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h`;
    };
    
    const conversationStarter = conversationStarters[selectedSender] >= conversationStarters[selectedReceiver] ? selectedSender : selectedReceiver;
    
    // ¡NUEVO! Datos para "Top Domains"
    const topDomains = Object.entries(domainCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);


    // --- OBJETO DE RETORNO ---
    return {
        // Nombres
        senderName: selectedSender,
        receiverName: selectedReceiver,
        
        // Conteo General
        total: messages.length,
        senderTotal: senderMessages.length,
        receiverTotal: receiverMessages.length,
        totalDays,
        avgPerDay: Math.round(messages.length / (totalDays || 1)),
        totalLinks,
        messageCount: messages.length, // Para el header

        // Conteo Multimedia
        totalMultimedia,
        totalImages,
        totalAudios,
        totalVideos,
        totalStickers,
        totalFiles,
        senderMedia,
        receiverMedia,

        // Promedios
        senderAvgLength: Math.round(senderAvgLength),
        receiverAvgLength: Math.round(receiverAvgLength),
        
        // Interacción y Métricas de Relación
        avgSenderResponse: formatTime(avgSenderResponse),
        avgReceiverResponse: formatTime(avgReceiverResponse),
        conversationStarters,
        conversationStarter,
        longestSenderStreak,
        longestReceiverStreak,
        longestSilence: formatTime(longestSilenceMs), // ¡NUEVO!
        
        // Datos para Gráficos
        topWords,
        wordCloudData,
        topEmojis,
        hourCounts,
        dayCounts: Object.entries(dayCounts).sort((a, b) => new Date(a[0].split('/').reverse().join('-')) - new Date(b[0].split('/').reverse().join('-'))),
        dayActivityMatrix,
        topDomains, // ¡NUEVO!

        // Sentimiento
        sentiment: { // ¡NUEVO!
            total: totalSentiment,
            sender: senderSentiment,
            receiver: receiverSentiment
        }
    };
}
