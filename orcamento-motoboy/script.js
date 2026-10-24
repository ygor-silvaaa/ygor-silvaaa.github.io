// 1. Configuracoes de preco  (Precos fixos e taxas)
const MINIMUM_FEE = 30.00;      // Taxa minima para ate 14km 
const PRICE_PER_KM = 2.00;      // Valor por km a partir de 15km 
const PRICE_PER_STOP = 10.00;   // Valor cobrado por parada adicional

// 2. Funcao que calcula o orcamento com base nas suas regras 
function calculateBudget(distance, stops) {
    let deliveryTotal = 0;

    // Regra da distancia: se for ate 14km, cobra a taxa minima. Se passar, calcula por Km.
if (distance <= 14) {
    deliveryTotal = MINIMUM_FEE;
}    else {
    deliveryTotal = distance * PRICE_PER_KM;
    }

    //Regra das paradas: multiplica a quantidade de paradas pelo valor fixo por parada
    let stopsTotal = stops * PRICE_PER_STOP;

    //Soma o total da entrega com total das paradas 
    let finalBudget = deliveryTotal + stopsTotal;

    return finalBudget.toFixed(2);
}

// 3. Testes no console para validar a logica 
console.log("Teste 1 (10km, 0 paradas  ): R$ " + calculateBudget(10, 0)); //deve dar 30,00
console.log("Teste 2 (20km, 0 paradas  ): R$ " + calculateBudget(20, 0)); //deve dar 40,00 (20 * 2)
console.log("Teste 3 (20km, 2 paradas  ): R$ " + calculateBudget(20, 2)); //deve dar 60,00 (40 + 20)

// 1. Pegar os elementos da tela do HTML usando os IDs 
const form = document.getElementById('budget-form');
const distanceImput = document.getElementById('distance-input');
const stopsInput = document.getElementById('stops-input');
const resultDisplay = document.getElementById('result-display');

// 2. Escutar o momento em que o usuario envia o formulario (clica no botao)
form.addEventListener('submit', (event) => {
// Evita que a pagina recarregue e suma com os dados 
event.preventDefault();

// Captura os valores digitados na tela e converte para numeros 
const distanceValue = Number(distanceImput.value);
const stopsValue = Number(stopsInput.value);

// Executa a funcao de calculo que criamos antes passando esses valores 
const totalOrcamento = calculateBudget(distanceValue, stopsValue);

// Atualiza o texto na tela com o valor calculado 
resultDisplay.textContent = "Total: R$ " + totalOrcamento;
});
