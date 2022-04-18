# Lectio API
## en del af mectio

Disse API-scripts indlæses af mectio's service worker. Dette gør det muligt at foretage API-kald i baggrunden, hvilket åbner muligheden for notifikationer.

API-kald kan testes ved at åbne DevTools for mectio's service worker. Dette gøres under browserens udvidelsesmenu (chrome://extensions for Chrome, edge://extensions for Edge).

Et API-kald foretages i konsollen ved at skrive:
- lectioAPI.api-kald(argumenter)
