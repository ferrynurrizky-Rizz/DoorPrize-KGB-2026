/* =========================================================
   DOORPRIZE KGB 2026
   PRIZE WHEEL + WISH BALL
========================================================= */

const TOTAL_PRIZES = 20;

const STORAGE_KEY =
    "doorprize-kgb-2026-wishball-v1";


const defaultPrizes =
    Array.from(
        { length: TOTAL_PRIZES },
        (_, i) =>
            `Doorprize ${String(i + 1).padStart(2, "0")}`
    );


/* =========================================================
   STATE
========================================================= */

let state =
    loadState();

let availableParticipants =
    [];

let availablePrizes =
    [];

let drawing =
    false;

let selectedPrize =
    null;

let wheelRotation =
    0;


/* =========================================================
   ELEMENTS
========================================================= */

const $ =
    id =>
        document.getElementById(id);


const prizeCanvas =
    $("prizeWheel");

const ctx =
    prizeCanvas.getContext("2d");


const spinPrizeBtn =
    $("spinPrizeBtn");

const raceBtn =
    $("raceBtn");

const prizeTitle =
    $("prizeTitle");

const prizeDescription =
    $("prizeDescription");

const stageLabel =
    $("stageLabel");

const winnerName =
    $("winnerName");

const winnerNo =
    $("winnerNo");

const winnerStage =
    $("winnerStage");

const wishBallStage =
    $("wishBallStage");

const wishBalls =
    $("wishBalls");

const wishCenterSub =
    $("wishCenterSub");

const raceCountdown =
    $("raceCountdown");

const availableCount =
    $("availableCount");

const drawnCount =
    $("drawnCount");

const results =
    $("results");

const prizeInputs =
    $("prizeInputs");

const toast =
    $("toast");


/* =========================================================
   LOAD STATE
========================================================= */

function loadState() {

    try {

        const saved =
            JSON.parse(
                localStorage.getItem(
                    STORAGE_KEY
                ) || "null"
            );


        if (
            saved &&
            Array.isArray(saved.prizes) &&
            Array.isArray(saved.winners)
        ) {

            return {

                prizes:
                    [...defaultPrizes]
                        .map(
                            (item,index) =>
                                saved.prizes[index] ||
                                item
                        ),

                winners:
                    saved.winners

            };

        }

    } catch(error) {

        console.warn(error);

    }


    return {

        prizes:
            [...defaultPrizes],

        winners:
            []

    };

}


/* =========================================================
   SAVE
========================================================= */

function saveState() {

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(state)

    );

}


/* =========================================================
   INITIALIZE
========================================================= */

function initializePools() {

    const usedParticipants =
        new Set(
            state.winners.map(
                winner =>
                    winner.no
            )
        );


    availableParticipants =
        window.PARTICIPANTS.filter(
            participant =>
                !usedParticipants.has(
                    participant.no
                )
        );


    const usedPrizes =
        new Set(
            state.winners
                .map(
                    winner =>
                        winner.prizeIndex
                )
                .filter(
                    index =>
                        Number.isInteger(index)
                )
        );


    availablePrizes =
        state.prizes
            .map(
                (name,index) => ({
                    name,
                    index
                })
            )
            .filter(
                prize =>
                    !usedPrizes.has(
                        prize.index
                    )
            );

}


/* =========================================================
   RANDOM
========================================================= */

function secureRandomInt(max) {

    if(max <= 1)
        return 0;


    const random =
        new Uint32Array(1);


    const limit =
        Math.floor(
            0x100000000 / max
        ) * max;


    do {

        crypto.getRandomValues(
            random
        );

    } while(
        random[0] >= limit
    );


    return (
        random[0] % max
    );

}


/* =========================================================
   WAIT
========================================================= */

function wait(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}


/* =========================================================
   ESCAPE
========================================================= */

