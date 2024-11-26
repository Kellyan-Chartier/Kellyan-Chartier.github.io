//infos.js

function infosgiver(item){
    const jsonItem = JSON.parse(item);
    console.log(jsonItem);
    // modifier la div info et le css pour rendre visible
    const catalogueContainer = document.getElementById("box-right");
    catalogueContainer.innerHTML = "";  // Vider le conteneur avant de le remplir
    catalogueContainer.innerHTML +=`
    
        <h3>${jsonItem.info.titre}</h3>
        <p><em>${jsonItem.info.texte}</em></p>
        <img src="${jsonItem.info.image}" style="max-height: 450px; object-fit: contain; margin-bottom: 10px;"/>
    `
};