// ===================================
// DATA DAN VARIABEL
// ===================================

let processes = [];
let algorithm = "sjf";


// ===================================
// MEMILIH ALGORITMA
// ===================================

function changeTab(type) {

    algorithm = type;

    document.getElementById("sjfTab")
        .classList.toggle("active", type === "sjf");

    document.getElementById("rrTab")
        .classList.toggle("active", type === "rr");

    document.getElementById("algorithmTitle").textContent =
        type === "sjf"
        ? "Shortest Job First (SJF)"
        : "Round Robin (RR)";

    document.getElementById("description").textContent =
        type === "sjf"
        ? "Memilih proses dengan Burst Time paling kecil dari proses yang sudah tersedia (Non-Preemptive)."
        : "Menjalankan setiap proses secara bergiliran berdasarkan jatah waktu (Time Quantum).";

    document.getElementById("quantumBox")
        .classList.toggle("hidden", type !== "rr");

    document.getElementById("result")
        .classList.add("hidden");
}


// ===================================
// MENAMBAHKAN PROSES
// ===================================

function addProcess() {

    const pid = document.getElementById("pid").value.trim();
    const atInput = document.getElementById("at").value;
    const btInput = document.getElementById("bt").value;

    const at = Number(atInput);
    const bt = Number(btInput);

    if (
        !pid ||
        atInput === "" ||
        btInput === "" ||
        !Number.isInteger(at) ||
        at < 0 ||
        !Number.isInteger(bt) ||
        bt <= 0
    ) {
        alert("Masukkan ID proses, AT >= 0, dan BT > 0 berupa bilangan bulat!");
        return;
    }

    if (processes.some(p => p.pid === pid)) {
        alert("Process ID tidak boleh sama!");
        return;
    }

    processes.push({
        pid,
        at,
        bt,
        order: processes.length
    });

    document.getElementById("pid").value = "";
    document.getElementById("at").value = "";
    document.getElementById("bt").value = "";

    renderProcesses();
}


// ===================================
// MENAMPILKAN DATA PROSES
// ===================================

function renderProcesses() {

    const body = document.getElementById("processTable");

    body.innerHTML = "";

    processes.forEach((p, i) => {

        body.innerHTML += `
            <tr>
                <td>${p.pid}</td>
                <td>${p.at}</td>
                <td>${p.bt}</td>
                <td>
                    <button class="btn danger"
                    onclick="removeProcess(${i})">
                    Hapus
                    </button>
                </td>
            </tr>
        `;
    });
}


// ===================================
// MENGHAPUS PROSES
// ===================================

function removeProcess(index) {

    processes.splice(index, 1);

    processes.forEach((p, i) => {
        p.order = i;
    });

    renderProcesses();

    document.getElementById("result")
        .classList.add("hidden");
}


// ===================================
// DATA CONTOH
// ===================================

function loadExample() {

    processes = [

        {pid:"P1", at:0, bt:7, order:0},
        {pid:"P2", at:2, bt:4, order:1},
        {pid:"P3", at:4, bt:1, order:2},
        {pid:"P4", at:5, bt:4, order:3}

    ];

    renderProcesses();

    calculate();
}


// ===================================
// RESET DATA
// ===================================

function clearAll() {

    processes = [];

    renderProcesses();

    document.getElementById("result")
        .classList.add("hidden");
}


// ===================================
// MENJALANKAN PERHITUNGAN
// ===================================

function calculate() {

    if (processes.length === 0) {

        alert("Tambahkan minimal satu proses!");

        return;
    }

    let result;

    if (algorithm === "sjf") {

        result = calculateSJF();

    } else {

        const q = Number(
            document.getElementById("quantum").value
        );

        if (!Number.isInteger(q) || q <= 0) {

            alert("Time Quantum harus berupa bilangan bulat lebih dari 0!");

            return;
        }

        result = calculateRR(q);
    }

    showResults(result);
}


// ===================================
// ALGORITMA SJF NON-PREEMPTIVE
// ===================================