function escapeHtml(value) {

    return String(value)
        .replace(
            /[&<>"']/g,
            char => ({

                "&":"&amp;",
                "<":"&lt;",
                ">":"&gt;",
                '"':"&quot;",
                "'":"&#039;"

            }[char])
        );

}


function escapeAttribute(value) {

    return escapeHtml(value)
        .replace(
            /`/g,
            "&#096;"
        );

}


/* =========================================================
   PRIZE INPUT
========================================================= */

function renderPrizeInputs() {

    prizeInputs.innerHTML =
        "";


    state.prizes.forEach(
        (prize,index) => {

            const item =
                document.createElement(
                    "label"
                );


            item.className =
                "prize-item";


            item.innerHTML = `

                <span>
                    ${String(index + 1).padStart(2,"0")}
                </span>

                <input
                    type="text"
                    data-prize="${index}"
                    value="${escapeAttribute(prize)}"
                    placeholder="Nama hadiah ${index + 1}"
                >

            `;


            prizeInputs.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   DRAW PREMIUM WHEEL
========================================================= */

function drawWheel() {

    const canvas =
        prizeCanvas;


    const size =
        canvas.width;


    const center =
        size / 2;


    const radius =
        size / 2 - 10;


    ctx.clearRect(
        0,
        0,
        size,
        size
    );


    /*
        Background glow
    */

    const glow =
        ctx.createRadialGradient(
            center,
            center,
            radius * .3,
            center,
            center,
            radius
        );


    glow.addColorStop(
        0,
        "#263c69"
    );

    glow.addColorStop(
        .7,
        "#0b1730"
    );

    glow.addColorStop(
        1,
        "#050a16"
    );


    ctx.beginPath();

    ctx.arc(
        center,
        center,
        radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        glow;

    ctx.fill();


    if(
        !availablePrizes.length
    ) {

        drawWheelFrame(
            center,
            radius
        );

        return;

    }


    const total =
        availablePrizes.length;


    const segment =
        Math.PI * 2 / total;


    const colors = [

        "#ffcc55",
        "#4d7ee3",
        "#ef6572",
        "#45c9a0",
        "#8d68d8",
        "#f09a48",
        "#42b8ce",
        "#e363a4"

    ];


    /*
        Rotate visual drawing
        according to wheel rotation.
    */

    ctx.save();

    ctx.translate(
        center,
        center
    );

    ctx.rotate(
        wheelRotation
    );

    ctx.translate(
        -center,
        -center
    );


    for(
        let i = 0;
        i < total;
        i++
    ) {

        const start =
            -Math.PI / 2 +
            i * segment;


        const end =
            start +
            segment;


        /*
            Segment
        */

        ctx.beginPath();

        ctx.moveTo(
            center,
            center
        );

        ctx.arc(
            center,
            center,
            radius,
            start,
            end
        );

        ctx.closePath();


        const gradient =
            ctx.createRadialGradient(
                center,
                center,
                radius * .15,
                center,
                center,
                radius
            );


        gradient.addColorStop(
            0,
            lighten(
                colors[i % colors.length]
            )
        );

        gradient.addColorStop(
            1,
            colors[i % colors.length]
        );


        ctx.fillStyle =
            gradient;

        ctx.fill();


        ctx.strokeStyle =
            "rgba(255,255,255,.28)";

        ctx.lineWidth =
            2;

        ctx.stroke();


        /*
            Text
        */

        const prize =
            availablePrizes[i];


        ctx.save();

        ctx.translate(
            center,
            center
        );

        ctx.rotate(
            start +
            segment / 2
        );


        ctx.textAlign =
            "right";

        ctx.textBaseline =
            "middle";

        ctx.fillStyle =
            "#ffffff";

        ctx.shadowColor =
            "rgba(0,0,0,.55)";

        ctx.shadowBlur =
            4;


        const label =
            shortenPrize(
                prize.name,
                total
            );


        ctx.font =
            total > 15
                ? "900 17px Segoe UI"
                : "900 19px Segoe UI";


        ctx.fillText(
            label,
            radius - 28,
            0
        );


        ctx.restore();

    }


    ctx.restore();


    drawWheelFrame(
        center,
        radius
    );

}


/* =========================================================
   WHEEL FRAME
========================================================= */

function drawWheelFrame(
    center,
    radius
) {

    /*
        Outer gold ring
    */

    ctx.beginPath();

    ctx.arc(
        center,
        center,
        radius,
        0,
        Math.PI * 2
    );

    ctx.strokeStyle =
        "#ffd45a";

    ctx.lineWidth =
        11;

    ctx.stroke();


    /*
        Inner ring
    */

    ctx.beginPath();

    ctx.arc(
        center,
        center,
        radius - 15,
        0,
        Math.PI * 2
    );

    ctx.strokeStyle =
        "rgba(255,255,255,.22)";

    ctx.lineWidth =
        2;

    ctx.stroke();


    /*
        Center
    */

    const centerRadius =
        70;


    const centerGradient =
        ctx.createRadialGradient(
            center,
            center,
            5,
            center,
            center,
            centerRadius
        );


    centerGradient.addColorStop(
        0,
        "#fff2ae"
    );

    centerGradient.addColorStop(
        .7,
        "#f5c64f"
    );

    centerGradient.addColorStop(
        1,
        "#d99824"
    );


    ctx.beginPath();

    ctx.arc(
        center,
        center,
        centerRadius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        centerGradient;

    ctx.fill();


    ctx.strokeStyle =
        "#ffffff";

    ctx.lineWidth =
        6;

    ctx.stroke();


    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillStyle =
        "#171108";

    ctx.font =
        "900 28px Segoe UI";


    ctx.fillText(
        "🎁",
        center,
        center - 8
    );


    ctx.font =
        "900 11px Segoe UI";

    ctx.fillText(
        "SPIN",
        center,
        center + 24
    );


    /*
        Decorative dots
    */

    for(
        let i = 0;
        i < 20;
        i++
    ) {

        const angle =
            i *
            (Math.PI * 2 / 20);


        const x =
            center +
            Math.cos(angle) *
            (radius - 7);


        const y =
            center +
            Math.sin(angle) *
            (radius - 7);


        ctx.beginPath();

        ctx.arc(
            x,
            y,
            3,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#fff0a0";

        ctx.fill();

    }

}


/* =========================================================
   COLOR HELPER
========================================================= */

function lighten(hex) {

    const value =
        hex.replace(
            "#",
            ""
        );


    const r =
        parseInt(
            value.substring(0,2),
            16
        );


    const g =
        parseInt(
            value.substring(2,4),
            16
        );


    const b =
        parseInt(
            value.substring(4,6),
            16
        );


    return `rgb(
        ${Math.min(r + 35,255)},
        ${Math.min(g + 35,255)},
        ${Math.min(b + 35,255)}
    )`;

}


/* =========================================================
   SHORTEN PRIZE
========================================================= */

function shortenPrize(
    value,
    total
) {

    const max =
        total > 15
            ? 12
            : 18;


    const text =
        String(value);


    if(
        text.length <= max
    )
        return text;


    return (
        text.substring(
            0,
            max
        ) + "…"
    );

}


/* =========================================================
   SPIN PRIZE
========================================================= */

async function spinPrize() {

    if(
        drawing ||
        !availablePrizes.length
    )
        return;


    drawing =
        true;


    spinPrizeBtn.disabled =
        true;

    raceBtn.disabled =
        true;


    stageLabel.textContent =
        "🎡 MEMILIH HADIAH...";


    prizeDescription.textContent =
        "Roda keberuntungan sedang berputar";


    winnerName.textContent =
        "MENUNGGU HADIAH";


    winnerNo.textContent =
        "Hadiah sedang ditentukan";


    /*
        Random hadiah
    */

    const index =
        secureRandomInt(
            availablePrizes.length
        );


    selectedPrize =
        availablePrizes[index];


    const total =
        availablePrizes.length;


    const segment =
        360 / total;


    /*
        Target agar segmen pilihan
        berada di bawah pointer.
    */

    const target =
        -(
            index * segment +
            segment / 2
        );


    const currentDegrees =
        wheelRotation *
        180 /
        Math.PI;


    const extra =
        360 *
        (
            5 +
            secureRandomInt(3)
        );


    const finalDegrees =
        currentDegrees +
        extra +
        target;


    wheelRotation =
        finalDegrees *
        Math.PI /
        180;


    prizeCanvas.style.transform =
        `rotate(${finalDegrees}deg)`;


    await wait(6000);


    prizeTitle.textContent =
        selectedPrize.name;


    prizeDescription.textContent =
        "Hadiah berhasil dipilih!";


    stageLabel.textContent =
        "🎁 HADIAH TERPILIH";


    showToast(
        `🎁 ${selectedPrize.name}`
    );


    drawing =
        false;


    raceBtn.disabled =
        false;


    drawWishBalls();

}


/* =========================================================
   WISH BALLS
========================================================= */

function drawWishBalls() {

    wishBalls.innerHTML =
        "";


    /*
        Maksimal visual 42 bola.
        Pool sebenarnya tetap seluruh
        peserta.
    */

    const visualCount =
        Math.min(
            42,
            availableParticipants.length
        );


    /*
        Acak peserta yang ditampilkan
        di bola.
    */

    const visualParticipants =
        [...availableParticipants]
            .sort(
                () =>
                    Math.random() -
                    .5
            )
            .slice(
                0,
                visualCount
            );


    const colors = [

        "#ef6572",
        "#4d7ee3",
        "#45c9a0",
        "#9a6de2",
        "#f0a048",
        "#e363a4",
        "#42b8ce",
        "#e4b83d"

    ];


    visualParticipants.forEach(
        (participant,index) => {

            const ball =
                document.createElement(
                    "div"
                );


            ball.className =
                "wish-ball floating";


            ball.dataset.no =
                participant.no;


            ball.textContent =
                participant.name;


            ball.style.background =
                `radial-gradient(
                    circle at 35% 25%,
                    ${lighten(colors[index % colors.length])},
                    ${colors[index % colors.length]}
                )`;


            /*
                posisi random
            */

            const x =
                7 +
                secureRandomInt(86);


            const y =
                7 +
                secureRandomInt(86);


            ball.style.left =
                `${x}%`;


            ball.style.top =
                `${y}%`;


            ball.style.setProperty(
                "--float-time",
                `${1.8 + Math.random() * 2}s`
            );


            ball.style.animationDelay =
                `${Math.random() * -2}s`;


            wishBalls.appendChild(
                ball
            );

        }
    );


    wishCenterSub.textContent =
        `${availableParticipants.length} peserta`;


    raceCountdown.textContent =
        "SIAP";


    winnerName.textContent =
        "MENUNGGU HADIAH";


    winnerNo.textContent =
        `${availableParticipants.length} peserta tersedia`;

}


/* =========================================================
   WISH BALL DRAW
========================================================= */

async function startWishBall() {

    if(
        drawing ||
        !selectedPrize ||
        !availableParticipants.length
    )
        return;


    drawing =
        true;


    raceBtn.disabled =
        true;

    spinPrizeBtn.disabled =
        true;


    winnerStage.classList.remove(
        "celebrate"
    );


    /*
        Tentukan pemenang terlebih dahulu
        menggunakan random cryptographic.
    */

    const winner =
        availableParticipants[
            secureRandomInt(
                availableParticipants.length
            )
        ];


    /*
        Pastikan bola tersedia.
        Jika winner tidak sedang terlihat,
        kita buat bola khusus.
    */

    let winnerBall =
        wishBalls.querySelector(
            `[data-no="${winner.no}"]`
        );


    if(!winnerBall) {

        winnerBall =
            createWinnerBall(
                winner
            );

    }


    /*
        Countdown
    */

    await wishCountdown();


    /*
        Semua bola mulai bergerak
    */

    wishCenterSub.textContent =
        "MEMILIH...";


    raceCountdown.textContent =
        "✨ MENCARI ✨";


    raceCountdown.classList.add(
        "suspense"
    );


    /*
        Animasi eliminasi.
        Bola dihilangkan bertahap.
    */

    const balls =
        Array.from(
            wishBalls.querySelectorAll(
                ".wish-ball"
            )
        );


    /*
        Jangan eliminasi winner.
    */

    const losers =
        balls.filter(
            ball =>
                Number(
                    ball.dataset.no
                ) !== winner.no
        );


    /*
        Acak urutan eliminasi.
    */

    losers.sort(
        () =>
            Math.random() - .5
    );


    for(
        let i = 0;
        i < losers.length;
        i++
    ) {

        losers[i].classList.add(
            "eliminated"
        );


        /*
            Setiap beberapa bola
            beri suspense.
        */

        if(
            i % 5 === 0
        ) {

            winnerBall.classList.add(
                "selected"
            );

            await wait(90);

            winnerBall.classList.remove(
                "selected"
            );

        }


        await wait(
            45 +
            Math.floor(
                i / losers.length *
                100
            )
        );

    }


    /*
        Hanya winner tersisa.
    */

    winnerBall.classList.add(
        "selected"
    );


    winnerBall.style.left =
        "50%";


    winnerBall.style.top =
        "50%";


    await wait(800);


    raceCountdown.classList.remove(
        "suspense"
    );


    raceCountdown.textContent =
        "3";


    await wait(650);


    raceCountdown.textContent =
        "2";


    await wait(650);


    raceCountdown.textContent =
        "1";


    await wait(650);


    raceCountdown.textContent =
        "🏆";


    winnerStage.classList.add(
        "celebrate"
    );


    winnerName.textContent =
        winner.name;


    winnerNo.textContent =
        `No. peserta ${winner.no}`;


    wishCenterSub.textContent =
        "PEMENANG!";


    createConfetti();


    await wait(1400);


    finishWishBall(
        winner
    );

}


/* =========================================================
   COUNTDOWN
========================================================= */

async function wishCountdown() {

    const sequence = [
        "3",
        "2",
        "1"
    ];


    for(
        const number
        of sequence
    ) {

        raceCountdown.textContent =
            number;


        raceCountdown.classList.remove(
            "suspense"
        );


        void raceCountdown.offsetWidth;


        raceCountdown.classList.add(
            "suspense"
        );


        await wait(650);

    }

}


/* =========================================================
   CREATE WINNER BALL
========================================================= */

function createWinnerBall(
    participant
) {

    const ball =
        document.createElement(
            "div"
        );


    ball.className =
        "wish-ball floating";


    ball.dataset.no =
        participant.no;


    ball.textContent =
        participant.name;


    ball.style.background =
        "radial-gradient(circle at 35% 25%, #fff0a0, #e6a52f)";


    ball.style.left =
        "50%";


    ball.style.top =
        "50%";


    wishBalls.appendChild(
        ball
    );


    return ball;

}


/* =========================================================
   FINISH WISH BALL
========================================================= */

function finishWishBall(
    winner
) {

    const prize =
        selectedPrize;


    state.winners.push({

        no:
            winner.no,

        name:
            winner.name,

        prize:
            prize.name,

        prizeIndex:
            prize.index

    });


    availableParticipants =
        availableParticipants.filter(
            participant =>
                participant.no !==
                winner.no
        );


    availablePrizes =
        availablePrizes.filter(
            prizeItem =>
                prizeItem.index !==
                prize.index
        );


    saveState();


    selectedPrize =
        null;


    drawing =
        false;


    updateCounters();

    renderResults();

    drawWheel();


    showToast(
        `🏆 ${winner.name} memenangkan ${prize.name}`
    );


    setTimeout(
        () => {

            winnerStage.classList.remove(
                "celebrate"
            );


            if(
                state.winners.length >=
                TOTAL_PRIZES
            ) {

                stageLabel.textContent =
                    "🎉 SEMUA HADIAH SELESAI";


                prizeTitle.textContent =
                    "SEMUA HADIAH SUDAH DIUNDI";


                prizeDescription.textContent =
                    "20 pemenang telah terpilih.";


                raceBtn.disabled =
                    true;


                spinPrizeBtn.disabled =
                    true;


                wishCenterSub.textContent =
                    "SELESAI";


                return;

            }


            prepareNextRound();

        },
        1800
    );

}


/* =========================================================
   NEXT ROUND
========================================================= */

function prepareNextRound() {

    const round =
        state.winners.length + 1;


    stageLabel.textContent =
        `RONDE ${round}`;


    prizeTitle.textContent =
        `Doorprize ${String(round).padStart(2,"0")}`;


    prizeDescription.textContent =
        "Putar roda untuk menentukan hadiah berikutnya";


    winnerName.textContent =
        "MENUNGGU HADIAH";


    winnerNo.textContent =
        `${availableParticipants.length} peserta tersedia`;


    wishBalls.innerHTML =
        "";


    wishCenterSub.textContent =
        "Siap memilih";


    raceCountdown.classList.remove(
        "suspense"
    );


    raceCountdown.textContent =
        "SIAP";


    spinPrizeBtn.disabled =
        false;


    raceBtn.disabled =
        true;


    updateCounters();

}


/* =========================================================
   RESULTS
========================================================= */

function renderResults() {

    if(
        !state.winners.length
    ) {

        results.className =
            "results empty";


        results.innerHTML = `

            <div class="empty-icon">
                🏆
            </div>

            <p>
                Belum ada pemenang
            </p>

            <small>
                Pemenang akan muncul setelah Wish Ball selesai.
            </small>

        `;


        return;

    }


    results.className =
        "results";


    results.innerHTML =
        state.winners
            .map(
                (winner,index) => `

                <div class="result-row">

                    <div class="result-num">
                        ${String(
                            index + 1
                        ).padStart(2,"0")}
                    </div>

                    <div>

                        <div class="result-prize">
                            🎁 ${escapeHtml(
                                winner.prize
                            )}
                        </div>

                        <div class="result-name">
                            ${escapeHtml(
                                winner.name
                            )}
                        </div>

                        <div class="result-meta">
                            No. peserta ${winner.no}
                        </div>

                    </div>

                </div>

            `
            )
            .join("");


    results.scrollTop =
        results.scrollHeight;

}


/* =========================================================
   COUNTERS
========================================================= */

function updateCounters() {

    drawnCount.textContent =
        state.winners.length;


    availableCount.textContent =
        `${availableParticipants.length} peserta`;

}


/* =========================================================
   SAVE PRIZES
========================================================= */

function savePrizes() {

    document
        .querySelectorAll(
            "[data-prize]"
        )
        .forEach(
            input => {

                const index =
                    Number(
                        input.dataset.prize
                    );


                state.prizes[index] =
                    input.value.trim() ||
                    defaultPrizes[index];

            }
        );


    initializePools();

    saveState();

    renderPrizeInputs();

    drawWheel();

    updateCounters();


    showToast(
        "✓ Nama 20 hadiah berhasil disimpan"
    );

}


/* =========================================================
   RESET
========================================================= */

function resetAll() {

    const confirmed =
        confirm(
            "RESET SEMUA HASIL UNDIAN?\n\n" +
            "Semua pemenang akan dihapus."
        );


    if(!confirmed)
        return;


    state = {

        prizes:
            [...state.prizes],

        winners:
            []

    };


    availableParticipants =
        [];


    availablePrizes =
        [];


    selectedPrize =
        null;


    drawing =
        false;


    saveState();

    initializePools();

    renderPrizeInputs();

    drawWheel();

    renderResults();

    updateCounters();


    stageLabel.textContent =
        "SIAP DIUNDI";


    prizeTitle.textContent =
        "Doorprize 01";


    prizeDescription.textContent =
        "Putar roda untuk menentukan hadiah";


    winnerName.textContent =
        "MENUNGGU HADIAH";


    winnerNo.textContent =
        "Undian belum dimulai";


    wishBalls.innerHTML =
        "";


    wishCenterSub.textContent =
        "Siap memilih";


    raceCountdown.textContent =
        "SIAP";


    raceCountdown.classList.remove(
        "suspense"
    );


    spinPrizeBtn.disabled =
        false;


    raceBtn.disabled =
        true;


    showToast(
        "↺ Undian berhasil di-reset"
    );

}


/* =========================================================
   EXPORT
========================================================= */

function exportCsv() {

    if(
        !state.winners.length
    ) {

        showToast(
            "Belum ada hasil undian."
        );

        return;

    }


    const rows = [

        [
            "No",
            "Hadiah",
            "No Peserta",
            "Nama Peserta"
        ]

    ];


    state.winners.forEach(
        (winner,index) => {

            rows.push([

                index + 1,

                winner.prize,

                winner.no,

                winner.name

            ]);

        }
    );


    const csv =
        "\ufeff" +
        rows
            .map(
                row =>
                    row
                        .map(
                            value =>
                                `"${String(value).replace(/"/g,'""')}"`
                        )
                        .join(",")
            )
            .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        "hasil-doorprize-kgb-2026.csv";


    link.click();


    URL.revokeObjectURL(
        url
    );

}


