// ==================== CONTROLE DE FROTA ====================
// frota.js

// ==================== COLEÇÕES ====================
const COLECAO_VEICULOS = 'frota_veiculos';
const COLECAO_MANUTENCOES = 'frota_manutencoes';
const COLECAO_ABASTECIMENTOS = 'frota_abastecimentos';
const COLECAO_MULTAS = 'frota_multas';
const COLECAO_AGENDAMENTOS = 'frota_agendamentos';

// ==================== VARIÁVEIS GLOBAIS ====================
let veiculosCache = [];
let manutencoesCache = [];
let abastecimentosCache = [];
let multasCache = [];
let agendamentosCache = [];
let unsubscribeVeiculos = null;
let unsubscribeManutencoes = null;
let unsubscribeAbastecimentos = null;
let unsubscribeMultas = null;
let unsubscribeAgendamentos = null;

// ==================== TROCAR ABA DA FROTA ====================
function trocarAbaFrota(aba) {
    const section = document.getElementById('frotaSection');
    if (!section) return;
    
    const btns = section.querySelectorAll('.tab-btn');
    const contents = section.querySelectorAll('.tab-content');
    
    btns.forEach(btn => btn.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));

    const btn = section.querySelector(`.tab-btn[data-tab="${aba}"]`);
    if (btn) btn.classList.add('active');

    const content = document.getElementById(aba + 'Tab');
    if (content) content.classList.add('active');
}

// ==================== ATUALIZAR STATS DA FROTA ====================
function atualizarStatsFrota() {
    const totalVeiculos = document.getElementById('frotaTotalVeiculos');
    const totalManutencoes = document.getElementById('frotaTotalManutencoes');
    const totalAbastecimentos = document.getElementById('frotaTotalAbastecimentos');
    const totalMultas = document.getElementById('frotaTotalMultas');
    const totalAgendamentos = document.getElementById('frotaTotalAgendamentos');
    const totalVeiculosLabel = document.getElementById('totalVeiculos');
    const totalAgendamentosLabel = document.getElementById('totalAgendamentos');
    
    if (totalVeiculos) totalVeiculos.textContent = veiculosCache.length;
    if (totalManutencoes) totalManutencoes.textContent = manutencoesCache.length;
    if (totalAbastecimentos) totalAbastecimentos.textContent = abastecimentosCache.length;
    if (totalMultas) totalMultas.textContent = multasCache.length;
    if (totalAgendamentos) totalAgendamentos.textContent = agendamentosCache.length;
    if (totalVeiculosLabel) totalVeiculosLabel.textContent = `(${veiculosCache.length})`;
    if (totalAgendamentosLabel) totalAgendamentosLabel.textContent = `(${agendamentosCache.length})`;
}

// ==================== VEÍCULOS ====================

function iniciarListenerVeiculos() {
    if (unsubscribeVeiculos) {
        unsubscribeVeiculos();
        unsubscribeVeiculos = null;
    }

    if (!db) {
        console.error('❌ Firestore não inicializado');
        return;
    }

    try {
        unsubscribeVeiculos = db.collection(COLECAO_VEICULOS)
            .orderBy('marca', 'asc')
            .onSnapshot((snapshot) => {
                console.log('🔄 Veículos atualizados em tempo real!');
                veiculosCache = [];
                snapshot.forEach(doc => {
                    veiculosCache.push({ id: doc.id, ...doc.data() });
                });
                veiculosCache.sort((a, b) => {
                    if (a.marca < b.marca) return -1;
                    if (a.marca > b.marca) return 1;
                    if (a.modelo < b.modelo) return -1;
                    if (a.modelo > b.modelo) return 1;
                    return 0;
                });
                atualizarListaVeiculos();
                atualizarSelectsVeiculos();
                atualizarSelectsAgendamentos();
                atualizarStatsFrota();
            }, (error) => {
                console.error('❌ Erro no listener de veículos:', error);
                if (error.code === 'permission-denied' || error.message?.includes('index')) {
                    console.log('⏳ Tentando reconectar listener de veículos sem orderBy...');
                    setTimeout(() => {
                        if (unsubscribeVeiculos) {
                            unsubscribeVeiculos();
                            unsubscribeVeiculos = null;
                        }
                        try {
                            unsubscribeVeiculos = db.collection(COLECAO_VEICULOS)
                                .onSnapshot((snapshot) => {
                                    console.log('🔄 Veículos atualizados (sem orderBy)!');
                                    veiculosCache = [];
                                    snapshot.forEach(doc => {
                                        veiculosCache.push({ id: doc.id, ...doc.data() });
                                    });
                                    veiculosCache.sort((a, b) => {
                                        if (a.marca < b.marca) return -1;
                                        if (a.marca > b.marca) return 1;
                                        if (a.modelo < b.modelo) return -1;
                                        if (a.modelo > b.modelo) return 1;
                                        return 0;
                                    });
                                    atualizarListaVeiculos();
                                    atualizarSelectsVeiculos();
                                    atualizarSelectsAgendamentos();
                                    atualizarStatsFrota();
                                }, (err) => {
                                    console.error('❌ Erro no listener (sem orderBy):', err);
                                });
                        } catch (e) {
                            console.error('❌ Erro ao reconectar listener:', e);
                        }
                    }, 5000);
                }
            });
    } catch (error) {
        console.error('❌ Erro ao iniciar listener de veículos:', error);
    }
}

async function cadastrarVeiculo() {
    const marca = document.getElementById('veiculoMarca').value.trim();
    const modelo = document.getElementById('veiculoModelo').value.trim();
    const placa = document.getElementById('veiculoPlaca').value.trim().toUpperCase();
    const ano = parseInt(document.getElementById('veiculoAno').value) || null;
    const cor = document.getElementById('veiculoCor').value.trim();
    const km = parseInt(document.getElementById('veiculoKm').value) || 0;
    const observacoes = document.getElementById('veiculoObservacoes').value.trim();

    if (!marca || !modelo || !placa) {
        mostrarNotificacao('❌ Preencha os campos obrigatórios: Marca, Modelo e Placa.', 'error');
        return;
    }

    const placaRegex = /^[A-Z]{3}-\d{4}$/;
    if (!placaRegex.test(placa)) {
        mostrarNotificacao('❌ Placa inválida. Use o formato ABC-1234.', 'error');
        return;
    }

    if (!currentUser) {
        mostrarNotificacao('❌ Você precisa estar logado para cadastrar veículos.', 'error');
        return;
    }

    if (currentUser.tipo !== 'admin') {
        mostrarNotificacao('❌ Apenas administradores podem cadastrar veículos.', 'error');
        return;
    }

    try {
        const existing = await db.collection(COLECAO_VEICULOS)
            .where('placa', '==', placa)
            .get();

        if (!existing.empty) {
            mostrarNotificacao('⚠️ Já existe um veículo com esta placa.', 'warning');
            return;
        }

        await db.collection(COLECAO_VEICULOS).add({
            marca: marca,
            modelo: modelo,
            placa: placa,
            ano: ano,
            cor: cor || '',
            kmAtual: km,
            observacoes: observacoes || '',
            ativo: true,
            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            criadoPor: currentUser.uid,
            criadoPorNome: currentUser.nome || currentUser.email || 'Admin'
        });

        mostrarNotificacao('✅ Veículo cadastrado com sucesso!', 'success');

        document.getElementById('veiculoMarca').value = '';
        document.getElementById('veiculoModelo').value = '';
        document.getElementById('veiculoPlaca').value = '';
        document.getElementById('veiculoAno').value = '';
        document.getElementById('veiculoCor').value = '';
        document.getElementById('veiculoKm').value = '';
        document.getElementById('veiculoObservacoes').value = '';

    } catch (error) {
        console.error('❌ Erro ao cadastrar veículo:', error);
        if (error.code === 'permission-denied') {
            mostrarNotificacao(
                '❌ Erro de permissão no Firestore.\n\n' +
                'Verifique se as regras de segurança foram atualizadas corretamente.',
                'error'
            );
        } else {
            mostrarNotificacao('❌ Erro ao cadastrar: ' + error.message, 'error');
        }
    }
}

