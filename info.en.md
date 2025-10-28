<div align="center">
  <img src="icon.svg" alt="Psychrometric Chart" width="120"/>
</div>

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=guiohm79&repository=psychrometric-chart-advanced&category=plugin)

# Psychrometric Chart for Home Assistant

A modern, interactive psychrometric chart card for Home Assistant that visualizes temperature and humidity data from your sensors with advanced calculations and beautiful UI.

## Features

- **Interactive psychrometric diagram** with responsive design
- **Historical data visualization** - Click on temperature or humidity values to see 24h history
- **Comfort zone indication** with customizable ranges
- **Advanced calculations**: dew point, absolute humidity, enthalpy, wet bulb temperature, PMV index
- **Power estimation** for heating/cooling/humidifying/dehumidifying
- **Modern design** with glassmorphism effects and smooth animations
- **Dark mode support** with optimized contrast
- **Multi-sensor support** - Track multiple rooms/zones simultaneously
- **Multilingual** - English and French interface (configurable)

## Configuration

```yaml
type: custom:psychrometric-chart-enhanced
language: en  # 'en' for English, 'fr' for French
points:
  - temp: sensor.temperature
    humidity: sensor.humidity
    color: "#ff0000"
    label: Living Room
    icon: mdi:sofa
comfortRange:
  tempMin: 18
  tempMax: 22
  rhMin: 40
  rhMax: 60
showCalculatedData: true
darkMode: true
```

## Requirements

- Home Assistant 2024.1.0 or higher
- History integration enabled for historical data feature
