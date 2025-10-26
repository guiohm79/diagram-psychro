# Instructions pour soumettre à HACS

Ce document explique comment soumettre la carte Psychrometric Chart au dépôt HACS officiel.

## Étape 1 : Pousser les changements vers GitHub

Avant de soumettre à HACS, vous devez pousser le commit et le tag vers votre dépôt GitHub :

```bash
git push origin main
git push origin v1.0.0
```

## Étape 2 : Créer la Release sur GitHub

1. Allez sur : https://github.com/guiohm79/psychrometric-chart-advanced/releases
2. Cliquez sur "Draft a new release"
3. Sélectionnez le tag `v1.0.0`
4. Titre : **v1.0.0 - First HACS Release**
5. Description (copiez le texte ci-dessous) :

```markdown
## Psychrometric Chart v1.0.0 - First Official HACS Release

This is the first official release of the Psychrometric Chart for Home Assistant, now available via HACS!

### Features

- **Interactive psychrometric diagram** with responsive design
- **Historical data visualization** - Click on values to see 24h history
- **Advanced calculations**: dew point, absolute humidity, enthalpy, wet bulb temperature, PMV index
- **Power estimation** for heating/cooling/humidifying/dehumidifying
- **Modern design** with glassmorphism effects and smooth animations
- **Multi-sensor support** - Track multiple rooms/zones simultaneously
- **Comfort zone indication** with customizable ranges
- **Dark mode support** with optimized contrast

### Requirements

- Home Assistant 2024.1.0 or higher
- History integration enabled for historical data feature

### Installation

Install via HACS or manually. See [README](https://github.com/guiohm79/psychrometric-chart-advanced/blob/main/README.md) for detailed instructions.

### Configuration

```yaml
type: custom:psychrometric-chart-enhanced
points:
  - temp: sensor.temperature
    humidity: sensor.humidity
    color: "#ff0000"
    label: Living Room
comfortRange:
  tempMin: 18
  tempMax: 22
  rhMin: 40
  rhMax: 60
showCalculatedData: true
darkMode: true
```

Full changelog available in [CHANGELOG.md](https://github.com/guiohm79/psychrometric-chart-advanced/blob/main/CHANGELOG.md)
```

6. Cliquez sur "Publish release"

## Étape 3 : Vérifier les prérequis HACS

Avant de soumettre, vérifiez que votre dépôt respecte tous les critères HACS :

- [x] Fichier `hacs.json` présent à la racine
- [x] Fichier `info.md` présent à la racine
- [x] Fichier `README.md` complet
- [x] Fichier `LICENSE` présent
- [x] Au moins une release GitHub (v1.0.0)
- [x] Le dépôt est public
- [x] Le fichier JavaScript est à la racine ou dans `/dist`

## Étape 4 : Soumettre à HACS

### Option A : Soumission via Pull Request (Recommandé)

1. Allez sur le dépôt HACS : https://github.com/hacs/default
2. Forkez le dépôt
3. Éditez le fichier `plugins` (ajoutez votre dépôt à la liste) :
   ```
   guiohm79/psychrometric-chart-advanced
   ```
4. Créez une Pull Request avec le titre : **Add guiohm79/psychrometric-chart-advanced**
5. Dans la description, indiquez :
   ```
   Repository: https://github.com/guiohm79/psychrometric-chart-advanced
   Category: plugin
   Description: Interactive psychrometric chart with advanced calculations for Home Assistant
   ```

### Option B : Demande via Issue

Si vous préférez, vous pouvez créer une issue sur le dépôt HACS :

1. Allez sur : https://github.com/hacs/default/issues
2. Créez une nouvelle issue avec le template "Add repository"
3. Remplissez les informations demandées

## Étape 5 : Attendre la validation

- L'équipe HACS examine généralement les soumissions sous 3-7 jours
- Ils peuvent demander des modifications
- Une fois approuvé, votre carte sera disponible dans HACS pour tous les utilisateurs !

## Support

Si vous avez des questions durant le processus :
- Documentation HACS : https://hacs.xyz/docs/publish/start
- Discord HACS : https://discord.gg/apgchf8

## Après acceptation

Une fois votre carte acceptée dans HACS :

1. Les utilisateurs pourront l'installer via HACS
2. Les mises à jour seront automatiquement détectées quand vous créerez de nouvelles releases
3. Pensez à créer un tag/release pour chaque nouvelle version

### Créer une nouvelle version (exemple v1.1.0) :

```bash
# Faire vos modifications
git add .
git commit -m "Add new feature"

# Créer le tag
git tag -a v1.1.0 -m "Release v1.1.0 - Description des changements"

# Pousser
git push origin main
git push origin v1.1.0

# Créer la release sur GitHub
```

HACS détectera automatiquement la nouvelle version et notifiera les utilisateurs !
