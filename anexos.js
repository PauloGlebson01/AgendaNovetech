// ==================== ANEXOS DE AGENDAMENTOS DE VEÍCULOS ====================
// anexos.js - Versão com compressão de imagem para evitar limite de 1MB do Firestore

// ==================== VARIÁVEIS ====================
let anexosCache = [];
let unsubscribeAnexos = null;

// ==================== COLEÇÕES ====================
const COLECAO_ANEXOS = 'frota_anexos';

// ==================== LISTENER DE ANEXOS ====================
function iniciarListenerAnexos() {
    if (unsubscribeAnexos) {
        unsubscribeAnexos();
        unsubscribeAnexos = null;
    }

    if (!db) {
        console.error('❌ Firestore não inicializado');
        return;
    }

    try {
        unsubscribeAnexos = db.collection(COLECAO_ANEXOS)
            .orderBy('dataCriacao', 'desc')
            .onSnapshot((snapshot) => {
                console.log('🔄 Anexos atualizados em tempo real!');
                anexosCache = [];
                snapshot.forEach(doc => {
                    anexosCache.push({ id: doc.id, ...doc.data() });
                });
                atualizarIconesAnexos();
            }, (error) => {
                console.error('❌ Erro no listener de anexos:', error);
            });
    } catch (error) {
        console.error('❌ Erro ao iniciar listener de anexos:', error);
    }
}

// ==================== ATUALIZAR ÍCONES DE ANEXOS ====================
function atualizarIconesAnexos() {
    document.querySelectorAll('.card[data-evento-id]').forEach(card => {
        const eventoId = card.dataset.eventoId;
        const anexos = anexosCache.filter(a => a.eventoId === eventoId);
        const container = card.querySelector('.anexos-indicador');
        
        if (container) {
            if (anexos.length > 0) {
                container.innerHTML = `
                    <span class="anexo-badge" style="
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        background: #dbeafe;
                        color: #1d4ed8;
                        padding: 2px 10px;
                        border-radius: 12px;
                        font-size: 11px;
                        font-weight: 500;
                    ">
                        <i class="fas fa-paperclip"></i>
                        ${anexos.length} anexo(s)
                    </span>
                `;
                container.style.display = 'inline-flex';
            } else {
                container.innerHTML = '';
                container.style.display = 'none';
            }
        }
    });
}

// ==================== ABRIR MODAL DE ANEXOS ====================
function abrirModalAnexos(eventoId) {
    if (!eventoId) {
        mostrarNotificacao('❌ ID do agendamento não fornecido.', 'error');
        return;
    }

    db.collection('frota_agendamentos').doc(eventoId).get()
        .then(doc => {
            if (!doc.exists) {
                mostrarNotificacao('❌ Agendamento não encontrado.', 'error');
                return;
            }
            const data = doc.data();
            
            const anexosDoEvento = anexosCache.filter(a => a.eventoId === eventoId);
            
            const modal = document.getElementById('modalAnexos');
            const titulo = document.getElementById('modalAnexosTitulo');
            const lista = document.getElementById('listaAnexos');
            
            titulo.textContent = `📎 Comprovantes - ${data.veiculoNome || 'Veículo'} (${data.destino || 'Sem destino'})`;
            
            modal.dataset.eventoId = eventoId;
            
            if (anexosDoEvento.length === 0) {
                lista.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #94a3b8;">
                        <i class="fas fa-receipt" style="font-size: 32px; display: block; margin-bottom: 8px;"></i>
                        <p>Nenhum comprovante anexado a este agendamento.</p>
                        <p style="font-size: 13px;">Clique em "Adicionar Comprovante" abaixo para anexar uma imagem.</p>
                    </div>
                `;
            } else {
                lista.innerHTML = '';
                anexosDoEvento.forEach(anexo => {
                    const item = document.createElement('div');
                    item.className = 'anexo-item';
                    item.style.cssText = `
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 10px 14px;
                        background: #f8fafc;
                        border-radius: 10px;
                        margin-bottom: 8px;
                        border: 1px solid #e2e8f0;
                        transition: all 0.2s;
                    `;
                    
                    const isImagem = anexo.tipo && anexo.tipo.startsWith('image/');
                    const icone = isImagem ? 'fa-image' : 'fa-file';
                    const cor = isImagem ? '#2563eb' : '#64748b';
                    
                    const dataStr = anexo.dataCriacao ? new Date(anexo.dataCriacao.seconds * 1000).toLocaleString('pt-BR') : 'Data não disponível';
                    
                    item.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
                            <i class="fas ${icone}" style="color: ${cor}; font-size: 20px;"></i>
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-weight: 500; font-size: 14px; color: #0f172a; word-break: break-word;">
                                    ${anexo.nomeOriginal || 'Comprovante'}
                                </div>
                                <div style="font-size: 12px; color: #94a3b8;">
                                    ${anexo.categoria || 'Comprovante'} • ${dataStr}
                                </div>
                                ${anexo.descricao ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">📝 ${anexo.descricao}</div>` : ''}
                            </div>
                        </div>
                        <div style="display: flex; gap: 6px; flex-shrink: 0; margin-left: 8px;">
                            ${isImagem ? `
                                <button class="btn-sm btn-info" onclick="visualizarAnexo('${anexo.id}')" style="padding: 4px 10px; font-size: 11px;" title="Visualizar">
                                    <i class="fas fa-eye"></i>
                                </button>
                            ` : ''}
                            <button class="btn-sm btn-aprovar" onclick="baixarAnexo('${anexo.id}')" style="padding: 4px 10px; font-size: 11px; background: #10b981;" title="Baixar">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="btn-sm btn-rejeitar" onclick="excluirAnexo('${anexo.id}')" style="padding: 4px 10px; font-size: 11px;" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    lista.appendChild(item);
                });
            }
            
            configurarUploadAnexos(eventoId);
            
            modal.style.display = 'flex';
        })
        .catch(error => {
            console.error('❌ Erro ao carregar anexos:', error);
            mostrarNotificacao('❌ Erro ao carregar anexos: ' + error.message, 'error');
        });
}

