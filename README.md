# diagram-psychro
Dashboard homeassistant



# Psychrometric Chart for Home Assistant

<img width="589" alt="image" src="https://github.com/user-attachments/assets/4e711b65-335c-4865-820e-0b8c7a892be6">


## Description

Ce projet propose une carte personnalisée pour **Home Assistant**, permettant de visualiser un **diagramme psychrométrique** basé sur les données de température et d'humidité des capteurs. La carte calcule également des valeurs clés comme l'enthalpie, la teneur en eau et la température de rosée. Elle indique si des actions sont nécessaires pour réchauffer, refroidir, humidifier ou déshumidifier, tout en estimant les puissances nécessaires pour atteindre la **zone de confort**.

## Fonctionnalités

- **Visualisation du diagramme psychrométrique**.
- **Zone de confort personnalisable** :
  - Température min/max.
  - Humidité relative min/max.
  - Couleur personnalisable pour la zone.
- **Calculs affichés pour chaque point** :
  - Température de rosée.
  - Teneur en eau.
  - Enthalpie.
  - Puissances estimées pour chauffer/refroidir et humidifier/déshumidifier.
- **Options graphiques** :
  - Couleurs de fond, quadrillage et courbes.
  - Courbes d'humidité relative (10 % à 100 %).
- **Lignes pointillées** vers les axes pour chaque point.
- Débit massique ajustable pour un calcul précis de la puissance.

---

## Installation

1. **Téléchargez les fichiers** de ce dépôt.
2. Placez le fichier **`psychrometric-chart-full.js`** dans le dossier **`www/custom-lovelace/psychrometric/`** de votre installation Home Assistant.
3. Ajoutez le fichier à votre tableau de bord via **Configuration > Tableaux de bord > Ressources** :
   - URL : `/local/custom-lovelace/psychrometric/psychrometric-chart-full.js`.
   - Type : **Module**.
4. Rechargez l'interface Lovelace dans Home Assistant.

---

## Utilisation

Ajoutez cette configuration YAML à votre tableau de bord dans **Home Assistant** :

```yaml
type: custom:psychrometric-chart-enhanced
points:
  - temp: sensor.bme680_temperature
    humidity: sensor.bme680_humidite
    color: "#ff0000"
    label: Chambre parents
    icon: mdi:bed
  - temp: sensor.module_interieur_branche_chambre_noah_temperature
    humidity: sensor.module_interieur_branche_chambre_noah_humidite
    color: "#0000ff"
    label: Chambre Noah
    icon: mdi:bed
  - temp: sensor.module_interieur_branche_module_exterieur_asco_temperature
    humidity: sensor.module_interieur_branche_module_exterieur_asco_humidite
    color: "#00ff00"
    label: Exterieur
  - temp: sensor.module_interieur_branche_temperature
    humidity: sensor.module_interieur_branche_humidite
    color: "#8B4513"
    label: Salon
    icon: mdi:sofa
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
chartTitle: Diagramme Psychrométrique
darkMode: true
showMoldRisk: true
displayMode: advanced
showEnthalpy: true
showLegend: false
showPointLabels: true
