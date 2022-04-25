const navigationButtons = document.querySelectorAll("li>button")
const pages = []
const divs = {}

function onHashChange() {
    const hash = location.hash;
    let page = hash.substring(2)
    if (!pages.find(r => r === page)) {
        page = pages[0]
        // return
    }

    for (const pageName in divs) {
        if (Object.hasOwnProperty.call(divs, pageName)) {
            const div = divs[pageName];
            if (pageName === page) {
                div.style.display = "block";
            } else {
                div.style.display = "none";
            }
        }
    }

    navigationButtons.forEach(element => {
        if (element.innerText.toLowerCase().replaceAll(" ", "_") === page) {
            element.style.backgroundColor = "#1D1D1D"
        } else {
            element.style.backgroundColor = "#171717"
        }
    })
}

navigationButtons.forEach(element => {
    pages.push(element.innerText.toLowerCase().replaceAll(" ", "_"))
    divs[element.innerText.toLowerCase().replaceAll(" ", "_")] = document.getElementById("p_" + element.innerText.toLowerCase().replaceAll(" ", "_"))
    document.getElementById("p_" + element.innerText.toLowerCase().replaceAll(" ", "_")).style.display = "none";
    element.onclick = function () {
        location.hash = "#/" + element.innerText.toLowerCase().replaceAll(" ", "_")
    }
})

// if (!location.hash.startsWith("#/")) {
//     location.hash = "#/" + navigationButtons[0].innerText.toLowerCase().replaceAll(" ", "_")
// }

window.onhashchange = onHashChange;
onHashChange();