import("./infos.js")

// catalogue.js

function toggleBox() {
    const box = document.getElementById('box-right'); //test
    box.classList.toggle('visible'); // Basculer la classe "visible"
}

async function chargement_catalogue() { 
    try {
        const Json = await fetch("./Json/catalogue.json"); // Vérifier que le chemin est correct
        const data = await Json.json();
        return data;
    } catch (error) {
        console.error("Erreur lors du chargement du catalogue ! : ", error);
    }
}

async function couleurGlow(couleur, filtre) {

    const glow_r = Math.min(Math.max(couleur.r - filtre[0], 0), 255); // Limiter entre 0 et 255
    const glow_g = Math.min(Math.max(couleur.g - filtre[1], 0), 255);
    const glow_b = Math.min(Math.max(couleur.b - filtre[2], 0), 255);
    return [glow_r, glow_g, glow_b];
}


let liste_id_musiques = [];
let musiqueActuel = null;
let isPaused = false;
let chemin_musique_actuel = false;
let tuto = false

function miseAJourBoiteOrdre(id_musique, ordre) {
    const catalogueContainer = document.getElementById("catalogue_recommande");
    if (!catalogueContainer) {
        console.error("Le conteneur du catalogue n'a pas été trouvé.");
        return;
    }
    const button = catalogueContainer.querySelector(`#btn-${id_musique}`); // Préfixe `btn-`

    if (button) {
        if (ordre == "pause") {
            if (tuto == false) {
                toggleBox()
                tuto = true
            } 
            button.innerHTML = "⏸"; // Mettre le bouton en pause
        } else if (ordre == "lecture") {
            button.innerHTML = "▶"; // Mettre le bouton en lecture
        }
    }
}

let boiteActive = null; // Variable pour suivre la boîte actuellement active
let boites = []; // Tableau pour stocker les glow initiaux de chaque boîte

// Fonction pour sauvegarder le glow initial
function sauvegarderGlowInitial(boite) {
    const initialGlow = getComputedStyle(boite).boxShadow;
    const initialZIndex = getComputedStyle(boite).zIndex; // Sauvegarder le z-index initial
    boites.push({ boite, initialGlow, initialZIndex });
}

// Fonction pour récupérer le glow initial et le z-index d'une boîte spécifique
function getGlowInitial(boite) {
    const foundBoite = boites.find(b => b.boite === boite);
    return foundBoite ? { glow: foundBoite.initialGlow, zIndex: foundBoite.initialZIndex } : { glow: '', zIndex: '' };
}

