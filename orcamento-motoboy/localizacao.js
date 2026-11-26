// localizacao.js
// Preenche o endereço de partida com a localização atual do aparelho.
(function () {
    "use strict";

    const btn = document.getElementById("use-location-btn");
    const statusEl = document.getElementById("origin-location-status");
    const originInput = document.getElementById("origin-input");

    function mostrar(texto) {
        statusEl.textContent = texto;
    }

    // Nominatim (reverso): transforma latitude/longitude em endereço
    async function buscarEnderecoDasCoordenadas(lat, lon) {
        const parametros = new URLSearchParams({
            lat,
            lon,
            format: "jsonv2",
            zoom: "18",
            addressdetails: "1",
            "accept-language": "pt-BR",
        });

        const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?${parametros}`);
        if (!resp.ok) throw new Error("Falha na busca do endereço");

        const dados = await resp.json();
        const a = dados.address || {};
        const cidade = a.city || a.town || a.village || a.municipality;
        const partes = [a.road, a.house_number, a.suburb, cidade, a.state].filter(Boolean);

        return partes.join(", ");
    }

    function mensagemDeErro(erro) {
        if (erro.code === 1) {
            return "Permissão negada. Libere a localização nas configurações do navegador para este site.";
        }
        if (erro.code === 2) {
            return "Não consegui descobrir sua localização. Digite o endereço manualmente.";
        }
        if (erro.code === 3) {
            return "A localização demorou demais. Tente de novo.";
        }
        return "Não foi possível pegar sua localização.";
    }

    btn.addEventListener("click", () => {
        if (!("geolocation" in navigator)) {
            mostrar("Este navegador não permite usar a localização.");
            return;
        }

        btn.disabled = true;
        mostrar("Buscando sua localização...");

        navigator.geolocation.getCurrentPosition(
            async (posicao) => {
                const lat = posicao.coords.latitude;
                const lon = posicao.coords.longitude;

                let texto = "";
                try {
                    texto = await buscarEnderecoDasCoordenadas(lat, lon);
                } catch (erro) {
                    texto = "";
                }
                // Se não achou o endereço escrito, a rota ainda funciona pelas coordenadas
                if (!texto) texto = "Minha localização atual";

                originInput.value = texto;
                // Guarda as coordenadas exatas (o rota.js usa elas em vez de buscar o texto de novo)
                originInput.dataset.lat = lat;
                originInput.dataset.lon = lon;
                originInput.dataset.texto = texto;
                originInput.dispatchEvent(new Event("input", { bubbles: true }));

                mostrar("Localização preenchida. Confira o endereço.");
                btn.disabled = false;
            },
            (erro) => {
                mostrar(mensagemDeErro(erro));
                btn.disabled = false;
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    });
})();