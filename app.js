/****************************************************
 * APLIKASI PENCATAT PELANGGARAN SISWA
 * FRONTEND
 ****************************************************/


/*
 * ==================================================
 * MASUKKAN URL APPS SCRIPT DI SINI
 * ==================================================
 */

const API_URL =
    "https://script.google.com/macros/s/AKfycbwlDkanrDOxgjqsCWqeCqmIsYy4eH1pJ58abw28UE5O9BBudBVC0iW91GcJUEf22WTunw/exec";


/*
 * ==================================================
 * DATA APLIKASI
 * ==================================================
 */

let currentUser = null;

let daftarSiswa = [];

let daftarPelanggaran = [];

let siswaTerpilih = null;


/*
 * ==================================================
 * SAAT HALAMAN DIBUKA
 * ==================================================
 */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const savedUser =
            localStorage.getItem(
                "userPelanggaran"
            );

        if (savedUser) {

            try {

                currentUser =
                    JSON.parse(savedUser);

                tampilkanDashboard();

            } catch (error) {

                localStorage.removeItem(
                    "userPelanggaran"
                );

            }

        }

        setTanggalDanWaktu();

    }
);


/*
 * ==================================================
 * TANGGAL DAN WAKTU DEFAULT
 * ==================================================
 */

function setTanggalDanWaktu() {

    const sekarang =
        new Date();

    const tanggal =
        sekarang
            .toISOString()
            .split("T")[0];

    const jam =
        sekarang
            .toTimeString()
            .slice(0, 5);

    const tanggalInput =
        document.getElementById(
            "tanggal"
        );

    const waktuInput =
        document.getElementById(
            "waktu"
        );

    if (tanggalInput) {

        tanggalInput.value =
            tanggal;

    }

    if (waktuInput) {

        waktuInput.value =
            jam;

    }

}


/*
 * ==================================================
 * LOGIN
 * ==================================================
 */

async function login() {

    const username =
        document
            .getElementById("username")
            .value
            .trim();

    const password =
        document
            .getElementById("password")
            .value
            .trim();


    if (!username || !password) {

        showMessage(
            "loginMessage",
            "Username dan password wajib diisi.",
            "error"
        );

        return;

    }


    showLoading(true);


    try {

        const url =
            API_URL +
            "?action=login" +
            "&username=" +
            encodeURIComponent(username) +
            "&password=" +
            encodeURIComponent(password);


        const response =
            await fetch(url);


        const result =
            await response.json();


        if (!result.success) {

            showMessage(
                "loginMessage",
                result.message,
                "error"
            );

            return;

        }


        currentUser =
            result.user;


        localStorage.setItem(
            "userPelanggaran",
            JSON.stringify(currentUser)
        );


        tampilkanDashboard();


    } catch (error) {

        showMessage(
            "loginMessage",
            "Gagal terhubung ke server.",
            "error"
        );

        console.error(error);

    } finally {

        showLoading(false);

    }

}


/*
 * ==================================================
 * DASHBOARD BERDASARKAN ROLE
 * ==================================================
 */

function tampilkanDashboard() {

    document
        .getElementById("loginPage")
        .classList.add("hidden");


    document
        .getElementById("gdsPage")
        .classList.add("hidden");


    document
        .getElementById("guruPage")
        .classList.add("hidden");


    if (
        currentUser.role === "GDS"
    ) {

        document
            .getElementById("gdsPage")
            .classList.remove("hidden");


        document
            .getElementById("gdsUserName")
            .textContent =
            currentUser.nama;


        loadDataGDS();

    }


    else if (
        currentUser.role === "GURU"
    ) {

        document
            .getElementById("guruPage")
            .classList.remove("hidden");


        document
            .getElementById("guruUserName")
            .textContent =
            currentUser.nama;


        loadRekap();

    }


    else {

        alert(
            "Role pengguna tidak dikenali."
        );

        logout();

    }

}


/*
 * ==================================================
 * LOAD DATA GDS
 * ==================================================
 */

async function loadDataGDS() {

    try {

        const [
            siswaResponse,
            pelanggaranResponse
        ] = await Promise.all([

            fetch(
                API_URL +
                "?action=getSiswa"
            ),

            fetch(
                API_URL +
                "?action=getJenisPelanggaran"
            )

        ]);


        const siswaResult =
            await siswaResponse.json();

        const pelanggaranResult =
            await pelanggaranResponse.json();


        if (
            siswaResult.success
        ) {

            daftarSiswa =
                siswaResult.data;

        }


        if (
            pelanggaranResult.success
        ) {

            daftarPelanggaran =
                pelanggaranResult.data;

        }


        setTanggalDanWaktu();


    } catch (error) {

        console.error(error);

        alert(
            "Gagal mengambil data dari server."
        );

    }

}


