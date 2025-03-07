class PsychrometricChartEnhanced extends HTMLElement {
    set hass(hass) {
        if (!this.config || !this.config.points || this.config.points.length === 0) {
            this.innerHTML = `<p style="color: red;">Aucun point ou entité configuré dans la carte !</p>`;
            return;
        }

        this.render(hass);
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
                inComfortZone: this.isInComfortZone(temp, humidity, comfortRange)
            };
        });

        const validPoints = points.filter((p) => p !== null);

        if (validPoints.length === 0) {
            this.innerHTML = `<p style="color: red;">Aucune entité valide trouvée !</p>`;
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

        // Appliquer le thème sombre si activé
        const actualBgColor = darkMode ? "#121212" : bgColor;
        const actualTextColor = darkMode ? "#ffffff" : textColor;
        const actualGridColor = darkMode ? "#333333" : gridColor;

        // Construction du HTML pour les données calculées
        const calculatedDataHTML = showCalculatedData
            ? `
            <div class="psychro-data" style="margin-top: 20px; text-align: left; font-size: 14px; max-width: 800px; margin-left: auto; margin-right: auto; display: grid; grid-template-columns: repeat(${validPoints.length > 2 ? 2 : 1}, minmax(300px, 1fr)); gap: 20px;">
                ${validPoints
                    .map(
                        (p) => `
                    <div class="psychro-point-data" style="padding: 15px; border-radius: 10px; background-color: ${darkMode ? '#2d2d2d' : '#f5f5f5'}; border-left: 5px solid ${p.color};">
                        <div style="display: flex; align-items: center; margin-bottom: 10px;">
                            <ha-icon icon="${p.icon}" style="margin-right: 8px; color: ${p.color};"></ha-icon>
                            <span style="color: ${p.color}; font-weight: bold; font-size: 16px;">
                                ${p.label}
                            </span>
                            ${p.inComfortZone ? 
                                `<span style="margin-left: auto; background-color: #4CAF50; color: white; padding: 3px 8px; border-radius: 12px; font-size: 12px;">Confort optimal</span>` : 
                                `<span style="margin-left: auto; background-color: #FF9800; color: white; padding: 3px 8px; border-radius: 12px; font-size: 12px;">Hors zone confort</span>`
                            }
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div>
                                <div style="margin-bottom: 5px;"><strong>Température:</strong> ${p.temp.toFixed(1)}°C</div>
                                <div style="margin-bottom: 5px;"><strong>Humidité relative:</strong> ${p.humidity.toFixed(1)}%</div>
                                <div style="margin-bottom: 5px;"><strong>Point de rosée:</strong> ${p.dewPoint.toFixed(1)}°C</div>
                                <div style="margin-bottom: 5px;"><strong>Température humide:</strong> ${p.wetBulbTemp.toFixed(1)}°C</div>
                                <div style="margin-bottom: 5px;"><strong>Enthalpie:</strong> ${p.enthalpy.toFixed(1)} kJ/kg</div>
                            </div>
                            <div>
                                <div style="margin-bottom: 5px;"><strong>Teneur en eau:</strong> ${p.waterContent.toFixed(4)} kg/kg</div>
                                <div style="margin-bottom: 5px;"><strong>Humidité absolue:</strong> ${p.absoluteHumidity.toFixed(2)} g/m³</div>
                                <div style="margin-bottom: 5px;"><strong>Volume spécifique:</strong> ${p.specificVolume.toFixed(3)} m³/kg</div>
                                <div style="margin-bottom: 5px;"><strong>Indice PMV:</strong> ${p.pmv.toFixed(2)}</div>
                                ${showMoldRisk ? `<div style="margin-bottom: 5px;"><strong>Risque moisissure:</strong> <span style="color: ${this.getMoldRiskColor(p.moldRisk)};">${this.getMoldRiskText(p.moldRisk)}</span></div>` : ''}
                            </div>
                        </div>

                        ${p.action ? `
                        <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid ${darkMode ? '#555' : '#ddd'};">
                            <div style="margin-bottom: 5px;"><strong>Action recommandée:</strong> ${p.action}</div>
                            <div style="margin-bottom: 5px;"><strong>Puissance totale:</strong> ${p.power.toFixed(1)} W</div>
                            ${p.heatingPower > 0 ? `<div style="margin-bottom: 5px;"><strong>Puissance chauffage:</strong> ${p.heatingPower.toFixed(1)} W</div>` : ''}
                            ${p.coolingPower > 0 ? `<div style="margin-bottom: 5px;"><strong>Puissance refroidissement:</strong> ${p.coolingPower.toFixed(1)} W</div>` : ''}
                            ${p.humidificationPower > 0 ? `<div style="margin-bottom: 5px;"><strong>Puissance humidification:</strong> ${p.humidificationPower.toFixed(1)} W</div>` : ''}
                            ${p.dehumidificationPower > 0 ? `<div style="margin-bottom: 5px;"><strong>Puissance déshumidification:</strong> ${p.dehumidificationPower.toFixed(1)} W</div>` : ''}
                            <div style="margin-bottom: 5px;"><strong>Consigne idéale:</strong> ${p.idealSetpoint.temp.toFixed(1)}°C, ${p.idealSetpoint.humidity.toFixed(0)}%</div>
                        </div>
                        ` : ''}
                    </div>
                `
                    )
                    .join("")}
            </div>`
            : "";

        // Construction du HTML principal
        this.innerHTML = `
            <ha-card>
                <div style="text-align: center; padding: 16px; background-color: ${actualBgColor}; color: ${actualTextColor};">
                    <h2 style="margin-top: 0; margin-bottom: 16px; color: ${actualTextColor};">${chartTitle}</h2>
                    <div style="position: relative;">
                        <canvas id="psychroChart" width="800" height="600"></canvas>
                        ${showLegend ? this.generateLegendHTML(validPoints, actualTextColor) : ''}
                    </div>
                    ${calculatedDataHTML}
                </div>
            </ha-card>
        `;

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
    }

    generateLegendHTML(points, textColor) {
        return `
            <div style="position: absolute; top: 10px; right: 10px; background-color: rgba(255,255,255,0.7); padding: 10px; border-radius: 5px; text-align: left;">
                <div style="margin-bottom: 5px; font-weight: bold; color: ${textColor};">Légende</div>
                ${points.map(p => `
                    <div style="display: flex; align-items: center; margin-bottom: 3px;">
                        <span style="width: 12px; height: 12px; background-color: ${p.color}; display: inline-block; margin-right: 5px; border-radius: 50%;"></span>
                        <span style="color: ${textColor};">${p.label}</span>
                    </div>
                `).join('')}
            </div>
        `;
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
        const texts = [
            "Aucun risque",
            "Très faible",
            "Faible",
            "Modéré",
            "Élevé",
            "Très élevé",
            "Critique"
        ];
        return texts[Math.min(Math.floor(riskLevel), 6)];
    }
    
    drawFullPsychrometricChart(points, options) {
        const canvas = this.querySelector("#psychroChart");
        const ctx = canvas.getContext("2d");

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

        // Effacer le canvas
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dessiner les axes et le quadrillage
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);

        // Axes de pression de vapeur (vertical)
        for (let i = 0; i <= 4; i += 0.5) {
            const y = 550 - (i / 4) * 500;
            ctx.beginPath();
            ctx.moveTo(50, y);
            ctx.lineTo(750, y);
            ctx.stroke();
            ctx.fillStyle = textColor;
            ctx.fillText(`${i.toFixed(1)} kPa`, 10, y + 5);
        }

        // Axes de température (horizontal)
        for (let i = -10; i <= 50; i += 5) {
            const x = 50 + (i + 10) * 12;
            ctx.beginPath();
            ctx.moveTo(x, 550);
            ctx.lineTo(x, 50);
            ctx.stroke();
            ctx.fillStyle = textColor;
            ctx.fillText(`${i}°C`, x - 10, 570);
        }

        // Dessiner les courbes d'humidité relative
        ctx.setLineDash([]);
        ctx.font = "12px Arial";

        for (let rh = 10; rh <= 100; rh += 10) {
            ctx.beginPath();
            ctx.strokeStyle = rh === 100 ? "rgba(30, 144, 255, 0.8)" : curveColor;
            ctx.lineWidth = rh % 20 === 0 ? 1.5 : 0.8;
            
            let lastX = 0, lastY = 0;

            for (let t = -10; t <= 50; t++) {
                const P_sat = 0.61078 * Math.exp((17.27 * t) / (t + 237.3));
                const P_v = (rh / 100) * P_sat;

                const x = 50 + (t + 10) * 12;
                const y = 550 - (P_v / 4) * 500;

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
            ctx.fillText(`${rh}%`, lastX + 5, lastY);
        }


        // Dessiner les courbes d'enthalpie si demandé
        if (showEnthalpy && displayMode !== "minimal") {
            ctx.setLineDash([2, 3]);
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
                            const x = 50 + (t + 10) * 12;
                            const y = 550 - (P_v / 4) * 500;
                            
                            if (!drawn) {
                                ctx.moveTo(x, y);
                                drawn = true;
                            } else {
                                ctx.lineTo(x, y);
                            }
                            
                            // Stocke les points pour choisir un bon emplacement pour l'étiquette
                            enthalpy_points.push({x, y});
                            break;
                        }
                    }
                }
                
                ctx.stroke();
                
                // Ajouter une étiquette pour les courbes d'enthalpie
                if (drawn && enthalpy_points.length > 0) {
                    ctx.fillStyle = darkMode ? "rgba(255, 165, 0, 0.9)" : "rgba(255, 99, 71, 0.9)";
                    
                    // Choisir un point près du bord droit pour placer l'étiquette
                    // Tri des points par coordonnée x décroissante (pour être proche du bord droit)
                    enthalpy_points.sort((a, b) => b.x - a.x);
                    
                    // Sélectionner un point qui est visible sur le graphique (pas trop haut ni trop bas)
                    let labelPoint = null;
                    for (const point of enthalpy_points) {
                        if (point.y > 70 && point.y < 500 && point.x > 400) {
                            labelPoint = point;
                            break;
                        }
                    }
                    
                    // Si aucun point idéal n'est trouvé, prendre le premier point visible
                    if (!labelPoint) {
                        for (const point of enthalpy_points) {
                            if (point.y > 70 && point.y < 500) {
                                labelPoint = point;
                                break;
                            }
                        }
                    }
                    
                    // S'il y a un point valide, afficher l'étiquette
                    if (labelPoint) {
                        // Rotation du contexte pour aligner le texte avec la courbe
                        ctx.save();
                        
                        // Trouver un point voisin pour calculer la pente
                        const neighborIndex = enthalpy_points.indexOf(labelPoint);
                        const neighborPoint = enthalpy_points[Math.max(0, neighborIndex - 5)];
                        
                        if (neighborPoint) {
                            // Calculer l'angle de la courbe
                            const angleRad = Math.atan2(neighborPoint.y - labelPoint.y, neighborPoint.x - labelPoint.x);
                            
                            // Translater au point d'étiquette
                            ctx.translate(labelPoint.x, labelPoint.y);
                            ctx.rotate(angleRad);
                            
                            // Dessiner le texte le long de la courbe
                            ctx.fillText(`${h} kJ/kg`, 5, -5);
                        } else {
                            // Si pas de point voisin, simplement placer l'étiquette sans rotation
                            ctx.fillText(`${h} kJ/kg`, labelPoint.x + 5, labelPoint.y - 5);
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
            const x = 50 + (point.temp + 10) * 12;
            const y = 550 - (P_v / 4) * 500;
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();
        
        // Ajouter un texte pour la zone de confort
        ctx.fillStyle = darkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)";
        ctx.font = "14px Arial";
        const comfortLabelX = 50 + (comfortRange.tempMin + comfortRange.tempMax) / 2 * 12 + 10;
        const comfortLabelY = 550 - ((comfortRange.rhMin + comfortRange.rhMax) / 2 / 100 * 0.61078 * Math.exp((17.27 * ((comfortRange.tempMin + comfortRange.tempMax) / 2)) / (((comfortRange.tempMin + comfortRange.tempMax) / 2) + 237.3)) / 4) * 500;
        ctx.fillText("Zone de confort", comfortLabelX - 45, comfortLabelY);

        // Dessiner les points de mesure
        points.forEach((point) => {
            const { temp, humidity, color, dewPoint } = point;

            const P_sat_temp = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
            const P_v_actual = (humidity / 100) * P_sat_temp;

            const x = 50 + (temp + 10) * 12;
            const y = 550 - (P_v_actual / 4) * 500;

            // Dessiner le point
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = darkMode ? "#ffffff" : "#000000";
            ctx.lineWidth = 1;
            ctx.stroke();

            // Dessiner les lignes pointillées
            ctx.strokeStyle = color;
            ctx.setLineDash([5, 5]);
            
            // Ligne verticale vers l'axe X
            ctx.beginPath();
            ctx.moveTo(x, 550);
            ctx.lineTo(x, y);
            ctx.stroke();

            // Ligne horizontale vers l'axe Y
            ctx.beginPath();
            ctx.moveTo(50, y);
            ctx.lineTo(x, y);
            ctx.stroke();
            
            // Dessiner le point de rosée si demandé
            if (showDewPoint && displayMode !== "minimal") {
                const dewP_sat = 0.61078 * Math.exp((17.27 * dewPoint) / (dewPoint + 237.3));
                const dewX = 50 + (dewPoint + 10) * 12;
                const dewY = 550 - (dewP_sat / 4) * 500;
                
                // Point de rosée
                ctx.beginPath();
                ctx.arc(dewX, dewY, 4, 0, 2 * Math.PI);
                ctx.fillStyle = "rgba(0, 0, 255, 0.5)";
                ctx.fill();
                
                // Ligne du point actuel au point de rosée
                ctx.beginPath();
                ctx.setLineDash([3, 3]);
                ctx.strokeStyle = "rgba(0, 0, 255, 0.5)";
                ctx.moveTo(x, y);
                ctx.lineTo(dewX, dewY);
                ctx.stroke();
                
                // Rétablir le style
                ctx.setLineDash([]);
            }
            
            // Ajouter une étiquette au point
            if (this.config.showPointLabels !== false) {
                ctx.fillStyle = textColor;
                ctx.font = "10px Arial";
                ctx.fillText(point.label, x + 10, y - 10);
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
        const P_sat = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
        const P_v = (rh / 100) * P_sat;
        const absHumidity = (P_v * 1000) / (461.5 * (temp + 273.15));
        return absHumidity * 1000; // Conversion en g/m³
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
        // Calcul de l'indice PMV (Predicted Mean Vote) simplifié
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
    }

    getCardSize() {
        return 3;
    }
}

customElements.define("psychrometric-chart-enhanced", PsychrometricChartEnhanced);