// ==================== CONFIGURAR UPLOAD DE ANEXOS ====================
function configurarUploadAnexos(eventoId) {
    const fileInput = document.getElementById('uploadAnexosInput');
    const btnUpload = document.getElementById('btnUploadAnexos');
    
    if (!fileInput || !btnUpload) return;
    
    // Remover listeners antigos
    const newFileInput = fileInput.cloneNode(true);
    fileInput.parentNode.replaceChild(newFileInput, fileInput);
    
    const newBtnUpload = btnUpload.cloneNode(true);
    btnUpload.parentNode.replaceChild(newBtnUpload, btnUpload);
    
    newBtnUpload.addEventListener('click', () => {
        document.getElementById('uploadAnexosInput').click();
    });
    
    newFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            processarAnexos(eventoId);
        }
    });
    
    // Suporte a drag and drop
    const dropArea = document.getElementById('uploadAnexosArea');
    if (dropArea) {
        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.style.borderColor = '#2563eb';
            dropArea.style.background = '#eef2ff';
        });
        
        dropArea.addEventListener('dragleave', () => {
            dropArea.style.borderColor = '#e2e8f0';
            dropArea.style.background = '#fafbfc';
        });
        
        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.style.borderColor = '#e2e8f0';
            dropArea.style.background = '#fafbfc';
            
            if (e.dataTransfer.files.length > 0) {
                const fileInput2 = document.getElementById('uploadAnexosInput');
                fileInput2.files = e.dataTransfer.files;
                processarAnexos(eventoId);
            }
        });
        
        dropArea.addEventListener('click', () => {
            document.getElementById('uploadAnexosInput').click();
        });
    }
}

// ==================== COMPRIMIR IMAGEM DA CÂMERA ====================
// Reduz a resolução e qualidade da imagem para caber no limite de 1MB do Firestore
function comprimirImagemCamera(file, maxLargura = 1024, qualidade = 0.6) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Calcula as novas dimensões mantendo a proporção
                let largura = img.width;
                let altura = img.height;
                
                if (largura > maxLargura) {
                    altura = Math.floor(altura * (maxLargura / largura));
                    largura = maxLargura;
                }

                canvas.width = largura;
                canvas.height = altura;
                
                // Desenha a imagem redimensionada no canvas
                ctx.drawImage(img, 0, 0, largura, altura);

                // Converte para JPEG com qualidade reduzida (resulta em ~200KB)
                const dataUrl = canvas.toDataURL('image/jpeg', qualidade);
                resolve(dataUrl);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

