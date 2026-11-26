// cep.js
// Preenche o endereço a partir do CEP (ViaCEP) e coloca o número no endereço.
// Funciona para a partida, o destino e cada parada.

function configurarCepEmElementos(cepEl, numEl, enderecoEl, statusEl) {
    let dados = null;        // dados do ViaCEP (quando o endereço veio de um CEP)
    let baseManual = null;   // endereço digitado à mão, ainda sem o número
    let textoGerado = "";    // último texto que este código escreveu no campo de endereço

    function avisarMudanca() {
        // Avisa quem escuta o campo (a contagem de paradas, por exemplo)
        enderecoEl.dispatchEvent(new Event("input", { bubbles: true }));
    }

    // Endereço que veio de um CEP: rua + número + cidade + UF
    function montarEndereco() {
        if (!dados) return;

        const partes = [];
        if (dados.logradouro) {
            partes.push(dados.logradouro);
            if (numEl.value.trim()) partes.push(numEl.value.trim());
        } else if (dados.bairro) {
            partes.push(dados.bairro);
        }
        partes.push(dados.localidade, dados.uf);

        enderecoEl.value = partes.filter(Boolean).join(", ");
        textoGerado = enderecoEl.value;
        avisarMudanca();
    }

    // Endereço digitado à mão: coloca o número depois da rua (antes da primeira vírgula)
    function inserirNumeroNoEnderecoManual() {
        // Se o endereço mudou por outro caminho, usa o texto atual como base
        if (baseManual === null || enderecoEl.value !== textoGerado) {
            baseManual = enderecoEl.value.trim();
        }
        if (!baseManual) {
            baseManual = null;
            return;
        }

        const numero = numEl.value.trim();

        if (!numero) {
            enderecoEl.value = baseManual;
        } else {
            const virgula = baseManual.indexOf(",");
            const rua = virgula === -1 ? baseManual : baseManual.slice(0, virgula).trim();
            const resto = virgula === -1 ? "" : baseManual.slice(virgula + 1).trim();
            enderecoEl.value = resto ? `${rua}, ${numero}, ${resto}` : `${rua}, ${numero}`;
        }

        textoGerado = enderecoEl.value;
        avisarMudanca();
    }

    function aoMudarNumero() {
        // Se o endereço foi alterado à mão depois do CEP, deixa de usar os dados do CEP
        if (dados && enderecoEl.value !== textoGerado) dados = null;

        if (dados) montarEndereco();
        else inserirNumeroNoEnderecoManual();
    }

    async function buscarCep() {
        const limpo = cepEl.value.replace(/\D/g, "");
        if (limpo.length !== 8) return;

        statusEl.textContent = "Buscando CEP...";
        try {
            const resp = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
            const resultado = await resp.json();

            if (resultado.erro) {
                dados = null;
                statusEl.textContent = "CEP não encontrado.";
                return;
            }

            dados = resultado;
            statusEl.textContent = resultado.logradouro
                ? "Endereço encontrado. Informe o número."
                : "CEP sem rua específica. Digite o endereço completo abaixo.";
            montarEndereco();
            numEl.focus();
        } catch (erro) {
            dados = null;
            statusEl.textContent = "Erro ao consultar o CEP. Digite o endereço manualmente.";
        }
    }

    // Máscara 00000-000 enquanto digita + busca automática com 8 dígitos
    cepEl.addEventListener("input", () => {
        let v = cepEl.value.replace(/\D/g, "").slice(0, 8);
        if (v.length > 5) v = v.slice(0, 5) + "-" + v.slice(5);
        cepEl.value = v;
        if (v.length === 9) buscarCep();
    });

    // Número digitado: coloca (ou atualiza) o número no endereço
    numEl.addEventListener("input", aoMudarNumero);
}

// Versão para a partida e o destino (campos com id fixo no HTML)
function configurarCep(prefixo) {
    configurarCepEmElementos(
        document.getElementById(`${prefixo}-cep`),
        document.getElementById(`${prefixo}-number`),
        document.getElementById(`${prefixo}-input`),
        document.getElementById(`${prefixo}-cep-status`)
    );
}

configurarCep("origin");
configurarCep("destination");