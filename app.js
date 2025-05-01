// app.js - Funcionalidade principal para a aplicação de atribuição de cardeais

// Importar os dados dos cardeais do arquivo externo
import cardinals from './cardinals.js';

/**
 * Atualiza as opções de dias com base no mês selecionado
 * Se nenhum mês estiver selecionado, exibe todos os 31 dias
 */
function updateDayOptions() {
  const monthSelect = document.getElementById('month-select');
  const daySelect = document.getElementById('day-select');
  const monthValue = monthSelect.value;
  
  // Restaurar o placeholder mas manter seleção atual
  const currentSelectedDay = daySelect.value;
  daySelect.innerHTML = '<option value="" disabled selected>Dia</option>';
  
  // Determinar quantos dias exibir
  let daysInMonth = 31; // Por padrão, exibimos 31 dias
  
  // Se houver um mês selecionado, calculamos o número correto de dias
  if (monthValue) {
    if (['04', '06', '09', '11'].includes(monthValue)) {
      daysInMonth = 30;
    } else if (monthValue === '02') {
      daysInMonth = 29; // Assumimos ano bissexto para cobrir todos os casos
    }
  }

  // Adicionar as opções de dias
  for (let i = 1; i <= daysInMonth; i++) {
    const dayValue = i.toString().padStart(2, '0');
    const option = document.createElement('option');
    option.value = dayValue;
    option.textContent = i;
    daySelect.appendChild(option);
  }
  
  // Tentar restaurar o dia selecionado previamente se for válido
  if (currentSelectedDay && parseInt(currentSelectedDay) <= daysInMonth) {
    daySelect.value = currentSelectedDay;
  }
}

/**
 * Encontra e exibe o cardeal correspondente à data selecionada
 * Implementa uma solução mais robusta para o deslocamento de imagens
 */
function findCardinal() {
  const monthSelect = document.getElementById('month-select');
  const daySelect = document.getElementById('day-select');
  const month = monthSelect.value;
  const day = daySelect.value;
  
  // Validação básica
  if (!month || !day) {
    alert('Por favor, selecione o mês e o dia.');
    return;
  }

  // Elementos do DOM
  const resultContainer = document.getElementById('result');
  const imgEl = document.getElementById('cardinal-image');
  const nameEl = document.getElementById('cardinal-name');
  const prayerNameEl = document.getElementById('prayer-cardinal-name');
  const findButton = document.getElementById('find-button');
  
  // Alterar o estado do botão e adicionar um spinner enquanto busca
  findButton.disabled = true;
  const originalButtonText = findButton.innerHTML;
  findButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
  
  // Preparar o contêiner de resultados
  if (!resultContainer.classList.contains('active')) {
    resultContainer.classList.add('active');
    resultContainer.classList.add('loading'); // Nova classe para estado de carregamento
  }
  
  // Resetar estado anterior se existir
  imgEl.style.opacity = '0.2';
  imgEl.src = '';
  nameEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando informações...';
  prayerNameEl.textContent = '';

  // Criar data para comparação (usando um ano arbitrário)
  const target = new Date(2000, parseInt(month, 10) - 1, parseInt(day, 10));

  // Buscar o cardeal correspondente
  const found = cardinals.find(c => {
    const [sD, sM] = c.start.split('-').map(n => parseInt(n, 10));
    const [eD, eM] = c.end.split('-').map(n => parseInt(n, 10));
    let start = new Date(2000, sM - 1, sD);
    let end = new Date(2000, eM - 1, eD);
    
    // Se o intervalo cruza o fim de ano
    if (end < start) end.setFullYear(2001);
    
    // Ajustar data alvo se necessário
    const targetAdjusted = new Date(target);
    if (target < start && end.getFullYear() > start.getFullYear()) {
      targetAdjusted.setFullYear(2001);
    }
    
    return targetAdjusted >= start && targetAdjusted <= end;
  });

  // Função para completar o processo e fazer scroll
  const completeProcess = () => {
    // Restaurar o botão
    findButton.disabled = false;
    findButton.innerHTML = originalButtonText;
    
    // Remover a classe de carregamento
    resultContainer.classList.remove('loading');
    
    // Fazer scroll suave até o resultado
    setTimeout(() => {
      const headerHeight = document.querySelector('.header').offsetHeight;
      const scrollPosition = resultContainer.offsetTop - headerHeight - 20;
      window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
    }, 100);
  };
  
  if (found) {
    // Não gera nem carrega imagem
    nameEl.textContent = found.name;
    imgEl.src = '';
    imgEl.alt = '';
    imgEl.style.opacity = '0';
    prayerNameEl.textContent = found.name;
    completeProcess();
    localStorage.setItem('lastCardinal', found.name);
    localStorage.setItem('lastCardinalImage', '');
    localStorage.setItem('lastMonth', month);
    localStorage.setItem('lastDay', day);
  } else {
    nameEl.textContent = 'Nenhum cardeal encontrado para esta data.';
    imgEl.src = '';
    imgEl.alt = 'Nenhuma imagem encontrada';
    imgEl.style.opacity = '0';
    completeProcess();
  }
}

