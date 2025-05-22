let currentSong = new Audio();
let songs = [];
let currFolder = "";

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let res = await fetch(`/SONGS/${folder}/`);
    let text = await res.text();
    let div = document.createElement("div");
    div.innerHTML = text;

    songs = [];
    for (let a of div.querySelectorAll("a")) {
        if (a.href.endsWith(".mp3")) {
            songs.push(decodeURIComponent(a.href.split(`${folder}/`)[1]));
        }
    }

    const ul = document.querySelector(".songlist ul");
    ul.innerHTML = "";
    songs.forEach(song => {
        ul.innerHTML += `
            <li>
                <img src="ASSETS/IMAGES/music.svg" alt="">
                <div class="info"><div>${song.replaceAll("%20", " ").replace(".mp3", "")}</div></div>
                <div class="playnow"><span>Play Now</span><img src="/ASSETS/IMAGES/play2.svg"></div>
            </li>`;
    });

    document.querySelectorAll(".songlist li").forEach((li, i) => {
        li.addEventListener("click", () => playMusic(songs[i]));
    });

    return songs;
}

function playMusic(track, pause = false) {
    currentSong.src = `/SONGS/${currFolder}/${track}`;
    if (!pause) {
        currentSong.play();
        document.getElementById("play").src = "/ASSETS/IMAGES/pause.svg";
    }
    const displayName = decodeURIComponent(track).replace(".mp3", "").replaceAll("%20", " ");
    document.querySelector(".songinfo").innerText = displayName;
    document.querySelector(".songtime").innerText = "00:00/00:00";
}

async function displayAlbums() {
    const res = await fetch("/SONGS/");
    const text = await res.text();
    const div = document.createElement("div");
    div.innerHTML = text;

    const cardlist = document.querySelector(".cardlist");
    for (let a of div.querySelectorAll("a")) {
        if (a.href.match(/\/SONGS\/[^/]+\/$/)) {
            const folder = a.href.split("/SONGS/")[1].replace("/", "");
            try {
                let json = await fetch(`/SONGS/${folder}/info.json`);
                let info = await json.json();

                cardlist.innerHTML += `
                    <div class="card f3 cursor m1" data-folder="${folder}">
                        <div class="plays"><img src="/ASSETS/IMAGES/play3.svg"></div>
                        <img class="img1" src="/SONGS/${folder}/cover.png" alt="cover">
                        <div class="text p1">${info.title}</div>
                        <p>${info.description}</p>
                    </div>`;
            } catch (e) {
                console.warn(`Missing info.json in ${folder}`);
            }
        }
    }

    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            let folder = card.dataset.folder;
            songs = await getSongs(folder);
            playMusic(songs[0]);
        });
    });
}

function getCurrentSongIndex() {
    const currentFile = decodeURIComponent(currentSong.src.split("/").pop());
    return songs.indexOf(currentFile);
}

function playNext() {
    const index = getCurrentSongIndex();
    if (index !== -1 && index < songs.length - 1) {
        playMusic(songs[index + 1]);
    }
}

function playPrevious() {
    const index = getCurrentSongIndex();
    if (index > 0) {
        playMusic(songs[index - 1]);
    }
}

async function main() {
    const playBtn = document.getElementById("play");
    const back = document.getElementById("back");
    const next = document.getElementById("next");

    await getSongs("HAPPY");
    playMusic(songs[0], true);
    await displayAlbums();

    playBtn.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            playBtn.src = "/ASSETS/IMAGES/pause.svg";
        } else {
            currentSong.pause();
            playBtn.src = "/ASSETS/IMAGES/play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerText = `${secondsToMinutesSeconds(currentSong.currentTime)}/${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    currentSong.addEventListener("ended", playNext); // 🔁 Autoplay next song

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = e.offsetX / e.target.clientWidth;
        currentSong.currentTime = percent * currentSong.duration;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        let left = document.querySelector(".left");
        left.style.left = left.style.left === "0%" ? "-100%" : "0%";
    });

    back.addEventListener("click", playPrevious);
    next.addEventListener("click", playNext);

    const volSlider = document.querySelector(".range input");
    volSlider.addEventListener("input", e => {
        currentSong.volume = parseInt(e.target.value) / 100;
    });
    volSlider.value = 30;
    currentSong.volume = 0.3;

    document.querySelector(".volume img").addEventListener("click", (e) => {
        const img = e.target;
        if (img.src.includes("vol.svg")) {
            img.src = img.src.replace("vol.svg", "mute.svg");
            currentSong.volume = 0;
            volSlider.value = 0;
        } else {
            img.src = img.src.replace("mute.svg", "vol.svg");
            currentSong.volume = 0.3;
            volSlider.value = 30;
        }
    });
}

main();
