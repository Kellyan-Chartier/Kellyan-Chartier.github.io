function infosgiver(item) {
    const jsonItem = JSON.parse(item);
    console.log(jsonItem.info.titre);
    
    // Modifier la div info et le CSS pour rendre visible
    const catalogueContainer = document.getElementById("box-right");
    catalogueContainer.innerHTML = ""; // Vider le conteneur avant de le remplir

    
    // boucle 

    for (let key in jsonItem.info) {
        const content = jsonItem.info[key]; // Accéder à l'objet content_1, content_2, etc.
        console.log(content.titre)
        catalogueContainer.innerHTML += `
            <h3>${content.titre}</h3>
            <p><em>${content.texte}</em></p>
            <img src="${content.image}" style="max-height: 450px; object-fit: contain; margin-bottom: 10px;"/>
        `;
    }
   
}
