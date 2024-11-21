// catalogue.js

async function chargement_catalogue() { 
    try {
        const Json = await fetch("./Json/catalogue.json"); // Vérifier que le chemin est correct
        const data = await Json.json();
        return data;
    } catch (error) {
        console.error("Erreur lors du chargement du catalogue ! : ", error);
    }
}

async function couleurGlow(couleur,filtre) {

    const glow_r = couleur.r - filtre[0]
    const glow_g = couleur.g - filtre[1]
    const glow_b = couleur.b - filtre[2]
    const glow = [glow_r, glow_g, glow_b]
    return glow

}


let liste_id_musiques = [];
let musiqueActuel = null;
let isPaused = false;
let chemin_musique_actuel = false;

function miseAJourBoiteOrdre(id_musique, ordre) {
    const catalogueContainer = document.getElementById("catalogue_recommande");
    if (!catalogueContainer) {
        console.error("Le conteneur du catalogue n'a pas été trouvé.");
        return;
    }
    const button = catalogueContainer.querySelector(`#btn-${id_musique}`); // Préfixe `btn-`

    if (button) {
        if (ordre == "pause") {
            button.innerHTML = "⏸"; // Mettre le bouton en pause
        } else if (ordre == "lecture") {
            button.innerHTML = "▶"; // Mettre le bouton en lecture
        }
    }
}

function playAudio(musiqueFichier, id_musique) {
    try {
        for (const [id] of liste_id_musiques) {
            miseAJourBoiteOrdre(id, "lecture"); // Mettre tous les boutons à ▶
        }
    
        if (chemin_musique_actuel != musiqueFichier && chemin_musique_actuel != false) {
            musiqueActuel.pause();
            musiqueActuel = new Audio(musiqueFichier);
            chemin_musique_actuel = musiqueFichier;
            musiqueActuel.play();
            isPaused = false;
            miseAJourBoiteOrdre(id_musique, "pause"); // Changer le bouton en pause
            console.log("Nouvelle musique en cours");
    
        } else if (musiqueActuel && !isPaused) {
            musiqueActuel.pause();
            isPaused = true;
            miseAJourBoiteOrdre(id_musique, "lecture"); // Changer le bouton en lecture
            console.log("Musique mise en pause");
    
        } else if (musiqueActuel && isPaused) {
            musiqueActuel.play().then(() => {
                isPaused = false;
                miseAJourBoiteOrdre(id_musique, "pause"); // Changer le bouton en pause
                console.log("Musique reprise");
            }).catch((error) => console.error("Erreur :", error));
    
        } else {
            chemin_musique_actuel = musiqueFichier;
            musiqueActuel = new Audio(musiqueFichier);
            musiqueActuel.play().then(() => {
                isPaused = false;
                miseAJourBoiteOrdre(id_musique, "pause"); // Changer le bouton en pause
                console.log("Lecture commencée");
            }).catch((error) => console.error("Erreur :", error));
    
            musiqueActuel.onended = () => {
                musiqueActuel = null;
                isPaused = false;
                miseAJourBoiteOrdre(id_musique, "lecture"); // Musique terminée, revenir à lecture
                console.log("Musique terminée");
    
            };
        }
        return;
    }
    catch{
        playAudio(musiqueFichier, id_musique)
    }
}

let isDragging = false;  // Pour savoir si la souris est en train de glisser
let startX;              // Position de départ de la souris
let scrollLeft;          // Position de départ du défilement


document.addEventListener("DOMContentLoaded", () => {
    // Charger les favoris depuis le cookie et afficher immédiatement
    afficherFavoris(); // Afficher les favoris dès que la page est chargée

    // Ajouter un événement de clic pour l'ajout ou la suppression d'un favori
    quandClickerFavori();  // Assurez-vous que cette fonction est définie ailleurs
});

