// whatsapp.js
// Monta a mensagem com os dados do orçamento e abre o WhatsApp com o texto preenchido.

(function () {
    "use strict";

    // Seu número configurado com DDI 55 (Brasil) + DDD 11 + número
    const WHATSAPP_NUMBER = "5511989698646";

    const form = document.getElementById("budget-form");
    const originInput = document.getElementById("origin-input");
    const destinationInput = document.getElementById("destination-input");
    const distanceInput = document.getElementById("distance-input");
    const roundtripInput = document.getElementById("roundtrip-input");
    const stopsInput = document.getElementById("stops-input");
    const resultDisplay = document.getElementById("result-display");
    const whatsappBtn = document.getElementById("whatsapp-btn");

    if (!whatsappBtn) return;

    // Habilita o botão assim que o formulário for enviado/calculado
    if (form) {
        form.addEventListener("submit", () => {
            whatsappBtn.disabled = false;
        });
    }

    // Lê os endereços das paradas adicionais (.stop-address) e atribui letras a partir de C
    function obterEnderecosParadas() {
        const campos = Array.from(document.querySelectorAll(".stop-address"));
        return campos
            .map((campo, indice) => {
                const endereco = campo.value ? campo.value.trim() : "";
                const letra = String.fromCharCode(67 + indice); // 67 = 'C', 68 = 'D', ...
                return { letra, endereco };
            })
            .filter((parada) => parada.endereco.length > 0);
    }

    whatsappBtn.addEventListener("click", () => {
        const origem = originInput ? originInput.value.trim() : "";
        const destino = destinationInput ? destinationInput.value.trim() : "";
        const distancia = distanceInput ? distanceInput.value.trim() : "0";
        const idaEVolta = roundtripInput && roundtripInput.checked ? "Sim" : "Não";
        const paradasExtras = obterEnderecosParadas();
        const totalParadas = stopsInput && stopsInput.value.trim() !== ""
            ? stopsInput.value.trim()
            : String(paradasExtras.length);
        const totalTexto = resultDisplay ? resultDisplay.textContent.trim() : "Total: R$ 0,00";

        const linhasParadas = paradasExtras.map(
            (parada) => `• Parada ${parada.letra}: ${parada.endereco}`
        );

        const linhas = [
            "*Orçamento de Entrega*",
            origem ? `• Partida: ${origem}` : null,
            destino ? `• Destino: ${destino}` : null,
            ...linhasParadas,
            `• Distância: ${distancia} km`,
            `• Ida e volta: ${idaEVolta}`,
            `• Paradas adicionais: ${totalParadas}`,
            `*${totalTexto}*`,
        ].filter(Boolean);

        const mensagemCodificada = encodeURIComponent(linhas.join("\n"));
        const numeroLimpo = WHATSAPP_NUMBER.replace(/\D/g, "");

        const url = numeroLimpo
            ? `https://wa.me/${numeroLimpo}?text=${mensagemCodificada}`
            : `https://wa.me/?text=${mensagemCodificada}`;

        window.open(url, "_blank", "noopener,noreferrer");
    });
})();