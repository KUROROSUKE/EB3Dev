let p1_hand = []; let p2_hand = []
let p1_point = 0; let p2_point = 0
let p1_selected_card = []; let p2_selected_card = []

const card_num = 8
let WIN_POINT = card_num*30+10
let WIN_TURN = 10

let dropped_cards_p1 = []; let dropped_cards_p2 = []

let turn = "p1"
let time = "game"
let numTurn = 1
let p1_is_acting = false
let p2_is_acting = false


const elementToNumber = {"H": 1, "He": 2, "Li": 3, "Be": 4, "B": 5, "C": 6, "N": 7, "O": 8, "F": 9, "Ne": 10,"Na": 11, "Mg": 12, "Al": 13, "Si": 14, "P": 15, "S": 16, "Cl": 17, "Ar": 18, "K": 19, "Ca": 20,"Fe": 26, "Cu": 29, "Zn": 30, "I": 53}
const elements = [...Array(6).fill('H'), ...Array(4).fill('O'), ...Array(4).fill('C'),'He', 'Li', 'Be', 'B', 'N', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca','Fe', 'Cu', 'Zn', 'I']
const element = ['H','O','C','He', 'Li', 'Be', 'B', 'N', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca','Fe', 'Cu', 'Zn', 'I']
let deck = [...elements, ...elements]
let materials = []
let imageCache = {}

let generated_p1 = null;
let generated_p2 = null;
let generated_by = null;

let p1_data_log = [];
let p2_data_log = [];

//　load materials
async function loadMaterials() {
    const response = await fetch('../compound/obs_standard_min.json')
    const data = await response.json()
    if (!data.material || !Array.isArray(data.material)) {
        return []
    }
    return data.material
}


// main code
async function view_p2_hand() {
    const area = document.getElementById('p2_hand')
    p2_hand.forEach((elem, index) => {
        const image = document.createElement("img")
        image.src = imageCache[elementToNumber[elem]].src
        image.alt = elem
        image.style.padding = "5px"
        image.style.border = "1px solid #000"
        image.classList.add("selected")
        area.appendChild(image)
    })
}

async function view_p1_hand() {
    const area = document.getElementById('p1_hand')
    p1_hand.forEach((elem, index) => {
        const image = document.createElement("img")
        image.src = imageCache[0].src
        image.alt = "相手の手札"
        image.style.padding = "5px"
        image.style.border = "1px solid #000"
        image.classList.add("selected")
        area.appendChild(image)
    })
}

async function search(components) {
    return materials.find(material => {
        for (const element in components) {
            if (!material.d[element] || material.d[element] !== components[element]) {
                return false;
            }
        }
        for (const element in material.d) {
            if (!components[element]) {
                return false;
            }
        }
        return true;
    }) || materials[0];
}

async function p1_make() {
    // FIXME: ここに上がるための元素を選択するコードを実装（相手の元素の読みなどを含めて）

    // TODO: とりあえず最もポイントが高い元素を利用する / from AI.js
    const makeable_material = await search_materials(arrayToObj(p1_hand));

    // 作れる物質がない場合は "なし" を返す
    if (!makeable_material || makeable_material.length === 0) {
        return [{
            "a": "なし",
            "b": "なし",
            "c": 0,
            "d": {},
            "e": []
        }];
    }

    // ポイントが高い順にソート
    makeable_material.sort((a, b) => b.c - a.c);

    return makeable_material;
}

async function p2_make() {
    // FIXME: ここに上がるための元素を選択するコードを実装（相手の元素の読みなどを含めて）

    // TODO: とりあえず最もポイントが高い元素を利用する / from AI.js
    const makeable_material = await search_materials(arrayToObj(p2_hand));

    // 作れる物質がない場合は "なし" を返す
    if (!makeable_material || makeable_material.length === 0) {
        return [{
            "a": "なし",
            "b": "なし",
            "c": 0,
            "d": {},
            "e": []
        }];
    }

    // ポイントが高い順にソート
    makeable_material.sort((a, b) => b.c - a.c);

    return makeable_material;
}


async function get_dora() {
    return element[Math.round(Math.random()*23)]
}

async function done(who, isRon = false) {
    const p2_make_material = await p2_make();
    const p1_make_material = await p1_make();

    if (who === "p1") {
        generated_p1 = p1_make_material[0].a;
        generated_p2 = p2_make_material[0].a;
        generated_by = "p1";
    } else {
        generated_p1 = p1_make_material[0].a;
        generated_p2 = p2_make_material[0].a;
        generated_by = "p2";
    }
    
    await logGameData();

    dora = await get_dora();
    console.log(`ドラ: ${dora}`);
    
    let thisGame_p2_point = p2_make_material[0].c;
    let thisGame_p1_point = p1_make_material[0].c;

    // 有利な生成物の場合のボーナス
    if (Boolean(p2_make_material[0].e.includes(p1_make_material[0].b))) {
        thisGame_p2_point *= (1.5 + Math.random() / 2);
    } else if (Boolean(p1_make_material[0].e.includes(p2_make_material[0].b))) {
        thisGame_p1_point *= (1.5 + Math.random() / 2);
    }

    // 役の中にドラが含まれる場合のボーナス
    if (Boolean(Object.keys(p2_make_material[0].d).includes(dora))) {
        thisGame_p2_point *= 1.5;
    } else if (Boolean(Object.keys(p1_make_material[0].d).includes(dora))) {
        thisGame_p1_point *= 1.5;
    }

    // **ロン時のボーナス**
    if (isRon) {
        who == "p2" ? thisGame_p2_point /= 1.2 : thisGame_p1_point /= 1.2
    }

    who == "p2" ? thisGame_p1_point /= 1.5 : thisGame_p2_point /= 1.5;

    // 小数点以下を四捨五入
    thisGame_p2_point = Math.round(thisGame_p2_point);
    thisGame_p1_point = Math.round(thisGame_p1_point);

    // 得点を更新
    p1_point += await thisGame_p1_point;
    p2_point += await thisGame_p2_point;

    // 画面に反映
    document.getElementById("p2_point").innerHTML += `+${thisGame_p2_point}`;
    document.getElementById("p1_point").innerHTML += `+${thisGame_p1_point}`;
    document.getElementById("p2_explain").innerHTML = `生成物質：${p2_make_material[0].a}, 組成式：${p2_make_material[0].b}`;
    document.getElementById("p1_explain").innerHTML = `生成物質：${p1_make_material[0].a}, 組成式：${p1_make_material[0].b}`;

    // 勝者判定
    const winner = await win_check();
    
    document.getElementById("done_button").style.display = "none";
    const button = document.getElementById("nextButton");
    button.style.display = "inline";

    if (!winner) {
        console.log("次のゲーム");
        numTurn += 1;
        button.textContent = "次のゲーム";
        button.addEventListener("click", function () {
            resetGame();
            button.style.display = "none"
            newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
        });
    } else {
        console.log("ゲーム終了");
        button.textContent = "ラウンド終了";
        button.addEventListener("click", function () {
            resetGame();
            button.style.display = "none"
            newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
        });
    }
    setTimeout(button.click(),100)
}

async function win_check() {
    return Math.abs(p1_point - p2_point) >= WIN_POINT ? p1_point>p2_point ? "p1": "p2" : numTurn >= WIN_TURN ? p1_point>p2_point ? "p1": "p2" : null
}

async function p1_exchange(targetElem) {
    // Select a random card index from p1_hand// TODO: from AI.js
    dropped_cards_p1.push(p1_hand[targetElem])
    var exchange_element = p1_hand[targetElem]
    // Ensure the target card exists and is valid
    if (!p1_hand[targetElem]) {
        console.error("Invalid target element in p1_hand.")
        return
    }
    // Create a new image for the dropped card area
    const newImg = document.createElement("img")
    newImg.src = imageCache[elementToNumber[p1_hand[targetElem]]].src
    newImg.style.border = "1px solid #000"
    document.getElementById("dropped_area_p1").appendChild(newImg)
    // Update the player's hand with a new element
    const img = document.querySelectorAll("#p1_hand img")[targetElem]
    if (!img) {
        console.error("Image element not found in p1_hand.")
        return
    }
    // Select a new random element and replace the target card
    const newElem = drawCard()
    p1_hand[targetElem] = newElem
    // Update the image element's appearance
    img.src = imageCache[0].src
    img.alt = newElem
    img.style.padding = "5px"
    img.style.border = "1px solid #000"
    // Remove and reapply the 'selected' class to reset the state
    img.classList.remove("selected")
    img.classList.add("selected")
    // Switch the turn to "p1"
    turn = "p2"
    checkRon(exchange_element);
}

async function p1_action() {
    if (turn !== "p1" || p1_is_acting) {
        return;  // すでに行動中なら何もしない
    }
    p1_is_acting = true;  // 行動開始

    const highPointMaterials = materials.filter(material => material.c > 10);
    const sortedMaterials = highPointMaterials.sort((a, b) => {
        let aMatchCount = Object.keys(a.d).reduce((count, elem) => count + Math.min(p1_hand.filter(e => e === elem).length, a.d[elem]), 0);
        let bMatchCount = Object.keys(b.d).reduce((count, elem) => count + Math.min(p1_hand.filter(e => e === elem).length, b.d[elem]), 0);
        return bMatchCount - aMatchCount || b.c - a.c;
    });

    const targetMaterial = sortedMaterials[0];

    if (!targetMaterial) {
        p1_exchange(Math.floor(Math.random() * p1_hand.length));
    } else {
        let canMake = true;
        for (const element in targetMaterial.d) {
            if (!p1_hand.includes(element) || p1_hand.filter(e => e === element).length < targetMaterial.d[element]) {
                canMake = false;
                break;
            }
        }

        if (canMake && targetMaterial.c > 10) {
            time = "make";
            await done("p1");
        } else {
            let unnecessaryCards = p1_hand.filter(e => {
                return !(e in targetMaterial.d) || p1_hand.filter(card => card === e).length > targetMaterial.d[e];
            });

            if (unnecessaryCards.length > 0) {
                let cardToExchange = unnecessaryCards[Math.floor(Math.random() * unnecessaryCards.length)];
                p1_exchange(p1_hand.indexOf(cardToExchange));
            } else {
                time = "make";
                done("p1");
            }
        }
    }

    turn = "p2";
    p1_is_acting = false;

    if (!p2_is_acting) { // p2がすでに動作中なら、二重に `setTimeout` しない
        setTimeout(() => { p2_action(); }, 500);
    }
}



//便利系関数
function arrayToObj(array) {
    let result = {}
    array.forEach(item => {
        if (result[item]) {
            result[item]++
        } else {
            result[item] = 1
        }
    })
    return result
}

function shuffle(array) {
    let currentIndex = array.length;
  
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
  
      // Pick a remaining element...
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array
}

function drawCard() {
    return deck.length > 0 ? deck.pop() : (time = "make", done("no-draw"));
}

async function search_materials(components) {
    return materials.filter(material => {
        for (const element in material.d) {
            if (!components[element] || material.d[element] > components[element]) {
                return false
            }
        }
        return true
    })
}

function random_hand() {
    for (let i = 0; i < card_num; i++) {
        p1_hand.push(drawCard())
        p2_hand.push(drawCard())
    }
}

function resetGame() {
    p1_point = 0;
    p2_point = 0;

    p1_is_acting = false;
    p2_is_acting = false;

    generated_p1 = null;
    generated_p2 = null;
    generated_by = null;

    p1_hand = [];
    p2_hand = [];
    dropped_cards_p1 = [];
    dropped_cards_p2 = [];
    p1_selected_card = [];
    p2_selected_card = [];
    time = "game";
    turn = Math.random() <= 0.5 ? "p1" : "p2";
    numTurn = 0;  // ターンカウントをリセット

    document.getElementById("p1_point").innerHTML = `ポイント：${p1_point}`;
    document.getElementById("p1_explain").innerHTML = "　";
    document.getElementById("p2_point").innerHTML = `ポイント：${p2_point}`;
    document.getElementById("p2_explain").innerHTML = "　";

    document.getElementById("generate_button").style.display = "inline";
    document.getElementById("done_button").style.display = "none";
    document.getElementById("nextButton").style.display = "none";

    deck = [...elements, ...elements];
    deck = shuffle(deck);

    const p1_hand_element = document.getElementById("p1_hand");
    const p2_hand_element = document.getElementById("p2_hand");
    p1_hand_element.innerHTML = "";
    p2_hand_element.innerHTML = "";

    const dropped_area_p1_element = document.getElementById("dropped_area_p1");
    const dropped_area_p2_element = document.getElementById("dropped_area_p2");
    dropped_area_p1_element.innerHTML = "";
    dropped_area_p2_element.innerHTML = "";

    random_hand();
    view_p1_hand();
    view_p2_hand();

    if (turn === "p1") {
        setTimeout(() => p1_action(), 100);
    } else {
        setTimeout(() => p2_action(), 100);
    }
}

function preloadImages() {
    let imageNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 26, 29, 30, 53];

    imageNumbers.forEach(num => {
        let img = new Image();
        img.src = `../images/${num}.webp`;
        imageCache[num] = img;
    });
}

async function init_json() {
    materials = await loadMaterials()
}



async function checkRon(droppedCard) {
    // P2のロン判定
    const possibleMaterialsP2 = await search_materials(arrayToObj([...p2_hand, droppedCard]));
    const validMaterialsP2 = possibleMaterialsP2.filter(material => ((material.c >= 70) && material.d[droppedCard]));

    if (validMaterialsP2.length > 0) {
        // **P1の手札に捨てたカードがもうない可能性があるため、戻す**
        p1_hand.push(droppedCard);
        // P1のロン処理のため、ロンに使うカードを選択
        p1_selected_card = [droppedCard];
        // `time` を "make" に変更
        time = "make";
        // P1のロン処理を実行
        done("p2", true);
    }

    // P1のロン判定（捨てられたカードを含める）
    const possibleMaterialsP1 = await search_materials(arrayToObj([...p1_hand, droppedCard]));
    const validMaterialsP1 = possibleMaterialsP1.filter(material => ((material.c >= 70) && material.d[droppedCard]));

    if (validMaterialsP1.length > 0) {
        // **P1の手札に捨てたカードがもうない可能性があるため、戻す**
        p1_hand.push(droppedCard);
        // P1のロン処理のため、ロンに使うカードを選択
        p1_selected_card = [droppedCard];
        // `time` を "make" に変更
        time = "make";
        // P1のロン処理を実行
        done("p1", true);
    }
}

function updateGeneratedMaterials(materialName) {
    if (!materialName || materialName === "なし") return;

    // LocalStorage からデータを取得（なければ空のオブジェクト）
    let generatedMaterials = JSON.parse(localStorage.getItem("generatedMaterials")) || {};

    // 物質のカウントを更新
    if (generatedMaterials[materialName]) {
        generatedMaterials[materialName] += 1;
    } else {
        generatedMaterials[materialName] = 1;
    }

    // LocalStorage に保存
    localStorage.setItem("generatedMaterials", JSON.stringify(generatedMaterials));
}


//設定画面
function openWinSettings() {
    document.getElementById("winSettingsModal").style.display = "block";
}
function saveWinSettings() {
    let winPointInput = parseInt(document.getElementById("winPointInput").value, 10);
    let winTurnInput = parseInt(document.getElementById("winTurnInput").value, 10);

    if (isNaN(winPointInput) || winPointInput < 1) {
        alert("WIN_POINT は 1 以上の数値を入力してください。");
        return;
    }
    if (isNaN(winPointInput) || winPointInput > 999) {
        alert("WIN_POINT の最大値は 999 です。");
        return;
    }
    if (isNaN(winTurnInput) || winTurnInput < 1) {
        alert("WIN_TURN は 1 以上の数値を入力してください。");
        return;
    }

    WIN_POINT = winPointInput;
    WIN_TURN = winTurnInput;
    closeWinSettings();
}
function closeWinSettings() {
    document.getElementById("winSettingsModal").style.display = "none";
}
document.getElementById("setting_icon").addEventListener("click", function() {
    document.getElementById("winSettingsModal").style.display = "inline"
})


//ヒント
async function findMostPointMaterial() {
    const possibleMaterials = await search_materials(arrayToObj(p2_hand));
    
    if (possibleMaterials.length === 0) {
        console.log("p2_hand 内で作成可能な物質はありません。");
    } else {
        const highestMaterial = possibleMaterials.reduce((max, material) => 
            material.c > max.c ? material : max, possibleMaterials[0]);
        console.log(`p2_hand 内で最もポイントが高い物質: ${highestMaterial.a} (ポイント: ${highestMaterial.c})`);
    }
}

async function p2_action() {
    if (turn !== "p2" || p2_is_acting) {
        return;  // すでに行動中なら何もしない
    }
    p2_is_acting = true;  // 行動開始

    const highPointMaterials = materials.filter(material => material.c > 10);
    const sortedMaterials = highPointMaterials.sort((a, b) => {
        let aMatchCount = Object.keys(a.d).reduce((count, elem) => count + Math.min(p2_hand.filter(e => e === elem).length, a.d[elem]), 0);
        let bMatchCount = Object.keys(b.d).reduce((count, elem) => count + Math.min(p2_hand.filter(e => e === elem).length, b.d[elem]), 0);
        return bMatchCount - aMatchCount || b.c - a.c;
    });

    const targetMaterial = sortedMaterials[0];

    if (!targetMaterial) {
        p2_exchange(Math.floor(Math.random() * p2_hand.length));
    } else {
        let canMake = true;
        for (const element in targetMaterial.d) {
            if (!p2_hand.includes(element) || p2_hand.filter(e => e === element).length < targetMaterial.d[element]) {
                canMake = false;
                break;
            }
        }

        if (canMake && targetMaterial.c > 10) {
            time = "make";
            await done("p2");
        } else {
            let unnecessaryCards = p2_hand.filter(e => {
                return !(e in targetMaterial.d) || p2_hand.filter(card => card === e).length > targetMaterial.d[e];
            });

            if (unnecessaryCards.length > 0) {
                let cardToExchange = unnecessaryCards[Math.floor(Math.random() * unnecessaryCards.length)];
                p2_exchange(p2_hand.indexOf(cardToExchange));
            } else {
                time = "make";
                done("p2");
            }
        }
    }

    turn = "p1";
    p2_is_acting = false;

    if (!p1_is_acting) { // p1がすでに動作中なら、二重に `setTimeout` しない
        setTimeout(() => { p1_action(); }, 500);
    }
}

async function p2_exchange(targetElem) {
    dropped_cards_p2.push(p2_hand[targetElem])
    var exchange_element = p2_hand[targetElem]
    // Ensure the target card exists and is valid
    if (!p2_hand[targetElem]) {
        console.error("Invalid target element in p2_hand.")
        return
    }
    // Create a new image for the dropped card area
    const newImg = document.createElement("img")
    newImg.src = imageCache[elementToNumber[p2_hand[targetElem]]].src
    newImg.style.border = "1px solid #000"
    document.getElementById("dropped_area_p2").appendChild(newImg)
    // Update the player's hand with a new element
    const img = document.querySelectorAll("#p2_hand img")[targetElem]
    if (!img) {
        console.error("Image element not found in p2_hand.")
        return
    }
    // Select a new random element and replace the target card
    const newElem = drawCard()
    p2_hand[targetElem] = newElem
    // Update the image element's appearance
    img.src = imageCache[elementToNumber[newElem]].src
    img.alt = newElem
    img.style.padding = "5px"
    img.style.border = "1px solid #000"
    // Remove and reapply the 'selected' class to reset the state
    img.classList.remove("selected")
    img.classList.add("selected")
    // Switch the turn to "p1"
    turn = "p1"
    checkRon(exchange_element);
}

document.addEventListener("DOMContentLoaded", () => {
    preloadImages()
    init_json()
})

async function start() {
    deck = [...elements, ...elements]
    deck = shuffle(deck)
    random_hand()
    view_p1_hand()
    view_p2_hand()
    turn = Math.random()>=0.5 ? "p1" : "p2"
    if (turn == "p1") {p1_action()} else {p2_action()}
}

document.getElementById("startButton").addEventListener("click", function() {
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("p1_area").style.display = "block";
    document.getElementById("dropped_area_p1").style.display = "block";
    document.getElementById("dropped_area_p2").style.display = "block";
    document.getElementById("p2_area").style.display = "block";
    document.getElementById("gameRuleButton").style.display = "none";
});


function showRules() {
    document.getElementById("rulesModal").style.display = "block";
}

function closeRules() {
    document.getElementById("rulesModal").style.display = "none";
}

document.getElementById("closeRulesButton").addEventListener("click", closeRules);

// モーダル外をクリックした場合に閉じる
window.onclick = function(event) {
    const modal = document.getElementById("rulesModal");
    if (event.target === modal) {
        closeRules();
    }
};


async function logGameData() {
    p1_data_log.push({
        dropped: [...dropped_cards_p1],
        generated: generated_p1,
        generated_by: generated_by === "p1" ? true : false
    });
    
    p2_data_log.push({
        dropped: [...dropped_cards_p2],
        generated: generated_p2,
        generated_by: generated_by === "p2" ? true : false
    });
    
    console.log("P1 Data Log:", p1_data_log);
    console.log("P2 Data Log:", p2_data_log);
}

function downloadGameData() {
    const data = {
        p1_data: p1_data_log,
        p2_data: p2_data_log
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "game_data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