async function playAudio(musiqueFichier, id_musique, id) {
    try {
        // Identifier la boîte active
        const activeBoite = document.querySelector(`#btn-${id_musique}`).closest(".petite-boite");

        // Sauvegarder le glow initial de la boîte si ce n'est pas déjà fait
        if (!boites.some(b => b.boite === activeBoite)) {
            sauvegarderGlowInitial(activeBoite);
        }

        // Réinitialiser l'état des autres boutons
        const catalogueContainer = document.getElementById("catalogue_recommande");
        const buttons = catalogueContainer.querySelectorAll('.play-button');
        buttons.forEach(button => {
            if (button.id !== `btn-${id_musique}`) {
                button.innerHTML = "▶"; // Remettre les autres boutons en "play"
            }
        });

        // Réinitialiser l'état de la boîte précédemment active, si une boîte est déjà active
        if (boiteActive && boiteActive !== activeBoite) {
            const { glow, zIndex } = getGlowInitial(boiteActive);
            boiteActive.style.boxShadow = glow; // Restaurer le glow initial
            boiteActive.style.transform = "scale(1)"; // Réinitialiser la taille
            boiteActive.style.zIndex = zIndex; // Restaurer le z-index initial
        }

        // Conserver la nouvelle boîte active
        boiteActive = activeBoite;

        // Calculer la couleur pour le glow uniquement pour la nouvelle boîte sélectionnée
        if (activeBoite) {
            const couleurBase = getComputedStyle(activeBoite).backgroundColor;
            const rgbMatch = couleurBase.match(/\d+/g);
            if (rgbMatch) {
                const r = parseInt(rgbMatch[0]);
                const g = parseInt(rgbMatch[1]);
                const b = parseInt(rgbMatch[2]);

                const [glowR, glowG, glowB] = await couleurGlow({ r, g, b }, [40, 40, 40]);

                activeBoite.style.boxShadow = `0 0 10px 10px rgba(${glowR}, ${glowG}, ${glowB}, 1), 0 0 80px 30px rgba(${glowR}, ${glowG}, ${glowB}, 0.6)`;
                activeBoite.style.transform = "scale(1.05)"; // Agrandir la boîte active
                activeBoite.style.zIndex = '9999'; // Assurez-vous que le glow est visible au-dessus des autres boîtes
            }
        }

        // Code de gestion de la musique
        if (chemin_musique_actuel != musiqueFichier && chemin_musique_actuel != false) {
            musiqueActuel.pause();
            musiqueActuel = new Audio(musiqueFichier);
            chemin_musique_actuel = musiqueFichier;

            musiqueActuel.volume = globalVolume;
            musiqueActuel.play();
            isPaused = false;
            miseAJourBoiteOrdre(id_musique, "pause");
        } else if (musiqueActuel && !isPaused) {
            musiqueActuel.pause();
            isPaused = true;
            miseAJourBoiteOrdre(id_musique, "lecture");
        } else if (musiqueActuel && isPaused) {
            musiqueActuel.play();
            isPaused = false;
            miseAJourBoiteOrdre(id_musique, "pause");
        } else {
            chemin_musique_actuel = musiqueFichier;
            musiqueActuel = new Audio(musiqueFichier);

            musiqueActuel.volume = globalVolume;
            musiqueActuel.play();
            isPaused = false;
            miseAJourBoiteOrdre(id_musique, "pause");
        }

        return;
    } catch (error) {
        console.error("Erreur dans playAudio : ", error);
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

        // Variable pour améliorer la fluidité avec requestAnimationFrame
        let isScrolling = false;

        // Fonction pour gérer le déplacement
        function handleMouseMove(e) {
            let isScrolling = false;

            catalogueContainer.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                if (!isScrolling) {
                    window.requestAnimationFrame(() => {
                        const x = e.pageX - catalogueContainer.offsetLeft;
                        const walk = (x - startX) * 1.8;
                        catalogueContainer.scrollLeft = scrollLeft - walk;
                        isScrolling = false;
                    });
                }
                isScrolling = true;
            });

        }

        // Ajouter les événements pour gérer le drag-and-scroll
        catalogueContainer.addEventListener("mousedown", (e) => {
            isDragging = true;
            startX = e.pageX - catalogueContainer.offsetLeft;
            scrollLeft = catalogueContainer.scrollLeft;
            catalogueContainer.style.cursor = "grabbing"; // Indique que l'utilisateur peut faire glisser
        });

        catalogueContainer.addEventListener("mousemove", handleMouseMove);

        // Quand l'utilisateur relâche la souris
        catalogueContainer.addEventListener("mouseup", () => {
            isDragging = false;
            catalogueContainer.style.cursor = "grab";
        });

        // Si la souris sort du conteneur, arrête le drag
        catalogueContainer.addEventListener("mouseleave", () => {
            isDragging = false;
            catalogueContainer.style.cursor = "grab";
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
        let data = JSON.stringify(item).replace(/"/g, '&quot;');
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
                <button id="btn-${id_musique}" class="play-button" onclick="playAudio('${item.musique}', '${id_musique}', '${id}') ; infosgiver('${data}') ; " 
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



// Initialisation du volume global
let globalVolume = 1.0; // Volume par défaut

document.addEventListener("DOMContentLoaded", () => {
    const volumeControl = document.getElementById("global-volume");

    // Charger la valeur du volume depuis le localStorage
    const savedVolume = localStorage.getItem("globalVolume");
    if (savedVolume !== null) {
        globalVolume = parseFloat(savedVolume); // Récupérer la valeur sauvegardée
    }

    // Synchroniser la barre de volume avec la valeur enregistrée
    volumeControl.value = globalVolume;

    // Appliquer le volume global à la musique actuelle (si elle est en cours)
    if (musiqueActuel) {
        musiqueActuel.volume = globalVolume;
    }

    // Écouter les modifications de la barre de volume
    volumeControl.addEventListener("input", (event) => {
        globalVolume = parseFloat(event.target.value);

        // Sauvegarder la nouvelle valeur dans le localStorage
        localStorage.setItem("globalVolume", globalVolume);

        // Mettre à jour le volume de la musique en cours
        if (musiqueActuel) {
            musiqueActuel.volume = globalVolume;
        }
    });
});