/**
 * Compartilha as informações do cardeal nas redes sociais
 */
function share(platform) {
  const cardinalName = document.getElementById('cardinal-name').textContent;
  const cardinalImage = document.getElementById('cardinal-image').src;
  const pageTitle = 'Reze por um Cardeal';
  const pageUrl = window.location.href;
  
  if (!cardinalName || cardinalName.includes('Não foi encontrado')) return;
  
  let shareUrl;
  
  switch (platform) {
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}&quote=${encodeURIComponent(`Meu cardeal designado para oração é: ${cardinalName} - ${pageTitle}`)}`;
      break;
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Meu cardeal designado para oração é: ${cardinalName} - ${pageTitle}`)}&url=${encodeURIComponent(pageUrl)}`;
      break;
    case 'whatsapp':
      shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Meu cardeal designado para oração é: ${cardinalName} - ${pageTitle} ${pageUrl}`)}`;
      break;
  }
  
  if (shareUrl) {
    window.open(shareUrl, '_blank');
  }
}

/**
 * Gera e baixa a oração do cardeal
 * Implementa melhorias para que a imagem seja exibida corretamente
 */
function generateCardinalCard() {
  const cardinalName = document.getElementById('cardinal-name').textContent;
  const cardinalImage = document.getElementById('cardinal-image').src;
  const downloadMessage = document.getElementById('download-message');
  
  // Alterar o texto do botão para indicar que está processando
  const downloadBtn = document.getElementById('download-btn');
  const originalBtnText = downloadBtn.innerHTML;
  downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
  downloadBtn.disabled = true;
  downloadBtn.classList.add('loading');
  
  // Criar um elemento canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Definir as dimensões da oração
  canvas.width = 600;
  canvas.height = 900;
  
  // Função para carregar a imagem do cardeal
  const loadCardinalImage = () => new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = cardinalImage;
  });
  
  // Função para carregar o logo (não rejeitar se falhar)
  const loadLogo = () => new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = './logo.png';
  });
  
  // Texto da oração
  const prayerText = `Pai bondoso, obrigado.
    Obrigado pelo Papa Francisco,
    por sua vida alegre e entregue sem reservas,
    por seu coração inquieto pelos descartados
    e seu exemplo de misericórdia.
    Agora acolha-o em seus braços.

    Deus Filho, que pensou em Pedro
    ao imaginar sua Igreja,
    nos dê um novo Papa que fale de você sem medo,
    que mostre aquelas facetas do seu rosto
    das quais o mundo tem sede e ainda não conhece.

    Espírito Santo,
    desperte-nos nesta espera.

    Prepare agora nossa Igreja
    para o Papa que está por vir,
    faça de nós terra fértil para o novo,
    que o recebamos com alegria,
    com humildade e confiança sem cálculos.
    Você saberá nos guiar.

    Peço luz para o ${cardinalName}, que lhe conceda
    sua clareza e liberdade interior
    para escolher conforme sua vontade.

    A você, Deus vivo,
    dizemos sim.`;
  
  // Criar e baixar a oração
  Promise.all([loadCardinalImage(), loadLogo()])
    .then(([cardinalImg, logoImg]) => {
      // Desenhar o fundo
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(1, '#f8f8f8');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Desenhar borda decorativa
      ctx.strokeStyle = '#cf9b28';
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      
      // Adicionar decoração sutil nos cantos
      const drawCornerDecoration = (x, y, rotate) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotate * Math.PI / 180);
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(30, 0);
        ctx.arc(30, 15, 15, 270 * Math.PI / 180, 0, false);
        ctx.lineTo(45, 40);
        ctx.lineTo(0, 40);
        ctx.closePath();
        
        ctx.fillStyle = 'rgba(207, 155, 40, 0.1)';
        ctx.fill();
        ctx.restore();
      };
      
      // Desenhar decorações nos quatro cantos
      drawCornerDecoration(10, 10, 0);
      drawCornerDecoration(canvas.width - 10, 10, 90);
      drawCornerDecoration(canvas.width - 10, canvas.height - 10, 180);
      drawCornerDecoration(10, canvas.height - 10, 270);
      
      // Desenhar o logo se existir e obter altura, senão manter offset mínimo
      let logoHeight = 0;
      if (logoImg) {
        const logoWidth = 250;
        logoHeight = (logoImg.height / logoImg.width) * logoWidth;
        ctx.drawImage(logoImg, (canvas.width - logoWidth) / 2, 30, logoWidth, logoHeight);
      }
      
      // MELHORIA: Desenhar a imagem do cardeal corretamente centrada e proporcionada
      if (cardinalImg) {
        const imgSize = 180; // Tamanho do círculo de recorte
        const imgX = (canvas.width - imgSize) / 2;
        const imgY = logoHeight + 50;
        
        // Calcular proporções para um melhor ajuste
        const originalWidth = cardinalImg.width;
        const originalHeight = cardinalImg.height;
        
        // Determinar qual dimensão usar para escalar e centralizar
        let sourceX = 0;
        let sourceY = 0;
        let sourceDim = 0;
        
        if (originalWidth > originalHeight) {
          // Se a imagem for mais larga que alta, centralizamos horizontalmente
          sourceDim = originalHeight;
          sourceX = (originalWidth - originalHeight) / 2;
        } else {
          // Se a imagem for mais alta que larga, centralizamos verticalmente
          sourceDim = originalWidth;
          sourceY = (originalHeight - originalWidth) / 2;
        }
        
        // MELHORIA: Suavização para a imagem do cardeal
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Criar recorte circular
        ctx.save();
        ctx.beginPath();
        ctx.arc(imgX + imgSize/2, imgY + imgSize/2, imgSize/2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        
        // Desenhar a imagem com o recorte aplicado
        try {
          ctx.drawImage(
            cardinalImg,
            sourceX, sourceY, sourceDim, sourceDim, // Área da fonte (recorte quadrado centralizado)
            imgX, imgY, imgSize, imgSize // Área de destino (círculo)
          );
        } catch (e) {
          // Tentativa alternativa com menos parâmetros
          ctx.drawImage(cardinalImg, imgX, imgY, imgSize, imgSize);
        }
        ctx.restore();
        
        // Desenhar borda dourada ao redor da imagem
        ctx.beginPath();
        ctx.arc(imgX + imgSize/2, imgY + imgSize/2, imgSize/2 + 4, 0, Math.PI * 2, true);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Adicionar uma leve sombra à imagem
        ctx.beginPath();
        ctx.arc(imgX + imgSize/2, imgY + imgSize/2, imgSize/2 + 8, 0, Math.PI * 2, true);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.lineWidth = 8;
        ctx.stroke();
      }
      
      // Desenhar o nome do cardeal com offset dinâmico
      const nameY = (logoHeight ? logoHeight + 230 : 200);
      ctx.font = 'bold 22px Montserrat, Arial, sans-serif';
      ctx.fillStyle = '#2a2a2a';
      ctx.textAlign = 'center';
      ctx.fillText(cardinalName, canvas.width / 2, nameY);
      
      // Desenhar uma linha decorativa
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 100, nameY + 15);
      ctx.lineTo(canvas.width / 2 + 100, nameY + 15);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Criar um fundo para a oração
      const prayerBoxY = nameY + 30;
      const prayerBoxHeight = canvas.height - prayerBoxY - 50;
      
      // Fundo para a oração com borda decorativa
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(40, prayerBoxY, canvas.width - 80, prayerBoxHeight);
      ctx.strokeStyle = 'rgba(207, 155, 40, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(40, prayerBoxY, canvas.width - 80, prayerBoxHeight);
      
      // Adicionar aspas decorativas
      ctx.font = 'italic 70px Georgia, serif';
      ctx.fillStyle = 'rgba(212, 175, 55, 0.08)';
      ctx.textAlign = 'left';
      ctx.fillText('"', 50, prayerBoxY + 60);
      
      ctx.textAlign = 'right';
      ctx.fillText('"', canvas.width - 50, prayerBoxY + prayerBoxHeight - 20);
      
      // Desenhar o texto da oração com estilo aprimorado
      ctx.font = 'italic 13px Montserrat, Arial, sans-serif';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'left';
      
      const prayerLines = prayerText.split('\n');
      let y = prayerBoxY + 30;
      const lineHeight = 16;
      
      // Função para processar uma linha e destacar o texto em negrito
      const processLine = (line, y) => {
        // Para destacar texto entre asteriscos ou forte
        if (line.includes('novo Papa') || line.includes('desperte-nos') || 
            line.includes('terra fértil') || line.includes(cardinalName)) {
          // Usar uma cor mais escura para destacar
          ctx.fillStyle = '#D4AF37';
          ctx.font = 'italic bold 13px Montserrat, Arial, sans-serif';
        } else {
          ctx.fillStyle = '#333';
          ctx.font = 'italic 13px Montserrat, Arial, sans-serif';
        }
        
        return y;
      };
      
      prayerLines.forEach(line => {
        // Para centralizar linhas vazias (parágrafos)
        if (line.trim() === '') {
          y += lineHeight / 2;
          return;
        }
        
        // Processar a linha para estilo
        y = processLine(line, y);
        
        // Para lidar com linhas longas e ajuste de texto
        const words = line.split(' ');
        let currentLine = '';
        
        words.forEach(word => {
          const testLine = currentLine + word + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          
          if (testWidth > canvas.width - 100 && currentLine !== '') {
            ctx.fillText(currentLine, 60, y);
            currentLine = word + ' ';
            y += lineHeight;
          } else {
            currentLine = testLine;
          }
        });
        
        if (currentLine.trim() !== '') {
          ctx.fillText(currentLine, 60, y);
        }
        
        y += lineHeight;
      });
      
      // Adicionar um pequeno rodapé
      ctx.font = '600 12px Montserrat, Arial, sans-serif';
      ctx.fillStyle = '#777';
      ctx.textAlign = 'center';
      ctx.fillText('Comunidade Católica Shalom', canvas.width / 2, canvas.height - 25);
      
      // Converter para uma imagem baixável
      const dataUrl = canvas.toDataURL('image/png');
      
      // Criar um link de download
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = 'Minha oração por ' + cardinalName;
      
      // Restaurar o botão ao seu estado original
      downloadBtn.innerHTML = originalBtnText;
      downloadBtn.disabled = false;
      downloadBtn.classList.remove('loading');
      
      // Baixar automaticamente
      downloadLink.click();
      
      // Exibir mensagem de sucesso
      downloadMessage.classList.add('visible');
      setTimeout(() => {
        downloadMessage.classList.remove('visible');
      }, 2000);
    })
    .catch(error => {
      alert('Não foi possível gerar a oração. Por favor, tente novamente.');
      
      // Restaurar o botão ao seu estado original em caso de erro
      downloadBtn.innerHTML = originalBtnText;
      downloadBtn.disabled = false;
      downloadBtn.classList.remove('loading');
    });
}

// Inicializa a aplicação quando o DOM é carregado
document.addEventListener('DOMContentLoaded', () => {
  // Carregar os dias por padrão ao iniciar a página
  updateDayOptions();
  
  // Configurar os seletores de data
  const monthSelect = document.getElementById('month-select');
  if (monthSelect) {
    // Usar uma função anônima para chamar updateDayOptions
    monthSelect.addEventListener('change', function() {
      updateDayOptions();
    });
  }
  
  // Adicionar manipulador de eventos ao botão de buscar
  const findButton = document.getElementById('find-button');
  if (findButton) {
    findButton.addEventListener('click', findCardinal);
  }
  
  // Adicionar manipulador de eventos ao botão de baixar oração
  const downloadButton = document.getElementById('download-btn');
  if (downloadButton) {
    downloadButton.addEventListener('click', generateCardinalCard);
  }
  
  // Também permitir enviar com a tecla Enter nos seletores
  const daySelect = document.getElementById('day-select');
  if (daySelect) {
    daySelect.addEventListener('keypress', e => {
      if (e.key === 'Enter') findCardinal();
    });
  }
  
  // Verificar se há uma imagem de backup para erros
  const checkBackupImage = () => {
    const testImg = new Image();
    testImg.onerror = () => {};
    testImg.src = './banner.png';
  };
  
  // Verificar imagem de backup ao iniciar
  checkBackupImage();
  
  // Expor funções ao objeto global para poder acessar desde HTML
  window.updateDayOptions = updateDayOptions;
  window.findCardinal = findCardinal;
  window.generateCardinalCard = generateCardinalCard;
  window.share = share;
});