function atualizarListaVeiculos() {
    const container = document.getElementById('listaVeiculos');
    if (!container) return;

    if (veiculosCache.length === 0) {
        container.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <i class="fas fa-car" style="font-size: 48px; color: #cbd5e1;"></i>
                <h3 style="margin-top: 12px; color: #475569;">Nenhum veículo cadastrado</h3>
                <p style="color: #94a3b8;">Cadastre os veículos da frota para gerenciar manutenções e abastecimentos.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    veiculosCache.forEach(v => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.borderLeft = `4px solid ${v.ativo !== false ? '#2563eb' : '#94a3b8'}`;
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 8px;">
                <div style="flex: 1;">
                    <h3 style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <i class="fas fa-car" style="color: ${v.ativo !== false ? '#2563eb' : '#94a3b8'};"></i>
                        ${v.marca} ${v.modelo}
                        <span class="status-badge" style="background: ${v.ativo !== false ? '#d1fae5' : '#fee2e2'}; color: ${v.ativo !== false ? '#059669' : '#dc2626'}; font-size: 11px; padding: 2px 10px;">
                            ${v.ativo !== false ? '✅ Ativo' : '❌ Inativo'}
                        </span>
                    </h3>
                    <p><i class="fas fa-id-card" style="color: #64748b;"></i> <strong>Placa:</strong> ${v.placa}</p>
                    ${v.ano ? `<p><i class="fas fa-calendar-alt" style="color: #64748b;"></i> ${v.ano}</p>` : ''}
                    ${v.cor ? `<p><i class="fas fa-palette" style="color: #64748b;"></i> ${v.cor}</p>` : ''}
                    <p><i class="fas fa-road" style="color: #64748b;"></i> <strong>KM Atual:</strong> ${v.kmAtual || 0} km</p>
                    ${v.observacoes ? `<p style="font-size: 13px; color: #64748b;"><i class="fas fa-info-circle"></i> ${v.observacoes}</p>` : ''}
                </div>
            </div>
            <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="btn-sm ${v.ativo !== false ? 'btn-warning' : 'btn-aprovar'}" onclick="toggleVeiculo('${v.id}', ${v.ativo !== false})">
                    <i class="fas ${v.ativo !== false ? 'fa-pause' : 'fa-play'}"></i>
                    ${v.ativo !== false ? 'Desativar' : 'Ativar'}
                </button>
                <button class="btn-sm btn-rejeitar" onclick="excluirVeiculo('${v.id}')">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function atualizarSelectsVeiculos() {
    const selects = ['manutencaoVeiculo', 'abastecimentoVeiculo', 'multaVeiculo'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        const currentValue = select.value;
        select.innerHTML = '<option value="">Selecione um veículo...</option>';
        veiculosCache.filter(v => v.ativo !== false).forEach(v => {
            const option = document.createElement('option');
            option.value = v.id;
            option.textContent = `${v.marca} ${v.modelo} - ${v.placa}`;
            select.appendChild(option);
        });
        if (currentValue) {
            select.value = currentValue;
        }
    });
}

async function toggleVeiculo(id, ativo) {
    const novoStatus = !ativo;
    const acao = novoStatus ? 'ativar' : 'desativar';

    if (!confirm(`Tem certeza que deseja ${acao} este veículo?`)) return;

    try {
        await db.collection(COLECAO_VEICULOS).doc(id).update({
            ativo: novoStatus,
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            atualizadoPor: currentUser ? currentUser.uid : 'sistema',
            atualizadoPorNome: currentUser ? currentUser.nome : 'sistema'
        });
        mostrarNotificacao(`✅ Veículo ${acao}do com sucesso!`, 'success');
    } catch (error) {
        console.error('❌ Erro ao alterar status:', error);
        mostrarNotificacao('❌ Erro: ' + error.message, 'error');
    }
}

function excluirVeiculo(id) {
    const veiculo = veiculosCache.find(v => v.id === id);
    if (!veiculo) {
        mostrarNotificacao('❌ Veículo não encontrado.', 'error');
        return;
    }

    if (!confirm(`Deseja excluir o veículo "${veiculo.marca} ${veiculo.modelo} - ${veiculo.placa}"? Esta ação não pode ser desfeita.`)) {
        return;
    }

    try {
        db.collection(COLECAO_VEICULOS).doc(id).delete();
        mostrarNotificacao('✅ Veículo excluído com sucesso!', 'success');
    } catch (error) {
        console.error('❌ Erro ao excluir veículo:', error);
        mostrarNotificacao('❌ Erro ao excluir: ' + error.message, 'error');
    }
}

// ==================== MANUTENÇÕES ====================

function iniciarListenerManutencoes() {
    if (unsubscribeManutencoes) {
        unsubscribeManutencoes();
        unsubscribeManutencoes = null;
    }

    if (!db) {
        console.error('❌ Firestore não inicializado');
        return;
    }

    try {
        unsubscribeManutencoes = db.collection(COLECAO_MANUTENCOES)
            .orderBy('data', 'desc')
            .onSnapshot((snapshot) => {
                console.log('🔄 Manutenções atualizadas em tempo real!');
                manutencoesCache = [];
                snapshot.forEach(doc => {
                    manutencoesCache.push({ id: doc.id, ...doc.data() });
                });
                atualizarListaManutencoes();
                atualizarStatsFrota();
            }, (error) => {
                console.error('❌ Erro no listener de manutenções:', error);
            });
    } catch (error) {
        console.error('❌ Erro ao iniciar listener de manutenções:', error);
    }
}

async function registrarManutencao() {
    const veiculoId = document.getElementById('manutencaoVeiculo').value;
    const data = document.getElementById('manutencaoData').value;
    const tipo = document.getElementById('manutencaoTipo').value;
    const valor = parseFloat(document.getElementById('manutencaoValor').value) || 0;
    const descricao = document.getElementById('manutencaoDescricao').value.trim();
    const responsavel = document.getElementById('manutencaoResponsavel').value.trim();
    const km = parseInt(document.getElementById('manutencaoKm').value) || 0;

    if (!veiculoId || !data || !tipo || !descricao) {
        mostrarNotificacao('❌ Preencha todos os campos obrigatórios.', 'error');
        return;
    }

    const veiculo = veiculosCache.find(v => v.id === veiculoId);
    if (!veiculo) {
        mostrarNotificacao('❌ Veículo não encontrado.', 'error');
        return;
    }

    try {
        await db.collection(COLECAO_MANUTENCOES).add({
            veiculoId: veiculoId,
            veiculoPlaca: veiculo.placa,
            veiculoNome: `${veiculo.marca} ${veiculo.modelo}`,
            data: data + 'T00:00:00.000Z',
            tipo: tipo,
            valor: valor,
            descricao: descricao,
            responsavel: responsavel || '',
            km: km,
            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            criadoPor: currentUser ? currentUser.uid : 'sistema',
            criadoPorNome: currentUser ? currentUser.nome : 'sistema'
        });

        if (km > 0 && km > (veiculo.kmAtual || 0)) {
            await db.collection(COLECAO_VEICULOS).doc(veiculoId).update({
                kmAtual: km,
                atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        mostrarNotificacao('✅ Manutenção registrada com sucesso!', 'success');

        document.getElementById('manutencaoVeiculo').value = '';
        document.getElementById('manutencaoData').value = '';
        document.getElementById('manutencaoTipo').value = 'preventiva';
        document.getElementById('manutencaoValor').value = '';
        document.getElementById('manutencaoDescricao').value = '';
        document.getElementById('manutencaoResponsavel').value = '';
        document.getElementById('manutencaoKm').value = '';

    } catch (error) {
        console.error('❌ Erro ao registrar manutenção:', error);
        mostrarNotificacao('❌ Erro ao registrar: ' + error.message, 'error');
    }
}

function atualizarListaManutencoes() {
    const container = document.getElementById('listaManutencoes');
    if (!container) return;

    if (manutencoesCache.length === 0) {
        container.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <i class="fas fa-tools" style="font-size: 48px; color: #cbd5e1;"></i>
                <h3 style="margin-top: 12px; color: #475569;">Nenhuma manutenção registrada</h3>
                <p style="color: #94a3b8;">Registre as manutenções dos veículos da frota.</p>
            </div>
        `;
        return;
    }

    const tiposLabels = {
        'preventiva': '🛡️ Preventiva',
        'corretiva': '🔧 Corretiva',
        'emergencial': '🚨 Emergencial',
        'revisao': '📋 Revisão'
    };

    container.innerHTML = '';
    manutencoesCache.forEach(m => {
        const dataStr = formatarDataParaExibicao(m.data);
        const card = document.createElement('div');
        card.className = 'card';
        card.style.borderLeft = '4px solid #f59e0b';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 8px;">
                <div style="flex: 1;">
                    <h3 style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 16px;">
                        <i class="fas fa-car" style="color: #f59e0b;"></i>
                        ${m.veiculoNome || 'Veículo'} - ${m.veiculoPlaca || 'N/A'}
                        <span class="status-badge" style="background: #fef3c7; color: #d97706; font-size: 11px; padding: 2px 10px;">
                            ${tiposLabels[m.tipo] || m.tipo}
                        </span>
                    </h3>
                    <p><i class="fas fa-calendar-day" style="color: #64748b;"></i> ${dataStr}</p>
                    <p style="margin: 4px 0;"><strong>${m.descricao}</strong></p>
                    ${m.responsavel ? `<p><i class="fas fa-user-cog" style="color: #64748b;"></i> ${m.responsavel}</p>` : ''}
                    ${m.valor > 0 ? `<p><i class="fas fa-dollar-sign" style="color: #64748b;"></i> R$ ${m.valor.toFixed(2)}</p>` : ''}
                    ${m.km > 0 ? `<p><i class="fas fa-road" style="color: #64748b;"></i> KM: ${m.km}</p>` : ''}
                </div>
            </div>
            <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="btn-sm btn-rejeitar" onclick="excluirManutencao('${m.id}')">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function excluirManutencao(id) {
    if (!confirm('Deseja excluir este registro de manutenção?')) return;

    try {
        db.collection(COLECAO_MANUTENCOES).doc(id).delete();
        mostrarNotificacao('✅ Manutenção excluída com sucesso!', 'success');
    } catch (error) {
        console.error('❌ Erro ao excluir manutenção:', error);
        mostrarNotificacao('❌ Erro ao excluir: ' + error.message, 'error');
    }
}

// ==================== ABASTECIMENTOS ====================

function iniciarListenerAbastecimentos() {
    if (unsubscribeAbastecimentos) {
        unsubscribeAbastecimentos();
        unsubscribeAbastecimentos = null;
    }

    if (!db) {
        console.error('❌ Firestore não inicializado');
        return;
    }

    try {
        unsubscribeAbastecimentos = db.collection(COLECAO_ABASTECIMENTOS)
            .orderBy('data', 'desc')
            .onSnapshot((snapshot) => {
                console.log('🔄 Abastecimentos atualizados em tempo real!');
                abastecimentosCache = [];
                snapshot.forEach(doc => {
                    abastecimentosCache.push({ id: doc.id, ...doc.data() });
                });
                atualizarListaAbastecimentos();
                atualizarStatsFrota();
            }, (error) => {
                console.error('❌ Erro no listener de abastecimentos:', error);
            });
    } catch (error) {
        console.error('❌ Erro ao iniciar listener de abastecimentos:', error);
    }
}

async function registrarAbastecimento() {
    const veiculoId = document.getElementById('abastecimentoVeiculo').value;
    const data = document.getElementById('abastecimentoData').value;
    const combustivel = document.getElementById('abastecimentoCombustivel').value;
    const valor = parseFloat(document.getElementById('abastecimentoValor').value);
    const litros = parseFloat(document.getElementById('abastecimentoLitros').value);
    const km = parseInt(document.getElementById('abastecimentoKm').value);
    const observacoes = document.getElementById('abastecimentoObservacoes').value.trim();

    if (!veiculoId || !data || !combustivel || !valor || !litros || !km) {
        mostrarNotificacao('❌ Preencha todos os campos obrigatórios.', 'error');
        return;
    }

    const veiculo = veiculosCache.find(v => v.id === veiculoId);
    if (!veiculo) {
        mostrarNotificacao('❌ Veículo não encontrado.', 'error');
        return;
    }

    try {
        await db.collection(COLECAO_ABASTECIMENTOS).add({
            veiculoId: veiculoId,
            veiculoPlaca: veiculo.placa,
            veiculoNome: `${veiculo.marca} ${veiculo.modelo}`,
            data: data + 'T00:00:00.000Z',
            combustivel: combustivel,
            valor: valor,
            litros: litros,
            km: km,
            observacoes: observacoes || '',
            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            criadoPor: currentUser ? currentUser.uid : 'sistema',
            criadoPorNome: currentUser ? currentUser.nome : 'sistema'
        });

        if (km > (veiculo.kmAtual || 0)) {
            await db.collection(COLECAO_VEICULOS).doc(veiculoId).update({
                kmAtual: km,
                atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        mostrarNotificacao('✅ Abastecimento registrado com sucesso!', 'success');

        document.getElementById('abastecimentoVeiculo').value = '';
        document.getElementById('abastecimentoData').value = '';
        document.getElementById('abastecimentoCombustivel').value = 'gasolina';
        document.getElementById('abastecimentoValor').value = '';
        document.getElementById('abastecimentoLitros').value = '';
        document.getElementById('abastecimentoKm').value = '';
        document.getElementById('abastecimentoObservacoes').value = '';

    } catch (error) {
        console.error('❌ Erro ao registrar abastecimento:', error);
        mostrarNotificacao('❌ Erro ao registrar: ' + error.message, 'error');
    }
}

function atualizarListaAbastecimentos() {
    const container = document.getElementById('listaAbastecimentos');
    if (!container) return;

    if (abastecimentosCache.length === 0) {
        container.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <i class="fas fa-gas-pump" style="font-size: 48px; color: #cbd5e1;"></i>
                <h3 style="margin-top: 12px; color: #475569;">Nenhum abastecimento registrado</h3>
                <p style="color: #94a3b8;">Registre os abastecimentos dos veículos da frota.</p>
            </div>
        `;
        return;
    }

    const combustivelLabels = {
        'gasolina': '⛽ Gasolina',
        'etanol': '🌽 Etanol',
        'diesel': '🛢️ Diesel',
        'gnv': '🔵 GNV'
    };

    container.innerHTML = '';
    abastecimentosCache.forEach(a => {
        const dataStr = formatarDataParaExibicao(a.data);
        const card = document.createElement('div');
        card.className = 'card';
        card.style.borderLeft = '4px solid #10b981';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 8px;">
                <div style="flex: 1;">
                    <h3 style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 16px;">
                        <i class="fas fa-car" style="color: #10b981;"></i>
                        ${a.veiculoNome || 'Veículo'} - ${a.veiculoPlaca || 'N/A'}
                        <span class="status-badge" style="background: #d1fae5; color: #059669; font-size: 11px; padding: 2px 10px;">
                            ${combustivelLabels[a.combustivel] || a.combustivel}
                        </span>
                    </h3>
                    <p><i class="fas fa-calendar-day" style="color: #64748b;"></i> ${dataStr}</p>
                    <p><i class="fas fa-dollar-sign" style="color: #64748b;"></i> <strong>R$ ${a.valor.toFixed(2)}</strong> - ${a.litros.toFixed(1)} L</p>
                    <p><i class="fas fa-road" style="color: #64748b;"></i> KM: ${a.km}</p>
                    ${a.observacoes ? `<p style="font-size: 13px; color: #64748b;"><i class="fas fa-info-circle"></i> ${a.observacoes}</p>` : ''}
                </div>
            </div>
            <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="btn-sm btn-rejeitar" onclick="excluirAbastecimento('${a.id}')">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function excluirAbastecimento(id) {
    if (!confirm('Deseja excluir este registro de abastecimento?')) return;

    try {
        db.collection(COLECAO_ABASTECIMENTOS).doc(id).delete();
        mostrarNotificacao('✅ Abastecimento excluído com sucesso!', 'success');
    } catch (error) {
        console.error('❌ Erro ao excluir abastecimento:', error);
        mostrarNotificacao('❌ Erro ao excluir: ' + error.message, 'error');
    }
}

// ==================== MULTAS ====================

function iniciarListenerMultas() {
    if (unsubscribeMultas) {
        unsubscribeMultas();
        unsubscribeMultas = null;
    }

    if (!db) {
        console.error('❌ Firestore não inicializado');
        return;
    }

    try {
        unsubscribeMultas = db.collection(COLECAO_MULTAS)
            .orderBy('data', 'desc')
            .onSnapshot((snapshot) => {
                console.log('🔄 Multas atualizadas em tempo real!');
                multasCache = [];
                snapshot.forEach(doc => {
                    multasCache.push({ id: doc.id, ...doc.data() });
                });
                atualizarListaMultas();
                atualizarStatsFrota();
            }, (error) => {
                console.error('❌ Erro no listener de multas:', error);
            });
    } catch (error) {
        console.error('❌ Erro ao iniciar listener de multas:', error);
    }
}

async function registrarMulta() {
    const veiculoId = document.getElementById('multaVeiculo').value;
    const data = document.getElementById('multaData').value;
    const numero = document.getElementById('multaNumero').value.trim();
    const valor = parseFloat(document.getElementById('multaValor').value);
    const tipo = document.getElementById('multaTipo').value;
    const status = document.getElementById('multaStatus').value;
    const descricao = document.getElementById('multaDescricao').value.trim();

    if (!veiculoId || !data || !numero || !valor) {
        mostrarNotificacao('❌ Preencha todos os campos obrigatórios.', 'error');
        return;
    }

    const veiculo = veiculosCache.find(v => v.id === veiculoId);
    if (!veiculo) {
        mostrarNotificacao('❌ Veículo não encontrado.', 'error');
        return;
    }

    try {
        await db.collection(COLECAO_MULTAS).add({
            veiculoId: veiculoId,
            veiculoPlaca: veiculo.placa,
            veiculoNome: `${veiculo.marca} ${veiculo.modelo}`,
            data: data + 'T00:00:00.000Z',
            numero: numero,
            valor: valor,
            tipo: tipo,
            status: status,
            descricao: descricao || '',
            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            criadoPor: currentUser ? currentUser.uid : 'sistema',
            criadoPorNome: currentUser ? currentUser.nome : 'sistema'
        });

        mostrarNotificacao('✅ Multa registrada com sucesso!', 'success');

        document.getElementById('multaVeiculo').value = '';
        document.getElementById('multaData').value = '';
        document.getElementById('multaNumero').value = '';
        document.getElementById('multaValor').value = '';
        document.getElementById('multaTipo').value = 'leve';
        document.getElementById('multaStatus').value = 'pendente';
        document.getElementById('multaDescricao').value = '';

    } catch (error) {
        console.error('❌ Erro ao registrar multa:', error);
        mostrarNotificacao('❌ Erro ao registrar: ' + error.message, 'error');
    }
}

function atualizarListaMultas() {
    const container = document.getElementById('listaMultas');
    if (!container) return;

    if (multasCache.length === 0) {
        container.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <i class="fas fa-gavel" style="font-size: 48px; color: #cbd5e1;"></i>
                <h3 style="margin-top: 12px; color: #475569;">Nenhuma multa registrada</h3>
                <p style="color: #94a3b8;">Registre as multas dos veículos da frota.</p>
            </div>
        `;
        return;
    }

    const tipoLabels = {
        'leve': '🟢 Leve',
        'media': '🟡 Média',
        'grave': '🟠 Grave',
        'gravissima': '🔴 Gravíssima'
    };

    const statusLabels = {
        'pendente': '⏳ Pendente',
        'pago': '✅ Pago',
        'contestando': '⚖️ Contestando',
        'vencido': '❌ Vencido'
    };

    const statusColors = {
        'pendente': '#fef3c7',
        'pago': '#d1fae5',
        'contestando': '#dbeafe',
        'vencido': '#fee2e2'
    };

    container.innerHTML = '';
    multasCache.forEach(m => {
        const dataStr = formatarDataParaExibicao(m.data);
        const card = document.createElement('div');
        card.className = 'card';
        card.style.borderLeft = '4px solid #ef4444';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 8px;">
                <div style="flex: 1;">
                    <h3 style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 16px;">
                        <i class="fas fa-car" style="color: #ef4444;"></i>
                        ${m.veiculoNome || 'Veículo'} - ${m.veiculoPlaca || 'N/A'}
                        <span class="status-badge" style="background: ${statusColors[m.status] || '#f1f5f9'}; color: ${m.status === 'vencido' ? '#dc2626' : '#1e293b'}; font-size: 11px; padding: 2px 10px;">
                            ${statusLabels[m.status] || m.status}
                        </span>
                    </h3>
                    <p><i class="fas fa-calendar-day" style="color: #64748b;"></i> ${dataStr}</p>
                    <p><i class="fas fa-ticket-alt" style="color: #64748b;"></i> <strong>${m.numero}</strong></p>
                    <p><i class="fas fa-dollar-sign" style="color: #64748b;"></i> R$ ${m.valor.toFixed(2)}</p>
                    <p><span class="status-badge" style="background: #f1f5f9; color: #475569; font-size: 11px; padding: 2px 10px;">${tipoLabels[m.tipo] || m.tipo}</span></p>
                    ${m.descricao ? `<p style="font-size: 13px; color: #64748b;"><i class="fas fa-info-circle"></i> ${m.descricao}</p>` : ''}
                </div>
            </div>
            <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="btn-sm ${m.status === 'pendente' ? 'btn-warning' : 'btn-info'}" onclick="atualizarStatusMulta('${m.id}', '${m.status}')">
                    <i class="fas fa-sync"></i> Alterar Status
                </button>
                <button class="btn-sm btn-rejeitar" onclick="excluirMulta('${m.id}')">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

async function atualizarStatusMulta(id, statusAtual) {
    const statusOptions = ['pendente', 'pago', 'contestando', 'vencido'];
    const currentIndex = statusOptions.indexOf(statusAtual);
    const nextIndex = (currentIndex + 1) % statusOptions.length;
    const novoStatus = statusOptions[nextIndex];

    const statusLabels = {
        'pendente': '⏳ Pendente',
        'pago': '✅ Pago',
        'contestando': '⚖️ Contestando',
        'vencido': '❌ Vencido'
    };

    if (!confirm(`Deseja alterar o status da multa de "${statusLabels[statusAtual]}" para "${statusLabels[novoStatus]}"?`)) {
        return;
    }

    try {
        await db.collection(COLECAO_MULTAS).doc(id).update({
            status: novoStatus,
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            atualizadoPor: currentUser ? currentUser.uid : 'sistema',
            atualizadoPorNome: currentUser ? currentUser.nome : 'sistema'
        });
        mostrarNotificacao(`✅ Status alterado para "${statusLabels[novoStatus]}" com sucesso!`, 'success');
    } catch (error) {
        console.error('❌ Erro ao alterar status:', error);
        mostrarNotificacao('❌ Erro ao alterar status: ' + error.message, 'error');
    }
}

function excluirMulta(id) {
    if (!confirm('Deseja excluir este registro de multa?')) return;

    try {
        db.collection(COLECAO_MULTAS).doc(id).delete();
        mostrarNotificacao('✅ Multa excluída com sucesso!', 'success');
    } catch (error) {
        console.error('❌ Erro ao excluir multa:', error);
        mostrarNotificacao('❌ Erro ao excluir: ' + error.message, 'error');
    }
}

// ==================== AGENDAMENTO DE VEÍCULOS ====================

// ==================== LISTENER DE AGENDAMENTOS ====================
function iniciarListenerAgendamentos() {
    if (unsubscribeAgendamentos) {
        unsubscribeAgendamentos();
        unsubscribeAgendamentos = null;
    }

    if (!db) {
        console.error('❌ Firestore não inicializado');
        return;
    }

    try {
        unsubscribeAgendamentos = db.collection(COLECAO_AGENDAMENTOS)
            .orderBy('data', 'desc')
            .onSnapshot((snapshot) => {
                console.log('🔄 Agendamentos atualizados em tempo real!');
                agendamentosCache = [];
                snapshot.forEach(doc => {
                    agendamentosCache.push({ id: doc.id, ...doc.data() });
                });
                atualizarListaAgendamentos();
                atualizarSelectsAgendamentos();
                atualizarStatsFrota();
            }, (error) => {
                console.error('❌ Erro no listener de agendamentos:', error);
            });
    } catch (error) {
        console.error('❌ Erro ao iniciar listener de agendamentos:', error);
    }
}

// ==================== ATUALIZAR SELECTS DE AGENDAMENTO ====================
function atualizarSelectsAgendamentos() {
    // Select de colaboradores
    const selectColab = document.getElementById('agendamentoColaborador');
    if (selectColab) {
        const currentValue = selectColab.value;
        selectColab.innerHTML = '<option value="">Selecione um colaborador...</option>';
        if (typeof colaboradoresCache !== 'undefined' && colaboradoresCache.length > 0) {
            colaboradoresCache.filter(c => c.ativo !== false).forEach(c => {
                const option = document.createElement('option');
                option.value = c.id;
                const emFerias = typeof colaboradorEstaDeFerias === 'function' ? colaboradorEstaDeFerias(c.id) : false;
                option.textContent = `${c.nome} ${c.cargo ? ' - ' + c.cargo : ''}`;
                if (emFerias) {
                    option.textContent += ' 🏖️ (Férias)';
                    option.style.color = '#f59e0b';
                    option.style.fontWeight = '500';
                }
                selectColab.appendChild(option);
            });
        }
        if (currentValue) {
            selectColab.value = currentValue;
        }
    }

    // Select de veículos
    const selectVeiculo = document.getElementById('agendamentoVeiculo');
    if (selectVeiculo) {
        const currentValue = selectVeiculo.value;
        selectVeiculo.innerHTML = '<option value="">Selecione um veículo...</option>';
        veiculosCache.filter(v => v.ativo !== false).forEach(v => {
            const option = document.createElement('option');
            option.value = v.id;
            option.textContent = `${v.marca} ${v.modelo} - ${v.placa}`;
            selectVeiculo.appendChild(option);
        });
        if (currentValue) {
            selectVeiculo.value = currentValue;
        }
    }
}

// ==================== REGISTRAR AGENDAMENTO ====================
async function registrarAgendamentoVeiculo() {
    const data = document.getElementById('agendamentoData').value;
    const horarioSaida = document.getElementById('agendamentoHorarioSaida').value;
    const horarioRetorno = document.getElementById('agendamentoHorarioRetorno').value;
    const colaboradorId = document.getElementById('agendamentoColaborador').value;
    const veiculoId = document.getElementById('agendamentoVeiculo').value;
    const tipo = document.getElementById('agendamentoTipo').value;
    const destino = document.getElementById('agendamentoDestino').value.trim();
    const observacoes = document.getElementById('agendamentoObservacoes').value.trim();
    const kmSaida = parseInt(document.getElementById('agendamentoKmSaida').value) || 0;
    const kmRetorno = parseInt(document.getElementById('agendamentoKmRetorno').value) || 0;
    const status = document.getElementById('agendamentoStatus').value;

    // Validações
    if (!data || !horarioSaida || !colaboradorId || !veiculoId || !destino) {
        mostrarNotificacao('❌ Preencha todos os campos obrigatórios.', 'error');
        return;
    }

    // Verificar se o colaborador existe
    const colaborador = colaboradoresCache.find(c => c.id === colaboradorId);
    if (!colaborador) {
        mostrarNotificacao('❌ Colaborador não encontrado.', 'error');
        return;
    }

    // Verificar se o colaborador está em férias
    if (typeof colaboradorEstaDeFerias === 'function' && colaboradorEstaDeFerias(colaboradorId)) {
        mostrarNotificacao('⚠️ Este colaborador está em férias.', 'warning');
        return;
    }

    // Verificar se o veículo existe
    const veiculo = veiculosCache.find(v => v.id === veiculoId);
    if (!veiculo) {
        mostrarNotificacao('❌ Veículo não encontrado.', 'error');
        return;
    }

    // Verificar se o veículo está ativo
    if (veiculo.ativo === false) {
        mostrarNotificacao('❌ Este veículo está inativo.', 'error');
        return;
    }

    // Verificar conflito de horário
    const conflito = verificarConflitoAgendamento(data, horarioSaida, veiculoId, colaboradorId);
    if (conflito) {
        if (!confirm(`⚠️ Conflito de horário detectado!\n\n${conflito}\n\nDeseja continuar mesmo assim?`)) {
            return;
        }
    }

    // Verificar se o veículo já está em uso no horário
    const veiculoOcupado = agendamentosCache.some(a => {
        if (a.id === 'novo') return false;
        if (a.veiculoId !== veiculoId) return false;
        if (a.data !== data) return false;
        if (a.status === 'cancelado' || a.status === 'concluido') return false;
        
        const aSaida = a.horarioSaida || '00:00';
        const aRetorno = a.horarioRetorno || '23:59';
        const novoRetorno = horarioRetorno || '23:59';
        
        return (horarioSaida < aRetorno && novoRetorno > aSaida);
    });

    if (veiculoOcupado) {
        if (!confirm('⚠️ Este veículo já está agendado para este horário. Deseja continuar mesmo assim?')) {
            return;
        }
    }

    try {
        const dados = {
            data: data,
            horarioSaida: horarioSaida,
            horarioRetorno: horarioRetorno || '',
            colaboradorId: colaboradorId,
            colaboradorNome: colaborador.nome,
            colaboradorEmail: colaborador.email || '',
            colaboradorCargo: colaborador.cargo || '',
            veiculoId: veiculoId,
            veiculoPlaca: veiculo.placa,
            veiculoNome: `${veiculo.marca} ${veiculo.modelo}`,
            veiculoMarca: veiculo.marca,
            veiculoModelo: veiculo.modelo,
            tipo: tipo,
            destino: destino,
            observacoes: observacoes || '',
            kmSaida: kmSaida,
            kmRetorno: kmRetorno,
            status: status || 'agendado',
            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            criadoPor: currentUser ? currentUser.uid : 'sistema',
            criadoPorNome: currentUser ? currentUser.nome : 'sistema'
        };

        await db.collection(COLECAO_AGENDAMENTOS).add(dados);

        mostrarNotificacao('✅ Agendamento registrado com sucesso!', 'success');

        // Limpar formulário
        document.getElementById('agendamentoData').value = '';
        document.getElementById('agendamentoHorarioSaida').value = '';
        document.getElementById('agendamentoHorarioRetorno').value = '';
        document.getElementById('agendamentoColaborador').value = '';
        document.getElementById('agendamentoVeiculo').value = '';
        document.getElementById('agendamentoTipo').value = 'reuniao';
        document.getElementById('agendamentoDestino').value = '';
        document.getElementById('agendamentoObservacoes').value = '';
        document.getElementById('agendamentoKmSaida').value = '';
        document.getElementById('agendamentoKmRetorno').value = '';
        document.getElementById('agendamentoStatus').value = 'agendado';

    } catch (error) {
        console.error('❌ Erro ao registrar agendamento:', error);
        mostrarNotificacao('❌ Erro ao registrar: ' + error.message, 'error');
    }
}

// ==================== VERIFICAR CONFLITO DE AGENDAMENTO ====================
function verificarConflitoAgendamento(data, horarioSaida, veiculoId, colaboradorId) {
    const conflitos = [];
    const dataAgendamentos = agendamentosCache.filter(a => a.data === data && a.status !== 'cancelado' && a.status !== 'concluido');

    // Verificar conflito com veículo
    const conflitoVeiculo = dataAgendamentos.some(a => {
        if (a.veiculoId !== veiculoId) return false;
        const aSaida = a.horarioSaida || '00:00';
        return Math.abs(horarioParaMinutos(horarioSaida) - horarioParaMinutos(aSaida)) < 60;
    });

    if (conflitoVeiculo) {
        conflitos.push('🚗 Veículo já agendado para este horário');
    }

    // Verificar conflito com colaborador
    const conflitoColaborador = dataAgendamentos.some(a => {
        if (a.colaboradorId !== colaboradorId) return false;
        const aSaida = a.horarioSaida || '00:00';
        return Math.abs(horarioParaMinutos(horarioSaida) - horarioParaMinutos(aSaida)) < 60;
    });

    if (conflitoColaborador) {
        conflitos.push('👤 Colaborador já possui agendamento neste horário');
    }

    return conflitos.length > 0 ? conflitos.join('\n') : null;
}

// ==================== ATUALIZAR LISTA DE AGENDAMENTOS ====================
function atualizarListaAgendamentos() {
    const container = document.getElementById('listaAgendamentos');
    if (!container) return;

    // Aplicar filtros
    let agendamentos = [...agendamentosCache];
    const dataInicio = document.getElementById('filtroAgendamentoDataInicio')?.value || '';
    const dataFim = document.getElementById('filtroAgendamentoDataFim')?.value || '';
    const statusFiltro = document.getElementById('filtroAgendamentoStatus')?.value || '';

    if (dataInicio) {
        agendamentos = agendamentos.filter(a => a.data >= dataInicio);
    }
    if (dataFim) {
        agendamentos = agendamentos.filter(a => a.data <= dataFim);
    }
    if (statusFiltro) {
        agendamentos = agendamentos.filter(a => a.status === statusFiltro);
    }

    // Ordenar por data (mais recentes primeiro)
    agendamentos.sort((a, b) => {
        if (a.data < b.data) return 1;
        if (a.data > b.data) return -1;
        return (a.horarioSaida || '').localeCompare(b.horarioSaida || '');
    });

    const totalEl = document.getElementById('totalAgendamentos');
    if (totalEl) totalEl.textContent = `(${agendamentos.length})`;

    // Atualizar stat de agendamentos
    const statAgendamentos = document.getElementById('frotaTotalAgendamentos');
    if (statAgendamentos) statAgendamentos.textContent = agendamentosCache.length;

    if (agendamentos.length === 0) {
        container.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <i class="fas fa-calendar-check" style="font-size: 48px; color: #cbd5e1;"></i>
                <h3 style="margin-top: 12px; color: #475569;">Nenhum agendamento encontrado</h3>
                <p style="color: #94a3b8;">Registre os agendamentos de veículos para controle de saídas.</p>
            </div>
        `;
        return;
    }

    const statusLabels = {
        'agendado': '📋 Agendado',
        'em_andamento': '🔄 Em Andamento',
        'concluido': '✅ Concluído',
        'cancelado': '❌ Cancelado'
    };

    const statusColors = {
        'agendado': '#dbeafe',
        'em_andamento': '#fef3c7',
        'concluido': '#d1fae5',
        'cancelado': '#fee2e2'
    };

    const statusTextColors = {
        'agendado': '#1d4ed8',
        'em_andamento': '#d97706',
        'concluido': '#059669',
        'cancelado': '#dc2626'
    };

    const tipoLabels = {
        'reuniao': '📋 Reunião',
        'visita_cliente': '👤 Visita a Cliente',
        'entrega': '📦 Entrega',
        'coleta': '📦 Coleta',
        'servico': '🔧 Serviço Técnico',
        'treinamento': '🎓 Treinamento',
        'outro': '📌 Outro'
    };

    container.innerHTML = '';
    agendamentos.forEach(a => {
        const dataStr = formatarDataParaExibicaoSimples(a.data);
        const status = a.status || 'agendado';
        const card = document.createElement('div');
        card.className = 'card';
        card.style.borderLeft = `4px solid ${status === 'cancelado' ? '#94a3b8' : '#2563eb'}`;
        card.dataset.eventoId = a.id; // <-- ADICIONADO PARA ANEXOS
        
        // Verificar se está atrasado
        const hoje = new Date().toISOString().split('T')[0];
        const isAtrasado = a.data < hoje && status !== 'concluido' && status !== 'cancelado';

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 8px;">
                <div style="flex: 1;">
                    <h3 style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 16px;">
                        <i class="fas fa-calendar-day" style="color: #2563eb;"></i>
                        ${dataStr}
                        <span class="status-badge" style="background: ${statusColors[status] || '#f1f5f9'}; color: ${statusTextColors[status] || '#1e293b'}; font-size: 11px; padding: 2px 10px;">
                            ${statusLabels[status] || status}
                        </span>
                        ${isAtrasado ? `<span class="status-badge" style="background: #fee2e2; color: #dc2626; font-size: 11px; padding: 2px 10px;">⏰ Atrasado</span>` : ''}
                    </h3>
                    <p style="margin: 4px 0;">
                        <i class="fas fa-truck" style="color: #64748b;"></i> 
                        <strong>${a.veiculoNome || 'Veículo'}</strong> - ${a.veiculoPlaca || 'N/A'}
                    </p>
                    <p style="margin: 4px 0;">
                        <i class="fas fa-user" style="color: #64748b;"></i> 
                        <strong>${a.colaboradorNome || 'Colaborador'}</strong>
                        ${a.colaboradorCargo ? ` (${a.colaboradorCargo})` : ''}
                    </p>
                    <p style="margin: 4px 0;">
                        <i class="fas fa-clock" style="color: #64748b;"></i> 
                        Saída: <strong>${a.horarioSaida || '--:--'}</strong>
                        ${a.horarioRetorno ? ` | Retorno: <strong>${a.horarioRetorno}</strong>` : ''}
                    </p>
                    <p style="margin: 4px 0;">
                        <i class="fas fa-map-marker-alt" style="color: #64748b;"></i> 
                        ${a.destino || 'Destino não informado'}
                    </p>
                    <p style="margin: 4px 0;">
                        <span class="status-badge" style="background: #f1f5f9; color: #475569; font-size: 11px; padding: 2px 10px;">
                            ${tipoLabels[a.tipo] || a.tipo}
                        </span>
                        ${a.kmSaida > 0 ? `<span style="font-size: 12px; color: #64748b; margin-left: 8px;"><i class="fas fa-road"></i> KM Saída: ${a.kmSaida}</span>` : ''}
                        ${a.kmRetorno > 0 ? `<span style="font-size: 12px; color: #64748b; margin-left: 8px;"><i class="fas fa-road"></i> KM Retorno: ${a.kmRetorno}</span>` : ''}
                    </p>
                    ${a.observacoes ? `<p style="font-size: 13px; color: #64748b; margin-top: 4px;"><i class="fas fa-info-circle"></i> ${a.observacoes}</p>` : ''}
                </div>
            </div>
            <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                ${status !== 'cancelado' && status !== 'concluido' ? `
                    ${status === 'agendado' ? `<button class="btn-sm btn-em_andamento" onclick="alterarStatusAgendamento('${a.id}', 'em_andamento')"><i class="fas fa-play"></i> Iniciar</button>` : ''}
                    ${status === 'em_andamento' ? `<button class="btn-sm btn-realizado" onclick="alterarStatusAgendamento('${a.id}', 'concluido')"><i class="fas fa-check"></i> Concluir</button>` : ''}
                    <button class="btn-sm btn-cancelado" onclick="alterarStatusAgendamento('${a.id}', 'cancelado')"><i class="fas fa-times"></i> Cancelar</button>
                ` : ''}
                <button class="btn-sm btn-info" onclick="editarAgendamento('${a.id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-sm btn-rejeitar" onclick="excluirAgendamento('${a.id}')">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;

        // ==================== ADICIONAR BOTÃO DE ANEXOS ====================
        const actionsDiv = card.querySelector('div[style*="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;"]');
        if (actionsDiv) {
            // Verificar se já tem anexos
            let anexosDoItem = [];
            if (typeof anexosCache !== 'undefined') {
                anexosDoItem = anexosCache.filter(an => an.eventoId === a.id && an.tipo === 'veiculo');
            }
            
            if (anexosDoItem.length > 0) {
                const badge = document.createElement('span');
                badge.className = 'anexos-indicador';
                badge.style.cssText = `
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    background: #dbeafe;
                    color: #1d4ed8;
                    padding: 2px 10px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 500;
                `;
                badge.innerHTML = `<i class="fas fa-paperclip"></i> ${anexosDoItem.length} anexo(s)`;
                actionsDiv.appendChild(badge);
            }
            
            const btnAnexos = document.createElement('button');
            btnAnexos.className = 'btn-sm';
            btnAnexos.style.cssText = `
                background: #8b5cf6;
                color: white;
                border: none;
                padding: 6px 14px;
                border-radius: 8px;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s;
                font-family: inherit;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            `;
            btnAnexos.innerHTML = '<i class="fas fa-paperclip"></i> Anexos';
            btnAnexos.onclick = function(e) {
                e.stopPropagation();
                if (typeof abrirModalAnexos === 'function') {
                    abrirModalAnexos(a.id, 'veiculo');
                } else {
                    mostrarNotificacao('⚠️ Módulo de anexos não disponível.', 'warning');
                }
            };
            actionsDiv.appendChild(btnAnexos);
        }

        container.appendChild(card);
    });
}

// ==================== ALTERAR STATUS DO AGENDAMENTO ====================
async function alterarStatusAgendamento(id, novoStatus) {
    const statusLabels = {
        'agendado': '📋 Agendado',
        'em_andamento': '🔄 Em Andamento',
        'concluido': '✅ Concluído',
        'cancelado': '❌ Cancelado'
    };

    if (!confirm(`Deseja alterar o status para "${statusLabels[novoStatus]}"?`)) {
        return;
    }

    try {
        await db.collection(COLECAO_AGENDAMENTOS).doc(id).update({
            status: novoStatus,
            statusAtualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            statusAtualizadoPor: currentUser ? currentUser.uid : 'sistema',
            statusAtualizadoPorNome: currentUser ? currentUser.nome : 'sistema'
        });
        mostrarNotificacao(`✅ Status alterado para "${statusLabels[novoStatus]}" com sucesso!`, 'success');
    } catch (error) {
        console.error('❌ Erro ao alterar status:', error);
        mostrarNotificacao('❌ Erro ao alterar status: ' + error.message, 'error');
    }
}

// ==================== EXCLUIR AGENDAMENTO ====================
function excluirAgendamento(id) {
    const agendamento = agendamentosCache.find(a => a.id === id);
    if (!agendamento) {
        mostrarNotificacao('❌ Agendamento não encontrado.', 'error');
        return;
    }

    if (!confirm(`Deseja excluir o agendamento do veículo ${agendamento.veiculoNome} no dia ${formatarDataParaExibicaoSimples(agendamento.data)}?`)) {
        return;
    }

    try {
        db.collection(COLECAO_AGENDAMENTOS).doc(id).delete();
        mostrarNotificacao('✅ Agendamento excluído com sucesso!', 'success');
    } catch (error) {
        console.error('❌ Erro ao excluir agendamento:', error);
        mostrarNotificacao('❌ Erro ao excluir: ' + error.message, 'error');
    }
}

// ==================== EDIÇÃO DE AGENDAMENTO ====================
function editarAgendamento(id) {
    const agendamento = agendamentosCache.find(a => a.id === id);
    if (!agendamento) {
        mostrarNotificacao('❌ Agendamento não encontrado.', 'error');
        return;
    }

    document.getElementById('agendamentoData').value = agendamento.data || '';
    document.getElementById('agendamentoHorarioSaida').value = agendamento.horarioSaida || '';
    document.getElementById('agendamentoHorarioRetorno').value = agendamento.horarioRetorno || '';
    document.getElementById('agendamentoColaborador').value = agendamento.colaboradorId || '';
    document.getElementById('agendamentoVeiculo').value = agendamento.veiculoId || '';
    document.getElementById('agendamentoTipo').value = agendamento.tipo || 'reuniao';
    document.getElementById('agendamentoDestino').value = agendamento.destino || '';
    document.getElementById('agendamentoObservacoes').value = agendamento.observacoes || '';
    document.getElementById('agendamentoKmSaida').value = agendamento.kmSaida || '';
    document.getElementById('agendamentoKmRetorno').value = agendamento.kmRetorno || '';
    document.getElementById('agendamentoStatus').value = agendamento.status || 'agendado';

    // Alterar botão para salvar edição
    const btn = document.querySelector('#frota_agendamentosTab .btn-primary');
    if (btn) {
        btn.textContent = '💾 Salvar Alterações';
        btn.onclick = function() {
            salvarEdicaoAgendamento(id);
        };
    }

    // Scroll para o formulário
    document.querySelector('#frota_agendamentosTab .form-card').scrollIntoView({ behavior: 'smooth' });
}

// ==================== SALVAR EDIÇÃO DE AGENDAMENTO ====================
async function salvarEdicaoAgendamento(id) {
    const data = document.getElementById('agendamentoData').value;
    const horarioSaida = document.getElementById('agendamentoHorarioSaida').value;
    const horarioRetorno = document.getElementById('agendamentoHorarioRetorno').value;
    const colaboradorId = document.getElementById('agendamentoColaborador').value;
    const veiculoId = document.getElementById('agendamentoVeiculo').value;
    const tipo = document.getElementById('agendamentoTipo').value;
    const destino = document.getElementById('agendamentoDestino').value.trim();
    const observacoes = document.getElementById('agendamentoObservacoes').value.trim();
    const kmSaida = parseInt(document.getElementById('agendamentoKmSaida').value) || 0;
    const kmRetorno = parseInt(document.getElementById('agendamentoKmRetorno').value) || 0;
    const status = document.getElementById('agendamentoStatus').value;

    if (!data || !horarioSaida || !colaboradorId || !veiculoId || !destino) {
        mostrarNotificacao('❌ Preencha todos os campos obrigatórios.', 'error');
        return;
    }

    const colaborador = colaboradoresCache.find(c => c.id === colaboradorId);
    if (!colaborador) {
        mostrarNotificacao('❌ Colaborador não encontrado.', 'error');
        return;
    }

    const veiculo = veiculosCache.find(v => v.id === veiculoId);
    if (!veiculo) {
        mostrarNotificacao('❌ Veículo não encontrado.', 'error');
        return;
    }

    try {
        await db.collection(COLECAO_AGENDAMENTOS).doc(id).update({
            data: data,
            horarioSaida: horarioSaida,
            horarioRetorno: horarioRetorno || '',
            colaboradorId: colaboradorId,
            colaboradorNome: colaborador.nome,
            colaboradorEmail: colaborador.email || '',
            colaboradorCargo: colaborador.cargo || '',
            veiculoId: veiculoId,
            veiculoPlaca: veiculo.placa,
            veiculoNome: `${veiculo.marca} ${veiculo.modelo}`,
            veiculoMarca: veiculo.marca,
            veiculoModelo: veiculo.modelo,
            tipo: tipo,
            destino: destino,
            observacoes: observacoes || '',
            kmSaida: kmSaida,
            kmRetorno: kmRetorno,
            status: status,
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            atualizadoPor: currentUser ? currentUser.uid : 'sistema',
            atualizadoPorNome: currentUser ? currentUser.nome : 'sistema'
        });

        mostrarNotificacao('✅ Agendamento atualizado com sucesso!', 'success');

        // Resetar botão
        const btn = document.querySelector('#frota_agendamentosTab .btn-primary');
        if (btn) {
            btn.textContent = '📝 Registrar Agendamento';
            btn.onclick = registrarAgendamentoVeiculo;
        }

        // Limpar formulário
        document.getElementById('agendamentoData').value = '';
        document.getElementById('agendamentoHorarioSaida').value = '';
        document.getElementById('agendamentoHorarioRetorno').value = '';
        document.getElementById('agendamentoColaborador').value = '';
        document.getElementById('agendamentoVeiculo').value = '';
        document.getElementById('agendamentoTipo').value = 'reuniao';
        document.getElementById('agendamentoDestino').value = '';
        document.getElementById('agendamentoObservacoes').value = '';
        document.getElementById('agendamentoKmSaida').value = '';
        document.getElementById('agendamentoKmRetorno').value = '';
        document.getElementById('agendamentoStatus').value = 'agendado';

    } catch (error) {
        console.error('❌ Erro ao atualizar agendamento:', error);
        mostrarNotificacao('❌ Erro ao atualizar: ' + error.message, 'error');
    }
}

// ==================== FILTROS DE AGENDAMENTOS ====================
function filtrarAgendamentos() {
    atualizarListaAgendamentos();
}

function limparFiltrosAgendamentos() {
    document.getElementById('filtroAgendamentoDataInicio').value = '';
    document.getElementById('filtroAgendamentoDataFim').value = '';
    document.getElementById('filtroAgendamentoStatus').value = '';
    atualizarListaAgendamentos();
}

// ==================== INICIALIZAR FROTA ====================

function iniciarFrota() {
    console.log('🚗 Iniciando módulo de Controle de Frota...');
    
    if (!currentUser) {
        console.warn('⚠️ Usuário não logado. Aguardando autenticação...');
        setTimeout(iniciarFrota, 2000);
        return;
    }
    
    if (currentUser.tipo !== 'admin') {
        console.warn('⚠️ Usuário não é admin. O módulo de frota será iniciado apenas para visualização.');
    }
    
    iniciarListenerVeiculos();
    iniciarListenerManutencoes();
    iniciarListenerAbastecimentos();
    iniciarListenerMultas();
    iniciarListenerAgendamentos();
    console.log('✅ Módulo de Frota iniciado!');
}

// ==================== FUNÇÃO DE FALLBACK PARA COLABORADORES ====================
// Esta função é chamada quando o colaborador é atualizado no script.js
function atualizarSelectsAgendamentosCallback() {
    atualizarSelectsAgendamentos();
}

// ==================== EXPOR FUNÇÕES ====================

// Veículos
window.cadastrarVeiculo = cadastrarVeiculo;
window.toggleVeiculo = toggleVeiculo;
window.excluirVeiculo = excluirVeiculo;

// Manutenções
window.registrarManutencao = registrarManutencao;
window.excluirManutencao = excluirManutencao;

// Abastecimentos
window.registrarAbastecimento = registrarAbastecimento;
window.excluirAbastecimento = excluirAbastecimento;

// Multas
window.registrarMulta = registrarMulta;
window.atualizarStatusMulta = atualizarStatusMulta;
window.excluirMulta = excluirMulta;

// Agendamentos
window.registrarAgendamentoVeiculo = registrarAgendamentoVeiculo;
window.alterarStatusAgendamento = alterarStatusAgendamento;
window.excluirAgendamento = excluirAgendamento;
window.editarAgendamento = editarAgendamento;
window.salvarEdicaoAgendamento = salvarEdicaoAgendamento;
window.filtrarAgendamentos = filtrarAgendamentos;
window.limparFiltrosAgendamentos = limparFiltrosAgendamentos;
window.iniciarListenerAgendamentos = iniciarListenerAgendamentos;
window.verificarConflitoAgendamento = verificarConflitoAgendamento;
window.atualizarSelectsAgendamentos = atualizarSelectsAgendamentos;
window.atualizarSelectsAgendamentosCallback = atualizarSelectsAgendamentosCallback;

// Geral
window.trocarAbaFrota = trocarAbaFrota;
window.iniciarFrota = iniciarFrota;

console.log('✅ Módulo de Controle de Frota carregado!');