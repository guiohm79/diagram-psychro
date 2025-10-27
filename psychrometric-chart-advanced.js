class PsychrometricChartEnhanced extends HTMLElement {
    constructor() {
        super();
        this._hass = null;
        this.resizeObserver = null;
        this.canvasWidth = 800;
        this.canvasHeight = 600;
        this.hoveredPoint = null;
        this.modalOpen = false;
        this._hasRendered = false;
        this._previousValues = new Map();
        this._resizeDebounceTimer = null;
        this._lastRenderTime = 0;
        this._language = 'fr'; // Default language

        // Internationalization (i18n) translations
        this.translations = {
            fr: {
                // Error messages
                noPointsConfigured: 'Aucun point ou entité configuré dans la carte !',
                noValidEntity: 'Aucune entité valide trouvée !',
                noDataAvailable: 'Aucune donnée disponible',

                // Main labels
                temperature: 'Température',
                humidity: 'Humidité',
                dewPoint: 'Point de rosée',
                wetBulbTemp: 'Temp. humide',
                enthalpy: 'Enthalpie',
                waterContent: 'Teneur eau',
                absoluteHumidity: 'Humidité abs.',
                specificVolume: 'Vol. spécifique',
                pmvIndex: 'Indice PMV',
                moldRisk: 'Moisissure',

                // Actions
                action: 'Action',
                totalPower: 'Puissance totale',
                heating: 'Chauffage',
                cooling: 'Refroidissement',
                humidification: 'Humidification',
                dehumidification: 'Déshumidification',
                idealSetpoint: 'Consigne idéale',

                // Comfort
                optimalComfort: 'Confort optimal',
                comfortZone: 'Zone de confort',

                // Legend and UI
                legend: 'Légende',
                minimum: 'Minimum',
                average: 'Moyenne',
                maximum: 'Maximum',
                clickToViewHistory: 'Cliquer pour voir l\'historique',

                // Mold risk levels
                moldRiskNone: 'Aucun risque',
                moldRiskVeryLow: 'Très faible',
                moldRiskLow: 'Faible',
                moldRiskModerate: 'Modéré',
                moldRiskHigh: 'Élevé',
                moldRiskVeryHigh: 'Très élevé',
                moldRiskCritical: 'Critique'
            },
            en: {
                // Error messages
                noPointsConfigured: 'No points or entities configured in the card!',
                noValidEntity: 'No valid entities found!',
                noDataAvailable: 'No data available',

                // Main labels
                temperature: 'Temperature',
                humidity: 'Humidity',
                dewPoint: 'Dew point',
                wetBulbTemp: 'Wet bulb temp.',
                enthalpy: 'Enthalpy',
                waterContent: 'Water content',
                absoluteHumidity: 'Absolute humidity',
                specificVolume: 'Specific volume',
                pmvIndex: 'PMV Index',
                moldRisk: 'Mold risk',

                // Actions
                action: 'Action',
                totalPower: 'Total power',
                heating: 'Heating',
                cooling: 'Cooling',
                humidification: 'Humidification',
                dehumidification: 'Dehumidification',
                idealSetpoint: 'Ideal setpoint',

                // Comfort
                optimalComfort: 'Optimal comfort',
                comfortZone: 'Comfort zone',

                // Legend and UI
                legend: 'Legend',
                minimum: 'Minimum',
                average: 'Average',
                maximum: 'Maximum',
                clickToViewHistory: 'Click to view history',

                // Mold risk levels
                moldRiskNone: 'No risk',
                moldRiskVeryLow: 'Very low',
                moldRiskLow: 'Low',
                moldRiskModerate: 'Moderate',
                moldRiskHigh: 'High',
                moldRiskVeryHigh: 'Very high',
                moldRiskCritical: 'Critical'
            }
        };
    }

    // Translation helper method
    t(key) {
        return this.translations[this._language][key] || this.translations['fr'][key] || key;
    }

    // Get language from config or use default
    getLanguage() {
        return this.config && this.config.language ? this.config.language : 'fr';
    }

    set hass(hass) {
        this._hass = hass;
        if (!this.config || !this.config.points || this.config.points.length === 0) {
            this.innerHTML = `<p style="color: red;">${this.t('noPointsConfigured')}</p>`;
            return;
        }

        // Check if values have changed significantly before rendering
        if (this._hasRendered && !this.shouldUpdate(hass)) {
            return;
        }

        this.render(hass);
    }

    shouldUpdate(hass) {
        // Always update on first render
        if (!this._hasRendered) {
            return true;
        }

        // Check if any sensor value has changed significantly
        for (const point of this.config.points) {
            const tempState = hass.states[point.temp];
            const humState = hass.states[point.humidity];

            if (!tempState || !humState) continue;

            const newTemp = parseFloat(tempState.state);
            const newHum = parseFloat(humState.state);

            const key = `${point.temp}_${point.humidity}`;
            const previous = this._previousValues.get(key);

            if (!previous) {
                // New sensor, need to update
                return true;
            }

            // Check for significant changes
            const tempDiff = Math.abs(newTemp - previous.temp);
            const humDiff = Math.abs(newHum - previous.humidity);

            // Thresholds: 0.1°C for temperature, 1% for humidity
            if (tempDiff > 0.1 || humDiff > 1) {
                return true;
            }
        }

        // No significant changes
        return false;
    }

    storeSensorValues(hass) {
        // Store current values for next comparison
        for (const point of this.config.points) {
            const tempState = hass.states[point.temp];
            const humState = hass.states[point.humidity];

            if (!tempState || !humState) continue;

            const key = `${point.temp}_${point.humidity}`;
            this._previousValues.set(key, {
                temp: parseFloat(tempState.state),
                humidity: parseFloat(humState.state)
            });
        }
    }

    connectedCallback() {
        // Setup resize observer for responsive design
        this.setupResizeObserver();
    }

    disconnectedCallback() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }

    setupResizeObserver() {
        this.resizeObserver = new ResizeObserver(() => {
            // Debounce resize events to avoid excessive re-renders
            if (this._resizeDebounceTimer) {
                clearTimeout(this._resizeDebounceTimer);
            }

            this._resizeDebounceTimer = setTimeout(() => {
                if (this._hass) {
                    this.updateCanvasSize();
                    this.render(this._hass);
                }
            }, 150); // 150ms debounce
        });
        this.resizeObserver.observe(this);
    }

    updateCanvasSize() {
        const container = this.querySelector('.chart-container');
        if (container) {
            const width = container.offsetWidth;
            // Maintain aspect ratio
            this.canvasWidth = Math.max(300, Math.min(width - 40, 1200));
            this.canvasHeight = Math.floor(this.canvasWidth * 0.75);
        }
    }

    render(hass) {
        // Traiter les points et les capteurs
        const points = this.config.points.map((point) => {
            const tempState = hass.states[point.temp];
            const humState = hass.states[point.humidity];

            if (!tempState || !humState) {
                console.warn(`Entités non disponibles : ${point.temp} ou ${point.humidity}`);
                return null;
            }

            const temp = parseFloat(tempState.state);
            const humidity = parseFloat(humState.state);

            const { comfortRange = { tempMin: 20, tempMax: 26, rhMin: 40, rhMax: 60 } } = this.config;
            const { massFlowRate = 0.5 } = this.config; // Par défaut : 0.5 kg/s

            // Calculs des actions et puissances
            let action = "";
            let power = 0;
            let heatingPower = 0;
            let coolingPower = 0;
            let humidificationPower = 0;
            let dehumidificationPower = 0;

            if (temp < comfortRange.tempMin) {
                action = "Réchauffer";
                heatingPower = this.calculateHeatingPower(temp, comfortRange.tempMin, massFlowRate);
                power += heatingPower;
            } else if (temp > comfortRange.tempMax) {
                action = "Refroidir";
                coolingPower = this.calculateCoolingPower(temp, comfortRange.tempMax, massFlowRate);
                power += coolingPower;
            }

            if (humidity < comfortRange.rhMin) {
                action = action ? action + " et Humidifier" : "Humidifier";
                humidificationPower = this.calculateHumidityPower(temp, humidity, comfortRange.rhMin, massFlowRate);
                power += humidificationPower;
            } else if (humidity > comfortRange.rhMax) {
                action = action ? action + " et Déshumidifier" : "Déshumidifier";
                dehumidificationPower = this.calculateHumidityPower(temp, humidity, comfortRange.rhMax, massFlowRate);
                power += dehumidificationPower;
            }

            // Calculs supplémentaires
            const dewPoint = this.calculateDewPoint(temp, humidity);
            const waterContent = this.calculateWaterContent(temp, humidity);
            const enthalpy = this.calculateEnthalpy(temp, waterContent);
            const absoluteHumidity = this.calculateAbsoluteHumidity(temp, humidity);
            const wetBulbTemp = this.calculateWetBulbTemp(temp, humidity);
            const vaporPressure = this.calculateVaporPressure(temp, humidity);
            const specificVolume = this.calculateSpecificVolume(temp, humidity);
            
            // Calcul du risque de moisissure
            const moldRisk = this.calculateMoldRisk(temp, humidity);
            
            // Calcul de l'indice de confort thermique PMV
            const pmv = this.calculatePMV(temp, humidity);
            
            // Calcul du point de consigne idéal pour économie d'énergie
            const idealSetpoint = this.calculateIdealSetpoint(temp, humidity, comfortRange);

            return {
                temp,
                humidity,
                action,
                power,
                heatingPower,
                coolingPower,
                humidificationPower,
                dehumidificationPower,
                dewPoint,
                waterContent,
                enthalpy,
                absoluteHumidity,
                wetBulbTemp,
                vaporPressure,
                specificVolume,
                moldRisk,
                pmv,
                idealSetpoint,
                color: point.color || "#ff0000",
                label: point.label || `${point.temp} & ${point.humidity}`,
                icon: point.icon || "mdi:thermometer",
                inComfortZone: this.isInComfortZone(temp, humidity, comfortRange),
                tempEntityId: point.temp,
                humidityEntityId: point.humidity
            };
        });

        const validPoints = points.filter((p) => p !== null);

        if (validPoints.length === 0) {
            this.innerHTML = `<p style="color: red;">${this.t('noValidEntity')}</p>`;
            return;
        }

        // Configuration et options
        const {
            bgColor = "#ffffff",
            gridColor = "#cccccc",
            curveColor = "#1f77b4",
            textColor = "#333333",
            chartTitle = "Diagramme Psychrométrique",
            showCalculatedData = true,
            comfortRange = { tempMin: 20, tempMax: 26, rhMin: 40, rhMax: 60 },
            comfortColor = "rgba(144, 238, 144, 0.5)",
            showEnthalpy = true,
            showWetBulb = true,
            showDewPoint = true,
            showLegend = true,
            showHistoryData = false,
            historyHours = 24,
            darkMode = false,
            showMoldRisk = true,
            displayMode = "standard", // standard, minimal, advanced
            unitSystem = "metric", // metric, imperial
            language = "fr", // fr, en
        } = this.config;

        // Mettre à jour la langue
        this._language = language;

        // Appliquer le thème sombre si activé
        const actualBgColor = darkMode ? "#121212" : bgColor;
        const actualTextColor = darkMode ? "#ffffff" : textColor;
        const actualGridColor = darkMode ? "#333333" : gridColor;

        // Construction du HTML pour les données calculées avec design amélioré
        const calculatedDataHTML = showCalculatedData
            ? `
            <div class="psychro-data" style="
                margin-top: 20px;
                text-align: left;
                font-size: 14px;
                max-width: 100%;
                padding: 0 20px;
                margin-left: auto;
                margin-right: auto;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
                gap: 20px;">
                ${validPoints
                    .map(
                        (p, index) => `
                    <div class="psychro-point-data"
                         data-point-index="${index}"
                         style="
                            padding: 15px;
                            border-radius: 15px;
                            background: ${darkMode ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)'};
                            border-left: 5px solid ${p.color};
                            box-shadow: 0 4px 15px rgba(0, 0, 0, ${darkMode ? '0.3' : '0.1'});
                            backdrop-filter: blur(10px);
                            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                            cursor: pointer;
                            position: relative;
                            overflow: hidden;
                            animation: ${this._hasRendered ? 'none' : `fadeInUp 0.5s ease-out ${index * 0.1}s backwards`};">
                        <div style="
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background: radial-gradient(circle at top right, ${p.color}15, transparent);
                            pointer-events: none;"></div>
                        <div style="position: relative; z-index: 1;">
                            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                                <ha-icon icon="${p.icon}" style="margin-right: 8px; color: ${p.color};"></ha-icon>
                                <span style="color: ${p.color}; font-weight: bold; font-size: 16px;">
                                    ${p.label}
                                </span>
                                ${p.inComfortZone ?
                                    `<span style="margin-left: auto; background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 4px 10px; border-radius: 15px; font-size: 11px; box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);">✓ ${this.t('optimalComfort')}</span>` :
                                    `<span style="margin-left: auto; background: linear-gradient(135deg, #FF9800, #f57c00); color: white; padding: 4px 10px; border-radius: 15px; font-size: 11px; box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);">⚠ Hors confort</span>`
                                }
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <div>
                                    <div class="clickable-value" data-entity="${p.tempEntityId}" data-type="temperature" style="margin-bottom: 5px; padding: 5px; border-radius: 5px; transition: background 0.2s; cursor: pointer;">
                                        <strong>🌡️ ${this.t('temperature')}:</strong> <span style="color: ${p.color}; font-weight: 600;">${p.temp.toFixed(1)}°C</span>
                                    </div>
                                    <div class="clickable-value" data-entity="${p.humidityEntityId}" data-type="humidity" style="margin-bottom: 5px; padding: 5px; border-radius: 5px; transition: background 0.2s; cursor: pointer;">
                                        <strong>💧 ${this.t('humidity')}:</strong> <span style="color: ${p.color}; font-weight: 600;">${p.humidity.toFixed(1)}%</span>
                                    </div>
                                    <div style="margin-bottom: 5px;"><strong>${this.t('dewPoint')}:</strong> ${p.dewPoint.toFixed(1)}°C</div>
                                    <div style="margin-bottom: 5px;"><strong>${this.t('wetBulbTemp')}:</strong> ${p.wetBulbTemp.toFixed(1)}°C</div>
                                    <div style="margin-bottom: 5px;"><strong>${this.t('enthalpy')}:</strong> ${p.enthalpy.toFixed(1)} kJ/kg</div>
                                </div>
                                <div>
                                    <div style="margin-bottom: 5px;"><strong>${this.t('waterContent')}:</strong> ${p.waterContent.toFixed(4)} kg/kg</div>
                                    <div style="margin-bottom: 5px;"><strong>${this.t('absoluteHumidity')}:</strong> ${p.absoluteHumidity.toFixed(2)} g/m³</div>
                                    <div style="margin-bottom: 5px;"><strong>${this.t('specificVolume')}:</strong> ${p.specificVolume.toFixed(3)} m³/kg</div>
                                    <div style="margin-bottom: 5px;"><strong>${this.t('pmvIndex')}:</strong> ${p.pmv.toFixed(2)}</div>
                                    ${showMoldRisk ? `<div style="margin-bottom: 5px;"><strong>🦠 ${this.t('moldRisk')}:</strong> <span style="color: ${this.getMoldRiskColor(p.moldRisk)}; font-weight: 600;">${this.getMoldRiskText(p.moldRisk)}</span></div>` : ''}
                                </div>
                            </div>

                            ${p.action ? `
                            <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid ${darkMode ? '#555' : '#ddd'};">
                                <div style="margin-bottom: 5px;"><strong>⚡ ${this.t('action')}:</strong> ${p.action}</div>
                                <div style="margin-bottom: 5px;"><strong>${this.t('totalPower')}:</strong> <span style="color: ${p.color}; font-weight: 600;">${p.power.toFixed(1)} W</span></div>
                                ${p.heatingPower > 0 ? `<div style="margin-bottom: 5px;"><strong>🔥 ${this.t('heating')}:</strong> ${p.heatingPower.toFixed(1)} W</div>` : ''}
                                ${p.coolingPower > 0 ? `<div style="margin-bottom: 5px;"><strong>❄️ ${this.t('cooling')}:</strong> ${p.coolingPower.toFixed(1)} W</div>` : ''}
                                ${p.humidificationPower > 0 ? `<div style="margin-bottom: 5px;"><strong>💦 ${this.t('humidification')}:</strong> ${p.humidificationPower.toFixed(1)} W</div>` : ''}
                                ${p.dehumidificationPower > 0 ? `<div style="margin-bottom: 5px;"><strong>🌬️ ${this.t('dehumidification')}:</strong> ${p.dehumidificationPower.toFixed(1)} W</div>` : ''}
                                <div style="margin-bottom: 5px;"><strong>🎯 ${this.t('idealSetpoint')}:</strong> ${p.idealSetpoint.temp.toFixed(1)}°C, ${p.idealSetpoint.humidity.toFixed(0)}%</div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `
                    )
                    .join("")}
            </div>`
            : "";

        // Construction du HTML principal avec styles et modal
        this.innerHTML = `
            <style>
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                .psychro-point-data:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, ${darkMode ? '0.5' : '0.15'}) !important;
                }

                .clickable-value:hover {
                    background: ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'} !important;
                    transform: scale(1.02);
                }

                .chart-container {
                    position: relative;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                #psychroChart {
                    max-width: 100%;
                    height: auto;
                    cursor: crosshair;
                    transition: all 0.3s ease;
                }

                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(5px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    animation: fadeIn 0.3s ease;
                }

                .modal-content {
                    background: ${darkMode ? 'linear-gradient(135deg, #2d2d2d, #1a1a1a)' : 'linear-gradient(135deg, #ffffff, #f8f9fa)'};
                    border-radius: 20px;
                    padding: 30px;
                    max-width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    animation: modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                }

                .modal-close {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    font-size: 24px;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: ${actualTextColor};
                }

                .modal-close:hover {
                    background: ${darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
                    transform: rotate(90deg);
                }

                .history-chart {
                    width: 100%;
                    height: 300px;
                    margin-top: 20px;
                }

                @media (max-width: 768px) {
                    .psychro-data {
                        grid-template-columns: 1fr !important;
                    }

                    .modal-content {
                        padding: 20px;
                        max-width: 95%;
                    }
                }
            </style>
            <ha-card>
                <div style="text-align: center; padding: 16px; background-color: ${actualBgColor}; color: ${actualTextColor};">
                    <h2 style="margin-top: 0; margin-bottom: 16px; color: ${actualTextColor}; animation: ${this._hasRendered ? 'none' : 'fadeInUp 0.5s ease'};">${chartTitle}</h2>
                    <div class="chart-container" style="position: relative;">
                        <canvas id="psychroChart" width="${this.canvasWidth}" height="${this.canvasHeight}"></canvas>
                        ${showLegend ? this.generateLegendHTML(validPoints, actualTextColor, darkMode) : ''}
                    </div>
                    ${calculatedDataHTML}
                </div>
            </ha-card>
            <div id="historyModal" style="display: none;"></div>
        `;

        // Store points for later use
        this.validPoints = validPoints;

        // Store current sensor values for next comparison
        this.storeSensorValues(hass);

        // Mark as rendered
        this._hasRendered = true;

        // Dessiner le graphique
        this.drawFullPsychrometricChart(validPoints, {
            bgColor: actualBgColor,
            gridColor: actualGridColor,
            curveColor,
            textColor: actualTextColor,
            comfortRange,
            comfortColor,
            showEnthalpy,
            showWetBulb,
            showDewPoint,
            darkMode,
            displayMode,
            showPointLabels: this.config.showPointLabels
        });

        // Setup event listeners for history modal
        this.setupHistoryEventListeners(hass, darkMode, actualTextColor, actualBgColor);

        // Setup canvas interactivity
        this.setupCanvasInteractivity(validPoints);
    }

    generateLegendHTML(points, textColor, darkMode) {
        return `
            <div style="
                position: absolute;
                top: 10px;
                right: 10px;
                background: ${darkMode ? 'rgba(45, 45, 45, 0.9)' : 'rgba(255,255,255,0.9)'};
                backdrop-filter: blur(10px);
                padding: 12px;
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, ${darkMode ? '0.5' : '0.2'});
                text-align: left;
                animation: ${this._hasRendered ? 'none' : 'fadeInUp 0.5s ease 0.3s backwards'};">
                <div style="margin-bottom: 8px; font-weight: bold; color: ${textColor}; font-size: 13px;">📍 ${this.t('legend')}</div>
                ${points.map((p, index) => `
                    <div style="
                        display: flex;
                        align-items: center;
                        margin-bottom: 5px;
                        animation: ${this._hasRendered ? 'none' : `fadeInUp 0.3s ease ${0.4 + index * 0.1}s backwards`};">
                        <span style="
                            width: 12px;
                            height: 12px;
                            background-color: ${p.color};
                            display: inline-block;
                            margin-right: 8px;
                            border-radius: 50%;
                            box-shadow: 0 2px 5px ${p.color}80;"></span>
                        <span style="color: ${textColor}; font-size: 12px;">${p.label}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    setupHistoryEventListeners(hass, darkMode, textColor, bgColor) {
        // Add click listeners to temperature and humidity values
        setTimeout(() => {
            const clickableElements = this.querySelectorAll('.clickable-value');
            clickableElements.forEach(element => {
                element.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const entityId = element.getAttribute('data-entity');
                    const type = element.getAttribute('data-type');
                    await this.showHistoryModal(entityId, type, hass, darkMode, textColor, bgColor);
                });
            });
        }, 100);
    }

    async showHistoryModal(entityId, type, hass, darkMode, textColor, bgColor) {
        if (this.modalOpen) return;
        this.modalOpen = true;

        const entity = hass.states[entityId];
        if (!entity) return;

        // Get history data (24 hours)
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

        try {
            const historyData = await this.fetchHistory(hass, entityId, startTime, endTime);
            this.renderHistoryModal(historyData, entity, type, darkMode, textColor, bgColor);
        } catch (error) {
            console.error('Error fetching history:', error);
            this.renderHistoryModal([], entity, type, darkMode, textColor, bgColor);
        }
    }

    async fetchHistory(hass, entityId, startTime, endTime) {
        try {
            // Use Home Assistant history API
            const url = `history/period/${startTime.toISOString()}?filter_entity_id=${entityId}&end_time=${endTime.toISOString()}`;
            const response = await hass.callApi('GET', url);

            if (response && response[0]) {
                return response[0];
            }
            return [];
        } catch (error) {
            console.error('History API error:', error);
            return [];
        }
    }

    renderHistoryModal(historyData, entity, type, darkMode, textColor, bgColor) {
        const modalContainer = this.querySelector('#historyModal');
        const unit = type === 'temperature' ? '°C' : '%';
        const icon = type === 'temperature' ? '🌡️' : '💧';
        const label = type === 'temperature' ? this.t('temperature') : this.t('humidity');

        // Calculate statistics
        let min = Infinity, max = -Infinity, sum = 0, count = 0;
        historyData.forEach(item => {
            const value = parseFloat(item.state);
            if (!isNaN(value)) {
                min = Math.min(min, value);
                max = Math.max(max, value);
                sum += value;
                count++;
            }
        });
        const avg = count > 0 ? (sum / count).toFixed(1) : 'N/A';
        min = count > 0 ? min.toFixed(1) : 'N/A';
        max = count > 0 ? max.toFixed(1) : 'N/A';

        modalContainer.style.display = 'block';
        modalContainer.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content" style="color: ${textColor}; min-width: 500px;">
                    <button class="modal-close">&times;</button>
                    <h2 style="margin-top: 0; display: flex; align-items: center; gap: 10px;">
                        ${icon} ${label} - ${entity.attributes.friendly_name || entity.entity_id}
                    </h2>

                    <div style="
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 15px;
                        margin: 20px 0;
                        padding: 15px;
                        background: ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
                        border-radius: 10px;">
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #4CAF50;">${min}${unit}</div>
                            <div style="font-size: 12px; opacity: 0.7;">${this.t('minimum')}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #2196F3;">${avg}${unit}</div>
                            <div style="font-size: 12px; opacity: 0.7;">${this.t('average')}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #FF5722;">${max}${unit}</div>
                            <div style="font-size: 12px; opacity: 0.7;">${this.t('maximum')}</div>
                        </div>
                    </div>

                    <div style="margin-top: 20px;">
                        <canvas id="historyChart" class="history-chart"></canvas>
                    </div>

                    <div style="margin-top: 15px; font-size: 12px; opacity: 0.6; text-align: center;">
                        📅 Historique des dernières 24 heures (${count} points de données)
                    </div>
                </div>
            </div>
        `;

        // Draw history chart
        setTimeout(() => {
            this.drawHistoryChart(historyData, type, darkMode, textColor, unit);
        }, 50);

        // Setup close handlers
        const closeBtn = modalContainer.querySelector('.modal-close');
        const overlay = modalContainer.querySelector('.modal-overlay');

        closeBtn.addEventListener('click', () => this.closeHistoryModal());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeHistoryModal();
            }
        });
    }

    drawHistoryChart(historyData, type, darkMode, textColor, unit) {
        const canvas = this.querySelector('#historyChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.offsetWidth;
        const height = 300;
        canvas.width = width;
        canvas.height = height;

        // Prepare data
        const dataPoints = historyData
            .map(item => ({
                time: new Date(item.last_changed || item.last_updated),
                value: parseFloat(item.state)
            }))
            .filter(item => !isNaN(item.value))
            .sort((a, b) => a.time - b.time);

        if (dataPoints.length === 0) {
            ctx.fillStyle = textColor;
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.t('noDataAvailable'), width / 2, height / 2);
            return;
        }

        // Calculate scales
        const minValue = Math.min(...dataPoints.map(d => d.value));
        const maxValue = Math.max(...dataPoints.map(d => d.value));
        const valueRange = maxValue - minValue || 1;
        const padding = 50;

        // Clear canvas
        ctx.fillStyle = darkMode ? '#1a1a1a' : '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = darkMode ? '#333' : '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);

        for (let i = 0; i <= 5; i++) {
            const y = padding + (height - 2 * padding) * i / 5;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();

            // Y-axis labels
            const value = maxValue - (valueRange * i / 5);
            ctx.fillStyle = textColor;
            ctx.font = '12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(value.toFixed(1) + unit, padding - 10, y + 4);
        }

        // Draw line
        ctx.setLineDash([]);
        ctx.strokeStyle = type === 'temperature' ? '#FF5722' : '#2196F3';
        ctx.lineWidth = 2;
        ctx.beginPath();

        dataPoints.forEach((point, index) => {
            const x = padding + (width - 2 * padding) * index / (dataPoints.length - 1);
            const y = padding + (height - 2 * padding) * (1 - (point.value - minValue) / valueRange);

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw points
        ctx.fillStyle = type === 'temperature' ? '#FF5722' : '#2196F3';
        dataPoints.forEach((point, index) => {
            const x = padding + (width - 2 * padding) * index / (dataPoints.length - 1);
            const y = padding + (height - 2 * padding) * (1 - (point.value - minValue) / valueRange);

            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
        });

        // Draw time labels
        ctx.fillStyle = textColor;
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        [0, Math.floor(dataPoints.length / 2), dataPoints.length - 1].forEach(index => {
            if (dataPoints[index]) {
                const x = padding + (width - 2 * padding) * index / (dataPoints.length - 1);
                const time = dataPoints[index].time;
                ctx.fillText(
                    time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    x,
                    height - padding + 20
                );
            }
        });
    }

    closeHistoryModal() {
        const modalContainer = this.querySelector('#historyModal');
        if (modalContainer) {
            modalContainer.style.display = 'none';
            modalContainer.innerHTML = '';
        }
        this.modalOpen = false;
    }

    setupCanvasInteractivity(points) {
        const canvas = this.querySelector('#psychroChart');
        if (!canvas) return;

        let tooltip = null;

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            // Check if hovering over a point
            let hoveredPoint = null;
            points.forEach((point, index) => {
                const pointX = this.tempToX(point.temp);
                const pointY = this.humidityToY(point.temp, point.humidity);

                const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);
                if (distance < 15) {
                    hoveredPoint = { ...point, index };
                }
            });

            if (hoveredPoint) {
                canvas.style.cursor = 'pointer';
                this.showTooltip(e, hoveredPoint, rect);
            } else {
                canvas.style.cursor = 'crosshair';
                this.hideTooltip();
            }
        });

        canvas.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
    }

    tempToX(temp) {
        return 50 + (temp + 10) * (this.canvasWidth / 800) * 12;
    }

    humidityToY(temp, humidity) {
        const P_sat = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
        const P_v = (humidity / 100) * P_sat;
        return 550 * (this.canvasHeight / 600) - (P_v / 4) * 500 * (this.canvasHeight / 600);
    }

    showTooltip(event, point, canvasRect) {
        this.hideTooltip();

        const tooltip = document.createElement('div');
        tooltip.id = 'psychro-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            left: ${event.clientX + 15}px;
            top: ${event.clientY + 15}px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 10px 15px;
            border-radius: 8px;
            font-size: 13px;
            z-index: 10000;
            pointer-events: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: fadeIn 0.2s ease;
            border-left: 3px solid ${point.color};
        `;

        tooltip.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px; color: ${point.color};">${point.label}</div>
            <div>🌡️ ${this.t('temperature')}: <strong>${point.temp.toFixed(1)}°C</strong></div>
            <div>💧 ${this.t('humidity')}: <strong>${point.humidity.toFixed(1)}%</strong></div>
            <div style="margin-top: 5px; font-size: 11px; opacity: 0.8;">${this.t('clickToViewHistory')}</div>
        `;

        document.body.appendChild(tooltip);
    }

    hideTooltip() {
        const tooltip = document.getElementById('psychro-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    isInComfortZone(temp, humidity, comfortRange) {
        return (
            temp >= comfortRange.tempMin && 
            temp <= comfortRange.tempMax && 
            humidity >= comfortRange.rhMin && 
            humidity <= comfortRange.rhMax
        );
    }

    getMoldRiskColor(riskLevel) {
        const colors = {
            0: "#4CAF50", // Vert - Aucun risque
            1: "#8BC34A", // Vert clair - Très faible
            2: "#CDDC39", // Jaune-vert - Faible
            3: "#FFEB3B", // Jaune - Modéré
            4: "#FFC107", // Ambre - Élevé
            5: "#FF9800", // Orange - Très élevé
            6: "#FF5722"  // Rouge - Critique
        };
        return colors[Math.min(Math.floor(riskLevel), 6)];
    }

    getMoldRiskText(riskLevel) {
        const keys = [
            'moldRiskNone',
            'moldRiskVeryLow',
            'moldRiskLow',
            'moldRiskModerate',
            'moldRiskHigh',
            'moldRiskVeryHigh',
            'moldRiskCritical'
        ];
        return this.t(keys[Math.min(Math.floor(riskLevel), 6)]);
    }
    
    drawFullPsychrometricChart(points, options) {
        const canvas = this.querySelector("#psychroChart");
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const width = canvas.width;
        const height = canvas.height;

        const {
            bgColor,
            gridColor,
            curveColor,
            textColor,
            comfortRange,
            comfortColor,
            showEnthalpy = true,
            showWetBulb = true,
            showDewPoint = true,
            darkMode = false,
            showPointLabels = true,
            displayMode = "standard"

        } = options;

        // Scale factors for responsive design
        const scaleX = width / 800;
        const scaleY = height / 600;
        const scale = Math.min(scaleX, scaleY);

        // Effacer le canvas
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);

        // Dessiner les axes et le quadrillage
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1 * scale;
        ctx.setLineDash([5 * scale, 5 * scale]);

        // Responsive padding and dimensions
        const leftPadding = 50 * scaleX;
        const rightEdge = 750 * scaleX;
        const topPadding = 50 * scaleY;
        const bottomEdge = 550 * scaleY;
        const chartHeight = bottomEdge - topPadding;
        const chartWidth = rightEdge - leftPadding;

        // Axes de pression de vapeur (vertical)
        ctx.font = `${Math.max(10, 12 * scale)}px Arial`;
        for (let i = 0; i <= 4; i += 0.5) {
            const y = bottomEdge - (i / 4) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(leftPadding, y);
            ctx.lineTo(rightEdge, y);
            ctx.stroke();
            ctx.fillStyle = textColor;
            ctx.fillText(`${i.toFixed(1)} kPa`, 10 * scaleX, y + 5 * scaleY);
        }

        // Axes de température (horizontal)
        for (let i = -10; i <= 50; i += 5) {
            const x = leftPadding + (i + 10) * 12 * scaleX;
            ctx.beginPath();
            ctx.moveTo(x, bottomEdge);
            ctx.lineTo(x, topPadding);
            ctx.stroke();
            ctx.fillStyle = textColor;
            ctx.fillText(`${i}°C`, x - 10 * scaleX, bottomEdge + 20 * scaleY);
        }

        // Dessiner les courbes d'humidité relative
        ctx.setLineDash([]);
        ctx.font = `${Math.max(10, 12 * scale)}px Arial`;

        for (let rh = 10; rh <= 100; rh += 10) {
            ctx.beginPath();
            ctx.strokeStyle = rh === 100 ? "rgba(30, 144, 255, 0.8)" : curveColor;
            ctx.lineWidth = (rh % 20 === 0 ? 1.5 : 0.8) * scale;

            let lastX = 0, lastY = 0;

            for (let t = -10; t <= 50; t++) {
                const P_sat = 0.61078 * Math.exp((17.27 * t) / (t + 237.3));
                const P_v = (rh / 100) * P_sat;

                const x = leftPadding + (t + 10) * 12 * scaleX;
                const y = bottomEdge - (P_v / 4) * chartHeight;

                if (t === -10) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }

                lastX = x;
                lastY = y;
            }

            ctx.stroke();
            ctx.fillStyle = textColor;
            ctx.fillText(`${rh}%`, lastX + 5 * scaleX, lastY);
        }


        // Dessiner les courbes d'enthalpie si demandé
        if (showEnthalpy && displayMode !== "minimal") {
            ctx.setLineDash([2 * scale, 3 * scale]);
            ctx.strokeStyle = darkMode ? "rgba(255, 165, 0, 0.7)" : "rgba(255, 99, 71, 0.7)";

            for (let h = 0; h <= 100; h += 10) {
                ctx.beginPath();
                let drawn = false;
                let enthalpy_points = [];

                for (let t = -10; t <= 50; t += 0.5) {
                    for (let rh = 10; rh <= 100; rh += 5) {
                        const P_sat = 0.61078 * Math.exp((17.27 * t) / (t + 237.3));
                        const P_v = (rh / 100) * P_sat;
                        const W = 0.622 * (P_v / (101.325 - P_v));
                        const enthalpy = 1.006 * t + W * (2501 + 1.84 * t);

                        if (Math.abs(enthalpy - h) < 0.5) {
                            const x = leftPadding + (t + 10) * 12 * scaleX;
                            const y = bottomEdge - (P_v / 4) * chartHeight;

                            if (!drawn) {
                                ctx.moveTo(x, y);
                                drawn = true;
                            } else {
                                ctx.lineTo(x, y);
                            }

                            enthalpy_points.push({x, y});
                            break;
                        }
                    }
                }

                ctx.stroke();

                // Ajouter une étiquette pour les courbes d'enthalpie
                if (drawn && enthalpy_points.length > 0) {
                    ctx.fillStyle = darkMode ? "rgba(255, 165, 0, 0.9)" : "rgba(255, 99, 71, 0.9)";

                    enthalpy_points.sort((a, b) => b.x - a.x);

                    let labelPoint = null;
                    for (const point of enthalpy_points) {
                        if (point.y > 70 * scaleY && point.y < 500 * scaleY && point.x > 400 * scaleX) {
                            labelPoint = point;
                            break;
                        }
                    }

                    if (!labelPoint) {
                        for (const point of enthalpy_points) {
                            if (point.y > 70 * scaleY && point.y < 500 * scaleY) {
                                labelPoint = point;
                                break;
                            }
                        }
                    }

                    if (labelPoint) {
                        ctx.save();

                        const neighborIndex = enthalpy_points.indexOf(labelPoint);
                        const neighborPoint = enthalpy_points[Math.max(0, neighborIndex - 5)];

                        if (neighborPoint) {
                            const angleRad = Math.atan2(neighborPoint.y - labelPoint.y, neighborPoint.x - labelPoint.x);

                            ctx.translate(labelPoint.x, labelPoint.y);
                            ctx.rotate(angleRad);

                            ctx.fillText(`${h} kJ/kg`, 5 * scale, -5 * scale);
                        } else {
                            ctx.fillText(`${h} kJ/kg`, labelPoint.x + 5 * scaleX, labelPoint.y - 5 * scaleY);
                        }

                        ctx.restore();
                    }
                }
            }
            ctx.setLineDash([]);
        }

        // Dessiner la zone de confort
        ctx.fillStyle = comfortColor;
        ctx.beginPath();
        const comfortPoints = [
            { temp: comfortRange.tempMin, rh: comfortRange.rhMin },
            { temp: comfortRange.tempMax, rh: comfortRange.rhMin },
            { temp: comfortRange.tempMax, rh: comfortRange.rhMax },
            { temp: comfortRange.tempMin, rh: comfortRange.rhMax },
        ];
        comfortPoints.forEach((point, index) => {
            const P_sat = 0.61078 * Math.exp((17.27 * point.temp) / (point.temp + 237.3));
            const P_v = (point.rh / 100) * P_sat;
            const x = leftPadding + (point.temp + 10) * 12 * scaleX;
            const y = bottomEdge - (P_v / 4) * chartHeight;
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();

        // Ajouter un texte pour la zone de confort
        ctx.fillStyle = darkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)";
        ctx.font = `${Math.max(12, 14 * scale)}px Arial`;
        const avgTemp = (comfortRange.tempMin + comfortRange.tempMax) / 2;
        const avgRh = (comfortRange.rhMin + comfortRange.rhMax) / 2;
        const comfortLabelX = leftPadding + avgTemp * 12 * scaleX + 10 * scaleX;
        const P_sat_comfort = 0.61078 * Math.exp((17.27 * avgTemp) / (avgTemp + 237.3));
        const comfortLabelY = bottomEdge - ((avgRh / 100) * P_sat_comfort / 4) * chartHeight;
        ctx.fillText(this.t('comfortZone'), comfortLabelX - 45 * scale, comfortLabelY);

        // Dessiner les points de mesure avec animation
        points.forEach((point, index) => {
            const { temp, humidity, color, dewPoint } = point;

            const P_sat_temp = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
            const P_v_actual = (humidity / 100) * P_sat_temp;

            const x = leftPadding + (temp + 10) * 12 * scaleX;
            const y = bottomEdge - (P_v_actual / 4) * chartHeight;

            // Dessiner le point avec effet pulse
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 6 * scale, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = darkMode ? "#ffffff" : "#000000";
            ctx.lineWidth = 2 * scale;
            ctx.stroke();

            // Ajouter un halo pour plus de visibilité
            ctx.beginPath();
            ctx.arc(x, y, 10 * scale, 0, 2 * Math.PI);
            ctx.strokeStyle = color + '40';
            ctx.lineWidth = 3 * scale;
            ctx.stroke();

            // Dessiner les lignes pointillées
            ctx.strokeStyle = color;
            ctx.setLineDash([5 * scale, 5 * scale]);
            ctx.lineWidth = 1 * scale;

            // Ligne verticale vers l'axe X
            ctx.beginPath();
            ctx.moveTo(x, bottomEdge);
            ctx.lineTo(x, y);
            ctx.stroke();

            // Ligne horizontale vers l'axe Y
            ctx.beginPath();
            ctx.moveTo(leftPadding, y);
            ctx.lineTo(x, y);
            ctx.stroke();

            // Dessiner le point de rosée si demandé
            if (showDewPoint && displayMode !== "minimal") {
                const dewP_sat = 0.61078 * Math.exp((17.27 * dewPoint) / (dewPoint + 237.3));
                const dewX = leftPadding + (dewPoint + 10) * 12 * scaleX;
                const dewY = bottomEdge - (dewP_sat / 4) * chartHeight;

                // Point de rosée
                ctx.beginPath();
                ctx.arc(dewX, dewY, 4 * scale, 0, 2 * Math.PI);
                ctx.fillStyle = "rgba(0, 0, 255, 0.5)";
                ctx.fill();

                // Ligne du point actuel au point de rosée
                ctx.beginPath();
                ctx.setLineDash([3 * scale, 3 * scale]);
                ctx.strokeStyle = "rgba(0, 0, 255, 0.5)";
                ctx.lineWidth = 1 * scale;
                ctx.moveTo(x, y);
                ctx.lineTo(dewX, dewY);
                ctx.stroke();

                // Rétablir le style
                ctx.setLineDash([]);
            }

            // Ajouter une étiquette au point
            if (this.config.showPointLabels !== false) {
                ctx.fillStyle = textColor;
                ctx.font = `${Math.max(10, 10 * scale)}px Arial`;
                ctx.fillText(point.label, x + 10 * scaleX, y - 10 * scaleY);
            }
        });
    }

    calculateDewPoint(temp, humidity) {
        const A = 17.27;
        const B = 237.3;
        const alpha = ((A * temp) / (B + temp)) + Math.log(humidity / 100);
        return (B * alpha) / (A - alpha);
    }

    calculateWaterContent(temp, humidity) {
        const P = 101.325;
        const P_sat = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
        const P_v = (humidity / 100) * P_sat;
        return 0.622 * (P_v / (P - P_v));
    }

    calculateEnthalpy(temp, waterContent) {
        return 1.006 * temp + waterContent * (2501 + 1.84 * temp);
    }

    calculateAbsoluteHumidity(temp, rh) {
        // Calcul de l'humidité absolue en g/m³
        // Formule : ρv = (Pv × 1000) / (Rv × T)
        // Rv = 461.5 J/(kg·K) - constante spécifique de la vapeur d'eau
        const P_sat = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
        const P_v = (rh / 100) * P_sat; // kPa

        // Conversion : kPa → Pa → kg/m³ → g/m³
        const P_v_Pa = P_v * 1000; // kPa vers Pa
        const absHumidity_kg = P_v_Pa / (461.5 * (temp + 273.15)); // kg/m³
        return absHumidity_kg * 1000; // g/m³
    }

    calculateWetBulbTemp(temp, rh) {
        // Calcul approximatif de la température de bulbe humide
        // Utilisation de la formule simplifiée de Stull
        const tw = temp * Math.atan(0.151977 * Math.pow(rh + 8.313659, 0.5)) 
                + Math.atan(temp + rh) - Math.atan(rh - 1.676331) 
                + 0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) - 4.686035;
        return tw;
    }

    calculateVaporPressure(temp, rh) {
        // Pression de vapeur en kPa
        return 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3)) * (rh / 100);
    }

    calculateSpecificVolume(temp, rh) {
        // Volume spécifique de l'air humide en m³/kg
        const P = 101.325; // Pression atmosphérique en kPa
        const Rd = 287.058; // Constante des gaz parfaits pour l'air sec en J/(kg·K)
        const T = temp + 273.15; // Température en Kelvin
        const P_v = this.calculateVaporPressure(temp, rh);
        const W = this.calculateWaterContent(temp, rh);
        
        // Volume spécifique de l'air humide
        return (Rd * T) / (P - P_v) * (1 + 1.608 * W);
    }

    calculateMoldRisk(temp, humidity) {
        // ⚠️ NOTE : Heuristique simplifiée, pas un calcul scientifique validé
        // Pour une évaluation précise, utilisez les modèles VTT ou IEA Annex 55
        // Calcul du risque de moisissure (échelle 0-6)
        // Basé sur les conditions favorables à la croissance des moisissures
        
        let risk = 0;
        
        // Facteur de température
        if (temp < 5) {
            risk += 0; // Trop froid pour les moisissures
        } else if (temp >= 5 && temp < 15) {
            risk += 1; // Risque faible
        } else if (temp >= 15 && temp < 20) {
            risk += 2; // Risque modéré
        } else if (temp >= 20 && temp < 25) {
            risk += 3; // Risque élevé
        } else if (temp >= 25) {
            risk += 2.5; // Un peu moins favorable que 20-25°C
        }
        
        // Facteur d'humidité
        if (humidity < 60) {
            risk += 0; // Trop sec pour les moisissures
        } else if (humidity >= 60 && humidity < 70) {
            risk += 1; // Début de risque
        } else if (humidity >= 70 && humidity < 80) {
            risk += 2; // Risque modéré
        } else if (humidity >= 80 && humidity < 90) {
            risk += 2.5; // Risque élevé
        } else if (humidity >= 90) {
            risk += 3; // Risque très élevé
        }
        
        // Point de rosée et température des surfaces
        const dewPoint = this.calculateDewPoint(temp, humidity);
        if (dewPoint > 12) {
            risk += 0.5;
        }
        
        return Math.min(risk, 6); // Limiter à 6 (échelle 0-6)
    }

    calculatePMV(temp, humidity) {
        // ⚠️ AVERTISSEMENT : Calcul PMV très simplifié, à titre indicatif uniquement
        // Ce calcul ne suit PAS la norme ISO 7730 complète (nécessiterait ~50 lignes)
        // Pour une évaluation précise du confort thermique, utilisez un logiciel spécialisé
        // Paramètres standards: vêtements=0.7 clo, activité=1.2 met, vitesse air=0.1 m/s
        
        // Conversion en paramètres nécessaires
        const ta = temp; // Température de l'air
        const tr = temp; // Température radiante (supposée égale à la température de l'air)
        const vel = 0.1; // Vitesse de l'air (m/s)
        const rh_fraction = humidity / 100;
        const clo = 0.7; // Isolation des vêtements
        const met = 1.2; // Niveau d'activité métabolique
        
        // Facteurs de correction basés sur les formules de Fanger
        const pa = rh_fraction * 10 * Math.exp(16.6536 - 4030.183 / (ta + 235)); // Pression de vapeur
        
        // Calcul simplifié du PMV basé sur une approximation de l'équation de Fanger
        let pmv = 0.303 * Math.exp(-0.036 * met) + 0.028;
        pmv *= (met - 58.15) - 0.42 * (met - 50) - 0.0173 * met * (5.87 - pa) 
             - 0.0014 * met * (34 - ta) - 3.96 * Math.pow(10, -8) * 0.7 * (Math.pow(tr + 273, 4) - Math.pow(ta + 273, 4))
             - 0.072 * 0.7 * (34 - ta) - 0.054 * (5.87 - pa);
        
        // Ajustement pour la vitesse de l'air
        if (vel > 0.1) {
            pmv -= 0.2223 * (1 - Math.exp(-1.387 * vel));
        }
        
        // Limiter PMV à la plage -3 à +3
        return Math.max(-3, Math.min(3, pmv));
    }

    calculateIdealSetpoint(temp, humidity, comfortRange) {
        // Calcul de la consigne idéale pour économiser l'énergie
        // tout en atteignant la zone de confort
        
        let idealTemp = temp;
        let idealHumidity = humidity;
        
        // Ajustement de la température
        if (temp < comfortRange.tempMin) {
            // Si trop froid, on augmente jusqu'au minimum nécessaire
            idealTemp = comfortRange.tempMin;
        } else if (temp > comfortRange.tempMax) {
            // Si trop chaud, on diminue jusqu'au maximum nécessaire
            idealTemp = comfortRange.tempMax;
        }
        
        // Ajustement de l'humidité
        if (humidity < comfortRange.rhMin) {
            // Si trop sec, humidifier jusqu'au minimum nécessaire
            idealHumidity = comfortRange.rhMin;
        } else if (humidity > comfortRange.rhMax) {
            // Si trop humide, déshumidifier jusqu'au maximum nécessaire
            idealHumidity = comfortRange.rhMax;
        }
        
        // Si les valeurs sont déjà dans la plage de confort, on suggère des valeurs optimales
        // pour l'économie d'énergie (généralement le bas de la zone de confort pour la température
        // en hiver, et le haut en été)
        const isSummer = temp > 23; // Estimation simplifiée de la saison
        
        if (idealTemp === temp && idealHumidity === humidity) {
            if (isSummer) {
                // En été, on préfère une température plus élevée pour économiser sur la clim
                idealTemp = Math.min(temp, comfortRange.tempMax);
                // Et une humidité moins élevée pour le confort
                idealHumidity = Math.max(comfortRange.rhMin, Math.min(humidity, comfortRange.rhMin + 5));
            } else {
                // En hiver, on préfère une température plus basse pour économiser sur le chauffage
                idealTemp = Math.max(temp, comfortRange.tempMin);
                // Et une humidité plus élevée pour le confort
                idealHumidity = Math.min(comfortRange.rhMax, Math.max(humidity, comfortRange.rhMax - 5));
            }
        }
        
        return { temp: idealTemp, humidity: idealHumidity };
    }

    calculateHeatingPower(temp, targetTemp, massFlowRate) {
        const cp = 1.006; // Capacité thermique de l'air en kJ/kg°C
        return massFlowRate * cp * (targetTemp - temp) * 1000; // Conversion en watts
    }

    calculateCoolingPower(temp, targetTemp, massFlowRate) {
        // Pour le refroidissement, nous prenons la valeur absolue car la puissance est toujours positive
        return Math.abs(this.calculateHeatingPower(temp, targetTemp, massFlowRate));
    }

    calculateHumidityPower(temp, humidity, targetHumidity, massFlowRate) {
        const P = 101.325;
        const P_sat = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
        const P_v_actual = (humidity / 100) * P_sat;
        const W_actual = 0.622 * (P_v_actual / (P - P_v_actual));

        const P_v_target = (targetHumidity / 100) * P_sat;
        const W_target = 0.622 * (P_v_target / (P - P_v_target));

        const deltaW = W_target - W_actual;
        const latentHeat = 2501;

        return Math.abs(deltaW * massFlowRate * latentHeat * 1000);
    }
    
    setConfig(config) {
        if (!config.points || config.points.length === 0) {
            throw new Error("La configuration doit contenir des points !");
        }
        this.config = config;
        // Initialize language from config
        this._language = this.getLanguage();
    }

    getCardSize() {
        return 3;
    }
}

customElements.define("psychrometric-chart-enhanced", PsychrometricChartEnhanced);
