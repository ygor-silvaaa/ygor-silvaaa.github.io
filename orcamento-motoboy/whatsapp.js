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

    whatsappBtn.addEventListener("click", () => {
        const origem = originInput ? originInput.value.trim() : "";
        const destino = destinationInput ? destinationInput.value.trim() : "";
        const distancia = distanceInput ? distanceInput.value.trim() : "0";
        const idaEVolta = roundtripInput && roundtripInput.checked ? "Sim" : "Não";
        const paradas = stopsInput ? stopsInput.value.trim() : "0";
        const totalTexto = resultDisplay ? resultDisplay.textContent.trim() : "Total: R$ 0,00";

        const linhas = [
            "*Orçamento de Entrega*",
            origem ? `• Partida: ${origem}` : null,
            destino ? `• Destino: ${destino}` : null,
            `• Distância: ${distancia} km`,
            `• Ida e volta: ${idaEVolta}`,
            `• Paradas adicionais: ${paradas}`,
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