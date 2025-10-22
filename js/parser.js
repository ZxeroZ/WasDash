/**
 * Parsea el texto de un chat de WhatsApp.
 * @param {string} text - El contenido del archivo _chat.txt.
 * @returns {object} - Un objeto con { messages, participants }.
 */
export function parseWhatsAppChat(text) {
    const lines = text.split('\n');
    const messages = [];
    const participants = new Set();
    
    // Regex mejorado para distintos formatos de fecha/hora
    // Soporta: [1/1/25, 10:30] y 1/1/25 10:30 - (con o sin coma, con o sin corchetes)
    const messageRegex = /^\[?(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]?\s*-\s*([^:]+):\s*(.*)$/i;
    
    let currentMessage = null;
    
    lines.forEach(line => {
        const match = line.match(messageRegex);
        
        if (match) {
            // Si hay un mensaje actual, guárdalo antes de empezar el nuevo
            if (currentMessage) {
                messages.push(currentMessage);
            }
            
            const [, date, time, sender, content] = match;
            
            // Parsea la fecha y hora para un timestamp real
            // Asume formato D/M/A o M/D/A (intenta ser robusto)
            const dateParts = date.split('/');
            const timeParts = time.match(/(\d{1,2}):(\d{2})/);
            
            let day, month, year;
            
            // Intenta detectar formato DD/MM vs MM/DD (asumiendo que >12 es mes)
            if (parseInt(dateParts[0]) > 12) { // DD/MM/AA
                day = parseInt(dateParts[0]);
                month = parseInt(dateParts[1]) - 1; // Meses en JS son 0-11
            } else if (parseInt(dateParts[1]) > 12) { // MM/DD/AA
                day = parseInt(dateParts[1]);
                month = parseInt(dateParts[0]) - 1;
            } else { 
                // Ambiguo, asume DD/MM (más común fuera de USA)
                day = parseInt(dateParts[0]);
                month = parseInt(dateParts[1]) - 1;
            }
            
            const yearShort = parseInt(dateParts[2]);
            year = yearShort < 100 ? 2000 + yearShort : yearShort;

            const hour = parseInt(timeParts[1]);
            const minute = parseInt(timeParts[2]);

            const timestamp = new Date(year, month, day, hour, minute);

            const trimmedSender = sender.trim();
            participants.add(trimmedSender);
            
            const msg = {
                date,
                time,
                timestamp,
                sender: trimmedSender,
                content: content.trim(),
                isMultimedia: false,
                mediaType: null,
                mediaFileName: null,
                mediaBlobUrl: null,
                links: []
            };

            // --- ¡CORRECCIÓN IMPORTANTE! ---
            // Detectar multimedia en formato: "nombre.ext (archivo adjunto)"
            // El caracter '‎' (U+200E) es un caracter invisible de "left-to-right" que WhatsApp a veces añade.
            const mediaMatch = msg.content.match(/^(?:\u200E)?(.*?)\s+\(archivo adjunto\)$/);
            
            if (mediaMatch) {
                msg.mediaFileName = mediaMatch[1].trim(); // Limpia espacios en blanco
                
                msg.isMultimedia = true;
                msg.content = `[Adjunto: ${msg.mediaFileName}]`; // Un texto limpio para el contenido
                
                // Clasificar tipo de media por extensión
                if (msg.mediaFileName.endsWith('.jpg') || msg.mediaFileName.endsWith('.png') || msg.mediaFileName.endsWith('.jpeg')) {
                    msg.mediaType = 'image';
                } else if (msg.mediaFileName.endsWith('.webp')) {
                    msg.mediaType = 'sticker';
                } else if (msg.mediaFileName.endsWith('.mp4') || msg.mediaFileName.endsWith('.mov')) {
                    msg.mediaType = 'video';
                } else if (msg.mediaFileName.endsWith('.opus') || msg.mediaFileName.endsWith('.m4a') || msg.mediaFileName.endsWith('.mp3')) {
                    msg.mediaType = 'audio';
                } else {
                    msg.mediaType = 'file';
                }
            
            // Fallback para el formato anterior <adjunto: ...> por si acaso
            } else if (msg.content.match(/<adjunto: (.*?)>/)) {
                const legacyMatch = msg.content.match(/<adjunto: (.*?)>/);
                msg.mediaFileName = legacyMatch[1].trim();
                msg.isMultimedia = true;
                msg.content = `[Adjunto: ${msg.mediaFileName}]`;
                // (Misma lógica de clasificación)
                if (msg.mediaFileName.endsWith('.jpg') || msg.mediaFileName.endsWith('.png') || msg.mediaFileName.endsWith('.jpeg')) {
                    msg.mediaType = 'image';
                } else if (msg.mediaFileName.endsWith('.webp')) {
                    msg.mediaType = 'sticker';
                } else if (msg.mediaFileName.endsWith('.mp4') || msg.mediaFileName.endsWith('.mov')) {
                    msg.mediaType = 'video';
                } else if (msg.mediaFileName.endsWith('.opus') || msg.mediaFileName.endsWith('.m4a') || msg.mediaFileName.endsWith('.mp3')) {
                    msg.mediaType = 'audio';
                } else {
                    msg.mediaType = 'file';
                }
                
            } else if (msg.content.includes('(archivo omitido)')) {
                msg.isMultimedia = true;
                msg.mediaType = 'omitted';
                msg.content = '[Multimedia omitido]';
            }
            // --- FIN DE LA CORRECCIÓN ---


            // Detectar links
            const linkRegex = /https?:\/\/[^\s]+/g;
            const linksFound = msg.content.match(linkRegex);
            if (linksFound) {
                msg.links = linksFound;
            }

            currentMessage = msg;

        } else if (currentMessage && line.trim() && !line.includes('cifrados de extremo a extremo')) {
            // Esta línea es una continuación del mensaje anterior
            currentMessage.content += '\n' + line.trim();
            
            // Re-chequear links por si estaban en la segunda línea
            const linkRegex = /https?:\/\/[^\s]+/g;
            const linksFound = currentMessage.content.match(linkRegex);
            if (linksFound) {
                // Evita duplicados
                linksFound.forEach(link => {
                    if (!currentMessage.links.includes(link)) {
                        currentMessage.links.push(link);
                    }
                });
            }
        }
    });
    
    // Añadir el último mensaje
    if (currentMessage) {
        messages.push(currentMessage);
    }
    
    return {
        messages: messages.filter(m => m.sender && m.content), // Filtra mensajes de sistema
        participants: Array.from(participants)
    };
}

