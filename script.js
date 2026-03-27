const input = document.getElementById("contractInput");
const tableBody = document.getElementById("tableBody");
const tableHeader = document.getElementById("tableHeader");
const status = document.getElementById("status");

// Guardar DEX globales para mantener columnas consistentes
let globalDexList = [];

input.addEventListener("change", () => {
    const address = input.value.trim();
    if (address) loadToken(address);
});

async function loadToken(address) {
    status.innerText = "Cargando...";

    try {
        const res = await fetch(`https://api.dexscreener.com/token-pairs/v1/polygon/${address}`);
        const data = await res.json();

        console.log("API DATA:", data);

        if (!Array.isArray(data)) {
            status.innerText = "Error en datos";
            return;
        }

        // Filtrar pools con liquidez mínima
        const validPools = data.filter(p => (p.liquidity?.usd || 0) > 1000);

        if (validPools.length === 0) {
            status.innerText = "Sin datos disponibles";
            return;
        }

        // Agrupar por DEX (tomar el de mayor liquidez)
        const dexMap = {};

        validPools.forEach(p => {
            const dex = p.dexId;
            const price = parseFloat(p.priceUsd);
            const liquidity = p.liquidity?.usd || 0;

            if (!dexMap[dex] || liquidity > dexMap[dex].liquidity) {
                dexMap[dex] = { price, liquidity };
            }
        });

        console.log("DEX MAP:", dexMap);

        const currentDexList = Object.keys(dexMap);

        // Actualizar lista global de DEX
        currentDexList.forEach(dex => {
            if (!globalDexList.includes(dex)) {
                globalDexList.push(dex);
            }
        });

        // 🔥 RECONSTRUIR HEADER COMPLETO
        tableHeader.innerHTML = "<th>Token</th>";

        globalDexList.forEach(dex => {
            tableHeader.innerHTML += `<th>${dex}</th>`;
        });

        tableHeader.innerHTML += "<th>Liquidez</th><th>Spread</th>";

        // TOKEN SYMBOL
        const symbol = validPools[0].baseToken?.symbol || "TOKEN";

        // CALCULAR PRECIOS
        const prices = Object.values(dexMap).map(d => d.price);

        let spread = 0;
        if (prices.length >= 2) {
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            spread = ((max - min) / min) * 100;
        }

        const spreadClass = spread >= 0 ? "positive" : "negative";

        // LIQUIDEZ TOTAL
        const totalLiquidity = Object.values(dexMap)
            .reduce((sum, d) => sum + d.liquidity, 0);

        // CREAR FILA
        let row = `<tr><td>${symbol}</td>`;

        globalDexList.forEach(dex => {
            if (dexMap[dex]) {
                row += `<td>$${dexMap[dex].price.toFixed(4)}</td>`;
            } else {
                row += `<td>-</td>`;
            }
        });

        row += `<td>$${totalLiquidity.toLocaleString()}</td>`;
        row += `<td class="${spreadClass}">${spread.toFixed(2)}%</td></tr>`;

        // 🔥 AGREGAR FILA (NO REEMPLAZAR)
        tableBody.innerHTML += row;

        status.innerText = "Token agregado ✔";

        // Limpiar input
        input.value = "";

    } catch (err) {
        console.error(err);
        status.innerText = "Error al cargar datos";
    }
}
