// rota.js
// Busca a distância de carro entre a partida, o destino e as paradas,
// preenche o campo de distância e desenha a rota em um mapa.
// Usa serviços gratuitos do OpenStreetMap, sem chave de acesso:
//   - Nominatim: transforma um endereço em coordenadas (latitude e longitude)
//   - OSRM: calcula a rota de carro passando por todos os pontos
//   - Leaflet: biblioteca que desenha o mapa na página

(function () {
    "use strict";

    const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
    const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

    const originInput = document.getElementById("origin-input");
    const destinationInput = document.getElementById("destination-input");
    const distanceInput = document.getElementById("distance-input");
    const routeBtn = document.getElementById("route-btn");
    const routeStatus = document.getElementById("route-status");
    const mapaEl = document.getElementById("map");
    const roundTripInput = document.getElementById("roundtrip-input");

    let mapa = null;
    let camadaRota = null;

    // Guarda os endereços já buscados (a política do Nominatim pede isso)
    const cacheEnderecos = new Map();

    const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // 0 = A, 1 = B, 2 = C... (depois do Z, cai para número)
    const letra = (indice) =>
        indice < 26 ? String.fromCharCode(65 + indice) : String(indice + 1);

    function mostrarStatus(texto, ehErro = false) {
        routeStatus.textContent = ehErro ? `⚠️ ${texto}` : texto;
    }

    async function buscarCoordenadas(endereco) {
        const chave = endereco.trim().toLowerCase();

        if (cacheEnderecos.has(chave)) {
            return { coordenadas: cacheEnderecos.get(chave), usouRede: false };
        }

        const parametros = new URLSearchParams({
            q: endereco,
            format: "jsonv2",
            limit: "1",
            countrycodes: "br",
            "accept-language": "pt-BR",
        });

        const resposta = await fetch(`${NOMINATIM_URL}?${parametros}`);
        if (!resposta.ok) {
            throw new Error("O serviço de endereços não respondeu. Tente de novo em instantes.");
        }

        const resultados = await resposta.json();
        if (resultados.length === 0) {
            throw new Error(`Não encontrei este endereço: "${endereco}". Tente incluir cidade e estado.`);
        }

        const coordenadas = {
            lat: Number(resultados[0].lat),
            lon: Number(resultados[0].lon),
        };
        cacheEnderecos.set(chave, coordenadas);
        return { coordenadas, usouRede: true };
    }

    // Recebe uma LISTA de pontos: partida, destino, paradas...
    async function buscarRota(pontos) {
        // O OSRM espera "longitude,latitude" e pontos separados por ponto e vírgula
        const caminho = pontos.map((p) => `${p.lon},${p.lat}`).join(";");

        const resposta = await fetch(`${OSRM_URL}/${caminho}?overview=full&geometries=geojson`);
        if (!resposta.ok) {
            throw new Error("O serviço de rotas não respondeu. Tente de novo em instantes.");
        }

        const dados = await resposta.json();
        if (dados.code !== "Ok" || !dados.routes || dados.routes.length === 0) {
            throw new Error("Não encontrei uma rota de carro passando por todos os endereços.");
        }

        const rota = dados.routes[0];
        return {
            km: rota.distance / 1000, // o OSRM devolve metros
            geometria: rota.geometry,
        };
    }

    function mostrarMapa(pontos, geometria) {
        // Se o Leaflet não carregou, a distância continua funcionando, só sem mapa
        if (typeof L === "undefined" || !mapaEl) return;

        try {
            mapaEl.hidden = false;

            if (!mapa) {
                mapa = L.map(mapaEl);
                L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    maxZoom: 19,
                    attribution:
                        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
                }).addTo(mapa);
                camadaRota = L.layerGroup().addTo(mapa);
            }

            camadaRota.clearLayers();

            const linha = L.geoJSON(geometria, { style: { weight: 5 } }).addTo(camadaRota);

            // Um marcador com letra para cada ponto: A (partida), B (destino), C, D... (paradas)
            pontos.forEach((ponto, i) => {
                let rotulo;
                if (i === 0) rotulo = "Partida";
                else if (i === 1) rotulo = "Destino";
                else rotulo = "Parada";

                const icone = L.divIcon({
                    className: "marcador-letra",
                    html: `<span>${letra(i)}</span>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15],
                    popupAnchor: [0, -15],
                });

                L.marker([ponto.lat, ponto.lon], { icon: icone })
                    .bindPopup(`${letra(i)} - ${rotulo}`)
                    .addTo(camadaRota);
            });

            // O mapa estava escondido: avisa o Leaflet o tamanho real antes de enquadrar a rota
            mapa.invalidateSize();
            mapa.fitBounds(linha.getBounds(), { padding: [30, 30] });
        } catch (erro) {
            console.error("Não foi possível desenhar o mapa:", erro);
        }
    }

            routeBtn.addEventListener("click", async () => {
        const origem = originInput.value.trim();
        const destino = destinationInput.value.trim();

        if (!origem || !destino) {
            mostrarStatus("Preencha os endereços de partida e de destino.", true);
            return;
        }

        // Paradas preenchidas (campos vazios são ignorados)
        const paradas = Array.from(document.querySelectorAll(".stop-address"))
            .map((campo) => campo.value.trim())
            .filter(Boolean);

        const idaEVolta = roundTripInput.checked;

        // Ordem da rota: partida -> destino -> paradas (mesma ordem da tela)
        const enderecos = [origem, destino, ...paradas];

        routeBtn.disabled = true;
        mostrarStatus("Buscando a rota...");

        try {
            const pontos = [];
            let ultimaUsouRede = false;

            for (const endereco of enderecos) {
                // Nominatim: no máximo 1 pedido por segundo
                if (ultimaUsouRede) await esperar(1100);

                const resultado = await buscarCoordenadas(endereco);
                pontos.push(resultado.coordenadas);
                ultimaUsouRede = resultado.usouRede;
            }

            // Ida e volta: a rota termina voltando para a partida (ponto A).
            // Usa as mesmas coordenadas, então não faz nenhuma busca nova.
            const pontosDaRota = idaEVolta ? [...pontos, pontos[0]] : pontos;
            const rota = await buscarRota(pontosDaRota);

            distanceInput.value = rota.km.toFixed(1);
            // Guarda se esta distância já inclui a volta (o script.js usa isso para não dobrar de novo)
            distanceInput.dataset.voltaIncluida = idaEVolta ? "true" : "false";
            // Avisa o resto da página, caso algum código escute mudanças no campo
            distanceInput.dispatchEvent(new Event("input", { bubbles: true }));

            // O mapa mostra só os pontos A, B, C... (a linha da rota já volta até o A)
            mostrarMapa(pontos, rota.geometria);

            // Roteiro em letras: A → B → C → A
            const sequencia = pontos.map((_, i) => letra(i));
            if (idaEVolta) sequencia.push(letra(0));

            const textoParadas = paradas.length > 0
                ? `, com ${paradas.length} ${paradas.length === 1 ? "parada" : "paradas"}`
                : "";
            const tipo = idaEVolta ? "ida e volta" : "só ida";

            mostrarStatus(
                `Distância encontrada: ${rota.km.toFixed(1).replace(".", ",")} km (${tipo}${textoParadas}). Roteiro: ${sequencia.join(" → ")}`
            );
        } catch (erro) {
            // TypeError acontece quando o navegador não consegue nem fazer o pedido (sem internet, por exemplo)
            const mensagem = erro instanceof TypeError
                ? "Sem conexão com os serviços de mapa. Confira sua internet ou digite a distância manualmente."
                : erro.message;
            mostrarStatus(mensagem, true);
        } finally {
            routeBtn.disabled = false;
        }
    });

    // Se a pessoa digitar a distância à mão, ela deixa de ser a distância da rota
    distanceInput.addEventListener("input", (evento) => {
        if (evento.isTrusted) delete distanceInput.dataset.voltaIncluida;
    });

    // Se marcar ou desmarcar "Ida e volta" depois de calcular a rota, recalcula sozinho
    roundTripInput.addEventListener("change", () => {
        if (distanceInput.dataset.voltaIncluida !== undefined && !routeBtn.disabled) {
            routeBtn.click();
        }
    });
})();