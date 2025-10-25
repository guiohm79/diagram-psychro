# 📘 Guide d'utilisation - Carte Psychrométrique V2.0

## 🚀 Démarrage rapide

### Installation en 5 minutes

1. **Téléchargez** le fichier `psychrometric-chart-advanced.js`
2. **Copiez-le** dans `/config/www/custom-lovelace/psychrometric/`
3. **Ajoutez la ressource** dans Home Assistant :
   - Allez dans **Paramètres** → **Tableaux de bord** → **Ressources**
   - Cliquez sur **Ajouter une ressource**
   - URL : `/local/custom-lovelace/psychrometric/psychrometric-chart-advanced.js`
   - Type : **Module JavaScript**
4. **Rechargez** votre tableau de bord (CTRL+F5)
5. **Ajoutez une carte** avec votre configuration YAML

---

## 🎨 Nouvelles fonctionnalités

### 1. 📱 Responsive Design

La carte s'adapte automatiquement à votre écran :

- **Mobile** : Affichage 1 colonne, graphique optimisé
- **Tablette** : Grid flexible avec 2 colonnes
- **Desktop** : Pleine largeur avec toutes les colonnes

**Aucune configuration nécessaire** - Tout est automatique !

---

### 2. 📈 Historique interactif

#### Comment l'utiliser ?

1. **Cliquez** sur une valeur de température ou d'humidité dans les cartes
2. Un **modal popup** s'ouvre automatiquement
3. Vous voyez :
   - 📊 Graphique d'évolution sur 24 heures
   - 📉 Min, Max, Moyenne
   - 🕐 Timeline avec heures
   - 📅 Nombre de points de données

#### Fermer le modal

- Cliquez sur le **X** en haut à droite
- Cliquez **à l'extérieur** du modal
- Appuyez sur **Échap** (à venir)

#### Exemple de données affichées

```
Température - Chambre parents
Min: 18.5°C | Moyenne: 20.3°C | Max: 22.1°C
Historique des dernières 24 heures (144 points de données)
```

---

### 3. 🎯 Tooltips au survol

Survolez les **points** sur le graphique psychrométrique :

- ℹ️ Un tooltip apparaît automatiquement
- 🏷️ Affiche le nom du capteur
- 🌡️ Température actuelle
- 💧 Humidité actuelle
- 💡 Indication : "Cliquer pour voir l'historique"

Le curseur change automatiquement :
- ✋ **Pointer** sur un point
- ➕ **Crosshair** ailleurs

---

### 4. ✨ Animations et design moderne

#### Animations automatiques

- **Fade-in progressif** des cartes au chargement
- **Effet cascade** : chaque carte apparaît avec un léger délai
- **Hover élégant** : les cartes s'élèvent au survol
- **Transition fluide** sur tous les éléments cliquables

#### Design glassmorphism

Les cartes utilisent des effets modernes :
- Dégradés de couleur subtils
- Ombres portées dynamiques
- Backdrop-filter blur sur la légende
- Halos lumineux autour des points

#### Mode sombre optimisé

Le mode sombre détecte automatiquement le thème Home Assistant :
```yaml
darkMode: true  # Active automatiquement le mode sombre
```

Améliorations du mode sombre :
- Contraste optimisé
- Couleurs plus douces
- Ombres adaptées
- Meilleure lisibilité

---

## ⚙️ Configuration avancée

### Options complètes

```yaml
type: custom:psychrometric-chart-enhanced

# Points de mesure
points:
  - temp: sensor.temperature_salon
    humidity: sensor.humidity_salon
    color: "#ff0000"
    label: Salon
    icon: mdi:sofa

# Apparence
bgColor: "#000000"           # Couleur de fond
textColor: "#ffffff"         # Couleur du texte
gridColor: "rgba(0, 238, 254, 0.15)"  # Couleur de la grille
curveColor: "#3B58DD"        # Couleur des courbes d'HR

# Zone de confort
comfortRange:
  tempMin: 19
  tempMax: 25
  rhMin: 40
  rhMax: 60
comfortColor: "rgba(144, 238, 144, 0.3)"  # Couleur zone confort

# Options d'affichage
showCalculatedData: true     # Afficher les cartes de données
showEnthalpy: true          # Afficher courbes d'enthalpie
showMoldRisk: true          # Afficher risque moisissure
showLegend: true            # Afficher la légende
showPointLabels: true       # Afficher labels sur points
darkMode: true              # Mode sombre

# Mode d'affichage
displayMode: advanced       # standard, minimal, advanced

# Calculs
massFlowRate: 0.5          # Débit massique pour calculs (kg/s)

# Titre
chartTitle: "Diagramme Psychrométrique"
```

