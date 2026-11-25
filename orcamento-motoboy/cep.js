// cep.js
// Preenche os campos de endereço a partir do CEP (usa a API gratuita ViaCEP).

// Liga um grupo de campos (CEP, número, endereço e mensagem) ao ViaCEP.
// Serve para a partida, o destino e cada parada.
function configurarCepEmElementos(cepEl, numEl, enderecoEl, statusEl) {
    let dados = null;

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
        // Avisa quem escuta o campo (a contagem de paradas, por exemplo)
        enderecoEl.dispatchEvent(new Event("input", { bubbles: true }));
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

    // Se o número mudar, atualiza o endereço
    numEl.addEventListener("input", montarEndereco);
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