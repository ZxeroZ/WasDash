// --- IMPORTACIONES DE MÓDULOS ---
import { parseWhatsAppChat } from './parser.js';
import { calculateStatistics } from './stats.js';
import { renderCharts } from './charts.js';
import {
    renderLoadingView,
    renderUploadView,
    renderReadOnlyChatView,
    renderSelectView,
    renderChatView,
    renderStatsView,
    renderExportView
} from './templates.js';

// --- ESTADO DE LA APLICACIÓN ---
let chatData = null; // Para el chat crudo
let currentStats = null; // Para las stats calculadas
let selectedSender = '';
let selectedReceiver = '';
let currentView = 'upload';
let savedAnalyses = []; // Para la función de guardar
let currentChatTitle = "Chat";
let charts = {}; // Para guardar las instancias de los gráficos
let mediaMap = new Map(); // Para guardar Blobs de media

// --- REFERENCIA AL DOM ---
const app = document.getElementById('app');

// --- FUNCIONES PRINCIPALES DE CONTROL ---

/**
 * Cambia la vista actual y vuelve a renderizar la app.
 * @param {string} view - El nombre de la vista a mostrar.
 */
function setView(view) {
    currentView = view;
    render();
}

/**
 * ¡NUEVO! Inicia el flujo de análisis.
 */
function startAnalysis() {
    // BUG FIX: Siempre vamos a la vista de selección si hay datos de chat.
    // La vista 'select' puede manejar cualquier número de participantes.
    if (chatData && chatData.participants) {
         console.log(`Iniciando análisis con ${chatData.participants.length} participantes...`);
         setView('select');
    } else {
        console.error("Se intentó analizar, pero no hay datos de chat o participantes.");
        alert("Error: No se pudieron encontrar participantes en este chat.");
    }
}


/**
 * Reinicia el estado de la aplicación.
 * @param {boolean} fullReset - Si es true, vuelve al inicio. Si es false, solo reinicia el chat.
 */
function resetApp(fullReset = false) {
    chatData = null;
    currentStats = null;
    selectedSender = '';
    selectedReceiver = '';
    currentChatTitle = "Chat";
    
    // Limpiar blobs de memoria para evitar memory leaks
    mediaMap.forEach(url => URL.revokeObjectURL(url));
    mediaMap.clear();
    
    Object.values(charts).forEach(chart => chart.destroy());
    charts = {};
    
    // Restaura los listeners globales por si se sobrescribieron
    window.setView = setView;
    window.startAnalysis = startAnalysis;
    window.resetApp = resetApp;
    window.loadSavedAnalysis = loadSavedAnalysis;
    window.clearSavedAnalyses = clearSavedAnalyses;

    if (fullReset) {
        setView('upload');
    }
}

/**
 * Carga los análisis guardados desde localStorage.
 */
function loadSavedAnalysesFromStorage() {
    const saved = localStorage.getItem('savedAnalyses');
    if (saved) {
        // --- ¡CÓDIGO ACTUALIZADO CON TRY...CATCH! ---
        try {
            savedAnalyses = JSON.parse(saved);
        } catch (e) {
            console.error("Error al parsear análisis guardados (probablemente de una versión vieja), reseteando:", e);
            savedAnalyses = [];
            localStorage.removeItem('savedAnalyses'); // Limpia los datos corruptos
        }
        // --- FIN DE LA ACTUALIZACIÓN ---
    } else {
        savedAnalyses = [];
    }
}

/**
 * Carga un análisis específico desde los guardados.
 * @param {number} index - El índice del análisis a cargar.
 */
function loadSavedAnalysis(index) {
    const analysis = savedAnalyses[index];
    if (analysis) {
        resetApp(false); 
        
        currentStats = analysis;
        selectedSender = analysis.senderName;
        selectedReceiver = analysis.receiverName;
        currentChatTitle = `Chat con ${analysis.receiverName}`;
        
        // Deshabilitamos la vista de 'chat' (analizado) y 'lectura'
        window.setView = (view) => {
            if (view === 'chat' || view === 'readOnlyChat') {
                alert("La vista de chat solo está disponible si subes el archivo .zip (no para análisis guardados).");
                return;
            }
            currentView = view;
            render();
        }
        
        setView('stats');
    }
}

/**
 * Limpia todos los análisis guardados.
 */