// Ajouter ou retirer un favori au cookie et mettre à jour l'affichage
async function quandClickerFavori() {
    const catalogueContainer = document.getElementById("catalogue_recommande");
    const favorisContainer = document.getElementById("catalogue_favoris");

    // Ajouter un événement de clic pour le catalogue principal
    catalogueContainer.addEventListener('click', (e) => {
        if (e.target && e.target.matches('button.favoris-button')) {
            const favId = e.target.id.split('-')[2];  // Récupérer l'ID après "favoris-btn-"
            console.log("ID du favori cliqué : " + favId);

            let favorisIds = getFavorisFromCookie();

            if (!favorisIds.includes(favId)) {
                favorisIds.push(favId); // Ajouter le favori
                console.log("Favori ajouté : " + favId);
            } else {
                favorisIds = favorisIds.filter(id => id !== favId); // Retirer le favori
                console.log("Favori retiré : " + favId);
            }

            // Mettre à jour le cookie avec les nouveaux favoris (en évitant les doublons)
            favorisIds = [...new Set(favorisIds)];
            setCookie('favoris', favorisIds.join(','), 30); // Mise à jour du cookie

            afficherFavoris();  // Rafraîchir l'affichage des favoris
        }
    });

    // Ajouter un événement de clic pour retirer un favori dans la section des favoris
    favorisContainer.addEventListener('click', (e) => {
        if (e.target && e.target.matches('button.favoris-button')) {
            const favId = e.target.id.split('-')[2];  // Récupérer l'ID du bouton favoris
            console.log("ID du favori retiré : " + favId);

            let favorisIds = getFavorisFromCookie();

            // Retirer l'ID des favoris
            favorisIds = favorisIds.filter(id => id !== favId);
            console.log("Favori retiré : " + favId);

            // Mettre à jour le cookie avec les nouveaux favoris
            favorisIds = [...new Set(favorisIds)]; // Eviter les doublons
            setCookie('favoris', favorisIds.join(','), 30);

            afficherFavoris();  // Rafraîchir l'affichage des favoris
        }
    });
}


// Fonction pour afficher les favoris dans catalogue_favoris
async function afficherFavoris() {
    const catalogueContainer = document.getElementById("catalogue_favoris");  // Conteneur des favoris
    catalogueContainer.innerHTML = "";  // Vider le conteneur avant d'ajouter de nouveaux favoris

    // Charger les favoris depuis le cookie
    let favorisIds = getFavorisFromCookie();

    if (favorisIds.length === 0) {
        console.log("Aucun favori trouvé.");
        return;
    }

    // Charger le catalogue complet
    let catalogue = await chargement_catalogue();
    if (!catalogue || !catalogue.catalogue) {
        console.error("Catalogue non défini ou vide");
        return;
    }

    // Parcourir les IDs des favoris et les afficher
    for (const favId of favorisIds) {
        const item = catalogue.catalogue[favId];
        if (item) {
            // Générer le code HTML pour chaque favori
            let rgb = await couleurGlow(item.color, [80, 80, 80]);
            catalogueContainer.innerHTML += `
            <div class="petite-boite" 
                style="
                background-color: rgb(${item.color.r},${item.color.g},${item.color.b});
                box-shadow: 0 4px 8px rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]});
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                padding: 10px;
                cursor: pointer;
                ">
                <!-- Image en haut -->
                <img src="${item.Images}" alt="${item.texte}" style="max-height: 450px; object-fit: contain; margin-bottom: 10px;"/>

                <!-- Texte et bouton -->
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <p style="margin: 0; flex-grow: 1;">${item.texte}</p>
                    <button id="favoris-btn-${favId}" class="favoris-button" 
                        style="border: none; background: none; cursor: pointer;">
                        ♡
                    </button>
                </div>
            </div>
            `;
        }
    }

    console.log("Favoris affichés avec succès dans catalogue_favoris.");
}

// Fonction pour obtenir les favoris depuis le cookie
function getFavorisFromCookie() {
    const favorisCookie = getCookie('favoris');
    if (favorisCookie) {
        return favorisCookie.split(',').filter(Boolean); // Convertir le cookie en tableau d'IDs et enlever les valeurs vides
    }
    return []; // Aucun favori dans le cookie
}

// Fonction pour obtenir un cookie par son nom
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Fonction pour définir un cookie
function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}


