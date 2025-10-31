<div align="center">
  <img src="icon.svg" alt="Psychrometric Chart Logo" width="200"/>

  # Psychrometric Chart for Home Assistant

  [![hacs_badge](https://img.shields.io/badge/HACS-Default-41BDF5.svg)](https://github.com/hacs/integration)
  [![GitHub release](https://img.shields.io/github/release/guiohm79/psychrometric-chart-advanced.svg)](https://github.com/guiohm79/psychrometric-chart-advanced/releases)
  [![License](https://img.shields.io/github/license/guiohm79/psychrometric-chart-advanced.svg)](LICENSE)

  **Language:** [🇬🇧 English](README.md) | [🇫🇷 Français](README.fr.md)
</div>

<img width="589" alt="image" src="https://github.com/guiohm79/psychrometric-chart-advanced/blob/main/Capture.png">



## Description

This project provides a custom card for **Home Assistant**, allowing you to visualize a **psychrometric chart** based on temperature and humidity data from sensors. The card also calculates key values such as enthalpy, water content, and dew point. It indicates whether actions are needed to heat, cool, humidify, or dehumidify, while estimating the power required to reach the **comfort zone**.

## Features

### 📊 Advanced Visualization
- **Interactive psychrometric chart** fully responsive
- **Modern design** with glassmorphism effects and smooth animations
- **Adaptive chart** that automatically adjusts to screen size (mobile, tablet, desktop)
- **Hover tooltips** on points with detailed information

### 📈 Data History
- **Elegant modal popup** displaying 24-hour history
- **Evolution charts** for temperature and humidity
- **Detailed statistics**: min, max, average
- **Click on values** of temperature or humidity to see history
- Native integration with Home Assistant's History API

### 🎨 Enhanced User Interface
- **Modern cards** with gradients, shadows, and depth effects
- **Smooth animations** during loading and interactions
- **Status badges** indicating if values are in the comfort zone
- **Emoji icons** for better readability
- **Dark mode** optimized with improved contrast

### 📐 Customizable Comfort Zone
- Adjustable min/max temperature
- Configurable min/max relative humidity
- Customizable color for the zone
- Clear visual indicators

### 🔬 Scientific Calculations Displayed
- Dew point temperature
- Water content
- Enthalpy
- Absolute humidity
- Wet bulb temperature
- Specific volume
- PMV index (thermal comfort)
- Mold risk with color code
- Estimated power for heating/cooling/humidifying/dehumidifying

### ⚙️ Advanced Chart Options
- Relative humidity curves (10% to 100%)
- Optional enthalpy curves
- Visualized dew points
- Dotted lines to axes
- Animated and customizable legend
- Adjustable mass flow rate for precise power calculations

### 🌍 Multilingual
- **English** and **French** interface
- Configurable via `language` parameter
- All labels and messages translated

### 🔍 Zoom and Navigation
- **YAML-configurable zoom**: define a specific temperature range to display
- **Centered zoom**: configured range is automatically centered on the chart
- Ideal for focusing on a specific temperature zone (e.g., 15°C-30°C)

---

## Installation

### Via HACS (recommended)

1. Make sure you have [HACS](https://hacs.xyz/) installed in Home Assistant
2. Open HACS in Home Assistant
3. Go to "Frontend"
4. Click the "+" button in the bottom right
5. Search for "Psychrometric Chart"
6. Click "Install"
7. Restart Home Assistant

### Manual Installation

1. **Download the files** from this repository
2. Place the **`psychrometric-chart-advanced.js`** file in the **`www/custom-lovelace/psychrometric/`** folder of your Home Assistant installation
3. Add the file to your dashboard via **Configuration > Dashboards > Resources**:
   - URL: `/local/custom-lovelace/psychrometric/psychrometric-chart-advanced.js`
   - Type: **JavaScript Module**
4. Reload the Lovelace interface in Home Assistant (CTRL+F5 or clear cache)

### Prerequisites

- Home Assistant 2024.1.0 or higher
- **History** must be enabled in your Home Assistant configuration to use the history feature

---

## Usage

Add this YAML configuration to your dashboard in **Home Assistant**:

```yaml
type: custom:psychrometric-chart-enhanced
language: en  # 'en' for English, 'fr' for French (default: 'fr')
points:
  - temp: sensor.bme680_temperature
    humidity: sensor.bme680_humidity
    color: "#ff0000"
    label: Master Bedroom
    icon: mdi:bed
  - temp: sensor.living_room_temperature
    humidity: sensor.living_room_humidity
    color: "#0000ff"
    label: Living Room
    icon: mdi:sofa
  - temp: sensor.outdoor_temperature
    humidity: sensor.outdoor_humidity
    color: "#00ff00"
    label: Outdoor
    icon: mdi:weather-sunny
bgColor: "#000000"
textColor: "#ffffff"
gridColor: rgba(0, 238, 254, 0.15)
curveColor: "#3B58DD"
showCalculatedData: true
comfortRange:
  tempMin: 18
  tempMax: 22
  rhMin: 40
  rhMax: 60
comfortColor: rgba(144, 238, 144, 0.3)
massFlowRate: 0.5
chartTitle: Psychrometric Chart
darkMode: true
showMoldRisk: true
displayMode: standard
showEnthalpy: true
showLegend: false
showPointLabels: true

# Zoom options (optional)
zoom_temp_min: 15      # Minimum temperature to display (°C)
zoom_temp_max: 30      # Maximum temperature to display (°C)
zoom_humidity_min: 30  # Minimum humidity to display (%) - optional
zoom_humidity_max: 70  # Maximum humidity to display (%) - optional
```

### Configuration Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | string | **Yes** | - | Must be `custom:psychrometric-chart-enhanced` |
| `language` | string | No | `fr` | Interface language: `en` (English) or `fr` (French) |
| `points` | list | **Yes** | - | List of sensor points to display |
| `points[].temp` | string | **Yes** | - | Temperature sensor entity ID |
| `points[].humidity` | string | **Yes** | - | Humidity sensor entity ID |
| `points[].color` | string | No | Random | Point color (hex format) |
| `points[].label` | string | No | - | Point label |
| `points[].icon` | string | No | `mdi:home` | MDI icon |
| `bgColor` | string | No | `#ffffff` | Background color |
| `textColor` | string | No | `#000000` | Text color |
| `gridColor` | string | No | `rgba(0,0,0,0.15)` | Grid color |
| `curveColor` | string | No | `#3B58DD` | Humidity curves color |
| `showCalculatedData` | boolean | No | `true` | Show calculated data cards |
| `comfortRange` | object | No | - | Comfort zone configuration |
| `comfortRange.tempMin` | number | No | `18` | Minimum comfort temperature (°C) |
| `comfortRange.tempMax` | number | No | `22` | Maximum comfort temperature (°C) |
| `comfortRange.rhMin` | number | No | `40` | Minimum comfort relative humidity (%) |
| `comfortRange.rhMax` | number | No | `60` | Maximum comfort relative humidity (%) |
| `comfortColor` | string | No | `rgba(144,238,144,0.3)` | Comfort zone color |
| `massFlowRate` | number | No | `0.5` | Mass flow rate (kg/s) for power calculations |
| `chartTitle` | string | No | `Psychrometric Chart` | Chart title |
| `darkMode` | boolean | No | `false` | Enable dark mode |
| `showMoldRisk` | boolean | No | `true` | Display mold risk indicator |
| `displayMode` | string | No | `standard` | Display mode: `minimal`, `standard`, or `advanced` |
| `showEnthalpy` | boolean | No | `false` | Show enthalpy curves |
| `showLegend` | boolean | No | `true` | Show legend |
| `showPointLabels` | boolean | No | `true` | Show point labels on chart |
| `zoom_temp_min` | number | No | `null` | Minimum temperature to display (°C) - enables auto zoom |
| `zoom_temp_max` | number | No | `null` | Maximum temperature to display (°C) - must be > zoom_temp_min |
| `zoom_humidity_min` | number | No | `null` | Minimum humidity to display (%) - optional vertical centering |
| `zoom_humidity_max` | number | No | `null` | Maximum humidity to display (%) - must be > zoom_humidity_min |

---

## Display Modes

The `displayMode` parameter allows you to control the level of detail shown in the calculated data section. Three modes are available:

### 🔹 minimal
Shows only basic measurements:
- Temperature
- Humidity
- Comfort status badges

### 🔹 standard (default)
Shows basic measurements plus key psychrometric calculations:
- Temperature
- Humidity
- Comfort status badges
- Dew point
- Wet bulb temperature
- Enthalpy
- PMV Index (thermal comfort)

### 🔹 advanced
Shows all available calculations and recommendations:
- All data from standard mode
- Water content
- Absolute humidity
- Specific volume
- Mold risk (if `showMoldRisk: true`)
- Action recommendations (heat, cool, humidify, dehumidify)
- Power calculations for each action
- Ideal setpoint

**Example:**
```yaml
type: custom:psychrometric-chart-enhanced
displayMode: minimal  # or 'standard' or 'advanced'
# ... other parameters
```

---

## Zoom Configuration

The psychrometric chart supports zoom to focus on a specific temperature range. This is particularly useful if you want to see details in a restricted area (e.g., 15°C to 30°C for a home).

### Zoom Options

The zoom feature allows you to:
- **Define a temperature range** via YAML configuration (`zoom_temp_min` and `zoom_temp_max`)
- **Optionally define a humidity range** for vertical centering (`zoom_humidity_min` and `zoom_humidity_max`)
- The chart automatically centers and scales to display the configured range

### Example: Zoom on 15°C - 30°C

```yaml
type: custom:psychrometric-chart-enhanced
points:
  - temp: sensor.temperature
    humidity: sensor.humidity
    color: "#ff0000"
    label: Living Room
zoom_temp_min: 15
zoom_temp_max: 30
```

### Example: Full zoom (temperature + humidity)

```yaml
type: custom:psychrometric-chart-enhanced
points:
  - temp: sensor.temperature
    humidity: sensor.humidity
    color: "#ff0000"
    label: Bedroom
zoom_temp_min: 18
zoom_temp_max: 26
zoom_humidity_min: 40
zoom_humidity_max: 60
```

---

## Screenshots

### Comfort Zone Visualization
The chart clearly displays the comfort zone with customizable temperature and humidity ranges.

### Data History Modal
Click on any temperature or humidity value to open an elegant modal showing the last 24 hours of data with statistics and evolution charts.

### Multi-sensor Tracking
Track multiple rooms or zones simultaneously with color-coded points and detailed information for each sensor.

---

## Technical Details

### Psychrometric Calculations

The card uses scientifically accurate formulas to calculate:

- **Dew point**: Temperature at which water vapor condenses
- **Wet bulb temperature**: Temperature measured with a wet thermometer
- **Enthalpy**: Total heat content of air (kJ/kg)
- **Water content**: Mass of water vapor per kg of dry air
- **Absolute humidity**: Mass of water vapor per m³ of air
- **Specific volume**: Volume occupied by 1 kg of dry air
- **PMV index**: Predicted Mean Vote for thermal comfort
- **Mold risk**: Assessment based on temperature and humidity

### Power Calculations

When a point is outside the comfort zone, the card estimates the power needed to:
- Heat or cool the air to reach the target temperature
- Humidify or dehumidify to reach the target humidity
- Total power is calculated based on the configured mass flow rate

---

## Contributing

Contributions are welcome! Feel free to:
- Report bugs via [GitHub Issues](https://github.com/guiohm79/psychrometric-chart-advanced/issues)
- Suggest new features
- Submit pull requests

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Changelog

See [Releases](https://github.com/guiohm79/psychrometric-chart-advanced/releases) for version history and changes.

---

## Support

If you find this project helpful, please ⭐ star the repository on GitHub!

For questions or support, please open an issue on GitHub.