/*
 * ==================================================
 * CARI SISWA
 * ==================================================
 */

function cariSiswa() {

    const keyword =
        document
            .getElementById("searchSiswa")
            .value
            .toLowerCase()
            .trim();


    const hasil =
        document.getElementById(
            "hasilSiswa"
        );


    if (!keyword) {

        hasil.innerHTML = "";

        return;

    }


    const filtered =
        daftarSiswa.filter(
            function (siswa) {

                return (

                    String(siswa.nama)
                        .toLowerCase()
                        .includes(keyword)

                    ||

                    String(siswa.nis)
                        .toLowerCase()
                        .includes(keyword)

                    ||

                    String(siswa.kelas)
                        .toLowerCase()
                        .includes(keyword)

                );

            }
        );


    if (filtered.length === 0) {

        hasil.innerHTML = `
            <div class="empty">
                ❌ Siswa tidak ditemukan.
            </div>
        `;

        return;

    }


    hasil.innerHTML =
        filtered
            .slice(0, 10)
            .map(
                function (siswa) {

                    const foto =
                        siswa.foto ||
                        "icon.svg";


                    return `

                    <div
                        class="student-result"
                        onclick="pilihSiswa('${escapeJS(siswa.idSiswa)}')">

                        <img
                            class="student-result-photo"
                            src="${escapeHTML(foto)}"
                            alt="Foto siswa"
                            onerror="this.src='icon.svg'"
                        >

                        <div
                            class="student-result-info">

                            <strong>
                                ${escapeHTML(
                                    siswa.nama
                                )}
                            </strong>

                            <span>
                                NIS:
                                ${escapeHTML(
                                    siswa.nis
                                )}
                            </span>

                            <span>
                                Kelas:
                                ${escapeHTML(
                                    siswa.kelas
                                )}
                            </span>

                        </div>

                    </div>

                    `;

                }
            )
            .join("");

}

/*
 * ==================================================
 * PILIH SISWA
 * ==================================================
 */

function pilihSiswa(idSiswa) {

    siswaTerpilih =
        daftarSiswa.find(
            function (siswa) {

                return String(
                    siswa.idSiswa
                ) === String(idSiswa);

            }
        );


    if (!siswaTerpilih) {

        return;

    }


    document
        .getElementById("selectedName")
        .textContent =
        siswaTerpilih.nama;


    document
        .getElementById("selectedClass")
        .textContent =
        "Kelas: " +
        siswaTerpilih.kelas;


    document
        .getElementById("selectedNis")
        .textContent =
        "NIS: " +
        siswaTerpilih.nis;


    const photo =
        document.getElementById(
            "selectedPhoto"
        );


    photo.src =
        siswaTerpilih.foto ||
        "icon.svg";


    photo.onerror =
        function () {

            this.src =
                "icon.svg";

        };


    document
        .getElementById("selectedStudent")
        .classList.remove("hidden");


    document
        .getElementById("formPelanggaran")
        .classList.remove("hidden");


    document
        .getElementById("hasilSiswa")
        .innerHTML = "";


    document
        .getElementById("searchSiswa")
        .value =
        siswaTerpilih.nama;


    filterPelanggaran();

}

/*
 * ==================================================
 * HAPUS SISWA
 * ==================================================
 */

function hapusSiswa() {

    siswaTerpilih = null;


    document
        .getElementById("selectedStudent")
        .classList.add("hidden");


    document
        .getElementById("formPelanggaran")
        .classList.add("hidden");


    document
        .getElementById("searchSiswa")
        .value = "";


    document
        .getElementById("tingkat")
        .value = "";


    document
        .getElementById("rincian")
        .innerHTML =
        `<option value="">
            -- Pilih rincian --
        </option>`;

}


/*
 * ==================================================
 * FILTER RINCIAN PELANGGARAN
 * ==================================================
 */

