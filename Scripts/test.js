console.log("Le fichier JavaScript est bien relié à index.html !");

///Variables Globales///

const temps_rechargement = 2000  ///en ms
let images = [];
let index = 0;
let lancement = false

//------------------///


async function chargement_images(){ 

    if(lancement == false){
        lancement=true
    }
    else{
        return
    }
    try{
        const Json = await fetch("../Json/image.json")
        const data = await Json.json();
        images = Object.values(data.liste_images)
        if(images.length > 0){
            await changement_image();
            setInterval(changement_image,temps_rechargement)
        }
        else{
            console.error("GROS FDP")

        }
    }
    catch(error)
    {
        console.error("Erreur ! : ",error)
    }

}


async function changement_image(){

    const image_element = document.getElementById("imagetest")
    image_element.src = images[index]
    index = (index+1)%images.length

}

