async function avoirCookie(nom) {
    const cookies = document.cookie.split(";");
    for (let index = 0; index < cookies.length; index++) {
        const cookie = cookies[index].trim();
        if (cookie.startsWith(nom + "=")) {
            console.log("[INFO] Cookie chargé avec succès");
            return decodeURIComponent(cookie.substring(nom.length + 1));
        }
    }
    console.error("[ERREUR] Pas de cookie créé.");
    return null;
}

async function creeCookie(nom, valeur, timestamp) {
    const date = new Date(timestamp);
    const expires = "expires=" + date.toUTCString();
    document.cookie = nom + "=" + encodeURIComponent(valeur) + ";" + expires + ";path=/";
}

async function main() {
    try {
        const CookieNom = "favoris";

        let valeurCookie = await avoirCookie(CookieNom);

        if (!valeurCookie) {  // Vérifie si le cookie n'existe pas
            const cookieFavorieJson = JSON.stringify({
                favoris: []
            });

            const expirationTimeStamp = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 jours
            await creeCookie(CookieNom, cookieFavorieJson, expirationTimeStamp);
            console.log("[INFO] Cookie créé !");
        } else {
            console.log("[INFO] Les Cookies existent déjà :", valeurCookie);
        }
    } catch (error) {
        console.error(`[ERREUR] ${error}`);
    }
}

main();