// Fonction pour initialiser le défilement sur un conteneur donné
function initDefilement() {
    const containers = ["catalogue_recommande", "catalogue_favoris"];
    
    containers.forEach(containerId => {
        const catalogueContainer = document.getElementById(containerId);
        
        let isDragging = false;
        let startX;
        let scrollLeft;

        // Ajouter un événement pour "mousedown" (quand l'utilisateur commence à cliquer)
        catalogueContainer.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.pageX - catalogueContainer.offsetLeft;  // Position de la souris lors du clic
            scrollLeft = catalogueContainer.scrollLeft;        // Position de défilement actuelle
            catalogueContainer.style.cursor = 'grabbing';      // Changer le curseur
        });

        // Ajouter un événement pour "mousemove" (quand la souris bouge)
        catalogueContainer.addEventListener('mousemove', (e) => {
            if (!isDragging) return;  // Si l'utilisateur ne clique pas, on ne fait rien
            e.preventDefault();  // Empêcher le comportement par défaut (sélection de texte, etc.)

            const x = e.pageX - catalogueContainer.offsetLeft;  // Nouvelle position de la souris
            const walk = (x - startX) * 1.80;  // La vitesse de défilement est multipliée par 1.80
            catalogueContainer.scrollLeft = scrollLeft - walk;  // Appliquer le défilement
        });

        // Ajouter un événement pour "mouseup" (quand l'utilisateur relâche la souris)
        catalogueContainer.addEventListener('mouseup', () => {
            isDragging = false;
            catalogueContainer.style.cursor = 'grab';  // Rétablir le curseur normal
        });

        // Ajouter un événement pour "mouseleave" (si la souris quitte la zone tout en cliquant)
        catalogueContainer.addEventListener('mouseleave', () => {
            isDragging = false;
            catalogueContainer.style.cursor = 'grab';  // Rétablir le curseur normal
        });
    });
}

// Initialiser le défilement pour les deux catalogues dès que la page est prête
document.addEventListener('DOMContentLoaded', () => {
    initDefilement();
});





async function boite_catalogue() {
    let catalogue = await chargement_catalogue();
    if (!catalogue || !catalogue.catalogue) {
        console.error("Catalogue non défini ou vide");
        return;
    }

    const catalogueContainer = document.getElementById("catalogue_recommande");
    catalogueContainer.innerHTML = "";  // Vider le conteneur avant de le remplir

    const itemsArray = Object.entries(catalogue.catalogue);  // Utilisation de Object.entries pour récupérer l'ID et l'item
    await shuffleArray(itemsArray);

    let id_musique = 0;
    for (const [id, item] of itemsArray) {  // Utilisation de destructuration pour obtenir l'ID et l'item
        liste_id_musiques.push([id_musique, item.musique]);
        let rgb = await couleurGlow(item.color, [80, 80, 80]);

        catalogueContainer.innerHTML += `
        <div class="petite-boite" 
            style="
            background-color: rgb(${item.color.r},${item.color.g},${item.color.b});
            box-shadow: 0 4px 8px rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]});
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 10px;
            ">
            <!-- Image en haut -->
            <img src="${item.Images}" alt="${item.texte}" style="max-height: 450px; object-fit: contain; margin-bottom: 10px;"/>
        
            <!-- Texte et bouton -->
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                <p style="margin: 0; flex-grow: 1;">${item.texte}</p>
                <button id="favoris-btn-${id}" class="favoris-button"" 
                    style="border: none; background: none; cursor: pointer;">
                    ♡
                </button>
                <button id="btn-${id_musique}" class="play-button" onclick="playAudio('${item.musique}', ${id_musique})" 
                    style="border: none; background: none; cursor: pointer;">
                    ▶
                </button>
            </div>
        </div>
        `;
        
        id_musique++;
    }

    console.log("Catalogue affiché avec succès");

    // Appeler le défilement après l'ajout des éléments
    initDefilement();
}



async function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

window.onload = quandClickerFavori;
window.onload = boite_catalogue;