// ==================== PROCESSAR UPLOAD DE ANEXOS (COM COMPRESSÃO) ====================
async function processarAnexos(eventoId) {
    const fileInput = document.getElementById('uploadAnexosInput');
    const categoria = document.getElementById('anexoCategoria').value;
    const descricao = document.getElementById('anexoDescricao').value.trim();
    
    if (!fileInput || fileInput.files.length === 0) {
        mostrarNotificacao('❌ Selecione um arquivo para fazer upload.', 'error');
        return;
    }
    
    const file = fileInput.files[0];
    
    // Validar tamanho (aumentei para 10MB antes da compressão)
    if (file.size > 10 * 1024 * 1024) {
        mostrarNotificacao('❌ O arquivo é muito grande (máx 10MB antes da compressão).', 'error');
        fileInput.value = '';
        return;
    }
    
    // Validar tipo
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!tiposPermitidos.includes(file.type)) {
        mostrarNotificacao('❌ Formato não permitido. Use JPG, PNG, GIF ou WEBP.', 'error');
        fileInput.value = '';
        return;
    }
    
    const btnUpload = document.getElementById('btnUploadAnexos');
    const textoOriginal = btnUpload.innerHTML;
    btnUpload.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
    btnUpload.disabled = true;
    
    try {
        // ==================== COMPRIMIR A IMAGEM AQUI ====================
        // A função comprimirImagemCamera vai reduzir a foto para ~200KB
        const base64 = await comprimirImagemCamera(file, 1024, 0.6);
        // =================================================================

        // Agora o base64 está pequeno o suficiente para o Firestore!
        const dadosAnexo = {
            eventoId: eventoId,
            nomeOriginal: file.name,
            tipo: 'image/jpeg', // Forçamos JPEG para garantir compatibilidade
            tamanho: Math.round(base64.length * 0.75), // Tamanho aproximado após compressão
            categoria: categoria || 'comprovante',
            descricao: descricao || '',
            dados: base64, 
            dataCriacao: firebase.firestore.FieldValue.serverTimestamp(),
            criadoPor: currentUser ? currentUser.uid : 'sistema',
            criadoPorNome: currentUser ? currentUser.nome : 'sistema'
        };
        
        await db.collection(COLECAO_ANEXOS).add(dadosAnexo);
        
        // Atualizar agendamento
        await db.collection('frota_agendamentos').doc(eventoId).update({
            temAnexos: true,
            qtdeAnexos: firebase.firestore.FieldValue.increment(1),
            anexoAtualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        mostrarNotificacao('✅ Comprovante anexado com sucesso!', 'success');
        
        // Recarregar lista
        const modal = document.getElementById('modalAnexos');
        if (modal && modal.dataset.eventoId) {
            abrirModalAnexos(modal.dataset.eventoId);
        }
        
    } catch (error) {
        console.error('❌ Erro ao salvar anexo:', error);
        mostrarNotificacao('❌ Erro ao salvar: ' + error.message, 'error');
    } finally {
        btnUpload.innerHTML = textoOriginal;
        btnUpload.disabled = false;
        fileInput.value = '';
        document.getElementById('anexoDescricao').value = '';
    }
}

// ==================== CONVERTER PARA BASE64 (mantido para compatibilidade) ====================
function converterParaBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
}

// ==================== VISUALIZAR ANEXO ====================
function visualizarAnexo(anexoId) {
    const anexo = anexosCache.find(a => a.id === anexoId);
    if (!anexo) {
        mostrarNotificacao('❌ Anexo não encontrado.', 'error');
        return;
    }
    
    if (anexo.dados) {
        const modal = document.getElementById('modalVisualizacaoAnexo');
        const img = document.getElementById('visualizacaoAnexoImg');
        const titulo = document.getElementById('visualizacaoAnexoTitulo');
        const info = document.getElementById('visualizacaoAnexoInfo');
        
        img.src = anexo.dados;
        img.alt = anexo.nomeOriginal;
        titulo.textContent = anexo.nomeOriginal;
        info.innerHTML = `
            <span>📅 ${new Date(anexo.dataCriacao?.seconds * 1000 || Date.now()).toLocaleString('pt-BR')}</span>
            ${anexo.categoria ? `<span>📂 ${anexo.categoria}</span>` : ''}
            ${anexo.descricao ? `<span>📝 ${anexo.descricao}</span>` : ''}
        `;
        
        window.anexoVisualizacaoAtual = anexoId;
        modal.style.display = 'flex';
    } else {
        mostrarNotificacao('❌ Dados da imagem não encontrados.', 'error');
    }
}