function filterPelanggaran() {

    const tingkat =
        document
            .getElementById("tingkat")
            .value;


    const rincian =
        document.getElementById(
            "rincian"
        );


    const bobotInfo =
        document.getElementById(
            "bobotInfo"
        );


    const bobotText =
        document.getElementById(
            "bobotText"
        );


    rincian.innerHTML =
        `<option value="">
            -- Pilih rincian --
        </option>`;


    bobotInfo.classList.add(
        "hidden"
    );


    if (!tingkat) {

        return;

    }


    const filtered =
        daftarPelanggaran.filter(
            function (item) {

                return String(
                    item.tingkat
                ).toLowerCase()
                ===
                String(
                    tingkat
                ).toLowerCase();

            }
        );


    filtered.forEach(
        function (item) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                item.idPelanggaran;

            option.textContent =
                item.rincian +
                " (" +
                item.bobot +
                " poin)";


            option.dataset.bobot =
                item.bobot;


            rincian.appendChild(
                option
            );

        }
    );


    rincian.onchange =
        function () {

            const selected =
                rincian.options[
                    rincian.selectedIndex
                ];


            if (
                selected &&
                selected.value
            ) {

                bobotText.textContent =
                    selected.dataset.bobot;

                bobotInfo.classList.remove(
                    "hidden"
                );

            }

            else {

                bobotInfo.classList.add(
                    "hidden"
                );

            }

        };

}


/*
 * ==================================================
 * SIMPAN PELANGGARAN
 * ==================================================
 */

async function simpanPelanggaran() {

    if (!siswaTerpilih) {

        showMessage(
            "saveMessage",
            "Silakan pilih siswa terlebih dahulu.",
            "error"
        );

        return;

    }


    const tanggal =
        document
            .getElementById("tanggal")
            .value;


    const waktu =
        document
            .getElementById("waktu")
            .value;


    const tingkat =
        document
            .getElementById("tingkat")
            .value;


    const idPelanggaran =
        document
            .getElementById("rincian")
            .value;


    const rincianSelect =
        document
            .getElementById("rincian");


    const selectedOption =
        rincianSelect.options[
            rincianSelect.selectedIndex
        ];


    const rincian =
        selectedOption
            ? selectedOption.textContent
            : "";


    if (
        !tanggal ||
        !waktu ||
        !tingkat ||
        !idPelanggaran
    ) {

        showMessage(
            "saveMessage",
            "Semua data pelanggaran wajib diisi.",
            "error"
        );

        return;

    }


    const selectedItem =
        daftarPelanggaran.find(
            function (item) {

                return String(
                    item.idPelanggaran
                ) ===
                String(
                    idPelanggaran
                );

            }
        );


    const bobot =
        selectedItem
            ? selectedItem.bobot
            : 0;


    /*
     * KONFIRMASI
     */

    const konfirmasi =

        "KONFIRMASI PELANGGARAN\n\n" +

        "Siswa : " +
        siswaTerpilih.nama +
        "\n" +

        "Kelas : " +
        siswaTerpilih.kelas +
        "\n\n" +

        "Tanggal : " +
        tanggal +
        "\n" +

        "Waktu : " +
        waktu +
        "\n\n" +

        "Tingkat : " +
        tingkat +
        "\n" +

        "Pelanggaran : " +
        rincian +
        "\n" +

        "Bobot : " +
        bobot +
        " poin\n\n" +

        "Apakah data sudah benar?";


    if (!confirm(konfirmasi)) {

        return;

    }


    const data = {

        action:
            "simpanPelanggaran",

        idSiswa:
            siswaTerpilih.idSiswa,

        tanggal:
            tanggal,

        waktu:
            waktu,

        tingkat:
            tingkat,

        idPelanggaran:
            idPelanggaran,

        petugas:
            currentUser.nama

    };


    showLoading(true);


    try {

        const response =
            await fetch(
                API_URL,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },

                    body:
                        JSON.stringify(data)

                }
            );


        const result =
            await response.json();


        if (!result.success) {

            showMessage(
                "saveMessage",
                result.message,
                "error"
            );

            return;

        }


        tampilkanNotifikasi(
            "✅ Pelanggaran berhasil disimpan. " +
            result.data.nama +
            " mendapatkan " +
            result.data.bobot +
            " poin."
        );


        resetSetelahSimpan();


    } catch (error) {

        console.error(error);

        showMessage(
            "saveMessage",
            "Gagal menyimpan data.",
            "error"
        );

    } finally {

        showLoading(false);

    }

}

/*
 * ==================================================
 * RESET FORM
 * ==================================================
 */

function resetFormPelanggaran() {

    document
        .getElementById("tingkat")
        .value = "";


    document
        .getElementById("rincian")
        .innerHTML =
        `<option value="">
            -- Pilih rincian --
        </option>`;


    document
        .getElementById("bobotInfo")
        .classList.add("hidden");


    setTanggalDanWaktu();

}


/*
 * ==================================================
 * LOAD REKAP GURU
 * ==================================================
 */

