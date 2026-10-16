// Seleciona o botão que criamos no HTML pelo ID 
const botaoTema = document.getElementById('botao-tema');
// Adciona o evento de clique no botão 
botaoTema.addEventListener('click',() => {
     //Codigo que sera executado quando o botao for clicado
     document.body.classList.toggle('dark-mode');
});