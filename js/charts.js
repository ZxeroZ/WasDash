// --- Banderas de registro ---
// Para asegurar que no registramos los módulos de Chart.js múltiples veces
let matrixRegistered = false;

/**
 * Renderiza todos los gráficos en la vista de estadísticas.
 * @param {object} stats - El objeto de estadísticas de calculateStatistics.
 * @param {object} charts - El objeto que almacena las instancias de gráficos.
 * @returns {object} - El objeto de gráficos actualizado.
 */
export function renderCharts(stats, charts) {
    // Destruir gráficos anteriores para evitar fugas de memoria
    Object.values(charts).forEach(chart => chart.destroy());
    
    const newCharts = {};

    // Llama a cada función de renderizado
    renderHourChart(stats, newCharts);
    renderDayChart(stats, newCharts);
    renderWordCloud(stats); // Esta no usa Chart.js, se maneja diferente
    renderHeatmap(stats, newCharts);

    return newCharts;
}

// --- GRÁFICOS INDIVIDUALES ---

function renderHourChart(stats, charts) {
    const hourCtx = document.getElementById('hourChart');
    if (hourCtx) {
        charts.hour = new Chart(hourCtx, {
            type: 'line',
            data: {
                labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                datasets: [{
                    label: 'Mensajes',
                    data: stats.hourCounts,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

function renderDayChart(stats, charts) {
    const dayCtx = document.getElementById('dayChart');
    if (dayCtx) {
        // Mostrar solo los últimos 60 días
        const dayEntries = stats.dayCounts.slice(-60);
        charts.day = new Chart(dayCtx, {
            type: 'bar',
            data: {
                labels: dayEntries.map(([day]) => day),
                datasets: [{
                    label: 'Mensajes',
                    data: dayEntries.map(([, count]) => count),
                    backgroundColor: '#3b82f6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

function renderWordCloud(stats) {
    const container = document.getElementById('wordCloudContainer');
    // Asegurarse de que WordCloud esté cargado y haya datos
    if (container && stats.wordCloudData.length > 0 && typeof WordCloud !== 'undefined') {
        // Crear el canvas
        const canvas = document.createElement('canvas');
        canvas.id = 'wordcloud-canvas';
        canvas.width = container.offsetWidth;  // Ajusta al ancho del div
        canvas.height = container.offsetHeight; // Ajusta al alto del div
        container.innerHTML = ''; // Limpia el contenedor
        container.appendChild(canvas);

        // Fórmula para que el peso no sea tan exagerado
        const maxWeight = stats.wordCloudData[0].value;
        const minWeight = stats.wordCloudData[stats.wordCloudData.length - 1].value;

        const options = {
            list: stats.wordCloudData,
            gridSize: Math.round(16 * canvas.width / 1024), // Ajusta el tamaño de la cuadrícula
            weightFactor: (size) => {
                // Mapea el peso a un rango más pequeño (ej: 10 a 60)
                const min = 10;
                const max = 60;
                // Fórmula logarítmica para "aplastar" la diferencia
                const weight = (Math.log(size) - Math.log(minWeight)) / (Math.log(maxWeight) - Math.log(minWeight) || 1);
                return (weight * (max - min)) + min;
            },
            fontFamily: 'sans-serif',
            color: 'random-dark',
            backgroundColor: 'transparent',
            drawOutOfBound: false,
            shrinkToFit: true // Asegura que quepa en el canvas
        };

        try {
            WordCloud(canvas, options);
        } catch (e) {
            console.error("Error al dibujar la nube de palabras:", e);
            container.innerHTML = `<p class="text-red-500">Error al dibujar la nube de palabras.</p>`;
        }
    } else if (container) {
        container.innerHTML = `<p class="text-gray-500 text-center mt-4">No hay suficientes palabras para generar una nube.</p>`;
    }
}

function renderHeatmap(stats, charts) {
    const heatmapCtx = document.getElementById('heatmapChart');
    if (heatmapCtx) {
        
        // --- ¡LÓGICA DE REGISTRO CORREGIDA! ---
        // Se registra aquí, justo antes de usarlo, para asegurar que la librería ya cargó.
        if (!matrixRegistered && typeof ChartMatrix !== 'undefined') {
            try {
                // Accede a la variable global (window.ChartMatrix) que dejó el script
                const { MatrixController, MatrixElement } = window.ChartMatrix; 
                Chart.register(MatrixController, MatrixElement);
                matrixRegistered = true;
            } catch (e) {
                console.error("Error al registrar el gráfico Matrix (asegúrate de que chartjs-chart-matrix.umd.min.js esté cargado):", e);
                // No intentes renderizar el gráfico si el registro falló
                return; 
            }
        } else if (typeof ChartMatrix === 'undefined') {
             console.error("ChartMatrix no está definido. Asegúrate de que el script esté cargado.");
             return;
        }
        // --- FIN DE LA LÓGICA ---

        // Prepara los datos: Llena la cuadrícula con ceros
        const matrixData = stats.dayActivityMatrix.flatMap((row, y) => 
            row.map((value, x) => ({
                x, // Hora (0-23)
                y, // Día (0-6, Domingo=0)
                v: value // Cantidad de mensajes
            }))
        );

        const data = {
            datasets: [{
                label: 'Actividad del Chat',
                data: matrixData,
                backgroundColor: (ctx) => {
                    const value = ctx.raw?.v;
                    if (value === undefined || value === null || value === 0) {
                        return 'rgba(240, 240, 240, 0.6)'; // Gris claro para 0
                    }
                    // Usa el promedio por día como un "máximo" razonable para la escala de color
                    const max = Math.max(stats.avgPerDay * 2, 10); // Evita división por cero
                    const alpha = Math.max(0.1, Math.min(1, value / max));
                    return `rgba(16, 185, 129, ${alpha})`; // Verde esmeralda
                },
                borderColor: 'rgba(255, 255, 255, 0.5)',
                borderWidth: 1,
                // Ajusta el tamaño de la celda al contenedor
                width: (ctx) => (ctx.chart.chartArea?.width || 0) / 24 - 1.5, // 24 horas
                height: (ctx) => (ctx.chart.chartArea?.height || 0) / 7 - 1.5 // 7 días
            }]
        };

        charts.heatmap = new Chart(heatmapCtx, {
            type: 'matrix',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (ctx) => {
                                const raw = ctx[0].raw;
                                const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                                return `${days[raw.y]} a las ${raw.x}:00`;
                            },
                            label: (ctx) => {
                                return `Mensajes: ${ctx.raw.v}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        min: 0,
                        max: 23,
                        ticks: {
                            stepSize: 2,
                            callback: (val) => `${val}h`
                        },
                        grid: { display: false }
                    },
                    y: {
                        type: 'linear',
                        min: 0,
                        max: 6,
                        reverse: true, // Pone Domingo (0) arriba
                        ticks: {
                            callback: (val) => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][val]
                        },
                        grid: { display: false }
                    }
                }
            }
        });
    }
}