async function loadRekap() {

    showLoading(true);


    try {

        const response =
            await fetch(
                API_URL +
                "?action=getRekap"
            );


        const result =
            await response.json();


        if (!result.success) {

            alert(
                result.message
            );

            return;

        }


        tampilkanRekap(
            result.data
        );


    } catch (error) {

        console.error(error);

        alert(
            "Gagal mengambil data ranking."
        );

    } finally {

        showLoading(false);

    }

}


/*
 * ==================================================
 * TAMPILKAN REKAP
 * ==================================================
 */

function tampilkanRekap(data) {

    const table =
        document.getElementById(
            "rankingTable"
        );


    document
        .getElementById(
            "totalSiswa"
        )
        .textContent =
        data.length;


    let totalKasus = 0;

    let poinTertinggi = 0;


    data.forEach(
        function (item) {

            totalKasus +=
                Number(
                    item.jumlahPelanggaran
                ) || 0;


            poinTertinggi =
                Math.max(
                    poinTertinggi,
                    Number(
                        item.totalPoin
                    ) || 0
                );

        }
    );


    document
        .getElementById(
            "totalKasus"
        )
        .textContent =
        totalKasus;


    document
        .getElementById(
            "poinTertinggi"
        )
        .textContent =
        poinTertinggi;


    if (!data.length) {

        table.innerHTML =
            `<tr>
                <td
                    colspan="8"
                    class="empty">

                    Belum ada data pelanggaran.

                </td>
            </tr>`;

        return;

    }


    table.innerHTML =
        data
            .map(
                function (item) {

                    let ranking =
                        item.ranking;


                    if (ranking === 1) {

                        ranking =
                            "🥇";

                    }

                    else if (
                        ranking === 2
                    ) {

                        ranking =
                            "🥈";

                    }

                    else if (
                        ranking === 3
                    ) {

                        ranking =
                            "🥉";

                    }


                    return `

                    <tr>

                        <td>
                            <span class="rank">
                                ${ranking}
                            </span>
                        </td>

                        <td>

                            <strong>
                                ${escapeHTML(
                                    item.nama
                                )}
                            </strong>

                            <br>

                            <small>
                                NIS:
                                ${escapeHTML(
                                    item.nis
                                )}
                            </small>

                        </td>

                        <td>
                            ${escapeHTML(
                                item.kelas
                            )}
                        </td>

                        <td>
                            ${item.ringan}
                        </td>

                        <td>
                            ${item.sedang}
                        </td>

                        <td>
                            ${item.berat}
                        </td>

                        <td>

                            <span class="point">
                                ${item.totalPoin}
                            </span>

                            poin

                        </td>

                        <td>

                            <button
                                class="detail-btn"
                                onclick="lihatDetail('${escapeJS(item.idSiswa)}')">

                                Detail

                            </button>

                        </td>

                    </tr>

                    `;

                }
            )
            .join("");

}


/*
 * ==================================================
 * DETAIL SISWA
 * ==================================================
 */

async function lihatDetail(idSiswa) {

    showLoading(true);


    try {

        const response =
            await fetch(
                API_URL +
                "?action=getDetail&idSiswa=" +
                encodeURIComponent(idSiswa)
            );


        const result =
            await response.json();


        if (!result.success) {

            alert(
                result.message
            );

            return;

        }


        tampilkanDetail(
            result.data
        );


    } catch (error) {

        console.error(error);

        alert(
            "Gagal mengambil detail."
        );

    } finally {

        showLoading(false);

    }

}


/*
 * ==================================================
 * TAMPILKAN DETAIL
 * ==================================================
 */

function tampilkanDetail(data) {

    const modal =
        document.getElementById(
            "detailModal"
        );


    const detailStudent =
        document.getElementById(
            "detailStudent"
        );


    const detailList =
        document.getElementById(
            "detailList"
        );


    if (!data.length) {

        detailList.innerHTML =
            "Tidak ada data.";

        modal.classList.remove(
            "hidden"
        );

        return;

    }


    const siswa =
        data[0];


    document
        .getElementById(
            "detailTitle"
        )
        .textContent =
        "Detail - " +
        siswa.nama;


    detailStudent.innerHTML = `

        <strong>
            ${escapeHTML(
                siswa.nama
            )}
        </strong>

        <br>

        Kelas:
        ${escapeHTML(
            siswa.kelas
        )}

        <br>

        NIS:
        ${escapeHTML(
            siswa.nis
        )}

    `;


    detailList.innerHTML =
        data
            .slice()
            .reverse()
            .map(
                function (item) {

                    const badgeClass =
                        getBadgeClass(
                            item.tingkat
                        );


                    return `

                    <div
                        class="detail-item">

                        <strong>
                            ${formatTanggal(
                                item.tanggal
                            )}
                        </strong>

                        •
                        ${escapeHTML(
                            item.waktu
                        )}

                        <br>

                        <span
                            class="badge ${badgeClass}">

                            ${escapeHTML(
                                item.tingkat
                            )}

                            -
                            ${item.bobot}
                            poin

                        </span>

                        <br>

                        ${escapeHTML(
                            item.rincian
                        )}

                        <br>

                        <small>
                            Petugas:
                            ${escapeHTML(
                                item.petugas
                            )}
                        </small>

                    </div>

                    `;

                }
            )
            .join("");


    modal.classList.remove(
        "hidden"
    );

}


