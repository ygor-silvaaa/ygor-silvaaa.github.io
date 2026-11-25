// paradas.js
// Adiciona e remove paradas no caminho. Cada parada tem letra, CEP, número e endereço.
(function () {
    "use strict";

    const lista = document.getElementById("stops-list");
    const btnAdicionar = document.getElementById("add-stop-btn");
    const stopsInput = document.getElementById("stops-input");

    // 0 = A, 1 = B, 2 = C... (depois do Z, cai para número)
    const letra = (indice) =>
        indice < 26 ? String.fromCharCode(65 + indice) : String(indice + 1);

    // Atualiza as letras, os textos dos campos e a "Quantidade de paradas"
    function atualizar() {
        const blocos = lista.querySelectorAll(".parada");
        blocos.forEach((bloco, i) => {
            // Partida = A e destino = B, então as paradas começam na letra C
            const l = letra(i + 2);
            bloco.querySelector(".parada-letra").textContent = l;
            bloco.querySelector(".stop-cep").placeholder = `CEP da parada ${l}`;
            bloco.querySelector(".stop-address").placeholder = `Endereço da parada ${l}`;
        });

        // Conta só as paradas que têm endereço preenchido
        const enderecos = lista.querySelectorAll(".stop-address");
        const preenchidas = Array.from(enderecos).filter((c) => c.value.trim() !== "").length;
        stopsInput.value = preenchidas;
    }

    function criarInput(classe, tipo = "text") {
        const input = document.createElement("input");
        input.type = tipo;
        input.className = classe;
        return input;
    }

    function adicionarParada() {
        const bloco = document.createElement("div");
        bloco.className = "campo parada";

        // Linha 1: letra + CEP + número + botão de remover
        const linhaCep = document.createElement("div");
        linhaCep.className = "Parada-linha";

        const badge = document.createElement("span");
        badge.className = "parada-letra";

        const cepEl = criarInput("stop-cep");
        cepEl.maxLength = 9;
        cepEl.inputMode = "numeric";

        const numEl = criarInput("stop-number");
        numEl.placeholder = "Número";

        const btnRemover = document.createElement("button");
        btnRemover.type = "button";
        btnRemover.textContent = "✕";
        btnRemover.setAttribute("aria-label", "Remover parada");
        btnRemover.addEventListener("click", () => {
            bloco.remove();
            atualizar();
        });

        linhaCep.append(badge, cepEl, numEl, btnRemover);

        // Linha 2: endereço (o rota.js lê os campos com a classe stop-address)
        const enderecoEl = criarInput("stop-address");
        enderecoEl.addEventListener("input", atualizar);

        // Mensagem do CEP
        const statusEl = document.createElement("small");
        statusEl.className = "stop-cep-status";
        statusEl.setAttribute("aria-live", "polite");

        bloco.append(linhaCep, enderecoEl, statusEl);
        lista.appendChild(bloco);

        // Liga o ViaCEP a esta parada (função que está no cep.js)
        configurarCepEmElementos(cepEl, numEl, enderecoEl, statusEl);

        atualizar();
        cepEl.focus();
    }

    btnAdicionar.addEventListener("click", adicionarParada);
})();