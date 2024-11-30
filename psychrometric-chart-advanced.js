class PsychrometricChartFull extends HTMLElement {
    set hass(hass) {
        if (!this.config || !this.config.points || this.config.points.length === 0) {
            this.innerHTML = `<p style="color: red;">Aucun point ou entité configuré dans la carte !</p>`;
            return;
        }

        this.render(hass);
    }

    render(hass) {
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

            let action = "";
            let power = 0;

            // Vérification des besoins de réchauffement/refroidissement
            if (temp < comfortRange.tempMin) {
                action = "Réchauffer";
                power += this.calculateHeatingPower(temp, comfortRange.tempMin);
            } else if (temp > comfortRange.tempMax) {
                action = "Refroidir";
                power += this.calculateCoolingPower(temp, comfortRange.tempMax);
            }

            // Vérification des besoins d'humidification/déshumidification
            if (humidity < comfortRange.rhMin) {
                action = action ? action + " et Humidifier" : "Humidifier";
                power += this.calculateHumidityPower(temp, humidity, comfortRange.rhMin);
            } else if (humidity > comfortRange.rhMax) {
                action = action ? action + " et Déshumidifier" : "Déshumidifier";
                power += this.calculateHumidityPower(temp, humidity, comfortRange.rhMax);
            }

            return {
                temp,
                humidity,
                action,
                power,
                dewPoint: this.calculateDewPoint(temp, humidity),
                waterContent: this.calculateWaterContent(temp, humidity),
                enthalpy: this.calculateEnthalpy(temp, this.calculateWaterContent(temp, humidity)),
                color: point.color || "#ff0000",
                label: point.label || `${point.temp} & ${point.humidity}`,
            };
        });

        const validPoints = points.filter((p) => p !== null);

        if (validPoints.length === 0) {
            this.innerHTML = `<p style="color: red;">Aucune entité valide trouvée !</p>`;
            return;
        }

        const { bgColor = "#ffffff", textColor = "#333333", chartTitle = "Diagramme Psychrométrique", showCalculatedData = true, comfortRange = { tempMin: 20, tempMax: 26, rhMin: 40, rhMax: 60 }, comfortColor = "rgba(144, 238, 144, 0.5)" } = this.config;

        this.innerHTML = `
            <div style="text-align: center;">
                <h3 style="color: ${textColor};">${chartTitle}</h3>
                <canvas id="psychroChart" width="800" height="600"></canvas>
                ${
                    showCalculatedData
                        ? `<div style="margin-top: 20px; text-align: left; font-size: 14px; max-width: 800px; margin-left: auto; margin-right: auto;">
                    <p>
                        <strong>Points affichés :</strong><br>
                        ${validPoints
                            .map(
                                (p) => `
                                <span style="color: ${p.color}; font-weight: bold;">
                                    ${p.label} :
                                </span><br>
                                Température : ${p.temp.toFixed(1)}°C<br>
                                Humidité relative : ${p.humidity.toFixed(1)}%<br>
                                Action requise : ${p.action || "Aucune"}<br>
                                Puissance estimée : ${p.power.toFixed(1)} W<br>
                                Température de rosée : ${p.dewPoint.toFixed(1)}°C<br>
                                Teneur en eau : ${p.waterContent.toFixed(4)} kg/kg d'air sec<br>
                                Enthalpie : ${p.enthalpy.toFixed(1)} kJ/kg
                            `
                            )
                            .join("<br><br>")}
                    </p>
                </div>`
                        : ""
                }
            </div>
        `;

        this.drawFullPsychrometricChart(validPoints, { bgColor, textColor, comfortRange, comfortColor });
    }

    drawFullPsychrometricChart(points, options) {
        const canvas = this.querySelector("#psychroChart");
        const ctx = canvas.getContext("2d");

        const { bgColor, textColor, comfortRange, comfortColor } = options;

        // Fond
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Quadrillage
        ctx.strokeStyle = "#cccccc";
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);

        // Grilles horizontales (pression de vapeur)
        for (let i = 0; i <= 4; i += 0.5) {
            const y = 550 - (i / 4) * 500;
            ctx.beginPath();
            ctx.moveTo(50, y);
            ctx.lineTo(750, y);
            ctx.stroke();
            ctx.fillStyle = textColor;
            ctx.fillText(`${i.toFixed(1)} kPa`, 10, y + 5);
        }

        // Grilles verticales (température)
        for (let i = -10; i <= 50; i += 5) {
            const x = 50 + (i + 10) * 12;
            ctx.beginPath();
            ctx.moveTo(x, 550);
            ctx.lineTo(x, 50);
            ctx.stroke();
            ctx.fillStyle = textColor;
            ctx.fillText(`${i}°C`, x - 10, 570);
        }

        ctx.setLineDash([]); // Réinitialiser les lignes pleines pour les courbes

        // Courbes d'humidité relative
        ctx.strokeStyle = "#1f77b4";
        ctx.font = "12px Arial";
        ctx.fillStyle = "#1f77b4";
        for (let rh = 10; rh <= 100; rh += 10) {
            ctx.beginPath();
            let lastX = 0, lastY = 0;

            for (let t = -10; t <= 50; t++) {
                const P_sat = 0.61078 * Math.exp((17.27 * t) / (t + 237.3));
                const P_v = (rh / 100) * P_sat;

                const x = 50 + (t + 10) * 12;
                const y = 550 - (P_v / 4) * 500;

                ctx.lineTo(x, y);
                lastX = x;
                lastY = y;
            }

            ctx.stroke();
            ctx.fillText(`${rh}%`, lastX + 5, lastY + 5);
        }

        // Zone de confort
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

        // Points
        points.forEach((point) => {
            const { temp, humidity, color } = point;

            const P_sat_temp = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
            const P_v_actual = (humidity / 100) * P_sat_temp;

            const x = 50 + (temp + 10) * 12;
            const y = 550 - (P_v_actual / 4) * 500;

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fill();

            // Lignes pointillées vers les axes
            ctx.strokeStyle = color;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(x, 550);
            ctx.lineTo(x, y);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(50, y);
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.setLineDash([]);
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

    calculateHeatingPower(temp, targetTemp) {
        const airFlow = 0.5;
        const cp = 1.006;
        return airFlow * cp * (targetTemp - temp) * 1000;
    }

    calculateCoolingPower(temp, targetTemp) {
        return this.calculateHeatingPower(temp, targetTemp);
    }

    calculateHumidityPower(temp, humidity, targetHumidity) {
        const P = 101.325;
        const P_sat = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
        const P_v_actual = (humidity / 100) * P_sat;
        const W_actual = 0.622 * (P_v_actual / (P - P_v_actual));

        const P_v_target = (targetHumidity / 100) * P_sat;
        const W_target = 0.622 * (P_v_target / (P - P_v_target));

        const deltaW = W_target - W_actual;
        const airFlow = 0.5;
        const latentHeat = 2501;

        return Math.abs(deltaW * airFlow * latentHeat * 1000);
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

customElements.define("psychrometric-chart-full", PsychrometricChartFull);