/* =========================================================
   FULLSCREEN
========================================================= */

async function toggleFullscreen() {

    if(
        !document.fullscreenElement
    ) {

        await document
            .documentElement
            .requestFullscreen();

    } else {

        await document.exitFullscreen();

    }

}


/* =========================================================
   CONFETTI
========================================================= */

function createConfetti() {

    const colors = [

        "#ffd45a",
        "#ff6674",
        "#52e1ad",
        "#5ca9ff",
        "#ffffff",
        "#c084fc"

    ];


    for(
        let i = 0;
        i < 75;
        i++
    ) {

        const piece =
            document.createElement(
                "div"
            );


        piece.style.position =
            "absolute";


        piece.style.width =
            "7px";


        piece.style.height =
            "12px";


        piece.style.left =
            "50%";


        piece.style.top =
            "50%";


        piece.style.background =
            colors[
                secureRandomInt(
                    colors.length
                )
            ];


        piece.style.zIndex =
            "200";


        piece.style.pointerEvents =
            "none";


        const x =
            -280 +
            secureRandomInt(560);


        const y =
            -160 -
            secureRandomInt(280);


        const rotation =
            secureRandomInt(720);


        piece.animate(

            [

                {
                    transform:
                        "translate(-50%,-50%) rotate(0deg) scale(.5)",
                    opacity:
                        1
                },

                {
                    transform:
                        `translate(${x}px,${y}px) rotate(${rotation}deg) scale(1)`,
                    opacity:
                        0
                }

            ],

            {

                duration:
                    1200 +
                    secureRandomInt(900),

                easing:
                    "cubic-bezier(.15,.7,.25,1)",

                fill:
                    "forwards"

            }

        );


        winnerStage.appendChild(
            piece
        );


        setTimeout(
            () =>
                piece.remove(),
            2300
        );

    }

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message
) {

    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        showToast.timer
    );


    showToast.timer =
        setTimeout(
            () =>
                toast.classList.remove(
                    "show"
                ),
            2500
        );

}