function clearSavedAnalyses() {
    if (confirm("¿Estás seguro de que quieres borrar todos los análisis guardados?")) {
        localStorage.removeItem('savedAnalyses');
        savedAnalyses = [];
        render(); // Vuelve a renderizar la vista de 'upload'
    }
}

/**
 * Renderiza la vista actual basada en el estado de la aplicación.
 */
function render() {
    // Asegura que las funciones globales estén siempre disponibles
    window.setView = setView;
    window.startAnalysis = startAnalysis;
    window.resetApp = resetApp;
    window.loadSavedAnalysis = loadSavedAnalysis;
    window.clearSavedAnalyses = clearSavedAnalyses;

    switch (currentView) {
        case 'loading':
            app.innerHTML = renderLoadingView();
            break;
            
        case 'upload':
            app.innerHTML = renderUploadView(savedAnalyses);
            addUploadListeners();
            break;

        case 'readOnlyChat':
            app.innerHTML = renderReadOnlyChatView(chatData.messages, currentChatTitle);
            addReadOnlyChatListeners();
            break;
            
        case 'select':
            app.innerHTML = renderSelectView(chatData.participants);
            addSelectListeners();
            break;
            
        case 'chat':
            app.innerHTML = renderChatView(
                chatData.messages,
                selectedSender,
                selectedReceiver
            );
            addAnalyzedChatListeners();
            break;
            
        case 'stats':
            if (!currentStats) {
                // Pasamos los mensajes para las nuevas stats de media
                currentStats = calculateStatistics(chatData.messages, selectedSender, selectedReceiver);
            }
            app.innerHTML = renderStatsView(
                currentStats,
                selectedSender,
                selectedReceiver
            );
            // Retraso para asegurar que el DOM esté listo
            setTimeout(() => {
                charts = renderCharts(currentStats, charts);
            }, 100);
            break;

        case 'export':
            app.innerHTML = renderExportView(
                selectedReceiver,
                currentStats.messageCount
            );
            addExportListeners();
            break;
    }
}

// --- FUNCIONES DE EVENT LISTENERS ---

function addUploadListeners() {
    const fileInput = document.getElementById('file-upload');
    const dropzone = document.getElementById('dropzone');

    const handleFile = (file) => {
        if (file && (file.type === 'application/zip' || file.name.endsWith('.zip'))) {
            setView('loading');
            setTimeout(() => {
                processZipFile(file);
            }, 50);

        } else {
            alert("Por favor, selecciona un archivo .zip exportado de WhatsApp.");
        }
    };

    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    dropzone.addEventListener('dragover', (e) => e.preventDefault());
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        handleFile(e.dataTransfer.files[0]);
    });
}


/**
 * Procesa el archivo .zip subido.
 * @param {File} file - El archivo .zip subido
 */
