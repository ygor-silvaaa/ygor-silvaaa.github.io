// rota.js
// Busca a distância de carro entre dois endereços, preenche o campo de distância
// e desenha a rota em um mapa.
// Usa serviços gratuitos do OpenStreetMap, sem chave de acesso:
//   - Nominatim: transforma um endereço em coordenadas (latitude e longitude)
//   - OSRM: calcula a rota de carro entre duas coordenadas
//   - Leaflet: biblioteca que desenha o mapa na página
 
// Tudo fica dentro de uma função para os nomes das variáveis não colidirem com os do script.js.
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
 
    // O mapa e a camada com a rota são criados só na primeira busca
    let mapa = null;
    let camadaRota = null;
 
    // Guarda os endereços já buscados. A política do Nominatim pede que as
    // respostas sejam reaproveitadas em vez de repetir a mesma busca.
    const cacheEnderecos = new Map();
 
    const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
 
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
 
    async function buscarRota(origem, destino) {
        // Atenção: o OSRM espera "longitude,latitude" (nessa ordem)
        const caminho = `${origem.lon},${origem.lat};${destino.lon},${destino.lat}`;
 
        // overview=full + geometries=geojson devolve o desenho da rota, para o mapa
        const resposta = await fetch(`${OSRM_URL}/${caminho}?overview=full&geometries=geojson`);
        if (!resposta.ok) {
            throw new Error("O serviço de rotas não respondeu. Tente de novo em instantes.");
        }
 
        const dados = await resposta.json();
        if (dados.code !== "Ok" || !dados.routes || dados.routes.length === 0) {
            throw new Error("Não encontrei uma rota de carro entre os dois endereços.");
        }
 
        const rota = dados.routes[0];
        return {
            km: rota.distance / 1000, // o OSRM devolve metros
            geometria: rota.geometry,
        };
    }
 
    function mostrarMapa(origem, destino, geometria) {
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
            L.marker([origem.lat, origem.lon]).bindPopup("Partida").addTo(camadaRota);
            L.marker([destino.lat, destino.lon]).bindPopup("Destino").addTo(camadaRota);
 
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
            mostrarStatus("Preencha os dois endereços.", true);
            return;
        }
 
        routeBtn.disabled = true;
        mostrarStatus("Buscando a rota...");
 
        try {
            const a = await buscarCoordenadas(origem);
 
            // Nominatim: no máximo 1 pedido por segundo
            if (a.usouRede) await esperar(1100);
 
            const b = await buscarCoordenadas(destino);
            const rota = await buscarRota(a.coordenadas, b.coordenadas);
 
            distanceInput.value = rota.km.toFixed(1);
            // Avisa o resto da página, caso algum código escute mudanças no campo
            distanceInput.dispatchEvent(new Event("input", { bubbles: true }));
 
            mostrarMapa(a.coordenadas, b.coordenadas, rota.geometria);
 
            mostrarStatus(`Distância encontrada: ${rota.km.toFixed(1).replace(".", ",")} km (só ida).`);
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
})();