/* =========================================================
   EVENTS
========================================================= */

spinPrizeBtn.addEventListener(
    "click",
    spinPrize
);


raceBtn.addEventListener(
    "click",
    startWishBall
);


$("savePrizesBtn")
    .addEventListener(
        "click",
        savePrizes
    );


$("resetBtn")
    .addEventListener(
        "click",
        resetAll
    );


$("exportBtn")
    .addEventListener(
        "click",
        exportCsv
    );


$("fullscreenBtn")
    .addEventListener(
        "click",
        toggleFullscreen
);


/* =========================================================
   SPACE KEY
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if(
            event.code === "Space" &&
            ![
                "INPUT",
                "TEXTAREA"
            ].includes(
                document.activeElement.tagName
            )
        ) {

            event.preventDefault();


            if(drawing)
                return;


            if(!selectedPrize) {

                spinPrize();

            } else {

                startWishBall();

            }

        }

    }
);


/* =========================================================
   START
========================================================= */

initializePools();

renderPrizeInputs();

drawWheel();

renderResults();

updateCounters();


if(
    state.winners.length === 0
) {

    stageLabel.textContent =
        "SIAP DIUNDI";

    prizeTitle.textContent =
        "Doorprize 01";

    prizeDescription.textContent =
        "Putar roda untuk menentukan hadiah";

} else if(
    state.winners.length <
    TOTAL_PRIZES
) {

    prepareNextRound();

} else {

    stageLabel.textContent =
        "🎉 SELESAI";

    prizeTitle.textContent =
        "SEMUA HADIAH SUDAH DIUNDI";

    prizeDescription.textContent =
        "20 pemenang telah terpilih.";

    spinPrizeBtn.disabled =
        true;

    raceBtn.disabled =
        true;

}