async function processZipFile(file) {
    console.log("Procesando archivo:", file.name);
    try {
        resetApp(false); // Limpia estado anterior y blobs

        const zip = await JSZip.loadAsync(file);
        
        // --- BÚSQUEDA DE .TXT MEJORADA ---
        const zipFileName = file.name; // ej: "Chat de WhatsApp con Lyn.zip"
        const expectedTxtName = zipFileName.replace(/\.zip$/i, '.txt'); // ej: "Chat de WhatsApp con Lyn.txt"
        
        let chatFile = zip.file(expectedTxtName); // Intento 1: Nombre idéntico (ej. 'MiChat.txt')
        let mediaRootPath = ''; // ¡NUEVO! Ruta base para los medios

        if (!chatFile) {
             // Intento 2: Nombre idéntico pero en un subdirectorio (ej. 'MiChat/MiChat.txt')
             const nestedFiles = zip.file(new RegExp(`^${expectedTxtName.replace('.txt', '')}/.*\.txt$`, 'i'));
             if (nestedFiles.length > 0) {
                 chatFile = nestedFiles[0];
             } else {
                 // Intento 3: _chat.txt (estándar)
                 chatFile = zip.file('_chat.txt');
             }
        }
        
        if (!chatFile) {
            // Intento 4: Fallback genérico (cualquier .txt)
            const txtFiles = zip.file(/\.txt$/i); // Busca regex / terminación .txt / case-insensitive
            if (txtFiles.length > 0) {
                chatFile = txtFiles[0];
            }
        }
        // --- FIN BÚSQUEDA .TXT ---

        if (!chatFile) {
            alert(`Error: No se encontró un archivo .txt (ni '${expectedTxtName}' ni '_chat.txt') dentro del .zip.`);
            setView('upload');
            return;
        }

        // --- ¡NUEVO! DETERMINAR RUTA RAÍZ ---
        // Si el archivo es 'MiChat/chat.txt', la raíz es 'MiChat/'
        const lastSlash = chatFile.name.lastIndexOf('/');
        if (lastSlash > -1) {
            mediaRootPath = chatFile.name.substring(0, lastSlash + 1); // Incluye el '/'
            console.log("Subdirectorio detectado:", mediaRootPath);
        }
        // --- FIN RUTA RAÍZ ---

        // 2. Leer el chat y parsearlo
        const chatText = await chatFile.async('string');
        chatData = parseWhatsAppChat(chatText);
        currentChatTitle = zipFileName.replace('.zip', '');

        // 3. Crear un set de todos los archivos multimedia mencionados
        const mediaFileNames = new Set();
        chatData.messages.forEach(msg => {
            if (msg.mediaFileName) {
                mediaFileNames.add(msg.mediaFileName);
            }
        });

        // 4. Cargar los blobs de esos archivos en paralelo
        const mediaLoadPromises = [];
        mediaFileNames.forEach(fileName => {
            
            // --- ¡LÓGICA DE BÚSQUEDA DE ARCHIVOS CORREGIDA! ---
            // Intenta encontrar el archivo en todas las rutas posibles
            const mediaFile = 
                zip.file(`${mediaRootPath}${fileName}`) || // 1. En el subdirectorio (ej. 'MiChat/mi_foto.jpg')
                zip.file(fileName) || // 2. En la raíz (ej. 'mi_foto.jpg')
                zip.file(`WhatsApp Images/${fileName}`) || // 3. Estándar de WhatsApp (Imágenes)
                zip.file(`WhatsApp Video/${fileName}`) || // 4. Estándar de WhatsApp (Video)
                zip.file(`WhatsApp Audio/${fileName}`) || // 5. Estándar de WhatsApp (Audio)
                zip.file(`WhatsApp Stickers/${fileName}`); // 6. Estándar de WhatsApp (Stickers)
            // --- FIN LÓGICA CORREGIDA ---

            if (mediaFile) {
                const promise = mediaFile.async('blob')
                    .then(blob => {
                        mediaMap.set(fileName, URL.createObjectURL(blob));
                    })
                    .catch(err => {
                        console.warn(`No se pudo cargar el archivo ${fileName}:`, err);
                    });
                mediaLoadPromises.push(promise);
            } else {
                 console.warn(`Archivo no encontrado en el .zip: ${fileName}`);
            }
        });

        // 5. Esperar a que todos los medios se carguen
        await Promise.all(mediaLoadPromises);

        // 6. Mapear los Blob URLs a los mensajes
        chatData.messages.forEach(msg => {
            if (msg.mediaFileName && mediaMap.has(msg.mediaFileName)) {
                msg.mediaBlobUrl = mediaMap.get(msg.mediaFileName);
            }
        });

        // 7. ¡Listo! Ir a la vista de lectura
        setView('readOnlyChat');

    } catch (err) {
        console.error("Error procesando el .zip:", err);
        alert("Ocurrió un error al leer el .zip. Es posible que esté corrupto.");
        setView('upload');
    }
}

// ¡NUEVO! Listeners para la vista de solo lectura
function addReadOnlyChatListeners() {
    const searchInput = document.getElementById('search-bar');
    const messageNodes = document.querySelectorAll('.message-bubble');

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        chatData.messages.forEach((msg, index) => {
            const node = messageNodes[index];
            if (node) {
                const content = msg.content.toLowerCase();
                const sender = msg.sender.toLowerCase();
                if (content.includes(searchTerm) || sender.includes(searchTerm)) {
                    node.style.display = 'block';
                } else {
                    node.style.display = 'none';
                }
            }
        });
    });
}

