<div align="center">
  <img src="icon.svg" alt="Psychrometric Chart" width="120"/>
</div>

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=guiohm79&repository=psychrometric-chart-advanced&category=plugin)

# Diagramme Psychrométrique pour Home Assistant

Une carte moderne et interactive avec diagramme psychrométrique pour Home Assistant qui visualise les données de température et d'humidité de vos capteurs avec des calculs avancés et une interface élégante.

## Fonctionnalités

- **Diagramme psychrométrique interactif** avec design responsive
- **Visualisation des données historiques** - Cliquez sur les valeurs de température ou d'humidité pour voir l'historique sur 24h
- **Indication de la zone de confort** avec plages personnalisables
- **Calculs avancés** : point de rosée, humidité absolue, enthalpie, température humide, indice PMV
- **Estimation de puissance** pour le chauffage/refroidissement/humidification/déshumidification
- **Design moderne** avec effets de glassmorphisme et animations fluides
- **Support du mode sombre** avec contraste optimisé
- **Support multi-capteurs** - Suivez plusieurs pièces/zones simultanément
- **Multilingue** - Interface en français et anglais (configurable)

## Configuration

```yaml
type: custom:psychrometric-chart-enhanced
language: fr  # 'fr' pour français, 'en' pour anglais
points:
  - temp: sensor.temperature
    humidity: sensor.humidity
    color: "#ff0000"
    label: Salon
    icon: mdi:sofa
comfortRange:
  tempMin: 18
  tempMax: 22
  rhMin: 40
  rhMax: 60
showCalculatedData: true
darkMode: true
```

## Prérequis

- Home Assistant 2024.1.0 ou supérieur
- Intégration de l'historique activée pour la fonctionnalité de données historiques
