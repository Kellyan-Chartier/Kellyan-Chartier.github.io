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
}

let isDragging = false;  // Pour savoir si la souris est en train de glisser
let startX;              // Position de départ de la souris
let scrollLeft;          // Position de départ du défilement

// Fonction pour initialiser le défilement
function initDefilement() {
    const catalogueContainer = document.getElementById("catalogue_recommande");
    
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
        const walk = (x - startX) * 1.80;  // La vitesse de défilement est multipliée par 3 pour un effet plus rapide
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
}

async function boite_catalogue() {
    let catalogue = await chargement_catalogue();
    if (!catalogue || !catalogue.catalogue) {
        console.error("Catalogue non défini ou vide");
        return;
    }

    const catalogueContainer = document.getElementById("catalogue_recommande");
    catalogueContainer.innerHTML = "";  // Vider le conteneur avant de le remplir

    const itemsArray = Object.values(catalogue.catalogue);
    await shuffleArray(itemsArray);

    let id_musique = 0;
    for (const item of itemsArray) {
        liste_id_musiques.push([id_musique, item.musique]);
        let rgb = await couleurGlow(item.color, [200, 200, 200]);
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
    initDefilement();  // Ajoute cette ligne ici
}

async function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


window.onload = boite_catalogue;