function addSelectListeners() {
    const senderSelect = document.getElementById('sender-select');
    const receiverSelect = document.getElementById('receiver-select');
    const continueBtn = document.getElementById('continue-btn');

    function checkContinueButton() {
        continueBtn.disabled = !senderSelect.value || !receiverSelect.value;
    }
    
    senderSelect.addEventListener('change', () => {
        selectedSender = senderSelect.value;
        const currentReceiverVal = receiverSelect.value;
        
        receiverSelect.innerHTML = '<option value="">Selecciona...</option>';
        chatData.participants.forEach(p => {
            if (p !== selectedSender) {
                receiverSelect.innerHTML += `<option value="${p}">${p}</option>`;
            }
        });
        
        // Re-selecciona el valor si ya estaba elegido
        if (chatData.participants.includes(currentReceiverVal) && currentReceiverVal !== selectedSender) {
            receiverSelect.value = currentReceiverVal;
        } else {
            selectedReceiver = ''; // Resetea si el sender ahora es el mismo
        }
        checkContinueButton();
    });

    receiverSelect.addEventListener('change', () => {
        selectedReceiver = receiverSelect.value;
        checkContinueButton();
    });

    continueBtn.addEventListener('click', () => {
        if (selectedSender && selectedReceiver) {
            // Reinicia stats por si acaso
            currentStats = null; 
            setView('chat'); // Vamos a la vista de chat 1-a-1
        }
    });
}

// ¡Nombre cambiado! Listeners para el chat analizado (verde/gris)
function addAnalyzedChatListeners() {
    const searchInput = document.getElementById('search-bar');
    const messageNodes = document.querySelectorAll('.message-bubble');
    const relevantMessages = chatData.messages.filter(m => m.sender === selectedSender || m.sender === selectedReceiver);

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        relevantMessages.forEach((msg, index) => {
            const node = messageNodes[index];
            if (node) {
                const content = msg.content.toLowerCase();
                if (content.includes(searchTerm)) {
                    node.style.display = 'flex'; // 'flex' para esta vista
                } else {
                    node.style.display = 'none';
                }
            }
        });
    });
}

/**
 * Añade listeners para la vista de exportación.
 */
function addExportListeners() {
    document.getElementById('save-analysis-btn').addEventListener('click', () => {
        if (currentStats) {
            currentStats.savedAt = new Date().toISOString();
            
            const existingIndex = savedAnalyses.findIndex(
                a => a.senderName === currentStats.senderName && a.receiverName === currentStats.receiverName
            );
            
            if (existingIndex > -1) {
                savedAnalyses[existingIndex] = currentStats;
            } else {
                savedAnalyses.push(currentStats);
            }
            
            localStorage.setItem('savedAnalyses', JSON.stringify(savedAnalyses));
            alert(`¡Análisis para "Chat con ${currentStats.receiverName}" guardado!`);
            setView('upload'); 
        }
    });

    document.getElementById('export-stats-btn').addEventListener('click', () => {
        if (currentStats) {
            downloadJSON(currentStats, `stats-${selectedSender}-vs-${selectedReceiver}.json`);
        }
    });

    document.getElementById('export-chat-btn').addEventListener('click', () => {
        if (chatData) {
            downloadCSV(chatData.messages, `chat-${selectedSender}-vs-${selectedReceiver}.csv`);
        } else {
            alert("La exportación de CSV solo está disponible si subiste el .zip (no para análisis guardados).");
        }
    });

    document.getElementById('print-report-btn').addEventListener('click', () => {
        printReport();
    });
}

// --- FUNCIONES DE UTILIDAD PARA DESCARGAS ---

function downloadJSON(data, filename) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    triggerDownload(blob, filename);
}

function convertToCSV(messages) {
    const headers = ['Fecha', 'Hora', 'Autor', 'Mensaje', 'Tipo Media', 'Nombre Archivo'];
    const escape = (str) => {
        str = (str || "").replace(/"/g, '""');
        if (str.includes(',') || str.includes('\n')) {
            str = `"${str}"`;
        }
        return str;
    };
    const rows = messages.map(msg => 
        [msg.date, msg.time, escape(msg.sender), escape(msg.content), msg.mediaType || '', msg.mediaFileName || ''].join(',')
    );
    return [headers.join(','), ...rows].join('\n');
}

function downloadCSV(messages, filename) {
    const csvStr = convertToCSV(messages);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, filename);
}

function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function printReport() {
    // Si no estamos en stats, vamos allí primero
    if (currentView !== 'stats') {
        setView('stats');
        // Espera a que la vista se renderice
        setTimeout(() => {
            window.print();
        }, 500);
    } else {
        window.print();
    }
}


// --- INICIO DE LA APP ---
// Asigna funciones al objeto window para que los 'onclick' las vean
window.setView = setView;
window.startAnalysis = startAnalysis;
window.resetApp = resetApp;
window.loadSavedAnalysis = loadSavedAnalysis;
window.clearSavedAnalyses = clearSavedAnalyses;

// Carga los análisis guardados al iniciar
loadSavedAnalysesFromStorage();
// Renderiza la vista inicial
render();