/*
 * ==================================================
 * TUTUP DETAIL
 * ==================================================
 */

function closeDetail() {

    document
        .getElementById(
            "detailModal"
        )
        .classList.add(
            "hidden"
        );

}


/*
 * ==================================================
 * LOGOUT
 * ==================================================
 */

function logout() {

    currentUser = null;

    siswaTerpilih = null;

    localStorage.removeItem(
        "userPelanggaran"
    );


    document
        .getElementById("gdsPage")
        .classList.add("hidden");


    document
        .getElementById("guruPage")
        .classList.add("hidden");


    document
        .getElementById("loginPage")
        .classList.remove("hidden");


    document
        .getElementById("username")
        .value = "";


    document
        .getElementById("password")
        .value = "";

}


/*
 * ==================================================
 * LOADING
 * ==================================================
 */

function showLoading(status) {

    const loading =
        document.getElementById(
            "loading"
        );


    if (status) {

        loading.classList.remove(
            "hidden"
        );

    }

    else {

        loading.classList.add(
            "hidden"
        );

    }

}


/*
 * ==================================================
 * MESSAGE
 * ==================================================
 */

function showMessage(
    elementId,
    message,
    type
) {

    const element =
        document.getElementById(
            elementId
        );


    element.textContent =
        message;


    element.className =
        "message " +
        type;


    setTimeout(
        function () {

            element.className =
                "message";

        },
        5000
    );

}


/*
 * ==================================================
 * BADGE
 * ==================================================
 */

function getBadgeClass(
    tingkat
) {

    const value =
        String(
            tingkat
        ).toLowerCase();


    if (value === "ringan") {

        return "badge-ringan";

    }


    if (value === "sedang") {

        return "badge-sedang";

    }


    return "badge-berat";

}


/*
 * ==================================================
 * FORMAT TANGGAL
 * ==================================================
 */

function formatTanggal(
    tanggal
) {

    if (!tanggal) {

        return "-";

    }


    const parts =
        String(tanggal)
            .split("-");


    if (parts.length === 3) {

        return (
            parts[2] +
            "/" +
            parts[1] +
            "/" +
            parts[0]
        );

    }


    return tanggal;

}


/*
 * ==================================================
 * KEAMANAN HTML
 * ==================================================
 */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


function escapeJS(value) {

    return String(
        value ?? ""
    )
    .replace(
        /\\/g,
        "\\\\"
    )
    .replace(
        /'/g,
        "\\'"
    );

}


function tampilkanNotifikasi(message) {

    const notification =
        document.createElement(
            "div"
        );


    notification.className =
        "success-notification";


    notification.textContent =
        message;


    document.body.appendChild(
        notification
    );


    setTimeout(
        function () {

            notification.remove();

        },
        4000
    );

}


function resetSetelahSimpan() {

    siswaTerpilih = null;


    document
        .getElementById(
            "selectedStudent"
        )
        .classList.add(
            "hidden"
        );


    document
        .getElementById(
            "formPelanggaran"
        )
        .classList.add(
            "hidden"
        );


    document
        .getElementById(
            "searchSiswa"
        )
        .value = "";


    document
        .getElementById(
            "hasilSiswa"
        )
        .innerHTML = "";


    document
        .getElementById(
            "tingkat"
        )
        .value = "";


    document
        .getElementById(
            "rincian"
        )
        .innerHTML =
        `<option value="">
            -- Pilih rincian --
        </option>`;


    document
        .getElementById(
            "bobotInfo"
        )
        .classList.add(
            "hidden"
        );


    setTanggalDanWaktu();

}


// =====================================
// PWA SERVICE WORKER
// =====================================

if ("serviceWorker" in navigator) {

    window.addEventListener(
        "load",
        function () {

            navigator.serviceWorker
                .register("./sw.js")
                .then(function (registration) {

                    console.log(
                        "Service Worker aktif:",
                        registration.scope
                    );

                })
                .catch(function (error) {

                    console.error(
                        "Service Worker gagal:",
                        error
                    );

                });

        }
    );

}