function calculateSJF() {

    let time = 0;
    let completed = 0;

    let data = processes.map(p => ({
        ...p,
        remaining: p.bt
    }));

    let segments = [];
    let results = [];

    while (completed < data.length) {

        let ready = data.filter(p =>
            p.remaining > 0 && p.at <= time
        );

        // Jika belum ada proses yang tiba
        if (ready.length === 0) {

            let next = Math.min(
                ...data
                    .filter(p => p.remaining > 0)
                    .map(p => p.at)
            );

            segments.push({
                pid: "IDLE",
                start: time,
                end: next
            });

            time = next;

            continue;
        }

        // Memilih Burst Time terkecil
        ready.sort((a, b) =>
            a.bt - b.bt ||
            a.at - b.at ||
            a.order - b.order
        );

        let p = ready[0];

        let start = time;

        time += p.bt;

        p.remaining = 0;

        p.ct = time;

        p.tat = p.ct - p.at;

        p.wt = p.tat - p.bt;

        segments.push({
            pid: p.pid,
            start,
            end: time
        });

        results.push(p);

        completed++;
    }

    return {
        segments,
        results
    };
}


// ===================================
// ALGORITMA ROUND ROBIN
// ===================================

function calculateRR(q) {

    let data = processes.map(p => ({
        ...p,
        remaining: p.bt
    }));

    // Mengurutkan berdasarkan Arrival Time
    data.sort((a, b) =>
        a.at - b.at || a.order - b.order
    );

    let queue = [];

    let segments = [];

    let time = 0;

    let next = 0;

    let completed = 0;

    while (completed < data.length) {

        // Jika antrean kosong
        if (queue.length === 0) {

            if (
                next < data.length &&
                time < data[next].at
            ) {

                segments.push({
                    pid: "IDLE",
                    start: time,
                    end: data[next].at
                });

                time = data[next].at;
            }

            // Memasukkan proses yang sudah tiba
            while (
                next < data.length &&
                data[next].at <= time
            ) {

                queue.push(data[next]);

                next++;
            }
        }

        // Mengambil proses pertama dalam antrean
        let p = queue.shift();

        let start = time;

        let duration = Math.min(q, p.remaining);

        time += duration;

        p.remaining -= duration;

        segments.push({
            pid: p.pid,
            start,
            end: time
        });

        // Memasukkan proses baru yang tiba
        while (
            next < data.length &&
            data[next].at <= time
        ) {

            queue.push(data[next]);

            next++;
        }

        // Jika belum selesai, kembali ke antrean
        if (p.remaining > 0) {

            queue.push(p);

        } else {

            p.ct = time;

            p.tat = p.ct - p.at;

            p.wt = p.tat - p.bt;

            completed++;
        }
    }

    return {
        segments,
        results: data
    };
}


// ===================================
// MENAMPILKAN HASIL PERHITUNGAN
// ===================================

function showResults(data) {

    let results = data.results.slice().sort(
        (a, b) => a.order - b.order
    );

    // Menghitung total WT dan TAT
    let totalWT = results.reduce(
        (sum, p) => sum + p.wt, 0
    );

    let totalTAT = results.reduce(
        (sum, p) => sum + p.tat, 0
    );

    // Menghitung rata-rata
    document.getElementById("avgWT").textContent =
        (totalWT / results.length).toFixed(2);

    document.getElementById("avgTAT").textContent =
        (totalTAT / results.length).toFixed(2);

    document.getElementById("totalProcess").textContent =
        results.length;

    // Menampilkan tabel hasil
    let body = document.getElementById("resultTable");

    body.innerHTML = "";

    results.forEach(p => {

        body.innerHTML += `
            <tr>
                <td>${p.pid}</td>
                <td>${p.at}</td>
                <td>${p.bt}</td>
                <td>${p.ct}</td>
                <td>${p.tat}</td>
                <td>${p.wt}</td>
            </tr>
        `;
    });

    // Menampilkan Gantt Chart
    let chart = document.getElementById("ganttChart");

    chart.innerHTML = "";

    data.segments.forEach(s => {

        let block = document.createElement("div");

        block.className =
            "block" + (s.pid === "IDLE" ? " idle" : "");

        block.innerHTML = `
            ${s.pid}
            <small>${s.start} – ${s.end}</small>
        `;

        block.title =
            `Mulai ${s.start}, selesai ${s.end}`;

        chart.appendChild(block);
    });

    // Penjelasan algoritma
    document.getElementById("explanation").textContent =

        algorithm === "sjf"

        ? "SJF Non-Preemptive: setiap proses dijalankan sampai selesai. Proses dipilih berdasarkan Burst Time terkecil di antara proses yang telah tiba."

        : "Round Robin: setiap proses memperoleh jatah waktu sesuai Time Quantum. Jika belum selesai, proses dimasukkan kembali ke akhir antrean.";

    // Menampilkan panel hasil
    document.getElementById("result")
        .classList.remove("hidden");
}