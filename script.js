const input = document.getElementById("contractInput");
const tableBody = document.getElementById("tableBody");
const tableHeader = document.getElementById("tableHeader");
const status = document.getElementById("status");

input.addEventListener("change", () => {
    const address = input.value.trim();
    if(address) loadToken(address);
});

async function loadToken(address) {
    status.innerText = "Cargando...";
    tableBody.innerHTML = "";

    try {
        const res = await fetch(`https://api.dexscreener.com/token-pairs/v1/polygon/${address}`);
        const data = await res.json();

        console.log("API DATA:", data);

        if(!Array.isArray(data)) {
            status.innerText = "Error en datos";
            return;
        }

        // FILTRAR LIQUIDEZ
        const validPools = data.filter(p => (p.liquidity?.usd || 0) > 1000);

        if(validPools.length === 0) {
            status.innerText = "Sin datos disponibles";
            return;
        }

        // AGRUPAR POR DEX
        const dexMap = {};

        validPools.forEach(p => {
            const dex = p.dexId;
            const price = parseFloat(p.priceUsd);
            const liquidity = p.liquidity?.usd || 0;

            if(!dexMap[dex] || liquidity > dexMap[dex].liquidity) {
                dexMap[dex] = { price, liquidity };
            }
        });

        console.log("DEX MAP:", dexMap);

        const dexList = Object.keys(dexMap);

        // CREAR HEADER DINÁMICO
        tableHeader.innerHTML = "<th>Token</th>";
        dexList.forEach(dex => {
            tableHeader.innerHTML += `<th>${dex}</th>`;
        });
        tableHeader.innerHTML += "<th>Liquidez</th><th>Spread</th>";

        // CALCULAR PRECIOS
        const prices = dexList.map(d => dexMap[d].price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const spread = ((max - min) / min) * 100;

        const spreadClass = spread >= 0 ? "positive" : "negative";

        // TOKEN SYMBOL
        const symbol = validPools[0].baseToken?.symbol || "TOKEN";

        // LIQUIDEZ TOTAL
        const totalLiquidity = dexList.reduce((sum, d) => sum + dexMap[d].liquidity, 0);

        // CREAR FILA
        let row = `<tr><td>${symbol}</td>`;

        dexList.forEach(dex => {
            row += `<td>$${dexMap[dex].price.toFixed(4)}</td>`;
        });

        row += `<td>$${totalLiquidity.toLocaleString()}</td>`;
        row += `<td class="${spreadClass}">${spread.toFixed(2)}%</td></tr>`;

        tableBody.innerHTML = row;

        status.innerText = "Datos cargados";

    } catch (err) {
        console.error(err);
        status.innerText = "Error al cargar datos";
    }
}