function fecharVisualizacaoAnexo() {
    document.getElementById('modalVisualizacaoAnexo').style.display = 'none';
}

// ==================== BAIXAR ANEXO ====================
function baixarAnexo(anexoId) {
    const anexo = anexosCache.find(a => a.id === anexoId);
    if (!anexo) {
        mostrarNotificacao('❌ Anexo não encontrado.', 'error');
        return;
    }
    
    if (anexo.dados) {
        const link = document.createElement('a');
        link.href = anexo.dados;
        link.download = anexo.nomeOriginal || 'comprovante.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        mostrarNotificacao('❌ Dados da imagem não encontrados.', 'error');
    }
}

function baixarAnexoVisualizacao() {
    if (window.anexoVisualizacaoAtual) {
        baixarAnexo(window.anexoVisualizacaoAtual);
    }
}

// ==================== EXCLUIR ANEXO ====================
function excluirAnexo(anexoId) {
    const anexo = anexosCache.find(a => a.id === anexoId);
    if (!anexo) {
        mostrarNotificacao('❌ Anexo não encontrado.', 'error');
        return;
    }
    
    if (!confirm(`Deseja excluir o comprovante "${anexo.nomeOriginal}"? Esta ação não pode ser desfeita.`)) {
        return;
    }
    
    db.collection(COLECAO_ANEXOS).doc(anexoId).delete()
        .then(() => {
            return db.collection('frota_agendamentos').doc(anexo.eventoId).update({
                qtdeAnexos: firebase.firestore.FieldValue.increment(-1),
                anexoAtualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            mostrarNotificacao('✅ Comprovante excluído com sucesso!', 'success');
            const modal = document.getElementById('modalAnexos');
            if (modal && modal.dataset.eventoId) {
                abrirModalAnexos(modal.dataset.eventoId);
            }
        })
        .catch(error => {
            console.error('❌ Erro ao excluir anexo:', error);
            mostrarNotificacao('❌ Erro ao excluir: ' + error.message, 'error');
        });
}

// ==================== CRIAR MODAIS ====================
function criarModaisAnexos() {
    if (document.getElementById('modalAnexos')) return;
    
    const modalAnexos = document.createElement('div');
    modalAnexos.id = 'modalAnexos';
    modalAnexos.className = 'modal';
    modalAnexos.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <h3 style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                <i class="fas fa-receipt" style="color: #8b5cf6;"></i>
                <span id="modalAnexosTitulo">Comprovantes</span>
                <button onclick="document.getElementById('modalAnexos').style.display='none'" style="
                    margin-left: auto;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #94a3b8;
                ">
                    <i class="fas fa-times"></i>
                </button>
            </h3>
            <p style="color: #64748b; font-size: 14px; margin-bottom: 16px;">
                Gerencie os comprovantes de despesas deste agendamento.
            </p>
            <div id="listaAnexos" style="margin-bottom: 16px; max-height: 300px; overflow-y: auto;"></div>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 16px;">
                <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #0f172a;">
                    <i class="fas fa-upload" style="color: #2563eb;"></i> Adicionar Comprovante
                </h4>
                <div id="uploadAnexosArea" style="
                    border: 2px dashed #e2e8f0;
                    border-radius: 12px;
                    padding: 24px;
                    text-align: center;
                    background: #fafbfc;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    <i class="fas fa-camera" style="font-size: 32px; color: #94a3b8;"></i>
                    <p style="margin: 8px 0 4px; color: #475569; font-weight: 500;">
                        Clique para selecionar uma imagem
                    </p>
                    <p style="font-size: 12px; color: #94a3b8;">
                        Formatos: JPG, PNG, GIF, WEBP • Máx: 10MB
                    </p>
                    <input type="file" id="uploadAnexosInput" accept="image/*" capture="environment" style="display: none;">
                </div>
                <div style="display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap;">
                    <select id="anexoCategoria" style="
                        padding: 8px 14px;
                        border-radius: 8px;
                        border: 2px solid #e2e8f0;
                        font-family: inherit;
                        background: #fafbfc;
                        flex: 1;
                        min-width: 140px;
                    ">
                        <option value="comprovante">📄 Comprovante</option>
                        <option value="recibo">🧾 Recibo</option>
                        <option value="nota_fiscal">📋 Nota Fiscal</option>
                        <option value="comprovante_almoco">🍽️ Comprovante Almoço</option>
                        <option value="comprovante_combustivel">⛽ Comprovante Combustível</option>
                        <option value="comprovante_hospedagem">🏨 Comprovante Hospedagem</option>
                        <option value="pedagio">🛣️ Pedágio</option>
                        <option value="estacionamento">🅿️ Estacionamento</option>
                        <option value="outro">📌 Outro</option>
                    </select>
                    <input type="text" id="anexoDescricao" placeholder="Descrição do comprovante..." style="
                        padding: 8px 14px;
                        border-radius: 8px;
                        border: 2px solid #e2e8f0;
                        font-family: inherit;
                        background: #fafbfc;
                        flex: 2;
                        min-width: 180px;
                    ">
                    <button id="btnUploadAnexos" class="btn-primary" style="width: auto; padding: 10px 24px; white-space: nowrap; background: linear-gradient(135deg, #8b5cf6, #7c3aed);">
                        <i class="fas fa-upload"></i> Anexar
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modalAnexos);
    
    const modalVisualizacao = document.createElement('div');
    modalVisualizacao.id = 'modalVisualizacaoAnexo';
    modalVisualizacao.className = 'modal';
    modalVisualizacao.innerHTML = `
        <div class="modal-content" style="max-width: 800px; text-align: center;">
            <h3 style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                <i class="fas fa-image" style="color: #2563eb;"></i>
                <span id="visualizacaoAnexoTitulo">Visualizar</span>
                <button onclick="fecharVisualizacaoAnexo()" style="
                    margin-left: auto;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #94a3b8;
                ">
                    <i class="fas fa-times"></i>
                </button>
            </h3>
            <div id="visualizacaoAnexoInfo" style="font-size: 13px; color: #94a3b8; margin-bottom: 12px;"></div>
            <img id="visualizacaoAnexoImg" src="" alt="Visualização" style="
                max-width: 100%;
                max-height: 70vh;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
            ">
            <div style="margin-top: 12px; display: flex; gap: 10px; justify-content: center;">
                <button onclick="fecharVisualizacaoAnexo()" class="modal-btn-cancelar" style="padding: 8px 24px;">
                    <i class="fas fa-times"></i> Fechar
                </button>
                <button onclick="baixarAnexoVisualizacao()" class="btn-aprovar" style="padding: 8px 24px; border-radius: 8px; border: none; background: #10b981; color: white; cursor: pointer; font-weight: 600;">
                    <i class="fas fa-download"></i> Baixar
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modalVisualizacao);
    
    console.log('✅ Modais de comprovantes criados!');
}

// ==================== FUNÇÃO PARA MOSTRAR NOTIFICAÇÃO (CORRIGIDA) ====================
function mostrarNotificacao(mensagem, tipo = 'info') {
    // Verifica se existe uma função de notificação global já definida (do script.js)
    if (typeof window.mostrarNotificacao === 'function' && 
        window.mostrarNotificacao !== mostrarNotificacao) { // Garante que não é ela mesma
        window.mostrarNotificacao(mensagem, tipo);
        return;
    }
    
    // Caso contrário, usa alert (simples e sem recursão)
    const prefixo = tipo === 'error' ? '❌ ' : tipo === 'success' ? '✅ ' : '';
    alert(prefixo + mensagem);
}

// ==================== EXPOR FUNÇÕES ====================
window.iniciarListenerAnexos = iniciarListenerAnexos;
window.abrirModalAnexos = abrirModalAnexos;
window.visualizarAnexo = visualizarAnexo;
window.fecharVisualizacaoAnexo = fecharVisualizacaoAnexo;
window.baixarAnexo = baixarAnexo;
window.excluirAnexo = excluirAnexo;
window.baixarAnexoVisualizacao = baixarAnexoVisualizacao;
window.criarModaisAnexos = criarModaisAnexos;
window.processarAnexos = processarAnexos;
window.mostrarNotificacao = mostrarNotificacao;

console.log('✅ Módulo de Comprovantes carregado!');