---

## 🎨 Personnalisation des couleurs

### Palette recommandée

| Usage | Couleur | Code |
|-------|---------|------|
| Température chaude | Rouge | `#ff0000` |
| Température froide | Bleu | `#0000ff` |
| Extérieur | Vert | `#00ff00` |
| Principal | Orange | `#FF9800` |
| Secondaire | Violet | `#8B45FF` |
| Neutre | Marron | `#8B4513` |

### Exemples de combinaisons

#### Mode clair
```yaml
bgColor: "#ffffff"
textColor: "#333333"
gridColor: "#cccccc"
curveColor: "#1f77b4"
```

#### Mode sombre
```yaml
bgColor: "#121212"
textColor: "#ffffff"
gridColor: "rgba(255, 255, 255, 0.1)"
curveColor: "#3B58DD"
```

#### Mode high-contrast
```yaml
bgColor: "#000000"
textColor: "#ffffff"
gridColor: "rgba(0, 238, 254, 0.3)"
curveColor: "#00FFFF"
```

---

## 🔬 Interprétation des données

### Badges de statut

- ✅ **Confort optimal** (vert) : Température et humidité dans la zone de confort
- ⚠️ **Hors confort** (orange) : Valeurs hors de la zone définie

### Risque de moisissure

| Couleur | Niveau | Action |
|---------|--------|--------|
| 🟢 Vert | Aucun risque | Rien à faire |
| 🟡 Jaune | Faible | Surveiller |
| 🟠 Orange | Modéré | Déshumidifier |
| 🔴 Rouge | Élevé | Action urgente |

### Actions recommandées

Les cartes affichent automatiquement :
- 🔥 **Réchauffer** : Si température < tempMin
- ❄️ **Refroidir** : Si température > tempMax
- 💦 **Humidifier** : Si humidité < rhMin
- 🌬️ **Déshumidifier** : Si humidité > rhMax

Avec la **puissance estimée** pour chaque action.

---

## 📱 Utilisation mobile

### Gestes tactiles

- **Tap** sur température/humidité : Ouvre l'historique
- **Tap** sur point du graphique : Affiche tooltip (à venir)
- **Pinch-to-zoom** : Zoom sur graphique (à venir)

### Optimisations mobiles

- Police responsive (min 10px)
- Boutons suffisamment larges (40x40px minimum)
- Modal pleine largeur sur mobile
- Scroll fluide dans le modal

---

## 🐛 Dépannage

### Le graphique ne s'affiche pas

1. Vérifiez que le fichier est bien dans `/config/www/custom-lovelace/psychrometric/`
2. Vérifiez l'URL de la ressource
3. Videz le cache (CTRL+F5)
4. Vérifiez la console JavaScript (F12)

### L'historique ne s'affiche pas

1. Vérifiez que l'historique est activé dans Home Assistant
2. Vérifiez que les capteurs ont un historique
3. Attendez quelques heures pour avoir des données
4. Vérifiez la console pour les erreurs API

### Le graphique n'est pas responsive

1. Vérifiez la version du fichier JavaScript
2. Rechargez la page avec CTRL+F5
3. Vérifiez que votre navigateur supporte ResizeObserver

### Les animations ne fonctionnent pas

Les animations nécessitent un navigateur moderne :
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 🚀 Prochaines fonctionnalités

- [ ] Zoom et pan sur le graphique
- [ ] Export des données en CSV
- [ ] Comparaison de périodes
- [ ] Alertes personnalisables
- [ ] Graphiques d'historique étendus (7j, 30j)
- [ ] Mode plein écran
- [ ] Thèmes personnalisables

---

## 💡 Astuces et conseils

### Performance

- Limitez le nombre de capteurs à 5-6 maximum
- Désactivez `showEnthalpy` si le graphique est lent
- Utilisez `displayMode: minimal` sur mobile

### Esthétique

- Choisissez des couleurs contrastées pour les points
- Activez `showLegend` si vous avez plus de 3 capteurs
- Utilisez des icônes cohérentes (mdi:bed pour chambres, etc.)

### Précision

- Calibrez vos capteurs régulièrement
- Ajustez `massFlowRate` selon votre installation
- Définissez une zone de confort adaptée à vos besoins

---

## 📞 Support

Pour toute question ou problème :
1. Consultez le [README.md](README.md)
2. Vérifiez le [CHANGELOG.md](CHANGELOG.md)
3. Ouvrez une issue sur GitHub

---

**Version** : 2.0
**Date** : 25 octobre 2025

